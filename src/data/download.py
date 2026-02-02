"""
Download Fitzpatrick17k and ISIC datasets for DermoAI.

Fitzpatrick17k: https://github.com/mattgroh/fitzpatrick17k
Dataset CSV: https://raw.githubusercontent.com/mattgroh/fitzpatrick17k/main/fitzpatrick17k.csv

ISIC Archive API: https://api.isic-archive.com/api/v2
Contains 549,590+ dermoscopic images, ~1,574 with FST V-VI labels.

Run from project root: python src/data/download.py
"""

import os
import sys
import requests
import pandas as pd
from pathlib import Path
from tqdm import tqdm
import json
import time

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Download config
DOWNLOAD_TIMEOUT = 60
DOWNLOAD_MAX_RETRIES = 3
DOWNLOAD_RETRY_BACKOFF = (2, 4, 8)  # seconds between retries


def _fetch_image(url: str, path: Path, timeout: int = DOWNLOAD_TIMEOUT, max_retries: int = DOWNLOAD_MAX_RETRIES) -> tuple[bool, str | None]:
    """
    Download image from url to path with retries and exponential backoff.
    Returns (success, error_message).
    """
    last_error = None
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, "wb") as f:
                f.write(response.content)
            return True, None
        except Exception as e:
            last_error = str(e)
            if attempt < max_retries - 1:
                time.sleep(DOWNLOAD_RETRY_BACKOFF[attempt])
    return False, last_error


def get_data_dirs():
    """Get standardized data directory paths."""
    data_root = PROJECT_ROOT / "data"
    return {
        'raw': data_root / "raw",
        'processed': data_root / "processed",
        'augmented': data_root / "augmented"
    }


def _image_exists(images_dir: Path, image_id: str) -> bool:
    """True if an image file for image_id exists (any common extension)."""
    image_id = str(image_id).strip()
    for ext in ("jpg", "jpeg", "png", "gif", "bmp", "webp", "JPG", "JPEG", "PNG"):
        if (images_dir / f"{image_id}.{ext}").exists():
            return True
    return False


def _image_ext_from_url(url: str) -> str:
    """Infer image extension from URL; default to jpg."""
    if "?" in url:
        return "jpg"
    url_path = url.split("/")[-1]
    if "." in url_path:
        ext = url_path.split(".")[-1].split("?")[0].lower()
        if ext in ("jpg", "jpeg", "png", "gif", "bmp", "webp"):
            return ext
    return "jpg"


def download_fitzpatrick17k(retry_failed: bool = False) -> None:
    """
    Download Fitzpatrick17k images and metadata.
    
    Dataset contains 16,577 clinical images labeled with Fitzpatrick Skin Types I-VI.
    We filter for FST V-VI (~1,000-1,500 images) relevant for African phenotypes.
    
    Citation: Groh et al. (2021), Evaluating Deep Neural Networks Trained on 
    Clinical Images in Dermatology with the Fitzpatrick 17k Dataset, CVPR 2021.
    
    If retry_failed=True, only retries URLs listed in failed_downloads.csv (no metadata re-download).
    """
    print("=" * 60)
    print("Downloading Fitzpatrick17k Dataset" + (" (retry failed only)" if retry_failed else ""))
    print("=" * 60)
    
    dirs = get_data_dirs()
    output_path = dirs["raw"] / "fitzpatrick17k"
    output_path.mkdir(parents=True, exist_ok=True)
    images_dir = output_path / "images"
    images_dir.mkdir(exist_ok=True)
    failed_downloads_path = output_path / "failed_downloads.csv"
    
    if retry_failed:
        if not failed_downloads_path.exists():
            print(f"✗ No {failed_downloads_path.name} found. Run full download first.")
            return
        retry_df = pd.read_csv(failed_downloads_path)
        todo = []
        for _, r in retry_df.iterrows():
            url = r["url"]
            if pd.isna(url) or not isinstance(url, str) or not str(url).startswith(("http://", "https://")):
                continue
            todo.append({
                "image_id": str(r["image_id"]),
                "url": url,
                "image_ext": _image_ext_from_url(url),
            })
        total_todo = len(todo)
        print(f"\n[Retry] Loaded {total_todo} failed URLs from {failed_downloads_path.name}")
        if total_todo == 0:
            print("Nothing to retry.")
            return
    else:
        # Full run: download metadata and build todo from filtered CSV
        metadata_url = "https://raw.githubusercontent.com/mattgroh/fitzpatrick17k/main/fitzpatrick17k.csv"
        metadata_path = output_path / "fitzpatrick17k.csv"
        print("\n[1/3] Downloading metadata CSV from GitHub...")
        try:
            response = requests.get(metadata_url, timeout=30)
            response.raise_for_status()
            with open(metadata_path, "wb") as f:
                f.write(response.content)
            print(f"✓ Metadata saved to: {metadata_path}")
            print(f"  File size: {len(response.content) / 1024 / 1024:.2f} MB")
        except Exception as e:
            print(f"✗ Error downloading metadata: {e}")
            return
        print("\n[2/3] Loading and filtering metadata...")
        df = pd.read_csv(metadata_path)
        print(f"Total images in dataset: {len(df)}")
        fst_counts = df["fitzpatrick_scale"].value_counts().sort_index()
        for fst, count in fst_counts.items():
            print(f"  FST {fst}: {count}")
        df_filtered = df[df["fitzpatrick_scale"].isin([5, 6])].copy()
        before_drop = len(df_filtered)
        df_filtered = df_filtered.dropna(subset=["url", "md5hash"])
        if len(df_filtered) < before_drop:
            print(f"  (Dropped {before_drop - len(df_filtered)} rows with missing url/md5hash)")
        print(f"\n✓ Filtered to FST V-VI: {len(df_filtered)} images")
        print(f"  - FST V: {len(df_filtered[df_filtered['fitzpatrick_scale'] == 5])}")
        print(f"  - FST VI: {len(df_filtered[df_filtered['fitzpatrick_scale'] == 6])}")
        filtered_metadata_path = output_path / "fitzpatrick17k_fst_v_vi.csv"
        df_filtered.to_csv(filtered_metadata_path, index=False)
        print(f"✓ Filtered metadata saved to: {filtered_metadata_path}")
        todo = []
        for _, row in df_filtered.iterrows():
            url, image_id = row["url"], row["md5hash"]
            if pd.isna(url) or pd.isna(image_id) or not isinstance(url, str):
                continue
            todo.append({
                "image_id": image_id,
                "url": url,
                "image_ext": _image_ext_from_url(url),
            })
        total_todo = len(todo)
        print("\n[3/3] Downloading FST V-VI images...")
    
    failed_downloads = []
    for item in tqdm(todo, desc="Downloading images"):
        image_id, url, image_ext = item["image_id"], item["url"], item["image_ext"]
        image_path = images_dir / f"{image_id}.{image_ext}"
        if image_path.exists():
            continue
        ok, err = _fetch_image(url, image_path)
        if not ok:
            failed_downloads.append({"image_id": image_id, "url": url, "error": err or "Unknown"})
        else:
            time.sleep(0.1)
    
    # Keep metadata in sync: only rows for which the image file exists
    filtered_metadata_path = output_path / "fitzpatrick17k_fst_v_vi.csv"
    if filtered_metadata_path.exists():
        df_meta = pd.read_csv(filtered_metadata_path)
        id_col = "md5hash"
        if id_col in df_meta.columns:
            before = len(df_meta)
            df_meta["_has_image"] = df_meta[id_col].astype(str).map(
                lambda x: _image_exists(images_dir, x)
            )
            df_ok = df_meta[df_meta["_has_image"]].drop(columns=["_has_image"])
            df_ok.to_csv(filtered_metadata_path, index=False)
            dropped = before - len(df_ok)
            if dropped > 0:
                print(f"\n✓ Metadata updated: kept {len(df_ok)} rows (dropped {dropped} with missing image)")
    
    # Report: for retry_failed we don't overwrite full report; we append/update failed list only
    if retry_failed:
        still_failed = output_path / "failed_downloads.csv"
        if failed_downloads:
            pd.DataFrame(failed_downloads).to_csv(still_failed, index=False)
            print(f"\n⚠ After retry: {len(failed_downloads)} still failed (saved to {still_failed.name})")
        else:
            if still_failed.exists():
                still_failed.unlink()
            print(f"\n✓ All {total_todo} previously failed images downloaded.")
    else:
        report = {
            "total_images": total_todo,
            "downloaded": total_todo - len(failed_downloads),
            "failed": len(failed_downloads),
            "output_dir": str(images_dir.relative_to(PROJECT_ROOT)),
        }
        report_path = output_path / "download_report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        if failed_downloads:
            pd.DataFrame(failed_downloads).to_csv(output_path / "failed_downloads.csv", index=False)
            print(f"\n⚠ {len(failed_downloads)} images failed to download")
            print(f"  Retry later: python src/data/download.py --dataset fitzpatrick17k --retry-failed")
    
    print(f"\n{'='*60}")
    print("✓ Fitzpatrick17k download complete!")
    print(f"  Images: {images_dir.relative_to(PROJECT_ROOT)}")
    if not retry_failed:
        print(f"  Metadata: {output_path / 'fitzpatrick17k_fst_v_vi.csv'}")
    print(f"{'='*60}\n")


def download_isic() -> None:
    """
    Download ISIC images with FST V-VI labels using ISIC CLI.
    
    Uses official isic-cli tool for programmatic access.
    Total dataset: 549,590+ images, FST V-VI subset: ~1,574 images (0.29%).
    
    Citation: Combalia, M., et al. (2019). BCN20000: Dermoscopic Lesions in the Wild.
    """
    print("=" * 60)
    print("Downloading ISIC Dataset (FST V-VI)")
    print("=" * 60)
    
    dirs = get_data_dirs()
    output_path = dirs['raw'] / "isic"
    output_path.mkdir(parents=True, exist_ok=True)
    images_dir = output_path / "images"
    images_dir.mkdir(exist_ok=True)
    
    # Check if isic-cli is installed
    try:
        import subprocess
        result = subprocess.run(['isic', '--version'], capture_output=True, text=True)
        isic_installed = result.returncode == 0
    except FileNotFoundError:
        isic_installed = False
    
    if not isic_installed:
        print("\n⚠ ISIC CLI not installed")
        print("\nTo download ISIC programmatically, install the official ISIC CLI:")
        print("=" * 60)
        print("pip install isic-cli")
        print("\nThen authenticate:")
        print("isic login")
        print("\nThen run this script again.")
        print("=" * 60)
        print("\nAlternatively, manual download:")
        print("1. Visit: https://www.isic-archive.com/")
        print("2. Filter by Fitzpatrick Skin Type V and VI")
        print("3. Download ZIP (~500MB)")
        print(f"4. Extract to: {images_dir.relative_to(PROJECT_ROOT)}/")
        return
    
    print("\n✓ ISIC CLI is installed")
    print("\nAttempting to download FST V-VI images...")
    print("This will use the ISIC CLI to search and download images.")
    print("You may need to authenticate if you haven't already (run: isic login)")
    
    try:
        import subprocess
        
        # Search for FST V images
        print("\n[1/3] Searching for FST V images...")
        search_cmd_v = [
            'isic', 'image', 'search',
            '--fitzpatrick-skin-type', '5',
            '--limit', '1000'
        ]
        
        result_v = subprocess.run(search_cmd_v, capture_output=True, text=True)
        
        # Search for FST VI images
        print("[2/3] Searching for FST VI images...")
        search_cmd_vi = [
            'isic', 'image', 'search',
            '--fitzpatrick-skin-type', '6',
            '--limit', '1000'
        ]
        
        result_vi = subprocess.run(search_cmd_vi, capture_output=True, text=True)
        
        # Download images
        print(f"\n[3/3] Downloading images to {images_dir.relative_to(PROJECT_ROOT)}...")
        
        download_cmd = [
            'isic', 'image', 'download',
            '--fitzpatrick-skin-type', '5', '6',
            '--output-dir', str(images_dir)
        ]
        
        print(f"Running: {' '.join(download_cmd)}")
        result = subprocess.run(download_cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("\n✓ ISIC download successful!")
            print(result.stdout)
            
            # Count downloaded images
            image_count = len(list(images_dir.glob('*.jpg'))) + len(list(images_dir.glob('*.png')))
            print(f"\n✓ Downloaded {image_count} images")
            
        else:
            print("\n⚠ Download encountered issues:")
            print(result.stderr)
            print("\nYou may need to:")
            print("1. Authenticate: isic login")
            print("2. Check your internet connection")
            print("3. Verify ISIC CLI is up to date: pip install --upgrade isic-cli")
            
    except Exception as e:
        print(f"\n✗ Error using ISIC CLI: {e}")
        print("\nFallback to manual download:")
        print("1. Visit: https://www.isic-archive.com/")
        print("2. Filter by Fitzpatrick Skin Type V and VI")
        print(f"3. Download and extract to: {images_dir.relative_to(PROJECT_ROOT)}/")
    
    print(f"\n{'='*60}")
    print(f"ISIC images location: {images_dir.relative_to(PROJECT_ROOT)}")
    print(f"{'='*60}\n")


def download_all() -> None:
    """Download both Fitzpatrick17k and ISIC datasets."""
    print("\n" + "="*60)
    print("DermoAI Dataset Download Script")
    print("Downloading FST V-VI Images for Rwanda")
    print("="*60 + "\n")
    
    dirs = get_data_dirs()
    print("Project Structure:")
    print(f"  Project root: {PROJECT_ROOT}")
    print(f"  Raw data: {dirs['raw'].relative_to(PROJECT_ROOT)}")
    print(f"  Processed: {dirs['processed'].relative_to(PROJECT_ROOT)}")
    print(f"  Augmented: {dirs['augmented'].relative_to(PROJECT_ROOT)}")
    print()
    
    # Download both datasets
    download_fitzpatrick17k()
    download_isic()
    
    print("\n" + "="*60)
    print("DOWNLOAD SUMMARY")
    print("="*60)
    print(f"✓ Fitzpatrick17k: Fully downloaded")
    print(f"✓ ISIC: Check status above")
    print(f"\nIf ISIC download failed:")
    print(f"  1. Install ISIC CLI: pip install isic-cli")
    print(f"  2. Authenticate: isic login")
    print(f"  3. Run: python src/data/download.py --dataset isic")
    print(f"\nNext step: python src/data/filter.py")
    print("="*60 + "\n")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Download dermatology datasets for DermoAI")
    parser.add_argument("--dataset", type=str, choices=["fitzpatrick17k", "isic", "all"],
                        default="all", help="Which dataset to download (default: all)")
    parser.add_argument("--retry-failed", action="store_true",
                        help="Only retry URLs from failed_downloads.csv (Fitzpatrick17k)")
    args = parser.parse_args()
    
    if args.dataset == "fitzpatrick17k":
        download_fitzpatrick17k(retry_failed=args.retry_failed)
    elif args.dataset == "isic":
        download_isic()
    else:
        download_all()
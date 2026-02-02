"""
Preprocessing pipeline for dermatology images and metadata.
"""


def preprocess_raw_to_processed(raw_dir: str, processed_dir: str) -> None:
    """Filter and prepare raw data into processed splits (train/val/test)."""
    raise NotImplementedError("Implement preprocessing logic.")


def build_quality_report(processed_dir: str, report_path: str) -> None:
    """Generate quality_report.json from processed data."""
    raise NotImplementedError("Implement quality report logic.")

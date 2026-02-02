"""
Filtering utilities (e.g. FST V–VI only, QC, label filters).
"""


def filter_fitzpatrick_v_vi(metadata_path: str, output_path: str) -> None:
    """Filter metadata to Fitzpatrick scale V–VI only."""
    raise NotImplementedError("Implement FST V–VI filtering.")


def filter_by_quality(metadata_path: str, output_path: str, qc_ok_only: bool = True) -> None:
    """Filter rows by QC flag and optionally other criteria."""
    raise NotImplementedError("Implement quality filtering.")

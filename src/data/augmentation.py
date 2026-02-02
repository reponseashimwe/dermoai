"""
Data augmentation for training (e.g. rotation, flip, color jitter).
"""


def augment_training_data(
    input_dir: str,
    output_dir: str,
    config: dict | None = None,
) -> None:
    """Apply augmentations and write to output_dir (e.g. train_augmented)."""
    raise NotImplementedError("Implement augmentation logic.")

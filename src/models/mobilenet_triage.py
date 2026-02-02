"""
MobileNet-based triage model for dermatology images.
"""


def build_model(input_shape: tuple[int, ...], num_classes: int):
    """Build and return the triage model."""
    raise NotImplementedError("Implement model definition.")


def train_model(model, train_data, val_data, checkpoint_dir: str, **kwargs):
    """Train the model and save checkpoints to checkpoint_dir."""
    raise NotImplementedError("Implement training loop.")

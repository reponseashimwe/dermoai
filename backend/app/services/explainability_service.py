"""
Explainability service for DermoAI model predictions.

Implements GradCAM (Gradient-weighted Class Activation Mapping) for visual
explanations of CNN predictions. Shows which regions of the input image
were most important for the model's decision.

Reference: Selvaraju et al. (2017) "Grad-CAM: Visual Explanations from Deep
Networks via Gradient-based Localization"
"""

import base64
import io
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

# Lazy import keras to avoid loading at module level
_keras = None
_tf = None


def _ensure_imports():
    """Lazy load TensorFlow and Keras."""
    global _keras, _tf
    if _keras is None:
        import keras
        import tensorflow as tf
        _keras = keras
        _tf = tf


def generate_gradcam(
    model,
    image: Image.Image,
    class_idx: int,
    layer_name: str = "top_conv"
) -> tuple[np.ndarray, dict]:
    """
    Generate GradCAM heatmap for a given prediction.

    Args:
        model: Loaded Keras model.
        image: PIL Image (224x224x3 RGB).
        class_idx: Index of the predicted class to explain.
        layer_name: Name of the last convolutional layer.
                   For EfficientNetB0, use "top_conv" (last conv layer).

    Returns:
        Tuple of:
        - heatmap (np.ndarray): GradCAM heatmap overlaid on original image
        - metrics (dict): Saliency metrics including peak location, intensity
    """
    _ensure_imports()

    # Preprocess image — must match training: efficientnet.preprocess_input maps
    # [0, 255] → [-1, 1]. Keep original uint8 separately for the overlay blend.
    from keras.applications.efficientnet import preprocess_input as eff_preprocess
    img_orig = np.array(image.resize((224, 224)))           # uint8 [0, 255] for overlay
    img_array = eff_preprocess(img_orig.astype(np.float32)) # [-1, 1] for model
    img_array = np.expand_dims(img_array, axis=0)

    # KERAS 3 FIX: Build grad model from backbone to avoid KeyError with nested tensors
    # This is the same workaround used in the notebook (06_gradcam_visualization.ipynb)
    # We split the model into three parts to prevent Keras 3 from accessing nested dict outputs

    # Find the target layer (conv layer for GradCAM)
    target_layer = None
    try:
        target_layer = model.get_layer(layer_name)
    except (ValueError, KeyError):
        # If layer_name not found, try finding last conv layer automatically
        # Search through all layers including nested layers (e.g., inside EfficientNet)
        for layer in reversed(model.layers):
            if 'conv' in layer.name.lower():
                target_layer = layer
                break
            # If it's a nested model (like efficientnetb0), search inside it
            if hasattr(layer, 'layers'):
                for sublayer in reversed(layer.layers):
                    if 'conv' in sublayer.name.lower():
                        target_layer = sublayer
                        break
                if target_layer:
                    break

        if target_layer is None:
            raise ValueError(
                f"Could not find layer '{layer_name}' or any conv layer in model. "
                f"Available layers: {[l.name for l in model.layers[:5]]}"
            )

    # Find the backbone (submodel containing the conv layers) and its index
    backbone = None
    backbone_idx = -1
    for i, layer in enumerate(model.layers):
        if hasattr(layer, 'layers') and layer.layers:
            backbone = layer
            backbone_idx = i
            break

    if backbone is None:
        raise ValueError(
            "No backbone submodel found (e.g. efficientnetb0). "
            "Model structure is unexpected."
        )

    # Keras 3 fixes:
    # 1. backbone.input/output may be lists — use [0] to get the actual tensor.
    # 2. Build backbone-only grad model; call head layers manually to avoid
    #    "inputs not connected to outputs" when building Model(backbone.output, model.output).
    # 3. Watch both x (before) and conv_outputs (after) for reliable gradient flow.
    backbone_inp = backbone.input[0]  if isinstance(backbone.input,  list) else backbone.input
    backbone_out_tensor = backbone.output[0] if isinstance(backbone.output, list) else backbone.output

    try:
        backbone_grad_model = _keras.models.Model(
            inputs=backbone_inp,
            outputs=[target_layer.output, backbone_out_tensor],
        )
    except Exception as e:
        raise ValueError(f"Failed to build backbone grad model: {e}. Check model architecture.")

    # Layers before the backbone (skip InputLayer)
    pre_backbone = [
        l for i, l in enumerate(model.layers)
        if i < backbone_idx
        and "inputlayer" not in l.__class__.__name__.lower()
        and "input_layer" not in l.__class__.__name__.lower()
    ]
    # Head layers after the backbone (GAP, Dense, Dropout, …)
    post_backbone = [l for i, l in enumerate(model.layers) if i > backbone_idx]

    # Compute gradients of the predicted class w.r.t. the conv feature maps
    with _tf.GradientTape() as tape:
        x = img_array
        for l in pre_backbone:
            x = l(x, training=False)

        tape.watch(x)                                           # watch before backbone
        conv_outputs, backbone_out = backbone_grad_model(x, training=False)
        tape.watch(conv_outputs)                                # watch intermediate too

        # Apply head layers manually (avoids Keras 3 graph-connection error)
        y = backbone_out
        for l in post_backbone:
            y = l(y, training=False)

        class_output = y[:, class_idx]

    # Gradient of the class output with respect to the conv layer output
    grads = tape.gradient(class_output, conv_outputs)
    if grads is None:
        raise ValueError(
            "Gradients are None. Ensure the conv layer is on the path to model output."
        )

    # Global average pooling of the gradients (importance weights)
    # Shape: (batch, height, width, channels) -> (batch, channels)
    pooled_grads = _tf.reduce_mean(grads, axis=(0, 1, 2))

    # Weight the feature maps by the importance and sum across channels
    conv_outputs = conv_outputs[0]  # Remove batch dimension
    pooled_grads = pooled_grads.numpy()
    conv_outputs = conv_outputs.numpy()

    for i in range(len(pooled_grads)):
        conv_outputs[:, :, i] *= pooled_grads[i]

    # Create heatmap by averaging across all channels
    heatmap = np.mean(conv_outputs, axis=-1)

    # ReLU: Only keep positive activations (regions that increase class score)
    heatmap = np.maximum(heatmap, 0)

    # Normalize heatmap to [0, 1]
    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()

    # Resize heatmap to match input image size (224x224)
    heatmap_resized = cv2.resize(heatmap, (224, 224))

    # Convert heatmap to RGB colormap (jet colormap: blue=low, red=high)
    heatmap_colored = cv2.applyColorMap(
        np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET
    )
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    # Superimpose heatmap on original image (alpha blending)
    superimposed_img = heatmap_colored * 0.4 + img_orig * 0.6
    superimposed_img = np.uint8(superimposed_img)

    # Calculate saliency metrics
    peak_row, peak_col = np.unravel_index(
        heatmap_resized.argmax(), heatmap_resized.shape
    )
    metrics = {
        "peak_activation_location": {
            "x": int(peak_col),
            "y": int(peak_row),
            "normalized_x": round(peak_col / 224, 4),
            "normalized_y": round(peak_row / 224, 4),
        },
        "peak_intensity": round(float(heatmap_resized.max()), 4),
        "mean_activation": round(float(heatmap_resized.mean()), 4),
        "activation_area": round(
            float(np.sum(heatmap_resized > 0.5) / (224 * 224)), 4
        ),  # Fraction of image with high activation
    }

    return superimposed_img, metrics


def gradcam_to_base64(gradcam_image: np.ndarray) -> str:
    """
    Convert GradCAM numpy array to base64-encoded PNG string.

    Args:
        gradcam_image: GradCAM overlay image as numpy array.

    Returns:
        Base64-encoded PNG string (data URI format).
    """
    pil_image = Image.fromarray(gradcam_image)
    buffer = io.BytesIO()
    pil_image.save(buffer, format="PNG")
    buffer.seek(0)
    base64_str = base64.b64encode(buffer.read()).decode("utf-8")
    return f"data:image/png;base64,{base64_str}"


def save_gradcam_to_file(
    gradcam_image: np.ndarray,
    output_path: Path | str
) -> None:
    """
    Save GradCAM image to file.

    Args:
        gradcam_image: GradCAM overlay image as numpy array.
        output_path: Path to save the image.
    """
    pil_image = Image.fromarray(gradcam_image)
    pil_image.save(output_path)


def generate_gradcam_for_prediction(
    model,
    image_url: str,
    class_idx: int,
    layer_name: str = "top_conv"
) -> dict:
    """
    Generate GradCAM for an image URL and return complete explanation.

    Args:
        model: Loaded Keras model.
        image_url: Path to image file or HTTP(S) URL.
        class_idx: Index of the predicted class to explain.
        layer_name: Name of the last convolutional layer.

    Returns:
        Dict with gradcam_base64, gradcam_metrics, class_idx.
    """
    # Load image (same as ml_service.py)
    from app.services.ml_service import _load_image

    image = _load_image(image_url)
    gradcam_image, metrics = generate_gradcam(model, image, class_idx, layer_name)
    gradcam_base64 = gradcam_to_base64(gradcam_image)

    return {
        "gradcam_base64": gradcam_base64,
        "gradcam_metrics": metrics,
        "class_idx": class_idx,
    }

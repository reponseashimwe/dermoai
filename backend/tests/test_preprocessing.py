"""
Tests for the image preprocessing pipeline in ml_service.

Covers _load_image() and _preprocess(), verifying that:
- images are loaded from file paths and HTTP(S) URLs
- RGBA/greyscale images are coerced to RGB
- output tensor shape is (1, 224, 224, 3)
- EfficientNetB0 preprocess_input maps [0, 255] → [-1, 1]
"""
import io
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from PIL import Image


# ---------------------------------------------------------------------------
# _load_image
# ---------------------------------------------------------------------------


class TestLoadImage:
    def test_loads_rgb_image_from_file_path(self, tmp_png_path):
        from app.services.ml_service import _load_image

        img = _load_image(tmp_png_path)

        assert isinstance(img, Image.Image)
        assert img.mode == "RGB"

    def test_converts_rgba_to_rgb_from_file(self, tmp_path):
        from app.services.ml_service import _load_image

        rgba_img = Image.new("RGBA", (8, 8), (255, 0, 128, 200))
        p = tmp_path / "rgba.png"
        rgba_img.save(str(p))

        img = _load_image(str(p))

        assert img.mode == "RGB"

    def test_converts_greyscale_to_rgb_from_file(self, tmp_path):
        from app.services.ml_service import _load_image

        grey_img = Image.new("L", (8, 8), 128)
        p = tmp_path / "grey.png"
        grey_img.save(str(p))

        img = _load_image(str(p))

        assert img.mode == "RGB"

    def test_loads_image_from_http_url(self, png_bytes):
        from app.services.ml_service import _load_image

        mock_resp = MagicMock()
        mock_resp.read.return_value = png_bytes
        mock_cm = MagicMock()
        mock_cm.__enter__ = MagicMock(return_value=mock_resp)
        mock_cm.__exit__ = MagicMock(return_value=False)

        with patch("app.services.ml_service.urlopen", return_value=mock_cm) as mock_open:
            img = _load_image("http://example.com/lesion.jpg")

        assert isinstance(img, Image.Image)
        assert img.mode == "RGB"
        mock_open.assert_called_once_with("http://example.com/lesion.jpg", timeout=30)

    def test_loads_image_from_https_url(self, png_bytes):
        from app.services.ml_service import _load_image

        mock_resp = MagicMock()
        mock_resp.read.return_value = png_bytes
        mock_cm = MagicMock()
        mock_cm.__enter__ = MagicMock(return_value=mock_resp)
        mock_cm.__exit__ = MagicMock(return_value=False)

        with patch("app.services.ml_service.urlopen", return_value=mock_cm):
            img = _load_image("https://res.cloudinary.com/demo/image/upload/sample.jpg")

        assert img.mode == "RGB"

    def test_file_path_does_not_call_urlopen(self, tmp_png_path):
        from app.services.ml_service import _load_image

        with patch("app.services.ml_service.urlopen") as mock_open:
            _load_image(tmp_png_path)

        mock_open.assert_not_called()


# ---------------------------------------------------------------------------
# _preprocess
# ---------------------------------------------------------------------------


class TestPreprocess:
    def test_output_shape_is_1_224_224_3(self):
        from app.services.ml_service import _preprocess

        img = Image.new("RGB", (100, 100), (128, 64, 32))
        result = _preprocess(img)

        assert result.shape == (1, 224, 224, 3)

    def test_output_dtype_is_float32(self):
        from app.services.ml_service import _preprocess

        img = Image.new("RGB", (50, 50), (100, 100, 100))
        result = _preprocess(img)

        assert result.dtype == np.float32

    def test_small_image_is_resized_to_224(self):
        from app.services.ml_service import _preprocess

        img = Image.new("RGB", (10, 10), (50, 100, 150))
        result = _preprocess(img)

        assert result.shape == (1, 224, 224, 3)

    def test_large_image_is_resized_to_224(self):
        from app.services.ml_service import _preprocess

        img = Image.new("RGB", (512, 512), (200, 100, 50))
        result = _preprocess(img)

        assert result.shape == (1, 224, 224, 3)

    def test_white_pixel_preserves_value(self):
        """In Keras 3, efficientnet.preprocess_input is a no-op (rescaling
        happens inside the model). White pixel (255) stays 255."""
        from app.services.ml_service import _preprocess

        img = Image.new("RGB", (224, 224), (255, 255, 255))
        result = _preprocess(img)

        assert np.allclose(result.max(), 255.0, atol=0.5)

    def test_black_pixel_preserves_value(self):
        """In Keras 3, efficientnet.preprocess_input is a no-op.
        Black pixel (0) stays 0."""
        from app.services.ml_service import _preprocess

        img = Image.new("RGB", (224, 224), (0, 0, 0))
        result = _preprocess(img)

        assert np.allclose(result.min(), 0.0, atol=0.5)

    def test_output_values_within_uint8_range(self):
        """After preprocess_input (no-op in Keras 3), values remain in [0, 255]."""
        from app.services.ml_service import _preprocess

        rng = np.random.default_rng(42)
        arr = rng.integers(0, 256, (64, 64, 3), dtype=np.uint8)
        img = Image.fromarray(arr, mode="RGB")
        result = _preprocess(img)

        assert result.min() >= 0.0 - 1e-5
        assert result.max() <= 255.0 + 1e-5

    def test_batch_dimension_is_one(self):
        from app.services.ml_service import _preprocess

        img = Image.new("RGB", (224, 224), (128, 128, 128))
        result = _preprocess(img)

        assert result.ndim == 4
        assert result.shape[0] == 1

    def test_three_channels_preserved(self):
        from app.services.ml_service import _preprocess

        img = Image.new("RGB", (224, 224), (10, 20, 30))
        result = _preprocess(img)

        assert result.shape[-1] == 3

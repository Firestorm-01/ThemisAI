import logging
from PIL import Image
import pytesseract
import io
import re

logger = logging.getLogger(__name__)


def load_image(file_bytes: bytes) -> Image.Image:
    """Load image from bytes."""
    return Image.open(io.BytesIO(file_bytes)).convert("RGB")


def extract_text_from_image(image: Image.Image) -> str:
    """OCR text from image using pytesseract (optional - graceful fallback)."""
    try:
        text = pytesseract.image_to_string(image, lang="eng")
        return _clean(text)
    except Exception as e:
        logger.warning(f"OCR failed (pytesseract not available): {e}")
        return ""


def _clean(text: str) -> str:
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def image_to_metadata(image: Image.Image, file_name: str, ocr_text: str) -> dict:
    """Build metadata payload for a processed image."""
    return {
        "file_name": file_name,
        "source_type": "image",
        "ocr_text": ocr_text[:500] if ocr_text else "",
        "width": image.width,
        "height": image.height,
        "title": f"Image: {file_name}",
        "text": ocr_text[:500] if ocr_text else f"Legal document image: {file_name}",
    }

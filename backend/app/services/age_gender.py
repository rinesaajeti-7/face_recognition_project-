"""Age and gender analysis - Simple version without DeepFace dependency"""
import logging

logger = logging.getLogger(__name__)

def analyze_age_gender(img_bytes=None, image_path=None):
    """
    Analyze age and gender from image.
    Returns default values to avoid DeepFace dependency.
    """
    return "Unknown", 0, None

def get_age_gender_from_image(image):
    """Alternative version that takes numpy array"""
    return "Unknown", 0

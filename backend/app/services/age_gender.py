import tempfile
import os
import traceback
from deepface import DeepFace

def analyze_age_gender(img_bytes=None, image_path=None):
    """
    Analizon moshën dhe gjininë nga bytes ose nga rruga e skedarit.
    Kthen (gender, age, error_message)
    """
    temp_file = None
    try:
        if img_bytes is not None:
            temp_file = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
            temp_file.write(img_bytes)
            temp_file.close()
            image_path = temp_file.name
            print(f"[DEBUG] Temp file: {image_path}, size: {len(img_bytes)} bytes")
        
        if not image_path:
            return None, None, "No image provided"

        result = DeepFace.analyze(
            img_path=image_path,
            actions=['age', 'gender'],
            enforce_detection=False
        )
        if isinstance(result, list):
            result = result[0]
        gender = result.get('dominant_gender', result.get('gender', 'Unknown'))
        age = int(result.get('age', 0))
        print(f"[DEBUG] DeepFace OK: gender={gender}, age={age}")
        return gender, age, None
    except Exception as e:
        print(f"[ERROR] DeepFace failed:")
        traceback.print_exc()
        return None, None, str(e)
    finally:
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
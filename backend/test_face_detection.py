import requests
import sys

# Lexo një imazh nga argumenti ose përdor një foto testuese
if len(sys.argv) < 2:
    print("Përdorimi: python test_face_detection.py <foto.jpg>")
    sys.exit(1)

with open(sys.argv[1], "rb") as f:
    image_bytes = f.read()

from app.services.ai_pipeline import process_image
result = process_image(image_bytes)
print(result)
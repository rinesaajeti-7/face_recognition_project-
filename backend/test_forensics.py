import cv2
import numpy as np
from PIL import Image
import requests
import json

# Testo me një foto të vërtetë
image_path = "data/gallery/rinesa_rinesa.jpg"

# Ngarko imazhin
img = cv2.imread(image_path)
if img is None:
    print(f"❌ Could not load image from {image_path}")
    exit()

print(f"✅ Image loaded: {image_path}")
print(f"   Dimensions: {img.shape}")
print(f"   File size: {len(open(image_path, 'rb').read()) / 1024:.2f} KB")

# Simulo analizën ELA
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
print(f"   Noise level (std): {np.std(gray):.2f}")

# Testo me një imazh të manipuluar (krijo një version me zhurmë)
noisy = img + np.random.normal(0, 25, img.shape).astype(np.uint8)
cv2.imwrite("/tmp/noisy_test.jpg", noisy)

# Analizo manipulimin
from app.routers.photo_forensics import detect_jpeg_manipulation
findings, is_manip, conf = detect_jpeg_manipulation("/tmp/noisy_test.jpg")
print(f"\n🔍 Test with noisy image:")
print(f"   Is manipulated: {is_manip}")
print(f"   Confidence: {conf}")
print(f"   Findings: {findings}")


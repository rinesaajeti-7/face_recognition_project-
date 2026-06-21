# backend/scripts/download_dncnn.py
import os
import urllib.request
import sys

def download_dncnn_model():
    """Shkarko modelin e paratrajnuar DnCNN"""
    
    # Krijo direktorinë nëse nuk ekziston
    os.makedirs("models/dncnn", exist_ok=True)
    
    model_url = "https://github.com/cszn/KAIR/releases/download/v1.0/dncnn_color_25.pth"
    model_path = "models/dncnn/dncnn_color_25.pth"
    
    if os.path.exists(model_path):
        print(f"✅ Model already exists at {model_path}")
        return
    
    print(f"📥 Downloading DnCNN model from {model_url}...")
    
    try:
        urllib.request.urlretrieve(model_url, model_path)
        print(f"✅ Model downloaded to {model_path}")
    except Exception as e:
        print(f"❌ Download failed: {e}")
        print("You can manually download from: https://github.com/cszn/KAIR/releases")

if __name__ == "__main__":
    download_dncnn_model()
    
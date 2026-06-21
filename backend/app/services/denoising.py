# backend/app/services/denoising.py (VERSIONI I PËRDITËSUAR)
import torch
import torch.nn as nn
import numpy as np
import cv2
from PIL import Image
import io
import os

class DnCNN(nn.Module):
    """Denoising Convolutional Neural Network"""
    def __init__(self, depth=17, n_channels=64, image_channels=3):
        super(DnCNN, self).__init__()
        
        layers = []
        # Shtresa e parë: Conv + ReLU (pa BatchNorm)
        layers.append(nn.Conv2d(image_channels, n_channels, kernel_size=3, padding=1))
        layers.append(nn.ReLU(inplace=True))
        
        # Shtresat e mesme: Conv + BatchNorm + ReLU
        for _ in range(depth - 2):
            layers.append(nn.Conv2d(n_channels, n_channels, kernel_size=3, padding=1))
            layers.append(nn.BatchNorm2d(n_channels))
            layers.append(nn.ReLU(inplace=True))
        
        # Shtresa e fundit: Conv (pa ReLU)
        layers.append(nn.Conv2d(n_channels, image_channels, kernel_size=3, padding=1))
        
        self.dncnn = nn.Sequential(*layers)
    
    def forward(self, x):
        return x - self.dncnn(x)  # Residual learning

class DnCNNDenoiser:
    def __init__(self, model_path="models/dncnn/dncnn_color_25.pth"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.model_path = model_path
        self._load_model()
    
    def _load_model(self):
        """Ngarko modelin DnCNN në mënyrë lazy"""
        if os.path.exists(self.model_path):
            try:
                self.model = DnCNN().to(self.device)
                state_dict = torch.load(self.model_path, map_location=self.device)
                self.model.load_state_dict(state_dict, strict=False)
                self.model.eval()
                print(f"✅ DnCNN model loaded from {self.model_path}")
            except Exception as e:
                print(f"⚠️ Could not load DnCNN model: {e}")
                self.model = None
        else:
            print(f"⚠️ DnCNN weights not found at {self.model_path}")
            self.model = None
    
    def denoise_image(self, image_bytes: bytes) -> bytes:
        """Denoison imazhin duke përdorur DnCNN ose fallback"""
        if self.model is None:
            # Fallback to OpenCV denoising
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            denoised = cv2.fastNlMeansDenoisingColored(img, None, h=10, hColor=10)
            _, buffer = cv2.imencode('.jpg', denoised)
            return buffer.tobytes()
        
        # Konverto bytes në tensor
        pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Rezize në madhësi të përshtatshme për modelin (shumëfish i 4)
        w, h = pil_img.size
        new_w = (w // 4) * 4
        new_h = (h // 4) * 4
        if new_w != w or new_h != h:
            pil_img = pil_img.resize((new_w, new_h), Image.LANCZOS)
        
        # Konverto në tensor
        img_np = np.array(pil_img).astype(np.float32) / 255.0
        img_tensor = torch.from_numpy(img_np).permute(2, 0, 1).unsqueeze(0).to(self.device)
        
        # Denoise
        with torch.no_grad():
            denoised_tensor = self.model(img_tensor)
        
        # Konverto tensor në bytes
        denoised_np = denoised_tensor.squeeze(0).cpu().permute(1, 2, 0).numpy()
        denoised_np = np.clip(denoised_np * 255.0, 0, 255).astype(np.uint8)
        
        # Konverto në bytes
        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(denoised_np, cv2.COLOR_RGB2BGR))
        return buffer.tobytes()

# Singleton instance
dncnn_denoiser = DnCNNDenoiser()

def denoise_image(image_bytes: bytes) -> bytes:
    """Funksion helper për denoising"""
    return dncnn_denoiser.denoise_image(image_bytes)

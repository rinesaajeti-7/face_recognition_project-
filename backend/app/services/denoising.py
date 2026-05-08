import torch
import torch.nn as nn
import numpy as np
import cv2
from PIL import Image
import io

class DnCNN(nn.Module):
    def __init__(self, depth=17, n_channels=64, image_channels=3):
        super(DnCNN, self).__init__()
        layers = []
        layers.append(nn.Conv2d(image_channels, n_channels, 3, padding=1))
        layers.append(nn.ReLU(inplace=True))
        for _ in range(depth - 2):
            layers.append(nn.Conv2d(n_channels, n_channels, 3, padding=1))
            layers.append(nn.BatchNorm2d(n_channels))
            layers.append(nn.ReLU(inplace=True))
        layers.append(nn.Conv2d(n_channels, image_channels, 3, padding=1))
        self.dncnn = nn.Sequential(*layers)

    def forward(self, x):
        return self.dncnn(x)

def load_dncnn_model(weights_path="models/dncnn/dncnn_color_25.pth"):
    model = DnCNN()
    state_dict = torch.load(weights_path, map_location='cpu')
    # Përputh çelësat (modeli i gatshëm mund të ketë emra të ndryshëm)
    model.load_state_dict(state_dict, strict=False)
    model.eval()
    return model

model = None

def denoise_image(image_bytes):
    global model
    if model is None:
        model = load_dncnn_model()
    # Ngarko imazhin
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_np = np.array(img).astype(np.float32) / 255.0
    img_tensor = torch.from_numpy(img_np).permute(2,0,1).unsqueeze(0)
    with torch.no_grad():
        denoised = model(img_tensor).squeeze().permute(1,2,0).numpy()
    denoised = np.clip(denoised * 255.0, 0, 255).astype(np.uint8)
    # Kthe në bytes
    _, buffer = cv2.imencode('.jpg', cv2.cvtColor(denoised, cv2.COLOR_RGB2BGR))
    return buffer.tobytes()
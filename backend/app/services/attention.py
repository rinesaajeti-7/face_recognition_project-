import torch
import torch.nn as nn
import numpy as np

class SpatialAttention(nn.Module):
    def __init__(self, kernel_size=7):
        super(SpatialAttention, self).__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=kernel_size//2)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        attention = torch.cat([avg_out, max_out], dim=1)
        attention = self.sigmoid(self.conv(attention))
        return x * attention

def apply_attention_to_embedding(embedding_array, face_image_np):
    """
    embedding_array: numpy (512,) - embedding nga ArcFace
    face_image_np: numpy (H,W,3) - imazhi i fytyrës (tashmë i prerë)
    Kthen embedding të ponderuar me attention (mund të ripërdoret ose të lihet si është)
    """
    # Ky është një stub – në praktikë do të modifikonte embedding
    # Për thjeshtësi, kthejmë të njëjtin embedding.
    # Në një implementim të plotë, do të aplikonim attention në feature map para global pooling.
    return embedding_array
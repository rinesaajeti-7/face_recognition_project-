import cv2
import numpy as np
import random

def apply_sunglasses(image_rgb):
    h, w, _ = image_rgb.shape
    y_start = int(h * 0.3)
    y_end = int(h * 0.5)
    x_start = int(w * 0.2)
    x_end = int(w * 0.8)
    image_rgb[y_start:y_end, x_start:x_end] = (0, 0, 0)
    return image_rgb

def apply_mask(image_rgb):
    h, w, _ = image_rgb.shape
    y_start = int(h * 0.6)
    y_end = int(h * 0.8)
    x_start = int(w * 0.25)
    x_end = int(w * 0.75)
    image_rgb[y_start:y_end, x_start:x_end] = (100, 100, 100)
    return image_rgb

def apply_hand_occlusion(image_rgb):
    h, w, _ = image_rgb.shape
    cx = random.randint(int(w*0.3), int(w*0.7))
    cy = random.randint(int(h*0.3), int(h*0.7))
    radius = int(min(w, h) * 0.15)
    cv2.circle(image_rgb, (cx, cy), radius, (50, 50, 50), -1)
    return image_rgb

def add_gaussian_noise(image_rgb, sigma=25):
    noise = np.random.normal(0, sigma, image_rgb.shape).astype(np.uint8)
    noisy = cv2.add(image_rgb, noise)
    return noisy

def add_motion_blur(image_rgb, kernel_size=15):
    kernel = np.zeros((kernel_size, kernel_size))
    kernel[int((kernel_size-1)/2), :] = np.ones(kernel_size)
    kernel = kernel / kernel_size
    blurred = cv2.filter2D(image_rgb, -1, kernel)
    return blurred
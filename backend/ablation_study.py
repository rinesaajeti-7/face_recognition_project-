import os
import cv2
import numpy as np
from io import BytesIO
from PIL import Image
from app.services.ai_pipeline import process_image
from app.services.occlusion_utils import (
    apply_sunglasses, apply_mask, apply_hand_occlusion,
    add_gaussian_noise, add_motion_blur
)
from app.db.database import SessionLocal
from app.models.gallery import Gallery

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_gallery_persons():
    db = SessionLocal()
    persons = db.query(Gallery).all()
    db.close()
    # Heqim dublikatat (për të njëjtin id)
    unique = {}
    for p in persons:
        if p.id not in unique:
            unique[p.id] = p
        else:
            print(f"⚠️ Dublikat i personit ID {p.id} u hoq.")
    return list(unique.values())

def get_image_path(person):
    # Nëse image_path tashmë fillon me 'data/gallery/', e përdorim direkt
    if person.image_path.startswith('data/gallery/'):
        rel_path = person.image_path
    else:
        rel_path = os.path.join('data', 'gallery', person.image_path)
    full_path = os.path.join(BASE_DIR, rel_path)
    if not os.path.exists(full_path):
        # Provojmë edhe nëse është ruajtur si absolute
        if os.path.exists(person.image_path):
            return person.image_path
        else:
            print(f"❌ Image not found for {person.name} (ID {person.id}): {rel_path}")
            return None
    return full_path

def evaluate_variant(persons, use_denoising, apply_occlusion=False, occlusion_type=None, noise_sigma=0, blur_kernel=0):
    correct = 0
    total = 0
    for person in persons:
        full_path = get_image_path(person)
        if full_path is None:
            continue
        with open(full_path, 'rb') as f:
            img_bytes = f.read()
        # Konverto në numpy për augmentime
        pil_img = Image.open(BytesIO(img_bytes))
        img_rgb = np.array(pil_img)
        
        # Apliko augmentimet (vetëm për variantet që i kërkojnë)
        if apply_occlusion:
            if occlusion_type == 'sunglasses':
                img_rgb = apply_sunglasses(img_rgb)
            elif occlusion_type == 'mask':
                img_rgb = apply_mask(img_rgb)
            elif occlusion_type == 'hand':
                img_rgb = apply_hand_occlusion(img_rgb)
        if noise_sigma > 0:
            img_rgb = add_gaussian_noise(img_rgb, sigma=noise_sigma)
        if blur_kernel > 0:
            img_rgb = add_motion_blur(img_rgb, kernel_size=blur_kernel)
        
        # Ktheje përsëri në bytes
        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
        modified_bytes = buffer.tobytes()
        
        # Pipeline
        result = process_image(modified_bytes, use_denoising=use_denoising)
        if result['matches'] and len(result['matches']) > 0 and result['matches'][0]['person_id'] == person.id:
            correct += 1
        total += 1
    return correct / total if total > 0 else 0

def run_ablation():
    persons = load_gallery_persons()
    if len(persons) < 1:
        print("⚠️ Nuk ka asnjë person në galeri.")
        return
    print(f"✅ Testimi me {len(persons)} persona unikë.")
    
    baseline_acc = evaluate_variant(persons, use_denoising=False)
    denoise_acc = evaluate_variant(persons, use_denoising=True)
    occlusion_acc = evaluate_variant(persons, use_denoising=False, apply_occlusion=True, occlusion_type='sunglasses')
    combined_acc = evaluate_variant(persons, use_denoising=True, apply_occlusion=True, occlusion_type='sunglasses')
    
    print("\n=== Rezultatet e Ablation Study (Accuracy) ===")
    print(f"Baseline (pa denoising, pa occlusion): {baseline_acc:.4f}")
    print(f"Denoising vetëm: {denoise_acc:.4f}")
    print(f"Occlusion vetëm (syze): {occlusion_acc:.4f}")
    print(f"Denoising + Occlusion: {combined_acc:.4f}")
    
    if baseline_acc > 0:
        print("\n📈 Përmirësimi relativ:")
        print(f"Denoising: {(denoise_acc - baseline_acc) / baseline_acc * 100:.2f}%")
        print(f"Occlusion: {(occlusion_acc - baseline_acc) / baseline_acc * 100:.2f}%")
        print(f"Kombinuar: {(combined_acc - baseline_acc) / baseline_acc * 100:.2f}%")
    else:
        print("\n⚠️ Baseline accuracy zero. Kontrolloni që imazhet janë të sakta dhe encoding funksionon.")

if __name__ == "__main__":
    run_ablation()
import os
import io
import tempfile
import logging
import numpy as np
import cv2
from PIL import Image
from PIL.ExifTags import TAGS
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from datetime import datetime

from app.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


def resize_image(img_cv, max_dim=600):
    """Zvogëlon imazhin nëse është më i madh se max_dim"""
    h, w = img_cv.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        new_w = int(w * scale)
        new_h = int(h * scale)
        return cv2.resize(img_cv, (new_w, new_h))
    return img_cv


def analyze_jpeg_manipulation(image_path):
    """Analizon nëse JPEG është manipuluar (shpejt)"""
    findings = []
    is_manipulated = False
    confidence = 0.0

    try:
        img_cv = cv2.imread(image_path)
        if img_cv is None:
            return findings, is_manipulated, confidence

        # Zvogëlim për shpejtësi
        img_cv = resize_image(img_cv, 600)

        # 1. Kontrollo metadata (Photoshop, Adobe, GIMP, Lightroom)
        try:
            img_pil = Image.open(image_path)
            exif = img_pil.getexif()
            for tag_id, value in exif.items():
                val_str = str(value).lower()
                if any(x in val_str for x in ['photoshop', 'adobe', 'gimp', 'lightroom']):
                    findings.append("⚠️ Editing software detected in metadata")
                    is_manipulated = True
                    confidence = max(confidence, 0.8)
                    break
        except Exception:
            pass

        # 2. Error Level Analysis (ELA) – një nivel
        quality = 85
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp_path = tmp.name
        cv2.imwrite(tmp_path, img_cv, [cv2.IMWRITE_JPEG_QUALITY, quality])
        img_recompressed = cv2.imread(tmp_path)
        os.unlink(tmp_path)

        if img_recompressed is not None:
            diff = cv2.absdiff(img_cv, img_recompressed)
            diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
            ela_score = np.mean(diff_gray)

            if ela_score > 10:
                findings.append(f"⚠️ ELA score {ela_score:.1f} (>10) – possible editing")
                is_manipulated = True
                confidence = max(confidence, min(ela_score / 25, 0.9))
            elif ela_score > 5:
                findings.append(f"⚠️ ELA score {ela_score:.1f} (>5) – suspicious")
                is_manipulated = True
                confidence = max(confidence, 0.3)
            else:
                findings.append(f"✅ ELA score {ela_score:.1f} – normal")

        # 3. Noise inconsistency – 4 rajone
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        regions = []
        for i in range(2):
            for j in range(2):
                y_start = i * h // 2
                y_end = (i + 1) * h // 2
                x_start = j * w // 2
                x_end = (j + 1) * w // 2
                region = gray[y_start:y_end, x_start:x_end]
                if region.size > 0:
                    regions.append(region)

        if len(regions) >= 2:
            noise_levels = [np.std(r) for r in regions]
            noise_std = np.std(noise_levels)
            if noise_std > 6:
                findings.append(f"⚠️ Inconsistent noise (std={noise_std:.1f})")
                is_manipulated = True
                confidence = max(confidence, 0.7)
            elif noise_std > 3:
                findings.append(f"⚠️ Slight noise inconsistency")
                is_manipulated = True
                confidence = max(confidence, 0.4)

        if not is_manipulated:
            findings.append("✅ No significant manipulation indicators")

    except Exception as e:
        findings.append(f"⚠️ Analysis error: {str(e)[:60]}")
        logger.warning(f"JPEG analysis error: {e}")

    return findings, is_manipulated, confidence


def analyze_png_manipulation(image_path):
    """Analizon nëse PNG është manipuluar (shpejt)"""
    findings = []
    is_manipulated = False
    confidence = 0.0

    try:
        # Metadata për editing software
        with open(image_path, 'rb') as f:
            data = f.read()
            low = data.lower()
            if any(x in low for x in [b'photoshop', b'adobe', b'gimp', b'lightroom']):
                findings.append("⚠️ Editing software detected in PNG metadata")
                is_manipulated = True
                confidence = 0.8

        # Noise analysis
        img_cv = cv2.imread(image_path)
        if img_cv is not None:
            img_cv = resize_image(img_cv, 600)
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape
            regions = []
            for i in range(2):
                for j in range(2):
                    y_start = i * h // 2
                    y_end = (i + 1) * h // 2
                    x_start = j * w // 2
                    x_end = (j + 1) * w // 2
                    region = gray[y_start:y_end, x_start:x_end]
                    if region.size > 0:
                        regions.append(region)

            if len(regions) >= 2:
                noise_levels = [np.std(r) for r in regions]
                noise_std = np.std(noise_levels)
                if noise_std > 8:
                    findings.append(f"⚠️ Inconsistent noise (std={noise_std:.1f})")
                    is_manipulated = True
                    confidence = max(confidence, 0.75)
                elif noise_std > 4:
                    findings.append(f"⚠️ Slight noise inconsistency")
                    is_manipulated = True
                    confidence = max(confidence, 0.4)
                else:
                    findings.append(f"✅ Consistent noise pattern")

        if not is_manipulated:
            findings.append("✅ No manipulation detected")

    except Exception as e:
        findings.append(f"⚠️ Analysis error: {str(e)[:60]}")
        logger.warning(f"PNG analysis error: {e}")

    return findings, is_manipulated, confidence


@router.post("/photo-forensics/analyze")
async def analyze_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Analizon nëse fotografia është manipuluar (Photoshop, GIMP, etj.)"""
    tmp_path = None
    try:
        contents = await file.read()
        ext = file.filename.split('.')[-1].lower()
        if ext not in ['jpg', 'jpeg', 'png']:
            raise HTTPException(400, "Only JPG, JPEG, PNG are supported")

        # Ruaj përkohësisht
        with tempfile.NamedTemporaryFile(suffix=f'.{ext}', delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        image = Image.open(io.BytesIO(contents))
        width, height = image.size

        # Analiza e manipulimit
        if ext in ['jpg', 'jpeg']:
            findings, is_manipulated, confidence = analyze_jpeg_manipulation(tmp_path)
        else:
            findings, is_manipulated, confidence = analyze_png_manipulation(tmp_path)

        # Përcakto nivelin e rrezikut
        if is_manipulated:
            if confidence > 0.7:
                risk_level = "CRITICAL"
                verdict = "⚠️ MANIPULATED/EDITED IMAGE DETECTED"
            elif confidence > 0.4:
                risk_level = "HIGH"
                verdict = "⚠️ HIGH PROBABILITY OF MANIPULATION"
            else:
                risk_level = "MEDIUM"
                verdict = "⚠️ POSSIBLE MANIPULATION"
            recommendation = "Do not use as primary evidence without further verification"
        else:
            risk_level = "LOW"
            verdict = "✅ IMAGE APPEARS AUTHENTIC"
            recommendation = "Suitable for use in investigation"

        result = {
            "filename": file.filename,
            "file_type": ext.upper(),
            "file_size": f"{len(contents) / 1024:.2f} KB",
            "dimensions": f"{width}x{height}",
            "analysis_date": datetime.now().isoformat(),
            "faces_detected": 0,          # Pa face detection për shpejtësi
            "matches_found": 0,
            "matches": [],
            "forensics": {
                "is_manipulated": is_manipulated,
                "confidence": round(float(confidence), 3),
                "confidence_percent": f"{confidence * 100:.1f}%",
                "findings": findings,
                "risk_level": risk_level,
                "verdict": verdict
            },
            "recommendation": recommendation
        }

        logger.info(f"Photo analyzed: {file.filename} | Manipulated: {is_manipulated} | Confidence: {confidence:.2f}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in analyze_photo")
        raise HTTPException(500, f"Internal error: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
            
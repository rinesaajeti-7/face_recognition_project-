import qrcode
import io
import base64
import json
import os
from sqlalchemy.orm import Session
from app.models.gallery import Gallery
from app.config import settings

class QRCodeService:
    """Service for generating QR codes for missing persons"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_person_qr(self, person_id: int) -> dict:
        """Generate QR code for a specific person"""
        
        person = self.db.query(Gallery).filter(Gallery.id == person_id).first()
        if not person:
            return {"error": "Person not found"}
        
        # Create QR code data - version i thjeshtë pa URL
        qr_data = {
            "id": person.id,
            "name": person.name,
            "status": person.status,
            "type": "missing_person",
            "description": person.description or ""
        }
        
        # Convert to JSON string
        qr_text = json.dumps(qr_data, ensure_ascii=False)
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=5,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_text)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # Save QR code to file
        qr_dir = "data/qrcodes"
        os.makedirs(qr_dir, exist_ok=True)
        qr_path = os.path.join(qr_dir, f"person_{person.id}.png")
        img.save(qr_path)
        
        return {
            "success": True,
            "person_id": person.id,
            "person_name": person.name,
            "qr_base64": qr_base64,
            "qr_url": f"/media/qrcodes/person_{person.id}.png",
            "qr_data": qr_text
        }
    
    def generate_poster_with_qr(self, person_id: int):
        """Generate a poster PDF with QR code - simplified version"""
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        import tempfile
        
        person = self.db.query(Gallery).filter(Gallery.id == person_id).first()
        if not person:
            return None
        
        # Get QR code
        qr_result = self.generate_person_qr(person_id)
        if not qr_result.get("success"):
            return None
        
        # Decode base64 QR to image
        qr_bytes = base64.b64decode(qr_result["qr_base64"])
        
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp.write(qr_bytes)
            tmp_path = tmp.name
        
        # Create PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.red,
            alignment=1,
            spaceAfter=20
        )
        
        story = []
        
        # Title
        story.append(Paragraph(f"MISSING PERSON ALERT", title_style))
        story.append(Spacer(1, 12))
        
        # Person info
        info_data = [
            ["Name:", person.name],
            ["Status:", person.status.upper()],
            ["ID:", str(person.id)],
            ["Description:", person.description or "N/A"],
        ]
        
        info_table = Table(info_data, colWidths=[100, 350])
        info_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 20))
        
        # QR Code
        qr_img = Image(tmp_path, width=2*inch, height=2*inch)
        story.append(qr_img)
        story.append(Spacer(1, 10))
        
        # Instructions
        story.append(Paragraph("Scan QR Code for more information", styles['Normal']))
        story.append(Spacer(1, 20))
        story.append(Paragraph("If you have information, please contact:", styles['Normal']))
        story.append(Paragraph("Police: 192", styles['Normal']))
        story.append(Paragraph("Emergency: 112", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Cleanup temp file
        os.unlink(tmp_path)
        
        return buffer.getvalue()
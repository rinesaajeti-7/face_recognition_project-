import smtplib
from email.message import EmailMessage
from app.config import settings

def send_alert_email(recipient_email: str, person_name: str, similarity: float, timestamp: str):
    if not settings.SMTP_SERVER:
        print("Email not configured")
        return
    msg = EmailMessage()
    msg["Subject"] = f"🚨 ALERT: Person identified - {person_name}"
    msg["From"] = settings.EMAIL_SENDER
    msg["To"] = recipient_email
    msg.set_content(f"""
    A missing/wanted person has been identified.
    
    Name: {person_name}
    Similarity: {similarity:.2f}
    Time: {timestamp}
    
    Please check the system dashboard for more details.
    """)
    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print(f"Email error: {e}")
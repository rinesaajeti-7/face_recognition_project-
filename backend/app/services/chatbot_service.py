import json
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.gallery import Gallery
from app.models.citizen import Citizen, CitizenReport, CitizenChatHistory

class ChatbotService:
    """AI Chatbot për ndihmë dhe raportim"""
    
    def __init__(self, db: Session):
        self.db = db
        self.context = {}
        
    def process_message(self, message: str, citizen_id: Optional[int] = None) -> Dict[str, Any]:
        """Përpunon mesazhin dhe kthen përgjigje"""
        
        message_lower = message.lower().strip()
        
        # Ruaj historikun nëse ka citizen_id
        if citizen_id:
            self._save_chat_history(citizen_id, message)
        
        # Identifiko intentin
        intent = self._detect_intent(message_lower)
        
        # Gjenero përgjigje bazuar në intent
        response = self._generate_response(intent, message_lower, citizen_id)
        
        # Ruaj përgjigjen në historik
        if citizen_id:
            self._save_chat_response(citizen_id, response)
        
        return {
            "response": response,
            "intent": intent,
            "suggestions": self._get_suggestions(intent)
        }
    
    def _detect_intent(self, message: str) -> str:
        """Identifikon qëllimin e mesazhit"""
        
        # Fjalë kyçe për intentet
        intents = {
            "check_person": ["kontrollo", "a është", "a ekziston", "kërko", "gjej", "personi", "i zhdukur", "missing"],
            "report_person": ["raporto", "dyshoj", "pashë", "kam parë", "raport", "informoj"],
            "how_to_help": ["si mund të ndihmoj", "çfarë të bëj", "udhëzime", "ndihmë", "help"],
            "emergency": ["emergjencë", "112", "polici", "urgjent", "tani", "shpejt"],
            "status": ["statusi", "si është", "çfarë ndodhi", "a u gjet"],
            "info": ["çfarë është", "si funksionon", "info", "informacion"],
            "gallery": ["galeria", "fotot", "personat", "lista"],
            "alerts": ["alarmet", "njoftimet", "alertet"],
            "points": ["pikë", "piket", "leaderboard", "renditja"],
            "thanks": ["faleminderit", "thanks", "thank you", "rrofsh"],
            "greeting": ["përshëndetje", "tung", "hello", "hi", "çkemi", "pershendetje"],
            "goodbye": ["mirupafshim", "bye", "largohu", "dal"]
        }
        
        for intent, keywords in intents.items():
            if any(keyword in message for keyword in keywords):
                return intent
        
        return "general"
    
    def _generate_response(self, intent: str, message: str, citizen_id: Optional[int] = None) -> str:
        """Gjeneron përgjigje bazuar në intent"""
        
        responses = {
            "check_person": self._handle_check_person(message),
            "report_person": self._handle_report_person(),
            "how_to_help": """📋 **Si mund të ndihmoni:**

1️⃣ **Kontrolloni personat** - Ngarkoni një foto për të parë nëse personi është i zhdukur
2️⃣ **Raportoni të dyshuar** - Nëse shihni një person të dyshuar, raportoni vendndodhjen
3️⃣ **Shpërndani njoftimet** - Ndani posterët në rrjetet sociale
4️⃣ **Informoni autoritetet** - Nëse keni informacion, kontaktoni Policinë në 192

🔍 Përdorni menunë e sipërme për të kontrolluar ose raportuar!""",
            
            "emergency": """🚨 **EMERGJENCË!**

Nëse keni një emergjencë, JU LUTEM telefononi menjëherë:
📞 **112** - Emergjenca të përgjithshme
📞 **192** - Policia e Kosovës

Mos humbni kohë! Çdo sekondë ka rëndësi! 🚨""",
            
            "status": self._handle_status_check(),
            
            "info": """ℹ️ **Rreth Sistemit**

Ky sistem ndihmon në gjetjen e personave të zhdukur duke përdorur:
✅ Njohjen e fytyrave me AI
✅ Raportimin e qytetarëve
✅ Alarme të menjëhershme
✅ Bashkëpunim me Policinë

**Statistikat e fundit:**
• Persona të zhdukur: Aktualisht në kërkim
• Qytetarë të regjistruar: Duke u rritur
• Raporte të pranuara: Çdo ditë""",
            
            "points": self._handle_points(citizen_id),
            
            "thanks": "😊 Faleminderit për fjalët e mira! Së bashku mund të bëjmë ndryshimin dhe të ndihmojmë në gjetjen e personave të zhdukur. A keni ndonjë pyetje tjetër?",
            
            "greeting": "👋 Përshëndetje! Unë jam asistenti virtual i sistemit për personat e zhdukur. Si mund t'ju ndihmoj sot? Mund të:\n\n🔍 **Kontrolloni** nëse një person është i zhdukur\n📝 **Raportoni** një person të dyshuar\nℹ️ **Mësoni** si të ndihmoni\n\nÇfarë dëshironi të bëni?",
            
            "goodbye": "👋 Mirupafshim! Faleminderit që po ndihmoni në gjetjen e personave të zhdukur. Jeni gati të bëni ndryshimin! Kthehuni kur të keni nevojë. 🙏",
            
            "general": self._handle_general(message)
        }
        
        return responses.get(intent, responses["general"])
    
    def _handle_check_person(self, message: str) -> str:
        """Trajton kërkesën për kontrollim të personit"""
        
        # Përpiqu të nxjerrësh emrin nga mesazhi
        name_match = re.search(r'(?:personin|personi|quhet|emri)\s+(\w+)', message, re.IGNORECASE)
        
        if name_match:
            name = name_match.group(1)
            person = self.db.query(Gallery).filter(Gallery.name.ilike(f"%{name}%")).first()
            if person:
                return f"🔍 Kam gjetur një person me emrin '{person.name}' në bazën e të dhënave. Për të kontrolluar nëse është i njëjti person, ju lutemi përdorni funksionin 'Kontrollo Personin' dhe ngarkoni një foto për verifikim të saktë."
        
        return """🔍 Për të kontrolluar nëse një person është i zhdukur:

1️⃣ Shkoni te skeda **"Kontrollo Personin"** në menunë e sipërme
2️⃣ Ngarkoni një foto të personit
3️⃣ Sistemi do të krahasojë me bazën e të dhënave
4️⃣ Do të merrni rezultatin menjëherë!

📸 Sigurohuni që fotoja të jetë e qartë për rezultate më të sakta."""
    
    def _handle_report_person(self) -> str:
        """Trajton kërkesën për raportim"""
        return """📝 Për të raportuar një person të dyshuar:

1️⃣ Shkoni te skeda **"Raporto të Dyshuar"** në menunë e sipërme
2️⃣ Ngarkoni foton e personit
3️⃣ Shkruani përshkrimin dhe vendndodhjen
4️⃣ Raporti do t'i dërgohet autoriteteve për shqyrtim

⚠️ **Rëndësishëm:** Nëse është emergjencë, telefononi 112 menjëherë!"""
    
    def _handle_status_check(self) -> str:
        """Kontrollon statistikat e përgjithshme"""
        
        total_persons = self.db.query(Gallery).count()
        missing_persons = self.db.query(Gallery).filter(Gallery.status == "missing").count()
        total_reports = self.db.query(CitizenReport).count()
        
        return f"""📊 **Statistikat e Sistemit**

👥 Gjithsej persona: {total_persons}
🔴 Persona të zhdukur: {missing_persons}
📋 Raporte nga qytetarët: {total_reports}

🤝 Bashkëpunoni me ne për të ndihmuar në gjetjen e personave të zhdukur!"""
    
    def _handle_points(self, citizen_id: Optional[int]) -> str:
        """Trajton kërkesën për pikë"""
        
        if citizen_id:
            citizen = self.db.query(Citizen).filter(Citizen.id == citizen_id).first()
            if citizen:
                return f"🏆 **Pikët tuaja: {citizen.points} pikë**\n\n🎖️ Niveli: {citizen.badge_level}\n📋 Raporte të dërguara: {len(citizen.reports)}\n\nVazhdoni të ndihmoni për të fituar më shumë pikë dhe badge! 🌟"
        
        return "🏆 **Sistemi i Pikëve**\n\nFito pikë duke:\n✅ Raportuar persona të dyshuar (+10 pikë)\n✅ Ndihmuar në gjetjen e personave (+50 pikë)\n✅ Shpërndarë njoftime (+5 pikë)\n\nSa më shumë të ndihmoni, aq më shumë pikë fitoni!"
    
    def _handle_general(self, message: str) -> str:
        """Përgjigje për pyetje të përgjithshme"""
        
        # Përgjigje për pyetje të zakonshme
        if "faleminderit" in message or "rrofsh" in message:
            return "😊 Me kënaqësi! Jeni gati të ndihmoni dikë tjetër sot?"
        
        if "po" in message and len(message) < 10:
            return "😊 Shkëlqyeshëm! Çfarë dëshironi të bëni?\n\n🔍 Kontrolloni një person\n📝 Raportoni të dyshuar\nℹ️ Mësoni si të ndihmoni"
        
        if "jo" in message and len(message) < 10:
            return "😊 Në rregull! Jeni gjithmonë të mirëpritur kur të keni nevojë. Gjatë ditës! 👋"
        
        return """😊 Faleminderit për mesazhin! Unë jam asistenti virtual i sistemit për personat e zhdukur.

Mund t'ju ndihmoj me:
• 🔍 Kontrollimin e personave të zhdukur
• 📝 Raportimin e personave të dyshuar
• ℹ️ Informacione rreth sistemit
• 🏆 Pikët dhe leaderboard

Për të filluar, provoni të shkruani "Si mund të ndihmoj?" ose përdorni menunë e sipërme! """
    
    def _get_suggestions(self, intent: str) -> List[str]:
        """Gjeneron sugjerime bazuar në intent"""
        
        suggestions_map = {
            "check_person": ["🔍 Kontrollo një person", "📝 Raporto të dyshuar", "ℹ️ Si të ndihmoj?"],
            "report_person": ["📝 Raporto të dyshuar", "🔍 Kontrollo statusin", "🏆 Shiko piket"],
            "how_to_help": ["🔍 Kontrollo personin", "📝 Raporto të dyshuar", "📊 Shiko statistikat"],
            "emergency": ["📞 Telefono Policinë", "📍 Raporto vendndodhjen", "🔍 Kontrollo personin"],
            "status": ["📊 Statistikat", "🏆 Leaderboard", "🔍 Kontrollo"],
            "general": ["🔍 Kontrollo personin", "📝 Raporto të dyshuar", "ℹ️ Informacion"]
        }
        
        return suggestions_map.get(intent, ["🔍 Kontrollo personin", "📝 Raporto të dyshuar", "ℹ️ Si funksionon?"])
    
    def _save_chat_history(self, citizen_id: int, message: str):
        """Ruani mesazhin në historik"""
        try:
            chat = CitizenChatHistory(
                citizen_id=citizen_id,
                message=message,
                context_person_id=None
            )
            self.db.add(chat)
            self.db.commit()
        except Exception as e:
            print(f"Error saving chat history: {e}")
            self.db.rollback()
    
    def _save_chat_response(self, citizen_id: int, response: str):
        """Përditëso përgjigjen në historik"""
        try:
            # Merr chat-in e fundit të pa përgjigjur
            last_chat = self.db.query(CitizenChatHistory).filter(
                CitizenChatHistory.citizen_id == citizen_id,
                CitizenChatHistory.response.is_(None)
            ).order_by(CitizenChatHistory.created_at.desc()).first()
            
            if last_chat:
                last_chat.response = response
                self.db.commit()
        except Exception as e:
            print(f"Error saving chat response: {e}")
            self.db.rollback()
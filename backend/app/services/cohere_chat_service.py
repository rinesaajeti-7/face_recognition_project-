import httpx
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.gallery import Gallery
from app.models.citizen import Citizen

class CohereChatService:
    """Chat service using Cohere API for intelligent responses"""
    
    COHERE_API_URL = "https://api.cohere.com/v2/chat"
    API_KEY = "KaqakjW0iuFMH6teFGie2nfzeDhrmN1FRcjUbtJR"  # Your API Key
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get_response(self, message: str, user_role: str = "police", citizen_id: Optional[int] = None) -> Dict[str, Any]:
        """Get AI response from Cohere with context"""
        
        # Krijo kontekstin bazuar në rolin e përdoruesit
        context = self._build_context(user_role, citizen_id)
        
        # Krijo prompt-in e plotë
        full_prompt = f"""{context}

Pyetja e përdoruesit: {message}

Përgjigju në shqip në mënyrë të dobishme dhe profesionale. Nëse pyetja lidhet me personat e zhdukur, referoju të dhënave nga sistemi. Nëse nuk ke informacion të mjaftueshëm, sugjero përdorimin e funksioneve përkatëse të sistemit."""
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.COHERE_API_URL,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.API_KEY}"
                    },
                    json={
                        "model": "command-a-03-2025",
                        "messages": [{"role": "user", "content": full_prompt}],
                        "temperature": 0.7,
                        "max_tokens": 800
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    ai_response = data.get("message", {}).get("content", [{}])[0].get("text", "Më vjen keq, nuk mund të përpunoj kërkesën.")
                    
                    # Gjenero sugjerime bazuar në kontekst
                    suggestions = self._get_suggestions(message, user_role)
                    
                    return {
                        "response": ai_response,
                        "intent": "ai_generated",
                        "suggestions": suggestions
                    }
                else:
                    # Fallback to local responses if API fails
                    return await self._get_local_response(message, user_role, citizen_id)
                    
        except Exception as e:
            print(f"Cohere API error: {e}")
            # Fallback to local responses
            return await self._get_local_response(message, user_role, citizen_id)
    
    def _build_context(self, user_role: str, citizen_id: Optional[int] = None) -> str:
        """Build context based on user role"""
        
        # Të dhëna nga databaza
        total_missing = self.db.query(Gallery).filter(Gallery.status == "missing").count()
        total_found = self.db.query(Gallery).filter(Gallery.status == "found").count()
        total_persons = self.db.query(Gallery).count()
        recent_persons = self.db.query(Gallery).order_by(Gallery.created_at.desc()).limit(5).all()
        
        recent_list = "\n".join([f"- {p.name} (Statusi: {p.status})" for p in recent_persons])
        
        if user_role == "police":
            context = f"""Ti je një asistent inteligjent për Policinë e Kosovës, i specializuar në menaxhimin e personave të zhdukur.

Të dhënat aktuale të sistemit:
- Gjithsej persona në sistem: {total_persons}
- Persona të zhdukur: {total_missing}
- Persona të gjetur: {total_found}
- Personat e fundit të regjistruar:
{recent_list}

Funksionet e sistemit përfshijnë:
- Regjistrimi i personave të zhdukur në galeri
- Kërkimi me foto (face recognition)
- Krijimi i alarmeve për raste urgjente
- Gjenerimi i raporteve statistikore
- Menaxhimi i përdoruesve (admin)

Përgjigju pyetjeve në lidhje me procedurat policore, personat e zhdukur, dhe sistemin."""
        else:
            context = f"""Ti je një asistent virtual për qytetarët që duan të ndihmojnë në gjetjen e personave të zhdukur në Kosovë.

Të dhënat aktuale:
- Gjithsej persona të zhdukur: {total_missing}
- Raste të zgjidhura: {total_found}

Qytetarët mund të:
- Kontrollojnë nëse një person është i zhdukur duke ngarkuar një foto
- Raportojnë persona të dyshuar me foto dhe vendndodhje
- Fitojnë pikë dhe badge duke raportuar
- Shohin leaderboard-in e qytetarëve aktivë

Përgjigju në mënyrë të dobishme dhe inkurajuese."""
        
        return context
    
    def _get_suggestions(self, message: str, user_role: str) -> List[str]:
        """Generate suggestions based on message"""
        message_lower = message.lower()
        
        if user_role == "police":
            if "statistik" in message_lower:
                return ["🔍 Kërko një person", "🚨 Krijo alarm", "📋 Raporte mujore"]
            elif "kërko" in message_lower or "gjej" in message_lower:
                return ["📊 Statistikat", "🚨 Krijo alarm", "👥 Listo të gjithë"]
            elif "alarm" in message_lower:
                return ["🔍 Kërko një person", "📊 Statistikat", "👥 Përdoruesit"]
            else:
                return ["🔍 Kërko një person", "📊 Statistikat", "🚨 Krijo alarm", "📋 Raporte", "👥 Ndihmë"]
        else:
            if "kontrollo" in message_lower or "person" in message_lower:
                return ["📝 Raporto të dyshuar", "🏆 Leaderboard", "ℹ️ Udhëzues"]
            elif "raporto" in message_lower:
                return ["🔍 Kontrollo personin", "🏆 Sa pikë kam?", "ℹ️ Udhëzues"]
            elif "pikë" in message_lower:
                return ["🔍 Kontrollo personin", "📝 Raporto të dyshuar", "ℹ️ Udhëzues"]
            else:
                return ["🔍 Kontrollo personin", "📝 Raporto të dyshuar", "🏆 Leaderboard", "ℹ️ Udhëzues"]
    
    async def _get_local_response(self, message: str, user_role: str, citizen_id: Optional[int] = None) -> Dict[str, Any]:
        """Fallback local responses when API fails"""
        message_lower = message.lower()
        
        if "statistik" in message_lower:
            total_missing = self.db.query(Gallery).filter(Gallery.status == "missing").count()
            total_found = self.db.query(Gallery).filter(Gallery.status == "found").count()
            citizens = self.db.query(Citizen).count()
            
            response = f"📊 **Statistikat e Sistemit**\n\n👥 Persona të zhdukur: {total_missing}\n✅ Persona të gjetur: {total_found}\n🤝 Qytetarë të regjistruar: {citizens}\n\n📈 Shkalla e suksesit: {round((total_found/(total_missing+total_found))*100 if (total_missing+total_found) > 0 else 0)}%"
            intent = "statistics"
        elif "kërko" in message_lower:
            response = "🔍 Për të kërkuar një person të zhdukur, vizitoni **Galeria** ose përdorni **Kërkimin me foto**. Mund të shkruani edhe 'Kërko [emri]' për të kërkuar direkt!"
            intent = "search"
        else:
            response = f"👋 Përshëndetje! Unë jam asistenti {'i Policisë' if user_role == 'police' else 'për qytetarët'}. Si mund t'ju ndihmoj sot?"
            intent = "greeting"
        
        suggestions = self._get_suggestions(message, user_role)
        
        return {
            "response": response,
            "intent": intent,
            "suggestions": suggestions
        }
from typing import Dict, List
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List] = {
            "police": [],
            "citizens": []
        }
        self.notification_history: List[dict] = []
    
    async def connect(self, websocket, client_type: str = "police"):
        await websocket.accept()
        self.active_connections[client_type].append(websocket)
        print(f"WebSocket connected: {client_type} (Total: {len(self.active_connections[client_type])})")
    
    def disconnect(self, websocket, client_type: str = "police"):
        if websocket in self.active_connections[client_type]:
            self.active_connections[client_type].remove(websocket)
            print(f"WebSocket disconnected: {client_type} (Remaining: {len(self.active_connections[client_type])})")
    
    async def send_personal_message(self, message: dict, websocket):
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")
    
    async def broadcast_to_police(self, message: dict):
        disconnected = []
        for connection in self.active_connections["police"]:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn, "police")
    
    async def send_new_report_notification(self, report_data: dict):
        """Dërgo notifikim për raport të ri nga qytetarët"""
        notification = {
            "type": "new_report",
            "data": report_data,
            "timestamp": datetime.now().isoformat(),
            "title": "📝 Raport i Ri",
            "message": f"Një raport i ri është dërguar nga qytetarët: {report_data.get('title', 'Raport i ri')}"
        }
        self.notification_history.insert(0, notification)
        self.notification_history = self.notification_history[:100]
        await self.broadcast_to_police(notification)
    
    def get_notification_history(self, limit: int = 50) -> List[dict]:
        return self.notification_history[:limit]

manager = ConnectionManager()
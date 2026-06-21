from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import manager
import json

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/{client_type}")
async def websocket_endpoint(websocket: WebSocket, client_type: str):
    if client_type not in ["police", "citizens"]:
        await websocket.close()
        return
    
    await manager.connect(websocket, client_type)
    
    try:
        if client_type == "police":
            history = manager.get_notification_history(20)
            await manager.send_personal_message({
                "type": "history",
                "data": history,
                "timestamp": None
            }, websocket)
        
        await manager.send_personal_message({
            "type": "connection",
            "message": f"Connected to {client_type} channel",
            "timestamp": None
        }, websocket)
        
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                print(f"Received from {client_type}: {message}")
                if message.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format"
                }, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_type)
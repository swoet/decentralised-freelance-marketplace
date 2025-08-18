from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.services.redis_pubsub import RedisPubSubService
from app.api.deps import get_current_active_user


router = APIRouter()


@router.websocket("/ws/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket, project_id: str, user=Depends(get_current_active_user)
):
    await websocket.accept()
    pubsub = RedisPubSubService(project_id)
    try:
        while True:
            data = await websocket.receive_text()
            await pubsub.publish(data)
            message = await pubsub.subscribe()
            await websocket.send_text(message)
    except WebSocketDisconnect:
        await websocket.close() 
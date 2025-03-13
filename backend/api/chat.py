from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from ..database.db_models import Message, Chat, ChatUpdate
from ..core import chat as chat_service
from ..core import ollama as ollama_service
from ..utils.stream import stream_response
import json
import sqlite3
from ..config import config

router = APIRouter()

@router.post("/chats")
async def create_chat(chat: Chat):
    """Create a new chat"""
    return await chat_service.create_chat(chat)

@router.get("/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str):
    """Get messages for a specific chat"""
    return await chat_service.get_chat_messages(chat_id)

@router.post("/chat/{chat_id}")
async def chat(chat_id: str, message: Message):
    """Send message to Ollama and stream response"""
    try:
        # Validate message content
        if not message.content or not message.content.strip():
            raise HTTPException(status_code=422, detail="消息内容不能为空")

        # Save user message
        await chat_service.save_message(chat_id, message)
        
        # Get chat model if not provided in message
        if not message.model:
            conn = sqlite3.connect(config.storage.database)
            c = conn.cursor()
            c.execute("SELECT model FROM chats WHERE id = ?", (chat_id,))
            result = c.fetchone()
            conn.close()
            if result:
                message.model = result[0]
            else:
                raise HTTPException(status_code=404, detail="聊天不存在")
        
        # Get response from Ollama
        try:
            ollama_response = await ollama_service.generate_response(message.model, message.content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"生成响应时出错: {str(e)}")
        
        # Save assistant's response in background
        async def save_response():
            full_response = ""
            async for chunk in ollama_response.aiter_lines():
                if chunk.strip():
                    try:
                        data = json.loads(chunk)
                        if "response" in data:
                            full_response += data["response"]
                    except json.JSONDecodeError:
                        full_response += chunk.strip()
            
            if full_response:
                await chat_service.save_message(
                    chat_id,
                    Message(role="assistant", content=full_response)
                )
        
        background_tasks = BackgroundTasks()
        background_tasks.add_task(save_response)
        
        return StreamingResponse(
            stream_response(ollama_response),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "X-Accel-Buffering": "no"
            },
            background=background_tasks
        )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chats")
async def get_chats():
    """Get all chats"""
    return await chat_service.get_chats()

@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    """Delete a chat"""
    return await chat_service.delete_chat(chat_id)

@router.patch("/chats/{chat_id}")
async def update_chat(chat_id: str, chat_update: ChatUpdate):
    """Update chat details"""
    return await chat_service.update_chat(chat_id, chat_update)

@router.get("/chat/{chat_id}/stream")
async def stream_chat(chat_id: str, content: str, model: str):
    """Stream chat response"""
    try:
        # Save user message
        message = Message(role="user", content=content, model=model)
        await chat_service.save_message(chat_id, message)
        
        # Get response from Ollama
        ollama_response = await ollama_service.generate_response(model, content)
        
        # Save assistant's response in background
        async def save_response():
            full_response = ""
            async for chunk in ollama_response.aiter_lines():
                if chunk.strip():
                    try:
                        data = json.loads(chunk)
                        if "response" in data:
                            full_response += data["response"]
                    except json.JSONDecodeError:
                        full_response += chunk.strip()
            
            if full_response:
                await chat_service.save_message(
                    chat_id,
                    Message(role="assistant", content=full_response)
                )
        
        background_tasks = BackgroundTasks()
        background_tasks.add_task(save_response)
        
        return StreamingResponse(
            stream_response(ollama_response),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "X-Accel-Buffering": "no"
            },
            background=background_tasks
        )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

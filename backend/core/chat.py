import os
import sqlite3
import uuid
from fastapi import HTTPException
import json
from ..database.db_models import Chat, ChatUpdate, Message
from ..config import config
from datetime import datetime

async def verify_chat_storage(chat_id: str) -> bool:
    """Verify that both database record and chat file exist"""
    try:
        # Check database record
        conn = sqlite3.connect(config.storage.database)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM chats WHERE id = ?", (chat_id,))
        count = cursor.fetchone()[0]
        conn.close()

        if count == 0:
            return False

        # Check chat file
        chat_file = os.path.join(config.storage.chat_dir, chat_id, "chat.json")
        return os.path.exists(chat_file)
    except Exception:
        return False

async def create_chat(chat: Chat):
    """Create a new chat"""
    try:
        # Ensure storage directory exists
        storage_dir = os.path.dirname(config.storage.chat_dir)
        if not os.path.exists(storage_dir):
            os.makedirs(storage_dir, exist_ok=True)
        if not os.path.exists(config.storage.chat_dir):
            os.makedirs(config.storage.chat_dir, exist_ok=True)

        chat_id = str(uuid.uuid4())
        chat_dir = os.path.join(config.storage.chat_dir, chat_id)
        chat_file = os.path.join(chat_dir, "chat.json")
    
        try:
            # Create chat directory
            os.makedirs(chat_dir, exist_ok=True)
            
            # Initialize empty chat file
            try:
                with open(chat_file, "w") as f:
                    json.dump([], f)
            except IOError as e:
                if os.path.exists(chat_dir):
                    os.rmdir(chat_dir)
                raise HTTPException(status_code=500, detail=f"Failed to create chat file: {str(e)}")
            
            # Insert chat record into database
            try:
                conn = sqlite3.connect(config.storage.database)
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO chats (id, title, model) VALUES (?, ?, ?)",
                    (chat_id, chat.title, chat.model)
                )
                conn.commit()
            except sqlite3.Error as e:
                # Clean up if database insert fails
                if os.path.exists(chat_file):
                    os.remove(chat_file)
                if os.path.exists(chat_dir):
                    os.rmdir(chat_dir)
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            finally:
                if 'conn' in locals():
                    conn.close()

            # Verify storage
            if not await verify_chat_storage(chat_id):
                raise HTTPException(status_code=500, detail="Failed to verify chat storage")
            
            # Return chat object with consistent structure
            return {
                "chat": {
                    "id": chat_id,
                    "title": chat.title,
                    "model": chat.model
                }
            }
        except Exception as e:
            # Clean up if anything fails
            if os.path.exists(chat_dir):
                os.rmdir(chat_dir)
            raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_chat_messages(chat_id: str):
    """Get messages for a chat"""
    chat_file = os.path.join(config.storage.chat_dir, chat_id, "chat.json")
    try:
        with open(chat_file, "r") as f:
            messages = json.load(f)
        return messages
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Chat not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def save_message(chat_id: str, message: Message):
    """Save a message to chat history"""
    verify_chat_storage(chat_id)
    chat_file = os.path.join(config.storage.chat_dir, chat_id, "chat.json")
    
    try:
        with open(chat_file, "r", encoding='utf-8') as f:
            messages = json.load(f)
        
        # Add timestamp to message
        if not message.created_at:
            message.created_at = datetime.now().isoformat()
        
        message_dict = message.dict()
        messages.append(message_dict)
        
        with open(chat_file, "w", encoding='utf-8') as f:
            json.dump(messages, f, ensure_ascii=False, indent=2)
            
        return message
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Chat not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_chats():
    """Get all chats"""
    try:
        conn = sqlite3.connect(config.storage.database)
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, model FROM chats ORDER BY created_at DESC")
        chats = cursor.fetchall()
        conn.close()
        
        return [
            {"id": chat[0], "title": chat[1], "model": chat[2]}
            for chat in chats
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def delete_chat(chat_id: str):
    """Delete a chat"""
    chat_dir = os.path.join(config.storage.chat_dir, chat_id)
    try:
        # Delete from database first
        conn = sqlite3.connect(config.storage.database)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
        conn.commit()
        conn.close()
        
        # Then delete files
        if os.path.exists(chat_dir):
            for file in os.listdir(chat_dir):
                os.remove(os.path.join(chat_dir, file))
            os.rmdir(chat_dir)
            
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def update_chat(chat_id: str, chat_update: ChatUpdate):
    """Update chat details"""
    try:
        conn = sqlite3.connect(config.storage.database)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE chats SET title = ? WHERE id = ?",
            (chat_update.title, chat_id)
        )
        conn.commit()
        
        # Get updated chat details
        cursor.execute("SELECT id, title, model FROM chats WHERE id = ?", (chat_id,))
        chat = cursor.fetchone()
        conn.close()
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
            
        return {
            "chat": {
                "id": chat[0],
                "title": chat[1],
                "model": chat[2]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx
import yaml
import sqlite3
import os
from datetime import datetime
import markdown
import json
import uuid
import asyncio
from typing import Dict, Any, Optional, List
from pathlib import Path

# Configuration validation model
class OllamaConfig(BaseModel):
    host: str

class StorageConfig(BaseModel):
    chat_dir: str
    database: str

class ServerConfig(BaseModel):
    host: str
    port: int
    cors_origins: list

class Config(BaseModel):
    ollama: OllamaConfig
    storage: StorageConfig
    server: ServerConfig

# Default configuration
DEFAULT_CONFIG = {
    "ollama": {
        "host": "http://localhost:11434"
    },
    "storage": {
        "chat_dir": "./storage/chats",
        "database": "./storage/database.db"
    },
    "server": {
        "host": "localhost",
        "port": 8080,
        "cors_origins": ["http://localhost:5173"]
    }
}

def load_config() -> Dict[str, Any]:
    """Load configuration from file or use defaults"""
    try:
        with open("backend/config.yaml", "r") as f:
            user_config = yaml.safe_load(f)
        return {**DEFAULT_CONFIG, **user_config}
    except Exception as e:
        print(f"Failed to load config, using defaults: {e}")
        return DEFAULT_CONFIG

# Load configuration
config = load_config()

app = FastAPI()

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdnjs.cloudflare.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https:; "
        "connect-src 'self' http://localhost:8080 http://localhost:5173 http://localhost:5174 ws://localhost:8080"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config["server"]["cors_origins"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
def init_db():
    """Initialize database and storage"""
    try:
        # Ensure storage directory exists
        storage_dir = Path(config["storage"]["chat_dir"])
        storage_dir.mkdir(parents=True, exist_ok=True)

        # Ensure database directory exists
        db_path = Path(config["storage"]["database"])
        db_path.parent.mkdir(parents=True, exist_ok=True)

        # Initialize database
        conn = sqlite3.connect(str(db_path))
        c = conn.cursor()
        
        # Create chats table
        c.execute('''
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                title TEXT,
                model TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create example questions table
        c.execute('''
            CREATE TABLE IF NOT EXISTS example_questions (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                category TEXT,
                order_num INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert default example questions if none exist
        c.execute("SELECT COUNT(*) FROM example_questions")
        if c.fetchone()[0] == 0:
            default_questions = [
                "你能做什么？",
                "如何使用代码实现一个简单的Web服务器？",
                "解释一下什么是递归算法？",
                "帮我优化这段代码的性能",
                "如何实现用户认证系统？"
            ]
            for i, question in enumerate(default_questions):
                question_id = str(uuid.uuid4())
                c.execute(
                    "INSERT INTO example_questions (id, content, order_num) VALUES (?, ?, ?)",
                    (question_id, question, i)
                )
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise

init_db()

# Models
class Message(BaseModel):
    role: str = "user"
    content: str
    model: str = None

class Chat(BaseModel):
    title: str
    model: str

class ChatUpdate(BaseModel):
    title: str

class OllamaConfigUpdate(BaseModel):
    host: str

class ExampleQuestion(BaseModel):
    content: str
    category: Optional[str] = None
    order_num: Optional[int] = None

class ExampleQuestionUpdate(BaseModel):
    content: Optional[str] = None
    category: Optional[str] = None
    order_num: Optional[int] = None

async def stream_response(response):
    """Stream response from Ollama"""
    try:
        async for line in response.aiter_lines():
            if line.strip():
                try:
                    data = json.loads(line)
                    if "response" in data:
                        chunk = data["response"]
                        if chunk:
                            yield chunk
                            await asyncio.sleep(0.01)
                    elif "error" in data:
                        yield f"Error: {data['error']}"
                        await asyncio.sleep(0.01)
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        yield f"Error: {str(e)}"

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent.absolute()
FRONTEND_DIR = PROJECT_ROOT / "frontend"

# Routes
@app.get("/")
async def read_root():
    """Serve index page or redirect to login"""
    return FileResponse(FRONTEND_DIR / "frontend" / "login.html")

@app.get("/settings")
async def read_settings():
    """Serve settings page"""
    return FileResponse(FRONTEND_DIR / "settings.html")

@app.get("/api/models")
async def get_models():
    """Get available Ollama models"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{config['ollama']['host']}/api/tags")
            if response.status_code == 200:
                data = response.json()
                # 只返回模型名称列表
                models = [model["name"] for model in data.get("models", [])]
                return {"models": models}
            else:
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to fetch models from Ollama service: {response.status_code}"
                )
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error connecting to Ollama service: {str(e)}"
            )

@app.post("/api/chats")
async def create_chat(chat: Chat):
    """Create a new chat"""
    try:
        chat_id = str(uuid.uuid4())
        
        # Create chat directory first
        chat_dir = os.path.join(config["storage"]["chat_dir"], chat_id)
        os.makedirs(chat_dir, exist_ok=True)
        
        # Create empty chat file
        chat_file = os.path.join(chat_dir, "chat.md")
        open(chat_file, 'a').close()
        
        # Then create database entry
        conn = sqlite3.connect(config["storage"]["database"])
        c = conn.cursor()
        c.execute(
            "INSERT INTO chats (id, title, model) VALUES (?, ?, ?)",
            (chat_id, chat.title, chat.model)
        )
        conn.commit()
        
        # Get the created chat
        c.execute("SELECT id, title, model FROM chats WHERE id = ?", (chat_id,))
        chat_data = c.fetchone()
        conn.close()
        
        return {"chat": {"id": chat_data[0], "title": chat_data[1], "model": chat_data[2]}}
    except Exception as e:
        print(f"Error creating chat: {e}")
        # Clean up if database insert failed
        if os.path.exists(chat_file):
            try:
                os.remove(chat_file)
                os.rmdir(chat_dir)
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chats/{chat_id}/messages")
async def get_chat_messages(chat_id: str):
    """Get messages for a specific chat"""
    chat_file = os.path.join(config["storage"]["chat_dir"], chat_id, "chat.md")
    if not os.path.exists(chat_file):
        return {"messages": []}
        
    with open(chat_file, "r") as f:
        content = f.read()
        
    messages = []
    current_role = None
    current_content = []
    
    for line in content.split("\n"):
        if line.startswith("### "):
            if current_role and current_content:
                messages.append({
                    "role": current_role.lower(),
                    "content": "\n".join(current_content).strip()
                })
            current_role = line[4:].strip()
            current_content = []
        elif line.strip():
            current_content.append(line)
            
    if current_role and current_content:
        messages.append({
            "role": current_role.lower(),
            "content": "\n".join(current_content).strip()
        })
        
    return {"messages": messages}

@app.post("/api/chat/{chat_id}")
async def chat(chat_id: str, message: Message):
    """Send message to Ollama and stream response"""
    try:
        # Create chat directory if it doesn't exist
        chat_dir = os.path.join(config["storage"]["chat_dir"], chat_id)
        os.makedirs(chat_dir, exist_ok=True)
        
        chat_file = os.path.join(chat_dir, "chat.md")
        with open(chat_file, "a") as f:
            f.write(f"\n\n### User\n{message.content}")
        
        # Get chat model if not provided in message
        model = message.model
        if not model:
            conn = sqlite3.connect(config["storage"]["database"])
            c = conn.cursor()
            c.execute("SELECT model FROM chats WHERE id = ?", (chat_id,))
            result = c.fetchone()
            conn.close()
            if result:
                model = result[0]
            else:
                raise HTTPException(status_code=404, detail="Chat not found")
        
        # Send to Ollama
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{config['ollama']['host']}/api/generate",
                    json={
                        "model": model,
                        "prompt": message.content,
                        "stream": True
                    },
                    timeout=None
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Ollama service returned status code: {response.status_code}"
                    )
                
                # Save assistant's response
                async def save_response():
                    full_response = ""
                    async for chunk in response.aiter_lines():
                        if chunk.strip():
                            try:
                                data = json.loads(chunk)
                                if "response" in data:
                                    full_response += data["response"]
                            except json.JSONDecodeError:
                                continue
                    
                    if full_response:
                        with open(chat_file, "a") as f:
                            f.write(f"\n\n### Assistant\n{full_response}")
                
                # Start saving response in background
                background_tasks = BackgroundTasks()
                background_tasks.add_task(save_response)
                
                return StreamingResponse(
                    stream_response(response),
                    media_type="application/octet-stream",
                    headers={
                        "Cache-Control": "no-cache, no-transform",
                        "Connection": "keep-alive",
                        "X-Accel-Buffering": "no",
                        "Transfer-Encoding": "chunked"
                    },
                    background=background_tasks
                )
                
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error communicating with Ollama service: {str(e)}"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chats")
async def get_chats():
    """Get all chats"""
    conn = sqlite3.connect(config["storage"]["database"])
    c = conn.cursor()
    c.execute("SELECT id, title, model FROM chats ORDER BY updated_at DESC")
    chats = c.fetchall()
    conn.close()
    return {"chats": [{"id": chat[0], "title": chat[1], "model": chat[2]} for chat in chats]}

@app.delete("/api/chats/{chat_id}")
async def delete_chat(chat_id: str):
    """Delete a chat"""
    try:
        conn = sqlite3.connect(config["storage"]["database"])
        c = conn.cursor()
        c.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
        conn.commit()
        conn.close()
        
        chat_dir = os.path.join(config["storage"]["chat_dir"], chat_id)
        chat_file = os.path.join(chat_dir, "chat.md")
        
        # Only try to delete files if they exist
        if os.path.exists(chat_file):
            os.remove(chat_file)
        if os.path.exists(chat_dir):
            os.rmdir(chat_dir)
        
        return {"status": "success"}
    except Exception as e:
        print(f"Error deleting chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/chats/{chat_id}")
async def update_chat(chat_id: str, chat_update: ChatUpdate):
    """Update chat details"""
    try:
        conn = sqlite3.connect(config["storage"]["database"])
        c = conn.cursor()
        
        # Update chat title
        c.execute(
            "UPDATE chats SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (chat_update.title, chat_id)
        )
        conn.commit()
        
        # Get updated chat
        c.execute("SELECT id, title, model FROM chats WHERE id = ?", (chat_id,))
        chat_data = c.fetchone()
        conn.close()
        
        if not chat_data:
            raise HTTPException(status_code=404, detail="Chat not found")
            
        return {"chat": {"id": chat_data[0], "title": chat_data[1], "model": chat_data[2]}}
        
    except Exception as e:
        print(f"Error updating chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings/example-questions")
async def get_example_questions():
    """Get all example questions"""
    try:
        conn = sqlite3.connect(config["storage"]["database"])
        c = conn.cursor()
        c.execute("""
            SELECT id, content, category, order_num, created_at, updated_at 
            FROM example_questions 
            ORDER BY order_num ASC
        """)
        questions = c.fetchall()
        conn.close()
        
        return {
            "questions": [
                {
                    "id": q[0],
                    "content": q[1],
                    "category": q[2],
                    "order_num": q[3],
                    "created_at": q[4],
                    "updated_at": q[5]
                }
                for q in questions
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/settings/example-questions")
async def create_example_question(question: ExampleQuestion):
    """Create a new example question"""
    try:
        conn = sqlite3.connect(config["storage"]["database"])
        c = conn.cursor()
        
        # Check if we already have 5 questions
        c.execute("SELECT COUNT(*) FROM example_questions")
        if c.fetchone()[0] >= 5:
            raise HTTPException(status_code=400, detail="Maximum number of example questions reached (5)")
        
        # Get the next order number if not provided
        if question.order_num is None:
            c.execute("SELECT COALESCE(MAX(order_num), -1) + 1 FROM example_questions")
            question.order_num = c.fetchone()[0]
        
        question_id = str(uuid.uuid4())
        c.execute(
            """
            INSERT INTO example_questions (id, content, category, order_num) 
            VALUES (?, ?, ?, ?)
            """,
            (question_id, question.content, question.category, question.order_num)
        )
        conn.commit()
        
        # Get the created question
        c.execute(
            """
            SELECT id, content, category, order_num, created_at, updated_at 
            FROM example_questions WHERE id = ?
            """,
            (question_id,)
        )
        q = c.fetchone()
        conn.close()
        
        return {
            "question": {
                "id": q[0],
                "content": q[1],
                "category": q[2],
                "order_num": q[3],
                "created_at": q[4],
                "updated_at": q[5]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/settings/example-questions/{question_id}")
async def update_example_question(
    question_id: str,
    question_update: ExampleQuestionUpdate
):
    """Update an example question"""
    try:
        conn = sqlite3.connect(config["storage"]["database"])
        c = conn.cursor()
        
        # Check if question exists
        c.execute("SELECT id FROM example_questions WHERE id = ?", (question_id,))
        if not c.fetchone():
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Build update query
        update_fields = []
        params = []
        if question_update.content is not None:
            update_fields.append("content = ?")
            params.append(question_update.content)
        if question_update.category is not None:
            update_fields.append("category = ?")
            params.append(question_update.category)
        if question_update.order_num is not None:
            update_fields.append("order_num = ?")
            params.append(question_update.order_num)
        
        if update_fields:
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            query = f"""
                UPDATE example_questions 
                SET {', '.join(update_fields)}
                WHERE id = ?
            """
            params.append(question_id)
            c.execute(query, params)
            conn.commit()
        
        # Get updated question
        c.execute(
            """
            SELECT id, content, category, order_num, created_at, updated_at 
            FROM example_questions WHERE id = ?
            """,
            (question_id,)
        )
        q = c.fetchone()
        conn.close()
        
        return {
            "question": {
                "id": q[0],
                "content": q[1],
                "category": q[2],
                "order_num": q[3],
                "created_at": q[4],
                "updated_at": q[5]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/settings/example-questions/{question_id}")
async def delete_example_question(question_id: str):
    """Delete an example question"""
    try:
        conn = sqlite3.connect(config["storage"]["database"])
        c = conn.cursor()
        
        # Check if question exists
        c.execute("SELECT id FROM example_questions WHERE id = ?", (question_id,))
        if not c.fetchone():
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Delete question
        c.execute("DELETE FROM example_questions WHERE id = ?", (question_id,))
        
        # Reorder remaining questions
        c.execute(
            """
            UPDATE example_questions 
            SET order_num = (
                SELECT COUNT(*) - 1 
                FROM example_questions AS eq2 
                WHERE eq2.order_num <= example_questions.order_num 
                AND eq2.id != ?
            )
            """,
            (question_id,)
        )
        
        conn.commit()
        conn.close()
        
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/settings/example-questions/reorder")
async def reorder_example_questions(
    order: List[str]
):
    """Reorder example questions"""
    try:
        conn = sqlite3.connect(config["storage"]["database"])
        c = conn.cursor()
        
        # Update order for each question
        for i, question_id in enumerate(order):
            c.execute(
                "UPDATE example_questions SET order_num = ? WHERE id = ?",
                (i, question_id)
            )
        
        conn.commit()
        conn.close()
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files (after all API routes)
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=config["server"]["host"],
        port=config["server"]["port"],
        reload=True
    ) 
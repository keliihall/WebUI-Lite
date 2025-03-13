import sqlite3
import uuid
from pathlib import Path
from ..config.settings import config

def init_db():
    """Initialize database and storage"""
    try:
        # Ensure storage directory exists
        storage_dir = Path(config.storage.chat_dir)
        storage_dir.mkdir(parents=True, exist_ok=True)

        # Ensure database directory exists
        db_path = Path(config.storage.database)
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

from fastapi import APIRouter, HTTPException
import sqlite3
from ..config import config

router = APIRouter()

@router.get("/example-questions")
async def get_example_questions():
    """Get example questions for chat suggestions"""
    try:
        conn = sqlite3.connect(config.storage.database)
        cursor = conn.cursor()
        cursor.execute("SELECT id, content, category, order_num FROM example_questions ORDER BY order_num")
        questions = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": q[0],
                "content": q[1],
                "category": q[2],
                "order_num": q[3]
            }
            for q in questions
        ]
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving example questions: {str(e)}") 
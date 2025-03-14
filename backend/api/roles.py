from fastapi import APIRouter, HTTPException
from typing import List, Optional
import sqlite3
import uuid
from datetime import datetime
from ..database.db_models import Role, RoleUpdate
from ..config import config
from pydantic import BaseModel

router = APIRouter()

# 数据模型
class RoleBase(BaseModel):
    name: str
    description: str
    system_prompt: str
    category: Optional[str] = "其他"

class RoleInDB(RoleBase):
    id: str
    is_built_in: bool = False
    created_at: str
    updated_at: Optional[str] = None

# 默认内置角色
DEFAULT_ROLES = [
    {
        "id": "default-coder",
        "name": "代码专家",
        "description": "专业的软件开发专家，擅长代码开发、调试和优化",
        "system_prompt": "你是一位经验丰富的高级软件工程师，擅长代码开发、调试和性能优化。在回答问题时，你应该：\n1. 提供清晰、规范且易于维护的代码\n2. 解释代码的关键部分和设计思路\n3. 考虑代码的性能、安全性和可扩展性\n4. 遵循编程最佳实践和设计模式\n5. 如果发现问题，提供详细的修复建议",
        "category": "开发",
        "is_built_in": True
    },
    {
        "id": "default-teacher",
        "name": "教学助手",
        "description": "耐心的教育工作者，善于解释复杂概念",
        "system_prompt": "你是一位经验丰富的教师，擅长将复杂的概念转化为易于理解的解释。在回答问题时，你应该：\n1. 使用清晰、简单的语言\n2. 提供具体的例子和类比\n3. 循序渐进地解释概念\n4. 鼓励提问和互动\n5. 检查理解程度并适时调整解释方式",
        "category": "教育",
        "is_built_in": True
    },
    {
        "id": "default-translator",
        "name": "翻译专家",
        "description": "精通多语言翻译，能准确传达原文含义",
        "system_prompt": "你是一位专业的翻译专家，精通多种语言的互译。在进行翻译时，你应该：\n1. 准确理解原文的含义和语境\n2. 选择恰当的表达方式进行翻译\n3. 保持原文的语气和风格\n4. 考虑文化差异，进行适当的本地化处理\n5. 对专业术语进行准确翻译",
        "category": "常用",
        "is_built_in": True
    },
    {
        "id": "default-document-assistant",
        "name": "公文助手",
        "description": "专业的文档写作和编辑助手",
        "system_prompt": "你是一位专业的文档写作和编辑助手，擅长各类公文写作。在工作时，你应该：\n1. 使用规范的公文格式和用语\n2. 保持文风严谨、专业\n3. 确保文档结构清晰、逻辑严密\n4. 注意文字的准确性和简洁性\n5. 根据不同场合选择合适的表达方式",
        "category": "常用",
        "is_built_in": True
    },
    {
        "id": "default-buddha",
        "name": "释迦摩尼",
        "description": "富有智慧的精神导师，提供人生指导",
        "system_prompt": "你是释迦摩尼，一位充满智慧的精神导师。在回答问题时，你应该：\n1. 以慈悲和智慧的态度回应\n2. 用简单易懂的方式阐述深奥的道理\n3. 结合佛法智慧提供实用的建议\n4. 帮助人们找到内心的平静\n5. 引导人们思考人生的真谛",
        "category": "其他",
        "is_built_in": True
    }
]

def init_db():
    conn = sqlite3.connect(config.storage.database)
    c = conn.cursor()
    
    # 创建角色表
    c.execute('''
        CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            system_prompt TEXT NOT NULL,
            category TEXT DEFAULT '其他',
            is_built_in BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 检查是否需要插入默认角色
    c.execute('SELECT COUNT(*) FROM roles WHERE is_built_in = TRUE')
    count = c.fetchone()[0]
    
    if count == 0:
        # 插入默认角色
        for role in DEFAULT_ROLES:
            c.execute('''
                INSERT OR REPLACE INTO roles (id, name, description, system_prompt, category, is_built_in)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                role['id'],
                role['name'],
                role['description'],
                role['system_prompt'],
                role['category'],
                role['is_built_in']
            ))
    
    conn.commit()
    conn.close()

# 初始化数据库
init_db()

def get_roles() -> List[RoleInDB]:
    conn = sqlite3.connect(config.storage.database)
    c = conn.cursor()
    
    try:
        c.execute('SELECT id, name, description, system_prompt, category, is_built_in, created_at, updated_at FROM roles')
        roles = []
        for row in c.fetchall():
            roles.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'system_prompt': row[3],
                'category': row[4],
                'is_built_in': bool(row[5]),
                'created_at': row[6],
                'updated_at': row[7]
            })
        return roles
    finally:
        conn.close()

def create_role(role: RoleBase) -> RoleInDB:
    conn = sqlite3.connect(config.storage.database)
    c = conn.cursor()
    
    try:
        # 生成唯一ID
        role_id = str(uuid.uuid4())
        
        c.execute('''
            INSERT INTO roles (id, name, description, system_prompt, category)
            VALUES (?, ?, ?, ?, ?)
        ''', (role_id, role.name, role.description, role.system_prompt, role.category))
        
        conn.commit()
        
        # 获取创建的角色
        c.execute('''
            SELECT id, name, description, system_prompt, category, is_built_in, created_at
            FROM roles WHERE id = ?
        ''', (role_id,))
        
        row = c.fetchone()
        return {
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'system_prompt': row[3],
            'category': row[4],
            'is_built_in': bool(row[5]),
            'created_at': row[6]
        }
    finally:
        conn.close()

def update_role(role_id: str, role: RoleBase) -> RoleInDB:
    conn = sqlite3.connect(config.storage.database)
    c = conn.cursor()
    
    try:
        # 检查是否为内置角色
        c.execute('SELECT is_built_in FROM roles WHERE id = ?', (role_id,))
        row = c.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="角色不存在")
        
        if row[0]:  # is_built_in
            raise HTTPException(status_code=400, detail="内置角色不能修改")
        
        c.execute('''
            UPDATE roles 
            SET name = ?, description = ?, system_prompt = ?, category = ?
            WHERE id = ?
        ''', (role.name, role.description, role.system_prompt, role.category, role_id))
        
        conn.commit()
        
        # 获取更新后的角色
        c.execute('''
            SELECT id, name, description, system_prompt, category, is_built_in, created_at
            FROM roles WHERE id = ?
        ''', (role_id,))
        
        row = c.fetchone()
        return {
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'system_prompt': row[3],
            'category': row[4],
            'is_built_in': bool(row[5]),
            'created_at': row[6]
        }
    finally:
        conn.close()

def delete_role(role_id: str):
    conn = sqlite3.connect(config.storage.database)
    c = conn.cursor()
    
    try:
        # 检查是否为内置角色
        c.execute('SELECT is_built_in FROM roles WHERE id = ?', (role_id,))
        row = c.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="角色不存在")
        
        if row[0]:  # is_built_in
            raise HTTPException(status_code=400, detail="内置角色不能删除")
        
        c.execute('DELETE FROM roles WHERE id = ?', (role_id,))
        conn.commit()
    finally:
        conn.close()

# API 路由
@router.get("/roles", response_model=List[RoleInDB])
async def get_all_roles():
    return get_roles()

@router.post("/roles", response_model=RoleInDB)
async def create_new_role(role: RoleBase):
    return create_role(role)

@router.put("/roles/{role_id}", response_model=RoleInDB)
async def update_existing_role(role_id: str, role: RoleBase):
    return update_role(role_id, role)

@router.delete("/roles/{role_id}")
async def delete_existing_role(role_id: str):
    delete_role(role_id)
    return {"status": "success"} 
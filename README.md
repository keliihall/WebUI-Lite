# CYNEU WebUI

![version](https://img.shields.io/badge/version-v0.0.2-blue.svg)
![python](https://img.shields.io/badge/python-3.8+-blue.svg)
![fastapi](https://img.shields.io/badge/fastapi-0.104.1-green.svg)
![ollama](https://img.shields.io/badge/ollama-0.1.17-blue.svg)
![platform](https://img.shields.io/badge/platform-linux%20%7C%20macos%20%7C%20windows-lightgrey)
![license](https://img.shields.io/badge/license-MIT-green.svg)

一个轻量级的 Ollama Web 界面，支持实时对话、代码高亮和 Markdown 渲染。基于 FastAPI 和 Alpine.js 构建，提供流畅的用户体验和丰富的功能。

## 更新日志

### v0.0.2 (2025-03-14)
- 优化了日志输出，减少调试信息
- 修复了深色模式状态管理问题
- 改进了网站图标处理
- 优化了代码结构

### v0.0.1.1 (2025-03-13)
- 优化了用户信息区域的显示
- 调整了版本号显示位置和样式
- 改进了界面布局和用户体验

### v0.0.1 (2025-03-11)
- 初始版本发布
- 实现基本的对话功能
- 支持多种大语言模型
- Markdown 渲染和代码高亮
- 深色模式支持

[English](./README_EN.md) | 简体中文 | [更新日志](./CHANGELOG.md) | [贡献指南](./CONTRIBUTING.md)

## 在线演示

访问 [在线演示](https://github.com/keliihall/WebUI-Lite) 体验最新版本。

## 快速开始

### 使用 Docker（推荐）

```bash
docker pull keliihall/webui-lite:v0.0.1

# 运行容器
docker run -d \
  --name webui-lite \
  -p 8080:8080 \
  -v ./storage:/app/backend/storage \
  -e OLLAMA_HOST=http://localhost:11434 \
  keliihall/webui-lite:v0.0.1
```

### 本地部署

1. 克隆项目：
```bash
git clone https://github.com/keliihall/WebUI-Lite.git
cd WebUI-Lite
```

2. 安装依赖：
```bash
# 安装后端依赖
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
.\venv\Scripts\activate  # Windows

cd backend
pip install -r requirements.txt
```

3. 启动后端服务：
```bash
# 确保在项目根目录下
cd webui-lite  # 如果不在项目根目录

# 启动后端服务
# MacOS/Linux 用户：
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8080

# 如果端口 8080 被占用，可以使用其他端口，例如：
# python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

# Windows 用户：
# 在 PowerShell 中：
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8080
# 或在 CMD 中：
# python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8080

# 常见问题处理：
# 1. 如果提示端口被占用，可以先查找占用进程：
#    - MacOS/Linux: lsof -i :8080
#    - Windows: netstat -ano | findstr :8080
# 2. 终止占用进程：
#    - MacOS/Linux: kill <进程ID>
#    - Windows: taskkill /F /PID <进程ID>
```

4. 启动前端服务：
```bash
# 新开一个终端，在项目根目录下
npm install
npm run dev
```

5. 访问界面：
- 前端界面：打开浏览器访问 `http://localhost:5173`
- 后端API：`http://localhost:8080`

注意：确保 Ollama 服务已经在本地运行（默认地址：`http://localhost:11434`）

## 主要特性

### 核心功能
- 🚀 轻量快速：基于 Alpine.js 和 FastAPI 构建
- 🔄 实时交互：流式对话响应，即时反馈
- 🎨 优雅界面：响应式设计，深色模式支持
- 🛠️ 功能丰富：多模型切换，对话管理
- 💾 可靠存储：SQLite + 文件系统双重存储
- 🔐 安全可控：完善的错误处理，CORS 保护

### 技术特点
- 前端：Alpine.js + Tailwind CSS
- 后端：FastAPI + SQLite
- 存储：文件系统（Markdown）+ SQLite
- 部署：Docker 支持，环境变量配置

## 配置说明

### 环境变量
- `OLLAMA_HOST`: Ollama 服务器地址
- `SERVER_HOST`: WebUI 服务器地址
- `SERVER_PORT`: WebUI 服务器端口
- `STORAGE_PATH`: 存储目录路径

### 配置文件
```yaml
ollama:
  host: "http://localhost:11434"

storage:
  chat_dir: "./storage/chats"
  database: "./storage/database.db"

server:
  host: "localhost"
  port: 8080
  cors_origins: ["*"]
```

## 开发指南

### 目录结构
```
webui-lite/
├── frontend/                 # 前端代码
│   ├── src/                 # 源代码目录
│   │   ├── components/     # 组件目录
│   │   │   ├── Chat/      # 聊天相关组件
│   │   │   ├── Settings/  # 设置相关组件
│   │   │   └── shared/    # 共享组件
│   │   ├── config/        # 配置文件
│   │   │   └── index.js   # 主配置文件
│   │   ├── store/         # 状态管理
│   │   │   ├── chat.js    # 聊天状态管理
│   │   │   └── settings.js # 设置状态管理
│   │   ├── utils/         # 工具函数
│   │   │   ├── api.js     # API 请求封装
│   │   │   ├── error.js   # 错误处理
│   │   │   ├── markdown.js # Markdown 渲染
│   │   │   └── sidebar.js  # 侧边栏工具
│   │   └── styles/        # 样式文件
│   │       └── main.css   # 主样式文件
│   ├── index.html         # 主页面
│   └── settings.html      # 设置页面
│
├── backend/                # 后端代码
│   ├── api/               # API 路由
│   │   ├── __init__.py   # API 路由初始化
│   │   ├── chat.py       # 聊天相关 API
│   │   ├── models.py     # 模型相关 API
│   │   ├── settings.py   # 设置相关 API
│   │   └── example_questions.py # 示例问题 API
│   ├── config/           # 配置管理
│   │   ├── __init__.py   # 配置初始化
│   │   ├── config_models.py # 配置模型定义
│   │   └── settings.py   # 配置加载和管理
│   ├── core/             # 核心功能
│   │   ├── __init__.py   # 核心模块初始化
│   │   ├── chat.py       # 聊天核心功能
│   │   └── ollama.py     # Ollama 服务交互
│   ├── database/         # 数据库相关
│   │   ├── __init__.py   # 数据库模块初始化
│   │   ├── db_models.py  # 数据库模型定义
│   │   └── init.py       # 数据库初始化
│   ├── utils/            # 工具函数
│   │   ├── __init__.py   # 工具模块初始化
│   │   ├── security.py   # 安全相关工具
│   │   └── stream.py     # 流式响应工具
│   ├── storage/          # 数据存储
│   │   ├── chats/       # 聊天记录存储
│   │   └── database.db   # SQLite 数据库
│   ├── app.py           # 应用入口
│   ├── config.yaml      # 应用配置文件
│   └── requirements.txt  # Python 依赖
│
├── package.json          # 前端依赖配置
├── vite.config.js       # Vite 构建配置
├── tailwind.config.cjs  # Tailwind CSS 配置
├── postcss.config.cjs   # PostCSS 配置
└── README.md            # 项目说明文档

```

## 主要组件说明

### 前端组件

- **Chat 组件**: 实现聊天界面的核心组件
  - `ChatInput`: 处理用户输入和消息发送
  - `ChatMessage`: 渲染聊天消息，支持 Markdown 和代码高亮

- **Sidebar 组件**: 侧边栏功能
  - `ModelSelector`: 语言模型选择器

- **共享组件**: 通用功能组件
  - `DarkModeToggle`: 深色模式切换
  - `LoadingIndicator`: 加载状态指示

### 后端模块

- **API 模块**: 处理 HTTP 请求
  - `chat.py`: 聊天相关的 API 端点
  - `models.py`: 模型管理 API
  - `example_questions.py`: 示例问题管理

- **配置模块**: 应用配置管理
  - `config_models.py`: 配置数据模型
  - `settings.py`: 配置加载和管理

- **核心模块**: 业务逻辑实现
  - `chat.py`: 聊天功能实现
  - `ollama.py`: Ollama 服务交互

- **数据库模块**: 数据持久化
  - `db_models.py`: 数据库模型定义
  - `init.py`: 数据库初始化和迁移

- **工具模块**: 通用工具函数
  - `security.py`: 安全相关功能
  - `stream.py`: 流式响应处理

## 配置文件

- `config.yaml`: 后端配置文件，包含服务器设置、Ollama 配置等
- `package.json`: 前端依赖配置
- `vite.config.js`: Vite 构建工具配置
- `tailwind.config.cjs`: Tailwind CSS 配置
- `postcss.config.cjs`: PostCSS 配置

## 数据存储

- `storage/chats/`: 聊天记录存储目录
- `storage/database.db`: SQLite 数据库文件，存储用户、聊天和配置数据

## 贡献指南

欢迎贡献代码！请查看 [贡献指南](./CONTRIBUTING.md) 了解详情。

## 更新日志

查看 [更新日志](./CHANGELOG.md) 了解版本更新历史。

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

## 联系方式

- GitHub Issues: [提交问题](https://github.com/keliihall/WebUI-Lite/issues)
- 作者: keliihall

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=keliihall/WebUI-Lite&type=Date)](https://star-history.com/#keliihall/WebUI-Lite&Date)

## 开发环境设置

### 前置要求

- Python 3.9+
- Node.js 16+
- Ollama

### 后端设置

```bash
# 创建并激活虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
.\venv\Scripts\activate  # Windows

# 安装后端依赖
cd backend
pip install -r requirements.txt

# 启动后端服务器
uvicorn app:app --reload --host 0.0.0.0 --port 8080
```

### 前端设置

```bash
# 安装前端依赖
npm install

# 启动开发服务器
npm run dev
```

### 配置说明

1. 后端配置 (`backend/config.yaml`):
```yaml
ollama:
  host: "http://localhost:11434"  # Ollama 服务地址
storage:
  chat_dir: "./storage/chats"     # 聊天记录存储路径
  database: "./storage/database.db" # 数据库文件路径
server:
  host: "localhost"               # 服务器主机
  port: 8080                     # 服务器端口
  cors_origins:                  # CORS 配置
    - "http://localhost:5173"
```

2. 前端配置 (`frontend/src/config/index.js`):
```javascript
export default {
    api: {
        baseUrl: 'http://localhost:8080'  // 后端 API 地址
    },
    models: {
        default: 'DeepSeek-rl：1.5b',    // 默认模型
        available: ['DeepSeek-rl：1.5b', 'Claude 3', 'GPT-4', 'Gemini Pro']
    },
    ui: {
        defaultSidebarWidth: 256,        // 侧边栏默认宽度
        maxMessageLength: 4000,          // 最大消息长度
        maxTitleLength: 50              // 最大标题长度
    },
    chat: {
        maxExampleQuestions: 5,         // 最大示例问题数
        defaultTitle: '新对话'          // 默认对话标题
    }
}
```

## 功能特性

- 💬 实时对话功能
- 🎨 支持深色/浅色主题
- 📝 Markdown 渲染
- 🖥️ 代码高亮显示
- 📚 聊天历史管理
- 🔄 流式响应
- 🎯 示例问题建议
- 🛠️ 可配置的模型选择

## 浏览器支持

- Chrome/Edge >= 79
- Firefox >= 67
- Safari >= 14
- Opera >= 66
# WebUI-Lite

![version](https://img.shields.io/badge/version-v0.0.1-blue.svg)
![python](https://img.shields.io/badge/python-3.8+-blue.svg)
![fastapi](https://img.shields.io/badge/fastapi-0.104.1-green.svg)
![ollama](https://img.shields.io/badge/ollama-0.1.17-blue.svg)
![platform](https://img.shields.io/badge/platform-linux%20%7C%20macos%20%7C%20windows-lightgrey)
![license](https://img.shields.io/badge/license-MIT-green.svg)

一个轻量级的 Ollama Web 界面，支持实时对话、代码高亮和 Markdown 渲染。基于 FastAPI 和 Alpine.js 构建，提供流畅的用户体验和丰富的功能。

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
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
.\venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

3. 启动服务：
```bash
cd backend
python main.py
```

4. 访问界面：
打开浏览器访问 `http://localhost:8080`

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
├── backend/
│   ├── storage/
│   ├── config.yaml
│   └── main.py
├── index.html
├── requirements.txt
├── README.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```

### 开发环境设置
```bash
# 克隆项目
git clone https://github.com/keliihall/WebUI-Lite.git
cd WebUI-Lite

# 安装依赖
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 启动开发服务器
cd backend
python main.py
```

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
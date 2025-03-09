# 贡献指南

感谢您对 Ollama WebUI Lite 项目的关注！我们欢迎各种形式的贡献，包括但不限于功能改进、bug 修复、文档完善等。

## 如何贡献

### 1. 提交 Issue
- 发现 bug 请提交详细的复现步骤
- 新功能建议请详细描述需求和使用场景
- 提交前请先搜索相关 issue，避免重复

### 2. Pull Request
1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request

### 3. 开发规范

#### 代码风格
- Python 代码遵循 PEP 8 规范
- JavaScript 代码使用 ES6+ 特性
- HTML/CSS 遵循 BEM 命名规范

#### 提交规范
提交信息请遵循以下格式：
- feat: 新功能
- fix: 修复问题
- docs: 文档变更
- style: 代码格式修改
- refactor: 代码重构
- test: 测试用例修改
- chore: 其他修改

示例：`feat: 添加深色模式支持`

#### 分支管理
- main: 主分支，保持稳定
- develop: 开发分支
- feature/*: 特性分支
- fix/*: 修复分支

### 4. 开发流程

1. 环境配置
```bash
# 克隆仓库
git clone <your-fork-url>
cd webui-lite

# 安装依赖
pip install -r requirements.txt
```

2. 运行测试
```bash
# 运行后端测试
python -m pytest

# 运行前端测试
npm test  # 如果有前端测试
```

3. 本地开发
```bash
# 启动开发服务器
cd backend
python main.py
```

### 5. 注意事项

- 保持代码简洁，遵循单一职责原则
- 添加必要的注释和文档
- 确保提交前完成充分测试
- 不要提交敏感信息
- 遵循开源协议

## 联系我们

如有任何问题，欢迎通过 Issue 或邮件联系我们。

感谢您的贡献！ 
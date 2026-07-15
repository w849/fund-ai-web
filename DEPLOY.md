# 部署文档

## 目录

- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Secrets 配置](#secrets-配置)
- [Docker 部署](#docker-部署)
- [PM2 部署](#pm2-部署)
- [Nginx 配置](#nginx-配置)
- [环境变量说明](#环境变量说明)
- [数据库与缓存](#数据库与缓存)
- [部署验证](#部署验证)
- [故障排查](#故障排查)

---

## 环境要求

| 组件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18.0.0 | 运行环境 |
| npm | >= 9.0.0 | 包管理器 |
| Redis | >= 7.x | 缓存（可选，不可用时自动降级到 node-cache） |
| PM2 | latest | 进程管理（推荐） |
| Nginx | >= 1.20 | 反向代理（生产环境推荐） |

## 快速部署

### 1. 服务器初始化

```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
npm install -g pm2

# 安装 Nginx
sudo apt-get install -y nginx

# 安装 Redis（可选）
sudo apt-get install -y redis-server
```

### 2. 克隆代码

```bash
git clone https://github.com/your-org/fund-ai-web.git
cd fund-ai-web
```

### 3. 配置环境变量

```bash
cd server
cp .env.example .env
# 编辑 .env 填入配置
vim .env
```

### 4. 安装依赖并构建

```bash
# 使用项目自带的部署脚本
bash deploy/deploy.sh production
```

### 5. 配置 Nginx

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/fund-ai-web
sudo ln -s /etc/nginx/sites-available/fund-ai-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## GitHub Actions CI/CD

项目使用 GitHub Actions 实现完整的 CI/CD 流水线。

### 工作流文件

| 文件 | 触发条件 | 功能 |
|------|---------|------|
| `.github/workflows/ci.yml` | push/PR 到 main/dev | 代码检查 + 单元测试 + E2E 测试 + 构建验证 |
| `.github/workflows/deploy.yml` | 打 tag (v*) 或手动触发 | SSH 部署到服务器 + 健康检查 + 通知 |
| `.github/workflows/docker-deploy.yml` | 打 tag (v*) | Docker 镜像构建 + 推送 |

### CI 流水线（ci.yml）

触发条件：
- `push` 到 `main` / `master` / `dev` 分支
- `pull_request` 到 `main` / `master` 分支

执行步骤：
1. **Lint** — ESLint 代码质量检查
2. **Test** — 后端 Jest 测试 + 前端 Vitest 测试 + 覆盖率报告
3. **E2E** — Playwright 端到端测试
4. **Build** — 前端生产构建验证

### CD 流水线（deploy.yml）

触发条件：
- 推送 tag `v*.*.*`（如 `v1.0.0`）
- 手动触发（`workflow_dispatch`）

执行步骤：
1. **Release** — 自动生成 GitHub Release 和 Release Notes
2. **Build** — 安装依赖 + 构建前端
3. **Deploy** — SSH 连接到服务器，拉取代码，执行部署脚本
4. **Health Check** — 轮询 `/api/health` 验证部署成功
5. **Notification** — 企业微信/钉钉部署通知

---

## Secrets 配置

在 GitHub 仓库 Settings → Secrets and variables → Actions 中配置：

### 部署相关（必需）

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `DEPLOY_HOST` | 服务器 IP 或域名 | `123.456.789.0` |
| `DEPLOY_USER` | SSH 用户名 | `ubuntu` |
| `DEPLOY_SSH_KEY` | SSH 私钥（PEM 格式） | `-----BEGIN OPENSSH PRIVATE KEY-----\n...` |
| `DEPLOY_PATH` | 项目部署路径 | `/var/www/fund-ai-web` |
| `DEPLOY_PORT` | SSH 端口（可选，默认 22） | `22` |

### 通知相关（可选）

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `WECOM_WEBHOOK_URL` | 企业微信 Webhook 地址 | `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx` |
| `DINGTALK_WEBHOOK_URL` | 钉钉 Webhook 地址 | `https://oapi.dingtalk.com/robot/send?access_token=xxx` |

### Docker 相关（可选）

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `DOCKER_REGISTRY` | 容器镜像仓库地址 | `ghcr.io` 或 `registry.cn-hangzhou.aliyuncs.com` |
| `DOCKER_USERNAME` | 镜像仓库用户名 | `your-username` |
| `DOCKER_PASSWORD` | 镜像仓库密码/Token | `ghp_xxx` 或 Docker Hub Token |

---

## Docker 部署

### 构建镜像

```bash
# 构建镜像
docker build -t fund-ai-web:latest .

# 查看镜像
docker images | grep fund-ai-web
```

### 使用 docker-compose 启动

```bash
# 启动全套服务（应用 + Redis）
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### 环境变量配置

创建 `.env` 文件：

```bash
# docker-compose 环境变量
CORS_ORIGIN=http://your-domain.com
DEEPSEEK_API_KEY=sk-your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
REDIS_PASSWORD=your_redis_password
LOG_LEVEL=info
```

### 注意事项

- 数据卷 `app-data` 持久化基金数据到宿主机
- 日志卷 `app-logs` 持久化应用日志
- Redis 数据通过 `redis-data` 卷持久化
- 应用依赖 Redis 健康检查通过后才启动

---

## PM2 部署

### 启动应用

```bash
cd deploy
pm2 start ecosystem.config.js
pm2 save
```

### 进程管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs fund-ai-server

# 重启
pm2 restart fund-ai-server

# 停止
pm2 stop fund-ai-server

# 监控
pm2 monit
```

### 开机自启

```bash
pm2 startup
# 按提示执行生成的命令
```

---

## Nginx 配置

参考 `deploy/nginx.conf`，关键配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /var/www/fund-ai-web/client/dist;
    index index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 代理（如需实时行情）
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # 前端路由 SPA 支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `PORT` | 否 | 3000 | 服务端口 |
| `NODE_ENV` | 否 | development | 运行环境 |
| `CORS_ORIGIN` | 是（生产） | * | CORS 允许的源，逗号分隔 |
| `DEEPSEEK_API_KEY` | 否 | - | DeepSeek API Key（不配置则自动降级） |
| `DEEPSEEK_BASE_URL` | 否 | https://api.deepseek.com | DeepSeek API 地址 |
| `REDIS_HOST` | 否 | 127.0.0.1 | Redis 主机（留空则使用 node-cache） |
| `REDIS_PORT` | 否 | 6379 | Redis 端口 |
| `REDIS_PASSWORD` | 否 | - | Redis 密码 |
| `REDIS_DB` | 否 | 0 | Redis 数据库编号 |
| `LOG_LEVEL` | 否 | dev | 日志级别：dev/info/warn/error/silent |
| `CACHE_TTL` | 否 | 300 | 缓存过期时间（秒） |

---

## 部署验证

### 健康检查

```bash
# 检查服务是否正常运行
curl http://localhost:3000/api/health

# 预期返回
# {"code":200,"data":{"status":"ok","uptime":123.45,"redis":"disconnected"},"msg":"服务运行正常"}
```

### 验证前端

```bash
# 检查前端是否正常加载
curl -s -o /dev/null -w "%{http_code}" http://localhost:80/

# 返回 200 表示正常
```

### 验证 API

```bash
# 查看 API 日志
pm2 logs fund-ai-server

# 测试基金列表接口
curl http://localhost:3000/api/funds?limit=3
```

---

## 故障排查

### 服务无法启动

1. 检查端口是否被占用
   ```bash
   netstat -tlnp | grep 3000
   ```

2. 检查环境变量配置
   ```bash
   cd server && node -e "require('dotenv').config(); console.log(process.env.PORT)"
   ```

3. 查看日志
   ```bash
   pm2 logs fund-ai-server --lines 50
   ```

### Redis 连接失败

- 检查 Redis 是否运行：`redis-cli ping`
- 检查 `REDIS_HOST` 和 `REDIS_PORT` 配置
- 系统会自动降级到 node-cache，不影响核心功能

### 前端 404

- 检查 Nginx `try_files` 配置是否正确
- 确认 `root` 指向 `client/dist` 目录
- 重新构建前端：`cd client && npm run build`

### PM2 相关

```bash
# 进程列表
pm2 list

# 查看详细错误
pm2 show fund-ai-server

# 重置计数器
pm2 reset fund-ai-server
```

# ==========================================
# AI 智能选基金 - Docker 多阶段构建
# ==========================================

# ---- 第一阶段：构建前端 ----
FROM node:18-alpine AS builder

WORKDIR /app

# 安装前端依赖
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

# 构建前端
COPY client/ ./client/
RUN cd client && npm run build

# ---- 第二阶段：运行后端 ----
FROM node:18-alpine AS runner

WORKDIR /app

# 安装系统依赖（如需）
RUN apk add --no-cache tini

# 复制后端代码
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --production

COPY server/ ./server/

# 复制前端构建产物
COPY --from=builder /app/client/dist ./client/dist

# 创建数据目录和日志目录
RUN mkdir -p /app/server/data /app/server/logs

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 使用 tini 作为 init 进程
ENTRYPOINT ["/sbin/tini", "--"]

# 启动服务
CMD ["node", "server/src/app.js"]

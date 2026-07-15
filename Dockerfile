# ========== 构建阶段：编译前端 ==========
FROM node:18-alpine AS builder

WORKDIR /build

# 安装前端依赖
COPY client/package*.json client/
RUN cd client && npm ci

# 复制前端源码并构建
COPY client/ client/
RUN cd client && npm run build

# ========== 运行阶段 ==========
FROM node:18-alpine

WORKDIR /app

# 安装生产依赖
COPY server/package*.json server/
RUN cd server && npm ci --only=production

# 复制后端源码
COPY server/ server/

# 复制前端构建产物
COPY --from=builder /build/client/dist /app/client/dist

EXPOSE 3000

WORKDIR /app/server
CMD ["node", "src/app.js"]

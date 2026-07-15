#!/bin/bash

# AI 智能选基金 - 部署脚本
# 用法: ./deploy/deploy.sh [environment]

set -e

ENV=${1:-production}
PROJECT_DIR="/var/www/fund-ai-web"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${PROJECT_DIR}/backups/${TIMESTAMP}"

echo "========================================="
echo "  AI 智能选基金 - 部署脚本"
echo "  环境: ${ENV}"
echo "  时间: $(date)"
echo "========================================="

# 1. 进入项目目录
cd "${PROJECT_DIR}"

# 2. 备份当前版本
echo "[1/5] 备份当前版本..."
mkdir -p "${BACKUP_DIR}"
cp -r client/dist "${BACKUP_DIR}/client-dist" 2>/dev/null || true
cp -r server/node_modules "${BACKUP_DIR}/server-node_modules" 2>/dev/null || true

# 3. 安装后端依赖
echo "[2/5] 安装后端依赖..."
cd "${PROJECT_DIR}/server"
npm install --production

# 4. 构建前端
echo "[3/5] 构建前端..."
cd "${PROJECT_DIR}/client"
npm install
npm run build

# 5. 配置环境变量
echo "[4/5] 配置环境变量..."
cd "${PROJECT_DIR}/server"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  .env 文件已从 .env.example 创建，请修改配置"
fi

# 6. 重启服务
echo "[5/5] 重启服务..."
if command -v pm2 &> /dev/null; then
  pm2 startOrRestart "${PROJECT_DIR}/deploy/ecosystem.config.js" --env ${ENV}
  pm2 save
else
  echo "  pm2 未安装，尝试使用 node 直接启动..."
  # 使用 npx 或直接重启
  cd "${PROJECT_DIR}/server"
  npx pm2 startOrRestart "${PROJECT_DIR}/deploy/ecosystem.config.js" --env ${ENV} || {
    echo "  警告: pm2 不可用，请手动启动服务"
    echo "  命令: cd server && node src/app.js"
  }
fi

echo "========================================="
echo "  部署完成！"
echo "  前端: http://localhost"
echo "  API:  http://localhost/api/health"
echo "========================================="

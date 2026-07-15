#!/bin/bash
# Fund AI Web - 一键部署脚本（在服务器上运行）
# 使用方法: bash deploy.sh

set -e

echo "========================================"
echo "  Fund AI Web - 部署脚本"
echo "========================================"

# 1. 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "[1/5] 安装 Docker..."
    curl -fsSL https://get.docker.com | bash
    sudo usermod -aG docker $USER
    echo "  Docker 安装完成，请重新登录或执行 'newgrp docker' 后继续"
else
    echo "[1/5] Docker 已安装 ✓"
fi

# 2. 检查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "  安装 Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi
echo "[2/5] Docker Compose 就绪 ✓"

# 3. 检查项目文件是否存在
if [ ! -f "docker-compose.yml" ]; then
    echo "[错误] 未找到 docker-compose.yml"
    echo "请确认脚本在项目根目录（fund-ai-web/）下运行"
    exit 1
fi
echo "[3/5] 项目文件检查通过 ✓"

# 4. 提示用户配置环境变量
echo "[4/5] 环境变量配置"
echo "----------------------------------------"
echo "请先编辑 docker-compose.yml，将以下占位符替换为实际值："
echo "  <YOUR_SERVER_IP>    - 替换为你的服务器公网 IP"
echo "  <YOUR_DEEPSEEK_API_KEY> - 替换为你的 DeepSeek API Key"
echo "----------------------------------------"
read -p "是否已完成配置？(y/n): " confirmed
if [ "$confirmed" != "y" ] && [ "$confirmed" != "Y" ]; then
    echo "请先编辑 docker-compose.yml，然后重新运行此脚本"
    exit 1
fi

# 5. 启动服务
echo "[5/5] 构建并启动服务..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "  访问地址: http://<服务器IP>:3000"
echo "  健康检查: http://<服务器IP>:3000/api/health"
echo ""

# 显示容器状态
docker compose ps

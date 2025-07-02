#!/bin/bash

# 团队工时管理系统 - Vercel部署脚本

echo "🚀 开始部署团队工时管理系统到Vercel..."

# 检查是否安装了git
if ! command -v git &> /dev/null; then
    echo "❌ 错误: 请先安装Git"
    exit 1
fi

# 检查是否安装了vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装Vercel CLI..."
    npm install -g vercel
fi

# 初始化git仓库（如果还没有）
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
    git add .
    git commit -m "Initial commit: Team Timesheet Management System"
fi

# 部署到Vercel
echo "🌐 部署到Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo ""
echo "📱 访问地址："
echo "   主页 (Element Plus版本): https://your-project.vercel.app/"
echo "   Vue基础版本: https://your-project.vercel.app/vue"
echo "   原生JS版本: https://your-project.vercel.app/old"
echo ""
echo "🎉 享受你的团队工时管理系统吧！"

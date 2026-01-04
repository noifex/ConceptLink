#!/bin/bash

echo "🐳 Docker Composeで起動中..."
echo ""

# 初回ビルド（-d = バックグラウンド）
docker-compose up --build -d

echo ""
echo "⏳ サービスの起動を待機中..."
echo "   データベース → バックエンド → フロントエンド"
echo ""

# ログをフォロー（Ctrl+Cで抜ける）
docker-compose logs -f
#!/bin/bash

echo "🚀 並列起動中..."

# 全部同時に起動
docker start mysql-multilang &
(cd backend && ./gradlew bootRun) &
(cd frontend && npm run dev) &

# 最も遅いものを待つだけ
echo "⏳ 起動完了を待機中..."
sleep 15  # Spring Boot（最も遅い）を待つ

echo "✅ 起動完了！"

#!/bin/bash

echo "🗑️  全てのコンテナ・ボリュームを削除中..."
docker-compose down -v

echo "✅ クリーンアップ完了"
echo "⚠️  データベースの内容も削除されました"
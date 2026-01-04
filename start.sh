#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "多言語概念管理システム 起動中..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# カレントディレクトリを保存
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 1. MySQLコンテナを起動
echo " [1/3] MySQL起動中..."
if docker ps -a --format '{{.Names}}' | grep -q "^mysql-multilang$"; then
    docker start mysql-multilang > /dev/null 2>&1
    echo "   ✓ 既存のMySQLコンテナを起動しました"
else
    docker run -d \
      --name mysql-multilang \
      -e MYSQL_ROOT_PASSWORD=password \
      -e MYSQL_DATABASE=multilang_memo \
      -p 3306:3306 \
      mysql:8.0 > /dev/null 2>&1
    echo "   ✓ 新しいMySQLコンテナを作成しました"
fi

# MySQLの起動を待つ
echo " MySQLの起動を待機中..."
sleep 8

# 2. バックエンドを起動
echo ""
echo "🔧 [2/3] バックエンド起動中..."
cd "$SCRIPT_DIR/backend"
./gradlew bootRun > /dev/null 2>&1 &
BACKEND_PID=$!
echo "   ✓ Spring Boot起動中（PID: $BACKEND_PID）"

# バックエンドの起動を待つ
echo " バックエンドの起動を待機中（約15秒）..."
sleep 15

# 3. フロントエンドを起動
echo ""
echo " [3/3] フロントエンド起動中..."
cd "$SCRIPT_DIR/frontend"
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
echo "   ✓ Vite起動中（PID: $FRONTEND_PID）"

sleep 3

# 起動完了
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 起動完了！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " ブラウザで以下を開いてください："
echo "   → http://localhost:5173"
echo ""
echo " 終了するには："
echo "   → Ctrl+C を押してください"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# クリーンアップ関数
cleanup() {
    echo ""
    echo " シャットダウン中..."
    echo " フロントエンド停止中..."
    kill $FRONTEND_PID 2>/dev/null
    echo " バックエンド停止中..."
    kill $BACKEND_PID 2>/dev/null
    echo " MySQL停止中..."
    docker stop mysql-multilang > /dev/null 2>&1
    echo "全てのサービスを停止しました"
    exit 0
}

# Ctrl+C を捕捉
trap cleanup INT TERM

# 待機
wait
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 多言語概念管理システム 起動中..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. MySQL (Docker)
echo "[1/3] MySQL起動中..."
if docker ps -a --format '{{.Names}}' | grep -q "^mysql-multilang$"; then
    docker start mysql-multilang > /dev/null 2>&1
    echo "  ✓ 既存のMySQLコンテナを起動しました"
else
    docker run -d \
      --name mysql-multilang \
      -e MYSQL_ROOT_PASSWORD=password \
      -e MYSQL_DATABASE=multilang_memo \
      -p 3306:3306 \
      mysql:8.0 > /dev/null 2>&1
    echo "  ✓ 新しいMySQLコンテナを作成しました"
fi

echo "  MySQLの起動を待機中..."
sleep 8

# 2. バックエンド — 新しいTerminalウィンドウで起動（ログが見える）
echo ""
echo "[2/3] バックエンド用Terminalを開いています..."
osascript -e "
tell application \"Terminal\"
    do script \"echo '=== Backend (Spring Boot) ===' && cd '$SCRIPT_DIR/backend' && ./gradlew bootRun\"
    set bounds of front window to {0, 0, 900, 700}
end tell
"
echo "  ✓ バックエンドTerminalを起動しました"

# バックエンドの起動を待つ
echo "  バックエンドの起動を待機中（約15秒）..."
sleep 15

# 3. フロントエンド — 新しいTerminalウィンドウで起動（ログが見える）
echo ""
echo "[3/3] フロントエンド用Terminalを開いています..."
osascript -e "
tell application \"Terminal\"
    do script \"echo '=== Frontend (Vite) ===' && cd '$SCRIPT_DIR/frontend' && npm run dev\"
    set bounds of front window to {920, 0, 1820, 400}
end tell
"
echo "  ✓ フロントエンドTerminalを起動しました"

sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 起動完了！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " ブラウザ:    http://localhost:5173"
echo " Backend:     http://localhost:8080"
echo ""
echo " ログは各Terminalウィンドウで確認できます"
echo ""
echo " 終了するには:"
echo "   → Ctrl+C を押してください（MySQL停止）"
echo "   → 各TerminalウィンドウはCtrl+Cで個別に停止"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# クリーンアップ: MySQLのみ停止（各Terminalは手動で閉じる）
cleanup() {
    echo ""
    echo " MySQL停止中..."
    docker stop mysql-multilang > /dev/null 2>&1
    echo " MySQLを停止しました"
    echo " Backend/FrontendのTerminalウィンドウは手動でCtrl+Cしてください"
    exit 0
}

trap cleanup INT TERM

wait

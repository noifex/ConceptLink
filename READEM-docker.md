# 多言語概念管理システム - Docker版

## 必要なもの

- Docker Desktop
- 5GB以上の空きディスク

## 起動方法

### 1. 初回起動
```bash
./start-docker.sh
```

または
```bash
docker-compose up --build -d
```

### 2. ブラウザで開く

http://localhost

### 3. 停止
```bash
./stop-docker.sh
```

または
```bash
docker-compose down
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `docker-compose up -d` | バックグラウンドで起動 |
| `docker-compose logs -f` | ログを表示 |
| `docker-compose ps` | 状態確認 |
| `docker-compose down` | 停止 |
| `docker-compose down -v` | 停止+データ削除 |

## トラブルシューティング

### ポートが使用中
```bash
# 使用中のポートを確認
lsof -i :80
lsof -i :8080
lsof -i :3306

# 他のプロセスを停止してから再起動
```

### データベースをリセット
```bash
./clean-docker.sh
./start-docker.sh
```

## アーキテクチャ
```
┌─────────────┐
│  Browser    │
└──────┬──────┘
       │ :80
       ↓
┌─────────────┐
│  Frontend   │ (Nginx + React)
│  Container  │
└──────┬──────┘
       │ :8080
       ↓
┌─────────────┐
│  Backend    │ (Spring Boot)
│  Container  │
└──────┬──────┘
       │ :3306
       ↓
┌─────────────┐
│  Database   │ (MySQL)
│  Container  │
└─────────────┘
```
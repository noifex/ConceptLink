# 多言語概念管理システム

多言語学習者のための概念ベース語彙管理システム。直接翻訳ではなく、普遍的な概念を通じて複数言語の単語を整理します。



## 特徴

-  **多言語対応**: 共通の概念を通じて複数言語の単語を紐付け
-  **リアルタイム検索**: Conceptメモと単語エントリの即時全文検索
-  **直感的UI**: Material-UIによるモダンなカードベースインターフェース
-  **1コマンドデプロイ**: 設定不要のDocker Compose
-  **パフォーマンス最適化**: N+1問題解決済み、100ms以下の応答時間
-  **完全CRUD**: 作成・読取・更新・削除の完全実装

##  クイックスタート

### 必要環境

- Docker Desktop
- 5GB以上の空きディスク

### インストール
```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/multilang-memo.git
cd multilang-memo

# Docker Composeで起動
docker-compose up -d

# ブラウザで開く
open http://localhost
```

### 停止
```bash
docker-compose down
```

##  使い方

1. **Concept作成**: 「新規Concept作成」をクリック
2. **Word追加**: Conceptをクリック → 「+ 新規Word追加」
3. **検索**: 検索ボックスで即座に検索
4. **編集・削除**: 各カードの編集・削除ボタンを使用

### 使用例
```
Concept: "コーヒー関連飲料"
├─ Word: "coffee" (en)
├─ Word: "コーヒー" (ja)
├─ Word: "咖啡" (zh)
└─ Word: "café" (es)
```

## 💻開発

### ローカル開発環境のセットアップ
```bash
# バックエンド
cd backend
./gradlew bootRun

# フロントエンド（別のターミナル）
cd frontend
npm install
npm run dev

# MySQL（別のターミナル）
docker run -d \
  --name mysql-multilang \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=multilang_memo \
  -p 3306:3306 \
  mysql:8.0
```

フロントエンド: http://localhost:5173  
バックエンドAPI: http://localhost:8080

### プロジェクト構成
```
multilang-memo/
├── backend/              # Spring Boot REST API
│   ├── src/
│   │   ├── main/java/com/multilang/memo/
│   │   │   ├── controller/
│   │   │   ├── entity/
│   │   │   ├── repository/
│   │   │   └── MemoApplication.java
│   │   └── resources/
│   │       └── application.properties
│   ├── build.gradle
│   └── Dockerfile
├── frontend/             # React SPA
│   ├── src/
│   │   ├── Root.tsx
│   │   ├── ConceptDetail.tsx
│   │   ├── SearchResults.tsx
│   │   ├── Card.tsx
│   │   └── type.ts
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── start-docker.sh
├── stop-docker.sh
└── README.md
```

## パフォーマンス

- **検索応答時間**: 45ms（N+1問題最適化前: 167ms）
- **初回ビルド時間**: 約3分
- **メモリ使用量**: 全コンテナで約500MB
- **最適化**: JOIN FETCHによりN+1クエリを解消

### 最適化前後の比較

| 指標 | 最適化前 | 最適化後 | 改善率 |
|------|---------|---------|--------|
| API応答時間 | 167ms | 45ms | **73%高速化** |
| データベースクエリ数 | 5回 (N+1) | 1回 | **80%削減** |

##  データベーススキーマ
```sql
concept
├── id (BIGINT, PK)
└── notes (VARCHAR)

words
├── id (BIGINT, PK)
├── word (VARCHAR)
├── language (VARCHAR)
├── ipa (VARCHAR, 任意)
├── nuance (TEXT, 任意)
└── concept_id (BIGINT, FK)
```

##  設定

### 環境変数 (.env)
```bash
DB_NAME=multilang_memo
DB_PASSWORD=your_secure_password
SHOW_SQL=false
```

### ポート

- **フロントエンド**: 80（本番） / 5173（開発）
- **バックエンド**: 8080
- **MySQL**: 3306

##  APIエンドポイント
```
GET    /api/concepts              # 全Concept取得
GET    /api/concepts/{id}         # ID指定でConcept取得
POST   /api/concepts              # Concept作成
PUT    /api/concepts/{id}         # Concept更新
DELETE /api/concepts/{id}         # Concept削除

GET    /api/concepts/search?keyword={q}  # Concept検索

POST   /api/concepts/{id}/words   # Conceptに単語追加
PUT    /api/concepts/{cid}/words/{wid}  # 単語更新
DELETE /api/concepts/{cid}/words/{wid}  # 単語削除
```
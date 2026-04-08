# ConceptLink

多言語学習者のための概念ベース語彙管理システム。直接翻訳ではなく、普遍的な概念を通じて複数言語の単語を整理する。

## 特徴

- **概念ベース管理**: 共通の概念を通じて複数言語の単語を紐付け
- **リアルタイム検索**: Concept名・Notes・Wordの即時全文検索
- **Markdown対応**: NotesとNuanceでMarkdown記法が使える
- **Concept間リンク**: `@ConceptName` で他のConceptへリンク
- **完全CRUD**: Concept・Word両方の作成・読取・更新・削除
- **認証**: ユーザー名ベースのトークン認証（90日有効、自動延長）

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React 19 / TypeScript / MUI 7 / Vite |
| バックエンド | Go / chi / SQLite (modernc.org/sqlite, CGO不要) |
| 旧バックエンド | Java / Spring Boot 4 / JPA / MySQL (backend/) |

バックエンドはSpring Boot版からGoに移行済み。APIエンドポイントは互換を維持しているため、フロントエンドの変更は不要。

## クイックスタート

### 必要環境

- Go 1.21+
- Node.js 18+

### 起動

```bash
# 1. バックエンド（ターミナル1）
cd backend-go
go run main.go
# → http://localhost:8080

# 2. フロントエンド（ターミナル2）
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

ブラウザで http://localhost:5173 を開いてユーザー名を登録すれば使い始められる。

### バックエンドのオプション

```bash
go run main.go -port 8080 -db conceptlink.db   # デフォルト値
go run main.go -port 3000 -db /path/to/data.db  # カスタム
PORT=8080 DB_PATH=./data.db go run main.go       # 環境変数でも可
```

### テスト

```bash
cd backend-go
go test ./... -v
```

## 使い方

1. **Concept作成**: 「新規Concept作成」をクリック
2. **Word追加**: Conceptをクリック → 「新規Word追加」
3. **検索**: 検索ボックスで即座に検索
4. **編集・削除**: 各カードの編集・削除ボタンを使用

### 使用例

```
Concept: "挨拶"
  Notes: 日常的な挨拶表現。@敬語 も参照。
  ├─ Word: "hello" (en)
  ├─ Word: "こんにちは" (ja)
  ├─ Word: "你好" (zh)
  └─ Word: "hola" (es)
```

## プロジェクト構成

```
ConceptLink/
├── backend-go/           # Go バックエンド（現行）
│   ├── main.go           #   エントリポイント、ルーティング、CORS
│   ├── db/db.go          #   SQLiteスキーマ + CRUD
│   ├── handler/          #   auth, concept, word, public ハンドラー
│   └── model/model.go    #   構造体・DTO
├── frontend/             # React SPA
│   ├── src/
│   │   ├── Root.tsx      #   レイアウト + 検索 + Concept作成
│   │   ├── ConceptDetail.tsx  # Concept詳細 + Word管理
│   │   ├── api.ts        #   API呼び出し + 認証ラッパー
│   │   ├── contexts/AuthContext.tsx
│   │   └── type.ts       #   Concept, Word 型定義
│   └── package.json
├── backend/              # Spring Boot バックエンド（旧）
└── README.md
```

## DBスキーマ

SQLite。`PRAGMA foreign_keys = ON`。

```sql
users (id, username UNIQUE, token UNIQUE, created_at, expires_at)

concepts (id, username, name, notes, created_at)
  UNIQUE(username, name)

words (id, concept_id FK, word, language, ipa, nuance, used_in_definition, created_at)
  ON DELETE CASCADE
```

## APIエンドポイント

全エンドポイントでAuthorizationヘッダー（`Bearer <token>`）が必要（auth・publicを除く）。

```
POST   /api/auth/register              ユーザー登録
POST   /api/auth/verify-token          トークン検証+延長
POST   /api/auth/logout                ログアウト
POST   /api/auth/invalidate-all        全トークン無効化（要認証）

GET    /api/concepts                   全Concept取得（?query= でフィルタ可）
POST   /api/concepts                   Concept作成
GET    /api/concepts/search?keyword=   Concept検索
GET    /api/concepts/{id}              Concept取得（Words含む）
PUT    /api/concepts/{id}              Concept更新
DELETE /api/concepts/{id}              Concept削除

POST   /api/concepts/{id}/words        Word追加
GET    /api/concepts/{id}/words        Word一覧
GET    /api/concepts/{id}/words/{wid}  Word取得
PUT    /api/concepts/{id}/words/{wid}  Word更新
DELETE /api/concepts/{id}/words/{wid}  Word削除

GET    /api/public/demo-concepts/search?keyword=  デモ用検索（認証不要）
```

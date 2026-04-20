# ConceptLink — Go版バックエンド

Java版（`backend/`）と同一APIをGoで再実装したバックエンド。
フロントエンドはそのまま流用でき、切り替えにフロント側の変更は不要。

## 技術スタック

| 要素 | 内容 |
|---|---|
| 言語 | Go 1.25+ |
| ルーター | chi v5 |
| DB | SQLite（modernc.org/sqlite、CGO不要） |

## ディレクトリ構成

```
backend-go/
├── main.go           # エントリポイント、chiルーター、CORS設定
├── go.mod / go.sum
├── model/
│   └── model.go      # User, Concept, Word, DTO構造体
├── db/
│   └── db.go         # SQLiteスキーマ + 全CRUD関数
└── handler/
    ├── helpers.go     # writeJSON, writeError, writeInternalError
    ├── auth.go        # register, verify-token, logout, invalidate-all
    ├── concept.go     # Concept CRUD + search
    ├── word.go        # Word CRUD（concept配下）
    ├── public.go      # demo-concepts/search（認証不要）
    └── handler_test.go
```

## 必要環境

- Go 1.21+

## 起動

```bash
cd backend-go
go run main.go
# → http://localhost:8080, DB: conceptlink.db
```

### オプション

```bash
go run main.go -port 3000 -db /path/to/data.db
PORT=8080 DB_PATH=./data.db go run main.go   # 環境変数でも可
```

## テスト

```bash
go test ./... -v
```

テストは `:memory:` SQLiteを使用（`cache=shared` で接続プール問題を回避）。

## DBスキーマ

```sql
users    (id, username UNIQUE, token UNIQUE, created_at, expires_at)
concepts (id, username, name, notes, created_at)  -- UNIQUE(username, name)
words    (id, concept_id FK, word, language, ipa, nuance, used_in_definition, created_at)
```

`PRAGMA foreign_keys = ON` を有効化済み。`words.used_in_definition` はINTEGER (0/1)、JSONでは `usedInDefinition: boolean`。

## APIエンドポイント

Java版と完全互換。

| メソッド | パス | 認証 |
|---|---|---|
| POST | `/api/auth/register` | 不要 |
| POST | `/api/auth/verify-token` | 不要 |
| POST | `/api/auth/logout` | 不要 |
| POST | `/api/auth/invalidate-all` | 必要 |
| GET/POST | `/api/concepts` | 必要 |
| GET/PUT/DELETE | `/api/concepts/{id}` | 必要 |
| GET/POST | `/api/concepts/{id}/words` | 必要 |
| GET/PUT/DELETE | `/api/concepts/{id}/words/{wid}` | 必要 |
| GET | `/api/public/demo-concepts/search` | 不要 |

`GET /api/concepts` は `?query=` クエリパラメータでフィルタ可能。

## フロントエンド接続

`frontend/.env.development` の `VITE_API_URL=http://localhost:8080` のままで接続可能。ポートを変えた場合はこのファイルを更新する。

# ConceptLink — Java版バックエンド

Spring Boot 4 + MySQL による REST API サーバー。Go版（`backend-go/`）と同一APIを提供する。

## 技術スタック

| 要素 | 内容 |
|---|---|
| 言語 | Java 21 |
| フレームワーク | Spring Boot 4.0.1 |
| ORM | JPA / Hibernate |
| DB | MySQL |
| ビルドツール | Gradle |

## ディレクトリ構成

```
backend/
├── src/main/java/com/multilang/memo/
│   ├── config/          # WebConfig, DataInitializer
│   ├── controller/      # AuthController, ConceptController, WordController, PublicController
│   ├── dto/             # AuthResponse, RegisterRequest, TokenRequest
│   ├── entity/          # Concept, Word, User（JPAエンティティ）
│   ├── exception/       # カスタム例外 + GlobalExceptionHandler
│   ├── repository/      # JPA repositories
│   └── service/         # AuthService, ConceptService, WordService
├── src/main/resources/
│   └── application.properties
└── build.gradle
```

## 必要環境

- Java 21+
- MySQL（ローカルまたはDocker）
- Gradle（`./gradlew` ラッパー同梱）

## セットアップ

### 1. データベース作成

```sql
CREATE DATABASE multilang_memo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 接続設定

`src/main/resources/application.properties` を環境に合わせて編集：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/multilang_memo?characterEncoding=UTF-8&serverTimezone=Asia/Tokyo
spring.datasource.username=root
spring.datasource.password=password
```

### 3. 起動

```bash
cd backend
./gradlew bootRun
# → http://localhost:8080
```

初回起動時に `spring.jpa.hibernate.ddl-auto=update` によりテーブルが自動生成される。

## テスト

```bash
./gradlew test
```

テストはH2インメモリDBを使用（`src/test/resources/application.properties` で設定済み）。

## エンティティ関係

```
User (username, token, expiresAt)
  └── 1:N → Concept (username, name, notes)
                └── 1:N → Word (word, language, ipa, nuance, usedInDefinition)
```

UserとConceptはJPAリレーションではなくusername文字列で紐づく。

## APIエンドポイント

Go版と完全互換。認証はBearer token方式（トークン有効期限90日）。

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

## フロントエンド接続

`frontend/.env.development` の `VITE_API_URL=http://localhost:8080` のままで接続可能。

# ConceptLink

多言語概念管理システム。language learnerのために設計された。

## 設計思想

既存の単語帳アプリは「単語」を主エンティティとして設計しているため、
同一概念を言語ごとに重複定義しなければならない。
人の思考における概念の同一性は言語表現より上位にある。

本システムはconcept（概念）とword（表現）を分離したデータモデルを採用する。
共通概念は1度だけ定義し、言語固有の情報（発音・意味・IPA・慣用表現）のみ
各言語側に持つことで、学習コストを削減しながら思考速度を向上させる。

## 3つの実装

同一ドメインを異なるアーキテクチャで解決した3バージョンが存在する。

| バージョン | ディレクトリ | スタック | 特徴 |
|---|---|---|---|
| Java版（オリジナル） | backend/ | Java / Spring Boot / MySQL / React+TypeScript | フルスタックWebアプリ |
| Go版 | backend-go/ | Go / chi / SQLite / React+TypeScript（共通） | Java版と同一APIを実装、フロントエンド変更なし |
| CLI版（cl-cli） | 別リポジトリ | Go / Cobra / SQLite | フロントエンドなし、起動コスト最小 |

## データモデル

concepts（概念）とexpressions（表現）を分離し、
edges（DAG）で概念間の関係を管理する。

## セットアップ

### Java版

バックエンドの起動方法をbackend/README.mdを参照してください。

### Go版

バックエンドの起動方法をbackend-go/README.mdを参照してください。

## 関連リポジトリ

- [cl-cli](https://github.com/noifex/cl-cli) — CLI版

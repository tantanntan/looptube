# Data Model: Bun化とRailwayデプロイ対応

**Date**: 2026-06-22
**Branch**: `002-bun-railway-deploy`

本フィーチャーはインフラ・ツールチェーン変更であり、アプリケーションのデータストレージ層に変更はない。エンティティはすべて「設定ファイル」として表現される。

## エンティティ一覧

### 1. パッケージマネージャー設定

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `engines.bun` | string | 要求する Bun バージョン範囲（例: `>=1.2.23`） |
| `scripts.*` | Record<string, string> | `bun run <script>` で実行可能なコマンド群 |

**ファイル**: `package.json`

**状態遷移**: pnpm依存（現状）→ Bun依存（移行後）

---

### 2. ロックファイル

| フィールド | 説明 |
|-----------|------|
| `bun.lock` | Bun が生成する依存関係ロックファイル（テキスト形式、Bun v1.2+） |

**ファイル**: `bun.lock`（プロジェクトルート）

**バリデーション**: `bun install --frozen-lockfile` でロックファイルと整合性を検証可能

---

### 3. SvelteKit ビルドアダプター設定

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `adapter` | module | `@sveltejs/adapter-node` インスタンス |

**ファイル**: `svelte.config.js`

**変更**: `@sveltejs/adapter-auto` → `@sveltejs/adapter-node`

**ビルド出力**: `build/index.js`（Node.js サーバーエントリーポイント）

---

### 4. Railway デプロイ設定

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `build.builder` | string | `"NIXPACKS"` |
| `build.buildCommand` | string | `"bun run build"` |
| `deploy.startCommand` | string | `"node build/index.js"` |
| `deploy.restartPolicyType` | string | `"ON_FAILURE"` |
| `deploy.restartPolicyMaxRetries` | number | `10` |

**ファイル**: `railway.toml`（プロジェクトルート、新規作成）

---

### 5. Railway 環境変数

Railway ダッシュボード上で管理する設定値。コードには含まれない。

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `PORT` | - | Railway が自動注入（手動設定不要） |
| `ORIGIN` | 推奨 | 公開ドメイン（例: `https://your-app.up.railway.app`） |
| `PROTOCOL_HEADER` | 推奨 | `x-forwarded-proto` |
| `HOST_HEADER` | 推奨 | `x-forwarded-host` |

---

## 削除されるエンティティ

| ファイル | 理由 |
|---------|------|
| `pnpm-lock.yaml` | `bun.lock` に置き換え |
| `pnpm-workspace.yaml` | Bun では `package.json` の `workspaces` フィールドで管理 |
| `pnpm.yaml` | Bun に不要 |

# Research: Bun化とRailwayデプロイ対応

**Date**: 2026-06-22
**Branch**: `002-bun-railway-deploy`

## 1. Bun + SvelteKit 互換性

**結論:** パッケージマネージャーとしての利用は問題なし。

- `bun install` / `bun run dev` / `bun run build` はすべて動作する
- デフォルトでは **Bun ランタイムではなく Node.js で実行される**（Bunランタイムで動かすには `--bun` フラグが必要）
- 本番デプロイは公式の `@sveltejs/adapter-node` が最も安定（コミュニティ維持の `svelte-adapter-bun` には Form Actions に関する既知バグあり）
- SvelteKit プロジェクト新規作成: `bunx sv create my-app`

**Sources**: [Bun公式 SvelteKit ガイド](https://bun.sh/guides/ecosystem/sveltekit)

## 2. Railway + SvelteKit デプロイ

**アダプター**: `@sveltejs/adapter-node`（公式推奨）

```bash
bun add -D @sveltejs/adapter-node
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
export default { kit: { adapter: adapter() } };
```

**`railway.toml` 設定例:**

```toml
[build]
builder = "NIXPACKS"
buildCommand = "bun run build"

[deploy]
startCommand = "node build/index.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**必要な環境変数:**

| 変数名 | 説明 | 要手動設定 |
|--------|------|----------|
| `PORT` | Railway が自動注入 | 不要 |
| `ORIGIN` | Railway の公開ドメイン（例: `https://your-app.up.railway.app`）。Form Actions 使用時は必須 | 要設定 |
| `PROTOCOL_HEADER` | `x-forwarded-proto`（リバースプロキシ越し） | 推奨 |
| `HOST_HEADER` | `x-forwarded-host`（リバースプロキシ越し） | 推奨 |

**Sources**: [Railway SvelteKit デプロイガイド](https://docs.railway.com/guides/sveltekit)

## 3. pnpm → bun 移行手順

**Bun v1.2.23 以降**: `bun install` を実行するだけで自動移行

- `pnpm-lock.yaml` を検出して `bun.lock`（テキスト形式）を自動生成
- `pnpm-workspace.yaml` のワークスペース定義も自動変換

**手動削除が必要なファイル:**
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `pnpm.yaml`

**追加されるファイル:**
- `bun.lock`（テキストベース、Bun v1.2+）

> **⚠️ 注意**: Bun v1.2.23 以降のロックファイルは `bun.lockb`（バイナリ）ではなく `bun.lock`（テキスト）形式。plan.md の記述を更新すること。

**既知の問題:** pnpm v9 ロックファイルで `bun pm migrate` がエラーになる場合は、`pnpm-lock.yaml` を手動削除してから `bun install` を実行する。

**Sources**: [Bun v1.2.23 リリースノート](https://bun.com/blog/bun-v1.2.23)

## 4. Nixpacks + Bun

**自動検出**: `bun.lock` または `bun.lockb` が存在すれば Node provider が Bun を自動検出。

**重要**: Nixpacks は現在 **メンテナンスモード**（積極的な開発停止）。Railway は **Railpack** への移行を推奨。

**Railpack を使う場合 (`railway.json`):**

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK"
  }
}
```

**Railpack vs Nixpacks の選択方針:**
- Railpack: Bun 最新バージョンを常にサポート、Railway 推奨
- Nixpacks: `nixpacks.toml` での細かい制御が必要な場合。Railpack では `nixpacks.toml` は無視される

**本プロジェクトの推奨**: `railway.toml` + Nixpacksビルダー（シンプルで実績あり）。Railpack は将来の選択肢として留保。

**Sources**: [Bun on Railway デプロイガイド](https://bun.com/guides/deployment/railway), [Nixpacks Node provider](https://nixpacks.com/docs/providers/node)

## 5. plan.md への反映が必要な修正点

| 項目 | 旧記述 | 正しい記述 |
|------|--------|----------|
| ロックファイル名 | `bun.lockb` | `bun.lock`（Bun v1.2.23+） |
| ビルダー記述 | Nixpacksビルダー（plan.md）| Nixpacksで十分、Railpackは将来の選択肢 |
| 環境変数 | PORT, PROTOCOL_HEADER, HOST_HEADER | ORIGIN を追加（Form Actions 将来対応） |

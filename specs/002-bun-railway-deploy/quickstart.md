# Quickstart: Bun化後の開発環境セットアップ

**Branch**: `002-bun-railway-deploy`

本ドキュメントは Bun 移行後のプロジェクトセットアップ手順を説明します。

## 前提条件

- Bun v1.2.23 以上がインストール済みであること

  ```bash
  # インストール確認
  bun --version

  # インストールされていない場合
  curl -fsSL https://bun.sh/install | bash
  ```

## セットアップ

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd yt-repeater

# 2. 依存関係をインストール（pnpm-lock.yaml があれば自動移行）
bun install
```

## 開発サーバーの起動

```bash
bun run dev
```

ブラウザで `http://localhost:5173` を開く。

## よく使うコマンド

| コマンド | 説明 |
|---------|------|
| `bun run dev` | 開発サーバーを起動 |
| `bun run build` | 本番ビルドを生成（`build/` ディレクトリに出力） |
| `bun run preview` | 本番ビルドをローカルでプレビュー |
| `bun run check` | TypeScript 型チェックと svelte-check を実行 |
| `bun run lint` | ESLint を実行 |
| `bun run test:unit` | 単体テストを実行 |
| `bun run test:integration` | 統合テストを実行 |
| `bun run test:e2e` | E2E テストを実行（Playwright） |

## ローカルで本番ビルドを確認する

```bash
bun run build && bun run preview
```

ブラウザで `http://localhost:4173` を開く。

## Railway へのデプロイ

main ブランチへのプッシュで自動デプロイされます。

```bash
git push origin main
```

Railway ダッシュボードでビルドとデプロイのステータスを確認できます。

## 環境変数（本番）

Railway ダッシュボードの Variables パネルで以下を設定してください。

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `ORIGIN` | `https://your-app.up.railway.app` | 公開ドメイン |
| `PROTOCOL_HEADER` | `x-forwarded-proto` | リバースプロキシ対応 |
| `HOST_HEADER` | `x-forwarded-host` | リバースプロキシ対応 |

`PORT` は Railway が自動注入するため設定不要です。

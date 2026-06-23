# Implementation Plan: Bun化とRailwayデプロイ対応

**Branch**: `002-bun-railway-deploy` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-bun-railway-deploy/spec.md`

## Summary

パッケージマネージャーをpnpmからBunに移行し、SvelteKitアプリをNode.jsサーバーモードでRailwayに自動デプロイできる状態にする。技術的アプローチは (1) Constitution改訂 → (2) bun移行 → (3) adapter-node導入 → (4) Railway設定 → (5) CI/CD更新 の順序で進める。

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)

**Primary Dependencies**:
- SvelteKit 2.x / Svelte 5.x / Vite 6.x
- `@sveltejs/adapter-node`（`@sveltejs/adapter-auto` から変更）
- Bun v1.x（pnpm 11 から移行）
- Vitest 2.x (unit/integration) / Playwright 1.x (E2E)

**Storage**: N/A（本フィーチャーはストレージ層に変更なし）

**Testing**: Vitest（Node環境, unit/integration）、Playwright（E2E, chromium/firefox/mobile-chrome）

**Target Platform**: Railway（Node.jsサーバー、Nixpacksビルダー）

**Project Type**: SvelteKit Web Application（CSR, `ssr=false`、将来Node.jsサーバー機能を追加可能）

**Performance Goals**: pnpm比で `bun install` が30%以上高速化

**Constraints**:
- 既存の全テスト（単体・統合・E2E）が100%合格し続けること
- TypeScript strict mode を維持
- ESLintエラー0件を維持

**Scale/Scope**: 単一パッケージプロジェクト（モノレポ不要）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | 原則 | 状態 | 判定 |
|---|------|------|------|
| Tech Stack: Package manager | `npm or pnpm` と規定 | **VIOLATION** — bunへの移行はConstitutionに違反する | ⛔ 要改訂 |
| Tech Stack: Frontend/Backend | SvelteKit（変更なし） | 準拠 | ✅ |
| Tech Stack: Language | TypeScript strict（変更なし） | 準拠 | ✅ |
| Tech Stack: Testing | Vitest + Playwright（変更なし） | 準拠 | ✅ |
| Principle I: TDD | テストを先に書く | 準拠（インフラ変更は既存テストが検証） | ✅ |
| Principle II: Harness Engineering | 独立テスト可能性（変更なし） | 準拠 | ✅ |
| Principle III: VideoPlayerPort | YouTube API経由（変更なし） | 準拠 | ✅ |
| Quality Gates | 全テスト100%合格 | 準拠（移行後にCI実行で確認） | ✅ |

### 対処方針

**Constitution違反**: "Package manager: npm or pnpm" は non-negotiable として定められているため、bunへの移行には **Constitution改訂PRが必須前提条件**。

改訂内容: `Package manager | npm, pnpm, または bun` に変更。

理由: Bunはnpm互換であり、SvelteKitプロジェクトでの利用が確立されている。パフォーマンス向上と開発体験改善のため採用する。

## Project Structure

### Documentation (this feature)

```text
specs/002-bun-railway-deploy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
# 変更・追加されるファイル
railway.toml             # NEW: Railway デプロイ設定
bun.lock                 # NEW: Bun ロックファイル（pnpm-lock.yaml を置き換え、テキスト形式 v1.2+）
package.json             # MODIFIED: engines.bun フィールド追加
svelte.config.js         # MODIFIED: adapter-auto → adapter-node
playwright.config.ts     # MODIFIED: pnpm → bun のコマンド参照
.github/workflows/ci.yml # MODIFIED: pnpm → bun に変更
.gitignore               # MODIFIED: bun.lockb を追跡対象に（除外解除）

# 削除されるファイル
pnpm-lock.yaml           # DELETED: bun.lockb に置き換え
pnpm.yaml                # DELETED: bun に不要
pnpm-workspace.yaml      # DELETED: bun に不要（単一パッケージのため）

# アダプター変更
@sveltejs/adapter-auto   # REMOVED
@sveltejs/adapter-node   # ADDED

# Constitution改訂（別PR: main branch対象）
.specify/memory/constitution.md  # MODIFIED: package manager 欄を更新
```

**Structure Decision**: 単一パッケージプロジェクト。モノレポ構成への変更なし。新ファイルはプロジェクトルートに追加する。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Package manager を non-negotiable なpnpmからbunに変更 | ユーザーリクエストの核心。インストール30%高速化と将来のBunランタイム採用の準備 | pnpmのままRailwayデプロイは可能だが、フィーチャー要件「bun化」を満たさない |

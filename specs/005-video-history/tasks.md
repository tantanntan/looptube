# Tasks: 動画視聴履歴

**Input**: `specs/005-video-history/`  
**Branch**: `005-video-history`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並行実行可能（別ファイル、未完了タスクへの依存なし）
- **[Story]**: ユーザーストーリーとのトレーサビリティ（US1〜US3）

---

## Phase 1: Setup（共有インフラ）

**Purpose**: 既存プロジェクトへの追加なのでプロジェクト初期化は不要。既存コードの調査のみ。

- [ ] T001 `src/routes/+page.svelte` の `normalizeVideoId` 関数の現在の実装を確認し、`YouTubeUrlParser.ts` への移行差分を把握する

---

## Phase 2: Foundational（ブロッキング前提条件）

**Purpose**: すべてのユーザーストーリーが依存するコアインターフェースとユーティリティ

**⚠️ CRITICAL**: この Phase が完了するまでユーザーストーリーの実装を開始しない

- [ ] T002 [P] `src/lib/core/YouTubeUrlParser.ts` を新規作成し `extractVideoId(input: string): string`（watch, youtu.be, embed, shorts, 生 ID に対応）と `buildThumbnailUrl(videoId: string): string` を実装する
- [ ] T003 [P] `src/lib/ports/HistoryPort.ts` を新規作成し `HistoryItem` 型と `HistoryPort` インターフェース（`getAll`, `add`, `remove`, `clear`）を定義する
- [ ] T004 `src/lib/fakes/InMemoryHistoryAdapter.ts` を新規作成し `HistoryPort` のインメモリ実装を提供する（T003 完了後）

**Checkpoint**: Foundation 完了 — ユーザーストーリー実装を開始可能

---

## Phase 3: User Story 1 — 自動履歴追加・永続保存（Priority: P1）🎯 MVP

**Goal**: 動画ロード成功時に自動的に履歴へ追加し、ブラウザを閉じても保持される

**Independent Test**: 動画 URL を入力して読み込み → ページをリロード → 履歴に表示されること。同じ動画を再ロードしても重複しないこと。51 件目を追加したとき最古が消えること。

### 実装タスク

- [ ] T005 [P] [US1] `src/lib/adapters/LocalHistoryAdapter.ts` を新規作成し `HistoryPort` の localStorage 実装を提供する（キー: `looptube:history`、書き込み失敗はサイレント継続、T003 完了後）
- [ ] T006 [P] [US1] `src/lib/core/VideoHistoryRepository.ts` を新規作成し `add()`（重複排除・50 件上限）・`getAll()`（addedAt 降順）・`remove()`・`buildHistoryItem()` を実装する（T003, T002 完了後）

### ユニットテスト

- [ ] T007 [P] [US1] `tests/unit/YouTubeUrlParser.test.ts` を新規作成し `extractVideoId` の全 URL フォーマット（watch?v=, youtu.be/, embed/, shorts/, 生 ID）と `buildThumbnailUrl` をテストする（T002 完了後）
- [ ] T008 [P] [US1] `tests/unit/VideoHistoryRepository.test.ts` を新規作成し重複排除・50 件上限・addedAt 降順ソートを `InMemoryHistoryAdapter` を使用してテストする（T004, T006 完了後）
- [ ] T009 [P] [US1] `tests/unit/LocalHistoryAdapter.test.ts` を新規作成し localStorage への read/write・JSON 破損時の空配列返却・書き込み失敗時の no-throw をテストする（T005 完了後）

**Checkpoint**: ここで `bun run test:unit` を実行し全テストが通過することを確認。User Story 1 が独立して動作可能。

---

## Phase 4: User Story 2 — 履歴一覧閲覧・動画選択（Priority: P2）

**Goal**: ヘッダーの履歴アイコンをタップし、履歴一覧からワンタップで動画を再ロードできる。空状態時はメッセージを表示する。

**Independent Test**: 複数の動画を読み込む → ヘッダー履歴アイコンをタップ → ドロワーに一覧が表示される → アイテムをタップするとその動画が読み込まれること。履歴 0 件時に空状態メッセージが表示されること。

### i18n

- [ ] T010 [P] [US2] `src/lib/i18n/ja.json` と `src/lib/i18n/en.json` に `history.*` キー（`button_label`, `drawer_title`, `empty`, `delete_label`）を追加する

### 実装タスク

- [ ] T011 [P] [US2] `src/lib/components/VideoHistoryItem.svelte` を新規作成し サムネイル・タイトル（なければ URL）・ゴミ箱アイコンボタンを表示する Props: `item: HistoryItem`, `onSelect`, `onDelete`（T003 完了後、空 `<style></style>` ブロック必須）
- [ ] T012 [P] [US2] `src/lib/components/VideoHistoryDrawer.svelte` を新規作成しオーバーレイ + ドロワー・`VideoHistoryItem` リスト・空状態メッセージ（`items.length === 0`）を実装する Props: `open`, `items`, `onClose`, `onSelect`, `onDelete`（T010, T011 完了後、空 `<style></style>` ブロック必須）
- [ ] T013 [US2] `src/lib/components/LoopTubeHeader.svelte` を変更し 履歴アイコンボタンを追加する Props: `onHistoryClick: () => void`（T010 完了後）
- [ ] T014 [US2] `src/routes/+page.svelte` を変更し `VideoHistoryRepository`（`LocalHistoryAdapter` 使用）のインスタンス化・`$state` 追加（`historyItems`, `historyOpen`）・`handleLoad()` 成功後の履歴追加・`handleHistorySelect`・ `<VideoHistoryDrawer>` と `<LoopTubeHeader>` への props 接続を実装する（T005, T006, T012, T013 完了後）

**Checkpoint**: アプリを起動し動画ロード → ヘッダーの履歴ボタン → ドロワーに表示 → アイテムをタップして動画再ロードを手動確認。

---

## Phase 5: User Story 3 — 履歴アイテム削除（Priority: P3）

**Goal**: 履歴一覧の各アイテムのゴミ箱ボタンで個別削除できる。削除はストレージにも即反映される。

**Independent Test**: 動画を数件ロードし履歴を表示 → ゴミ箱アイコンをタップ → 一覧からその動画が消え、ページリロード後も消えたままであること。

### 実装タスク

- [ ] T015 [US3] `src/routes/+page.svelte` に `handleHistoryDelete(id: string)` ハンドラを追加し `repository.remove(id)` → `historyItems` の再フェッチを実装する（T014 完了後）

**Checkpoint**: ゴミ箱ボタンで削除 → リロード後も消えていることを手動確認。全ユーザーストーリーが独立して動作可能。

---

## Phase 6: Polish & 横断的関心事

**Purpose**: コード品質向上・`normalizeVideoId` の統合

- [ ] T016 [P] `src/routes/+page.svelte` 内の `normalizeVideoId` 呼び出しを `YouTubeUrlParser.extractVideoId` に置き換え、元の関数定義を削除する（T002, T014 完了後）
- [ ] T017 `bun run test:unit` を実行し全ユニットテストが通過することを最終確認する

---

## 依存関係と実行順序

### Phase 依存関係

- **Setup (Phase 1)**: 依存なし — 即開始可能
- **Foundational (Phase 2)**: Phase 1 完了後 — 全ユーザーストーリーをブロック
- **US1 (Phase 3)**: Phase 2 完了後
- **US2 (Phase 4)**: Phase 2 完了後（US1 と並行可能だが US1 の LocalHistoryAdapter を使用するため US1 後推奨）
- **US3 (Phase 5)**: Phase 4 完了後（VideoHistoryDrawer の削除ボタンが必要）
- **Polish (Phase 6)**: Phase 5 完了後

### タスク内依存関係

```
T002 (YouTubeUrlParser) ──┬──→ T006 (VideoHistoryRepository)
T003 (HistoryPort)         │       → T008 (Repository test)
   └──→ T004 (InMemory)  ──┘
   └──→ T005 (LocalAdapter) → T009 (Adapter test)
   └──→ T011 (HistoryItem.svelte)
   └──→ T012 (Drawer.svelte) ← T011, T010
T013 (Header) ← T010
T014 (page) ← T005, T006, T012, T013
T015 (delete) ← T014
T016 (refactor) ← T002, T014
```

### 並行実行例

```bash
# Phase 2 内で並行実行可能:
T002 (YouTubeUrlParser.ts)
T003 (HistoryPort.ts)

# Phase 3 内で並行実行可能（T003, T004 完了後）:
T005 (LocalHistoryAdapter.ts)
T006 (VideoHistoryRepository.ts)

# テストは実装と並行して書ける（対象が完成したら実行）:
T007 (YouTubeUrlParser.test.ts)  ← T002 完了後
T008 (Repository.test.ts)        ← T004, T006 完了後
T009 (LocalHistoryAdapter.test.ts) ← T005 完了後

# Phase 4 内で並行実行可能（T010 完了後）:
T011 (VideoHistoryItem.svelte)
T013 (LoopTubeHeader.svelte)
```

---

## 実装戦略

### MVP ファースト（US1 のみ）

1. Phase 2 完了: `YouTubeUrlParser`, `HistoryPort`, `InMemoryHistoryAdapter`
2. Phase 3 完了: `LocalHistoryAdapter`, `VideoHistoryRepository`, テスト, `+page.svelte` 統合
3. **STOP & VALIDATE**: 動画ロード → ページリロード → 履歴確認
4. US2 着手: 履歴 UI（ドロワー・ヘッダー）

### インクリメンタルデリバリー

1. Phase 2 → Phase 3 → テスト通過 → 履歴の永続化が動作（バックエンド完成）
2. Phase 4 → ドロワー・選択が動作（UI 完成）
3. Phase 5 → 削除が動作（フル機能）
4. Phase 6 → リファクタリング完了

---

## メモ

- `[P]` タスク = 別ファイル、依存なし
- `[Story]` ラベルで各タスクをスペックのシナリオにトレース可能
- `.svelte` ファイルは必ず空の `<style></style>` ブロックを含めること（SSR エラー防止）
- `HistoryPort` 経由でのみ storage にアクセス（`localStorage` を直接操作しない）
- 各 Phase のチェックポイントで `bun run test:unit` を実行し通過を確認

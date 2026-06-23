# Tasks: 動画視聴履歴

**Input**: `specs/005-video-history/`  
**Branch**: `005-video-history`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並行実行可能（別ファイル、未完了タスクへの依存なし）
- **[Story]**: ユーザーストーリーとのトレーサビリティ（US1〜US3）
- **RED → GREEN**: 各ドメインロジックはテストを先に書き、実装がテストを通過させる順序で進める

---

## Phase 1: Setup（既存コード調査）

**Purpose**: 既存プロジェクトへの追加。プロジェクト初期化は不要。

- [ ] T001 `src/routes/+page.svelte` の `normalizeVideoId` 関数の現在の実装を確認し、`YouTubeUrlParser.ts` への移行差分を把握する

---

## Phase 2: Foundational（ブロッキング前提条件）

**Purpose**: 全ユーザーストーリーが依存するインターフェースとユーティリティ

**⚠️ CRITICAL**: この Phase が完了するまでユーザーストーリーの実装を開始しない

- [ ] T002 [P] `src/lib/ports/HistoryPort.ts` を新規作成し `HistoryItem` 型と `HistoryPort` インターフェース（`getAll`, `replaceAll`, `remove`, `clear`）を定義する
- [ ] T003 [P] `tests/unit/YouTubeUrlParser.test.ts` を新規作成し `extractVideoId`（watch?v=, youtu.be/, embed/, shorts/, 生 ID）と `buildThumbnailUrl` のテストを RED 状態で書く（`HistoryPort` に非依存、Phase 2 開始後すぐ着手可）
- [ ] T004 [P] `src/lib/core/YouTubeUrlParser.ts` を新規作成し T003 のテストをすべて GREEN にする（T003 完了後）
- [ ] T005 `src/lib/fakes/InMemoryHistoryAdapter.ts` を新規作成し `HistoryPort` のインメモリ実装を提供する（T002 完了後）

**Checkpoint**: `bun run test:unit` を実行し T003 のテストがすべて GREEN になっていることを確認

---

## Phase 3: User Story 1 — 自動履歴追加・永続保存（Priority: P1）🎯 MVP

**Goal**: 動画ロード成功時に自動的に履歴へ追加し、ブラウザを閉じても保持される

**Independent Test**: 動画 URL を入力して読み込み → ページをリロード → `localStorage` の `looptube:history` キーに履歴が存在すること。同じ動画を再ロードしても重複しないこと。51 件目を追加したとき最古（`addedAt` 昇順の先頭）が消えること。

### テストファースト → 実装（RED → GREEN）

- [ ] T006 [P] [US1] `tests/unit/VideoHistoryRepository.test.ts` を新規作成し 重複排除（同 id を先頭へ移動）・50 件上限（最古削除）・`getAll()` の `addedAt` 降順ソートを `InMemoryHistoryAdapter` を使ってテストを RED 状態で書く（T002, T005 完了後）
- [ ] T007 [P] [US1] `src/lib/core/VideoHistoryRepository.ts` を新規作成し T006 のテストをすべて GREEN にする（`add()` は `port.replaceAll()` で全件保存、T006 完了後）
- [ ] T008 [P] [US1] `tests/unit/LocalHistoryAdapter.test.ts` を新規作成し localStorage read/write・JSON 破損時の空配列返却・`replaceAll` 失敗時の no-throw をテストを RED 状態で書く（T002 完了後）
- [ ] T009 [P] [US1] `src/lib/adapters/LocalHistoryAdapter.ts` を新規作成し T008 のテストをすべて GREEN にする（キー: `looptube:history`、書き込み失敗はサイレント継続、T008 完了後）

### MVP 最低限統合

- [ ] T010 [US1] `src/routes/+page.svelte` を変更し `VideoHistoryRepository`（`LocalHistoryAdapter` 使用）のインスタンス化と `handleLoad()` 成功後の `repository.add()` 呼び出しを追加する（UI なし・履歴追加のみ。`$state historyItems` の初期化も含む。T007, T009 完了後）

**Checkpoint**: `bun run test:unit` で全テスト GREEN。アプリを起動し動画ロード後に `localStorage['looptube:history']` に JSON が保存されること、リロード後も保持されることを手動確認

---

## Phase 4: User Story 2 & 3 — 履歴 UI・選択・削除（Priority: P2/P3）

**Goal**: ヘッダーの履歴アイコンで一覧を開き、選択で動画を再ロード、ゴミ箱で削除できる。空状態メッセージを表示する。

**Independent Test**: 動画を数件ロード → 履歴ボタン → ドロワー表示・空状態確認 → アイテムタップで動画再ロード → ゴミ箱タップで即削除 → リロード後も削除済み

### i18n

- [ ] T011 [P] [US2] `src/lib/i18n/ja.json` と `src/lib/i18n/en.json` に `history.*` キー（`button_label`, `drawer_title`, `empty`, `delete_label`）を既存の `createTranslator` 方式で追加する

### 実装タスク

- [ ] T012 [P] [US2] `src/lib/components/VideoHistoryItem.svelte` を新規作成しサムネイル・タイトル（空文字の場合は URL）・ゴミ箱アイコンボタンを表示する。Props: `item: HistoryItem`, `onSelect: (item: HistoryItem) => void`, `onDelete: (id: string) => void`（T002, T011 完了後、空 `<style></style>` ブロック必須）
- [ ] T013 [P] [US2] `src/lib/components/VideoHistoryDrawer.svelte` を新規作成しオーバーレイ + ドロワー・`VideoHistoryItem` リスト・空状態メッセージを実装する。Props: `open: boolean`, `items: HistoryItem[]`, `onClose`, `onSelect`, `onDelete`（T011, T012 完了後、空 `<style></style>` ブロック必須）
- [ ] T014 [P] [US2] `src/lib/components/LoopTubeHeader.svelte` を変更し履歴アイコンボタンを追加する。Props 追加: `onHistoryClick: () => void`（T011 完了後）
- [ ] T015 [US2] `src/routes/+page.svelte` を変更し `$state historyOpen` の追加・`handleHistorySelect(item)`（URL セット + `handleLoad()`）・`handleHistoryDelete(id)`（`repository.remove()` → `historyItems` 更新）・`<VideoHistoryDrawer>` と `<LoopTubeHeader>` への props 接続を実装する（T010, T013, T014 完了後）

**Checkpoint**: アプリを起動し全操作（履歴追加・ドロワー開閉・選択・削除・リロード後の保持）を手動確認

---

## Phase 5: Polish & 横断的関心事

**Purpose**: コード品質向上・`normalizeVideoId` の除去

- [ ] T016 [P] `src/routes/+page.svelte` 内の `normalizeVideoId` 呼び出しを `YouTubeUrlParser.extractVideoId` に置き換え、元の関数定義を削除する（T004, T015 完了後）
- [ ] T017 `bun run test:unit` を実行し全ユニットテストが通過することを最終確認する

---

## 依存関係と実行順序

### Phase 依存関係

- **Setup (Phase 1)**: 依存なし — 即開始可能
- **Foundational (Phase 2)**: Phase 1 完了後 — 全ストーリーをブロック
- **US1 (Phase 3)**: Phase 2 完了後。**US1 の T010（page 統合）まで完了してはじめて MVP 達成**
- **US2/US3 (Phase 4)**: Phase 3 完了後（T010 で page 統合済みの状態から UI を積み上げる）
- **Polish (Phase 5)**: Phase 4 完了後

### タスク内依存関係

```
T003 (URLParser test RED) ──────────────────────→ T004 (URLParser impl GREEN)
T002 (HistoryPort) ─────┬──────────────────────────────────────────────────────
                         ├─→ T005 (InMemoryAdapter)
                         ├─→ T006 (Repository test RED) → T007 (Repository impl GREEN)
                         └─→ T008 (LocalAdapter test RED) → T009 (LocalAdapter impl GREEN)

T007, T009 ──→ T010 (+page.svelte MVP 統合) ← US1 完了
T010, T013, T014 ──→ T015 (+page.svelte 完全統合) ← US2/US3 完了
T004, T015 ──→ T016 (normalizeVideoId 除去)
```

### 並行実行例

```bash
# Phase 2 内で並行実行可能:
T002 (HistoryPort.ts)
# T002 完了後:
T003 (URLParser test)   T005 (InMemoryAdapter)
# T003 完了後:
T004 (URLParser impl)
# T002, T005 完了後:
T006 (Repository test)  T008 (LocalAdapter test)
# T006 完了後:            T008 完了後:
T007 (Repository impl)  T009 (LocalAdapter impl)

# Phase 4 内で並行実行可能（T010 完了後）:
T011 (i18n)   T012 (VideoHistoryItem)   T014 (LoopTubeHeader)
# T011, T012 完了後:
T013 (VideoHistoryDrawer)
```

---

## 実装戦略

### MVP ファースト（US1: T001〜T010）

1. Phase 2: `HistoryPort`, `YouTubeUrlParser`（テスト先行）, `InMemoryHistoryAdapter`
2. Phase 3: `VideoHistoryRepository`（テスト先行）, `LocalHistoryAdapter`（テスト先行）, `+page.svelte` 最低限統合
3. **STOP & VALIDATE**: テスト GREEN + localStorage に履歴が保存されることを確認
4. Phase 4 着手: 履歴 UI

### インクリメンタルデリバリー

1. Phase 2 + Phase 3 → `bun run test:unit` GREEN → 永続化が動作（バックエンド MVP 完成）
2. Phase 4 → 全操作が動作（フル機能 UI 完成）
3. Phase 5 → リファクタリング完了

---

## メモ

- `[P]` タスク = 別ファイル、依存なし — 並行実行推奨
- `[Story]` ラベルで各タスクをスペックのシナリオにトレース可能
- `.svelte` ファイルは必ず空の `<style></style>` ブロックを含めること（SSR エラー防止）
- `HistoryPort` 経由でのみ storage にアクセス（`localStorage` を直接操作しない）
- `HistoryPort.replaceAll()` で全件置き換え。Adapter にビジネスロジックを持たせない
- 各 Phase のチェックポイントで `bun run test:unit` を実行し通過を確認

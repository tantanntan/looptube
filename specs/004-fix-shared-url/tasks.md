# Tasks: 共有URL読み込み修正

**Input**: Design documents from `specs/004-fix-shared-url/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ui-behavior.md ✅

**Tests**: TDD アプローチ（Constitution 必須）— 各実装タスクの前に RED テストを先行作成する

**Organization**: タスクはユーザーストーリー単位でグループ化し、US1 だけでも独立して動作確認できる構成にする

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（別ファイル、依存なし）
- **[Story]**: 対応するユーザーストーリー（US1, US2）
- ファイルパスを明記する

---

## Phase 1: Setup（共有インフラ）

**Purpose**: 本バグ修正はすでに存在するプロジェクト上の変更のため、新規セットアップは最小限

_新たなプロジェクト初期化や依存パッケージの追加は不要。既存の開発環境で即開始できる。_

---

## Phase 2: Foundational（ブロッキング前提条件）

**Purpose**: 全ユーザーストーリーのテストで必要な `simulateStateChange()` ヘルパーを追加する

**⚠️ CRITICAL**: このフェーズが完了するまで US1/US2 のテストは書けない

- [x] T001 `simulateStateChange(state: PlayerState): void` を `src/lib/fakes/FakeVideoPlayer.ts` に追加する

**Checkpoint**: FakeVideoPlayer が `BUFFERING`/`PLAYING` 状態遷移をシミュレートできる → US1/US2 の TDD が開始できる

---

## Phase 3: User Story 1 — 共有URLで動画とループが正常に再生される（Priority: P1）🎯 MVP

**Goal**: 共有URL開封時に `onStateChange(BUFFERING)` を待ってから A/B 区間を設定し、正しい位置にループが復元される

**Independent Test**: 単体テストで `simulateReady()` → `setDuration(300)` → `simulateStateChange('BUFFERING')` の順に呼び、A が 10.5、B が 50.0 にセットされることを確認する。`simulateReady()` 直後の時点では A/B が 0 のまま（旧挙動）であることも文書化する。

### Tests for User Story 1 ⚠️ RED 先行

> **NOTE: 実装前にこのテストを書き、必ず FAIL させてから実装に進む**

- [x] T002 [US1] `tests/unit/shared-url-restore.test.ts` を新規作成し、有効な共有URL（a=10.5, b=50.0, s=1.5）開封時の A/B 復元タイミングテスト（RED）を書く

### Implementation for User Story 1

- [x] T003 [US1] `src/routes/+page.svelte` の `onMount` ブロックで `let shareParamsApplied = false;` を宣言し、`onReady` 内の URL params 適用ロジックを `onStateChange` ハンドラの最初の `BUFFERING`/`PLAYING` 発火時に移動する（T002 を GREEN にする）
- [x] T004 [US1] `export PATH="$PATH:/Users/tandaitoshitaka/.nvm/versions/node/v24.4.1/bin" && pnpm run test:unit` を実行し T002 が PASS することを確認する

**Checkpoint**: この時点で User Story 1 が単体テスト上で完全に動作する。`/?v=...&a=...&b=...&s=...` を開いたとき、`onStateChange(BUFFERING)` 後に正しい A/B マーカーが設定される

---

## Phase 4: User Story 2 — B点クランプ時のフォールバック通知（Priority: P2）

**Goal**: B点が動画長を超える場合に動画終端へクランプし、トースト通知でユーザーに知らせる

**Independent Test**: 単体テストで `setDuration(30)` → `simulateStateChange('BUFFERING')` を呼び（b=99999 の URL params）、B が 30 にクランプされ、`shareToast` に i18n キー `share.loop_clamped` の文字列が入っていることを確認する

### Tests for User Story 2 ⚠️ RED 先行

> **NOTE: 実装前にこのテストを書き、必ず FAIL させてから実装に進む**

- [x] T005 [US2] `tests/unit/shared-url-restore.test.ts` にクランプケースのテストを追加する（b=99999, duration=30 → B=30, shareToast≠''）（RED）

### Implementation for User Story 2

> **NOTE**: `share.loop_clamped` は `en.json` / `ja.json` に既存のため、i18n キー追加タスクは不要。

- [x] T006 [US2] `src/routes/+page.svelte` の `onStateChange` ハンドラ内でクランプ検出ロジック（`clamped.pointB < shareResult.pointB`）とトースト表示（`shareToast = $t('share.loop_clamped')`、3秒後自動消去）を追加する（T005 を GREEN にする）
- [x] T007 [US2] `export PATH="$PATH:/Users/tandaitoshitaka/.nvm/versions/node/v24.4.1/bin" && pnpm run test:unit` を実行し T005 が PASS することを確認する

**Checkpoint**: この時点で User Story 1 AND 2 が両方とも単体テスト上で動作する

---

## Phase 5: Polish & 横断的関心事

**Purpose**: E2E テストのドキュメント整備と最終確認

- [x] T008 [P] `tests/e2e/share-url.test.ts` の `test.skip` 箇所に「Unit tests cover this in tests/unit/shared-url-restore.test.ts — E2E requires real YouTube player; verify manually」コメントを追記する
- [x] T009 `svelte-check` を実行して型エラーがないことを確認する（`export PATH="$PATH:/Users/tandaitoshitaka/.nvm/versions/node/v24.4.1/bin" && pnpm run check`）

---

## Dependencies & Execution Order

### フェーズ依存関係

- **Phase 2 (Foundational)**: 即開始可能。US1/US2 テストを BLOCK する
- **Phase 3 (US1)**: Phase 2 完了後に開始。T002 → T003 → T004 の順に実行
- **Phase 4 (US2)**: Phase 3 完了後に開始（同一ハンドラへの追加変更のため）
- **Phase 5 (Polish)**: US1/US2 完了後

### ユーザーストーリー依存関係

- **US1 (P1)**: Foundational 完了後に即開始可能
- **US2 (P2)**: US1 と同じ `onStateChange` ハンドラを変更するため、US1 完了後に開始するのが安全

### ストーリー内の実行順序

1. RED テスト作成（FAIL を確認）
2. 実装（GREEN にする）
3. テスト実行確認

---

## Parallel Example

```bash
# T008（E2E コメント）は Phase 4 完了と並列実行可能（別ファイル）:
Task: "Add skip comment to tests/e2e/share-url.test.ts"
Task: "(other Phase 5 work if any)"
```

---

## Implementation Strategy

### MVP First（User Story 1 のみ）

1. Phase 2: T001 — FakeVideoPlayer に simulateStateChange 追加
2. Phase 3: T002 — RED テスト作成（失敗確認）
3. Phase 3: T003 — `+page.svelte` 修正（onStateChange タイミング移動）
4. Phase 3: T004 — テスト PASS 確認
5. **STOP & VALIDATE**: `pnpm run test:unit` で全グリーンを確認
6. User Story 1 のバグ修正完了

### Incremental Delivery

1. MVP (US1) → テスト → 確認
2. US2 (クランプ通知) → テスト → 確認
3. Polish → 完了

---

## Notes

- `[P]` タスク = 別ファイル、依存なし → 並列実行可
- `[Story]` ラベルはユーザーストーリーとのトレーサビリティを確保する
- 各テストは実装前に必ず FAIL させること（Constitution: TDD 必須）
- `pnpm` は PATH に含まれないため常に `export PATH=...` プレフィックスを付ける
- `svelte-check` で型エラーがないことを確認してからコミットする
- `.svelte` ファイルには必ず `<style></style>` ブロックが必要（CLAUDE.md 参照）
- `share.loop_clamped` i18n キーは en.json / ja.json に既存 — 新規追加タスク不要（T006/T007 を削除済み）

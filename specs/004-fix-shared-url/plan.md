# Implementation Plan: 共有URL読み込み修正

**Branch**: `004-fix-shared-url` | **Date**: 2026-06-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification `specs/004-fix-shared-url/spec.md`

---

## Summary

共有 URL（`?v=...&a=...&b=...&s=...`）を開いたとき、A/B ループ区間が復元されないバグを修正する。

**根本原因**: `+page.svelte` の `onReady` コールバック内で `loadVideo()` 直後に `getDuration()` を呼ぶと `0` が返る。YouTube IFrame API では動画メタデータ（duration を含む）は `onStateChange(BUFFERING)` で初めて確定する。`clampToDuration(shareResult, 0)` を実行すると全ての A/B 値が 0 にクランプされる。

**修正方針**: URL params 適用ロジックを `onReady` から `onStateChange` の最初の `BUFFERING`/`PLAYING` イベントに移動する。ポートインターフェースの変更なし。

---

## Technical Context

| 項目 | 値 |
|---|---|
| Language/Version | TypeScript 5 (strict mode) |
| Primary Dependencies | SvelteKit 2.x, Svelte 5, YouTube IFrame Player API (VideoPlayerPort) |
| Storage | N/A（ストレージ変更なし） |
| Testing | Vitest (unit), Playwright (E2E) |
| Target Platform | Web browser, mobile-first |
| Project Type | web-app (SvelteKit) |
| Performance Goals | A/B 適用 ≤ 5秒（SC-001）; A/B 精度 ±0.1秒（SC-002） |
| Constraints | 自動再生なし; VideoPlayerPort インターフェース変更なし |
| Scale/Scope | 変更ファイル 5 件（主要変更 1 件: `+page.svelte`） |

---

## Constitution Check

| 原則 | ステータス | 備考 |
|---|---|---|
| I. TDD | ✅ PASS | `simulateStateChange` を使った failing test を先行作成 |
| II. ハーネスエンジニアリング | ✅ PASS | FakeVideoPlayer で全タイミングをシミュレート可能 |
| III. VideoPlayerPort 抽象 | ✅ PASS | `onStateChange` は既存ポートにある; SDK 直参照なし |
| IV. 純粋ドメインロジック | ✅ PASS | 修正は framework 層（`+page.svelte`）のみ |
| V. StoragePort 抽象 | ✅ PASS | 変更なし |
| VI. 依存性注入 | ✅ PASS | 変更なし |
| VII. テストランナー | ✅ PASS | Vitest + Playwright の順序を維持 |
| VIII. カバレッジゲート | ✅ PASS | URL シリアライゼーションの 100% カバレッジを維持 |
| モバイルファースト | ✅ PASS | 自動再生なし（FR-004） |
| i18n | ✅ PASS | `share.loop_clamped` キーが en.json / ja.json に既存（追加不要） |

**GATE: 違反なし。実装フェーズに進む。**

---

## Directory Structure

```
src/
  routes/
    +page.svelte              # 主要変更: onStateChange で URL params 適用
  lib/
    fakes/
      FakeVideoPlayer.ts      # simulateStateChange() 追加
    i18n/
      en.json                 # 変更なし（share.loop_clamped 既存）
      ja.json                 # 変更なし（share.loop_clamped 既存）

tests/
  unit/
    shared-url-restore.test.ts  # 新規: TDD Red テスト
  e2e/
    share-url.test.ts           # 既存スキップテストを有効化

specs/004-fix-shared-url/
  research.md          # Phase 0 完了
  data-model.md        # Phase 1 完了
  contracts/
    ui-behavior.md     # Phase 1 完了
```

---

## Implementation Tasks

### Task 1: [RED] FakeVideoPlayer に simulateStateChange を追加

**ファイル**: `src/lib/fakes/FakeVideoPlayer.ts`

```typescript
simulateStateChange(state: PlayerState): void {
    this._state = state;
    this._stateCallbacks.forEach((cb) => cb(state));
}
```

既存の `simulateReady()` / `simulateError()` パターンと同様。

---

### Task 2: [RED] 共有URL復元の単体テストを作成（失敗前提）

**ファイル**: `tests/unit/shared-url-restore.test.ts`（新規）

テストシナリオ:
1. `FakeVideoPlayer` を duration=0 で初期化（`onReady` 直後の状態を再現）
2. `simulateReady()` 呼び出し
3. この時点では A/B が 0 のままであることを確認（旧コードの失敗を文書化）
4. `setDuration(300)` で実際の duration をセット
5. `simulateStateChange('BUFFERING')` 呼び出し
6. A が `pointA`（例: 10.5）、B が `pointB`（例: 50.0）にセットされていることを確認

クランプケース（B点 > duration）:
1. `setDuration(30)` で短い動画をシミュレート
2. `a=10&b=99999` の ParseResult を注入
3. `simulateStateChange('BUFFERING')` 後、B が 30（duration）にクランプされることを確認
4. `shareToast` にクランプ通知文字列が入っていることを確認

---

### Task 3: [GREEN] +page.svelte を修正

**ファイル**: `src/routes/+page.svelte`

変更箇所:

**Before** (`onReady` 内):
```typescript
ytPlayer.onReady(() => {
    if (videoId) {
        ytPlayer.loadVideo(videoId);
    }
    if (shareResult.ok) {
        const d = ytPlayer.getDuration();          // BUG: 常に 0
        const clamped = UrlSerializer.clampToDuration(shareResult, d);
        machine.setA(clamped.pointA);
        machine.setB(clamped.pointB);
        speed = shareResult.speed;
        ytPlayer.setPlaybackRate(shareResult.speed);
        machineState = machine.getState();
    }
    controller.start();
    ...
});
```

**After**:
```typescript
let shareParamsApplied = false;

ytPlayer.onStateChange((state) => {
    playing = state === 'PLAYING';
    if (state !== 'UNSTARTED') {
        const t = ytPlayer.getVideoTitle();
        if (t) videoTitle = t;
    }
    // 最初の BUFFERING/PLAYING 時に共有URLパラメータを適用
    if (!shareParamsApplied && (state === 'BUFFERING' || state === 'PLAYING')) {
        shareParamsApplied = true;
        if (shareResult.ok) {
            const d = ytPlayer.getDuration();
            const clamped = UrlSerializer.clampToDuration(shareResult, d);
            if (clamped.pointB < shareResult.pointB) {
                shareToast = $t('share.loop_clamped');
                setTimeout(() => { shareToast = ''; }, 3000);
            }
            machine.setA(clamped.pointA);
            machine.setB(clamped.pointB);
            speed = shareResult.speed;
            ytPlayer.setPlaybackRate(shareResult.speed);
            machineState = machine.getState();
        }
    }
});

ytPlayer.onReady(() => {
    if (videoId) {
        ytPlayer.loadVideo(videoId);
    }
    // URL params 適用は onStateChange(BUFFERING) に移動したため削除
    controller.start();
    progressInterval = setInterval(() => {
        currentTime = player.getCurrentTime();
        duration = player.getDuration();
        machineState = machine.getState();
    }, 100);
});
```

**注意**: `let shareParamsApplied = false;` は `onMount` スコープのローカル変数として宣言する（Svelte `$state` 不要）。

---

### Task 4: [GREEN] i18n キー確認（追加不要）

`share.loop_clamped` キーはすでに両ファイルに存在するため変更不要。

| ファイル | キー | 値 |
|---|---|---|
| `src/lib/i18n/en.json` | `share.loop_clamped` | `"Loop points were adjusted to fit the video duration."` |
| `src/lib/i18n/ja.json` | `share.loop_clamped` | `"ループポイントが動画の長さに合わせて調整されました。"` |

`UrlSerializer.clampToDuration()` が返す `message: 'share.loop_clamped'` をそのまま `$t('share.loop_clamped')` に渡す。

---

### Task 5: [GREEN] テストをパスさせる確認

```bash
export PATH="$PATH:/Users/tandaitoshitaka/.nvm/versions/node/v24.4.1/bin"
pnpm run test:unit
```

全テストグリーンを確認。

---

### Task 6: [E2E] share-url.test.ts の手動確認コメント追記

**ファイル**: `tests/e2e/share-url.test.ts`

実装方針:
- `test.skip` はそのまま維持する（実際の YouTube プレイヤーは CI 環境で動作しないため）
- `test.skip` コメントとして「Unit tests cover this in tests/unit/shared-url-restore.test.ts — E2E requires real YouTube player; verify manually」を追記する
- CI 対象は unit test のみ

**判断**: E2E テストはスキップ維持。Unit テストが主要カバレッジを担う。

---

### Task 7: [REFACTOR] コードレビューとクリーンアップ

- `shareParamsApplied` 変数名が意図を正確に表現しているか確認
- `onStateChange` ハンドラの責務が肥大化していないか確認（1つのハンドラで state 更新 + URL params 適用）
- 必要に応じてローカル関数に切り出す

---

## Success Criteria 検証マトリクス

| SC | 検証方法 |
|---|---|
| SC-001: 5秒以内に A-B ループ設定 | Unit test: `simulateStateChange('BUFFERING')` 後即座に A/B がセットされる |
| SC-002: A/B 精度 ±0.1秒 | Unit test: `setA`/`setB` への引数を検証（浮動小数点の精度は `UrlSerializer` の既存テストで担保） |
| SC-003: 100% の有効 URL で正常動作 | Unit test: 正常系・クランプ系・`v` のみ系をカバー |
| SC-004: 不正 URL でクラッシュなし | Unit test: `parseResult.ok === false` 時に何も起きないことを確認 |

---

## リスクと軽減策

| リスク | 軽減策 |
|---|---|
| BUFFERING が発火する前に PLAYING になる場合 | `state === 'BUFFERING' \|\| state === 'PLAYING'` の OR 条件で両方をカバー |
| `shareParamsApplied` が false のまま BUFFERING が複数回発火 | フラグを `true` にセットしてから処理するため二重適用なし |
| `UrlSerializer.clampToDuration` が B < A を生成するケース | 既存の `clampToDuration` ロジックの責務；spec scope 外 |

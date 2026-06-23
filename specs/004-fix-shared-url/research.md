# Research: 共有URL読み込み修正

**Feature**: 004-fix-shared-url  
**Date**: 2026-06-23  
**Status**: Complete — no NEEDS CLARIFICATION items remain

---

## Q1: YouTube IFrame API の duration 確定タイミング

### Decision
`onReady` コールバック内で `loadVideo()` を呼んだ直後は duration が 0 を返す。
duration が確定するのは `onStateChange` で `BUFFERING` (=3) が発火した時点。

### Rationale
YouTube IFrame Player API の仕様:
- `onReady`: プレイヤー iframe が初期化されたことを示す。動画メタデータはまだロードされていない。
- `loadVideo()`: 動画メタデータの非同期フェッチを開始する。
- `onStateChange(BUFFERING)`: 動画データ（メタデータ含む）がロードされ、バッファリングが始まった状態。この時点で `getDuration()` は実際の動画長を返す。
- `onStateChange(PLAYING)`: BUFFERING の後に遷移する状態。duration は確定済み。

`getDuration()` が 0 から非ゼロに変わる最初の信頼できるタイミング = 最初の `BUFFERING` 状態遷移。

### Alternatives Considered
| アプローチ | 評価 |
|---|---|
| `onReady` 内で `getDuration()` を直接呼ぶ（現状） | ❌ 常に 0 を返す（バグの原因） |
| `setInterval` で duration > 0 になるまでポーリング | ❌ テスト困難、CPU 無駄遣い、タイムアウト処理が必要 |
| `onStateChange` の最初の `BUFFERING`/`PLAYING` で適用 | ✅ YouTube API が保証するタイミング、既存ポートで対応可能 |
| `VideoPlayerPort` に `onVideoLoaded` を追加 | △ 正当だが、1箇所のバグ修正に対してポートの拡張は過剰 |

---

## Q2: VideoPlayerPort インターフェース変更の要否

### Decision
`VideoPlayerPort` インターフェースの変更は**不要**。
既存の `onStateChange(callback: (state: PlayerState) => void)` を使用する。

### Rationale
`PlayerState` 型にはすでに `'BUFFERING'` が含まれており、`onStateChange` は `VideoPlayerPort` インターフェースの一部として定義済み。
修正は `+page.svelte` の `onMount` ブロック内のみで完結する。

---

## Q3: FakeVideoPlayer の対応

### Decision
`FakeVideoPlayer` に `simulateStateChange(state: PlayerState)` ヘルパーを追加する。

### Rationale
既存のヘルパー群（`simulateReady()`, `simulateError()`, `setDuration()`）と同じパターン。
`simulateReady()` でプレイヤー初期化、`setDuration(d)` で期待 duration をセット、`simulateStateChange('BUFFERING')` でタイミングをシミュレートするテストが書ける。
`simulateStateChange` は既存の `_stateCallbacks` を呼ぶだけなので実装は trivial。

---

## Q4: 一回限り適用フラグの実装

### Decision
`shareParamsApplied` boolean フラグを `onMount` スコープ内のローカル変数として持つ。
`onStateChange` ハンドラ内で `if (shareParamsApplied) return;` でガードしてから `shareParamsApplied = true` をセットする。

### Rationale
- 動画を途中で別の動画に切り替えた場合は `shareParamsApplied` が既に `true` なので URL params は再適用されない（正しい動作）
- 新しいページロード時は毎回 `false` から始まるのでリセット不要
- Svelte `$state` にする必要はない（DOM 更新不要）

---

## Q5: B点クランプ通知の実装

### Decision
既存の `shareToast` 変数を流用する。`setTimeout` で自動消去する既存パターンを使う。

### Rationale
spec 明記: 「既存の shareToast パターンを流用」（Clarifications セクション参照）。
新しい状態変数や通知コンポーネントは不要。既存の `share.loop_clamped` キー（en.json/ja.json に存在済み）を `$t('share.loop_clamped')` で参照する。

---

## 結論: 実装範囲

変更ファイル:
1. `src/routes/+page.svelte` — `onReady` 内の URL params 適用ロジックを `onStateChange` 最初の BUFFERING/PLAYING に移動
2. `src/lib/fakes/FakeVideoPlayer.ts` — `simulateStateChange()` ヘルパー追加
3. `src/lib/i18n/en.json` / `ja.json` — 変更なし（`share.loop_clamped` キーが既存）
4. `tests/unit/shared-url-restore.test.ts` — 新規単体テスト（TDD Red 先行）
5. `tests/e2e/share-url.test.ts` — スキップ維持（手動確認コメント追記のみ）

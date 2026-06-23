# UI Behavior Contract: 共有URL読み込み修正

**Feature**: 004-fix-shared-url  
**Date**: 2026-06-23

---

## URL パラメータ処理フロー

### 正常系（有効な共有URL）

入力 URL 例: `/?v=dQw4w9WgXcQ&a=10.5&b=50.0&s=1.5`

| ステップ | タイミング | 画面状態 |
|---|---|---|
| 1. ページロード | 即時 | YouTube IFrame 表示（プレイヤー初期化中） |
| 2. `onReady` | プレイヤー初期化完了 | `loadVideo()` 呼び出し; A/B マーカー未表示 |
| 3. `onStateChange(BUFFERING)` | 動画メタデータ確定 | A/Bマーカーを正しい位置に表示; 再生速度セット |
| 4. ユーザー操作 | 任意タイミング | タップ/クリックで再生開始; A-Bループ動作 |

**保証事項**:
- A/B マーカーは step 3 完了後に正しい位置（±0.1秒）に表示される
- 再生はユーザー操作まで開始しない（自動再生なし）
- SC-001: step 3 が URL 開封から 5 秒以内に完了する

---

### 異常系: B点クランプ

入力 URL 例: `/?v=dQw4w9WgXcQ&a=10&b=99999&s=1.0`（B点 > 動画長）

| ステップ | 画面状態 |
|---|---|
| `onStateChange(BUFFERING)` | B点を動画終端にクランプして A/B マーカー表示 |
| 同時 | トースト通知表示（`share.loop_clamped` i18n キー）|
| 3秒後 | トースト自動消去 |

---

### 異常系: 不正パラメータ / `v` のみ

入力 URL 例: `/?v=dQw4w9WgXcQ`（A/B なし）

| 動作 |
|---|
| 動画は読み込まれる |
| A/B マーカーは表示されない（ループ設定なし） |
| トースト通知なし |
| 通常の初期状態で起動 |

---

## トースト表示仕様

| プロパティ | 値 |
|---|---|
| 表示変数 | `shareToast`（既存の `toast`/`shareToast` と同じ変数） |
| 自動消去 | 3 秒後（`setTimeout` 3000ms） |
| 表示タイミング | B点クランプ発生時のみ (`onStateChange(BUFFERING)` 内) |
| i18n キー | `share.loop_clamped` |

---

## 非機能要件

- **自動再生なし**: モバイルブラウザのポリシー対応（FR-004 / 仕様書 Clarifications 参照）
- **べき等性**: `onStateChange` が複数回 BUFFERING/PLAYING を発火しても A/B は1回だけ適用される（`shareParamsApplied` フラグによる）
- **エラー状態への非伝播**: 不正URLでもアプリはクラッシュしない（FR-007）

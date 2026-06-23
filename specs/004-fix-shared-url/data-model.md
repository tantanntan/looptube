# Data Model: 共有URL読み込み修正

**Feature**: 004-fix-shared-url  
**Date**: 2026-06-23

---

## 新規エンティティ

なし。既存エンティティおよびポート定義の変更なし。

---

## 変更される状態変数（+page.svelte スコープ）

| 変数名 | 型 | 既存/新規 | 用途 |
|---|---|---|---|
| `shareResult` | `ParseResult` | 既存 | `UrlSerializer.parse()` の結果。OK 時は `pointA`, `pointB`, `speed` を持つ |
| `shareParamsApplied` | `boolean` | **新規** | URL params を1回だけ適用するフラグ |
| `shareToast` | `string` | 既存 | トースト通知テキスト。クランプ発生時にも流用 |

### shareParamsApplied の状態遷移

```
初期値: false
  │
  ▼ (onStateChange: 最初の BUFFERING or PLAYING)
  │
  shareParamsApplied = true  ← ok に関係なく常に true にする
  │
  ├─ [shareResult.ok === true]
  │    getDuration() → clamp → setA/setB
  │    [clamp 発生時] shareToast = $t('share.loop_clamped')
  │
  └─ [shareResult.ok !== true] 
       何もしない（以後の BUFFERING/PLAYING でも再試行しない）
```

> **設計根拠**: `ok !== true` のとき false のままにすると、以後の BUFFERING/PLAYING イベントでも毎回判定が繰り返される。「1回だけ適用」を保証するため、`shareResult.ok` に関係なく最初の対象 state で即 `true` にセットする。

---

## 既存エンティティ（変更なし）

### ParseResult (UrlSerializer.ts)
```typescript
type ParseResult =
  | { ok: true; videoId: string; pointA: number; pointB: number; speed: number; warnings: string[] }
  | { ok: false; errors: string[] };
```

### PlayerState (VideoPlayerPort.ts)
```typescript
type PlayerState = 'UNSTARTED' | 'ENDED' | 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'CUED';
```

`BUFFERING` が `getDuration()` 信頼可能タイミングの判定に使われる（research.md 参照）。

---

## i18n キー（既存流用・追加不要）

`share.loop_clamped` キーはすでに `en.json` / `ja.json` に存在するため、新規追加は不要。

| キー | en | ja |
|---|---|---|
| `share.loop_clamped` | `"Loop points were adjusted to fit the video duration."` | `"ループポイントが動画の長さに合わせて調整されました。"` |

`UrlSerializer.clampToDuration()` は `clamped === true` のとき `message: 'share.loop_clamped'` を返す。実装側はこの文字列を `$t('share.loop_clamped')` への引数として使用する。

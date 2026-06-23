# Research: 動画視聴履歴

## 1. StoragePort 拡張戦略

**Decision**: 既存の `StoragePort` は拡張せず、新規の `HistoryPort` インターフェースを作成する。

**Rationale**: `StoragePort` の現在のメソッド（`listByVideoId`, `upsert`, `mergeAll`）は Segment（ABループ区間）専用であり、History とは責務が異なる。別インターフェースにすることで独立したテスト・実装が可能になる。

**Alternatives considered**:
- `StoragePort` にジェネリック型を追加 → 既存実装の破壊的変更が必要で得策でない
- 既存 `LocalStorageAdapter` に history メソッドを追加 → 単一責任原則に反する

---

## 2. YouTube 動画 ID 抽出・正規化

**Decision**: `+page.svelte` 内の `normalizeVideoId` 関数を `src/lib/core/` 配下の共通ユーティリティ `YouTubeUrlParser.ts` に切り出し、`videoId` 抽出ロジックを共有する。

**Current logic** (`+page.svelte:235-242`):
```typescript
function normalizeVideoId(input: string): string {
  try {
    const url = new URL(input);
    return url.searchParams.get('v') ?? url.pathname.replace(/^\//, '');
  } catch {
    return input.trim();
  }
}
```
これで `youtu.be/ID`（pathname `/ID` → `ID`）と `youtube.com/watch?v=ID` の両方に対応済み。

**Enhancement needed**: `youtube.com/embed/ID` と `youtube.com/shorts/ID` 形式も対応するよう拡張する。

**Rationale**: 重複排除キーは YouTube 動画 ID であるため、URL 正規化は必須。Page コンポーネントに埋め込むより純粋関数として切り出す方がテスト容易性が高い。

---

## 3. Svelte 5 状態管理方針

**Decision**: 履歴データは `+page.svelte` の `$state` で保持し、`VideoHistoryRepository` から読み込む。ドロワー開閉も同様に `$state` で管理する。

**Rationale**: 既存の `machine`, `segments` 等の状態管理パターンと統一。サーバーサイドは不要（クライアントのみ）。

---

## 4. LocalStorage キー設計

**Decision**: `looptube:history` をキーとする（既存の Segment 保存キーとは分離）。

**Rationale**: 既存の `LocalStorageAdapter` は `looptube` プレフィックスの別キーを使用しているため、同じ命名規則に従う。

---

## 5. 最大件数超過時の削除戦略

**Decision**: `addedAt` が最も古いアイテムを削除（FIFO）。

**Rationale**: 仕様書の「最も古い履歴アイテムが自動的に削除される」に準拠。`addedAt` で昇順ソートした末尾を削除。

---

## 6. サムネイル URL の取得元

**Decision**: YouTube のサムネイル URL は `https://img.youtube.com/vi/{videoId}/mqdefault.jpg` の形式で構成可能。動画 ID が確定した時点で確定的に生成できるため、外部 API 呼び出しは不要。

**Rationale**: IFrame Player API でサムネイルを取得する API は存在せず、`oEmbed` 等への別途リクエストが必要になる。一方、動画 ID から直接 URL を組み立てる方法は確定的で高速。仕様書の「取得できない場合は null」は、将来の非 YouTube 動画への拡張を想定した設計として保持する。

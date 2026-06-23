# Data Model: 動画視聴履歴

## HistoryItem

メモリ上の型定義。`HistoryPort` や `VideoHistoryRepository` で使用。

```typescript
interface HistoryItem {
  id: string;           // YouTube 動画 ID（deduplication キー）
  url: string;          // ユーザーが最後に入力した URL（短縮 URL 等、入力値をそのまま保存）
  title: string;        // 動画タイトル（取得できない場合は空文字 ""）
  thumbnailUrl: string; // サムネイル URL（動画 ID から構成: img.youtube.com/vi/{id}/mqdefault.jpg）
  addedAt: Date;        // 履歴追加日時
}
```

**Uniqueness**: `id` フィールド（YouTube 動画 ID）が deduplication キー。同じ `id` を持つアイテムは1件のみ存在する。

**Ordering**: `addedAt` 降順（新しい順）で取得する。

## HistoryItemStorage（永続化フォーマット）

LocalStorage への JSON シリアライズ形式。

```typescript
interface HistoryItemStorage {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  addedAt: string; // ISO 8601 文字列
}
```

**Storage key**: `looptube:history`  
**Format**: `JSON.stringify(HistoryItemStorage[])`

## HistoryPort インターフェース

```typescript
interface HistoryPort {
  getAll(): Promise<HistoryItem[]>;           // addedAt 降順で全件返す
  add(item: HistoryItem): Promise<void>;      // upsert (id 一致で先頭へ移動)
  remove(id: string): Promise<void>;          // id で削除（存在しない場合は no-op）
  clear(): Promise<void>;                     // 全件削除
}
```

## VideoHistoryRepository（ビジネスロジック層）

`HistoryPort` を包む Repository。以下のビジネスルールを担当：

| ルール | 実装場所 |
|--------|---------|
| 同一動画 ID の重複排除（先頭へ移動） | `add()` メソッド内 |
| 最大 50 件を超えたら最古を削除 | `add()` メソッド内 |
| `addedAt` 降順ソート | `getAll()` 戻り値 |

## YouTubeUrlParser ユーティリティ

純粋関数として `src/lib/core/YouTubeUrlParser.ts` に配置。

```typescript
// URL またはビデオ ID 文字列から YouTube 動画 ID を抽出
function extractVideoId(input: string): string {
  // 対応フォーマット:
  // - https://www.youtube.com/watch?v=ID
  // - https://youtu.be/ID
  // - https://www.youtube.com/embed/ID
  // - https://www.youtube.com/shorts/ID
  // - ID (raw video ID)
}

// 動画 ID からサムネイル URL を生成
function buildThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}
```

## ファイル構成

```
src/lib/
  core/
    YouTubeUrlParser.ts          # 新規: URL/ID 正規化ユーティリティ
    VideoHistoryRepository.ts    # 新規: History ビジネスロジック
  ports/
    HistoryPort.ts               # 新規: HistoryPort インターフェース
  adapters/
    LocalHistoryAdapter.ts       # 新規: localStorage 実装
  fakes/
    InMemoryHistoryAdapter.ts    # 新規: テスト用インメモリ実装
  components/
    VideoHistoryDrawer.svelte    # 新規: 履歴ドロワーコンポーネント
    VideoHistoryItem.svelte      # 新規: 履歴アイテムコンポーネント
    LoopTubeHeader.svelte        # 変更: 履歴アイコンボタン追加
tests/unit/
  YouTubeUrlParser.test.ts       # 新規
  VideoHistoryRepository.test.ts # 新規
  LocalHistoryAdapter.test.ts    # 新規
src/lib/i18n/
  ja.json                        # 変更: history.* キー追加
  en.json                        # 変更: history.* キー追加
```

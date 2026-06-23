# Implementation Plan: 動画視聴履歴

**Feature Branch**: `005-video-history`  
**Spec**: [spec.md](./spec.md)  
**Data Model**: [data-model.md](./data-model.md)  
**Research**: [research.md](./research.md)

---

## Technical Context

| 項目 | 決定事項 |
|------|---------|
| 言語・フレームワーク | TypeScript + Svelte 5 + SvelteKit |
| 状態管理 | Svelte 5 `$state` rune（`+page.svelte` で保持） |
| 永続化 | `localStorage`（`LocalHistoryAdapter` 経由） |
| テスト | Vitest + `InMemoryHistoryAdapter`（ブラウザ依存排除） |
| i18n | ParaglideJS（`ja.json` / `en.json`） |
| ストレージキー | `looptube:history` |
| 最大件数 | 50 件 |

---

## Constitution Check

| ゲート | 状態 | 備考 |
|--------|------|------|
| Port/Adapter パターン遵守 | PASS | `HistoryPort` + `LocalHistoryAdapter` + `InMemoryHistoryAdapter` |
| ドメインロジックに `window`/`HTMLElement` 非依存 | PASS | `VideoHistoryRepository` は純粋 TypeScript |
| StoragePort は `LocalStorageAdapter` 経由 | PASS | 新規 `HistoryPort` も同様のパターンに従う |
| ユニットテスト: Fake 実装でカバー | PASS | `InMemoryHistoryAdapter` を用意 |
| i18n 対応 | PASS | 全ラベルを `ja.json`/`en.json` に追加 |
| `<style></style>` ブロック必須（SSR）| PASS | 全 `.svelte` に空 style ブロックを含める |

---

## Phase 1: コアドメイン層

### 1-1. `YouTubeUrlParser.ts`（新規）

`src/lib/core/YouTubeUrlParser.ts`

- `extractVideoId(input: string): string` — URL または生 ID から動画 ID を抽出
  - 対応: `watch?v=`, `youtu.be/`, `embed/`, `shorts/`, 生 ID
- `buildThumbnailUrl(videoId: string): string` — `https://img.youtube.com/vi/{id}/mqdefault.jpg` を返す
- `+page.svelte` の `normalizeVideoId` を本関数に置き換える

### 1-2. `HistoryPort.ts`（新規）

`src/lib/ports/HistoryPort.ts`

```typescript
interface HistoryItem { id, url, title, thumbnailUrl, addedAt: Date }
interface HistoryPort {
  getAll(): Promise<HistoryItem[]>;
  add(item: HistoryItem): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
```

### 1-3. `InMemoryHistoryAdapter.ts`（新規）

`src/lib/fakes/InMemoryHistoryAdapter.ts`

- `HistoryPort` のインメモリ実装（テスト専用）
- `Map<string, HistoryItem>` で保持

### 1-4. `LocalHistoryAdapter.ts`（新規）

`src/lib/adapters/LocalHistoryAdapter.ts`

- `HistoryPort` の localStorage 実装
- キー: `looptube:history`
- `getAll()`: JSON.parse → `addedAt` を `Date` に復元 → エラー時は空配列を返す
- `add()`: getAll → upsert（同 id があれば更新） → JSON.stringify → setItem → エラー時はサイレントに継続
- `remove()`: getAll → filter → setItem
- `clear()`: removeItem

### 1-5. `VideoHistoryRepository.ts`（新規）

`src/lib/core/VideoHistoryRepository.ts`

- コンストラクタ: `HistoryPort` を DI
- `add(item)`:
  1. `getAll()` で現在の一覧を取得
  2. 同 `id` のアイテムを除去（deduplication）
  3. 先頭に追加、50 件を超えた分を末尾から削除
  4. `port.add()` ではなく全件 upsert（→ ポートの責務を `add` 1件に限定するか全件保存にするか設計に依存。全件保存で統一する）
- `getAll()`: `port.getAll()` を `addedAt` 降順でソートして返す
- `remove(id)`: `port.remove(id)` に委譲
- `buildHistoryItem(videoId, url, title?)`: `HistoryItem` を組み立てるファクトリ

---

## Phase 2: UI 層

### 2-1. `VideoHistoryItem.svelte`（新規）

`src/lib/components/VideoHistoryItem.svelte`

Props:
- `item: HistoryItem`
- `onSelect: (item: HistoryItem) => void`
- `onDelete: (id: string) => void`

表示:
- サムネイル画像（`thumbnailUrl`、フォールバック: プレースホルダー SVG）
- タイトル（空文字の場合は `item.url`）
- ゴミ箱アイコンボタン（常時表示）

### 2-2. `VideoHistoryDrawer.svelte`（新規）

`src/lib/components/VideoHistoryDrawer.svelte`

Props:
- `open: boolean`
- `items: HistoryItem[]`
- `onClose: () => void`
- `onSelect: (item: HistoryItem) => void`
- `onDelete: (id: string) => void`

表示:
- オーバーレイ + ドロワーパネル（右または下からスライド）
- 空状態メッセージ（`items.length === 0` のとき）
- `VideoHistoryItem` のリスト

### 2-3. `LoopTubeHeader.svelte`（変更）

- 履歴アイコンボタンを追加（Props: `onHistoryClick: () => void`）

### 2-4. `+page.svelte`（変更）

- `VideoHistoryRepository` をインスタンス化（`browser` ガード付き）
- `$state`: `historyItems: HistoryItem[]`, `historyOpen: boolean`
- `handleLoad()` 成功後に `repository.buildHistoryItem()` → `repository.add()` → `historyItems` 更新
- `handleHistorySelect(item)`: URL 入力欄を `item.url` に設定し `handleLoad()` を呼ぶ
- `handleHistoryDelete(id)`: `repository.remove(id)` → `historyItems` 更新
- `<VideoHistoryDrawer>` と `<LoopTubeHeader>` に各ハンドラを渡す

---

## Phase 3: i18n & テスト

### 3-1. i18n キー追加（`ja.json` / `en.json`）

```json
"history": {
  "button_label": "履歴",
  "drawer_title": "視聴履歴",
  "empty": "履歴はまだありません",
  "delete_label": "この動画を履歴から削除"
}
```

### 3-2. ユニットテスト

- `tests/unit/YouTubeUrlParser.test.ts`
  - 各 URL フォーマットで正しい動画 ID が抽出されるか
  - 生 ID が入力された場合にそのまま返るか
- `tests/unit/VideoHistoryRepository.test.ts`
  - `add()` で同 ID が重複しないか
  - `add()` で 50 件を超えたら最古が削除されるか
  - `getAll()` が `addedAt` 降順で返るか
  - `remove()` で対象が削除されるか
- `tests/unit/LocalHistoryAdapter.test.ts`
  - localStorage への読み書きが正しく行われるか
  - localStorage が壊れているとき（JSON parse エラー）に空配列を返すか
  - `add()` 失敗時にエラーを throw しないか

---

## 実装順序（推奨）

1. `YouTubeUrlParser.ts` + テスト
2. `HistoryPort.ts` + `InMemoryHistoryAdapter.ts`
3. `VideoHistoryRepository.ts` + テスト（InMemory を使用）
4. `LocalHistoryAdapter.ts` + テスト
5. `VideoHistoryItem.svelte` + `VideoHistoryDrawer.svelte`
6. `LoopTubeHeader.svelte` 変更
7. `+page.svelte` 統合
8. i18n キー追加
9. 手動 E2E 確認

---

## 依存関係

```
YouTubeUrlParser ← (独立)
HistoryPort ← (独立)
InMemoryHistoryAdapter → HistoryPort
LocalHistoryAdapter → HistoryPort
VideoHistoryRepository → HistoryPort, YouTubeUrlParser
VideoHistoryItem.svelte → HistoryItem (型のみ)
VideoHistoryDrawer.svelte → VideoHistoryItem, HistoryItem (型のみ)
+page.svelte → VideoHistoryRepository, LocalHistoryAdapter, VideoHistoryDrawer, LoopTubeHeader
```

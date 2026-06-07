# UIリニューアル 実装計画書

Slack Resume Generator の UI を刷新するための実装計画。
本書は **トンマナの確定 → デザイントークン → 段階的実装** までを定義する。

- 主眼: **shadcn/ui への統一・一貫性・アクセシビリティ（a11y）向上**
- 実装規約: `.claude/skills/frontend-nextjs/SKILL.md` および `CLAUDE.md` に準拠
- 状態: 計画確定済み（実装は Phase 0 から着手予定）

---

## 1. 確定トンマナ

| 項目 | 決定 |
|---|---|
| 方向性 | モダンSaaS（プロダクトツール感、Vercel / Linear 系） |
| アクセント | 青 Blue `#2563eb` |
| 書体 | Inter（欧文）+ Noto Sans JP（和文） |
| 質感 | Vercel風クリーン（角丸 8px・ごく薄い影・広め余白） |

> 従来の「和紙 × 墨 × 朱のエディトリアル」は**全面置換**する。

---

## 2. デザイントークン仕様

### 2-1. カラーパレット（Slate + Blue）

| 用途 | 値 |
|---|---|
| アプリ地 | `#f8fafc` (slate-50) |
| カード / サーフェス | `#ffffff` |
| 本文テキスト | `#0f172a` (slate-900) |
| 補助テキスト | `#475569` (slate-600) |
| 微弱テキスト | `#94a3b8` (slate-400) |
| 罫線 | `#e2e8f0` (slate-200) |
| 罫線（強）/ 入力枠 | `#cbd5e1` (slate-300) |
| ブランド（青） | `#2563eb` (blue-600) |
| ブランド hover | `#1d4ed8` (blue-700) |
| 選択中 / 薄青背景 | `#eff6ff` (blue-50) |
| フォーカスリング | `#2563eb` |
| 成功（取得 / 保存完了） | `#16a34a` (green-600) |
| エラー | `#dc2626` (red-600) |

> エラーをブランド青と別色の赤にすることで、状態の区別が明確になり a11y が向上する。

### 2-2. 形状・質感

- 角丸: `--radius: 0.5rem`（8px）
- 影: `0 1px 3px rgb(0 0 0 / .06), 0 1px 2px -1px rgb(0 0 0 / .04)`（ごく薄い）
- 余白: カード内 padding・要素間 gap を現状より広めに

### 2-3. タイポグラフィ

- 欧文 **Inter** / 和文 **Noto Sans JP**（`next/font/google`）
- 見出しもサンセリフ太字。明朝（`font-display` = Shippori Mincho）は廃止

---

## 3. 廃止する和紙要素

- `body` の和紙ノイズ背景＋朱の放射グラデ → フラットな `#f8fafc`
- Shippori Mincho（明朝見出し）
- 落款スピナー（「職」字＋回転リング）→ クリーンな `<Spinner>`
- カード上辺の朱グラデ → 廃止（クリーンな白カード）
- 未使用の `seal-in` アニメーション → 削除
- ※ `animate-rise` / `animate-fade` はモダンでも自然なため**維持**

---

## 4. frontend-nextjs スキル準拠チェック

| 規約 | 対応 |
|---|---|
| shadcn は「そのまま使う・不要なラッパーを作らない」 | 準拠。プリミティブを直接利用 |
| `components/ui/` は直接編集しない | 準拠。テーマ変更は `app/globals.css` の CSS変数のみ |
| 追加は `npx shadcn@latest add` | 準拠 |
| スタイリングは Tailwind ＋ 条件分岐は `cn()` | 準拠。自作 `inputClass` 等を廃止し `cn()` に統一 |
| アイコンは lucide-react 推奨 | 準拠。自作SVGを lucide に置換 |
| Props は各ファイル内 `interface XxxProps` | 準拠（既存維持） |
| `export default function` / 制御コンポーネント | 準拠（既存維持） |
| データ取得は `page.tsx` 集約・保存は Server Action | 変更なし（UIのみ刷新、ロジックは不変） |

> 本計画は UI 層のみの変更で、`actions/` `services/` `schemas/` `app/api/` のロジックには手を入れない。

---

## 5. 実装フェーズ

### Phase 0: デザイントークン定義（最重要・最初に実施）

対象: `app/globals.css`

shadcn のセマンティックトークン（現状すべて無彩色グレー）と、既存マークアップが多用する `--color-*` の両方を新パレットに再定義する。これにより**マークアップを触らずに見た目が即切替**でき、以降の移行を低リスク化できる。

```
shadcnトークン        →  値
--background          →  #f8fafc
--foreground         →  #0f172a
--card / --popover   →  #ffffff
--card-foreground    →  #0f172a
--primary            →  #2563eb
--primary-foreground →  #ffffff
--secondary          →  #f1f5f9
--secondary-foreground → #0f172a
--muted              →  #f1f5f9
--muted-foreground   →  #64748b
--accent (hover地)    →  #f1f5f9   ※選択中の薄青 #eff6ff は明示指定
--accent-foreground  →  #0f172a
--border / --input   →  #e2e8f0
--ring               →  #2563eb
--destructive        →  #dc2626
--radius             →  0.5rem
```

`@theme inline` 内の `--color-*` も同パレットへ:

```
--color-paper / surface-raised → #f8fafc / #ffffff
--color-ink / ink-soft / ink-faint → #0f172a / #475569 / #94a3b8
--color-line / line-strong → #e2e8f0 / #cbd5e1
--color-accent / accent-deep / accent-soft → #2563eb / #1d4ed8 / #eff6ff
--color-success → #16a34a
```

あわせて:
- `body` の和紙ノイズ／放射グラデ背景を削除し `#f8fafc` フラットに
- `seal-in` keyframe を削除
- `.focus-ink` を廃止し、shadcn の `focus-visible:ring-ring/50`（= 青リング）へ一本化
- `--font-display` をサンセリフへ変更（明朝廃止）

**完了直後に一度ビルド＆目視確認**し、色崩れがないことを確認してから Phase 2 へ進む。

---

### Phase 1: 未導入 shadcn コンポーネントの追加

```bash
npx shadcn@latest add select radio-group label
```

- `select` … MonthRangePicker の年月セレクト用（必須）
- `radio-group` … ChannelSelector の排他選択用（a11y 修正の要）
- `label` … ラベル統一（推奨）

導入済み: `button` `card` `input` `textarea` `checkbox` `badge` `combobox` `input-group` `spinner`

---

### Phase 2: コンポーネント移行（ファイル単位）

#### 2-1. `app/layout.tsx`
- `Geist` → `Inter`、`Shippori Mincho` / `Zen Kaku Gothic New` の `<link>` → `Noto Sans JP`
- `--font-sans: Inter, "Noto Sans JP", system-ui, sans-serif`

#### 2-2. `components/DateRangePicker.tsx`
- `<input type="date">` → `<Input type="date">`、`<label>` → `<Label htmlFor>`
- 自作 `inputClass` 削除、必要な調整は `cn()` で付与

#### 2-3. `components/ChannelForm.tsx`
- `TextField` 内: `<input>`→`<Input>` / `<textarea>`→`<Textarea>` / `<label>`→`<Label>`
- 共通 `fieldClass` を削除（shadcn 側に集約）
- 保存ボタン → `<Button>`（青・hover で blue-700）
- 自作SVGアイコン → lucide（例 `ArrowDownToLine`）

#### 2-4. `components/MonthRangePicker.tsx`（移行コスト中）
- 自作 `<select>` + `Chevron` → shadcn `<Select>`（`SelectTrigger/Content/Item`）
- `aria-invalid` を trigger に伝播
- モバイル対応: ラベル横並び（`w-16`）を `sm` 未満で縦積みに

#### 2-5. `components/ChannelSelector.tsx`（a11y の要）
- 検索 `<input>` → `<Input>`（虫眼鏡は lucide `Search`）
- 件数表示 → `<Badge variant="secondary">`
- **排他選択を `<RadioGroup>` / `<RadioGroupItem>` に変更**（現状は見た目チェックボックスだが挙動は単一選択 ＝ スクリーンリーダーに誤認される a11y バグ）。見た目は踏襲し `role` を正す
- 選択中行の背景は `#eff6ff`（薄青）を明示指定
- ローディングスケルトンは `bg-muted` 参照に統一

#### 2-6. `components/TechTagInput.tsx`
- 選択済みタグ → `<Badge>`（削除は lucide `X`）
- 入力枠を Input 相当のスタイルへ
- **a11y 追加**: サジェストに `role="listbox"` / `role="option"`、`aria-activedescendant`、入力に `aria-expanded` / `aria-controls`
- ※ base-ui `Combobox` への全面移行は挙動リスクが高い（複数選択・カテゴリ表示の自作ロジック）ため、今回は見た目と a11y 属性のみ寄せる（全面移行は将来課題）

#### 2-7. `components/LoadingOverlay.tsx`
- 落款スピナー（「職」字＋回転リング）→ `<Spinner className="size-8 text-primary">`
- 暗幕＋中央配置・`aria-live` は維持

#### 2-8. `components/ErrorMessage.tsx`
- `text-accent`（朱）→ `text-destructive`（赤）参照へ。意味づけが正しくなる

#### 2-9. `app/resume/register/page.tsx`
- カード本体 `<main>` → `<Card>`（上辺の朱グラデは削除）
- Step1/Step2 の CTA → `<Button>`、「設定に戻る」→ `<Button variant="link">`
- 取得結果バナー → 成功色（green-600 系）、保存結果バナー → 同様、エラーは `destructive`
- ステップインジケーターの active に `aria-current="step"` を付与

---

### Phase 3: アクセシビリティ仕上げチェックリスト

- [ ] フォーカスリングが全要素で青に統一（`.focus-ink` 全廃を確認）
- [ ] ChannelSelector が `radiogroup` セマンティクスで読み上げられる
- [ ] TechTagInput の listbox / activedescendant が機能する
- [ ] 全 `<Input>` / `<Select>` / `<Textarea>` が `<Label htmlFor>` と紐付く
- [ ] `aria-invalid` がエラー時に各フィールドへ伝播（shadcn が自動でリング表示）
- [ ] ステップに `aria-current="step"`
- [ ] `prefers-reduced-motion`（既存対応を維持）
- [ ] コントラスト比: 微弱テキスト `#94a3b8` on `#ffffff` の AA を確認（サイズ次第で `#64748b` に格上げ）

---

## 6. 作業順（推奨）

1. **Phase 0**（トークン）→ ビルド & 目視確認
2. `2-1`（フォント）→ `2-2` / `2-3`（低リスク置換）
3. `2-7` / `2-8` / `2-9`（オーバーレイ・エラー・ページ）
4. `2-4`（Select 移行）→ 単体検証
5. `2-5`（RadioGroup 移行）→ a11y 検証
6. `2-6`（TechTagInput）
7. **Phase 3** 通し確認

---

## 7. リスク・留意点

1. **トークン橋渡しの影響範囲が全画面**。Phase 0 完了直後に必ずビルド & 目視確認。
2. **Select 移行**はネイティブ → Radix で挙動差（キーボード・モバイル）。MonthRangePicker 単体で先に検証。
3. **ロジック非変更**: `actions/` `services/` `schemas/` `app/api/` には手を入れない（UI 層のみ）。
4. **ダークモード**は今回スコープ外。`.dark` ブロックは未整合のため、ダークトグルは提供しない。

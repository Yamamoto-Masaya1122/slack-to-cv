# Slack Resume Generator

SlackのメッセージからAIが職務経歴書のプロジェクト詳細を自動生成するWebアプリ。
Slackメッセージとフォーム入力データをファイルにエクスポートし、Claude Codeに渡して職務経歴書を生成する。

## 技術スタック
- Next.js 14 (App Router) / TypeScript / Tailwind CSS
- @slack/web-api / zod（バリデーション）

## ディレクトリ構成
```
app/
  resume/
    register/
      page.tsx            # 初期設定画面（Step1）+ 職務経歴書作成画面（Step2）
  api/
    messages/
      route.ts            # GET: チャンネル一覧 / POST: メッセージ抽出
components/
  LoadingOverlay.tsx      # 全画面オーバーレイローディング
  TechTagInput.tsx        # 利用技術の自動補完タグ入力
  ErrorMessage.tsx        # バリデーションエラー表示
  ChannelSelector.tsx     # チャンネル一覧・検索・排他チェックボックス
  DateRangePicker.tsx     # 開始日・終了日の期間入力（Step1）
  MonthRangePicker.tsx    # 開始年月・終了年月の期間入力（Step2）
  ChannelForm.tsx         # 入力フォーム全体
constants/
  technologies.ts         # 利用技術定数
  validation.ts           # Zodスキーマ定義
lib/
  slack.ts                # Slack APIクライアント
types/
  index.ts                # 型定義
```

## コンポーネント設計方針
- `components/` に全て集約
- 命名規則: PascalCase（例: `ChannelSelector.tsx`）
- 1ファイル1コンポーネント
- Props型定義: 各ファイル内に `interface XxxProps` を定義
- データ取得・状態管理は `page.tsx` に集約、コンポーネントはUI描画に専念

## バリデーション（Zod）
```ts
// constants/validation.ts
const Step1Schema = z.object({
  dateFrom: z.string().min(1, "開始日を入力してください"),
  dateTo: z.string().min(1, "終了日を入力してください"),
  channelId: z.string().min(1, "チャンネルを選択してください"),
}).refine(/* 開始日 ≤ 終了日 */);

const ChannelFormSchema = z.object({
  periodFrom: z.object({
    year: z.string().min(1, "開始年月を入力してください"),
    month: z.string().min(1, "開始年月を入力してください"),
  }),
  periodTo: z.object({
    year: z.string().min(1, "終了年月を入力してください"),
    month: z.string().min(1, "終了年月を入力してください"),
  }),
  jobTitle: z.string().min(1, "職種を入力してください"),
  role: z.string().min(1, "役割を入力してください"),
  teamSize: z.string().min(1, "チーム規模を入力してください"),
  jobDescription: z.string().min(1, "仕事内容を入力してください"),
  technologies: z.array(z.string()).min(1, "利用技術を1つ以上選択してください"),
}).refine(/* 開始年月 ≤ 終了年月 */);
```

## ダウンロードファイル仕様
ボタン1つで以下2ファイルを同時ダウンロード。

**{channel_name}_messages.json**
```json
{
  "channel": "dev-backend",
  "period": { "from": "2024-01-01", "to": "2024-12-31" },
  "messages": [
    { "type": "posted", "text": "メッセージ内容", "ts": "2024-03-01 10:00" }
  ]
}
```

**resume_draft.md**
```markdown
# 職務経歴書生成指示

## あなたへのお願い
このファイルと同梱の `{channel_name}_messages.json` を元に、
「プロジェクト詳細・担当業務・主な実績」を生成してください。

## 生成ルール
▼担当業務
（担当した業務の概要・開発フェーズを1〜2文で）

▼詳細
■ Situation（状況）: どんなプロジェクト・チーム環境だったかを文章で
■ Task（課題）: どんな問題・課題があったかを文章で
■ Action（行動）: 課題に対して具体的に何をしたかを文章で
■ Result（結果）: 成果を文章で。可能な限り数値・割合・時間で定量表現

## 制約
- 全体400文字以内で出力すること
- Slackメッセージから読み取れない情報は根拠なく作らないこと
- 推測が必要な場合は合理的な範囲にとどめること
- 生成完了後はMarkdown形式でターミナルに表示すること

---

## プロジェクト情報
- チャンネル: {channel_name}
- 期間: {periodFrom}〜{periodTo}
- 職種: {jobTitle}
- 役割: {role}
- チーム規模: {teamSize}
- 仕事内容: {jobDescription}
- 利用技術: {technologies}

### プロジェクト詳細・担当業務・主な実績
<!-- ここをClaude Codeが埋める -->
```

## 環境変数
```env
SLACK_USER_TOKEN=xoxp-...    # Slack User OAuth Token
SLACK_USER_ID=U0123456789    # SlackメンバーID
```

## 開発サーバー起動
```bash
npm install && npm run dev
# http://localhost:3000
```

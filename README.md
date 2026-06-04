# slack-to-cv

SlackのメッセージとフォームデータをもとにAIが職務経歴書のプロジェクト詳細を
下書きするための、2 STEP ウィザード型 Web アプリです。
対象チャンネル・期間を指定して本人の発言を抽出し、入力したプロジェクト情報と合わせて
**Claude Code に渡すための 2 ファイル**（メッセージ JSON ＋ 生成指示 Markdown）を書き出します。

ファイルを Claude Code に読み込ませると、STAR フレームに沿った「プロジェクト詳細・担当業務・主な実績」が生成されます。

---

## 主な機能

- 2 STEP のウィザード形式 UI（ステップインジケーター連動）
  - STEP 1: 対象期間（開始日・終了日）と Slack チャンネルの選択
  - STEP 2: プロジェクト情報入力（職種・役割・チーム規模・仕事内容・利用技術）と書き出し
- Slack API による本人発言の抽出
  - 参加済みチャンネル一覧の取得（public / private、アーカイブ除外、名前順ソート）
  - 指定期間（JST 基準で日付境界を解釈）内の `SLACK_USER_ID` 本人投稿のみ抽出
  - join/leave 等のシステムメッセージ・空メッセージを除外し、古い順に整列
  - 投稿（posted）／スレッド返信（reply）を判別
- Zod による 2 段階のバリデーション（期間の前後関係チェック含む）
- 利用技術の自動補完タグ入力（言語／フレームワーク／DB／インフラ／ツールの定義済み候補）
- ボタン 1 つで 2 ファイルを同時ダウンロード
  - `{channel_name}_messages.json`（抽出メッセージ）
  - `resume_draft.md`（Claude Code 向け生成指示）
- メッセージはサーバーに保存せず、メモリ上で処理して即時ダウンロード

---

## 使用技術

| 領域           | 採用技術 |
|----------------|----------|
| フレームワーク | Next.js 16（App Router）／ React 19 |
| 言語           | TypeScript（strict・`any` 不使用） |
| スタイル       | Tailwind CSS v4（PostCSS 経由） |
| バリデーション | Zod v4 |
| Slack 連携     | `@slack/web-api`（User OAuth Token を使用） |
| Lint           | ESLint 9（`eslint-config-next`） |

UI ロジック（状態管理・データ取得）は `page.tsx` に集約し、`components/` は描画に専念する設計です。

---

## ディレクトリ構成

```
slack-to-cv/
├── app/
│   ├── page.tsx                  # /resume/register へリダイレクト
│   ├── layout.tsx                # ルートレイアウト
│   ├── globals.css               # Tailwind・デザイントークン
│   ├── resume/
│   │   └── register/
│   │       └── page.tsx          # STEP1（設定）+ STEP2（作成）の本体・状態管理
│   └── api/
│       └── messages/
│           └── route.ts          # GET: チャンネル一覧 / POST: メッセージ抽出
├── components/
│   ├── ChannelForm.tsx           # STEP2 の入力フォーム全体
│   ├── ChannelSelector.tsx       # チャンネル一覧・検索・排他選択
│   ├── DateRangePicker.tsx       # 開始日・終了日の期間入力（STEP1）
│   ├── MonthRangePicker.tsx      # 開始年月・終了年月の期間入力（STEP2）
│   ├── TechTagInput.tsx          # 利用技術の自動補完タグ入力
│   ├── ErrorMessage.tsx          # バリデーションエラー表示
│   └── LoadingOverlay.tsx        # 全画面オーバーレイローディング
├── constants/
│   ├── technologies.ts           # 利用技術の定義・補完候補
│   └── validation.ts             # Zod スキーマ（Step1Schema / ChannelFormSchema）
├── lib/
│   └── slack.ts                  # Slack API クライアント（一覧・抽出・整形）
├── types/
│   └── index.ts                  # 共通型定義
├── public/                       # SVG アセット
├── storage/                      # 動作確認用の出力サンプル（.gitignore 対象）
├── task/
│   └── todo.md
├── .env                          # Slack トークン等（コミットしない）
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

---

## 環境変数

プロジェクトルートの `.env` に以下を設定します（`.env*` は `.gitignore` 対象です）。

```env
SLACK_USER_TOKEN=xoxp-...    # Slack User OAuth Token
SLACK_USER_ID=U0123456789    # 抽出対象とする本人の Slack メンバー ID
```

- `SLACK_USER_TOKEN` には、参加チャンネルの履歴を読むためのユーザートークンを指定します
  （`channels:history` / `groups:history` / `channels:read` / `groups:read` 等のスコープが必要）。
- User token の性質上、**本人が参加済みのチャンネルのみ**履歴を取得できます。

---

## ローカルで動作確認する方法

Node.js（18 以上を推奨）と npm が必要です。

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。
トップ（`/`）は `/resume/register` に自動リダイレクトされます。

### 操作の流れ

1. **STEP 1**: 対象期間（開始日・終了日）と Slack チャンネルを選び、「メッセージを取得して次へ」
2. **STEP 2**: プロジェクト情報（職種・役割・チーム規模・仕事内容・利用技術）を入力
3. ダウンロードボタンで `{channel_name}_messages.json` と `resume_draft.md` を同時取得
4. 2 ファイルを Claude Code に渡し、`resume_draft.md` の生成指示に沿って職務経歴書を生成

### その他のコマンド

```bash
npm run build   # 本番ビルド
npm run start   # 本番サーバー起動
npm run lint    # ESLint
```

---

## ブラウザ要件

最新の Next.js（React 19）を前提とした構成のため、以下のモダンブラウザの最新版を想定しています。

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

---

## セキュリティと外部通信

- 抽出したメッセージやフォーム入力は **サーバーに永続化せず**、メモリ上で処理してそのまま
  ブラウザ側へ返却し、ダウンロードファイルとして書き出します。
- Slack API へのアクセスはサーバーサイド（API ルート）でのみ行い、`SLACK_USER_TOKEN` を
  クライアントに公開しません。
- メッセージ抽出は `SLACK_USER_ID` 本人の発言に限定しており、他者の投稿は出力に含めません。
- トークン等の秘匿情報は `.env` に置き、`.gitignore`（`.env*`）で追跡対象から除外しています。
- `storage/` に置かれる出力ファイル（サンプル含む）も `.gitignore` 対象です。

---

## 出力ファイル仕様

**`{channel_name}_messages.json`**

```json
{
  "channel": "dev-backend",
  "period": { "from": "2024-01-01", "to": "2024-12-31" },
  "messages": [
    { "type": "posted", "text": "メッセージ内容", "ts": "2024-03-01 10:00" }
  ]
}
```

**`resume_draft.md`**

入力したプロジェクト情報を埋め込んだ、Claude Code 向けの生成指示ファイルです。
STAR（Situation / Task / Action / Result）フレームでの出力、全体 400 文字以内、
Slack メッセージから読み取れない情報は作らない、といった生成ルールと制約を含みます。
末尾の「プロジェクト詳細・担当業務・主な実績」セクションを Claude Code が埋めます。

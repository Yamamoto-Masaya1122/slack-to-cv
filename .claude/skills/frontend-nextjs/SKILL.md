---
name: frontend-nextjs
description: >
  Next.js + React + TypeScript プロジェクトのフロントエンド実装ガイド。
  コンポーネント作成、状態管理、フォーム実装、Server Actions、ディレクトリ構成、スタイリングに関するタスクで必ず参照すること。
  「コンポーネント作って」「hooksどう書く」「フォーム実装して」「ページ作成」「画面作って」などの
  フロントエンド実装依頼が来たら、このskillを必ず参照すること。
---

# Frontend Next.js Skill

本プロジェクト（Slack Resume Generator）の実装規約。`CLAUDE.md` を前提に、実コードへ準拠する。

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| 言語 | TypeScript（strict / `any`禁止・`unknown`を使う） |
| フレームワーク | Next.js 14 (App Router) |
| UIライブラリ | React |
| コンポーネント | shadcn/ui |
| バリデーション | Zod |
| スタイリング | Tailwind CSS |
| アイコン | lucide-react / react-icons |

---

## ディレクトリ構成

**プロジェクトルート直下に配置する（`src/` は使わない）。**

```
app/
├── layout.tsx
├── page.tsx
├── globals.css
├── resume/
│   └── register/
│       └── page.tsx            # "use client" 画面本体（state集約）
└── api/
    └── messages/
        └── route.ts            # Route Handler（GET/POST）
components/                     # 共有UIコンポーネント（全てここに集約）
└── ui/                         # shadcn/ui（自動生成・直接編集しない）
actions/                       # Server Actions（ドメイン別）
└── resume/actions.ts
services/                      # ビジネスロジック・ファイル保存等
schemas/                       # Zodスキーマ
└── validation.ts
constants/                     # 定数
hooks/                         # カスタムhooks
lib/                           # ユーティリティ（cn 等）
types/                         # 型定義
utils/                         # 補助関数
storage/                       # 生成物の出力先
```

### コンポーネント配置の方針

- **コンポーネントは全て `components/` に集約する**（ページ固有でも `_components/` は作らない）。
- 命名規則: PascalCase（例: `ChannelSelector.tsx`）。
- 1ファイル1コンポーネント（小さな下請けコンポーネントは同一ファイル内に同居可。例: `ChannelForm.tsx` 内の `TextField`）。

---

## Server / Client Components の方針

本プロジェクトはインタラクティブな入力画面が中心のため、**データ取得・状態管理を `page.tsx`（Client Component）に集約する**スタイルを採る。

- **インタラクティブな画面の `page.tsx` は `"use client"`**。`useState` で state を保持する。
- **データ取得はクライアントから Route Handler（`/api/...`）を `fetch`**、保存系は **Server Action を直接呼ぶ**。
- 子コンポーネントは UI 描画に専念し、`value` / `onChange` などを props で受け取る**制御コンポーネント**にする。
- 子コンポーネントのうち、自前でインタラクションを持つもの（独自の `useState` 等）には `"use client"` を付与する。純粋に props を描画するだけの子は付けなくてよい。

```tsx
// app/resume/register/page.tsx（Client Component・state集約）
"use client";

import { useState } from "react";
import { saveResumeAction } from "../../../actions/resume/actions";
import ChannelForm from "@/components/ChannelForm";
import type { ChannelFormValues } from "@/types";

export default function RegisterPage() {
  const [values, setValues] = useState<ChannelFormValues>(/* ... */);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const channels = await fetch("/api/messages").then((r) => r.json());
  // 保存は Server Action を直接呼ぶ
  const handleSubmit = async () => {
    const res = await saveResumeAction(payload, values);
    if (!res.ok) setErrors(/* ... */);
  };

  return (
    <ChannelForm
      values={values}
      errors={errors}
      onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
      onSubmit={handleSubmit}
    />
  );
}
```

---

## コンポーネント実装規約

- `export default function` で定義する。
- **Props 型は各ファイル内に `interface XxxProps` を定義**する（`type Props` は使わない）。
- 親が state を保持し、子は `value` と `onChange(patch)` 等のコールバックを受け取る制御コンポーネントにする。

```tsx
// components/ErrorMessage.tsx
interface ErrorMessageProps {
  message?: string;
}

/** バリデーションエラーの一行表示。messageが空なら何も描画しない。 */
export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  return <p role="alert">{message}</p>;
}
```

```tsx
// components/ChannelForm.tsx（制御コンポーネントの例）
import type { ChannelFormValues } from "@/types";

interface ChannelFormProps {
  values: ChannelFormValues;
  errors: Record<string, string>;
  submitting: boolean;
  onChange: (patch: Partial<ChannelFormValues>) => void;
  onSubmit: () => void;
}

export default function ChannelForm({ values, errors, onChange, onSubmit }: ChannelFormProps) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      {/* onChange({ jobTitle }) のように部分更新を親へ通知 */}
    </form>
  );
}
```

---

## バリデーション（Zod）

**スキーマは `schemas/validation.ts` に集約**し、クライアント（画面）とサーバー（Server Action）の双方から再利用する。スキーマを action 内へインライン定義しない。

```ts
// schemas/validation.ts
import { z } from "zod";

export const ResumeFormSchema = z.object({
  jobTitle: z.string().min(1, "職種を入力してください"),
  role: z.string().min(1, "役割を入力してください"),
  // ...
}).refine(/* 開始年月 ≤ 終了年月 */);

export type ResumeFormInput = z.infer<typeof ResumeFormSchema>;
```

クライアント側では入力時に `safeParse` してエラー表示、サーバー側でも同じスキーマで再検証する。

---

## フォーム / Server Actions の方針

`FormData` + `useActionState` は使わない。**制御コンポーネントで集めた型付き値を、引数付きの Server Action へ直接渡す**方式を採る。

- Server Action は `actions/<domain>/actions.ts` に `"use server"` で定義する。
- 引数は `FormData` ではなく**型付きオブジェクト**を受け取る。
- 戻り値は**判別可能なユニオン**（`{ ok: true; ... } | { ok: false; error: string }`）で返し、エラーは握りつぶさず意味のあるメッセージを付ける。
- 実処理は `services/` に委譲する。

```ts
// actions/resume/actions.ts
"use server";

import { ResumeFormSchema } from "@/schemas/validation";
import { saveResumeFiles } from "@/services/resumeDownloadService";
import type { ChannelFormValues, MessagesPayload } from "@/types";

export type SaveResumeActionResult =
  | { ok: true; sequence: string; dir: string }
  | { ok: false; error: string };

export async function saveResumeAction(
  payload: MessagesPayload,
  form: ChannelFormValues,
): Promise<SaveResumeActionResult> {
  const parsed = ResumeFormSchema.safeParse(form);
  if (!parsed.success) {
    return { ok: false, error: "入力内容に不備があります。フォームをご確認ください。" };
  }
  try {
    const { sequence, dir } = await saveResumeFiles(payload, form);
    return { ok: true, sequence, dir };
  } catch (e) {
    const message = e instanceof Error ? e.message : "ファイルの保存に失敗しました";
    return { ok: false, error: message };
  }
}
```

呼び出し側（Client Component）:

```tsx
const res = await saveResumeAction(payload, values);
if (!res.ok) {
  // res.error をユーザーに提示
}
```

---

## Route Handlers（API）

一覧取得・メッセージ抽出など、クライアントから `fetch` で叩く処理は `app/api/<name>/route.ts` の Route Handler に実装する。

```ts
// app/api/messages/route.ts
export async function GET() { /* チャンネル一覧 */ }
export async function POST(req: Request) { /* メッセージ抽出 */ }
```

クライアント側:

```ts
const channels = await fetch("/api/messages").then((r) => r.json());
const messages = await fetch("/api/messages", { method: "POST", body: JSON.stringify(/* ... */) });
```

---

## Hooks の使用基準

- **3回以上再利用するロジック**はカスタムhookとして `hooks/` に切り出す。
- `use` プレフィックス必須。ファイル名は `use[Feature].ts` 形式。
- 関数型アプローチを優先し、副作用は最小化する。

```ts
// hooks/useDisclosure.ts
export function useDisclosure(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
```

---

## shadcn/ui の使い方

- `components/ui/` 配下の自動生成ファイルは**直接編集しない**。
- shadcnコンポーネントは**そのまま使う**（不要なラッパーを作らない）。
- 追加インストール: `npx shadcn@latest add [component-name]`

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
```

---

## スタイリング方針

**Tailwind CSS のユーティリティクラスを基本とする。** 条件分岐には `cn()`（`lib/utils.ts` の `clsx` + `tailwind-merge`）を使う。

```tsx
import { cn } from "@/lib/utils";

<div className={cn("rounded-md p-4", isActive && "bg-blue-100")} />
```

CSS Modules は現状不採用。導入が必要になった場合のみ別途方針を定める。

---

## アイコンの使い方

```tsx
// lucide-react（shadcnと統一感あり、推奨）
import { Search, ChevronRight, X } from "lucide-react";

// react-icons（lucideにないアイコンを使いたい場合）
import { FaGithub } from "react-icons/fa";
```

- サイズは `size` prop または Tailwind の `w-` / `h-` クラスで指定する。

---

## 型定義ルール

- ドメイン型・API レスポンス型・フォーム値型は **`types/` 配下にドメイン単位で分割**し、`type` で定義する（例: `types/user.ts`, `types/channel.ts`）。
- Props 型は各コンポーネントファイル内に `interface XxxProps` として定義する（types/ には置かない）。

```ts
// types/user.ts
export type User = {
  id: string;
  name: string;
  email: string;
};

// types/channel.ts
export type SlackChannel = {
  id: string;
  name: string;
};

export type ChannelFormValues = {
  jobTitle: string;
  role: string;
  // ...
};

// types/api.ts
export type ApiResponse<T> = {
  data: T;
  error?: string;
};
```

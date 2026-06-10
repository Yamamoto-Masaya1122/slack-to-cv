"use client";

import Image from "next/image";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** アプリ共通ヘッダー: 左ロゴ / 右「使い方」メニュー */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center" aria-label="ホーム">
          <Image
            src="/slaCV_logo.png"
            alt="職務経歴書ジェネレーター"
            width={2172}
            height={724}
            priority
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost">
              <HelpCircle className="size-4" />
              使い方
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>使い方</DialogTitle>
              <DialogDescription>
                Slackの会話から職務経歴書のプロジェクト詳細を生成します。
              </DialogDescription>
            </DialogHeader>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
              <li>
                「設定」で対象チャンネルと期間を選び、Slackメッセージを取得します。
              </li>
              <li>
                「作成」でプロジェクト情報（期間・職種・役割・利用技術など）を入力します。
              </li>
              <li>
                書き出しボタンで <code>messages.json</code> と{" "}
                <code>resume_draft.md</code> を <code>storage/</code>{" "}
                配下に保存します。
              </li>
              <li>
                保存したファイルをClaude Codeに渡すと、職務経歴書の下書きが生成されます。
              </li>
            </ol>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}

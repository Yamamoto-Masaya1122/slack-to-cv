import type { Metadata } from "next";
import "./globals.css";
import { Manrope, Noto_Sans_JP } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "職務経歴書ジェネレーター | Slack Resume",
  description:
    "Slackの会話から職務経歴書のプロジェクト詳細を仕立てる。メッセージとフォーム入力をエクスポートし、AIに渡して生成します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={cn("h-full", "font-sans", manrope.variable, notoSansJp.variable)}
    >
      <body className="min-h-full">
        <TooltipProvider delayDuration={200}>
          <Header />
          {children}
        </TooltipProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

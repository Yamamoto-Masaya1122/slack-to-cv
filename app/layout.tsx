import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ja" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

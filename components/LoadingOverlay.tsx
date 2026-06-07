import { Spinner } from "@/components/ui/spinner";

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

/**
 * 画面全体を覆う最前面オーバーレイ。半透明の暗幕＋中央スピナー。
 * 表示中は背後の操作を一切受け付けない。
 */
export default function LoadingOverlay({
  show,
  message = "Slackからメッセージを取得中。",
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="animate-fade fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 backdrop-blur-[2px]"
    >
      <div className="flex flex-col items-center gap-5 rounded-xl bg-card px-10 py-8 shadow-lg">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
}

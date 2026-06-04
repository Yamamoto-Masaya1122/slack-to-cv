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
      className="animate-fade fixed inset-0 z-[100] flex items-center justify-center bg-ink/55 backdrop-blur-[2px]"
    >
      <div className="flex flex-col items-center gap-6 px-8 text-center">
        {/* 朱の落款を巡る回転リング */}
        <span className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent border-r-accent/40 [animation-duration:0.9s]" />
          <span className="absolute inset-2 rounded-full border border-paper/30" />
          <span className="font-display text-[15px] font-bold text-paper">職</span>
        </span>
        <p className="font-display text-base tracking-wide text-paper">{message}</p>
      </div>
    </div>
  );
}

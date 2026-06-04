interface ErrorMessageProps {
  message?: string;
}

/** バリデーションエラーの一行表示。messageが空なら何も描画しない。 */
export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="animate-fade mt-1.5 flex items-center gap-1.5 text-[13px] leading-tight text-accent"
    >
      <span aria-hidden className="text-accent-deep">
        ⸺
      </span>
      {message}
    </p>
  );
}

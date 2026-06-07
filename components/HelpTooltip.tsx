"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HelpTooltipProps {
  text: string;
  label?: string;
}

/** タイトル横に置くハテナボタン。ホバー / フォーカスで補足説明を表示する。 */
export default function HelpTooltip({ text, label = "補足説明を表示" }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <HelpCircle className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-[13px] leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

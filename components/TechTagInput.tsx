"use client";

import { useMemo, useRef, useState } from "react";
import { TECHNOLOGIES } from "@/constants/technologies";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import ErrorMessage from "./ErrorMessage";

interface TechTagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
}

type Category = keyof typeof TECHNOLOGIES;

const LISTBOX_ID = "tech-suggest-listbox";
const optionId = (idx: number) => `tech-option-${idx}`;

/**
 * 利用技術の自動補完タグ入力。
 * 候補は定数リストのみ（自由入力は不可）。カテゴリ別にサジェストする。
 */
export default function TechTagInput({ value, onChange, error }: TechTagInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 未選択かつクエリに一致する候補を、カテゴリ別に抽出
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selected = new Set(value);
    return (Object.keys(TECHNOLOGIES) as Category[])
      .map((cat) => ({
        category: cat,
        items: TECHNOLOGIES[cat].filter(
          (t) => !selected.has(t) && (!q || t.toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, value]);

  // フラット化（キーボード操作用）
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const add = (tech: string) => {
    if (!value.includes(tech)) onChange([...value, tech]);
    setQuery("");
    setActive(0);
    setOpen(true);
    inputRef.current?.focus();
  };

  const remove = (tech: string) => {
    onChange(value.filter((t) => t !== tech));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) add(flat[active]);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      remove(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const expanded = open && flat.length > 0;

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-muted-foreground">利用技術</span>

      <div className="relative">
        {/* 選択済みタグ＋入力 */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 py-2 transition-colors hover:border-line-strong focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
        >
          {value.map((tech) => (
            <Badge
              key={tech}
              variant="outline"
              className="animate-fade h-auto gap-1 border-primary/20 bg-accent-soft py-1 pl-2 pr-1 text-[13px] font-medium text-accent-deep"
            >
              {tech}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(tech);
                }}
                aria-label={`${tech} を削除`}
                className="flex size-4 items-center justify-center rounded-full text-accent-deep/70 transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? "技術を検索して選択（例: Laravel）" : ""}
            role="combobox"
            aria-expanded={expanded}
            aria-controls={LISTBOX_ID}
            aria-activedescendant={expanded ? optionId(active) : undefined}
            aria-autocomplete="list"
            className="min-w-[140px] flex-1 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* サジェストパネル */}
        {expanded && (
          <div
            id={LISTBOX_ID}
            role="listbox"
            onMouseDown={() => {
              // blurによるクローズを抑止
              if (blurTimer.current) clearTimeout(blurTimer.current);
            }}
            className="animate-fade absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover py-1.5 shadow-md"
          >
            {groups.map((g) => (
              <div key={g.category} role="group" aria-label={g.category}>
                <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {g.category}
                </p>
                {g.items.map((item) => {
                  const idx = flat.indexOf(item);
                  const isActive = idx === active;
                  return (
                    <button
                      key={item}
                      id={optionId(idx)}
                      role="option"
                      aria-selected={isActive}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => add(item)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors",
                        isActive ? "bg-accent-soft text-foreground" : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {item}
                      {isActive && <span className="text-[11px] text-primary">＋ 追加</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <ErrorMessage message={error} />
    </div>
  );
}

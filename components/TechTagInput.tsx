"use client";

import { useMemo, useRef, useState } from "react";
import { TECHNOLOGIES } from "@/constants/technologies";
import ErrorMessage from "./ErrorMessage";

interface TechTagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
}

type Category = keyof typeof TECHNOLOGIES;

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

  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-ink-soft">利用技術</label>

      <div className="relative">
        {/* 選択済みタグ＋入力 */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--color-accent-soft)] flex min-h-[46px] flex-wrap items-center gap-1.5 rounded border border-line bg-surface-raised px-2.5 py-2 transition-colors hover:border-line-strong"
        >
          {value.map((tech) => (
            <span
              key={tech}
              className="animate-fade inline-flex items-center gap-1 rounded-sm border border-accent/30 bg-accent-soft/70 py-1 pl-2 pr-1 text-[13px] font-medium text-accent-deep"
            >
              {tech}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(tech);
                }}
                aria-label={`${tech} を削除`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-accent-deep/70 transition-colors hover:bg-accent hover:text-paper"
              >
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 3 6 6M9 3l-6 6" strokeLinecap="round" />
                </svg>
              </button>
            </span>
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
            className="min-w-[140px] flex-1 bg-transparent py-1 text-[14px] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>

        {/* サジェストパネル */}
        {open && flat.length > 0 && (
          <div
            onMouseDown={() => {
              // blurによるクローズを抑止
              if (blurTimer.current) clearTimeout(blurTimer.current);
            }}
            className="animate-fade absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-64 overflow-y-auto rounded border border-line-strong bg-surface-raised py-1.5 shadow-[0_12px_30px_-12px_rgba(33,30,26,0.35)]"
          >
            {groups.map((g) => (
              <div key={g.category}>
                <p className="px-3 pb-1 pt-2 font-display text-[11px] tracking-widest text-ink-faint">
                  {g.category}
                </p>
                {g.items.map((item) => {
                  const idx = flat.indexOf(item);
                  const isActive = idx === active;
                  return (
                    <button
                      key={item}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => add(item)}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[14px] transition-colors ${
                        isActive ? "bg-accent-soft/60 text-ink" : "text-ink-soft hover:bg-paper/70"
                      }`}
                    >
                      {item}
                      {isActive && <span className="text-[11px] text-accent">＋ 追加</span>}
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

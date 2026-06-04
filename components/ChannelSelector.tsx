"use client";

import { useMemo, useState } from "react";
import type { SlackChannel } from "@/types";
import ErrorMessage from "./ErrorMessage";

interface ChannelSelectorProps {
  channels: SlackChannel[];
  selectedId: string;
  onSelect: (channelId: string) => void;
  loading?: boolean;
  loadError?: string;
  error?: string;
}

/**
 * チャンネル一覧・検索フィルター・排他選択。
 * 1つ選ぶと他は自動的に解除される（単一選択）。
 */
export default function ChannelSelector({
  channels,
  selectedId,
  onSelect,
  loading = false,
  loadError,
  error,
}: ChannelSelectorProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter((c) => c.name.toLowerCase().includes(q));
  }, [channels, query]);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-[13px] font-medium text-ink-soft">チャンネル選択</label>
        {channels.length > 0 && (
          <span className="text-[12px] text-ink-faint tnum">{channels.length} 件</span>
        )}
      </div>

      {/* 検索フィルター */}
      <div className="relative mb-2.5">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="チャンネル名で検索"
          disabled={loading || Boolean(loadError)}
          className="focus-ink w-full rounded border border-line bg-surface-raised py-2.5 pl-9 pr-3 text-[14px] text-ink transition-colors placeholder:text-ink-faint hover:border-line-strong disabled:opacity-50"
        />
      </div>

      {/* リスト本体 */}
      <div className="max-h-72 overflow-y-auto rounded border border-line bg-surface-raised">
        {loading ? (
          <ul className="divide-y divide-line">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="h-4 w-4 rounded-sm bg-line" />
                <span
                  className="h-3.5 rounded bg-line"
                  style={{ width: `${40 + ((i * 13) % 35)}%` }}
                />
              </li>
            ))}
          </ul>
        ) : loadError ? (
          <div className="px-4 py-10 text-center text-[14px] text-accent">{loadError}</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-[14px] text-ink-faint">
            該当するチャンネルがありません
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((ch) => {
              const checked = ch.id === selectedId;
              return (
                <li key={ch.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(checked ? "" : ch.id)}
                    className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      checked ? "bg-accent-soft/60" : "hover:bg-paper/70"
                    }`}
                  >
                    {/* 排他チェックボックス（見た目はチェックボックス、挙動は単一選択） */}
                    <span
                      aria-hidden
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-colors ${
                        checked
                          ? "border-accent bg-accent text-paper"
                          : "border-line-strong bg-surface group-hover:border-ink-faint"
                      }`}
                    >
                      {checked && (
                        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m3 8 3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`text-[14px] ${
                        checked ? "font-medium text-ink" : "text-ink-soft"
                      }`}
                    >
                      <span className="text-ink-faint">#&nbsp;</span>
                      {ch.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ErrorMessage message={error} />
    </div>
  );
}

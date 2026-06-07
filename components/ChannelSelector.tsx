"use client";

import { useMemo, useState } from "react";
import type { SlackChannel } from "@/types/slack";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
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
 * チャンネル一覧・検索フィルター・単一選択。
 * RadioGroup によるラジオセマンティクスで、スクリーンリーダーにも単一選択として伝わる。
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
        <span className="text-sm font-medium text-muted-foreground">チャンネル選択</span>
        {channels.length > 0 && (
          <Badge variant="secondary" className="tnum">
            {channels.length} 件
          </Badge>
        )}
      </div>

      {/* 検索フィルター */}
      <div className="relative mb-2.5">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="チャンネル名で検索"
          disabled={loading || Boolean(loadError)}
          className="h-10 pl-9"
        />
      </div>

      {/* リスト本体 */}
      <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-card">
        {loading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="size-4 rounded-full bg-muted" />
                <span
                  className="h-3.5 rounded bg-muted"
                  style={{ width: `${40 + ((i * 13) % 35)}%` }}
                />
              </li>
            ))}
          </ul>
        ) : loadError ? (
          <div className="px-4 py-10 text-center text-sm text-destructive">{loadError}</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            該当するチャンネルがありません
          </div>
        ) : (
          <RadioGroup
            value={selectedId}
            onValueChange={onSelect}
            aria-label="チャンネル選択"
            className="gap-0 divide-y divide-border"
          >
            {filtered.map((ch) => {
              const checked = ch.id === selectedId;
              return (
                <label
                  key={ch.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors",
                    checked ? "bg-accent-soft" : "hover:bg-muted",
                  )}
                >
                  <RadioGroupItem value={ch.id} />
                  <span
                    className={cn(
                      "text-sm",
                      checked ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span className="text-muted-foreground">#&nbsp;</span>
                    {ch.name}
                  </span>
                </label>
              );
            })}
          </RadioGroup>
        )}
      </div>

      <ErrorMessage message={error} />
    </div>
  );
}

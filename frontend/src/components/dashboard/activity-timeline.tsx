"use client";

import { FileText, User, ClipboardCheck, Image as ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { RecentActivityItem } from "@/types/api";

const kindIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  consultation: FileText,
  user: User,
  review: ClipboardCheck,
  image: ImageIcon,
};

interface ActivityTimelineProps {
  items: RecentActivityItem[];
  maxItems?: number;
}

export function ActivityTimeline({ items, maxItems = 10 }: ActivityTimelineProps) {
  const list = items.slice(0, maxItems);

  return (
    <ul className="space-y-3">
      {list.map((item) => {
        const Icon = kindIcon[item.kind] ?? FileText;
        return (
          <li
            key={`${item.kind}-${item.id}`}
            className="flex gap-3 text-sm"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <Icon className="h-4 w-4 text-slate-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-700">{item.summary}</p>
              <p className="text-xs text-slate-400">{formatDate(item.at)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

'use client';

import type { LateLeaderboardEntry, LateTodayEntry } from '@/lib/api';
import { formatDateTime, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const RANK_COLORS: Record<number, { badge: string; soft: string }> = {
  1: { badge: 'bg-yellow-500', soft: 'bg-yellow-50 border-yellow-400' },
  2: { badge: 'bg-slate-400', soft: 'bg-slate-50 border-slate-300' },
  3: { badge: 'bg-amber-600', soft: 'bg-orange-50 border-amber-500' },
};

function RankBadge({ rank }: { rank: number }) {
  const palette = RANK_COLORS[rank];
  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white',
        palette?.badge ?? 'bg-slate-300 text-slate-700',
      )}
    >
      {rank}
    </span>
  );
}

type Props =
  | { mode: 'today'; items: LateTodayEntry[]; compact?: boolean }
  | { mode: 'overall'; items: LateLeaderboardEntry[]; compact?: boolean };

export function LateRankList({ mode, items, compact }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        {mode === 'today' ? 'No one is late today' : 'No late records yet'}
      </p>
    );
  }

  if (mode === 'today') {
    return (
      <div className="space-y-2">
        {items.map((entry) => {
          const palette = RANK_COLORS[entry.rank];
          return (
            <div
              key={entry.employee_id}
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-white p-3',
                palette ? palette.soft : 'border-slate-200',
              )}
            >
              <RankBadge rank={entry.rank} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{entry.employee_name}</p>
                <p className="text-xs text-slate-500">{entry.employee_code}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold text-amber-600">+{entry.minutes_late}m</p>
                {!compact && entry.check_in_at && (
                  <p className="text-xs text-slate-500">{formatTime(entry.check_in_at)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((entry) => {
        const palette = RANK_COLORS[entry.rank];
        return (
          <div
            key={entry.employee_id}
            className={cn(
              'flex items-center gap-3 rounded-lg border bg-white p-3',
              palette ? palette.soft : 'border-slate-200',
            )}
          >
            <RankBadge rank={entry.rank} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{entry.employee_name}</p>
              <p className="text-xs text-slate-500">{entry.employee_code}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold text-amber-600">{entry.late_days} days</p>
              {!compact && (
                <p className="text-xs text-slate-500">
                  {entry.total_minutes_late}m total
                  {entry.last_late_at ? ` · ${formatDateTime(entry.last_late_at)}` : ''}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

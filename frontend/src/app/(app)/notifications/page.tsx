'use client';

import { AlertTriangle, CalendarClock, Flag, UserCheck } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { Card, CardContent } from '@/components/ui/card';
import type { NotificationItem } from '@/types';

const ICONS: Record<string, any> = {
  OVER_ALLOCATION: AlertTriangle,
  VACATION_CONFLICT: CalendarClock,
  PROJECT_ENDING: Flag,
  RESOURCE_AVAILABLE: UserCheck,
};

const TONE: Record<string, string> = {
  OVER_ALLOCATION: 'text-red-600 bg-red-50 dark:bg-red-950',
  VACATION_CONFLICT: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  PROJECT_ENDING: 'text-sky-600 bg-sky-50 dark:bg-sky-950',
  RESOURCE_AVAILABLE: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
};

export default function NotificationsPage() {
  const { data: live, loading } = useFetch<NotificationItem[]>('/notifications/live');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-sm text-slate-500">Live alerts computed from current capacity data.</p>
      </div>

      {loading && <div className="text-slate-400">Loading…</div>}
      {!loading && (live ?? []).length === 0 && <div className="text-slate-400">No notifications right now.</div>}

      <div className="flex flex-col gap-2">
        {(live ?? []).map((n, i) => {
          const Icon = ICONS[n.type] ?? AlertTriangle;
          return (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE[n.type] ?? ''}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm">{n.message}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

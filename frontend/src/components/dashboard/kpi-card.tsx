import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  suffix,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'default' | 'danger' | 'warning' | 'success';
  suffix?: string;
}) {
  const toneClass = {
    default: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300',
    danger: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
          <div className="text-xl font-semibold tabular-nums">
            {value}
            {suffix && <span className="ml-0.5 text-sm font-normal text-slate-400">{suffix}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

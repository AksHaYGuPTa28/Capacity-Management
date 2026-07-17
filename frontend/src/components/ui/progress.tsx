import { cn } from '@/lib/utils';

export function Progress({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = value > 100 ? 'bg-red-500' : value >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800', className)}>
      <div className={cn('h-full rounded-full transition-all', color, barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}

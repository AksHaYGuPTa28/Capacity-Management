import { cn } from '@/lib/utils';

interface HeatmapRow {
  resourceId: string;
  name: string;
  team: string | null;
  weeks: { week: number; utilization: number }[];
}

function cellColor(utilization: number) {
  if (utilization > 100) return 'bg-red-500';
  if (utilization >= 80) return 'bg-amber-400';
  if (utilization > 0) return 'bg-emerald-400';
  return 'bg-slate-200 dark:bg-slate-800';
}

export function Heatmap({ rows }: { rows: HeatmapRow[] }) {
  if (rows.length === 0) return null;
  const weekCount = rows[0].weeks.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 min-w-[140px] bg-white text-left font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              Person
            </th>
            {Array.from({ length: weekCount }, (_, i) => (
              <th key={i} className="min-w-[28px] px-1 text-center font-medium text-slate-400">
                W{i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 25).map((row) => (
            <tr key={row.resourceId}>
              <td className="sticky left-0 whitespace-nowrap bg-white pr-2 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {row.name}
              </td>
              {row.weeks.map((w) => (
                <td key={w.week} className="p-0">
                  <div
                    title={`Week ${w.week}: ${w.utilization}%`}
                    className={cn('h-5 w-5 rounded-sm', cellColor(w.utilization))}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-slate-800" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-emerald-400" /> Partial
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-amber-400" /> Fully Allocated
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-red-500" /> Overallocated
        </span>
      </div>
    </div>
  );
}

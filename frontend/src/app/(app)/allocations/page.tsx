'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFetch } from '@/hooks/use-fetch';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { can } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AllocationMatrix } from '@/types';

function utilizationClass(pct: number) {
  if (pct > 100) return 'text-red-600 font-semibold';
  if (pct >= 80) return 'text-amber-600 font-semibold';
  return 'text-emerald-600';
}

export default function AllocationsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const editable = can.manageAllocations(role);
  const { data: matrix, loading, reload } = useFetch<AllocationMatrix>('/allocations/matrix');
  const [pending, setPending] = useState<Record<string, boolean>>({});

  async function commitCell(resourceId: string, projectId: string, existingId: string | undefined, value: string) {
    const key = `${resourceId}:${projectId}`;
    const hours = value === '' ? 0 : Number(value);
    if (Number.isNaN(hours) || hours < 0) return;
    setPending((p) => ({ ...p, [key]: true }));
    try {
      if (existingId) {
        if (hours === 0) {
          await api.delete(`/allocations/${existingId}`);
        } else {
          await api.patch(`/allocations/${existingId}`, { hoursPerWeek: hours });
        }
      } else if (hours > 0) {
        const startDate = new Date().toISOString().slice(0, 10);
        const endDate = new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        await api.post('/allocations', { resourceId, projectId, hoursPerWeek: hours, startDate, endDate });
      }
      reload();
    } finally {
      setPending((p) => ({ ...p, [key]: false }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Allocation Grid</h1>
        <p className="text-sm text-slate-500">
          Assign people to projects with hours/week. {editable ? 'Edit a cell and press Enter or click away to save.' : 'Read-only for your role.'}
        </p>
      </div>

      {loading && <div className="text-slate-400">Loading…</div>}

      {matrix && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[200px] border-b border-r border-slate-200 bg-white px-3 py-2 text-left font-medium dark:border-slate-800 dark:bg-slate-900">
                    Person
                  </th>
                  {matrix.projects.map((p) => (
                    <th
                      key={p.id}
                      className="min-w-[110px] border-b border-slate-200 px-2 py-2 text-center text-xs font-medium dark:border-slate-800"
                    >
                      <Link href={`/projects/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </th>
                  ))}
                  <th className="min-w-[110px] border-b border-l border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-medium dark:border-slate-800 dark:bg-slate-900">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row) => (
                  <tr key={row.resource.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="sticky left-0 z-10 border-r border-b border-slate-100 bg-white px-3 py-2 font-medium dark:border-slate-900 dark:bg-slate-950">
                      <Link href={`/people/${row.resource.id}`} className="hover:underline">
                        {row.resource.name}
                      </Link>
                      <div className="text-xs font-normal text-slate-400">{row.resource.jobTitle}</div>
                    </td>
                    {matrix.projects.map((p) => {
                      const cell = row.cells[p.id];
                      const key = `${row.resource.id}:${p.id}`;
                      return (
                        <td key={p.id} className="border-b border-slate-100 p-1 text-center dark:border-slate-900">
                          <input
                            type="number"
                            min={0}
                            defaultValue={cell?.hoursPerWeek || ''}
                            disabled={!editable || pending[key]}
                            placeholder="—"
                            onBlur={(e) => commitCell(row.resource.id, p.id, cell?.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                            className="w-16 rounded border border-transparent bg-transparent px-1 py-1 text-center text-sm hover:border-slate-200 focus:border-indigo-400 focus:outline-none disabled:cursor-not-allowed dark:hover:border-slate-700"
                          />
                        </td>
                      );
                    })}
                    <td className="border-b border-l border-slate-100 bg-slate-50/50 px-2 py-2 text-center text-xs dark:border-slate-900 dark:bg-slate-900/40">
                      <span className={utilizationClass(row.utilization)}>{row.utilization}%</span>
                      <div className="text-slate-400">
                        {row.allocatedHours}h / {row.effectiveCapacity}h
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className={cn('text-xs text-slate-400')}>
        New assignments default to a 12-week engagement starting today. Set an hour value to 0 to remove an assignment.
      </div>
    </div>
  );
}

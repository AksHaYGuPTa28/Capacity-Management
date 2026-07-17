'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { useAuthStore } from '@/lib/auth-store';
import { can } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ProjectStatusBadge, PriorityBadge } from '@/components/status-badge';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import type { Project, Resource } from '@/types';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const role = useAuthStore((s) => s.user?.role);
  const { data: project, loading, reload } = useFetch<Project>(`/projects/${id}`, [id]);
  const { data: resources } = useFetch<Resource[]>('/resources');
  const [editOpen, setEditOpen] = useState(false);

  if (loading || !project) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/projects" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{project.name}</h1>
              <PriorityBadge priority={project.priority} />
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{project.customer ?? 'Internal project'}</p>
            <p className="mt-1 text-sm text-slate-500">
              PM: {project.projectManager?.name ?? '—'} · {new Date(project.startDate).toLocaleDateString()} –{' '}
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'ongoing'}
            </p>
            {project.budget != null && <p className="mt-1 text-sm text-slate-500">Budget: ${project.budget.toLocaleString()}</p>}
          </div>
          <div className="flex items-center gap-6">
            {project.requiredCapacity ? (
              <div className="w-40">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Staffed</span>
                  <span>{project.staffingPct}%</span>
                </div>
                <Progress value={project.staffingPct ?? 0} />
                <div className="mt-1 text-xs text-slate-400">
                  {project.allocatedHours}h / {project.requiredCapacity}h required
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">{project.allocatedHours}h allocated (no target set)</div>
            )}
            {can.editProject(role) && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staffed People ({project.staffedCount})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800">
                <th className="px-4 py-2 font-medium">Person</th>
                <th className="px-4 py-2 font-medium">Hours/week</th>
                <th className="px-4 py-2 font-medium">Start</th>
                <th className="px-4 py-2 font-medium">End</th>
              </tr>
            </thead>
            <tbody>
              {project.allocations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                    No one is staffed on this project yet.
                  </td>
                </tr>
              )}
              {project.allocations.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900">
                  <td className="px-4 py-2">
                    <Link href={`/people/${a.resourceId}`}>{a.resource?.name ?? a.resourceId}</Link>
                  </td>
                  <td className="px-4 py-2">{a.hoursPerWeek}h</td>
                  <td className="px-4 py-2">{new Date(a.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{a.endDate ? new Date(a.endDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} resources={resources ?? []} onSaved={reload} />
    </div>
  );
}

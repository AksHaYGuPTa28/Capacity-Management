'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { useAuthStore } from '@/lib/auth-store';
import { can } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ProjectStatusBadge, PriorityBadge } from '@/components/status-badge';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import type { Project, Resource } from '@/types';

export default function ProjectsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [status, setStatus] = useState('');
  const { data: projects, loading, reload } = useFetch<Project[]>(`/projects${status ? `?status=${status}` : ''}`, [status]);
  const { data: resources } = useFetch<Resource[]>('/resources');
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-slate-500">{projects?.length ?? 0} projects</p>
        </div>
        {can.createProject(role) && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex gap-3 p-4">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
            <option value="">All statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </CardContent>
      </Card>

      {loading && <div className="text-slate-400">Loading…</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(projects ?? []).map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.customer ?? 'Internal'}</p>
                  </div>
                  <PriorityBadge priority={p.priority} />
                </div>
                <div className="flex items-center gap-2">
                  <ProjectStatusBadge status={p.status} />
                  {p.isInternal && <span className="text-xs text-slate-400">Internal</span>}
                </div>
                {p.requiredCapacity ? (
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Staffed</span>
                      <span>{p.staffingPct ?? 0}%</span>
                    </div>
                    <Progress value={p.staffingPct ?? 0} />
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">No capacity target set</div>
                )}
                <div className="text-xs text-slate-400">
                  {new Date(p.startDate).toLocaleDateString()} – {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'ongoing'}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} resources={resources ?? []} onSaved={reload} />
    </div>
  );
}

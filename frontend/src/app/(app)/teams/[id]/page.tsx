'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { useAuthStore } from '@/lib/auth-store';
import { can } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ResourceStatusBadge } from '@/components/status-badge';
import { TeamFormDialog } from '@/components/teams/team-form-dialog';
import type { Team } from '@/types';

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const role = useAuthStore((s) => s.user?.role);
  const { data: team, loading, reload } = useFetch<Team>(`/teams/${id}`, [id]);
  const [editOpen, setEditOpen] = useState(false);

  if (loading || !team) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/teams" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Teams
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h1 className="text-xl font-semibold">{team.name}</h1>
            <p className="text-sm text-slate-500">
              {team.department} · Manager: {team.manager?.name ?? '—'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-40">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Utilization</span>
                <span>{team.utilization}%</span>
              </div>
              <Progress value={team.utilization ?? 0} />
              <div className="mt-1 text-xs text-slate-400">
                {team.allocatedHours}h / {team.totalCapacity}h
              </div>
            </div>
            {can.editTeam(role) && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members ({team.members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(team.members ?? []).map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900">
                  <td className="px-4 py-2">
                    <Link href={`/people/${m.id}`} className="flex items-center gap-2">
                      <Avatar name={m.name} src={m.photoUrl} className="h-7 w-7" />
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{m.jobTitle}</td>
                  <td className="px-4 py-2">
                    <ResourceStatusBadge status={(m as any).computedStatus ?? m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <TeamFormDialog open={editOpen} onOpenChange={setEditOpen} team={team} onSaved={reload} />
    </div>
  );
}

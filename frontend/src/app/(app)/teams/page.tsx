'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { useAuthStore } from '@/lib/auth-store';
import { can } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TeamFormDialog } from '@/components/teams/team-form-dialog';
import type { Team } from '@/types';

export default function TeamsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data: teams, loading, reload } = useFetch<Team[]>('/teams');
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Teams</h1>
          <p className="text-sm text-slate-500">{teams?.length ?? 0} teams</p>
        </div>
        {can.createTeam(role) && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Create Team
          </Button>
        )}
      </div>

      {loading && <div className="text-slate-400">Loading…</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(teams ?? []).map((t) => (
          <Link key={t.id} href={`/teams/${t.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-5">
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-xs text-slate-500">{t.department}</p>
                </div>
                <div className="text-xs text-slate-500">Manager: {t.manager?.name ?? '—'}</div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{t.memberCount} members</span>
                  <span>{t.utilization}% utilized</span>
                </div>
                <Progress value={t.utilization ?? 0} />
                <div className="text-xs text-slate-400">
                  {t.allocatedHours}h / {t.totalCapacity}h capacity
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <TeamFormDialog open={formOpen} onOpenChange={setFormOpen} onSaved={reload} />
    </div>
  );
}

'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ResourceStatusBadge } from '@/components/status-badge';
import { ResourceFormDialog } from '@/components/people/resource-form-dialog';
import { useAuthStore } from '@/lib/auth-store';
import { can } from '@/lib/permissions';
import type { Resource, Team, Skill } from '@/types';

function PeoplePageInner() {
  const searchParams = useSearchParams();
  const role = useAuthStore((s) => s.user?.role);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [team, setTeam] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [skill, setSkill] = useState('');
  const [availability, setAvailability] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (team) params.set('team', team);
    if (department) params.set('department', department);
    if (location) params.set('location', location);
    if (skill) params.set('skill', skill);
    if (availability) params.set('availability', availability);
    return params.toString();
  }, [search, team, department, location, skill, availability]);

  const { data: resources, loading, reload } = useFetch<Resource[]>(`/resources?${query}`, [query]);
  const { data: teams } = useFetch<Team[]>('/teams');
  const { data: skills } = useFetch<Skill[]>('/skills');

  const departments = useMemo(() => Array.from(new Set((teams ?? []).map((t) => t.department))), [teams]);
  const locations = useMemo(
    () => Array.from(new Set((resources ?? []).map((r) => r.location))).sort(),
    [resources],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">People</h1>
          <p className="text-sm text-slate-500">{resources?.length ?? 0} resources</p>
        </div>
        {can.createResource(role) && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Add Person
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          <Input
            placeholder="Search name or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select value={team} onChange={(e) => setTeam(e.target.value)} className="w-44">
            <option value="">All teams</option>
            {(teams ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-44">
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Select value={location} onChange={(e) => setLocation(e.target.value)} className="w-44">
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Select value={skill} onChange={(e) => setSkill(e.target.value)} className="w-40">
            <option value="">All skills</option>
            {(skills ?? []).map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </Select>
          <Select value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-44">
            <option value="">Any availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="PARTIAL">Partial</option>
            <option value="FULLY_ALLOCATED">Fully Allocated</option>
            <option value="OVER_ALLOCATED">Overallocated</option>
            <option value="LEAVE">On Leave</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && (resources ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No people match these filters.
                    </td>
                  </tr>
                )}
                {(resources ?? []).map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/people/${r.id}`} className="flex items-center gap-3">
                        <Avatar name={r.name} src={r.photoUrl} />
                        <div>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-slate-500">{r.jobTitle}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.team?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{r.location}</td>
                    <td className="px-4 py-3">
                      <ResourceStatusBadge status={r.computedStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={r.utilization} className="w-24" />
                        <span className="text-xs tabular-nums text-slate-500">{r.utilization}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ResourceFormDialog open={formOpen} onOpenChange={setFormOpen} teams={teams ?? []} onSaved={reload} />
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading…</div>}>
      <PeoplePageInner />
    </Suspense>
  );
}

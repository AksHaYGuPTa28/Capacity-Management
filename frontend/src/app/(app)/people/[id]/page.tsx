'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { can } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceStatusBadge } from '@/components/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input, Label, Select } from '@/components/ui/input';
import type { Resource, Skill } from '@/types';

export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const role = useAuthStore((s) => s.user?.role);
  const { data: resource, loading, reload } = useFetch<Resource>(`/resources/${id}`, [id]);
  const { data: skillCatalog } = useFetch<Skill[]>('/skills');
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);

  if (loading || !resource) {
    return <div className="text-slate-400">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/people" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to People
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 p-6">
          <Avatar name={resource.name} src={resource.photoUrl} className="h-16 w-16 text-lg" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{resource.name}</h1>
            <p className="text-sm text-slate-500">
              {resource.jobTitle} · {resource.team?.name ?? 'No team'} · {resource.location}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <ResourceStatusBadge status={resource.computedStatus} />
              <Badge variant="outline">{resource.department}</Badge>
              <Badge variant="outline">{resource.employmentPct}% employment</Badge>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-lg font-semibold">{resource.effectiveCapacity}h</div>
              <div className="text-xs text-slate-500">Capacity</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{resource.allocatedHours}h</div>
              <div className="text-xs text-slate-500">Allocated</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{resource.remainingCapacity}h</div>
              <div className="text-xs text-slate-500">Remaining</div>
            </div>
            <div className="w-28">
              <div className="text-lg font-semibold">{resource.utilization}%</div>
              <Progress value={resource.utilization} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="timeoff">Vacation & Holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="skills">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Skills</CardTitle>
              {can.editResource(role) && (
                <Button size="sm" variant="outline" onClick={() => setSkillDialogOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Skill
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {resource.skills.length === 0 && <div className="text-sm text-slate-400">No skills recorded.</div>}
              {resource.skills.map((s) => (
                <span
                  key={s.skillId}
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm dark:border-slate-800"
                >
                  {s.skill.name}
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < s.level ? 'text-indigo-600' : 'text-slate-200 dark:text-slate-700'}>
                        ●
                      </span>
                    ))}
                  </span>
                  {can.editResource(role) && (
                    <button
                      onClick={async () => {
                        await api.delete(`/resources/${resource.id}/skills/${s.skillId}`);
                        reload();
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations">
          <Card>
            <CardHeader>
              <CardTitle>Project Allocations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800">
                    <th className="px-4 py-2 font-medium">Project</th>
                    <th className="px-4 py-2 font-medium">Hours/week</th>
                    <th className="px-4 py-2 font-medium">Start</th>
                    <th className="px-4 py-2 font-medium">End</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.allocations.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                        No allocations.
                      </td>
                    </tr>
                  )}
                  {resource.allocations.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 last:border-0 dark:border-slate-900">
                      <td className="px-4 py-2">{a.project?.name ?? a.projectId}</td>
                      <td className="px-4 py-2">{a.hoursPerWeek}h</td>
                      <td className="px-4 py-2">{new Date(a.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{a.endDate ? new Date(a.endDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeoff">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vacation & Public Holidays</CardTitle>
              {can.editResource(role) && (
                <Button size="sm" variant="outline" onClick={() => setTimeOffDialogOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Time Off
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {resource.timeOffs.length === 0 && <div className="text-sm text-slate-400">No time off recorded.</div>}
              {resource.timeOffs.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <div>
                    <Badge variant={t.type === 'VACATION' ? 'info' : 'outline'}>{t.label ?? t.type}</Badge>
                    <span className="ml-2 text-slate-500">
                      {new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {can.editResource(role) && (
                    <button
                      onClick={async () => {
                        await api.delete(`/resources/${resource.id}/time-off/${t.id}`);
                        reload();
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddSkillDialog
        open={skillDialogOpen}
        onOpenChange={setSkillDialogOpen}
        resourceId={resource.id}
        catalog={skillCatalog ?? []}
        onSaved={reload}
      />
      <AddTimeOffDialog
        open={timeOffDialogOpen}
        onOpenChange={setTimeOffDialogOpen}
        resourceId={resource.id}
        onSaved={reload}
      />
    </div>
  );
}

function AddSkillDialog({
  open,
  onOpenChange,
  resourceId,
  catalog,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  resourceId: string;
  catalog: Skill[];
  onSaved: () => void;
}) {
  const [skillId, setSkillId] = useState('');
  const [level, setLevel] = useState(3);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Skill</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await api.post(`/resources/${resourceId}/skills`, { skillId, level });
            setSaving(false);
            onSaved();
            onOpenChange(false);
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <Label>Skill</Label>
            <Select required value={skillId} onChange={(e) => setSkillId(e.target.value)}>
              <option value="">Select a skill</option>
              {catalog.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Level (1-5)</Label>
            <Input type="number" min={1} max={5} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !skillId}>
              {saving ? 'Saving…' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddTimeOffDialog({
  open,
  onOpenChange,
  resourceId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  resourceId: string;
  onSaved: () => void;
}) {
  const [type, setType] = useState<'VACATION' | 'PUBLIC_HOLIDAY'>('VACATION');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Time Off</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await api.post(`/resources/${resourceId}/time-off`, { type, startDate, endDate, label: label || undefined });
            setSaving(false);
            onSaved();
            onOpenChange(false);
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <Label>Type</Label>
            <Select value={type} onChange={(e) => setType(e.target.value as 'VACATION' | 'PUBLIC_HOLIDAY')}>
              <option value="VACATION">Vacation</option>
              <option value="PUBLIC_HOLIDAY">Public Holiday</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>Start</Label>
              <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>End</Label>
              <Input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Label (optional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Summer vacation" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

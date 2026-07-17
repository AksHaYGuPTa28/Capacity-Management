'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import type { Resource, Team } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: Team[];
  resource?: Resource | null;
  onSaved: () => void;
}

const LOCATIONS = ['New York, US', 'London, UK', 'Berlin, DE', 'Bangalore, IN', 'Warsaw, PL', 'Toronto, CA', 'Singapore, SG', 'Sydney, AU'];

export function ResourceFormDialog({ open, onOpenChange, teams, resource, onSaved }: Props) {
  const [form, setForm] = useState({
    name: '',
    jobTitle: '',
    teamId: '',
    department: '',
    location: LOCATIONS[0],
    employmentPct: 100,
    weeklyCapacityHours: 40,
    photoUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resource) {
      setForm({
        name: resource.name,
        jobTitle: resource.jobTitle,
        teamId: resource.teamId ?? '',
        department: resource.department,
        location: resource.location,
        employmentPct: resource.employmentPct,
        weeklyCapacityHours: resource.weeklyCapacityHours,
        photoUrl: resource.photoUrl ?? '',
      });
    } else {
      setForm({
        name: '',
        jobTitle: '',
        teamId: teams[0]?.id ?? '',
        department: teams[0]?.department ?? '',
        location: LOCATIONS[0],
        employmentPct: 100,
        weeklyCapacityHours: 40,
        photoUrl: '',
      });
    }
  }, [resource, teams, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, teamId: form.teamId || undefined };
      if (resource) {
        await api.patch(`/resources/${resource.id}`, payload);
      } else {
        await api.post('/resources', payload);
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save resource');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{resource ? 'Edit Person' : 'Add Person'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label>Name</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Job Title</Label>
            <Input required value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>Team</Label>
              <Select
                value={form.teamId}
                onChange={(e) => {
                  const team = teams.find((t) => t.id === e.target.value);
                  setForm({ ...form, teamId: e.target.value, department: team?.department ?? form.department });
                }}
              >
                <option value="">— None —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Department</Label>
              <Input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>Location</Label>
              <Select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Photo URL</Label>
              <Input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>Employment %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                required
                value={form.employmentPct}
                onChange={(e) => setForm({ ...form, employmentPct: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Weekly Capacity (h)</Label>
              <Input
                type="number"
                min={0}
                required
                value={form.weeklyCapacityHours}
                onChange={(e) => setForm({ ...form, weeklyCapacityHours: Number(e.target.value) })}
              />
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

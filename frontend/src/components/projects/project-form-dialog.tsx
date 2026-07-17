'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import type { Project, Resource } from '@/types';

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  resources,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project | null;
  resources: Resource[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    customer: '',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    status: 'PLANNING',
    budget: '',
    requiredCapacity: '',
    projectManagerId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        customer: project.customer ?? '',
        priority: project.priority,
        startDate: project.startDate?.slice(0, 10) ?? '',
        endDate: project.endDate?.slice(0, 10) ?? '',
        status: project.status,
        budget: project.budget?.toString() ?? '',
        requiredCapacity: project.requiredCapacity?.toString() ?? '',
        projectManagerId: project.projectManagerId ?? '',
      });
    } else {
      setForm({
        name: '',
        customer: '',
        priority: 'MEDIUM',
        startDate: '',
        endDate: '',
        status: 'PLANNING',
        budget: '',
        requiredCapacity: '',
        projectManagerId: '',
      });
    }
  }, [project, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        customer: form.customer || undefined,
        endDate: form.endDate || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        requiredCapacity: form.requiredCapacity ? Number(form.requiredCapacity) : undefined,
        projectManagerId: form.projectManagerId || undefined,
      };
      if (project) {
        await api.patch(`/projects/${project.id}`, payload);
      } else {
        await api.post('/projects', payload);
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Create Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label>Name</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Customer</Label>
            <Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>Priority</Label>
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="PLANNING">Planning</option>
                <option value="RUNNING">Running</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>Start Date</Label>
              <Input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>Budget ($)</Label>
              <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Required Capacity (h/wk)</Label>
              <Input
                type="number"
                value={form.requiredCapacity}
                onChange={(e) => setForm({ ...form, requiredCapacity: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Project Manager</Label>
            <Select value={form.projectManagerId} onChange={(e) => setForm({ ...form, projectManagerId: e.target.value })}>
              <option value="">None</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useFetch } from '@/hooks/use-fetch';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { can } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { Resource, Skill } from '@/types';

export default function SkillsPage() {
  const role = useAuthStore((s) => s.user?.role);
  const { data: skills, reload } = useFetch<Skill[]>('/skills');
  const [addOpen, setAddOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [searchSkill, setSearchSkill] = useState('');
  const [searchResults, setSearchResults] = useState<Resource[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function runSearch(name: string) {
    if (!name) return;
    setSearching(true);
    setSearchSkill(name);
    try {
      const res = await api.get<Resource[]>(`/skills/search?name=${encodeURIComponent(name)}`);
      setSearchResults(res.data);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Skills</h1>
          <p className="text-sm text-slate-500">{skills?.length ?? 0} skills in the catalog</p>
        </div>
        {can.manageSkillCatalog(role) && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Skill
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          {(skills ?? []).map((s) => (
            <button
              key={s.id}
              onClick={() => runSearch(s.name)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:hover:bg-slate-900"
            >
              {s.name}
              <span className="text-xs text-slate-400">{s._count?.resources ?? 0}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder='Find people with a skill, e.g. "AWS"'
              className="max-w-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch((e.target as HTMLInputElement).value);
              }}
            />
          </div>
          {searching && <div className="text-sm text-slate-400">Searching…</div>}
          {searchResults && !searching && (
            <div>
              <div className="mb-2 text-sm text-slate-500">
                {searchResults.length} people with <span className="font-medium">{searchSkill}</span> skills
              </div>
              <div className="flex flex-col gap-2">
                {searchResults.map((r) => (
                  <Link
                    key={r.id}
                    href={`/people/${r.id}`}
                    className="flex items-center gap-3 rounded-md border border-slate-200 p-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  >
                    <Avatar name={r.name} src={r.photoUrl} className="h-8 w-8" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.jobTitle}</div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {r.skills?.find((s) => s.skill.name.toLowerCase() === searchSkill.toLowerCase())?.level ?? '-'}/5
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skill to Catalog</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await api.post('/skills', { name: newSkill });
              setNewSkill('');
              reload();
              setAddOpen(false);
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              <Label>Skill name</Label>
              <Input required value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="e.g. Kubernetes" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

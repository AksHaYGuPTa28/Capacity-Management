'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { AuthUser } from '@/types';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrator',
  RESOURCE_MANAGER: 'Resource Manager',
  TEAM_MANAGER: 'Team Manager',
  VIEWER: 'Viewer / Executive',
};

const ROLE_ORDER = ['ADMIN', 'RESOURCE_MANAGER', 'TEAM_MANAGER', 'VIEWER'];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    api
      .get<DemoUser[]>('/auth/demo-users')
      .then((res) => setDemoUsers(res.data))
      .catch(() => setError('Could not reach the backend API. Is it running?'));
  }, []);

  async function loginAsDemo(user: DemoUser) {
    setLoadingId(user.id);
    setError(null);
    try {
      const res = await api.post<{ accessToken: string; user: AuthUser }>('/auth/demo-login', { userId: user.id });
      setSession(res.data.accessToken, res.data.user);
      router.push('/dashboard');
    } catch {
      setError('Login failed.');
    } finally {
      setLoadingId(null);
    }
  }

  async function loginManual(e: React.FormEvent) {
    e.preventDefault();
    setManualLoading(true);
    setError(null);
    try {
      const res = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login', { email, password });
      setSession(res.data.accessToken, res.data.user);
      router.push('/dashboard');
    } catch {
      setError('Invalid credentials.');
    } finally {
      setManualLoading(false);
    }
  }

  const grouped = ROLE_ORDER.map((role) => ({
    role,
    users: demoUsers.filter((u) => u.role === role),
  })).filter((g) => g.users.length > 0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
          C
        </div>
        <h1 className="text-2xl font-semibold">Capacity Management Demo</h1>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          Pick a demo persona to sign in instantly, no password needed. This is a demonstration app with synthetic
          data.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {grouped.map((group) => (
          <Card key={group.role}>
            <CardContent className="flex flex-col gap-3 p-4">
              <Badge variant="info" className="w-fit">
                {ROLE_LABEL[group.role]}
              </Badge>
              {group.users.slice(0, 3).map((u) => (
                <button
                  key={u.id}
                  onClick={() => loginAsDemo(u)}
                  disabled={loadingId !== null}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <Avatar name={u.name} />
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-sm font-medium">{u.name}</div>
                    <div className="truncate text-xs text-slate-500">{u.email}</div>
                  </div>
                  {loadingId === u.id && <span className="text-xs text-slate-400">Signing in…</span>}
                </button>
              ))}
              {group.users.length > 3 && (
                <div className="text-xs text-slate-400">+{group.users.length - 3} more {ROLE_LABEL[group.role]} accounts</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 w-full max-w-sm">
        <details className="text-center text-sm text-slate-500">
          <summary className="cursor-pointer">Sign in with email instead</summary>
          <form onSubmit={loginManual} className="mt-4 flex flex-col gap-3 text-left">
            <div className="flex flex-col gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@demo.io" required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="demo1234" required />
            </div>
            <Button type="submit" disabled={manualLoading}>
              {manualLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </details>
      </div>
    </div>
  );
}

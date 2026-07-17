'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun, LogOut, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrator',
  RESOURCE_MANAGER: 'Resource Manager',
  TEAM_MANAGER: 'Team Manager',
  VIEWER: 'Viewer / Executive',
};

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex max-w-md flex-1 items-center gap-2 text-slate-400">
        <Search className="h-4 w-4" />
        <Input
          placeholder="Search people, projects, skills…"
          className="h-8 border-none bg-slate-100 shadow-none focus-visible:ring-1 dark:bg-slate-900"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const value = (e.target as HTMLInputElement).value;
              if (value) router.push(`/people?search=${encodeURIComponent(value)}`);
            }
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleDark} title="Toggle dark mode">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {user && (
          <div className="flex items-center gap-2">
            <Avatar name={user.name} />
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-slate-500">{ROLE_LABEL[user.role] ?? user.role}</div>
            </div>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

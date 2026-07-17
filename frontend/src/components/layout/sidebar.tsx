'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Briefcase,
  GitMerge,
  Sparkles,
  Wrench,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/people', label: 'People', icon: Users },
  { href: '/teams', label: 'Teams', icon: UsersRound },
  { href: '/projects', label: 'Projects', icon: Briefcase },
  { href: '/allocations', label: 'Allocations', icon: GitMerge },
  { href: '/skills', label: 'Skills', icon: Wrench },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/ai', label: 'Ask AI', icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const items = role === 'ADMIN' ? [...NAV_ITEMS, { href: '/users', label: 'Users', icon: ShieldCheck }] : NAV_ITEMS;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
          C
        </div>
        <span className="text-sm font-semibold">Capacity Mgmt</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3 text-xs text-slate-400 dark:border-slate-800">
        Demonstration build — data is synthetic.
      </div>
    </aside>
  );
}

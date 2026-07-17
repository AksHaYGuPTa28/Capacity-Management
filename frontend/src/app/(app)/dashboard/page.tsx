'use client';

import {
  Users,
  Gauge,
  TrendingUp,
  Percent,
  Briefcase,
  AlertTriangle,
  BatteryLow,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { useFetch } from '@/hooks/use-fetch';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Heatmap } from '@/components/dashboard/heatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Kpis } from '@/types';

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#10b981',
  PARTIAL: '#0ea5e9',
  FULLY_ALLOCATED: '#f59e0b',
  OVER_ALLOCATED: '#ef4444',
  LEAVE: '#94a3b8',
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">{children}</CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: kpis, loading: kpisLoading } = useFetch<Kpis>('/dashboard/kpis');
  const { data: capacityVsDemand } = useFetch<{ team: string; capacity: number; demand: number }[]>(
    '/dashboard/charts/capacity-vs-demand',
  );
  const { data: utilizationDist } = useFetch<{ status: string; count: number }[]>(
    '/dashboard/charts/utilization-distribution',
  );
  const { data: allocByTeam } = useFetch<{ team: string; hours: number }[]>('/dashboard/charts/allocation-by-team');
  const { data: allocByProject } = useFetch<{ project: string; hours: number }[]>(
    '/dashboard/charts/allocation-by-project',
  );
  const { data: forecast } = useFetch<{ month: string; demandHours: number; capacityHours: number }[]>(
    '/dashboard/charts/monthly-forecast?months=6',
  );
  const { data: heatmap } = useFetch<{ resourceId: string; name: string; team: string | null; weeks: { week: number; utilization: number }[] }[]>(
    '/dashboard/charts/heatmap?weeks=8',
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">Live snapshot of capacity across the organization.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Total Employees" value={kpisLoading ? '…' : (kpis?.totalEmployees ?? 0)} icon={Users} />
        <KpiCard
          label="Available Capacity"
          value={kpisLoading ? '…' : (kpis?.availableCapacity ?? 0)}
          suffix="h"
          icon={BatteryLow}
          tone="success"
        />
        <KpiCard
          label="Allocated Capacity"
          value={kpisLoading ? '…' : (kpis?.allocatedCapacity ?? 0)}
          suffix="h"
          icon={Gauge}
        />
        <KpiCard
          label="Utilization"
          value={kpisLoading ? '…' : (kpis?.utilizationPct ?? 0)}
          suffix="%"
          icon={Percent}
          tone={kpis && kpis.utilizationPct > 100 ? 'danger' : 'default'}
        />
        <KpiCard label="Projects Running" value={kpisLoading ? '…' : (kpis?.projectsRunning ?? 0)} icon={Briefcase} />
        <KpiCard
          label="Overallocated"
          value={kpisLoading ? '…' : (kpis?.peopleOverallocated ?? 0)}
          icon={AlertTriangle}
          tone="danger"
        />
        <KpiCard
          label="Underallocated"
          value={kpisLoading ? '…' : (kpis?.peopleUnderallocated ?? 0)}
          icon={TrendingUp}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Capacity vs Demand by Team">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={capacityVsDemand ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="team" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="capacity" fill="#94a3b8" name="Capacity (h)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="demand" fill="#4f46e5" name="Demand (h)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Resource Utilization">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={utilizationDist ?? []}
                dataKey="count"
                nameKey="status"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {(utilizationDist ?? []).map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Allocation by Team (h/week)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={allocByTeam ?? []} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="team" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="hours" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Allocation by Project (h/week)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={allocByProject ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="project" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {(allocByProject ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Forecast">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="capacityHours" stroke="#94a3b8" fill="#e2e8f0" name="Capacity" />
              <Area type="monotone" dataKey="demandHours" stroke="#4f46e5" fill="#c7d2fe" name="Demand" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>Resource Heat Map (next 8 weeks)</CardTitle>
          </CardHeader>
          <CardContent className="h-72 overflow-auto">
            <Heatmap rows={heatmap ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

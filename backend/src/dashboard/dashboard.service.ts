import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { currentAllocations } from '../common/utils/allocation.util';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private async resourcesWithLoad() {
    const resources = await this.prisma.resource.findMany({
      include: { team: true, allocations: true, timeOffs: true },
    });
    const now = new Date();
    return resources.map((r) => {
      const effectiveCapacity = (r.weeklyCapacityHours * r.employmentPct) / 100;
      const allocatedHours = currentAllocations(r.allocations).reduce((s, a) => s + a.hoursPerWeek, 0);
      const utilization = effectiveCapacity > 0 ? (allocatedHours / effectiveCapacity) * 100 : 0;
      const onLeave = r.timeOffs.some((t) => t.startDate <= now && now <= t.endDate);
      let status: string;
      if (onLeave) status = 'LEAVE';
      else if (utilization > 100) status = 'OVER_ALLOCATED';
      else if (utilization >= 80) status = 'FULLY_ALLOCATED';
      else if (utilization > 0) status = 'PARTIAL';
      else status = 'AVAILABLE';
      return { ...r, effectiveCapacity, allocatedHours, utilization, status };
    });
  }

  async kpis() {
    const [resources, runningProjects] = await Promise.all([
      this.resourcesWithLoad(),
      this.prisma.project.count({ where: { status: 'RUNNING' } }),
    ]);

    const totalEmployees = resources.length;
    const totalCapacity = resources.reduce((s, r) => s + r.effectiveCapacity, 0);
    const allocatedCapacity = resources.reduce((s, r) => s + r.allocatedHours, 0);
    const availableCapacity = Math.max(0, totalCapacity - allocatedCapacity);
    const utilizationPct = totalCapacity > 0 ? (allocatedCapacity / totalCapacity) * 100 : 0;
    const overallocated = resources.filter((r) => r.status === 'OVER_ALLOCATED').length;
    const underallocated = resources.filter((r) => r.utilization < 50 && r.status !== 'LEAVE').length;

    return {
      totalEmployees,
      availableCapacity: round1(availableCapacity),
      allocatedCapacity: round1(allocatedCapacity),
      utilizationPct: round1(utilizationPct),
      projectsRunning: runningProjects,
      peopleOverallocated: overallocated,
      peopleUnderallocated: underallocated,
    };
  }

  async capacityVsDemand() {
    const teams = await this.prisma.team.findMany({ include: { members: { include: { allocations: true } } } });
    return teams.map((t) => {
      const capacity = t.members.reduce((s, m) => s + (m.weeklyCapacityHours * m.employmentPct) / 100, 0);
      const demand = t.members.reduce(
        (s, m) => s + currentAllocations(m.allocations).reduce((a, x) => a + x.hoursPerWeek, 0),
        0,
      );
      return { team: t.name, capacity: round1(capacity), demand: round1(demand) };
    });
  }

  async utilizationDistribution() {
    const resources = await this.resourcesWithLoad();
    const buckets = { AVAILABLE: 0, PARTIAL: 0, FULLY_ALLOCATED: 0, OVER_ALLOCATED: 0, LEAVE: 0 };
    for (const r of resources) buckets[r.status as keyof typeof buckets]++;
    return Object.entries(buckets).map(([status, count]) => ({ status, count }));
  }

  async allocationByTeam() {
    const teams = await this.prisma.team.findMany({ include: { members: { include: { allocations: true } } } });
    return teams
      .map((t) => ({
        team: t.name,
        hours: round1(
          t.members.reduce((s, m) => s + currentAllocations(m.allocations).reduce((a, x) => a + x.hoursPerWeek, 0), 0),
        ),
      }))
      .sort((a, b) => b.hours - a.hours);
  }

  async allocationByProject() {
    const projects = await this.prisma.project.findMany({ include: { allocations: true } });
    return projects
      .map((p) => ({ project: p.name, hours: round1(currentAllocations(p.allocations).reduce((s, a) => s + a.hoursPerWeek, 0)) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 12);
  }

  async monthlyForecast(months = 6) {
    const [resources, allocations] = await Promise.all([
      this.prisma.resource.findMany(),
      this.prisma.allocation.findMany(),
    ]);
    const totalCapacity = resources.reduce((s, r) => s + (r.weeklyCapacityHours * r.employmentPct) / 100, 0);

    const result: { month: string; demandHours: number; capacityHours: number; utilizationPct: number }[] = [];
    const now = new Date();
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const activeAllocations = allocations.filter(
        (a) => a.startDate <= monthEnd && (!a.endDate || a.endDate >= monthStart),
      );
      const demandHours = activeAllocations.reduce((s, a) => s + a.hoursPerWeek, 0);
      const capacityHours = totalCapacity;
      result.push({
        month: monthStart.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        demandHours: round1(demandHours),
        capacityHours: round1(capacityHours),
        utilizationPct: capacityHours > 0 ? round1((demandHours / capacityHours) * 100) : 0,
      });
    }
    return result;
  }

  async heatmap(weeks = 8) {
    const resources = await this.prisma.resource.findMany({
      include: { allocations: true, team: true },
      orderBy: { name: 'asc' },
    });
    const now = new Date();
    return resources.map((r) => {
      const effectiveCapacity = (r.weeklyCapacityHours * r.employmentPct) / 100;
      const weekCells: { week: number; utilization: number }[] = [];
      for (let w = 0; w < weeks; w++) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() + w * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const hours = r.allocations
          .filter((a) => a.startDate <= weekEnd && (!a.endDate || a.endDate >= weekStart))
          .reduce((s, a) => s + a.hoursPerWeek, 0);
        const utilization = effectiveCapacity > 0 ? round1((hours / effectiveCapacity) * 100) : 0;
        weekCells.push({ week: w + 1, utilization });
      }
      return { resourceId: r.id, name: r.name, team: r.team?.name ?? null, weeks: weekCells };
    });
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

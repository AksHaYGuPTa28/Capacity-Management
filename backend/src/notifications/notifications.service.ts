import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { currentAllocations } from '../common/utils/allocation.util';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const stored = await this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return stored;
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  /** Recompute live notifications from current data (over-allocation, ending projects, freshly available people). */
  async refresh() {
    const [resources, projects] = await Promise.all([
      this.prisma.resource.findMany({ include: { allocations: true, timeOffs: true } }),
      this.prisma.project.findMany({ where: { status: 'RUNNING' } }),
    ]);
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const notifications: { type: any; message: string; resourceId?: string; projectId?: string }[] = [];

    for (const r of resources) {
      const effectiveCapacity = (r.weeklyCapacityHours * r.employmentPct) / 100;
      const allocatedHours = currentAllocations(r.allocations).reduce((s, a) => s + a.hoursPerWeek, 0);
      if (effectiveCapacity > 0 && allocatedHours > effectiveCapacity) {
        notifications.push({
          type: 'OVER_ALLOCATION',
          message: `${r.name} is allocated ${allocatedHours}h/week against ${Math.round(effectiveCapacity)}h capacity.`,
          resourceId: r.id,
        });
      }
      if (allocatedHours === 0 && r.timeOffs.every((t) => t.endDate < now)) {
        notifications.push({
          type: 'RESOURCE_AVAILABLE',
          message: `${r.name} has no active allocations and is fully available.`,
          resourceId: r.id,
        });
      }
      for (const t of r.timeOffs) {
        const conflict = r.allocations.some((a) => a.startDate <= t.endDate && (!a.endDate || a.endDate >= t.startDate));
        if (conflict && t.startDate >= now) {
          notifications.push({
            type: 'VACATION_CONFLICT',
            message: `${r.name} has an allocation overlapping planned time off (${t.label ?? t.type}).`,
            resourceId: r.id,
          });
        }
      }
    }

    for (const p of projects) {
      if (p.endDate && p.endDate <= in14Days && p.endDate >= now) {
        notifications.push({
          type: 'PROJECT_ENDING',
          message: `${p.name} ends on ${p.endDate.toISOString().slice(0, 10)} — plan reallocation.`,
          projectId: p.id,
        });
      }
    }

    return notifications.slice(0, 30);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAllocationDto, UpdateAllocationDto } from './dto/allocation.dto';
import { currentAllocations } from '../common/utils/allocation.util';

@Injectable()
export class AllocationsService {
  constructor(private prisma: PrismaService) {}

  findAll(filters: { resourceId?: string; projectId?: string } = {}) {
    const where: any = {};
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.projectId) where.projectId = filters.projectId;
    return this.prisma.allocation.findMany({
      where,
      include: {
        resource: { select: { id: true, name: true, weeklyCapacityHours: true, employmentPct: true } },
        project: { select: { id: true, name: true, status: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  create(dto: CreateAllocationDto) {
    return this.prisma.allocation.create({
      data: {
        resourceId: dto.resourceId,
        projectId: dto.projectId,
        hoursPerWeek: dto.hoursPerWeek,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  update(id: string, dto: UpdateAllocationDto) {
    return this.prisma.allocation.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.allocation.delete({ where: { id } });
  }

  /** Grid shape for the allocation screen: rows = resources, columns = projects, cell = hours/week. */
  async matrix() {
    const [resources, projects, allocations] = await Promise.all([
      this.prisma.resource.findMany({
        select: { id: true, name: true, jobTitle: true, weeklyCapacityHours: true, employmentPct: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.project.findMany({
        where: { status: { in: ['PLANNING', 'RUNNING'] } },
        select: { id: true, name: true, status: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.allocation.findMany({
        select: { id: true, resourceId: true, projectId: true, hoursPerWeek: true, startDate: true, endDate: true },
      }),
    ]);

    const cells: Record<string, Record<string, { id: string; hoursPerWeek: number }>> = {};
    for (const a of currentAllocations(allocations)) {
      cells[a.resourceId] ??= {};
      const existing = cells[a.resourceId][a.projectId];
      cells[a.resourceId][a.projectId] = existing
        ? { id: a.id, hoursPerWeek: existing.hoursPerWeek + a.hoursPerWeek }
        : { id: a.id, hoursPerWeek: a.hoursPerWeek };
    }

    const rows = resources.map((r) => {
      const effectiveCapacity = (r.weeklyCapacityHours * r.employmentPct) / 100;
      const allocatedHours = Object.values(cells[r.id] ?? {}).reduce((s, c) => s + c.hoursPerWeek, 0);
      return {
        resource: r,
        effectiveCapacity: Math.round(effectiveCapacity * 10) / 10,
        allocatedHours: Math.round(allocatedHours * 10) / 10,
        remainingCapacity: Math.round((effectiveCapacity - allocatedHours) * 10) / 10,
        utilization: effectiveCapacity > 0 ? Math.round((allocatedHours / effectiveCapacity) * 1000) / 10 : 0,
        cells: cells[r.id] ?? {},
      };
    });

    return { projects, rows };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignSkillDto, CreateResourceDto, CreateTimeOffDto, UpdateResourceDto } from './dto/resource.dto';
import { currentAllocations } from '../common/utils/allocation.util';

export interface ResourceFilters {
  team?: string;
  department?: string;
  location?: string;
  skill?: string;
  availability?: string;
  search?: string;
}

const INCLUDE = {
  team: true,
  skills: { include: { skill: true } },
  timeOffs: true,
  allocations: { include: { project: { select: { id: true, name: true, status: true } } } },
};

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: ResourceFilters = {}) {
    const where: any = {};
    if (filters.team) where.teamId = filters.team;
    if (filters.department) where.department = { equals: filters.department, mode: 'insensitive' };
    if (filters.location) where.location = { equals: filters.location, mode: 'insensitive' };
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { jobTitle: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.skill) {
      where.skills = { some: { skill: { name: { equals: filters.skill, mode: 'insensitive' } } } };
    }

    const resources = await this.prisma.resource.findMany({ where, include: INCLUDE, orderBy: { name: 'asc' } });
    const withMetrics = resources.map((r) => this.withMetrics(r));
    if (filters.availability) {
      return withMetrics.filter((r) => r.computedStatus === filters.availability);
    }
    return withMetrics;
  }

  async findOne(id: string) {
    const resource = await this.prisma.resource.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    return this.withMetrics(resource);
  }

  create(dto: CreateResourceDto) {
    return this.prisma.resource.create({ data: dto, include: INCLUDE });
  }

  update(id: string, dto: UpdateResourceDto) {
    return this.prisma.resource.update({ where: { id }, data: dto, include: INCLUDE });
  }

  remove(id: string) {
    return this.prisma.resource.delete({ where: { id } });
  }

  async assignSkill(resourceId: string, dto: AssignSkillDto) {
    await this.prisma.resourceSkill.upsert({
      where: { resourceId_skillId: { resourceId, skillId: dto.skillId } },
      update: { level: dto.level },
      create: { resourceId, skillId: dto.skillId, level: dto.level },
    });
    return this.findOne(resourceId);
  }

  async removeSkill(resourceId: string, skillId: string) {
    await this.prisma.resourceSkill.delete({ where: { resourceId_skillId: { resourceId, skillId } } });
    return this.findOne(resourceId);
  }

  async addTimeOff(resourceId: string, dto: CreateTimeOffDto) {
    await this.prisma.timeOff.create({
      data: {
        resourceId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        label: dto.label,
      },
    });
    return this.findOne(resourceId);
  }

  async removeTimeOff(resourceId: string, timeOffId: string) {
    await this.prisma.timeOff.delete({ where: { id: timeOffId } });
    return this.findOne(resourceId);
  }

  /** Compute effective weekly capacity, allocated hours, utilization %, and status. */
  withMetrics(resource: any) {
    const effectiveCapacity = (resource.weeklyCapacityHours * resource.employmentPct) / 100;
    const allocatedHours = currentAllocations(resource.allocations).reduce((s: number, a: any) => s + a.hoursPerWeek, 0);
    const utilization = effectiveCapacity > 0 ? Math.round((allocatedHours / effectiveCapacity) * 1000) / 10 : 0;
    const remainingCapacity = Math.round((effectiveCapacity - allocatedHours) * 10) / 10;

    const now = new Date();
    const onLeave = resource.timeOffs.some((t: any) => new Date(t.startDate) <= now && now <= new Date(t.endDate));

    let computedStatus: string;
    if (onLeave) computedStatus = 'LEAVE';
    else if (utilization > 100) computedStatus = 'OVER_ALLOCATED';
    else if (utilization >= 80) computedStatus = 'FULLY_ALLOCATED';
    else if (utilization > 0) computedStatus = 'PARTIAL';
    else computedStatus = 'AVAILABLE';

    return {
      ...resource,
      effectiveCapacity: Math.round(effectiveCapacity * 10) / 10,
      allocatedHours: Math.round(allocatedHours * 10) / 10,
      remainingCapacity,
      utilization,
      computedStatus,
    };
  }
}

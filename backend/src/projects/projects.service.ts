import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { currentAllocations } from '../common/utils/allocation.util';

const INCLUDE = {
  projectManager: { select: { id: true, name: true, jobTitle: true } },
  allocations: { include: { resource: { select: { id: true, name: true, jobTitle: true } } } },
};

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { status?: string; search?: string } = {}) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };
    const projects = await this.prisma.project.findMany({ where, include: INCLUDE, orderBy: { startDate: 'desc' } });
    return projects.map((p) => this.withMetrics(p));
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    return this.withMetrics(project);
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: INCLUDE,
    });
  }

  update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: INCLUDE,
    });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  private withMetrics(project: any) {
    const active = currentAllocations(project.allocations);
    const allocatedHours = active.reduce((s: number, a: any) => s + a.hoursPerWeek, 0);
    const staffedCount = new Set(active.map((a: any) => a.resourceId)).size;
    const requiredCapacity = project.requiredCapacity ?? 0;
    const staffingPct = requiredCapacity > 0 ? Math.round((allocatedHours / requiredCapacity) * 1000) / 10 : null;
    return { ...project, allocatedHours: Math.round(allocatedHours * 10) / 10, staffedCount, staffingPct };
  }
}

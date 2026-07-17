import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
import { currentAllocations } from '../common/utils/allocation.util';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const teams = await this.prisma.team.findMany({
      include: {
        manager: { select: { id: true, name: true, email: true } },
        members: { include: { allocations: true } },
      },
      orderBy: { name: 'asc' },
    });
    return teams.map((t) => this.withMetrics(t));
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUniqueOrThrow({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        members: { include: { allocations: true, skills: { include: { skill: true } } } },
      },
    });
    return this.withMetrics(team);
  }

  create(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: dto });
  }

  update(id: string, dto: UpdateTeamDto) {
    return this.prisma.team.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.team.delete({ where: { id } });
  }

  private withMetrics(team: any) {
    const totalCapacity = team.members.reduce(
      (sum: number, m: any) => sum + (m.weeklyCapacityHours * m.employmentPct) / 100,
      0,
    );
    const allocatedHours = team.members.reduce(
      (sum: number, m: any) => sum + currentAllocations(m.allocations).reduce((s: number, a: any) => s + a.hoursPerWeek, 0),
      0,
    );
    const utilization = totalCapacity > 0 ? Math.round((allocatedHours / totalCapacity) * 1000) / 10 : 0;
    return {
      ...team,
      memberCount: team.members.length,
      totalCapacity: Math.round(totalCapacity * 10) / 10,
      allocatedHours: Math.round(allocatedHours * 10) / 10,
      utilization,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.skill.findMany({
      include: { _count: { select: { resources: true } } },
      orderBy: { name: 'asc' },
    });
  }

  create(dto: CreateSkillDto) {
    return this.prisma.skill.create({ data: dto });
  }

  update(id: string, dto: UpdateSkillDto) {
    return this.prisma.skill.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.skill.delete({ where: { id } });
  }

  // "Find AWS Architects" style search: people with a given skill (optionally min level)
  async findResourcesBySkill(skillName: string, minLevel = 1) {
    return this.prisma.resource.findMany({
      where: {
        skills: {
          some: {
            level: { gte: minLevel },
            skill: { name: { equals: skillName, mode: 'insensitive' } },
          },
        },
      },
      include: { skills: { include: { skill: true } }, team: true },
    });
  }
}

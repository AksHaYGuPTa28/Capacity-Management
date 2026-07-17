import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SkillsService } from './skills.service';
import { CreateSkillDto, UpdateSkillDto } from './dto/skill.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiBearerAuth()
@ApiTags('skills')
@UseGuards(RolesGuard)
@Controller('skills')
export class SkillsController {
  constructor(private skills: SkillsService) {}

  @Get()
  findAll() {
    return this.skills.findAll();
  }

  @Get('search')
  search(@Query('name') name: string, @Query('minLevel') minLevel?: string) {
    return this.skills.findResourcesBySkill(name, minLevel ? Number(minLevel) : 1);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateSkillDto) {
    return this.skills.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skills.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skills.remove(id);
  }
}

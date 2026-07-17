import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ResourcesService } from './resources.service';
import { AssignSkillDto, CreateResourceDto, CreateTimeOffDto, UpdateResourceDto } from './dto/resource.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiBearerAuth()
@ApiTags('resources')
@UseGuards(RolesGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private resources: ResourcesService) {}

  @Get()
  findAll(
    @Query('team') team?: string,
    @Query('department') department?: string,
    @Query('location') location?: string,
    @Query('skill') skill?: string,
    @Query('availability') availability?: string,
    @Query('search') search?: string,
  ) {
    return this.resources.findAll({ team, department, location, skill, availability, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resources.findOne(id);
  }

  @Roles(Role.ADMIN, Role.RESOURCE_MANAGER)
  @Post()
  create(@Body() dto: CreateResourceDto) {
    return this.resources.create(dto);
  }

  @Roles(Role.ADMIN, Role.RESOURCE_MANAGER, Role.TEAM_MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateResourceDto) {
    return this.resources.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resources.remove(id);
  }

  @Roles(Role.ADMIN, Role.RESOURCE_MANAGER, Role.TEAM_MANAGER)
  @Post(':id/skills')
  assignSkill(@Param('id') id: string, @Body() dto: AssignSkillDto) {
    return this.resources.assignSkill(id, dto);
  }

  @Roles(Role.ADMIN, Role.RESOURCE_MANAGER, Role.TEAM_MANAGER)
  @Delete(':id/skills/:skillId')
  removeSkill(@Param('id') id: string, @Param('skillId') skillId: string) {
    return this.resources.removeSkill(id, skillId);
  }

  @Roles(Role.ADMIN, Role.RESOURCE_MANAGER, Role.TEAM_MANAGER)
  @Post(':id/time-off')
  addTimeOff(@Param('id') id: string, @Body() dto: CreateTimeOffDto) {
    return this.resources.addTimeOff(id, dto);
  }

  @Roles(Role.ADMIN, Role.RESOURCE_MANAGER, Role.TEAM_MANAGER)
  @Delete(':id/time-off/:timeOffId')
  removeTimeOff(@Param('id') id: string, @Param('timeOffId') timeOffId: string) {
    return this.resources.removeTimeOff(id, timeOffId);
  }
}

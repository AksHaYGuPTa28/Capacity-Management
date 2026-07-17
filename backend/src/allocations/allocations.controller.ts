import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AllocationsService } from './allocations.service';
import { CreateAllocationDto, UpdateAllocationDto } from './dto/allocation.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiBearerAuth()
@ApiTags('allocations')
@UseGuards(RolesGuard)
@Controller('allocations')
export class AllocationsController {
  constructor(private allocations: AllocationsService) {}

  @Get()
  findAll(@Query('resourceId') resourceId?: string, @Query('projectId') projectId?: string) {
    return this.allocations.findAll({ resourceId, projectId });
  }

  @Get('matrix')
  matrix() {
    return this.allocations.matrix();
  }

  @Roles(Role.ADMIN, Role.RESOURCE_MANAGER, Role.TEAM_MANAGER)
  @Post()
  create(@Body() dto: CreateAllocationDto) {
    return this.allocations.create(dto);
  }

  @Roles(Role.ADMIN, Role.RESOURCE_MANAGER, Role.TEAM_MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAllocationDto) {
    return this.allocations.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.RESOURCE_MANAGER, Role.TEAM_MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.allocations.remove(id);
  }
}

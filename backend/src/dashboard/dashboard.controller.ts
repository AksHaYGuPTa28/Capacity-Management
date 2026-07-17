import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiBearerAuth()
@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('kpis')
  kpis() {
    return this.dashboard.kpis();
  }

  @Get('charts/capacity-vs-demand')
  capacityVsDemand() {
    return this.dashboard.capacityVsDemand();
  }

  @Get('charts/utilization-distribution')
  utilizationDistribution() {
    return this.dashboard.utilizationDistribution();
  }

  @Get('charts/allocation-by-team')
  allocationByTeam() {
    return this.dashboard.allocationByTeam();
  }

  @Get('charts/allocation-by-project')
  allocationByProject() {
    return this.dashboard.allocationByProject();
  }

  @Get('charts/monthly-forecast')
  monthlyForecast(@Query('months') months?: string) {
    return this.dashboard.monthlyForecast(months ? Number(months) : 6);
  }

  @Get('charts/heatmap')
  heatmap(@Query('weeks') weeks?: string) {
    return this.dashboard.heatmap(weeks ? Number(weeks) : 8);
  }
}

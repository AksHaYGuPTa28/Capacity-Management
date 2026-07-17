import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAllocationDto {
  @ApiProperty()
  @IsString()
  resourceId: string;

  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  hoursPerWeek: number;

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpdateAllocationDto extends PartialType(CreateAllocationDto) {}

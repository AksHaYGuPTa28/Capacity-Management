import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty()
  @IsString()
  jobTitle: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiProperty()
  @IsString()
  department: string;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty({ default: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  employmentPct: number;

  @ApiProperty({ default: 40 })
  @IsNumber()
  @Min(0)
  weeklyCapacityHours: number;
}

export class UpdateResourceDto extends PartialType(CreateResourceDto) {}

export class AssignSkillDto {
  @ApiProperty()
  @IsString()
  skillId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  level: number;
}

export class CreateTimeOffDto {
  @ApiProperty({ enum: ['VACATION', 'PUBLIC_HOLIDAY'] })
  @IsString()
  type: 'VACATION' | 'PUBLIC_HOLIDAY';

  @ApiProperty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsString()
  endDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  label?: string;
}

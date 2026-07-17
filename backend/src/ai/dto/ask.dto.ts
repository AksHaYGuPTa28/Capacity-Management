import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AskDto {
  @ApiProperty({ example: 'Who has AWS skills?' })
  @IsString()
  question: string;
}

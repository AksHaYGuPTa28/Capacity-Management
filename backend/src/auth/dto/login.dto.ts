import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@demo.io' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'demo1234' })
  @IsString()
  @MinLength(4)
  password: string;
}

export class DemoLoginDto {
  @ApiProperty({ description: 'User id of a seeded demo persona' })
  @IsString()
  userId: string;
}

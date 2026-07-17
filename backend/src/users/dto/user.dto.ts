import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 'demo1234' })
  @IsString()
  @MinLength(4)
  password: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

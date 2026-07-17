import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueToken(user.id, user.email, user.role, user.name);
  }

  async demoLogin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Unknown demo user');
    }
    return this.issueToken(user.id, user.email, user.role, user.name);
  }

  async listDemoUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { role: 'asc' },
    });
  }

  private issueToken(sub: string, email: string, role: string, name: string) {
    const accessToken = this.jwt.sign({ sub, email, role, name });
    return { accessToken, user: { id: sub, email, role, name } };
  }
}

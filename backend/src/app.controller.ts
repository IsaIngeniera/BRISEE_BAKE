import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/live')
  live() {
    return { status: 'ok' };
  }

  @Get('health/ready')
  async ready() {
    try {
      if (!this.prisma) {
        throw new Error('PrismaService is not configured');
      }
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new HttpException(
        { status: 'unavailable', database: 'unavailable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}

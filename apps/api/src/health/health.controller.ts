import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('v1/health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  health() {
    return {
      status: 'ok',
      service: 'locallife-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        checks: { database: 'up' },
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'not_ready',
        checks: { database: 'down' },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Auth } from '../auth/auth.decorators';

@Controller('v1/admin')
export class AdminController {
  @Get('ping')
  @Auth(UserRole.ADMIN)
  ping() {
    return { ok: true, scope: 'admin' };
  }
}

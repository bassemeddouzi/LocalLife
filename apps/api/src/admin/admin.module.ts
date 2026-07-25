import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuditService } from '../shared/audit.service';

@Module({
  controllers: [AdminController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { GuidesController } from './guides.controller';

@Module({
  controllers: [GuidesController],
})
export class GuidesModule {}

import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [SocialController],
})
export class SocialModule {}

import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { KnowledgeGuidesController } from './knowledge-guides.controller';
import { LocalRulesController } from './local-rules.controller';

@Module({
  controllers: [
    TransportController,
    KnowledgeGuidesController,
    LocalRulesController,
  ],
})
export class KnowledgeModule {}

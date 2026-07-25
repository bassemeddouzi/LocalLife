import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AdminAiConfigController } from './admin-ai-config.controller';
import { ConversationsService } from './conversations.service';
import { OrchestratorService } from './orchestrator.service';
import { OpenRouterClient } from './openrouter.client';
import { RetrievalToolsService } from './retrieval.tools';
import { AuditService } from '../shared/audit.service';

@Module({
  controllers: [AiController, AdminAiConfigController],
  providers: [
    ConversationsService,
    OrchestratorService,
    OpenRouterClient,
    RetrievalToolsService,
    AuditService,
  ],
  exports: [RetrievalToolsService, OrchestratorService],
})
export class AiModule {}

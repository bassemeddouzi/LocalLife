import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AdminAiConfigController } from './admin-ai-config.controller';
import { ConversationsService } from './conversations.service';
import { OrchestratorService } from './orchestrator.service';
import { OpenRouterClient } from './openrouter.client';
import { RetrievalToolsService } from './retrieval.tools';
import { AuditService } from '../shared/audit.service';
import { ProfileMemoryService } from './profile-memory.service';
import { SessionContextService } from './session-context.service';
import { DigestService } from './digest.service';
import { TokenGovernorService } from './token-governor.service';
import { IssueDetectorService } from './issue-detector.service';
import { CompressionService } from './compression.service';
import { AiFeatureFlagsService } from './ai-feature-flags.service';

@Module({
  controllers: [AiController, AdminAiConfigController],
  providers: [
    ConversationsService,
    OrchestratorService,
    OpenRouterClient,
    RetrievalToolsService,
    ProfileMemoryService,
    SessionContextService,
    DigestService,
    TokenGovernorService,
    IssueDetectorService,
    CompressionService,
    AiFeatureFlagsService,
    AuditService,
  ],
  exports: [
    RetrievalToolsService,
    OrchestratorService,
    ProfileMemoryService,
    SessionContextService,
    DigestService,
    TokenGovernorService,
    IssueDetectorService,
    CompressionService,
    AiFeatureFlagsService,
  ],
})
export class AiModule {}

import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Auth, CurrentUser, AuthUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../shared/audit.service';

class UpdateAiConfigDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  modelId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fallbackModelId?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

@Controller('v1/admin/ai-config')
export class AdminAiConfigController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @Auth(UserRole.ADMIN)
  async get() {
    const row = await this.prisma.aiModelConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    return {
      provider: row?.provider ?? 'openrouter',
      modelId: row?.modelId ?? 'openai/gpt-4o-mini',
      fallbackModelId: row?.fallbackModelId ?? null,
      enabled: row?.enabled ?? true,
      updatedAt: row?.updatedAt ?? null,
      apiKeyConfigured: Boolean(
        this.config.get<string>('OPENROUTER_API_KEY')?.trim(),
      ),
      suggestedModels: [
        'openai/gpt-4o-mini',
        'anthropic/claude-3.5-sonnet',
        'google/gemini-flash-1.5',
        'meta-llama/llama-3.1-70b-instruct',
      ],
    };
  }

  @Patch()
  @Auth(UserRole.ADMIN)
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateAiConfigDto) {
    const existing = await this.prisma.aiModelConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const saved = existing
      ? await this.prisma.aiModelConfig.update({
          where: { id: existing.id },
          data: {
            modelId: dto.modelId ?? existing.modelId,
            fallbackModelId:
              dto.fallbackModelId === undefined
                ? existing.fallbackModelId
                : dto.fallbackModelId,
            enabled: dto.enabled ?? existing.enabled,
            updatedByAdminId: user.id,
          },
        })
      : await this.prisma.aiModelConfig.create({
          data: {
            provider: 'openrouter',
            modelId: dto.modelId ?? 'openai/gpt-4o-mini',
            fallbackModelId: dto.fallbackModelId,
            enabled: dto.enabled ?? true,
            updatedByAdminId: user.id,
          },
        });

    await this.audit.log({
      actorUserId: user.id,
      action: 'ai_config.update',
      entityType: 'ai_model_config',
      entityId: saved.id,
      beforeJson: existing ?? undefined,
      afterJson: {
        modelId: saved.modelId,
        fallbackModelId: saved.fallbackModelId,
        enabled: saved.enabled,
      },
    });

    return {
      provider: saved.provider,
      modelId: saved.modelId,
      fallbackModelId: saved.fallbackModelId,
      enabled: saved.enabled,
      updatedAt: saved.updatedAt,
      apiKeyConfigured: Boolean(
        this.config.get<string>('OPENROUTER_API_KEY')?.trim(),
      ),
    };
  }
}

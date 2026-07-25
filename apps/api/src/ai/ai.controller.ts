import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Auth, CurrentUser, AuthUser } from '../auth/auth.decorators';
import { ConversationsService } from './conversations.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus, ReportTargetType } from '@prisma/client';

class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;
}

class PostMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}

class FeedbackDto {
  @IsUUID()
  messageId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}

@Controller('v1/ai')
export class AiController {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('conversations')
  @Auth()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateConversationDto) {
    return this.conversations.create(user, dto);
  }

  @Get('conversations')
  @Auth()
  list(@CurrentUser() user: AuthUser) {
    return this.conversations.list(user);
  }

  @Get('conversations/:id')
  @Auth()
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.conversations.get(user, id);
  }

  @Delete('conversations/:id')
  @Auth()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.conversations.softDelete(user, id);
  }

  @Post('conversations/:id/messages')
  @Auth()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  postMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PostMessageDto,
  ) {
    return this.conversations.postMessage(user, id, dto);
  }

  @Post('feedback')
  @Auth()
  async feedback(@CurrentUser() user: AuthUser, @Body() dto: FeedbackDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: dto.messageId },
      include: { conversation: true },
    });
    if (!message || message.conversation.userId !== user.id) {
      return this.prisma.report.create({
        data: {
          reporterUserId: user.id,
          targetType: ReportTargetType.MESSAGE,
          targetId: dto.messageId,
          reason: dto.reason,
          details: dto.details,
          status: ReportStatus.OPEN,
        },
      });
    }
    return this.prisma.report.create({
      data: {
        reporterUserId: user.id,
        targetType: ReportTargetType.MESSAGE,
        targetId: dto.messageId,
        reason: dto.reason,
        details: dto.details,
        status: ReportStatus.OPEN,
      },
    });
  }
}

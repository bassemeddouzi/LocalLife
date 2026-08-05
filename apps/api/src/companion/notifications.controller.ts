import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Auth, AuthUser, CurrentUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';

class MarkReadDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  cueId?: string;
}

@Controller('v1/me')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('notifications')
  @Auth()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Get('avatar-cues')
  @Auth()
  cues(@CurrentUser() user: AuthUser) {
    return this.prisma.avatarCue.findMany({
      where: { userId: user.id, readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  @Patch('notifications/:id/read')
  @Auth()
  async markNotificationRead(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId: user.id },
    });
    if (!row) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  @Post('avatar-cues/read')
  @Auth()
  async markCuesRead(
    @CurrentUser() user: AuthUser,
    @Body() dto: MarkReadDto,
  ) {
    if (dto.cueId) {
      await this.prisma.avatarCue.updateMany({
        where: { id: dto.cueId, userId: user.id },
        data: { readAt: new Date() },
      });
    } else {
      await this.prisma.avatarCue.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
    }
    return { ok: true };
  }
}

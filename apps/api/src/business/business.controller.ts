import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { ClaimStatus, UserRole, VerificationStatus } from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Auth, CurrentUser, AuthUser } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';

class UpsertBusinessDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;
}

class ClaimPlaceDto {
  @IsUUID()
  placeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  evidenceUrl?: string;
}

@Controller('v1/business')
export class BusinessController {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrFailProfile(userId: string) {
    const profile = await this.prisma.businessProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new ForbiddenException('Business profile required');
    return profile;
  }

  @Post('profile')
  @Auth()
  async upsertProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertBusinessDto,
  ) {
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admin cannot create business profile');
    }

    const profile = await this.prisma.businessProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName: dto.displayName,
        legalName: dto.legalName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        verificationStatus: VerificationStatus.PENDING,
      },
      update: {
        displayName: dto.displayName,
        legalName: dto.legalName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
      },
    });

    if (user.role === UserRole.CLIENT) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.BUSINESS },
      });
    }

    return profile;
  }

  @Get('me')
  @Auth()
  async me(@CurrentUser() user: AuthUser) {
    return this.prisma.businessProfile.findUnique({
      where: { userId: user.id },
      include: { claims: true },
    });
  }

  @Post('claims')
  @Auth()
  async claimPlace(@CurrentUser() user: AuthUser, @Body() dto: ClaimPlaceDto) {
    const profile = await this.getOrFailProfile(user.id);
    const place = await this.prisma.place.findFirst({
      where: {
        id: dto.placeId,
        verificationStatus: VerificationStatus.APPROVED,
        deletedAt: null,
      },
    });
    if (!place) throw new NotFoundException('Place not found');

    return this.prisma.businessPlaceClaim.upsert({
      where: {
        businessId_placeId: {
          businessId: profile.id,
          placeId: dto.placeId,
        },
      },
      create: {
        businessId: profile.id,
        placeId: dto.placeId,
        evidenceUrl: dto.evidenceUrl,
        status: ClaimStatus.PENDING,
      },
      update: {
        evidenceUrl: dto.evidenceUrl,
        status: ClaimStatus.PENDING,
        reviewedAt: null,
        reviewedByAdminId: null,
      },
    });
  }

  @Get('places')
  @Auth(UserRole.BUSINESS, UserRole.ADMIN)
  async myPlaces(@CurrentUser() user: AuthUser) {
    if (user.role === UserRole.ADMIN) {
      return [];
    }
    const profile = await this.getOrFailProfile(user.id);
    return this.prisma.place.findMany({
      where: { ownedByBusinessId: profile.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        summary: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

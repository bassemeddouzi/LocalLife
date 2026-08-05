import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { GoogleTokenVerifier } from './google-token.verifier';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly googleVerifier: GoogleTokenVerifier,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        displayName: dto.displayName,
        locale: dto.locale ?? 'en',
        role: UserRole.CLIENT,
        preference: {
          create: {},
        },
      },
    });

    return this.issueTokens(user.id, user.email, user.role, user.displayName);
  }

  async login(dto: LoginDto, meta?: { userAgent?: string; ip?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user?.passwordHash || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account suspended');
    }
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(
      user.id,
      user.email,
      user.role,
      user.displayName,
      meta,
    );
  }

  async googleSignIn(
    dto: GoogleAuthDto,
    meta?: { userAgent?: string; ip?: string },
  ) {
    const identity = await this.googleVerifier.verify(dto.idToken);

    const byGoogle = await this.prisma.user.findUnique({
      where: { googleId: identity.googleId },
    });
    if (byGoogle) {
      if (byGoogle.deletedAt || byGoogle.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Account suspended');
      }
      if (byGoogle.role !== UserRole.CLIENT) {
        throw new UnauthorizedException(
          'Google Sign-In is only available for traveler accounts',
        );
      }
      await this.prisma.user.update({
        where: { id: byGoogle.id },
        data: {
          lastLoginAt: new Date(),
          ...(identity.avatarUrl && !byGoogle.avatarUrl
            ? { avatarUrl: identity.avatarUrl }
            : {}),
          ...(dto.locale ? { locale: dto.locale } : {}),
          isEmailVerified: identity.emailVerified || byGoogle.isEmailVerified,
        },
      });
      return this.issueTokens(
        byGoogle.id,
        byGoogle.email,
        byGoogle.role,
        byGoogle.displayName,
        meta,
      );
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email: identity.email },
    });
    if (byEmail) {
      if (byEmail.deletedAt || byEmail.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Account suspended');
      }
      if (byEmail.role !== UserRole.CLIENT) {
        throw new UnauthorizedException(
          'Google Sign-In is only available for traveler accounts',
        );
      }
      if (byEmail.googleId && byEmail.googleId !== identity.googleId) {
        throw new ConflictException('Email is linked to another Google account');
      }
      const linked = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId: identity.googleId,
          lastLoginAt: new Date(),
          isEmailVerified: identity.emailVerified || byEmail.isEmailVerified,
          ...(identity.avatarUrl && !byEmail.avatarUrl
            ? { avatarUrl: identity.avatarUrl }
            : {}),
          ...(dto.locale ? { locale: dto.locale } : {}),
        },
      });
      return this.issueTokens(
        linked.id,
        linked.email,
        linked.role,
        linked.displayName,
        meta,
      );
    }

    const created = await this.prisma.user.create({
      data: {
        email: identity.email,
        googleId: identity.googleId,
        passwordHash: null,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        locale: dto.locale ?? 'en',
        role: UserRole.CLIENT,
        isEmailVerified: identity.emailVerified,
        lastLoginAt: new Date(),
        preference: { create: {} },
      },
    });

    return this.issueTokens(
      created.id,
      created.email,
      created.role,
      created.displayName,
      meta,
    );
  }

  async refresh(
    refreshToken: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { user: true },
    });
    if (
      !stored ||
      stored.expiresAt < new Date() ||
      stored.user.deletedAt ||
      stored.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
      stored.user.displayName,
      meta,
    );
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { preference: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      locale: user.locale,
      personaType: user.personaType,
      onboardingCompletedAt: user.onboardingCompletedAt,
      preference: user.preference,
    };
  }

  async updatePreferences(
    userId: string,
    dto: {
      personaType?: import('@prisma/client').PersonaType;
      budgetBand?: import('@prisma/client').BudgetBand;
      locale?: string;
      homeCityId?: string;
      conservatismLevel?: import('@prisma/client').ConservatismLevel;
      walksOk?: boolean;
      hasVehicle?: boolean;
      vibe?: import('@prisma/client').ClientVibe;
      settingPref?: import('@prisma/client').PlaceSettingPref;
      groupSize?: import('@prisma/client').GroupSizePref;
      hardFiltersJson?: Record<string, unknown>;
      onboardingCompleted?: boolean;
      consentAnalytics?: boolean;
      consentPersonalization?: boolean;
      consentPush?: boolean;
      consentMarketing?: boolean;
    },
  ) {
    if (dto.personaType || dto.locale || dto.onboardingCompleted) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.personaType ? { personaType: dto.personaType } : {}),
          ...(dto.locale ? { locale: dto.locale } : {}),
          ...(dto.onboardingCompleted
            ? { onboardingCompletedAt: new Date() }
            : {}),
        },
      });
    }

    await this.prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        budgetBand: dto.budgetBand ?? 'MEDIUM',
        homeCityId: dto.homeCityId,
        conservatismLevel: dto.conservatismLevel ?? 'MODERATE',
        walksOk: dto.walksOk ?? true,
        hasVehicle: dto.hasVehicle ?? false,
        vibe: dto.vibe,
        settingPref: dto.settingPref,
        groupSize: dto.groupSize ?? 'SOLO',
        hardFiltersJson: (dto.hardFiltersJson as object | undefined) ?? undefined,
        consentAnalytics: dto.consentAnalytics ?? false,
        consentPersonalization: dto.consentPersonalization ?? false,
        consentPush: dto.consentPush ?? false,
        consentMarketing: dto.consentMarketing ?? false,
        consentUpdatedAt: new Date(),
      },
      update: {
        ...(dto.budgetBand ? { budgetBand: dto.budgetBand } : {}),
        ...(dto.homeCityId !== undefined ? { homeCityId: dto.homeCityId } : {}),
        ...(dto.conservatismLevel
          ? { conservatismLevel: dto.conservatismLevel }
          : {}),
        ...(dto.walksOk !== undefined ? { walksOk: dto.walksOk } : {}),
        ...(dto.hasVehicle !== undefined ? { hasVehicle: dto.hasVehicle } : {}),
        ...(dto.vibe !== undefined ? { vibe: dto.vibe } : {}),
        ...(dto.settingPref !== undefined
          ? { settingPref: dto.settingPref }
          : {}),
        ...(dto.groupSize ? { groupSize: dto.groupSize } : {}),
        ...(dto.hardFiltersJson !== undefined
          ? { hardFiltersJson: dto.hardFiltersJson as object }
          : {}),
        ...(dto.consentAnalytics !== undefined
          ? { consentAnalytics: dto.consentAnalytics }
          : {}),
        ...(dto.consentPersonalization !== undefined
          ? { consentPersonalization: dto.consentPersonalization }
          : {}),
        ...(dto.consentPush !== undefined
          ? { consentPush: dto.consentPush }
          : {}),
        ...(dto.consentMarketing !== undefined
          ? { consentMarketing: dto.consentMarketing }
          : {}),
        consentUpdatedAt: new Date(),
      },
    });

    return this.me(userId);
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
    displayName: string,
    meta?: { userAgent?: string; ip?: string },
  ) {
    const accessToken = await this.jwt.signAsync({ sub: userId, email, role }, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    } as Parameters<JwtService['signAsync']>[1]);

    const refreshToken = randomBytes(48).toString('hex');
    const days = 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        userAgent: meta?.userAgent,
        ip: meta?.ip,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, role, displayName },
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}

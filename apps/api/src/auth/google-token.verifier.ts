import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export type GoogleIdentity = {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
};

@Injectable()
export class GoogleTokenVerifier {
  private readonly client = new OAuth2Client();

  constructor(private readonly config: ConfigService) {}

  async verify(idToken: string): Promise<GoogleIdentity> {
    if (idToken.startsWith('mock:') && this.allowMock()) {
      return this.verifyMock(idToken);
    }

    const audiences = this.audiences();
    if (!audiences.length) {
      throw new UnauthorizedException('Google Sign-In is not configured');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: audiences.length === 1 ? audiences[0] : audiences,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email) {
        throw new UnauthorizedException('Invalid Google token');
      }
      return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        displayName:
          payload.name?.trim() ||
          payload.email.split('@')[0] ||
          'Traveler',
        avatarUrl: payload.picture,
        emailVerified: payload.email_verified === true,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private audiences(): string[] {
    return [
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_IOS_CLIENT_ID'),
      this.config.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
    ].filter((v): v is string => Boolean(v && v.trim()));
  }

  private allowMock(): boolean {
    return (
      process.env.NODE_ENV === 'test' ||
      this.config.get<string>('GOOGLE_AUTH_MOCK') === '1'
    );
  }

  private verifyMock(idToken: string): GoogleIdentity {
    try {
      const raw = Buffer.from(idToken.slice('mock:'.length), 'base64url').toString(
        'utf8',
      );
      const payload = JSON.parse(raw) as {
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
        email_verified?: boolean;
      };
      if (!payload.sub || !payload.email) {
        throw new Error('missing fields');
      }
      return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        displayName: payload.name?.trim() || payload.email.split('@')[0],
        avatarUrl: payload.picture,
        emailVerified: payload.email_verified !== false,
      };
    } catch {
      throw new UnauthorizedException('Invalid Google mock token');
    }
  }
}

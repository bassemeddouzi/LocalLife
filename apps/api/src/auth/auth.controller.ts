import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Headers,
  Ip,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto, GoogleAuthDto } from './dto/auth.dto';
import { UpdatePreferencesDto } from './dto/preferences.dto';
import { Auth, CurrentUser, AuthUser } from './auth.decorators';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.auth.login(dto, { userAgent, ip });
  }

  @Post('google')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  google(
    @Body() dto: GoogleAuthDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.auth.googleSignIn(dto, { userAgent, ip });
  }

  @Post('refresh')
  refresh(
    @Body() dto: RefreshDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.auth.refresh(dto.refreshToken, { userAgent, ip });
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Get('me')
  @Auth()
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Patch('me/preferences')
  @Auth()
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.auth.updatePreferences(user.id, dto);
  }
}

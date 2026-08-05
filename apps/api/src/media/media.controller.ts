import {
  BadRequestException,
  Body,
  Controller,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { Auth, CurrentUser, AuthUser } from '../auth/auth.decorators';

class PresignDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  folder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  filename?: string;
}

@Controller('v1/media')
export class MediaController {
  constructor(private readonly config: ConfigService) {}

  private r2Configured() {
    return Boolean(
      this.config.get<string>('R2_ENDPOINT')?.trim() &&
        this.config.get<string>('R2_ACCESS_KEY_ID')?.trim() &&
        this.config.get<string>('R2_SECRET_ACCESS_KEY')?.trim() &&
        this.config.get<string>('R2_BUCKET')?.trim(),
    );
  }

  @Post('presign')
  @Auth()
  async presign(@CurrentUser() user: AuthUser, @Body() dto: PresignDto) {
    if (!this.r2Configured()) {
      throw new ServiceUnavailableException(
        'R2 media upload is not configured. Paste a public image URL instead.',
      );
    }

    const contentType = (dto.contentType ?? 'image/jpeg').trim();
    if (!contentType.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are supported');
    }

    const ext =
      contentType === 'image/png'
        ? 'png'
        : contentType === 'image/webp'
          ? 'webp'
          : 'jpg';
    const folder = (dto.folder ?? 'uploads').replace(/[^a-z0-9/_-]/gi, '');
    const key = `${folder}/${user.id}/${randomUUID()}.${ext}`;
    const bucket = this.config.getOrThrow<string>('R2_BUCKET');
    const endpoint = this.config.getOrThrow<string>('R2_ENDPOINT');

    const client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: true,
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });

    const publicBase =
      this.config.get<string>('R2_PUBLIC_BASE_URL')?.replace(/\/$/, '') ??
      `${endpoint.replace(/\/$/, '')}/${bucket}`;
    const publicUrl = `${publicBase}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
      contentType,
      expiresInSeconds: 600,
    };
  }
}

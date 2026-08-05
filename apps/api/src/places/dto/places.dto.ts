import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AccessDifficulty,
  AudienceTag,
  BudgetBand,
  EffortLevel,
  PriceLevel,
  VerificationStatus,
} from '@prisma/client';

export class ListPlacesQueryDto {
  @IsUUID()
  cityId!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  radiusMeters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

export class CreatePlaceDto {
  @IsUUID()
  cityId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  summary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsEnum(PriceLevel)
  priceLevel?: PriceLevel;

  @IsOptional()
  @IsUUID()
  primaryCategoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categoryKey?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, string | number | boolean>;

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  guideComment?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(24 * 60)
  typicalDurationMin?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(AudienceTag, { each: true })
  audienceTags?: AudienceTag[];

  @IsOptional()
  @IsEnum(EffortLevel)
  effortLevel?: EffortLevel;

  @IsOptional()
  @IsEnum(BudgetBand)
  budgetBand?: BudgetBand;

  @IsOptional()
  @IsEnum(AccessDifficulty)
  accessDifficulty?: AccessDifficulty;

  @IsOptional()
  @IsBoolean()
  paidEntry?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prerequisitesText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  precautionsText?: string;

  @IsOptional()
  @IsObject()
  checklistJson?: Record<string, unknown> | unknown[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bestArriveText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bestLeaveText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seasonNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ticketUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ticketHowTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ticketPriceText?: string;
}

export class UpdatePlaceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  addressText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsEnum(PriceLevel)
  priceLevel?: PriceLevel;

  @IsOptional()
  @IsUUID()
  primaryCategoryId?: string;

  @IsOptional()
  @IsBoolean()
  isSponsored?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  guideComment?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(24 * 60)
  typicalDurationMin?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(AudienceTag, { each: true })
  audienceTags?: AudienceTag[];

  @IsOptional()
  @IsEnum(EffortLevel)
  effortLevel?: EffortLevel;

  @IsOptional()
  @IsEnum(BudgetBand)
  budgetBand?: BudgetBand;

  @IsOptional()
  @IsEnum(AccessDifficulty)
  accessDifficulty?: AccessDifficulty;

  @IsOptional()
  @IsBoolean()
  paidEntry?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prerequisitesText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  precautionsText?: string;

  @IsOptional()
  @IsObject()
  checklistJson?: Record<string, unknown> | unknown[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bestArriveText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bestLeaveText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seasonNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ticketUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ticketHowTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  ticketPriceText?: string;
}

export class PlaceHourDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  opensAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  closesAt?: string;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class ReplacePlaceHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaceHourDto)
  hours!: PlaceHourDto[];
}

export class AddPhotoDto {
  @IsString()
  @MaxLength(1000)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}

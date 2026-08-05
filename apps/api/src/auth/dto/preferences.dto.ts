import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  BudgetBand,
  ClientVibe,
  ConservatismLevel,
  GroupSizePref,
  PersonaType,
  PlaceSettingPref,
} from '@prisma/client';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(PersonaType)
  personaType?: PersonaType;

  @IsOptional()
  @IsEnum(BudgetBand)
  budgetBand?: BudgetBand;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;

  @IsOptional()
  @IsUUID()
  homeCityId?: string;

  @IsOptional()
  @IsEnum(ConservatismLevel)
  conservatismLevel?: ConservatismLevel;

  @IsOptional()
  @IsBoolean()
  walksOk?: boolean;

  @IsOptional()
  @IsBoolean()
  hasVehicle?: boolean;

  @IsOptional()
  @IsEnum(ClientVibe)
  vibe?: ClientVibe;

  @IsOptional()
  @IsEnum(PlaceSettingPref)
  settingPref?: PlaceSettingPref;

  @IsOptional()
  @IsEnum(GroupSizePref)
  groupSize?: GroupSizePref;

  @IsOptional()
  @IsObject()
  hardFiltersJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  consentAnalytics?: boolean;

  @IsOptional()
  @IsBoolean()
  consentPersonalization?: boolean;

  @IsOptional()
  @IsBoolean()
  consentPush?: boolean;

  @IsOptional()
  @IsBoolean()
  consentMarketing?: boolean;
}

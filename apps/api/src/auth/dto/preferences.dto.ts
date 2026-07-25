import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BudgetBand, PersonaType } from '@prisma/client';

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

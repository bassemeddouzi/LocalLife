export const TIP_CATEGORY_KEYS = [
  'transport',
  'safety',
  'money',
  'sunset',
  'repair',
  'camping',
  'local_tip',
] as const;

export type TipCategoryKey = (typeof TIP_CATEGORY_KEYS)[number];

export const LANGUAGE_OPTIONS = [
  'ar',
  'fr',
  'en',
  'de',
  'it',
  'es',
] as const;

export const PRICE_LEVELS = ['FREE', 'BUDGET', 'MID', 'PREMIUM'] as const;

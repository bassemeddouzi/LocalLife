import { StyleSheet } from 'react-native';
import { colors, fonts, radii } from '../../../theme';

export const guideStyles = StyleSheet.create({
  page: {
    padding: 20,
    gap: 12,
    backgroundColor: colors.bg,
    flexGrow: 1,
  },
  h1: {
    fontFamily: fonts.displayMedium,
    fontSize: 26,
    color: colors.ink,
  },
  h2: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 4,
  },
  muted: {
    fontFamily: fonts.body,
    color: colors.muted,
    lineHeight: 20,
  },
  body: {
    fontFamily: fonts.body,
    color: colors.ink,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: 14,
    color: colors.ink,
    fontFamily: fonts.body,
  },
  btn: {
    backgroundColor: colors.brand,
    padding: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontFamily: fonts.bodyBold,
  },
  btnGhost: {
    padding: 12,
    alignItems: 'center',
  },
  btnGhostText: {
    color: colors.brand,
    fontFamily: fonts.bodyMedium,
  },
  btnSecondary: {
    backgroundColor: colors.brandSoft,
    padding: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.brandDark,
    fontFamily: fonts.bodyBold,
  },
  card: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    fontSize: 13,
  },
  chipTextOn: {
    color: colors.brandDark,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    color: colors.muted,
    fontSize: 13,
  },
  error: {
    fontFamily: fonts.body,
    color: colors.danger,
  },
  hubItem: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  hubTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.ink,
  },
  hubSub: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 4,
  },
  statNum: {
    fontFamily: fonts.displayMedium,
    fontSize: 22,
    color: colors.ink,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
});

export function statusColors(status: string): { bg: string; fg: string } {
  const s = status.toUpperCase();
  if (s === 'APPROVED' || s === 'PUBLISHED') {
    return { bg: '#d1fae5', fg: '#065f46' };
  }
  if (s === 'REJECTED' || s === 'SUSPENDED' || s === 'WITHDRAWN') {
    return { bg: '#fee2e2', fg: '#991b1b' };
  }
  return { bg: '#fef3c7', fg: '#92400e' };
}

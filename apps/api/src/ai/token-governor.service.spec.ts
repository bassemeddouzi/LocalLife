import { TokenGovernorService } from './token-governor.service';

describe('TokenGovernorService', () => {
  const prisma = {
    aiTokenUsage: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalTokens: 0 } }),
      create: jest.fn(),
    },
  } as never;

  const service = new TokenGovernorService(prisma);

  it('approximates tokens from text length', () => {
    expect(service.approximateTokens('abcd')).toBe(1);
    expect(service.approximateTokens('a'.repeat(40))).toBe(10);
  });

  it('trims text to token budget', () => {
    const long = 'x'.repeat(100);
    const trimmed = service.trimToBudget(long, 5);
    expect(trimmed.length).toBeLessThanOrEqual(20 + 30);
    expect(trimmed).toContain('trimmed');
  });

  it('exposes configured bounds', () => {
    const bounds = service.getBounds();
    expect(bounds.maxInputTokens).toBeGreaterThan(0);
    expect(bounds.maxOutputTokens).toBeGreaterThan(0);
  });
});

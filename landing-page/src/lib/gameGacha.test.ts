import { describe, expect, it } from 'vitest';
import { BANNERS, pullMultiple } from '@/constants/gachaData';
import { parseGachaRequest, secureRng } from './gameGacha';

const OPERATION_ID = 'gacha_123e4567-e89b-42d3-a456-426614174000';

describe('parseGachaRequest', () => {
  it('accepts a known banner, 1 or 10 pulls and a UUID operation id', () => {
    for (const amount of [1, 10]) {
      const parsed = parseGachaRequest({ bannerId: 'persona', amount, operationId: OPERATION_ID });
      expect(parsed.banner.id).toBe('persona');
      expect(parsed.amount).toBe(amount);
    }
  });

  it('rejects unknown banners, amounts and malformed ids', () => {
    expect(() => parseGachaRequest({ bannerId: 'nope', amount: 1, operationId: OPERATION_ID })).toThrow();
    expect(() => parseGachaRequest({ bannerId: 'persona', amount: 5, operationId: OPERATION_ID })).toThrow();
    expect(() => parseGachaRequest({ bannerId: 'persona', amount: '10', operationId: OPERATION_ID })).toThrow();
    expect(() => parseGachaRequest({ bannerId: 'persona', amount: 1, operationId: 'gacha_x' })).toThrow();
  });

  it('ignores any reward sent by the client', () => {
    const parsed = parseGachaRequest({
      bannerId: 'persona',
      amount: 1,
      operationId: OPERATION_ID,
      rewards: [{ name: 'Messiah', rarity: 'mythic' }],
    });
    expect(Object.keys(parsed).sort()).toEqual(['amount', 'banner', 'operationId']);
  });
});

describe('server rolls', () => {
  it('secureRng stays in [0, 1)', () => {
    for (let i = 0; i < 2000; i++) {
      const value = secureRng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('pullMultiple uses the injected rng and only returns banner rewards', () => {
    for (const banner of BANNERS) {
      const low = pullMultiple(banner.rewards, 10, () => 0);
      expect(low.every((reward) => reward === banner.rewards[0])).toBe(true);
      const high = pullMultiple(banner.rewards, 10, () => 0.999999);
      expect(high.every((reward) => reward === banner.rewards[banner.rewards.length - 1])).toBe(true);
      const random = pullMultiple(banner.rewards, 10, secureRng);
      expect(random.every((reward) => banner.rewards.includes(reward))).toBe(true);
    }
  });
});

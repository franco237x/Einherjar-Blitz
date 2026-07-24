import { describe, expect, it } from 'vitest';
import { normalizeUsername } from '@/services/userDirectory';

describe('normalizeUsername', () => {
  it('ignores casing and surrounding spaces', () => {
    expect(normalizeUsername('  ReyEscarlata  ')).toBe('reyescarlata');
  });

  it('removes accents for directory search', () => {
    expect(normalizeUsername('Álvar Ödin')).toBe('alvar odin');
  });
});

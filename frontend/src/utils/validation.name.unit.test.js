import { describe, it, expect } from 'vitest';
import { validators } from './validation';

describe('validators.name', () => {
  it('rejette un nom trop court', () => {
    expect(validators.name('A').valid).toBe(false);
  });
  it('rejette un nom trop long', () => {
    expect(validators.name('A'.repeat(51)).valid).toBe(false);
  });
  it('rejette un nom avec caractères invalides', () => {
    expect(validators.name('Jean@123').valid).toBe(false);
  });
  it('accepte un nom valide', () => {
    expect(validators.name('Jean Dupont').valid).toBe(true);
    expect(validators.name('Élise O\'Connor').valid).toBe(true);
  });
});

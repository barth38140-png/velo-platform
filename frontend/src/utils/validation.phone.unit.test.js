import { describe, it, expect } from 'vitest';
import { validators } from './validation';

describe('validators.phone', () => {
  it('accepte un numéro français valide', () => {
    expect(validators.phone('0612345678').valid).toBe(true);
    expect(validators.phone('+33612345678').valid).toBe(true);
    expect(validators.phone('01 23 45 67 89').valid).toBe(true);
  });
  it('rejette un numéro trop court', () => {
    expect(validators.phone('06123').valid).toBe(false);
  });
  it('rejette un numéro avec caractères invalides', () => {
    expect(validators.phone('06-12-34-56-78').valid).toBe(false);
    expect(validators.phone('abcdefg').valid).toBe(false);
  });
  it('accepte un champ vide', () => {
    expect(validators.phone('').valid).toBe(true);
  });
});

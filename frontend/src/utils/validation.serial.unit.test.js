import { describe, it, expect } from 'vitest';
import { validators } from './validation';

describe('validators.serialNumber', () => {
  it('rejette un numéro trop court', () => {
    expect(validators.serialNumber('1234').valid).toBe(false);
  });
  it('rejette un numéro trop long', () => {
    expect(validators.serialNumber('A'.repeat(31)).valid).toBe(false);
  });
  it('rejette un numéro avec caractères non alphanumériques', () => {
    expect(validators.serialNumber('ABC-123').valid).toBe(false);
    expect(validators.serialNumber('ABC 123').valid).toBe(false);
  });
  it('accepte un numéro valide', () => {
    expect(validators.serialNumber('ABC12345').valid).toBe(true);
    expect(validators.serialNumber('12345').valid).toBe(true);
  });
  it('accepte un champ vide', () => {
    expect(validators.serialNumber('').valid).toBe(true);
  });
});

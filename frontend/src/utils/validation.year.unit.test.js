import { describe, it, expect } from 'vitest';
import { validators } from './validation';

describe('validators.year', () => {
  it('rejette une année non numérique', () => {
    expect(validators.year('abcd').valid).toBe(false);
  });
  it('rejette une année trop ancienne', () => {
    expect(validators.year('1899').valid).toBe(false);
  });
  it('rejette une année trop future', () => {
    expect(validators.year('3000').valid).toBe(false);
  });
  it('accepte une année valide', () => {
    expect(validators.year('2023').valid).toBe(true);
    expect(validators.year(String(new Date().getFullYear())).valid).toBe(true);
  });
  it('accepte un champ vide', () => {
    expect(validators.year('').valid).toBe(true);
  });
});

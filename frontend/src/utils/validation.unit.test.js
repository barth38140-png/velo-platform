import { describe, it, expect } from 'vitest';
import { validators } from './validation';

// Tests unitaires pour les utilitaires de validation

describe('validators.email', () => {
  it('valide un email correct', () => {
    expect(validators.email('test@example.com').valid).toBe(true);
  });
  it('rejette un email invalide', () => {
    expect(validators.email('test@').valid).toBe(false);
    expect(validators.email('test').valid).toBe(false);
    expect(validators.email('').valid).toBe(true); // champ vide accepté
  });
});

describe('validators.password', () => {
  it('rejette un mot de passe trop court', () => {
    expect(validators.password('Abc12').valid).toBe(false);
  });
  it('rejette un mot de passe sans majuscule', () => {
    expect(validators.password('abcdefg1').valid).toBe(false);
  });
  it('rejette un mot de passe sans chiffre', () => {
    expect(validators.password('Abcdefgh').valid).toBe(false);
  });
  it('accepte un mot de passe valide', () => {
    expect(validators.password('Abcdefg1').valid).toBe(true);
  });
});

describe('validators.year', () => {
  it('rejette une année trop ancienne', () => {
    expect(validators.year('1899').valid).toBe(false);
  });
  it('rejette une année trop future', () => {
    expect(validators.year('3000').valid).toBe(false);
  });
  it('accepte une année valide', () => {
    expect(validators.year('2023').valid).toBe(true);
  });
});

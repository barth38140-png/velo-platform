// Utilitaires de validation frontend
import React from 'react';

export const validators = {
  // Validation d'année (entre 1900 et année actuelle + 1)
  year: (value) => {
    if (!value) return { valid: true, error: null };
    const num = parseInt(value, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(num)) return { valid: false, error: 'Année invalide' };
    if (num < 1900) return { valid: false, error: 'Année trop ancienne' };
    if (num > currentYear + 1) return { valid: false, error: 'Année future' };
    return { valid: true, error: null };
  },

  // Validation d'email
  email: (value) => {
    if (!value) return { valid: true, error: null };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Email invalide' };
    }
    return { valid: true, error: null };
  },

  // Validation de numéro de série (alphanumeric, 5-30 caractères)
  serialNumber: (value) => {
    if (!value) return { valid: true, error: null };
    if (value.length < 5) {
      return { valid: false, error: 'Trop court (min 5 caractères)' };
    }
    if (value.length > 30) {
      return { valid: false, error: 'Trop long (max 30 caractères)' };
    }
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      return { valid: false, error: 'Caractères alphanumériques seulement' };
    }
    return { valid: true, error: null };
  },

  // Validation de mot de passe (min 8 caractères, 1 majuscule, 1 chiffre)
  password: (value) => {
    if (!value) return { valid: false, error: 'Mot de passe requis' };
    if (value.length < 8) {
      return { valid: false, error: 'Minimum 8 caractères' };
    }
    if (!/[A-Z]/.test(value)) {
      return { valid: false, error: 'Au moins 1 majuscule' };
    }
    if (!/[0-9]/.test(value)) {
      return { valid: false, error: 'Au moins 1 chiffre' };
    }
    return { valid: true, error: null };
  },

  // Validation de nom (2-50 caractères, lettres et espaces)
  name: (value) => {
    if (!value) return { valid: false, error: 'Nom requis' };
    if (value.length < 2) {
      return { valid: false, error: 'Trop court (min 2 caractères)' };
    }
    if (value.length > 50) {
      return { valid: false, error: 'Trop long (max 50 caractères)' };
    }
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) {
      return { valid: false, error: 'Caractères invalides' };
    }
    return { valid: true, error: null };
  },

  // Validation de téléphone (format français)
  phone: (value) => {
    if (!value) return { valid: true, error: null };
    const cleaned = value.replace(/\s/g, '');
    if (!/^(?:(?:\+|00)33|0)[1-9](?:\d{8})$/.test(cleaned)) {
      return { valid: false, error: 'Numéro invalide (format français)' };
    }
    return { valid: true, error: null };
  }
};

// Hook React pour validation en temps réel
export function useValidation(initialValue, validator) {
  const [value, setValue] = React.useState(initialValue || '');
  const [error, setError] = React.useState(null);
  const [touched, setTouched] = React.useState(false);

  const handleChange = (newValue) => {
    setValue(newValue);
    if (touched && validator) {
      const result = validator(newValue);
      setError(result.valid ? null : result.error);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (validator) {
      const result = validator(value);
      setError(result.valid ? null : result.error);
    }
  };

  const reset = () => {
    setValue(initialValue || '');
    setError(null);
    setTouched(false);
  };

  return {
    value,
    error,
    touched,
    isValid: !error,
    handleChange,
    handleBlur,
    reset
  };
}

// Middleware de formatage uniforme des erreurs API
const logger = require('../src/logger');

// Codes d'erreur standardisés
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR'
};

// Classe d'erreur personnalisée
class ApiError extends Error {
  constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

// Fonction helper pour créer des erreurs standardisées
const createError = {
  validation: (message, details = null) => 
    new ApiError(message, 400, ERROR_CODES.VALIDATION_ERROR, details),
  
  notFound: (resource = 'Ressource') => 
    new ApiError(`${resource} introuvable`, 404, ERROR_CODES.NOT_FOUND),
  
  unauthorized: (message = 'Non autorisé') => 
    new ApiError(message, 401, ERROR_CODES.UNAUTHORIZED),
  
  forbidden: (message = 'Accès refusé') => 
    new ApiError(message, 403, ERROR_CODES.FORBIDDEN),
  
  conflict: (message, details = null) => 
    new ApiError(message, 409, ERROR_CODES.CONFLICT, details),
  
  internal: (message = 'Erreur serveur interne') => 
    new ApiError(message, 500, ERROR_CODES.INTERNAL_ERROR),
  
  database: (message = 'Erreur base de données', details = null) => 
    new ApiError(message, 500, ERROR_CODES.DATABASE_ERROR, details)
};

// Middleware de gestion centralisée des erreurs
function errorHandler(err, req, res) {
  // Log l'erreur avec contexte
  logger.error({
    err,
    reqId: req.id,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    code: err.code,
    statusCode: err.statusCode,
    resType: typeof res,
    resProto: Object.getPrototypeOf(res),
    resKeys: Object.keys(res || {})
  }, 'Request error [DEBUG res]');

  // Vérification de l'objet res
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    // Fallback log et réponse simple
    logger.error('Le paramètre res n\'est pas un objet Express valide');
    return typeof res.send === 'function'
      ? res.send('Erreur serveur (res mal formé)')
      : undefined;
  }

  // Erreurs PostgreSQL
  if (err.code && err.code.startsWith('23')) {
    if (err.code === '23505') {
      // Violation de contrainte unique
      const field = err.detail?.match(/Key \(([^)]+)\)/)?.[1] || 'unknown';
      return res.status(409).json({
        error: 'Cette valeur existe déjà',
        code: ERROR_CODES.CONFLICT,
        field,
        reqId: req.id
      });
    }
    if (err.code === '23503') {
      // Violation de clé étrangère
      return res.status(400).json({
        error: 'Référence invalide',
        code: ERROR_CODES.VALIDATION_ERROR,
        reqId: req.id
      });
    }
  }

  // Erreurs API standardisées
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
      reqId: req.id,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }

  // Erreurs JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide',
      code: ERROR_CODES.AUTHENTICATION_ERROR,
      reqId: req.id
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expiré',
      code: ERROR_CODES.AUTHENTICATION_ERROR,
      reqId: req.id
    });
  }

  // Erreur générique
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erreur serveur interne' 
    : err.message || 'Erreur inconnue';

  res.status(statusCode).json({
    error: message,
    code: err.code || ERROR_CODES.INTERNAL_ERROR,
    reqId: req.id,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

// Middleware pour wrapper les handlers async et capturer les erreurs
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  ERROR_CODES,
  createError,
  errorHandler,
  asyncHandler
};

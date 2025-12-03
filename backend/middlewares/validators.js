const { body, param, query, validationResult } = require('express-validator');
const logger = require('../src/logger');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn({ errors: errors.array(), body: req.body, url: req.url }, 'Validation errors');
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validators
const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').optional().trim(),
  body('role').isIn(['client', 'repairer']).withMessage('Role must be client or repairer'),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Repair validators
const validateCreateRepair = [
  body('title').trim().notEmpty().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().notEmpty().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('bike_type').trim().notEmpty().withMessage('Bike type is required'),
  body('location_lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location_lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('location_address').trim().notEmpty().withMessage('Location address is required'),
  handleValidationErrors
];

const validateUpdateRepairStatus = [
  // route uses :requestId (legacy naming) so validate that param
  param('requestId').isInt({ min: 1 }).withMessage('Invalid repair ID'),
  body('status').isIn(['créée', 'en_attente', 'assignée', 'en_cours', 'terminée', 'annulée']).withMessage('Statut invalide'),
  handleValidationErrors
];

// Location validators
const validateUpdateLocation = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  handleValidationErrors
];

const validateNearbySearch = [
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  query('radius_km').optional().isInt({ min: 1, max: 100 }).withMessage('Radius must be 1-100 km'),
  handleValidationErrors
];

// Message validators
const validateSendMessage = [
  body('receiver_id').isInt({ min: 1 }).withMessage('Invalid receiver ID'),
  body('content').trim().notEmpty().isLength({ min: 1, max: 5000 }).withMessage('Message must be 1-5000 characters'),
  body('repair_request_id').optional().isInt({ min: 1 }).withMessage('Invalid repair request ID'),
  handleValidationErrors
];

// Repairer profile validators
const validateCreateProfile = [
  body('skills').trim().notEmpty().isLength({ min: 5 }).withMessage('Skills description required'),
  body('bio').trim().notEmpty().isLength({ min: 10 }).withMessage('Bio must be at least 10 characters'),
  body('service_radius_km').optional().isInt({ min: 1, max: 100 }).withMessage('Service radius 1-100 km'),
  body('is_available').optional().isBoolean().withMessage('Available must be boolean'),
  handleValidationErrors
];

// Brand validators
const validateAddBrand = [
  body('name').trim().notEmpty().isLength({ min: 1, max: 50 }).withMessage('Brand name required (1-50 chars)'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCreateRepair,
  validateUpdateRepairStatus,
  validateUpdateLocation,
  validateNearbySearch,
  validateSendMessage,
  validateCreateProfile,
  validateAddBrand
};

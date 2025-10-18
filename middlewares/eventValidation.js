// middlewares/eventValidation.js - Validation pour les événements
const { body, param, query, validationResult } = require('express-validator');

// ===== VALIDATION POUR AJOUTER UN AVIS =====
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note doit être un entier entre 1 et 5'),
  
  body('review')
    .optional()
    .isLength({ min: 0, max: 500 })
    .withMessage('Le commentaire ne peut pas dépasser 500 caractères')
    .trim(),

  // Middleware de vérification des erreurs
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    next();
  }
];

// ===== VALIDATION POUR RÉSERVER UN ÉVÉNEMENT =====
const validateBooking = [
  body('bookingType')
    .isIn(['solo', 'couple', 'group', 'fixed'])
    .withMessage('Type de réservation invalide (solo, couple, group, fixed)'),
  
  body('numberOfPersons')
    .isInt({ min: 1, max: 50 })
    .withMessage('Le nombre de personnes doit être entre 1 et 50'),
  
  body('paymentMethod')
    .isIn(['Orange Money', 'Free Money', 'Wave', 'Carte bancaire', 'Espèces'])
    .withMessage('Méthode de paiement invalide'),
  
  body('phoneNumber')
    .isMobilePhone('any')
    .withMessage('Numéro de téléphone invalide')
    .isLength({ min: 9, max: 15 })
    .withMessage('Le numéro de téléphone doit contenir entre 9 et 15 chiffres'),

  // Middleware de vérification des erreurs
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de réservation invalides',
        errors: errors.array()
      });
    }
    next();
  }
];

// ===== VALIDATION POUR CRÉER/MODIFIER UN ÉVÉNEMENT =====
const validateCreateOrUpdate = [
  body('title')
    .notEmpty()
    .withMessage('Le titre est obligatoire')
    .isLength({ min: 3, max: 200 })
    .withMessage('Le titre doit contenir entre 3 et 200 caractères')
    .trim(),
  
  body('description')
    .notEmpty()
    .withMessage('La description est obligatoire')
    .isLength({ min: 10, max: 1000 })
    .withMessage('La description doit contenir entre 10 et 1000 caractères')
    .trim(),
  
  body('location')
    .notEmpty()
    .withMessage('Le lieu est obligatoire')
    .isLength({ min: 3, max: 200 })
    .withMessage('Le lieu doit contenir entre 3 et 200 caractères')
    .trim(),
  
  body('region_Name')
    .notEmpty()
    .withMessage('La région est obligatoire')
    .isLength({ min: 3, max: 100 })
    .withMessage('La région doit contenir entre 3 et 100 caractères')
    .trim(),
  
  body('category')
    .isIn(['festival', 'excursion', 'nightlife', 'conference', 'culture', 'sport', 'atelier', 'plage', 'gastronomie', 'art', 'musique', 'danse', 'autre'])
    .withMessage('Catégorie invalide'),
  
  body('date')
    .notEmpty()
    .withMessage('La date est obligatoire')
    .isISO8601()
    .withMessage('Format de date invalide (utiliser ISO 8601)')
    .custom((value) => {
      const eventDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        throw new Error('La date de l\'événement ne peut pas être dans le passé');
      }
      return true;
    }),
  
  body('time')
    .notEmpty()
    .withMessage('L\'heure est obligatoire')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Format d\'heure invalide (utiliser HH:MM)'),
  
  body('organisateur')
    .notEmpty()
    .withMessage('L\'organisateur est obligatoire')
    .isLength({ min: 2, max: 200 })
    .withMessage('Le nom de l\'organisateur doit contenir entre 2 et 200 caractères')
    .trim(),

  // Validation conditionnelle des prix
  body('fixedPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix fixe doit être un nombre positif'),

  // Validation des coordonnées GPS (en tant que chaîne JSON)
  body('coordinates')
    .notEmpty()
    .withMessage('Les coordonnées GPS sont obligatoires')
    .custom((value) => {
      try {
        const coords = JSON.parse(value);
        if (typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
          throw new Error('Coordonnées GPS invalides');
        }
        if (coords.latitude < -90 || coords.latitude > 90) {
          throw new Error('Latitude invalide (doit être entre -90 et 90)');
        }
        if (coords.longitude < -180 || coords.longitude > 180) {
          throw new Error('Longitude invalide (doit être entre -180 et 180)');
        }
        return true;
      } catch (error) {
        throw new Error('Format des coordonnées GPS invalide (JSON attendu)');
      }
    }),

  // Validation des dates d'événement (en tant que chaîne JSON)
  body('eventDates')
    .notEmpty()
    .withMessage('Les dates d\'événement sont obligatoires')
    .custom((value) => {
      try {
        const dates = JSON.parse(value);
        if (!dates.startDate || !dates.endDate) {
          throw new Error('startDate et endDate sont obligatoires');
        }
        
        const startDate = new Date(dates.startDate);
        const endDate = new Date(dates.endDate);
        const now = new Date();
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Dates d\'événement invalides');
        }
        
        if (startDate < now) {
          throw new Error('La date de début ne peut pas être dans le passé');
        }
        
        if (endDate <= startDate) {
          throw new Error('La date de fin doit être après la date de début');
        }
        
        return true;
      } catch (error) {
        if (error.message.includes('JSON')) {
          throw new Error('Format des dates d\'événement invalide (JSON attendu)');
        }
        throw error;
      }
    }),

  // Validation optionnelle de la longue description
  body('longDescription')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('La description longue ne peut pas dépasser 5000 caractères')
    .trim(),

  // Validation optionnelle de la capacité (en tant que chaîne JSON)
  body('capacity')
    .optional()
    .custom((value) => {
      if (!value) return true;
      try {
        const capacity = JSON.parse(value);
        if (capacity.total && (!Number.isInteger(capacity.total) || capacity.total <= 0)) {
          throw new Error('La capacité totale doit être un entier positif');
        }
        return true;
      } catch (error) {
        if (error.message.includes('JSON')) {
          throw new Error('Format de capacité invalide (JSON attendu)');
        }
        throw error;
      }
    }),

  // Middleware de vérification des erreurs
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Erreurs de validation événement:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Données de l\'événement invalides',
        errors: errors.array()
      });
    }
    next();
  }
];

// ===== VALIDATION POUR PARAMÈTRES D'URL =====
const validateEventId = [
  param('eventId')
    .isMongoId()
    .withMessage('ID d\'événement invalide'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'événement invalide',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateBookingId = [
  param('bookingId')
    .isMongoId()
    .withMessage('ID de réservation invalide'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ID de réservation invalide',
        errors: errors.array()
      });
    }
    next();
  }
];

// ===== VALIDATION POUR RECHERCHE =====
const validateSearch = [
  query('query')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le terme de recherche doit contenir entre 2 et 100 caractères')
    .trim(),
  
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('La note minimale doit être entre 0 et 5'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix minimum doit être positif'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix maximum doit être positif'),
  
  query('category')
    .optional()
    .isIn(['festival', 'excursion', 'nightlife', 'conference', 'culture', 'sport', 'atelier', 'plage', 'gastronomie', 'art', 'musique', 'danse', 'autre'])
    .withMessage('Catégorie invalide'),

  query('sortBy')
    .optional()
    .isIn(['averageRating', 'price_asc', 'price_desc', 'date', 'title', 'newest', 'popular', 'reviews'])
    .withMessage('Critère de tri invalide'),

  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre upcoming doit être un booléen'),

  // Validation de la cohérence des prix
  (req, res, next) => {
    const { minPrice, maxPrice } = req.query;
    
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Le prix minimum ne peut pas être supérieur au prix maximum'
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres de recherche invalides',
        errors: errors.array()
      });
    }
    next();
  }
];

// ===== VALIDATION POUR PAGINATION =====
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Le numéro de page doit être entre 1 et 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres de pagination invalides',
        errors: errors.array()
      });
    }
    next();
  }
];

// ===== VALIDATION POUR REMBOURSEMENT (ADMIN) =====
const validateRefund = [
  body('refundAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le montant du remboursement doit être positif'),
  
  body('reason')
    .optional()
    .isLength({ min: 5, max: 500 })
    .withMessage('La raison du remboursement doit contenir entre 5 et 500 caractères')
    .trim(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données de remboursement invalides',
        errors: errors.array()
      });
    }
    next();
  }
];

// ===== VALIDATION POUR FILTRES ADMIN =====
const validateAdminFilters = [
  query('region_Name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de région doit contenir entre 2 et 100 caractères')
    .trim(),
  
  query('category')
    .optional()
    .isIn(['festival', 'excursion', 'nightlife', 'conference', 'culture', 'sport', 'atelier', 'plage', 'gastronomie', 'art', 'musique', 'danse', 'autre'])
    .withMessage('Catégorie invalide'),
  
  query('hasFullDetails')
    .optional()
    .isBoolean()
    .withMessage('hasFullDetails doit être un booléen'),
  
  query('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable doit être un booléen'),
  
  query('sortBy')
    .optional()
    .isIn(['updatedAt', 'createdAt', 'title', 'date', 'rating', 'views', 'bookings', 'price'])
    .withMessage('Critère de tri invalide'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Filtres admin invalides',
        errors: errors.array()
      });
    }
    next();
  }
];

// ===== VALIDATION POUR DATES DE RECHERCHE =====
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Format de date de début invalide (utiliser ISO 8601)'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Format de date de fin invalide (utiliser ISO 8601)')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('La date de fin doit être après la date de début');
        }
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Plage de dates invalide',
        errors: errors.array()
      });
    }
    next();
  }
];

// ===== VALIDATION COMBINÉE POUR REQUÊTES COMPLEXES =====
const validateComplexQuery = [
  ...validateSearch,
  ...validatePagination,
  ...validateDateRange
];

// ===== VALIDATION POUR NETTOYAGE D'URGENCE =====
const validateEmergencyCleanup = [
  body('confirm')
    .equals('YES_CLEANUP_CORRUPTED_EVENTS')
    .withMessage('Confirmation requise : YES_CLEANUP_CORRUPTED_EVENTS'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation de nettoyage requise',
        errors: errors.array()
      });
    }
    next();
  }
];

// ===== UTILITAIRE POUR VALIDER LES PRIX =====
const validatePriceStructure = (req, res, next) => {
  const { fixedPrice, price, priceRange } = req.body;
  
  try {
    const hasFixedPrice = fixedPrice && parseFloat(fixedPrice) > 0;
    let hasCategoryPrice = false;
    
    if (price && priceRange) {
      const priceObj = typeof price === 'string' ? JSON.parse(price) : price;
      const priceRangeObj = typeof priceRange === 'string' ? JSON.parse(priceRange) : priceRange;
      
      hasCategoryPrice = (priceObj.solo || priceObj.couple || priceObj.group) && 
                        (priceRangeObj.min && priceRangeObj.max);
    }
    
    if (!hasFixedPrice && !hasCategoryPrice) {
      return res.status(400).json({
        success: false,
        message: 'Structure de prix invalide : fournir soit fixedPrice, soit price + priceRange'
      });
    }
    
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des prix : ' + error.message
    });
  }
};

// ===== EXPORTS =====
module.exports = {
  validateReview,
  validateBooking,
  validateCreateOrUpdate,
  validateEventId,
  validateBookingId,
  validateSearch,
  validatePagination,
  validateRefund,
  validateAdminFilters,
  validateDateRange,
  validateComplexQuery,
  validateEmergencyCleanup,
  validatePriceStructure,
  
  // Validations combinées pour routes spécifiques
  validateEventDetails: [validateEventId],
  validateEventBooking: [validateEventId, ...validateBooking],
  validateEventReview: [validateEventId, ...validateReview],
  validateBookingManagement: [validateEventId, validateBookingId],
  validateAdminList: [...validateAdminFilters, ...validatePagination],
  validateSearchWithPagination: [...validateComplexQuery],
  validateRefundBooking: [validateEventId, validateBookingId, ...validateRefund]
};
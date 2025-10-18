const { body, param, query, validationResult } = require('express-validator');

class HotelValidation {
  
  // ===== VALIDATION POUR LES AVIS - CORRIGÉE =====
  static validateReview = [
    param('hotelId')
      .isMongoId()
      .withMessage('ID d\'hôtel invalide'),
    
    body('rating')
      .notEmpty()
      .withMessage('La note est obligatoire')
      .isInt({ min: 1, max: 5 })
      .withMessage('La note doit être entre 1 et 5'),
    
    body('review')
      .optional()
      .isLength({ min: 0, max: 500 })
      .withMessage('L\'avis ne peut pas dépasser 500 caractères')
      .trim()
      .custom((value) => {
        // Si un avis est fourni, vérifier qu'il contient au moins 10 caractères
        if (value && value.trim().length > 0 && value.trim().length < 10) {
          throw new Error('L\'avis doit contenir au moins 10 caractères significatifs');
        }
        
        // Vérifier qu'il n'y a pas que des caractères spéciaux
        if (value && value.trim().length > 0) {
          const meaningfulContent = value.trim().replace(/[^\w\sÀ-ÿ]/gi, '');
          if (meaningfulContent.length < 5) {
            throw new Error('L\'avis doit contenir du texte significatif');
          }
        }
        
        return true;
      }),

    // Middleware de gestion d'erreurs pour les avis
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Erreurs de validation avis:', errors.array());
        return res.status(400).json({
          success: false,
          message: "Données d'avis invalides",
          errors: errors.array().map(err => ({
            field: err.param || err.path,
            message: err.msg,
            value: err.value
          }))
        });
      }
      
      // Log de validation réussie
      console.log('✅ Validation avis réussie:', {
        hotelId: req.params.hotelId,
        rating: req.body.rating,
        reviewLength: req.body.review ? req.body.review.trim().length : 0
      });
      
      next();
    }
  ];

  // ===== VALIDATION POUR TOGGLE FAVORIS =====
  static validateFavorite = [
    param('hotelId')
      .isMongoId()
      .withMessage('ID d\'hôtel invalide'),

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "ID d'hôtel invalide pour les favoris",
          errors: errors.array()
        });
      }
      next();
    }
  ];
  

  // ===== VALIDATION POUR MARQUER AVIS UTILE =====
  static validateHelpful = [
    param('hotelId')
      .isMongoId()
      .withMessage('ID d\'hôtel invalide'),
    
    param('reviewId')
      .isMongoId()
      .withMessage('ID d\'avis invalide'),

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "IDs invalides",
          errors: errors.array()
        });
      }
      next();
    }
  ];

  // ===== VALIDATION POUR RECHERCHE - AMÉLIORÉE =====
  static validateSearch = [
    query('query')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Le terme de recherche doit contenir entre 2 et 100 caractères')
      .trim()
      .escape(),
    
    query('region_Name')
      .optional()
      .isLength({ min: 2, max: 150 })
      .withMessage('Le nom de région doit contenir entre 2 et 150 caractères')
      .trim()
      .escape(),
    
    query('minRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('La note minimum doit être entre 0 et 5')
      .toFloat(),
    
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Le prix minimum doit être positif')
      .toFloat(),
    
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Le prix maximum doit être positif')
      .toFloat(),
    
    query('hasRooms')
      .optional()
      .isBoolean()
      .withMessage('hasRooms doit être true ou false')
      .toBoolean(),
    
    query('sortBy')
      .optional()
      .isIn(['rating', 'price_asc', 'price_desc', 'name', 'newest', 'popular', 'relevance'])
      .withMessage('Critère de tri invalide'),

    // Validation de la cohérence des prix
    (req, res, next) => {
      const { minPrice, maxPrice } = req.query;
      if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
        return res.status(400).json({
          success: false,
          message: 'Le prix minimum ne peut pas être supérieur au prix maximum'
        });
      }
      next();
    },

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Paramètres de recherche invalides",
          errors: errors.array()
        });
      }
      next();
    }
  ];

  // ===== VALIDATION POUR RÉCUPÉRER HÔTELS PAR RÉGION - CORRIGÉE =====
  static validateByRegion = [
    param('regionName')
      .notEmpty()
      .withMessage('Le nom de région est obligatoire')
      .isLength({ min: 2, max: 150 })
      .withMessage('Le nom de région doit contenir entre 2 et 150 caractères')
      .trim()
      .escape(),
    
    query('minRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('La note minimum doit être entre 0 et 5')
      .toFloat(),
    
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Le prix minimum doit être positif')
      .toFloat(),
    
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Le prix maximum doit être positif')
      .toFloat(),
    
    query('hasRooms')
      .optional()
      .isBoolean()
      .withMessage('hasRooms doit être true ou false')
      .toBoolean(),
    
    query('sortBy')
      .optional()
      .isIn(['averageRating', 'price_asc', 'price_desc', 'title', 'location', 'newest', 'popular', 'reviews'])
      .withMessage('Critère de tri invalide'),

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Paramètres de région invalides",
          errors: errors.array()
        });
      }
      next();
    }
  ];

  // ===== VALIDATION POUR CRÉATION/MODIFICATION D'HÔTEL - CORRIGÉE =====
  static validateCreateOrUpdate = [
    // Titre obligatoire
    body('title')
      .notEmpty()
      .withMessage('Le titre est obligatoire')
      .isLength({ min: 3, max: 200 })
      .withMessage('Le titre doit contenir entre 3 et 200 caractères')
      .trim()
      .escape(),
    
    // Description obligatoire
    body('description')
      .notEmpty()
      .withMessage('La description est obligatoire')
      .isLength({ min: 50, max: 2000 })
      .withMessage('La description doit contenir entre 50 et 2000 caractères')
      .trim(),
    
    // Localisation obligatoire
    body('location')
      .notEmpty()
      .withMessage('La localisation est obligatoire')
      .isLength({ min: 5, max: 150 })
      .withMessage('La localisation doit contenir entre 5 et 150 caractères')
      .trim()
      .escape(),
    
    // Région obligatoire
    body('region_Name')
      .notEmpty()
      .withMessage('La région est obligatoire')
      .isLength({ min: 3, max: 150 })
      .withMessage('La région doit contenir entre 3 et 150 caractères')
      .trim()
      .escape(),
    
    // Contact optionnel
    body('contact')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Le contact ne peut pas dépasser 50 caractères')
      .trim(),
    
    // Validation des coordonnées améliorée
    body('coordinates')
      .custom((value) => {
        try {
          let coords;
          
          // Si c'est déjà un objet
          if (typeof value === 'object') {
            coords = value;
          } 
          // Si c'est une chaîne JSON
          else if (typeof value === 'string') {
            coords = JSON.parse(value);
          } 
          else {
            throw new Error('Format de coordonnées non reconnu');
          }
          
          if (!coords || typeof coords !== 'object') {
            throw new Error('Les coordonnées doivent être un objet');
          }
          
          if (typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
            throw new Error('Les coordonnées doivent contenir latitude et longitude en tant que nombres');
          }
          
          if (coords.latitude < -90 || coords.latitude > 90) {
            throw new Error('La latitude doit être entre -90 et 90');
          }
          
          if (coords.longitude < -180 || coords.longitude > 180) {
            throw new Error('La longitude doit être entre -180 et 180');
          }
          
          return true;
        } catch (error) {
          throw new Error('Format des coordonnées invalide: ' + error.message);
        }
      }),
    
    // Validation des prix améliorée
    body('price')
      .custom((value) => {
        try {
          let price;
          
          // Si c'est déjà un objet
          if (typeof value === 'object') {
            price = value;
          } 
          // Si c'est une chaîne JSON
          else if (typeof value === 'string') {
            price = JSON.parse(value);
          } 
          else {
            throw new Error('Format de prix non reconnu');
          }
          
          if (!price || typeof price !== 'object') {
            throw new Error('Les prix doivent être un objet');
          }
          
          if (typeof price.minPrice !== 'number' || typeof price.maxPrice !== 'number') {
            throw new Error('minPrice et maxPrice doivent être des nombres');
          }
          
          if (price.minPrice < 0 || price.maxPrice < 0) {
            throw new Error('Les prix doivent être positifs');
          }
          
          if (price.minPrice > price.maxPrice) {
            throw new Error('Le prix minimum ne peut pas être supérieur au prix maximum');
          }
          
          return true;
        } catch (error) {
          throw new Error('Format des prix invalide: ' + error.message);
        }
      }),
    
    // Validation de la disponibilité améliorée
    body('availability')
      .custom((value) => {
        try {
          let availability;
          
          // Si c'est déjà un objet
          if (typeof value === 'object') {
            availability = value;
          } 
          // Si c'est une chaîne JSON
          else if (typeof value === 'string') {
            availability = JSON.parse(value);
          } 
          else {
            throw new Error('Format de disponibilité non reconnu');
          }
          
          if (!availability || typeof availability !== 'object') {
            throw new Error('La disponibilité doit être un objet');
          }
          
          if (!availability.start || !availability.end) {
            throw new Error('Les dates de début et fin sont obligatoires');
          }
          
          const startDate = new Date(availability.start);
          const endDate = new Date(availability.end);
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Format de date invalide');
          }
          
          if (startDate >= endDate) {
            throw new Error('La date de fin doit être postérieure à la date de début');
          }
          
          return true;
        } catch (error) {
          throw new Error('Format de disponibilité invalide: ' + error.message);
        }
      }),
    
    // Validation des équipements améliorée
    body('facilities')
      .optional()
      .custom((value) => {
        if (!value || value === '') return true;
        
        try {
          let facilities;
          
          // Si c'est déjà un tableau
          if (Array.isArray(value)) {
            facilities = value;
          } 
          // Si c'est une chaîne JSON
          else if (typeof value === 'string') {
            facilities = JSON.parse(value);
          } 
          else {
            throw new Error('Format d\'équipements non reconnu');
          }
          
          if (!Array.isArray(facilities)) {
            throw new Error('Les équipements doivent être un tableau');
          }
          
          const allowedKeys = [
            'wifi', 'parking', 'restaurant', 'piscine', 'spa', 
            'salleDeSport', 'plagePrivee', 'serviceDeChambre', 'sallesDeReunion',
            'climatisation', 'television', 'miniBar', 'coffre', 'balcon'
          ];
          
          for (const facility of facilities) {
            if (typeof facility !== 'object' || facility === null) {
              throw new Error('Chaque équipement doit être un objet');
            }
            
            for (const key of Object.keys(facility)) {
              if (key !== '_id' && !allowedKeys.includes(key)) {
                throw new Error(`Équipement non autorisé: ${key}`);
              }
              if (key !== '_id' && typeof facility[key] !== 'boolean') {
                throw new Error(`La valeur de ${key} doit être un booléen`);
              }
            }
          }
          
          return true;
        } catch (error) {
          throw new Error('Format des équipements invalide: ' + error.message);
        }
      }),
    
    // Validation des services améliorée
    body('services')
      .optional()
      .custom((value) => {
        if (!value || value === '') return true;
        
        try {
          let services;
          
          // Si c'est déjà un tableau
          if (Array.isArray(value)) {
            services = value;
          } 
          // Si c'est une chaîne JSON
          else if (typeof value === 'string') {
            services = JSON.parse(value);
          } 
          else {
            throw new Error('Format de services non reconnu');
          }
          
          if (!Array.isArray(services)) {
            throw new Error('Les services doivent être un tableau');
          }
          
          for (const service of services) {
            if (!service || typeof service !== 'object') {
              throw new Error('Chaque service doit être un objet');
            }
            
            if (!service.icon || !service.label) {
              throw new Error('Chaque service doit avoir un icon et un label');
            }
            
            if (typeof service.icon !== 'string' || typeof service.label !== 'string') {
              throw new Error('L\'icon et le label doivent être des chaînes de caractères');
            }
            
            if (service.label.length > 50) {
              throw new Error('Le label d\'un service ne peut pas dépasser 50 caractères');
            }
            
            if (service.available !== undefined && typeof service.available !== 'boolean') {
              throw new Error('available doit être un booléen');
            }
          }
          
          return true;
        } catch (error) {
          throw new Error('Format des services invalide: ' + error.message);
        }
      }),
    
    // Validation de l'ID pour modification
    body('_id')
      .optional()
      .custom((value) => {
        if (value && value !== 'null' && value !== '' && value !== 'undefined') {
          if (!/^[0-9a-fA-F]{24}$/.test(value)) {
            throw new Error('ID d\'hôtel invalide');
          }
        }
        return true;
      }),

    // Middleware de gestion d'erreurs pour création/modification
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Erreurs validation création/modification:', errors.array());
        return res.status(400).json({
          success: false,
          message: "Données d'hôtel invalides",
          errors: errors.array().map(err => ({
            field: err.param || err.path,
            message: err.msg,
            value: err.value
          }))
        });
      }
      
      console.log('✅ Validation création/modification réussie');
      next();
    }
  ];


  

  // ===== VALIDATION POUR LISTE ADMIN - AMÉLIORÉE =====
  static validateAdminList = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Le numéro de page doit être un entier positif')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('La limite doit être entre 1 et 100')
      .toInt(),
    
    query('region_Name')
      .optional()
      .isLength({ min: 2, max: 150 })
      .withMessage('Le nom de région doit contenir entre 2 et 150 caractères')
      .trim()
      .escape(),
    
    query('hasFullDetails')
      .optional()
      .isBoolean()
      .withMessage('hasFullDetails doit être true ou false')
      .toBoolean(),
    
    query('sortBy')
      .optional()
      .isIn(['updatedAt', 'createdAt', 'title', 'rating', 'views', 'price'])
      .withMessage('Critère de tri invalide'),

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Paramètres de liste admin invalides",
          errors: errors.array()
        });
      }
      next();
    }
  ];


  // Validation pour la récupération des favoris utilisateur
static validateGetUserFavorites = [
  query('sortBy')
    .optional()
    .isIn(['dateAdded', 'averageRating', 'price_asc', 'price_desc', 'title', 'popular'])
    .withMessage('Critère de tri invalide pour les favoris'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('La note minimum doit être entre 0 et 5')
    .toFloat(),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix minimum doit être positif')
    .toFloat(),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le prix maximum doit être positif')
    .toFloat(),
  
  query('region_Name')
    .optional()
    .isLength({ min: 2, max: 150 })
    .withMessage('Le nom de région doit contenir entre 2 et 150 caractères')
    .trim()
    .escape(),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('La limite doit être entre 1 et 50')
    .toInt(),

  // Validation de cohérence des prix
  (req, res, next) => {
    const { minPrice, maxPrice } = req.query;
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Le prix minimum ne peut pas être supérieur au prix maximum'
      });
    }
    next();
  },

  // Middleware de gestion d'erreurs
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Paramètres de favoris invalides",
        errors: errors.array().map(err => ({
          field: err.param || err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  }
];


  // ===== VALIDATION POUR SUPPRESSION/RESTAURATION - CORRIGÉE =====
  static validateHotelId = [
    param('hotelId')
      .isMongoId()
      .withMessage('ID d\'hôtel invalide'),

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "ID d'hôtel invalide",
          errors: errors.array()
        });
      }
      next();
    }
  ];

  // ===== VALIDATION POUR TOUS LES HÔTELS - AMÉLIORÉE =====
  static validateGetAll = [
    query('sortBy')
      .optional()
      .isIn(['averageRating', 'price_asc', 'price_desc', 'title', 'location', 'newest', 'popular', 'reviews'])
      .withMessage('Critère de tri invalide'),
    
    query('minRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('La note minimum doit être entre 0 et 5')
      .toFloat(),
    
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Le prix minimum doit être positif')
      .toFloat(),
    
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Le prix maximum doit être positif')
      .toFloat(),
    
    query('hasRooms')
      .optional()
      .isBoolean()
      .withMessage('hasRooms doit être true ou false')
      .toBoolean(),
    
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive doit être true ou false')
      .toBoolean(),

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Paramètres de récupération invalides",
          errors: errors.array()
        });
      }
      next();
    }
  ];

  // ===== VALIDATION POUR RÉCUPÉRER HÔTEL PAR ID - CORRIGÉE =====
  static validateGetById = [
    param('hotelId')
      .isMongoId()
      .withMessage('ID d\'hôtel invalide'),

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "ID d'hôtel invalide pour récupération",
          errors: errors.array()
        });
      }
      next();
    }
  ];

  // ===== VALIDATION PERSONNALISÉE POUR LA COHÉRENCE DES PRIX =====
  static validatePriceConsistency = (req, res, next) => {
    const { minPrice, maxPrice } = req.query;
    
    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      
      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({
          success: false,
          message: 'Les prix doivent être des nombres valides'
        });
      }
      
      if (min > max) {
        return res.status(400).json({
          success: false,
          message: 'Le prix minimum ne peut pas être supérieur au prix maximum'
        });
      }
    }
    
    next();
  };

  // ===== VALIDATION PERSONNALISÉE POUR LES DATES =====
  static validateDateRange = (req, res, next) => {
    const { checkIn, checkOut } = req.query;
    
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format de date invalide (utilisez ISO 8601)'
        });
      }
      
      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          success: false,
          message: 'La date de départ doit être postérieure à la date d\'arrivée'
        });
      }
      
      // Permettre les dates du jour même
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (checkInDate < today) {
        return res.status(400).json({
          success: false,
          message: 'La date d\'arrivée ne peut pas être dans le passé'
        });
      }
    }
    
    next();
  };

  // ===== VALIDATION POUR MAINTENANCE - CORRIGÉE =====
  static validateMaintenanceConfirm = [
    body('confirm')
      .notEmpty()
      .withMessage('Confirmation requise')
      .custom((value) => {
        const validConfirmations = [
          'YES_CLEANUP_CORRUPTED_HOTELS',
          'YES_RECALCULATE_ALL_STATS',
          'YES_REPAIR_ALL_DATA'
        ];
        if (!validConfirmations.includes(value)) {
          throw new Error('Confirmation invalide. Utilisez une des confirmations valides');
        }
        return true;
      }),

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Confirmation de maintenance invalide",
          errors: errors.array(),
          validConfirmations: [
            'YES_CLEANUP_CORRUPTED_HOTELS',
            'YES_RECALCULATE_ALL_STATS',
            'YES_REPAIR_ALL_DATA'
          ]
        });
      }
      next();
    }
  ];

  // ===== NOUVELLES VALIDATIONS POUR LES AVIS AVANCÉS =====
  static validateReportReview = [
    param('hotelId')
      .isMongoId()
      .withMessage('ID d\'hôtel invalide'),
    
    param('reviewId')
      .isMongoId()
      .withMessage('ID d\'avis invalide'),
    
    body('reason')
      .notEmpty()
      .withMessage('La raison du signalement est obligatoire')
      .isIn(['spam', 'inappropriate', 'fake', 'offensive', 'other'])
      .withMessage('Raison de signalement invalide'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('La description ne peut pas dépasser 500 caractères')
      .trim(),

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Données de signalement invalides",
          errors: errors.array()
        });
      }
      next();
    }
  ];

  static validateUpdateReview = [
    param('hotelId')
      .isMongoId()
      .withMessage('ID d\'hôtel invalide'),
    
    param('reviewId')
      .isMongoId()
      .withMessage('ID d\'avis invalide'),
    
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('La note doit être entre 1 et 5'),
    
    body('review')
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage('L\'avis doit contenir entre 10 et 500 caractères')
      .trim(),

    // Middleware de gestion d'erreurs
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Données de modification d'avis invalides",
          errors: errors.array()
        });
      }
      next();
    }
  ];

  // ===== FONCTION UTILITAIRE POUR LOG D'ERREURS =====
  static logValidationError(req, res, errors) {
    console.log('❌ Erreur de validation:', {
      route: req.originalUrl,
      method: req.method,
      errors: errors.array(),
      body: req.body,
      params: req.params,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  }

  // ===== MIDDLEWARE GLOBAL POUR GESTION D'ERREURS =====
  static handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      this.logValidationError(req, res, errors);
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array().map(err => ({
          field: err.param || err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  };
}

module.exports = HotelValidation;
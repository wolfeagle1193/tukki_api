

// middlewares/popularPlaceValidation.js - VALIDATION CORRIGÉE AVEC OBJECTID
const { body, param, query } = require('express-validator');

class PopularPlaceValidation {
  
  /**
   * Validation pour ajouter un avis (mobile) - CORRIGÉ
   */
  static validateFeedback = [
    param('placeId')
      .notEmpty()
      .withMessage('ID du lieu requis')
      .isMongoId() // ✅ CORRIGÉ : ObjectId au lieu de numérique
      .withMessage('ID du lieu doit être un ObjectId valide'),
    
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('La note doit être entre 1 et 5'),
    
    body('comment')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Le commentaire ne peut pas dépasser 500 caractères')
      .trim()
  ];
  
  /**
   * Validation pour créer/modifier les détails d'un lieu (admin/maintenancier) - CORRIGÉ
   */
  static validateCreateOrUpdate = [
    body('regionId') // ✅ GARDÉ tel quel comme demandé
      .notEmpty()
      .withMessage('ID de la région requis')
      .isLength({ min: 2, max: 50 })
      .withMessage('ID de région invalide'),
    
    body('title')
      .notEmpty()
      .withMessage('Titre requis')
      .isLength({ min: 3, max: 200 })
      .withMessage('Le titre doit contenir entre 3 et 200 caractères')
      .trim(),
    
    body('description')
      .notEmpty()
      .withMessage('Description requise')
      .isLength({ min: 50, max: 2000 })
      .withMessage('La description doit contenir entre 50 et 2000 caractères')
      .trim(),
    
    body('location')
      .notEmpty()
      .withMessage('Localisation requise')
      .isLength({ min: 3, max: 150 })
      .withMessage('La localisation doit contenir entre 3 et 150 caractères')
      .trim(),
    
    body('category')
      .notEmpty()
      .withMessage('Catégorie requise')
      .isLength({ min: 3, max: 100 })
      .withMessage('La catégorie doit contenir entre 3 et 100 caractères')
      .isIn([
        'Monument historique',
        'Site naturel',
        'Musée',
        'Marché',
        'Plage',
        'Parc national',
        'Site religieux',
        'Architecture coloniale',
        'Lieu culturel',
        'Site archéologique',
        'Réserve naturelle',
        'Artisanat local',
        'Gastronomie',
        'Autre'
      ])
      .withMessage('Catégorie non valide'),
    
    // Coordonnées géographiques
    body('coordinates.latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude invalide (doit être entre -90 et 90)'),
    
    body('coordinates.longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude invalide (doit être entre -180 et 180)'),
    
    // Horaires de visite
    body('visitSchedules.weekdays.open')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Heure d\'ouverture en semaine invalide (format HH:MM)'),
    
    body('visitSchedules.weekdays.close')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Heure de fermeture en semaine invalide (format HH:MM)'),
    
    body('visitSchedules.weekends.open')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Heure d\'ouverture weekend invalide (format HH:MM)'),
    
    body('visitSchedules.weekends.close')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Heure de fermeture weekend invalide (format HH:MM)'),
    
    body('visitSchedules.holidays.open')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Heure d\'ouverture jours fériés invalide (format HH:MM)'),
    
    body('visitSchedules.holidays.close')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Heure de fermeture jours fériés invalide (format HH:MM)'),
    
    // Informations pratiques
    body('practicalInfos.duration')
      .notEmpty()
      .withMessage('Durée de visite requise')
      .isLength({ max: 100 })
      .withMessage('Durée de visite trop longue (max 100 caractères)')
      .trim(),
    
    body('practicalInfos.bestTimeToVisit')
      .notEmpty()
      .withMessage('Meilleur moment pour visiter requis')
      .isLength({ max: 200 })
      .withMessage('Description du meilleur moment trop longue (max 200 caractères)')
      .trim(),
    
    body('practicalInfos.accessibility')
      .notEmpty()
      .withMessage('Information d\'accessibilité requise')
      .isLength({ max: 200 })
      .withMessage('Information d\'accessibilité trop longue (max 200 caractères)')
      .trim(),
    
    body('practicalInfos.entryFee')
      .notEmpty()
      .withMessage('Information sur les tarifs requise')
      .isLength({ max: 100 })
      .withMessage('Information sur les tarifs trop longue (max 100 caractères)')
      .trim(),
    
    body('practicalInfos.parking')
      .notEmpty()
      .withMessage('Information sur le parking requise')
      .isLength({ max: 200 })
      .withMessage('Information sur le parking trop longue (max 200 caractères)')
      .trim(),
    
    body('practicalInfos.tips')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Conseils trop longs (max 500 caractères)')
      .trim(),
    
    // Contact (optionnel mais validé si présent)
    body('contact.phone')
      .optional()
      .matches(/^(\+221\s?)?[0-9\s\-]{8,15}$/)
      .withMessage('Numéro de téléphone invalide (format sénégalais attendu)'),
    
    body('contact.email')
      .optional()
      .isEmail()
      .withMessage('Adresse email invalide')
      .normalizeEmail(),
    
    body('contact.website')
      .optional()
      .isURL()
      .withMessage('URL du site web invalide'),
    
    // Galerie d'images - CORRIGÉ selon le modèle
    body('gallery')
      .optional()
      .isArray()
      .withMessage('La galerie doit être un tableau'),
    
    body('gallery.*')
      .optional()
      .matches(/\.(jpg|jpeg|png|webp)$/i)
      .withMessage('Format d\'image non valide (acceptés: JPG, JPEG, PNG, WebP)'),
    
    // Activités (optionnel)
    body('activities')
      .optional()
      .isArray()
      .withMessage('Les activités doivent être un tableau'),
    
    body('activities.*')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Chaque activité doit contenir entre 3 et 100 caractères')
      .trim(),
    
    // Conseils spécialisés (optionnel)
    body('specialTips')
      .optional()
      .isArray()
      .withMessage('Les conseils spécialisés doivent être un tableau'),
    
    body('specialTips.*')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Chaque conseil doit contenir entre 5 et 200 caractères')
      .trim(),
    
    // Données d'administration - AJOUTÉ selon le modèle
    body('createdBy.userId')
      .notEmpty()
      .withMessage('ID utilisateur créateur requis')
      .isMongoId()
      .withMessage('ID utilisateur créateur doit être un ObjectId valide'),
    
    body('createdBy.role')
      .notEmpty()
      .withMessage('Rôle créateur requis')
      .isIn(['superAdmin', 'maintenancier'])
      .withMessage('Rôle créateur invalide'),
    
    body('createdBy.username')
      .notEmpty()
      .withMessage('Nom d\'utilisateur créateur requis')
      .trim()
  ];
  
  /**
   * Validation pour les paramètres de recherche - CORRIGÉ
   */
  static validateSearch = [
    query('query')
      .notEmpty()
      .withMessage('Terme de recherche requis')
      .isLength({ min: 2, max: 100 })
      .withMessage('Le terme de recherche doit contenir entre 2 et 100 caractères')
      .trim(),
    
    query('regionId') // ✅ GARDÉ cohérent avec validateCreateOrUpdate
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('ID de région invalide'),
    
    query('minRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Note minimale invalide (doit être entre 0 et 5)')
  ];
  
  /**
   * Validation pour les paramètres de pagination
   */
  static validatePagination = [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Numéro de page invalide')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite invalide (entre 1 et 100)')
      .toInt(),
    
    query('sortBy')
      .optional()
      .isIn(['rating', 'views', 'recent', 'title', 'createdAt', 'updatedAt'])
      .withMessage('Critère de tri invalide'),
    
    query('hasFullDetails')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('hasFullDetails doit être true ou false')
  ];
  
  /**
   * Validation pour les paramètres d'ID - CORRIGÉ avec ObjectId
   */
  static validatePlaceId = [
    param('placeId')
      .notEmpty()
      .withMessage('ID du lieu requis')
      .isMongoId() // ✅ CORRIGÉ : ObjectId au lieu de numérique
      .withMessage('ID du lieu doit être un ObjectId valide')
  ];
  
  static validateRegionId = [ // ✅ GARDÉ simple et cohérent
    param('regionId')
      .notEmpty()
      .withMessage('ID de la région requis')
      .isLength({ min: 2, max: 50 })
      .withMessage('ID de région invalide')
  ];
  
  /**
   * Validation pour marquer un avis comme utile - CORRIGÉ
   */
  static validateReviewId = [
    param('placeId')
      .notEmpty()
      .withMessage('ID du lieu requis')
      .isMongoId() // ✅ CORRIGÉ : ObjectId
      .withMessage('ID du lieu doit être un ObjectId valide'),
    
    param('reviewId')
      .notEmpty()
      .withMessage('ID de l\'avis requis')
      .isMongoId()
      .withMessage('ID de l\'avis invalide')
  ];
  
  /**
   * Validation personnalisée pour vérifier les horaires
   */
  static validateSchedules = (req, res, next) => {
    const { visitSchedules } = req.body;
    
    if (!visitSchedules) {
      return next();
    }
    
    const scheduleTypes = ['weekdays', 'weekends', 'holidays'];
    const errors = [];
    
    scheduleTypes.forEach(type => {
      if (visitSchedules[type]) {
        const { open, close } = visitSchedules[type];
        
        if (open && close) {
          const openTime = new Date(`1970-01-01T${open}:00`);
          const closeTime = new Date(`1970-01-01T${close}:00`);
          
          if (openTime >= closeTime) {
            errors.push(`L'heure d'ouverture doit être antérieure à l'heure de fermeture pour ${type}`);
          }
        }
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Horaires invalides',
        errors: errors
      });
    }
    
    next();
  };
  
  /**
   * Validation personnalisée pour vérifier les coordonnées Sénégal
   */
  static validateSenegalCoordinates = (req, res, next) => {
    const { coordinates } = req.body;
    
    if (!coordinates) {
      return next();
    }
    
    const { latitude, longitude } = coordinates;
    
    // Coordonnées approximatives du Sénégal
    const senegalBounds = {
      north: 16.8,
      south: 12.3,
      east: -11.3,
      west: -17.8
    };
    
    if (
      latitude < senegalBounds.south || 
      latitude > senegalBounds.north ||
      longitude < senegalBounds.west || 
      longitude > senegalBounds.east
    ) {
      return res.status(400).json({
        success: false,
        message: 'Les coordonnées doivent être situées au Sénégal',
        hint: `Latitude: ${senegalBounds.south} à ${senegalBounds.north}, Longitude: ${senegalBounds.west} à ${senegalBounds.east}`
      });
    }
    
    next();
  };
  
  /**
   * Validation personnalisée pour vérifier les droits d'administration
   */
  static validateAdminAccess = (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!['superAdmin', 'maintenancier'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les administrateurs et maintenanciers peuvent effectuer cette action.'
      });
    }
    
    next();
  };
  
  /**
   * Validation personnalisée pour empêcher les avis multiples - CORRIGÉ avec ObjectId
   */
  static validateUniqueReview = async (req, res, next) => {
    try {
      const { placeId } = req.params;
      const userId = req.user.id;
      
      const PopularPlace = require('../models/PopularPlace');
      
      // ✅ CORRIGÉ : Recherche par ObjectId directement
      const place = await PopularPlace.findOne({ 
        _id: placeId, // ObjectId directement
        isActive: true 
      });
      
      if (!place) {
        return res.status(404).json({
          success: false,
          message: 'Lieu non trouvé'
        });
      }
      
      // Vérifier si l'utilisateur a déjà donné un avis
      const existingReview = place.reviews.find(
        review => review.userId.toString() === userId.toString()
      );
      
      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: 'Vous avez déjà donné un avis pour ce lieu'
        });
      }
      
      next();
      
    } catch (error) {
      console.error('❌ Erreur validateUniqueReview:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur de validation'
      });
    }
  };
  
  /**
   * Validation pour les données de maintenance/réparation - CORRIGÉ
   */
  static validateMaintenanceAction = [
    body('confirm')
      .optional()
      .isString()
      .withMessage('Confirmation doit être une chaîne de caractères'),
    
    body('action')
      .optional()
      .isIn(['repair', 'verify', 'cleanup', 'sync'])
      .withMessage('Action de maintenance invalide'),
    
    body('regionId') // ✅ GARDÉ cohérent
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('ID de région invalide')
  ];
  
  /**
   * Validation pour la création en masse de lieux - CORRIGÉ
   */
  static validateBulkCreate = [
    body('regionId') // ✅ GARDÉ cohérent
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('ID de région invalide'),
    
    body('confirm')
      .equals('YES_CREATE_MISSING_PLACES')
      .withMessage('Confirmation requise: YES_CREATE_MISSING_PLACES')
  ];
  
  /**
   * Validation pour la synchronisation des ratings - CORRIGÉ
   */
  static validateSyncRatings = [
    body('direction')
      .optional()
      .isIn(['to-basic', 'from-basic'])
      .withMessage('Direction de synchronisation invalide'),
    
    body('regionId') // ✅ GARDÉ cohérent
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('ID de région invalide')
  ];
  
  /**
   * Combiner les validations pour les routes spécifiques - CORRIGÉ
   */
  static getValidationChain = (validationType) => {
    const chains = {
      // Routes publiques - CORRIGÉ
      'place-details': [
        ...this.validateRegionId, // ✅ CORRIGÉ : nom cohérent
        ...this.validatePlaceId
      ],
      
      'places-by-region': [
        ...this.validateRegionId, // ✅ CORRIGÉ
        ...this.validatePagination
      ],
      
      'search-places': [
        ...this.validateSearch,
        ...this.validatePagination
      ],
      
      // Routes utilisateurs
      'submit-feedback': [
        ...this.validatePlaceId,
        ...this.validateFeedback,
        this.validateUniqueReview
      ],
      
      'toggle-favorite': [
        ...this.validatePlaceId
      ],
      
      'mark-helpful': [
        ...this.validateReviewId
      ],
      
      // Routes admin
      'admin-create-update': [
        ...this.validateCreateOrUpdate,
        this.validateSchedules,
        this.validateSenegalCoordinates,
        this.validateAdminAccess
      ],
      
      'admin-list': [
        ...this.validatePagination,
        this.validateAdminAccess
      ],
      
      'admin-delete': [
        ...this.validatePlaceId,
        this.validateAdminAccess
      ],
      
      'admin-stats': [
        this.validateAdminAccess
      ],
      
      // Routes maintenance
      'maintenance-repair': [
        ...this.validateMaintenanceAction,
        this.validateAdminAccess
      ],
      
      'maintenance-verify': [
        this.validateAdminAccess
      ],
      
      'maintenance-cleanup': [
        ...this.validateMaintenanceAction,
        this.validateAdminAccess
      ],
      
      'maintenance-bulk-create': [
        ...this.validateBulkCreate,
        this.validateAdminAccess
      ],
      
      'maintenance-sync-ratings': [
        ...this.validateSyncRatings,
        this.validateAdminAccess
      ]
    };
    
    return chains[validationType] || [];
  };
  
  /**
   * Validation middleware pour les fichiers d'images
   */
  static validateImageFiles = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(); // Pas d'images = OK
    }
    
    const maxFiles = 10;
    const maxSize = 5 * 1024 * 1024; // 5MB par fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (req.files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxFiles} images autorisées`
      });
    }
    
    for (const file of req.files) {
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `Taille de fichier trop grande: ${file.originalname} (max: 5MB)`
        });
      }
      
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Type de fichier non autorisé: ${file.originalname} (types acceptés: JPEG, PNG, WebP)`
        });
      }
    }
    
    next();
  };
  
  /**
   * Validation de sécurité pour les uploads
   */
  static validateSecureUpload = (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next();
    }
    
    // Vérifier les noms de fichiers sécurisés
    const dangerousPatterns = [
      /\.\./,  // Path traversal
      /[<>:"|?*]/,  // Caractères dangereux
      /^\./,   // Fichiers cachés
      /\.(php|js|html|exe|bat)$/i  // Extensions dangereuses
    ];
    
    for (const file of req.files) {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(file.originalname)) {
          return res.status(400).json({
            success: false,
            message: `Nom de fichier non autorisé: ${file.originalname}`
          });
        }
      }
    }
    
    next();
  };
}

module.exports = PopularPlaceValidation;
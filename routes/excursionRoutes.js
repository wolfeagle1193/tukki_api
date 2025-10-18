// routes/excursionRoutes.js
/*const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const excursionController = require('../controllers/excursionController');
const { verifyToken } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');

// ======= MIDDLEWARES DE VALIDATION =======

// Validation pour création/modification d'excursion
const validateExcursion = [
  body('title')
    .notEmpty()
    .withMessage('Le titre est obligatoire')
    .isLength({ min: 5, max: 200 })
    .withMessage('Le titre doit contenir entre 5 et 200 caractères')
    .trim(),
    
  body('description')
    .notEmpty()
    .withMessage('La description est obligatoire')
    .isLength({ min: 20, max: 2000 })
    .withMessage('La description doit contenir entre 20 et 2000 caractères')
    .trim(),
    
  body('treasureId')
    .notEmpty()
    .withMessage('Le lieu (treasureId) est obligatoire')
    .isMongoId()
    .withMessage('ID du lieu invalide'),
    
  body('date')
    .notEmpty()
    .withMessage('La date est obligatoire')
    .isISO8601()
    .withMessage('Format de date invalide')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('La date doit être dans le futur');
      }
      return true;
    }),
    
  body('maxParticipants')
    .notEmpty()
    .withMessage('Le nombre maximum de participants est obligatoire')
    .isInt({ min: 1, max: 100 })
    .withMessage('Le nombre de participants doit être entre 1 et 100'),
    
  body('pricing.basePrice')
    .notEmpty()
    .withMessage('Le prix de base est obligatoire')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être positif'),
    
  body('pricing.depositPercentage')
    .optional()
    .isInt({ min: 10, max: 100 })
    .withMessage('Le pourcentage d\'acompte doit être entre 10 et 100'),
    
  body('organizer.name')
    .notEmpty()
    .withMessage('Le nom de l\'organisateur est obligatoire')
    .trim(),
    
  body('organizer.phone')
    .notEmpty()
    .withMessage('Le téléphone de l\'organisateur est obligatoire')
    .isMobilePhone('fr-FR')
    .withMessage('Numéro de téléphone invalide'),
    
  body('meetingPoint.name')
    .notEmpty()
    .withMessage('Le point de rendez-vous est obligatoire')
    .trim(),
    
  body('status')
    .optional()
    .isIn(['draft', 'published', 'cancelled', 'completed', 'suspended'])
    .withMessage('Statut invalide')
];

// Validation pour l'ajout de participants
const validateParticipant = [
  body('userId')
    .notEmpty()
    .withMessage('L\'ID utilisateur est obligatoire')
    .isMongoId()
    .withMessage('ID utilisateur invalide'),
    
  body('numberOfPersons')
    .notEmpty()
    .withMessage('Le nombre de personnes est obligatoire')
    .isInt({ min: 1, max: 10 })
    .withMessage('Le nombre de personnes doit être entre 1 et 10'),
    
  body('fullName')
    .notEmpty()
    .withMessage('Le nom complet est obligatoire')
    .trim(),
    
  body('email')
    .notEmpty()
    .withMessage('L\'email est obligatoire')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),
    
  body('phone')
    .notEmpty()
    .withMessage('Le téléphone est obligatoire')
    .isMobilePhone('fr-FR')
    .withMessage('Numéro de téléphone invalide'),
    
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Les demandes spéciales ne peuvent pas dépasser 500 caractères')
    .trim()
];

// Validation pour les paiements
const validatePayment = [
  body('amount')
    .notEmpty()
    .withMessage('Le montant est obligatoire')
    .isFloat({ min: 0 })
    .withMessage('Le montant doit être positif'),
    
  body('type')
    .notEmpty()
    .withMessage('Le type de paiement est obligatoire')
    .isIn(['deposit', 'balance', 'refund', 'penalty'])
    .withMessage('Type de paiement invalide'),
    
  body('method')
    .notEmpty()
    .withMessage('La méthode de paiement est obligatoire')
    .isIn(['cash', 'card', 'mobile_money', 'bank_transfer'])
    .withMessage('Méthode de paiement invalide'),
    
  body('status')
    .optional()
    .isIn(['pending', 'success', 'failed', 'cancelled'])
    .withMessage('Statut de paiement invalide'),
    
  body('transactionId')
    .optional()
    .trim(),
    
  body('notes')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Les notes ne peuvent pas dépasser 300 caractères')
    .trim()
];

// Validation des paramètres MongoDB ID
const validateMongoId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} invalide`)
];

// Validation des paramètres de requête pour la pagination
const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être positif'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
    
  query('sortBy')
    .optional()
    .isIn(['date', 'title', 'createdAt', 'maxParticipants', 'currentParticipants', 'status'])
    .withMessage('Champ de tri invalide'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri invalide'),
    
  query('status')
    .optional()
    .isIn(['all', 'draft', 'published', 'cancelled', 'completed', 'suspended'])
    .withMessage('Statut de filtre invalide'),
    
  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre upcoming doit être un booléen'),
    
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('La recherche doit contenir entre 2 et 100 caractères')
    .trim()
];

// Middleware pour vérifier les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// ======= ROUTES PRINCIPALES =======

// 📊 STATISTIQUES DASHBOARD (doit être avant les routes avec paramètres)
router.get('/admin/dashboard', 
  verifyToken, 
  excursionController.getDashboardStats
);

// 🎯 CRÉER UNE EXCURSION
router.post('/', 
  verifyToken, 
   checkRole(['superAdmin', 'maintenancier']),                                   // Authentification requise
  excursionController.uploadMiddleware,           // Upload d'images
  validateExcursion,                              // Validation des données
  handleValidationErrors,                         // Gestion des erreurs
  excursionController.createExcursion
);

// 📋 OBTENIR TOUTES LES EXCURSIONS (avec filtres et pagination)
router.get('/', 
     checkRole(['superAdmin', 'maintenancier']),
  validatePaginationQuery,                        // Validation des paramètres de requête
  handleValidationErrors,
  excursionController.getAllExcursions
);

// 🔍 OBTENIR UNE EXCURSION PAR ID
router.get('/:id', 
  validateMongoId('id'),                          // Validation de l'ID MongoDB
  handleValidationErrors,
  excursionController.getExcursionById
);

// ✏️ METTRE À JOUR UNE EXCURSION
router.put('/:id', 
  verifyToken, 
   checkRole(['superAdmin', 'maintenancier']),                                   // Authentification requise
  validateMongoId('id'),                          // Validation de l'ID
  excursionController.uploadMiddleware,           // Upload d'images optionnel
  validateExcursion,                              // Validation des données
  handleValidationErrors,
  excursionController.updateExcursion
);

// 🗑️ SUPPRIMER UNE EXCURSION
router.delete('/:id',
     checkRole(['superAdmin', 'maintenancier']), 
  verifyToken,                                    // Authentification requise
  validateMongoId('id'),                          // Validation de l'ID
  handleValidationErrors,
  excursionController.deleteExcursion
);

// ======= ROUTES SPÉCIALISÉES PAR LIEU =======

// 🏝️ OBTENIR LES EXCURSIONS POUR UN LIEU SPÉCIFIQUE
router.get('/place/:treasureId', 
  validateMongoId('treasureId'),                  // Validation de l'ID du lieu
  query('upcoming').optional().isBoolean(),      // Validation du paramètre upcoming
  query('status').optional().isIn(['all', 'draft', 'published', 'cancelled', 'completed']),
  handleValidationErrors,
  excursionController.getExcursionsByTreasure
);

// ======= GESTION DES PARTICIPANTS =======

// 👤 AJOUTER UN PARTICIPANT À UNE EXCURSION
router.post('/:excursionId/participants', 
  verifyToken,                                    // Authentification requise
  validateMongoId('excursionId'),                 // Validation de l'ID excursion
  validateParticipant,                            // Validation des données participant
  handleValidationErrors,
  excursionController.addParticipant
);

// 👥 OBTENIR LES PARTICIPANTS D'UNE EXCURSION
router.get('/:excursionId/participants', 
  verifyToken, 
   checkRole(['superAdmin', 'maintenancier']),                                   // Authentification requise (données sensibles)
  validateMongoId('excursionId'),                 // Validation de l'ID excursion
  handleValidationErrors,
  excursionController.getParticipants
);

// 🔍 VÉRIFIER LE STATUT D'UN UTILISATEUR POUR UNE EXCURSION
router.get('/:excursionId/user-status/:userId', 
  validateMongoId('excursionId'),                 // Validation de l'ID excursion
  validateMongoId('userId'),                      // Validation de l'ID utilisateur
  handleValidationErrors,
  excursionController.getUserExcursionStatus
);

// ======= GESTION DES PAIEMENTS =======

// 💰 ENREGISTRER UN PAIEMENT
router.post('/:excursionId/participants/:participantId/payments', 
  verifyToken,                                    // Authentification requise
  validateMongoId('excursionId'),                 // Validation de l'ID excursion
  validateMongoId('participantId'),               // Validation de l'ID participant
  validatePayment,                                // Validation des données de paiement
  handleValidationErrors,
  excursionController.recordPayment
);

// ======= ROUTES UTILISATEUR =======

// 👤 OBTENIR LES EXCURSIONS D'UN UTILISATEUR
router.get('/user/:userId', 
  validateMongoId('userId'),                      // Validation de l'ID utilisateur
  query('status').optional().isIn(['all', 'pending', 'deposit_paid', 'fully_paid', 'cancelled']),
  query('upcoming').optional().isBoolean(),
  handleValidationErrors,
  excursionController.getUserExcursions
);

// ======= ROUTES ADMINISTRATIVES =======

// 📊 STATISTIQUES DÉTAILLÉES (route alternative avec plus de détails)
router.get('/admin/stats/detailed', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),                                    // Authentification admin requise
  async (req, res) => {
    try {
      // Cette route pourrait être étendue pour des statistiques plus détaillées
      const stats = await excursionController.getDashboardStats(req, res);
      
      // Ajouter des métriques supplémentaires si nécessaire
      // Par exemple : revenus par mois, taux de conversion, etc.
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques détaillées',
        error: error.message
      });
    }
  }
);

// 🔧 ROUTE DE TEST/SANTÉ
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service excursions opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ======= MIDDLEWARE DE GESTION D'ERREURS =======

// Middleware pour capturer les erreurs non gérées dans les routes
router.use((error, req, res, next) => {
  console.error('❌ Erreur dans les routes excursions:', error);
  
  // Erreurs Mongoose
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation MongoDB',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  // Erreurs de cast MongoDB (ID invalide)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID MongoDB invalide',
      field: error.path
    });
  }
  
  // Erreurs Multer (upload)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux (max 5MB)'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Type de fichier non autorisé'
    });
  }
  
  // Erreur générique
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur s\'est produite'
  });
});

module.exports = router;*/


// routes/excursionRoutes.js - VERSION CORRIGÉE
/*const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator'); // ✅ Ajout validationResult
const excursionController = require('../controllers/excursionController');
const { verifyToken } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');

// ======= MIDDLEWARES DE VALIDATION (inchangés) =======

const validateExcursion = [
  body('title')
    .notEmpty()
    .withMessage('Le titre est obligatoire')
    .isLength({ min: 5, max: 200 })
    .withMessage('Le titre doit contenir entre 5 et 200 caractères')
    .trim(),
    
  body('description')
    .notEmpty()
    .withMessage('La description est obligatoire')
    .isLength({ min: 20, max: 2000 })
    .withMessage('La description doit contenir entre 20 et 2000 caractères')
    .trim(),
    
    body('treasureId')
    .notEmpty()
    .withMessage('Le lieu (treasureId) est obligatoire')
    .isString()  // ✅ CORRECTION
    .withMessage('L\'ID du lieu doit être une chaîne')
    .trim()
    .isLength({ min: 1 })
    .withMessage('L\'ID du lieu ne peut pas être vide'),
    
  body('date')
    .notEmpty()
    .withMessage('La date est obligatoire')
    .isISO8601()
    .withMessage('Format de date invalide')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('La date doit être dans le futur');
      }
      return true;
    }),
    
  body('maxParticipants')
    .notEmpty()
    .withMessage('Le nombre maximum de participants est obligatoire')
    .isInt({ min: 1, max: 100 })
    .withMessage('Le nombre de participants doit être entre 1 et 100'),
    
  body('pricing.basePrice')
    .notEmpty()
    .withMessage('Le prix de base est obligatoire')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être positif'),
    
  body('pricing.depositPercentage')
    .optional()
    .isInt({ min: 10, max: 100 })
    .withMessage('Le pourcentage d\'acompte doit être entre 10 et 100'),
    
  body('organizer.name')
    .notEmpty()
    .withMessage('Le nom de l\'organisateur est obligatoire')
    .trim(),
    
  body('organizer.phone')
    .notEmpty()
    .withMessage('Le téléphone de l\'organisateur est obligatoire')
    .isMobilePhone('fr-FR')
    .withMessage('Numéro de téléphone invalide'),
    
  body('meetingPoint.name')
    .notEmpty()
    .withMessage('Le point de rendez-vous est obligatoire')
    .trim(),
    
  body('status')
    .optional()
    .isIn(['draft', 'published', 'cancelled', 'completed', 'suspended'])
    .withMessage('Statut invalide')
];

const validateParticipant = [
  body('userId')
    .notEmpty()
    .withMessage('L\'ID utilisateur est obligatoire')
    .isMongoId()
    .withMessage('ID utilisateur invalide'),
    
  body('numberOfPersons')
    .notEmpty()
    .withMessage('Le nombre de personnes est obligatoire')
    .isInt({ min: 1, max: 10 })
    .withMessage('Le nombre de personnes doit être entre 1 et 10'),
    
  body('fullName')
    .notEmpty()
    .withMessage('Le nom complet est obligatoire')
    .trim(),
    
  body('email')
    .notEmpty()
    .withMessage('L\'email est obligatoire')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),
    
  body('phone')
    .notEmpty()
    .withMessage('Le téléphone est obligatoire')
    .isMobilePhone('fr-FR')
    .withMessage('Numéro de téléphone invalide'),
    
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Les demandes spéciales ne peuvent pas dépasser 500 caractères')
    .trim()
];

const validatePayment = [
  body('amount')
    .notEmpty()
    .withMessage('Le montant est obligatoire')
    .isFloat({ min: 0 })
    .withMessage('Le montant doit être positif'),
    
  body('type')
    .notEmpty()
    .withMessage('Le type de paiement est obligatoire')
    .isIn(['deposit', 'balance', 'refund', 'penalty'])
    .withMessage('Type de paiement invalide'),
    
  body('method')
    .notEmpty()
    .withMessage('La méthode de paiement est obligatoire')
    .isIn(['cash', 'card', 'mobile_money', 'bank_transfer'])
    .withMessage('Méthode de paiement invalide'),
    
  body('status')
    .optional()
    .isIn(['pending', 'success', 'failed', 'cancelled'])
    .withMessage('Statut de paiement invalide'),
    
  body('transactionId')
    .optional()
    .trim(),
    
  body('notes')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Les notes ne peuvent pas dépasser 300 caractères')
    .trim()
];

const validateMongoId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} invalide`)
];

const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être positif'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
    
  query('sortBy')
    .optional()
    .isIn(['date', 'title', 'createdAt', 'maxParticipants', 'currentParticipants', 'status'])
    .withMessage('Champ de tri invalide'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri invalide'),
    
  query('status')
    .optional()
    .isIn(['all', 'draft', 'published', 'cancelled', 'completed', 'suspended'])
    .withMessage('Statut de filtre invalide'),
    
  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre upcoming doit être un booléen'),
    
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('La recherche doit contenir entre 2 et 100 caractères')
    .trim()
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// ======= ROUTES PRINCIPALES CORRIGÉES =======

// 📊 STATISTIQUES DASHBOARD (doit être avant les routes avec paramètres)
router.get('/admin/dashboard', 
  verifyToken,                                    // ✅ Auth d'abord
  checkRole(['superAdmin', 'maintenancier']),     // ✅ Puis rôle
  excursionController.getDashboardStats
);

// 🎯 CRÉER UNE EXCURSION
router.post('/', 
  verifyToken,                                    // ✅ Auth d'abord
  checkRole(['superAdmin', 'maintenancier']),     // ✅ Puis rôle
  excursionController.uploadMiddleware,           // Upload d'images
  //validateExcursion,                              // Validation des données
  handleValidationErrors,                         // Gestion des erreurs
  excursionController.createExcursion
);

// 📋 OBTENIR TOUTES LES EXCURSIONS (avec filtres et pagination)
router.get('/', 
  verifyToken,                                    // ✅ Auth d'abord
  checkRole(['superAdmin', 'maintenancier']),     // ✅ Puis rôle
  validatePaginationQuery,                        // Validation des paramètres de requête
  handleValidationErrors,
  excursionController.getAllExcursions
);

// 🔍 OBTENIR UNE EXCURSION PAR ID
router.get('/:id', 
  validateMongoId('id'),                          // Validation de l'ID MongoDB
  handleValidationErrors,
  excursionController.getExcursionById
);

// ✏️ METTRE À JOUR UNE EXCURSION
router.put('/:id', 
  verifyToken,                                    // ✅ Auth d'abord
  checkRole(['superAdmin', 'maintenancier']),     // ✅ Puis rôle
  validateMongoId('id'),                          // Validation de l'ID
  excursionController.uploadMiddleware,           // Upload d'images optionnel
  //validateExcursion,                              // Validation des données
  handleValidationErrors,
  excursionController.updateExcursion
);

// 🗑️ SUPPRIMER UNE EXCURSION
router.delete('/:id',
  verifyToken,                                    // ✅ Auth d'abord
  checkRole(['superAdmin', 'maintenancier']),     // ✅ Puis rôle
  validateMongoId('id'),                          // Validation de l'ID
  handleValidationErrors,
  excursionController.deleteExcursion
);

// ======= ROUTES SPÉCIALISÉES PAR LIEU =======

// 🏝️ OBTENIR LES EXCURSIONS POUR UN LIEU SPÉCIFIQUE (publique)
router.get('/place/:treasureId', 
  validateMongoId('treasureId'),                  // Validation de l'ID du lieu
  query('upcoming').optional().isBoolean(),      // Validation du paramètre upcoming
  query('status').optional().isIn(['all', 'draft', 'published', 'cancelled', 'completed']),
  handleValidationErrors,
  excursionController.getExcursionsByTreasure
);

// ======= GESTION DES PARTICIPANTS =======

// 👤 AJOUTER UN PARTICIPANT À UNE EXCURSION
router.post('/:excursionId/participants', 
  verifyToken,                                    // Authentification requise
  validateMongoId('excursionId'),                 // Validation de l'ID excursion
  validateParticipant,                            // Validation des données participant
  handleValidationErrors,
  excursionController.addParticipant
);

// 👥 OBTENIR LES PARTICIPANTS D'UNE EXCURSION
router.get('/:excursionId/participants', 
  verifyToken,                                    // ✅ Auth d'abord
  checkRole(['superAdmin', 'maintenancier']),     // ✅ Puis rôle (données sensibles)
  validateMongoId('excursionId'),                 // Validation de l'ID excursion
  handleValidationErrors,
  excursionController.getParticipants
);

// 🔍 VÉRIFIER LE STATUT D'UN UTILISATEUR POUR UNE EXCURSION
router.get('/:excursionId/user-status/:userId', 
  validateMongoId('excursionId'),                 // Validation de l'ID excursion
  validateMongoId('userId'),                      // Validation de l'ID utilisateur
  handleValidationErrors,
  excursionController.getUserExcursionStatus
);

// ======= GESTION DES PAIEMENTS =======

// 💰 ENREGISTRER UN PAIEMENT
router.post('/:excursionId/participants/:participantId/payments', 
  verifyToken,                                    // Authentification requise
  validateMongoId('excursionId'),                 // Validation de l'ID excursion
  validateMongoId('participantId'),               // Validation de l'ID participant
  validatePayment,                                // Validation des données de paiement
  handleValidationErrors,
  excursionController.recordPayment
);

// ======= ROUTES UTILISATEUR =======

// 👤 OBTENIR LES EXCURSIONS D'UN UTILISATEUR
router.get('/user/:userId', 
  validateMongoId('userId'),                      // Validation de l'ID utilisateur
  query('status').optional().isIn(['all', 'pending', 'deposit_paid', 'fully_paid', 'cancelled']),
  query('upcoming').optional().isBoolean(),
  handleValidationErrors,
  excursionController.getUserExcursions
);

// ======= ROUTES ADMINISTRATIVES =======

// 📊 STATISTIQUES DÉTAILLÉES
router.get('/admin/stats/detailed', 
  verifyToken,                                    // ✅ Auth d'abord
  checkRole(['superAdmin', 'maintenancier']),     // ✅ Puis rôle
  async (req, res) => {
    try {
      const stats = await excursionController.getDashboardStats(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques détaillées',
        error: error.message
      });
    }
  }
);

// 🔧 ROUTE DE TEST/SANTÉ (publique)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service excursions opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ======= MIDDLEWARE DE GESTION D'ERREURS =======

router.use((error, req, res, next) => {
  console.error('❌ Erreur dans les routes excursions:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation MongoDB',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID MongoDB invalide',
      field: error.path
    });
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux (max 5MB)'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Type de fichier non autorisé'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur s\'est produite'
  });
});

module.exports = router;*/


// routes/excursionRoutes.js - VERSION CORRIGÉE POUR CORRESPONDRE EXACTEMENT AUX MODÈLES

/*const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const excursionController = require('../controllers/excursionController');
const { verifyToken } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');

// ===== 🛠️ VALIDATIONS CORRIGÉES POUR CORRESPONDRE EXACTEMENT AUX MODÈLES =====

// ✅ VALIDATION EXCURSION ID (ObjectId par défaut MongoDB)
const validateExcursionId = [
  param('id')
    .isMongoId()
    .withMessage('L\'ID de l\'excursion doit être un ObjectId MongoDB valide')
];

// ✅ VALIDATION EXCURSION ID POUR PARAMÈTRE NOMMÉ
const validateExcursionIdParam = (paramName = 'excursionId') => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} doit être un ObjectId MongoDB valide`)
];

// ✅ VALIDATION TREASURE ID (String selon votre modèle Treasure)
const validateTreasureId = [
  param('treasureId')
    .notEmpty()
    .withMessage('TreasureId requis')
    .isString()
    .withMessage('TreasureId doit être une chaîne')
    .isLength({ min: 1, max: 50 })
    .withMessage('TreasureId invalide (1-50 caractères)')
    .trim()
];

// ✅ VALIDATION USER ID (ObjectId selon votre modèle User)
const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('UserId doit être un ObjectId MongoDB valide')
];

// ✅ VALIDATION PARTICIPANT ID (ObjectId - c'est l'_id du sous-document participant)
const validateParticipantId = [
  param('participantId')
    .isMongoId()
    .withMessage('ParticipantId doit être un ObjectId MongoDB valide')
];

/*const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être positif'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
    
  query('sortBy')
    .optional()
    .isIn(['date', 'title', 'createdAt', 'maxParticipants', 'currentParticipants', 'status'])
    .withMessage('Champ de tri invalide'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri invalide'),
    
  query('status')
    .optional()
    .isIn(['all', 'draft', 'published', 'cancelled', 'completed', 'suspended'])
    .withMessage('Statut de filtre invalide'),
    
  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre upcoming doit être un booléen'),
    
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('La recherche doit contenir entre 2 et 100 caractères')
    .trim()
];
const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être positif'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
    
  query('sortBy')
    .optional()
    .isIn(['date', 'title', 'createdAt', 'maxParticipants', 'currentParticipants', 'status'])
    .withMessage('Champ de tri invalide'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri invalide'),
    
  query('status')
    .optional()
    .isIn(['all', 'draft', 'published', 'cancelled', 'completed', 'suspended'])
    .withMessage('Statut de filtre invalide'),
    
  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre upcoming doit être un booléen'),
    
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })  // ✅ CHANGÉ : min: 1 au lieu de min: 2
    .withMessage('La recherche doit contenir entre 1 et 100 caractères')
    .trim()
];
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Erreurs de validation:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// ===== 🛣️ ROUTES CORRIGÉES =====

// 📊 STATISTIQUES DASHBOARD (admin seulement)
router.get('/admin/dashboard', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  excursionController.getDashboardStats
);

// 🎯 CRÉER UNE EXCURSION (admin seulement)
router.post('/', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  excursionController.uploadMiddleware,
  handleValidationErrors,
  excursionController.createExcursion
);

// 📋 OBTENIR TOUTES LES EXCURSIONS (admin seulement)
router.get('/', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  validatePaginationQuery,
  handleValidationErrors,
  excursionController.getAllExcursions
);

// ✅ OBTENIR UNE EXCURSION PAR ID (publique) - OBJECTID
router.get('/:id', 
  validateExcursionId,  // ✅ CORRIGÉ - ObjectId pour Excursion._id
  handleValidationErrors,
  excursionController.getExcursionById
);

// ✅ METTRE À JOUR UNE EXCURSION (admin seulement) - OBJECTID
router.put('/:id', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  validateExcursionId,  // ✅ CORRIGÉ - ObjectId pour Excursion._id
  excursionController.uploadMiddleware,
  handleValidationErrors,
  excursionController.updateExcursion
);

// 🗑️ SUPPRIMER UNE EXCURSION (admin seulement) - OBJECTID
router.delete('/:id',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  validateExcursionId,  // ✅ CORRIGÉ - ObjectId pour Excursion._id
  handleValidationErrors,
  excursionController.deleteExcursion
);

// ===== 🏝️ ROUTES PAR LIEU (PUBLIQUES) - CORRIGÉES =====

// ✅ OBTENIR LES EXCURSIONS POUR UN LIEU SPÉCIFIQUE - TREASURE ID STRING
router.get('/place/:treasureId', 
  validateTreasureId,  // ✅ CORRECT - String pour Treasure._id
  query('upcoming').optional().isBoolean(),
  query('status').optional().isIn(['all', 'draft', 'published', 'cancelled', 'completed']),
  handleValidationErrors,
  excursionController.getExcursionsByTreasure
);

// ===== 👤 GESTION DES PARTICIPANTS =====

// ✅ AJOUTER UN PARTICIPANT À UNE EXCURSION - OBJECTID EXCURSION
router.post('/:excursionId/participants', 
  verifyToken,
  validateExcursionIdParam('excursionId'),  // ✅ CORRIGÉ - ObjectId pour Excursion._id
  handleValidationErrors,
  excursionController.addParticipant
);

// ✅ OBTENIR LES PARTICIPANTS D'UNE EXCURSION (admin) - OBJECTID EXCURSION
router.get('/:excursionId/participants', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  validateExcursionIdParam('excursionId'),  // ✅ CORRIGÉ - ObjectId pour Excursion._id
  handleValidationErrors,
  excursionController.getParticipants
);

// ✅ VÉRIFIER LE STATUT D'UN UTILISATEUR - OBJECTID EXCURSION + OBJECTID USER
router.get('/:excursionId/user-status/:userId', 
  validateExcursionIdParam('excursionId'),  // ✅ CORRIGÉ - ObjectId pour Excursion._id
  validateUserId,                           // ✅ CORRECT - ObjectId pour User._id
  handleValidationErrors,
  excursionController.getUserExcursionStatus
);

// ===== 💰 GESTION DES PAIEMENTS =====

// ✅ ENREGISTRER UN PAIEMENT - OBJECTID EXCURSION + OBJECTID PARTICIPANT
router.post('/:excursionId/participants/:participantId/payments', 
  verifyToken,
  validateExcursionIdParam('excursionId'),  // ✅ CORRIGÉ - ObjectId pour Excursion._id
  validateParticipantId,                    // ✅ CORRIGÉ - ObjectId pour participant._id
  handleValidationErrors,
  excursionController.recordPayment
);

// ===== 👤 ROUTES UTILISATEUR =====

// ✅ OBTENIR LES EXCURSIONS D'UN UTILISATEUR - OBJECTID USER
router.get('/user/:userId', 
  validateUserId,  // ✅ CORRECT - ObjectId pour User._id
  query('status').optional().isIn(['all', 'pending', 'deposit_paid', 'fully_paid', 'cancelled']),
  query('upcoming').optional().isBoolean(),
  handleValidationErrors,
  excursionController.getUserExcursions
);

// ===== 🔧 ROUTES DE SANTÉ =====

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service excursions opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modelInfo: {
      excursionIdType: 'ObjectId',   // ✅ Excursion._id = ObjectId (défaut MongoDB)
      treasureIdType: 'String',      // ✅ Treasure._id = String (défini explicitement)
      userIdType: 'ObjectId',        // ✅ User._id = ObjectId (défaut MongoDB)
      participantIdType: 'ObjectId'  // ✅ participant._id = ObjectId (sous-document)
    }
  });
});

// ===== 🚨 MIDDLEWARE DE GESTION D'ERREURS =====

router.use((error, req, res, next) => {
  console.error('❌ Erreur dans les routes excursions:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation MongoDB',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Format d\'ID invalide',
      field: error.path,
      receivedValue: error.value,
      expectedType: error.kind === 'ObjectId' ? 'ObjectId MongoDB' : error.kind
    });
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux (max 5MB)'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Type de fichier non autorisé'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur s\'est produite'
  });
});

module.exports = router;*/


// routes/excursions.js
// ✅ ÉTAPE 3 - ROUTES (normalement pas de modification nécessaire, mais voici le code pour vérification)

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const excursionController = require('../controllers/excursionController');
const { verifyToken } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');

// ===== 🛠️ VALIDATIONS (inchangées) =====

const validateExcursionId = [
  param('id')
    .isMongoId()
    .withMessage('L\'ID de l\'excursion doit être un ObjectId MongoDB valide')
];

const validateExcursionIdParam = (paramName = 'excursionId') => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} doit être un ObjectId MongoDB valide`)
];

const validateTreasureId = [
  param('treasureId')
    .notEmpty()
    .withMessage('TreasureId requis')
    .isString()
    .withMessage('TreasureId doit être une chaîne')
    .isLength({ min: 1, max: 50 })
    .withMessage('TreasureId invalide (1-50 caractères)')
    .trim()
];

const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('UserId doit être un ObjectId MongoDB valide')
];

const validateParticipantId = [
  param('participantId')
    .isMongoId()
    .withMessage('ParticipantId doit être un ObjectId MongoDB valide')
];

const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être positif'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
    
  query('sortBy')
    .optional()
    .isIn(['date', 'title', 'createdAt', 'maxParticipants', 'currentParticipants', 'status'])
    .withMessage('Champ de tri invalide'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri invalide'),
    
  query('status')
    .optional()
    .isIn(['all', 'draft', 'published', 'cancelled', 'completed', 'suspended'])
    .withMessage('Statut de filtre invalide'),
    
  query('upcoming')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre upcoming doit être un booléen'),
    
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('La recherche doit contenir entre 1 et 100 caractères')
    .trim()
];

// ✅ NOUVELLE VALIDATION POUR LES PARTICIPANTS (optionnelle, validation côté contrôleur)
const validateParticipantData = [
  body('userId')
    .isMongoId()
    .withMessage('UserId doit être un ObjectId valide'),
    
  body('numberOfPersons')
    .isInt({ min: 1, max: 10 })
    .withMessage('Le nombre de personnes doit être entre 1 et 10'),
    
  body('phone')
    .optional()
    .isString()
    .isLength({ min: 8, max: 20 })
    .withMessage('Format de téléphone invalide'),
    
  // ✅ VALIDATION CONTACT D'URGENCE (optionnelle côté routes, obligatoire côté contrôleur)
  body('emergencyContact.name')
    .optional()
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du contact d\'urgence doit contenir entre 2 et 100 caractères'),
    
  body('emergencyContact.phone')
    .optional()
    .isString()
    .isLength({ min: 8, max: 20 })
    .withMessage('Format de téléphone du contact d\'urgence invalide'),
    
  body('emergencyContact.relation')
    .optional()
    .isString()
    .isIn([
      'conjoint', 'conjointe', 'époux', 'épouse', 'mari', 'femme',
      'père', 'mère', 'parent', 'fils', 'fille', 'enfant',
      'frère', 'sœur', 'grand-père', 'grand-mère',
      'oncle', 'tante', 'cousin', 'cousine',
      'ami', 'amie', 'ami proche', 'collègue',
      'tuteur', 'tutrice', 'autre'
    ])
    .withMessage('Relation non reconnue')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Erreurs de validation:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// ===== 🛣️ ROUTES =====

// 📊 STATISTIQUES DASHBOARD (admin seulement)
router.get('/admin/dashboard', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  excursionController.getDashboardStats
);

// 🎯 CRÉER UNE EXCURSION (admin seulement)
router.post('/', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  excursionController.uploadMiddleware,
  handleValidationErrors,
  excursionController.createExcursion
);

// 📋 OBTENIR TOUTES LES EXCURSIONS (admin seulement)
router.get('/', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  validatePaginationQuery,
  handleValidationErrors,
  excursionController.getAllExcursions
);

// ✅ OBTENIR UNE EXCURSION PAR ID (publique)
router.get('/:id', 
  validateExcursionId,
  handleValidationErrors,
  excursionController.getExcursionById
);

// ✅ METTRE À JOUR UNE EXCURSION (admin seulement)
router.put('/:id', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  validateExcursionId,
  excursionController.uploadMiddleware,
  handleValidationErrors,
  excursionController.updateExcursion
);

// 🗑️ SUPPRIMER UNE EXCURSION (admin seulement)
router.delete('/:id',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  validateExcursionId,
  handleValidationErrors,
  excursionController.deleteExcursion
);

// ===== 🏝️ ROUTES PAR LIEU (PUBLIQUES) =====

// ✅ OBTENIR LES EXCURSIONS POUR UN LIEU SPÉCIFIQUE
router.get('/place/:treasureId', 
  validateTreasureId,
  query('upcoming').optional().isBoolean(),
  query('status').optional().isIn(['all', 'draft', 'published', 'cancelled', 'completed']),
  handleValidationErrors,
  excursionController.getExcursionsByTreasure
);

// ===== 👤 GESTION DES PARTICIPANTS =====

// ✅ AJOUTER UN PARTICIPANT À UNE EXCURSION (avec validation optionnelle)
router.post('/:excursionId/participants', 
  verifyToken,
  validateExcursionIdParam('excursionId'),
  validateParticipantData, // ✅ Validation optionnelle (la vraie validation est dans le contrôleur)
  handleValidationErrors,
  excursionController.addParticipant
);

// ✅ OBTENIR LES PARTICIPANTS D'UNE EXCURSION (admin)
router.get('/:excursionId/participants', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  validateExcursionIdParam('excursionId'),
  handleValidationErrors,
  excursionController.getParticipants
);

// ✅ VÉRIFIER LE STATUT D'UN UTILISATEUR
router.get('/:excursionId/user-status/:userId', 
  validateExcursionIdParam('excursionId'),
  validateUserId,
  handleValidationErrors,
  excursionController.getUserExcursionStatus
);

// ===== 💰 GESTION DES PAIEMENTS =====

// ✅ ENREGISTRER UN PAIEMENT
router.post('/:excursionId/participants/:participantId/payments', 
  verifyToken,
  validateExcursionIdParam('excursionId'),
  validateParticipantId,
  handleValidationErrors,
  excursionController.recordPayment
);

// ===== 👤 ROUTES UTILISATEUR =====

// ✅ OBTENIR LES EXCURSIONS D'UN UTILISATEUR
router.get('/user/:userId', 
  validateUserId,
  query('status').optional().isIn(['all', 'pending', 'deposit_paid', 'fully_paid', 'cancelled']),
  query('upcoming').optional().isBoolean(),
  handleValidationErrors,
  excursionController.getUserExcursions
);

// ===== 🔧 ROUTES DE SANTÉ =====

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service excursions opérationnel',
    timestamp: new Date().toISOString(),
    version: '2.0.0', // ✅ Version mise à jour avec téléphone et contact d'urgence obligatoires
    features: {
      phoneRequired: true,
      emergencyContactRequired: true,
      internationalPhoneSupport: true,
      securityEnhanced: true
    },
    modelInfo: {
      excursionIdType: 'ObjectId',
      treasureIdType: 'String',
      userIdType: 'ObjectId',
      participantIdType: 'ObjectId'
    }
  });
});

// ===== 🚨 MIDDLEWARE DE GESTION D'ERREURS =====

router.use((error, req, res, next) => {
  console.error('❌ Erreur dans les routes excursions:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation MongoDB',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Format d\'ID invalide',
      field: error.path,
      receivedValue: error.value,
      expectedType: error.kind === 'ObjectId' ? 'ObjectId MongoDB' : error.kind
    });
  }
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux (max 5MB)'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Type de fichier non autorisé'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur s\'est produite'
  });
});

module.exports = router;
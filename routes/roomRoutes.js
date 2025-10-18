// routes/roomRoutes.js - ROUTES ROOM CORRIGÉES
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body, param, query } = require('express-validator');

// Contrôleurs
const roomController = require('../controllers/roomController');

// Middlewares (utilisation des vrais middlewares existants)
const { verifyToken, verifyTokenForUpload } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');

// Configuration multer pour upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image sont autorisés'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB par fichier
    files: 10 // Maximum 10 fichiers
  }
});

// VALIDATORS
const validateRoomId = [
  param('roomId')
    .isMongoId()
    .withMessage('ID de chambre invalide')
];

const validateHotelId = [
  param('hotelId')
    .isMongoId()
    .withMessage('ID d\'hôtel invalide')
];

const validateAvailabilitySearch = [
  query('checkIn')
    .optional()
    .isISO8601()
    .withMessage('Date d\'arrivée invalide (format: YYYY-MM-DD)'),
  query('checkOut')
    .optional()
    .isISO8601()
    .withMessage('Date de départ invalide (format: YYYY-MM-DD)'),
  query('guestCount')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Nombre d\'invités invalide (1-10)'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Prix minimum invalide'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Prix maximum invalide'),
  query('sortBy')
    .optional()
    .isIn(['price_asc', 'price_desc', 'rating', 'capacity', 'surface', 'featured'])
    .withMessage('Critère de tri invalide')
];

const validateReview = [
  body('ratings.overall')
    .isInt({ min: 1, max: 5 })
    .withMessage('La note générale doit être comprise entre 1 et 5'),
  body('ratings.cleanliness')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Note propreté invalide (1-5)'),
  body('ratings.comfort')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Note confort invalide (1-5)'),
  body('ratings.location')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Note emplacement invalide (1-5)'),
  body('ratings.service')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Note service invalide (1-5)'),
  body('ratings.valueForMoney')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Note rapport qualité-prix invalide (1-5)'),
  body('review')
    .isLength({ min: 10, max: 1000 })
    .withMessage('L\'avis doit contenir entre 10 et 1000 caractères')
    .trim(),
  body('reservationId')
    .optional()
    .isMongoId()
    .withMessage('ID de réservation invalide'),
  body('stayDuration')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Durée de séjour invalide'),
  body('travelType')
    .optional()
    .isIn(['Business', 'Leisure', 'Family', 'Couple', 'Solo', 'Group'])
    .withMessage('Type de voyage invalide')
];

const validateBooking = [
  body('checkIn')
    .isISO8601()
    .withMessage('Date d\'arrivée invalide'),
  body('checkOut')
    .isISO8601()
    .withMessage('Date de départ invalide'),
  body('guestCount')
    .isInt({ min: 1, max: 10 })
    .withMessage('Nombre d\'invités invalide (1-10)'),
  body('guestDetails.name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nom de l\'invité principal requis (2-100 caractères)')
    .trim(),
  body('guestDetails.email')
    .optional()
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('guestDetails.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Numéro de téléphone invalide'),
  body('additionalInfo')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Informations supplémentaires trop longues (max 500 caractères)')
    .trim()
];

const validateRoomData = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Le titre doit contenir entre 5 et 200 caractères')
    .trim(),
  body('type')
    .isIn([
      'Single Room', 'Double Room', 'Twin Room', 'Suite Junior', 
      'Suite Executive', 'Suite Présidentielle', 'Chambre Familiale',
      'Chambre Deluxe', 'Chambre Standard', 'Studio', 'Appartement'
    ])
    .withMessage('Type de chambre invalide'),
  body('description')
    .isLength({ min: 50, max: 1500 })
    .withMessage('La description doit contenir entre 50 et 1500 caractères')
    .trim(),
  body('hotelId')
    .isMongoId()
    .withMessage('ID d\'hôtel invalide')
];

// ===== ROUTES PUBLIQUES =====

/**
 * GET /rooms/hotel/:hotelId
 * Récupérer toutes les chambres d'un hôtel
 */
router.get('/hotel/:hotelId', 
  validateHotelId,
  roomController.getRoomsByHotel
);

/**
 * GET /rooms/:roomId
 * Récupérer les détails d'une chambre
 */
router.get('/:roomId', 
  validateRoomId,
  roomController.getRoomById
);

/**
 * GET /rooms/search/available
 * Rechercher chambres disponibles
 */
router.get('/search/available', 
  validateAvailabilitySearch,
  roomController.searchAvailableRooms
);

/**
 * GET /rooms/search/general
 * Recherche générale de chambres
 */
router.get('/search/general', 
  [
    query('query')
      .isLength({ min: 2, max: 100 })
      .withMessage('Le terme de recherche doit contenir entre 2 et 100 caractères')
      .trim(),
    query('hotelId')
      .optional()
      .isMongoId()
      .withMessage('ID d\'hôtel invalide'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Prix minimum invalide'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Prix maximum invalide'),
    query('capacity')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Capacité invalide'),
    query('roomType')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Type de chambre invalide'),
    query('sortBy')
      .optional()
      .isIn(['rating', 'price_asc', 'price_desc', 'capacity', 'name', 'newest'])
      .withMessage('Critère de tri invalide'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limite invalide (1-50)')
  ],
  roomController.searchRooms
);

/**
 * GET /rooms/featured/list
 * Récupérer chambres recommandées
 */
router.get('/featured/list', 
  [
    query('hotelId')
      .optional()
      .isMongoId()
      .withMessage('ID d\'hôtel invalide'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limite invalide (1-20)')
  ],
  roomController.getFeaturedRooms
);

// ===== ROUTES AUTHENTIFIÉES =====

/**
 * POST /rooms/:roomId/reviews
 * Ajouter un avis sur une chambre
 */
router.post('/:roomId/reviews', 
  verifyToken,
  validateRoomId,
  validateReview,
  roomController.submitRoomReview
);

/**
 * POST /rooms/:roomId/favorite
 * Ajouter/retirer une chambre des favoris
 */
router.post('/:roomId/favorite', 
  verifyToken,
  validateRoomId,
  roomController.toggleRoomFavorite
);

/**
 * POST /rooms/:roomId/book
 * Créer une réservation
 */
router.post('/:roomId/book', 
  verifyToken,
  validateRoomId,
  validateBooking,
  roomController.createRoomBooking
);

/**
 * GET /rooms/favorites/my-list
 * Récupérer les chambres favorites de l'utilisateur connecté
 */
router.get('/favorites/my-list', 
  verifyToken,
  [
    query('sortBy')
      .optional()
      .isIn(['dateAdded', 'price_asc', 'price_desc', 'rating', 'capacity'])
      .withMessage('Critère de tri invalide')
  ],
  roomController.getUserFavoriteRooms
);


// ===== ROUTES ADMINISTRATEUR =====

/**
 * POST /rooms/admin/create
 * Créer une nouvelle chambre
 */
router.post('/admin/create', 
  verifyTokenForUpload,
  checkRole(['superAdmin', 'maintenancier', 'hotelManager']),
  upload.array('images', 10),
  validateRoomData,
  roomController.createOrUpdateRoom
);

/**
 * PUT /rooms/admin/:roomId
 * Modifier une chambre existante
 */
router.put('/admin/:roomId', 
  verifyTokenForUpload,
  checkRole(['superAdmin', 'maintenancier', 'hotelManager']),
  validateRoomId,
  upload.array('images', 10),
  validateRoomData,
  roomController.createOrUpdateRoom
);

/**
 * DELETE /rooms/admin/:roomId
 * Supprimer une chambre
 */
router.delete('/admin/:roomId', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier', 'hotelManager']),
  validateRoomId,
  roomController.deleteRoom
);

/**
 * GET /rooms/admin/list
 * Liste des chambres pour administration
 */
router.get('/admin/list', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier', 'hotelManager']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Numéro de page invalide'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite par page invalide (1-100)'),
    query('hotelId')
      .optional()
      .isMongoId()
      .withMessage('ID d\'hôtel invalide'),
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'maintenance', 'renovation'])
      .withMessage('Statut invalide'),
    query('roomType')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Type de chambre invalide'),
    query('sortBy')
      .optional()
      .isIn(['updatedAt', 'createdAt', 'title', 'type', 'rating', 'price', 'bookings'])
      .withMessage('Critère de tri invalide')
  ],
  roomController.getAdminRoomsList
);

/**
 * GET /rooms/admin/stats
 * Statistiques des chambres
 */
router.get('/admin/stats', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier', 'hotelManager']),
  [
    query('hotelId')
      .optional()
      .isMongoId()
      .withMessage('ID d\'hôtel invalide')
  ],
  roomController.getRoomsStats
);

/**
 * POST /rooms/admin/sync
 * Synchroniser données des chambres
 */
router.post('/admin/sync', 
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  roomController.syncRoomData
);

// ===== GESTION D'ERREURS MULTER =====
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux. Taille maximale: 10MB'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Trop de fichiers. Maximum: 10 images'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Champ de fichier inattendu'
      });
    }
  }
  
  if (error.message === 'Seuls les fichiers image sont autorisés') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;
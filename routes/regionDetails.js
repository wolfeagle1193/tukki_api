const express = require('express');
const router = express.Router();
const regionDetailsController = require('../controllers/regionDetailsController');
const { verifyToken, verifyTokenForUpload } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');
const { 
  uploadCommunityPhotoWithErrorHandling,
  uploadRegionDetailsWithErrorHandling 
} = require('../middlewares/uploads');

// =====================================================================
// 🔧 MIDDLEWARE DE VALIDATION
// =====================================================================

// Middleware pour valider les paramètres de région
const validateRegionParams = (req, res, next) => {
  const { region_id } = req.params;
  
  if (!region_id || region_id.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'ID de région requis'
    });
  }
  
  next();
};

// =====================================================================
// 📖 ROUTES PUBLIQUES
// =====================================================================

// Route publique pour obtenir les détails d'une région
router.get('/getDetails/:id', verifyToken, regionDetailsController.getRegionDetails);

// =====================================================================
// 💖 ROUTES FAVORIS - UTILISATEURS AUTHENTIFIÉS
// =====================================================================

// Récupérer les régions favorites de l'utilisateur connecté
router.get(
  '/favorites', 
  verifyToken, 
  regionDetailsController.getUserFavoriteRegions
);

// Toggle favori pour une région spécifique
router.post(
  '/:region_id/favorite', 
  verifyToken, 
  //validateRegionParams, 
  regionDetailsController.toggleRegionFavorite
);

// Vérifier si une région est en favori pour l'utilisateur connecté
router.get(
  '/:region_id/favorite/status', 
  verifyToken, 
  validateRegionParams, 
  regionDetailsController.checkRegionFavoriteStatus
);

// Statistiques des favoris d'une région
router.get(
  '/:region_id/favorite/stats', 
  verifyToken, 
  validateRegionParams, 
  regionDetailsController.getRegionFavoritesStats
);

// =====================================================================
// 👥 ROUTES PROTÉGÉES - UTILISATEURS AUTHENTIFIÉS
// =====================================================================

// Ajouter une photo communautaire
router.post(
  '/:region_id/addPhoto',
  verifyToken,
  validateRegionParams,
  uploadCommunityPhotoWithErrorHandling('photo'),
  regionDetailsController.addPhoto
);

// Ajouter un commentaire
router.post(
  '/:region_id/addComment',
  verifyToken,
  validateRegionParams,
  regionDetailsController.addComment
);

// Ajouter une réponse à un commentaire
router.post(
  '/:region_id/comment/:comment_id/reply',
  verifyToken,
  validateRegionParams,
  regionDetailsController.addReply
);

// Like/Unlike (commentaire, réponse ou photo)
router.post(
  '/:region_id/:type/:id/like',
  verifyToken,
  validateRegionParams,
  regionDetailsController.toggleLike
);



// =====================================================================
// 🗑️ ROUTES SUPPRESSION - UTILISATEURS AUTHENTIFIÉS
// =====================================================================

// Supprimer une photo communautaire (propriétaire uniquement)
router.delete(
  '/:region_id/photo/:photo_id',
  verifyToken, // Authentification requise
  validateRegionParams, // Validation de l'ID région
  regionDetailsController.deleteSharedPhoto
);

// =====================================================================
// 🖼️ ROUTES GALERIE - ADMIN/MAINTENANCIER
// =====================================================================

// Upload images galerie (jusqu'à 5 images)
router.post(
  '/gallery/upload',
  verifyTokenForUpload,
  checkRole(['superAdmin', 'maintenancier']),
  (req, res, next) => {
    // Configuration upload pour galerie (max 5 images)
    const uploadMiddleware = uploadRegionDetailsWithErrorHandling();
    
    if (typeof uploadMiddleware !== 'function') {
      console.error('❌ Middleware upload galerie non configuré');
      return res.status(500).json({
        success: false,
        message: 'Erreur configuration upload galerie'
      });
    }
    
    uploadMiddleware(req, res, next);
  },
  regionDetailsController.uploadGalleryImages
);

// Supprimer une image de la galerie
router.delete(
  '/gallery/:region_id/:image_url',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  validateRegionParams,
  regionDetailsController.deleteGalleryImage
);

// Lister les images de la galerie
router.get(
  '/gallery/:region_id',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  validateRegionParams,
  regionDetailsController.getGalleryImages
);

// =====================================================================
// 🛠️ ROUTES ADMIN UNIQUEMENT
// =====================================================================

// ROUTE PRINCIPALE - CRÉATION/MISE À JOUR RÉGION
router.post(
  '/createOrUpdate',
  // Middleware 1: Vérification token pour upload
  verifyTokenForUpload,
  
  // Middleware 2: Vérification rôle admin
  checkRole(['superAdmin', 'maintenancier']),
  
  // Middleware 3: Upload avec gestion d'erreurs
  (req, res, next) => {
    console.log('🔄 Configuration middleware upload région...');
    
    // Vérifier que la fonction d'upload existe
    if (typeof uploadRegionDetailsWithErrorHandling !== 'function') {
      console.error('❌ uploadRegionDetailsWithErrorHandling non disponible');
      return res.status(500).json({
        success: false,
        message: 'Erreur de configuration du middleware d\'upload'
      });
    }
    
    // Configurer le middleware d'upload
    const uploadMiddleware = uploadRegionDetailsWithErrorHandling();
    
    if (typeof uploadMiddleware !== 'function') {
      console.error('❌ Middleware upload retourné invalide');
      return res.status(500).json({
        success: false,
        message: 'Erreur de configuration du middleware d\'upload'
      });
    }
    
    console.log('✅ Middleware upload configuré avec succès');
    uploadMiddleware(req, res, next);
  },
  
  // Middleware 4: Controller final
  regionDetailsController.createOrUpdateRegionDetails
);

// =====================================================================
// 🧹 ROUTES DE MAINTENANCE ET DEBUG
// =====================================================================

// Nettoyage d'urgence galerie
router.delete(
  '/emergency-cleanup/:regionId',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  regionDetailsController.emergencyCleanup
);

// Route de diagnostic général
router.get(
  '/diagnostic',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  (req, res) => {
    res.json({
      success: true,
      message: 'Diagnostic RegionDetails',
      data: {
        version: '2.1-EPURE-FAVORIS',
        features: {
          galerie: 'Disponible',
          communaute: 'Disponible',
          commentaires: 'Disponible',
          services: 'Disponible',
          favoris: 'Disponible ✅',
          placesPopulaires: 'SUPPRIMÉES'
        },
        routes: {
          total: router.stack.length,
          admin: ['createOrUpdate', 'gallery/*', 'emergency-cleanup'],
          public: ['getDetails'],
          community: ['addPhoto', 'addComment', 'reply', 'like'],
          favorites: ['favorites', 'favorite', 'favorite/status', 'favorite/stats']
        },
        timestamp: new Date().toISOString()
      }
    });
  }
);

// Route de santé (health check)
router.get(
  '/health',
  (req, res) => {
    res.json({
      success: true,
      service: 'RegionDetails',
      status: 'healthy',
      version: '2.1-EPURE-FAVORIS',
      timestamp: new Date().toISOString(),
      features: {
        placesPopulaires: false, // Confirmé: supprimées
        galerie: true,
        communaute: true,
        commentaires: true,
        favoris: true // NOUVEAU
      }
    });
  }
);

// =====================================================================
// ❌ MIDDLEWARE DE GESTION D'ERREURS
// =====================================================================

router.use((err, req, res, next) => {
  console.error('❌ === ERREUR ROUTES REGION DETAILS ===');
  console.error('Type:', err.name || 'Unknown');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  
  // Gestion spécifique des erreurs de fichier
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux',
      error: 'FILE_TOO_LARGE',
      maxSize: '10MB'
    });
  }
  
  // Erreurs multer (upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux',
      error: 'FILE_SIZE_LIMIT_EXCEEDED',
      maxSize: '10MB'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Trop de fichiers',
      error: 'TOO_MANY_FILES',
      maxFiles: 5
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Champ de fichier inattendu',
      error: 'UNEXPECTED_FILE_FIELD'
    });
  }
  
  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      error: 'VALIDATION_ERROR',
      details: err.message
    });
  }
  
  // Erreur de base de données
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      message: 'Erreur de base de données',
      error: 'DATABASE_ERROR'
    });
  }
  
  // Erreur d'authentification
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
      error: 'UNAUTHORIZED'
    });
  }
  
  // Erreur de permission
  if (err.status === 403) {
    return res.status(403).json({
      success: false,
      message: 'Permissions insuffisantes',
      error: 'FORBIDDEN'
    });
  }
  
  // Erreur générale
  console.error('❌ Erreur non gérée:', err);
  return res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  });
});

// =====================================================================
// 📋 EXPORT ET LOGGING
// =====================================================================

console.log('✅ === ROUTES REGION DETAILS + FAVORIS CHARGÉES ===');
console.log('🔧 Routes disponibles:');
console.log('  📖 GET  /getDetails/:id - Lecture détails région');
console.log('  💖 GET  /favorites - Mes régions favorites');
console.log('  💖 POST /:region_id/favorite - Toggle favori région');
console.log('  💖 GET  /:region_id/favorite/status - Statut favori');
console.log('  💖 GET  /:region_id/favorite/stats - Stats favoris région');
console.log('  📸 POST /:region_id/addPhoto - Ajouter photo communauté');
console.log('  💬 POST /:region_id/addComment - Ajouter commentaire');
console.log('  ↪️  POST /:region_id/comment/:comment_id/reply - Répondre');
console.log('  ❤️  POST /:region_id/:type/:id/like - Like/Unlike');
console.log('  🖼️  POST /gallery/upload - Upload images galerie');
console.log('  🗑️  DELETE /gallery/:region_id/:image_url - Supprimer image');
console.log('  📋 GET  /gallery/:region_id - Lister images galerie');
console.log('  🛠️  POST /createOrUpdate - Créer/Modifier région');
console.log('  🧹 DELETE /emergency-cleanup/:regionId - Nettoyage urgence');
console.log('  🔍 GET  /diagnostic - Diagnostic système');
console.log('  ❤️  GET  /health - Santé du service');
console.log('  ✅ NOUVEAU: Système de favoris intégré');
console.log('  ❌ Places populaires: SUPPRIMÉES COMPLÈTEMENT');

module.exports = router;
const express = require('express');
const router = express.Router();
const treasureDetailsController = require('../controllers/treasureDetailsController');
const { verifyToken } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');
const { 
  uploadWithErrorHandling, 
  uploadCommunityPhotoWithErrorHandling 
} = require('../middlewares/uploads');

// =====================================================================
// 📖 ROUTES PUBLIQUES (LECTURE SEULE)
// =====================================================================

// Route pour obtenir les détails d'un trésor
// Authentification requise pour la gestion des favoris et likes
router.get('/getDetails/:id', verifyToken, treasureDetailsController.getTreasureDetails);

// =====================================================================
// 💖 ROUTES FAVORIS - UTILISATEURS AUTHENTIFIÉS
// =====================================================================

// Toggle favori (ajouter/retirer un trésor des favoris)
router.post(
  '/:treasure_id/favorite',
  verifyToken, // Authentification requise
  treasureDetailsController.toggleTreasureFavorite
);

// Vérifier le statut de favori d'un trésor
router.get(
  '/:treasure_id/favorites/status',
  verifyToken, // Authentification requise
  treasureDetailsController.checkTreasureFavoriteStatus
);



// Liste des trésors favoris de l'utilisateur connecté
router.get(
  '/favorites/user',
  verifyToken, // Authentification requise
  treasureDetailsController.getUserFavoriteTreasures
);

// =====================================================================
// 📸 ROUTES COMMUNAUTÉ - UTILISATEURS AUTHENTIFIÉS
// =====================================================================

// Ajouter une photo communautaire
router.post(
  '/:treasure_id/addPhoto',
  verifyToken, // Authentification requise
  uploadCommunityPhotoWithErrorHandling('photo'), // Upload avec validation
  treasureDetailsController.addPhoto
);

// Ajouter un commentaire
router.post(
  '/:treasure_id/addComment',
  verifyToken, // Authentification requise
  treasureDetailsController.addComment
);

// Ajouter une réponse à un commentaire
router.post(
  '/:treasure_id/comment/:comment_id/reply',
  verifyToken, // Authentification requise
  treasureDetailsController.addReply
);

// Like/Unlike (commentaire, réponse ou photo)
router.post(
  '/:treasure_id/:type/:id/like',
  verifyToken, // Authentification requise
  treasureDetailsController.toggleLike
);

// Supprimer une photo communautaire (propriétaire uniquement)
router.delete(
  '/:treasure_id/photo/:photo_id',
  verifyToken, // Authentification requise
  treasureDetailsController.deleteSharedPhoto
);

// =====================================================================
// 🔧 ROUTES ADMINISTRATION - ADMIN UNIQUEMENT
// =====================================================================

// Créer ou mettre à jour les détails d'un trésor
router.post(
  '/createOrUpdate',
  verifyToken, // Authentification requise
  checkRole(['superAdmin', 'maintenancier']), // Vérification du rôle
  uploadWithErrorHandling('gallery', true), // Upload multiple pour galerie
  treasureDetailsController.createOrUpdateTreasureDetails
);

// =====================================================================
// 🔧 ROUTES UTILITAIRES FAVORIS - ADMIN OU UTILISATEUR
// =====================================================================

// Récupérer TOUS les favoris d'un utilisateur (trésors + régions)
// Route utilitaire pour dashboard utilisateur
router.get(
  '/favorites/all',
  verifyToken, // Authentification requise
  treasureDetailsController.getUserAllFavorites
);

// Supprimer tous les favoris d'un utilisateur (fonctionnalité de nettoyage)
{/*router.delete(
  '/favorites/clear',
  verifyToken, // Authentification requise
  treasureDetailsController.clearUserFavorites
);*/}

// =====================================================================
// 📊 ROUTES STATISTIQUES - ADMIN UNIQUEMENT
// =====================================================================

// Statistiques globales des favoris (dashboard admin)
router.get(
  '/favorites/stats/global',
  verifyToken, // Authentification requise
  checkRole(['superAdmin', 'maintenancier']), // Admin uniquement
  treasureDetailsController.getFavoritesGlobalStats
);

// =====================================================================
// 🛠️ MIDDLEWARE DE GESTION D'ERREURS SPÉCIFIQUE
// =====================================================================

router.use((err, req, res, next) => {
  console.error('❌ Erreur dans treasureDetailsRoutes:', err);
  
  // Gestion spécifique pour les fichiers trop volumineux
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Le fichier est trop volumineux. Taille maximale autorisée dépassée.',
      error: 'FILE_TOO_LARGE'
    });
  }
  
  // Gestion des erreurs d'upload
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Le fichier dépasse la taille maximale autorisée.',
      error: 'FILE_SIZE_EXCEEDED'
    });
  }
  
  // Gestion des erreurs d'authentification
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification invalide.',
      error: 'INVALID_TOKEN'
    });
  }
  
  // Gestion des erreurs de validation Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides fournies.',
      error: 'VALIDATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // Gestion des erreurs de cast MongoDB (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID de trésor invalide fourni.',
      error: 'INVALID_ID'
    });
  }
  
  // Erreur générale
  return res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur. Veuillez réessayer plus tard.',
    error: process.env.NODE_ENV === 'development' ? err.message : 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
});

module.exports = router

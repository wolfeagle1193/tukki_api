// routes/hotelRoutes.js
const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/HotelDetailsController');
const HotelValidation = require('../middlewares/hotelValidation');
const { verifyToken, verifyTokenForUpload } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');

const multer = require('multer');
const path = require('path');

// Configuration multer (même pattern que popularPlaces)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp/'); // Dossier temporaire
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'), false);
        }
    }
});

// Import validation si vous en avez un (optionnel)
// const HotelValidation = require('../middlewares/hotelValidation');

// ===== ROUTES PUBLIQUES/UTILISATEUR =====


router.get(
  '/favorites',
  verifyToken,
  HotelValidation.validateGetUserFavorites || [],
  hotelController.getUserFavoriteHotels
)

/**
 * Récupérer tous les hôtels (scroll mobile)
 * GET /api/hotels?sortBy=averageRating&minRating=3&minPrice=5000&maxPrice=50000&hasRooms=true
 */
router.get(
  '/',
  verifyToken,
  hotelController.getAllHotels
);

/**
 * Récupérer hôtels par région
 * GET /api/hotels/region/:regionName?sortBy=price_asc&minRating=4&hasRooms=true
 */
router.get(
  '/region/:regionName',
  verifyToken,
  hotelController.getHotelsByRegion
);

/**
 * Récupérer détails d'un hôtel par ID
 * GET /api/hotels/:hotelId
 */
router.get(
  '/:hotelId',
  verifyToken,
  hotelController.getHotelById
);

/**
 * Rechercher des hôtels
 * GET /api/hotels/search?query=terrou&region_Name=dakar&minRating=3&minPrice=10000
 */
router.get(
  '/search',
  verifyToken,
  hotelController.searchHotels
);

/**
 * Ajouter un avis à un hôtel
 * POST /api/hotels/:hotelId/review
 * Body: { rating: 5, review: "Excellent service!" }
 */
router.post(
  '/:hotelId/reviews',
  verifyToken,
  HotelValidation.validateReview, 
  hotelController.submitHotelReview
);

/**
 * Toggle favoris d'un hôtel
 * POST /api/hotels/:hotelId/favorite
 */
router.post(
  '/:hotelId/favorite',
  verifyToken,
  hotelController.toggleHotelFavorite
);

// ===== ROUTES ADMIN/MAINTENANCIER UNIQUEMENT =====

/**
 * Créer ou mettre à jour les détails complets d'un hôtel
 * POST /api/hotels/admin/create-or-update
 * Body: FormData avec images + { title, description, location, region_Name, coordinates, price, availability, ... }
 */
router.post(
  '/admin/create-or-update',
  verifyTokenForUpload,
  checkRole(['superAdmin', 'maintenancier']),
  upload.array('images', 15), // Jusqu'à 15 images pour les hôtels
  HotelValidation.validateCreateOrUpdate, 
  hotelController.createOrUpdateHotelDetails
);

/**
 * Lister tous les hôtels pour l'administration
 * GET /api/hotels/admin/list?page=1&limit=20&region_Name=dakar&hasFullDetails=true&sortBy=updatedAt
 */
router.get(
  '/admin/list',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  hotelController.getAdminHotelsList
);

/**
 * Supprimer un hôtel (soft delete)
 * DELETE /api/hotels/admin/:hotelId
 */
router.delete(
  '/admin/:hotelId',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  hotelController.deleteHotelDetails
);

/**
 * Restaurer un hôtel supprimé
 * POST /api/hotels/admin/:hotelId/restore
 */
router.post(
  '/admin/:hotelId/restore',
  verifyToken,
  checkRole(['superAdmin']),
  hotelController.restoreHotelDetails
);

/**
 * Obtenir les statistiques des hôtels
 * GET /api/hotels/admin/stats
 */
router.get(
  '/admin/stats',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  hotelController.getHotelsStats
);

/**
 * Obtenir la liste des hôtels supprimés
 * GET /api/hotels/admin/deleted?page=1&limit=20
 */
router.get(
  '/admin/deleted',
  verifyToken,
  checkRole(['superAdmin']),
  hotelController.getDeletedHotels
);

/**
 * Synchroniser les données des hôtels
 * POST /api/hotels/admin/sync-data
 */
router.post(
  '/admin/sync-data',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  hotelController.syncHotelData
);

// ===== ROUTES DE MAINTENANCE (ADMIN UNIQUEMENT) =====

/**
 * Réparer les données incohérentes des hôtels
 * POST /api/hotels/maintenance/repair
 */
router.post(
  '/maintenance/repair',
  verifyToken,
  checkRole(['superAdmin']),
  async (req, res) => {
    try {
      console.log('🔧 Début de la réparation des données hôtels...');
      
      const HotelDetails = require('../models/Hotel');
      
      const hotels = await HotelDetails.find({ isActive: true });
      let repaired = 0;
      
      for (const hotel of hotels) {
        let hasChanges = false;
        
        // Recalculer les ratings
        const oldRating = hotel.averageRating;
        hotel.calculateAverageRating();
        
        if (Math.abs(oldRating - hotel.averageRating) > 0.01) {
          hasChanges = true;
        }
        
        // Vérifier la cohérence des compteurs de favoris
        const actualFavoritesCount = hotel.favoritedBy ? hotel.favoritedBy.length : 0;
        if (hotel.favoritesCount !== actualFavoritesCount) {
          hotel.favoritesCount = actualFavoritesCount;
          hasChanges = true;
        }
        
        // Vérifier la structure des prix
        if (hotel.price && (!hotel.price.minPrice || !hotel.price.maxPrice)) {
          if (!hotel.price.minPrice && hotel.price.maxPrice) {
            hotel.price.minPrice = hotel.price.maxPrice;
            hasChanges = true;
          } else if (hotel.price.minPrice && !hotel.price.maxPrice) {
            hotel.price.maxPrice = hotel.price.minPrice;
            hasChanges = true;
          }
        }
        
        if (hasChanges) {
          await hotel.save();
          repaired++;
          console.log(`✅ Réparé: ${hotel.title}`);
        }
      }
      
      console.log(`🎉 Réparation terminée: ${repaired} hôtels corrigés`);
      
      return res.json({
        success: true,
        message: `Réparation terminée: ${repaired} hôtels corrigés`,
        data: { repaired }
      });
      
    } catch (error) {
      console.error('❌ Erreur réparation hôtels:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la réparation"
      });
    }
  }
);

/**
 * Vérifier l'intégrité des données des hôtels
 * GET /api/hotels/maintenance/verify
 */
router.get(
  '/maintenance/verify',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      const HotelDetails = require('../models/Hotel');
      
      console.log('🔍 Vérification de l\'intégrité des données hôtels...');
      
      const issues = [];
      const hotels = await HotelDetails.find({ isActive: true });
      
      for (const hotel of hotels) {
        // Vérifier la structure des prix
        if (!hotel.price || !hotel.price.minPrice || !hotel.price.maxPrice) {
          issues.push({
            type: 'invalid_price_structure',
            hotelId: hotel._id,
            hotelTitle: hotel.title,
            currentPrice: hotel.price
          });
        }
        
        // Vérifier les coordonnées
        if (!hotel.coordinates || !hotel.coordinates.latitude || !hotel.coordinates.longitude) {
          issues.push({
            type: 'missing_coordinates',
            hotelId: hotel._id,
            hotelTitle: hotel.title
          });
        }
        
        // Vérifier la disponibilité
        if (!hotel.availability || !hotel.availability.start || !hotel.availability.end) {
          issues.push({
            type: 'missing_availability',
            hotelId: hotel._id,
            hotelTitle: hotel.title
          });
        }
        
        // Vérifier la cohérence des statistiques
        const actualReviewsCount = hotel.reviews ? hotel.reviews.length : 0;
        if (hotel.totalReviews !== actualReviewsCount) {
          issues.push({
            type: 'reviews_count_mismatch',
            hotelId: hotel._id,
            hotelTitle: hotel.title,
            storedCount: hotel.totalReviews,
            actualCount: actualReviewsCount
          });
        }
        
        // Vérifier les champs obligatoires
        const requiredFields = ['title', 'description', 'location', 'region_Name'];
        for (const field of requiredFields) {
          if (!hotel[field] || hotel[field].trim().length === 0) {
            issues.push({
              type: 'missing_required_field',
              hotelId: hotel._id,
              hotelTitle: hotel.title,
              missingField: field
            });
          }
        }
      }
      
      console.log(`✅ Vérification terminée: ${issues.length} problèmes détectés`);
      
      return res.json({
        success: true,
        data: {
          totalChecked: hotels.length,
          issuesFound: issues.length,
          issues: issues
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur vérification hôtels:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification"
      });
    }
  }
);

/**
 * Mise à jour automatique des statuts hasFullDetails
 * POST /api/hotels/maintenance/update-completion-status
 */
router.post(
  '/maintenance/update-completion-status',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      console.log('🔄 Mise à jour des statuts de complétion...');
      
      const HotelDetails = require('../models/HotelDetails');
      const { calculateHotelCompletionStatus } = require('../controllers/HotelDetailsController');
      
      const hotels = await HotelDetails.find({ isActive: true });
      let updated = 0;
      
      for (const hotel of hotels) {
        const completionStatus = calculateHotelCompletionStatus(hotel);
        const shouldHaveFullDetails = completionStatus.percentage >= 80;
        
        if (hotel.hasFullDetails !== shouldHaveFullDetails) {
          hotel.hasFullDetails = shouldHaveFullDetails;
          await hotel.save();
          updated++;
          console.log(`✅ Statut mis à jour: ${hotel.title} - ${completionStatus.percentage}%`);
        }
      }
      
      console.log(`🎉 Mise à jour terminée: ${updated} hôtels mis à jour`);
      
      return res.json({
        success: true,
        message: `Mise à jour terminée: ${updated} hôtels mis à jour`,
        data: { 
          updated,
          totalProcessed: hotels.length 
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur mise à jour statuts:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour des statuts"
      });
    }
  }
);

/**
 * Nettoyage d'urgence des hôtels avec données corrompues
 * DELETE /api/hotels/maintenance/emergency-cleanup
 * Body: { confirm: 'YES_CLEANUP_CORRUPTED_HOTELS' }
 */
router.delete(
  '/maintenance/emergency-cleanup',
  verifyToken,
  checkRole(['superAdmin']),
  async (req, res) => {
    try {
      const { confirm } = req.body;
      
      if (confirm !== 'YES_CLEANUP_CORRUPTED_HOTELS') {
        return res.status(400).json({
          success: false,
          message: "Confirmation requise. Utilisez: { confirm: 'YES_CLEANUP_CORRUPTED_HOTELS' }"
        });
      }
      
      console.log('🚨 NETTOYAGE D\'URGENCE - Suppression des hôtels corrompus...');
      
      const HotelDetails = require('../models/Hotel');
      const corruptedHotels = [];
      const hotels = await HotelDetails.find({ isActive: true });
      
      for (const hotel of hotels) {
        let isCorrupted = false;
        
        // Critères de corruption
        if (!hotel.title || hotel.title.trim().length === 0) isCorrupted = true;
        if (!hotel.description || hotel.description.trim().length < 10) isCorrupted = true;
        if (!hotel.region_Name || hotel.region_Name.trim().length === 0) isCorrupted = true;
        if (!hotel.price || (!hotel.price.minPrice && !hotel.price.maxPrice)) isCorrupted = true;
        
        if (isCorrupted) {
          corruptedHotels.push(hotel);
        }
      }
      
      // Supprimer les hôtels corrompus
      for (const hotel of corruptedHotels) {
        hotel.isActive = false;
        hotel.lastEditedBy = {
          userId: req.user.id,
          role: req.user.role,
          username: req.user.username,
          editedAt: new Date()
        };
        await hotel.save();
      }
      
      console.log(`🧹 Nettoyage terminé: ${corruptedHotels.length} hôtels corrompus supprimés`);
      
      return res.json({
        success: true,
        message: `Nettoyage terminé: ${corruptedHotels.length} hôtels corrompus supprimés`,
        data: {
          corruptedHotelsRemoved: corruptedHotels.length,
          corruptedHotels: corruptedHotels.map(h => ({
            id: h._id,
            title: h.title,
            region: h.region_Name
          }))
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur nettoyage d\'urgence hôtels:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors du nettoyage"
      });
    }
  }
);

/**
 * Recalculer toutes les statistiques des hôtels
 * POST /api/hotels/maintenance/recalculate-stats
 */
router.post(
  '/maintenance/recalculate-stats',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      console.log('📊 Recalcul de toutes les statistiques hôtels...');
      
      const HotelDetails = require('../models/HotelDetails');
      const hotels = await HotelDetails.find({ isActive: true });
      
      let processed = 0;
      
      for (const hotel of hotels) {
        // Recalculer ratings et compteurs
        hotel.calculateAverageRating();
        
        // Recalculer compteur favoris
        hotel.favoritesCount = hotel.favoritedBy ? hotel.favoritedBy.length : 0;
        
        // Recalculer compteur vues (garder existant)
        hotel.viewsCount = hotel.viewsCount || 0;
        
        await hotel.save();
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`📊 Traité: ${processed}/${hotels.length} hôtels`);
        }
      }
      
      console.log(`🎉 Recalcul terminé: ${processed} hôtels traités`);
      
      return res.json({
        success: true,
        message: `Recalcul terminé: ${processed} hôtels traités`,
        data: { processed }
      });
      
    } catch (error) {
      console.error('❌ Erreur recalcul statistiques:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors du recalcul des statistiques"
      });
    }
  }
);

// ===== MIDDLEWARE DE GESTION D'ERREURS SPÉCIFIQUE =====
router.use((err, req, res, next) => {
  console.error('❌ Erreur dans hotelRoutes:', err);
  
  // Gestion spécifique pour les erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Gestion spécifique pour les erreurs de cast (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID d\'hôtel invalide'
    });
  }
  
  // Gestion spécifique pour les erreurs de duplication
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Cet hôtel existe déjà'
    });
  }
  
  // Gestion spécifique pour les fichiers trop volumineux
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Le fichier est trop volumineux'
    });
  }
  
  // Gestion spécifique pour les erreurs Multer
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Fichier trop volumineux (max 10MB par image)'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({
        success: false,
        message: 'Trop d\'images (max 15 images)'
      });
    }
  }
  
  // Erreur générale
  return res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
  });
});

module.exports = router;
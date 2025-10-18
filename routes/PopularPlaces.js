// routes/popularPlaces.js - CORRIGÉ
const express = require('express');
const router = express.Router();
const popularPlaceController = require('../controllers/popularPlaceController');
const { verifyToken, verifyTokenForUpload } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');

const multer = require('multer');
const path = require('path');

// Configuration multer (même pattern que treasures)
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

// ✅ CORRECTION : Import direct de la classe
const PopularPlaceValidation = require('../middlewares/popularPlaceValidation');
router.get(
  '/region/:regionId/place/:placeId',
  verifyToken, // Utilisateur connecté requis
  popularPlaceController.getPlaceByOriginalId
);

//mple: GET /api/popular-places/region/dakar?sortBy=rating&hasFullDetails=true
 
/*router.get(
  '/region/:regionId',
  verifyToken,
  popularPlaceController.getPlacesByRegion
);*/
router.get(
  '/region/:regionId',
  verifyToken,
  popularPlaceController.getPopularPlacesByRegion
);

router.get(
  '/search',
  verifyToken,
  popularPlaceController.searchPlaces
);

router.post(
  '/:placeId/feedback',
  verifyToken,
  ...PopularPlaceValidation.validateFeedback, // ✅ CORRECTION : Spread l'array
  popularPlaceController.submitFeedback
);

router.post(
  '/:placeId/favorite',
  verifyToken,
  popularPlaceController.toggleFavorite
);


/**
 * GET /popular-places/favorites/my-list
 * Récupérer les lieux populaires favoris de l'utilisateur connecté
 */
router.get('/favorites/my-list', 
  verifyToken,
  popularPlaceController.getUserFavoritePlaces
);

router.post(
  '/:placeId/reviews/:reviewId/helpful',
  verifyToken,
  popularPlaceController.markReviewAsHelpful
);

// ===== ROUTES ADMIN/MAINTENANCIER UNIQUEMENT (DASHBOARD) =====

/**
 * Créer ou mettre à jour les détails complets d'un lieu
 * POST /api/popular-places/admin/create-or-update
 * Body: FormData avec images + { regionId, placeId, title, description, coordinates, ... }
 * CORRIGÉ : utilise placeId au lieu de originalPlaceId
 */
router.post(
  '/admin/create-or-update',
  // Middleware 1: Vérification token pour upload
  verifyTokenForUpload,
  
  // Middleware 2: Vérification rôle Admin/Maintenancier
  checkRole(['superAdmin', 'maintenancier']),
  
  // Middleware 3: Upload d'images (si configuré)
  // uploadPlaceImages(), // À ajouter si vous avez un middleware d'upload
   upload.array('images', 10), // ← AJOUTEZ CETTE LIGNE
  // Middleware 4: Validation des données
  //...PopularPlaceValidation.validateCreateOrUpdate, // ✅ CORRECTION : Spread l'array
  
  // Middleware 5: Contrôleur
  popularPlaceController.createOrUpdateDetails
);

/**
 * Lister tous les lieux pour l'administration
 * GET /api/popular-places/admin/list?page=1&limit=20&regionId=dakar&hasFullDetails=true&sortBy=updatedAt
 */
router.get(
  '/admin/list',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  popularPlaceController.getAdminPlacesList
);

/**
 * Supprimer un lieu (soft delete)
 * DELETE /api/popular-places/admin/:placeId
 */
router.delete(
  '/admin/:placeId',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  popularPlaceController.deletePlaceDetails
);

/**
 * Obtenir les statistiques des lieux
 * GET /api/popular-places/admin/stats
 */
router.get(
  '/admin/stats',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  popularPlaceController.getPlacesStats
);

/**
 * Synchroniser les données de base avec RegionDetails
 * POST /api/popular-places/admin/sync-basic-data
 */
router.post(
  '/admin/sync-basic-data',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  popularPlaceController.syncBasicData
);

// ===== ROUTES DE MAINTENANCE (ADMIN UNIQUEMENT) =====

/**
 * Réparer les données incohérentes
 * POST /api/popular-places/maintenance/repair
 */
router.post(
  '/maintenance/repair',
  verifyToken,
  checkRole(['superAdmin']),
  async (req, res) => {
    try {
      console.log('🔧 Début de la réparation des données...');
      
      const PopularPlace = require('../models/PopularPlace');
      
      // Exemple : Recalculer tous les ratings
      const places = await PopularPlace.find({ isActive: true });
      let repaired = 0;
      
      for (const place of places) {
        const oldRating = place.averageRating;
        place.calculateAverageRating();
        
        if (Math.abs(oldRating - place.averageRating) > 0.01) {
          await place.save();
          repaired++;
          console.log(`✅ Rating recalculé pour: ${place.title}`);
        }
      }
      
      console.log(`🎉 Réparation terminée: ${repaired} lieux corrigés`);
      
      return res.json({
        success: true,
        message: `Réparation terminée: ${repaired} lieux corrigés`,
        data: { repaired }
      });
      
    } catch (error) {
      console.error('❌ Erreur réparation:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la réparation"
      });
    }
  }
);

/**
 * Vérifier l'intégrité des données
 * GET /api/popular-places/maintenance/verify
 */
router.get(
  '/maintenance/verify',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      const PopularPlace = require('../models/PopularPlace');
      const RegionDetails = require('../models/RegionDetails');
      
      console.log('🔍 Vérification de l\'intégrité des données...');
      
      const issues = [];
      const places = await PopularPlace.find({ isActive: true });
      
      for (const place of places) {
        // Vérifier que la région existe
        const region = await RegionDetails.findById(place.regionDetailsId);
        if (!region) {
          issues.push({
            type: 'missing_region',
            placeId: place._id,
            placeTitle: place.title,
            regionId: place.regionDetailsId
          });
          continue;
        }
        
        // CORRIGÉ : Vérifier que la place existe dans RegionDetails.popularPlaces
        const basicPlace = region.popularPlaces?.find(p => 
          String(p.id) === String(place._id) // CORRIGÉ : utilise _id
        );
        
        if (!basicPlace) {
          issues.push({
            type: 'missing_basic_place',
            placeId: place._id,
            placeTitle: place.title,
            placeNumericId: place._id, // CORRIGÉ
            regionId: region.region_id
          });
        }
        
        // Vérifier la cohérence des ratings
        if (basicPlace && Math.abs(basicPlace.rating - place.averageRating) > 0.1) {
          issues.push({
            type: 'rating_mismatch',
            placeId: place._id,
            placeTitle: place.title,
            basicRating: basicPlace.rating,
            detailedRating: place.averageRating
          });
        }
      }
      
      console.log(`✅ Vérification terminée: ${issues.length} problèmes détectés`);
      
      return res.json({
        success: true,
        data: {
          totalChecked: places.length,
          issuesFound: issues.length,
          issues: issues
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur vérification:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification"
      });
    }
  }
);

/**
 * Nettoyage d'urgence
 * DELETE /api/popular-places/maintenance/emergency-cleanup
 * Body: { confirm: 'YES_DELETE_ALL_ORPHANED_PLACES' }
 */
router.delete(
  '/maintenance/emergency-cleanup',
  verifyToken,
  checkRole(['superAdmin']), // Uniquement super admin
  async (req, res) => {
    try {
      const { confirm } = req.body;
      
      if (confirm !== 'YES_DELETE_ALL_ORPHANED_PLACES') {
        return res.status(400).json({
          success: false,
          message: "Confirmation requise. Utilisez: { confirm: 'YES_DELETE_ALL_ORPHANED_PLACES' }"
        });
      }
      
      console.log('🚨 NETTOYAGE D\'URGENCE - Suppression des lieux orphelins...');
      
      const PopularPlace = require('../models/PopularPlace');
      const RegionDetails = require('../models/RegionDetails');
      
      const orphanedPlaces = [];
      const places = await PopularPlace.find({ isActive: true });
      
      for (const place of places) {
        const region = await RegionDetails.findById(place.regionDetailsId);
        
        if (!region) {
          orphanedPlaces.push(place);
        } else {
          // CORRIGÉ : Recherche par _id
          const basicPlace = region.popularPlaces?.find(p => 
            String(p.id) === String(place._id)
          );
          
          if (!basicPlace) {
            orphanedPlaces.push(place);
          }
        }
      }
      
      // Supprimer les lieux orphelins
      for (const place of orphanedPlaces) {
        place.isActive = false;
        place.lastEditedBy = {
          userId: req.user.id,
          role: req.user.role,
          username: req.user.username,
          editedAt: new Date()
        };
        await place.save();
      }
      
      console.log(`🧹 Nettoyage terminé: ${orphanedPlaces.length} lieux orphelins supprimés`);
      
      return res.json({
        success: true,
        message: `Nettoyage terminé: ${orphanedPlaces.length} lieux orphelins supprimés`,
        data: {
          orphanedPlacesRemoved: orphanedPlaces.length,
          orphanedPlaces: orphanedPlaces.map(p => ({
            id: p._id,
            title: p.title,
            numericId: p._id // CORRIGÉ
          }))
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur nettoyage d\'urgence:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors du nettoyage"
      });
    }
  }
);

/**
 * NOUVELLE ROUTE : Créer les lieux PopularPlace pour tous les lieux de base
 * POST /api/popular-places/maintenance/create-missing-places
 * Body: { regionId?: string, confirm: 'YES_CREATE_MISSING_PLACES' }
 */
router.post(
  '/maintenance/create-missing-places',
  verifyToken,
  checkRole(['superAdmin']),
  async (req, res) => {
    try {
      const { regionId, confirm } = req.body;
      
      if (confirm !== 'YES_CREATE_MISSING_PLACES') {
        return res.status(400).json({
          success: false,
          message: "Confirmation requise. Utilisez: { confirm: 'YES_CREATE_MISSING_PLACES' }"
        });
      }
      
      console.log('🏗️ CRÉATION DES LIEUX MANQUANTS...');
      
      const PopularPlace = require('../models/PopularPlace');
      const RegionDetails = require('../models/RegionDetails');
      
      // Construire la requête pour les régions
      let regionQuery = {};
      if (regionId) {
        regionQuery.region_id = regionId;
      }
      
      const regions = await RegionDetails.find(regionQuery);
      let created = 0;
      let skipped = 0;
      
      for (const region of regions) {
        if (!region.popularPlaces || region.popularPlaces.length === 0) {
          console.log(`⏭️ Région ${region.region_id} : aucun lieu populaire`);
          continue;
        }
        
        for (const basicPlace of region.popularPlaces) {
          // Vérifier si le lieu existe déjà dans PopularPlace
          const existingPlace = await PopularPlace.findOne({ 
            _id: basicPlace.id, 
            isActive: true 
          });
          
          if (existingPlace) {
            skipped++;
            console.log(`⏭️ Lieu ${basicPlace.id} existe déjà: ${basicPlace.title}`);
            continue;
          }
          
          // Créer le nouveau lieu PopularPlace
          const newPlace = new PopularPlace({
            _id: basicPlace.id,
            regionDetailsId: region._id,
            title: basicPlace.title,
            location: basicPlace.location || region.location || 'Dakar, Sénégal',
            category: basicPlace.category || 'Lieu touristique',
            rating: basicPlace.rating || 0,
            
            // Données minimales obligatoires
            description: `${basicPlace.title} est un lieu remarquable à découvrir dans la région de ${region.name || 'cette région'}.`,
            coordinates: {
              latitude: 14.7167, // Coordonnées par défaut (Dakar)
              longitude: -17.4677
            },
            
            // Données de création
            createdBy: {
              userId: req.user.id,
              role: req.user.role,
              username: req.user.username || 'system'
            },
            lastEditedBy: {
              userId: req.user.id,
              role: req.user.role,
              username: req.user.username || 'system',
              editedAt: new Date()
            },
            
            // Galerie si image existe
            gallery: basicPlace.imageUrl ? [basicPlace.imageUrl] : []
          });
          
          try {
            await newPlace.save();
            created++;
            console.log(`✅ Lieu créé: ${newPlace.title} (ID: ${newPlace._id})`);
          } catch (saveError) {
            console.error(`❌ Erreur création lieu ${basicPlace.id}:`, saveError.message);
          }
        }
      }
      
      console.log(`🎉 Création terminée: ${created} lieux créés, ${skipped} existants`);
      
      return res.json({
        success: true,
        message: `Création terminée: ${created} lieux créés, ${skipped} lieux existants`,
        data: {
          placesCreated: created,
          placesSkipped: skipped,
          regionsProcessed: regions.length
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur création lieux manquants:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la création des lieux manquants"
      });
    }
  }
);

/**
 * NOUVELLE ROUTE : Synchroniser les ratings depuis PopularPlace vers RegionDetails
 * POST /api/popular-places/maintenance/sync-ratings-to-basic
 */
router.post(
  '/maintenance/sync-ratings-to-basic',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      console.log('🔄 Synchronisation des ratings vers les données de base...');
      
      const PopularPlace = require('../models/PopularPlace');
      const RegionDetails = require('../models/RegionDetails');
      
      const places = await PopularPlace.find({ isActive: true })
        .populate('regionDetailsId');
      
      let updated = 0;
      let errors = 0;
      
      for (const place of places) {
        try {
          const region = place.regionDetailsId;
          const basicPlace = region.popularPlaces?.find(p => 
            String(p.id) === String(place._id)
          );
          
          if (basicPlace) {
            let hasChanges = false;
            
            // Synchroniser rating et nombre d'avis
            if (Math.abs(basicPlace.rating - place.averageRating) > 0.01) {
              basicPlace.rating = place.averageRating;
              hasChanges = true;
            }
            
            if (basicPlace.reviews !== place.totalReviews) {
              basicPlace.reviews = place.totalReviews;
              hasChanges = true;
            }
            
            if (hasChanges) {
              await region.save();
              updated++;
              console.log(`✅ Synchronisé: ${place.title} - Rating: ${place.averageRating}`);
            }
          } else {
            console.warn(`⚠️ Lieu ${place._id} non trouvé dans RegionDetails`);
            errors++;
          }
        } catch (syncError) {
          console.error(`❌ Erreur sync lieu ${place._id}:`, syncError.message);
          errors++;
        }
      }
      
      console.log(`🎉 Synchronisation terminée: ${updated} mis à jour, ${errors} erreurs`);
      
      return res.json({
        success: true,
        message: `Synchronisation terminée: ${updated} lieux mis à jour`,
        data: { 
          updated, 
          errors,
          totalProcessed: places.length 
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur synchronisation ratings:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la synchronisation des ratings"
      });
    }
  }
);

// ===== MIDDLEWARE DE GESTION D'ERREURS SPÉCIFIQUE =====
router.use((err, req, res, next) => {
  console.error('❌ Erreur dans popularPlacesRoutes:', err);
  
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
      message: 'ID invalide'
    });
  }
  
  // Gestion spécifique pour les erreurs de duplication
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Ce lieu existe déjà'
    });
  }
  
  // Gestion spécifique pour les fichiers trop volumineux
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Le fichier est trop volumineux'
    });
  }
  
  // Erreur générale
  return res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
  });
});

module.exports = router;
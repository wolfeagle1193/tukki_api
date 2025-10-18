const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const PopularPlace = require('../models/PopularPlace');
const RegionDetails = require('../models/RegionDetails');
const { validationResult } = require('express-validator');

// ===== RÉCUPÉRER DÉTAILS D'UN LIEU =====
exports.getPlaceByOriginalId = async (req, res) => {
  try {
    const { regionId, placeId } = req.params;
    const currentUserId = req.user.id;
    
    console.log(`🔍 Recherche lieu ID: ${placeId} dans région: ${regionId}`);
    console.log(`👤 Utilisateur connecté: ${currentUserId}`);
    
    // 1. Chercher la région par region_id
    const detailRegion = await RegionDetails.findOne({ region_id: regionId });
    if (!detailRegion) {
      return res.status(404).json({
        success: false,
        message: "Région non trouvée"
      });
    }
    
    // 2. ✅ CORRIGÉ : Recherche par ObjectId au lieu de parseInt
    const popularPlace = await PopularPlace.findOne({ 
      _id: placeId, // ObjectId directement
      isActive: true 
    });
    
    if (popularPlace && popularPlace.hasFullDetails) {
      // Incrémenter les vues
      popularPlace.viewsCount = (popularPlace.viewsCount || 0) + 1;
      await popularPlace.save();
      
      // Traitement des données utilisateur
      const processedPlace = {
        ...popularPlace.toObject(),
        regionInfo: {
          id: detailRegion.region_id,
          name: detailRegion.name || 'Région'
        }
      };

      // Calcul des avis utiles pour l'utilisateur
      if (processedPlace.reviews && processedPlace.reviews.length > 0) {
        processedPlace.reviews = processedPlace.reviews.map(review => {
          const hasUserLiked = review.helpfulBy && Array.isArray(review.helpfulBy)
            ? review.helpfulBy.some(userId => userId.toString() === currentUserId.toString())
            : false;
          
          return {
            ...review,
            isMarkedHelpfulByUser: hasUserLiked,
            helpful: Math.max(0, review.helpful || 0)
          };
        });
      }

      // Vérifier si l'utilisateur a mis en favoris
      const isFavorite = popularPlace.favoritedBy && Array.isArray(popularPlace.favoritedBy)
        ? popularPlace.favoritedBy.some(userId => userId.toString() === currentUserId.toString())
        : false;
      
      processedPlace.isFavoriteByUser = isFavorite;

      console.log(`✅ Détails complets trouvés pour utilisateur ${currentUserId}`);
      
      return res.json({
        success: true,
        details: {
          ...processedPlace,
          source: 'complete_details',
          hasFullDetails: true
        }
      });
    }
    
    // 3. Fallback: données de base depuis PopularPlace
    const placeDetails = popularPlace;
    
    if (!placeDetails) {
      return res.status(404).json({
        success: false,
        message: "Lieu non trouvé"
      });
    }
    
    // Retourner les données de base
    return res.json({
      success: true,
      details: {
        id: placeDetails._id,
        title: placeDetails.title,
        location: placeDetails.location || detailRegion.location || 'Dakar, Sénégal',
        category: placeDetails.category || 'Lieu touristique',
        rating: placeDetails.averageRating || 0,
        totalReviews: placeDetails.totalReviews || 0,
        imageUrl: placeDetails.gallery?.[0] || null,
        hasImage: placeDetails.gallery && placeDetails.gallery.length > 0,
        
        // Données minimales par défaut
        description: `${placeDetails.title} est un lieu remarquable à découvrir.`,
        coordinates: { latitude: 14.7167, longitude: -17.4677 },
        visitSchedules: {
          weekdays: { open: '08:00', close: '18:00' },
          weekends: { open: '09:00', close: '17:00' },
          holidays: { open: '10:00', close: '16:00' }
        },
        practicalInfos: {
          duration: '2-3 heures',
          bestTimeToVisit: 'Matin ou fin d\'après-midi',
          accessibility: 'Accessible',
          entryFee: 'Variable',
          parking: 'Parking disponible',
          tips: 'Apportez de l\'eau et votre appareil photo.'
        },
        contact: { phone: '', email: '', website: '' },
        gallery: placeDetails.gallery || [],
        reviews: [],
        
        // Métadonnées
        source: 'basic_info',
        hasFullDetails: false,
        message: 'Détails complets bientôt disponibles',
        viewsCount: 0,
        favoritesCount: 0,
        isFavoriteByUser: false,
        regionInfo: {
          id: detailRegion.region_id,
          name: detailRegion.name || 'Région'
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getPlaceByOriginalId:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

/*exports.getPopularPlacesByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    
    console.log(`🏛️ Récupération lieux populaires région: ${regionId}`);
    
    // 1. Chercher la région par region_id
    const detailRegion = await RegionDetails.findOne({ region_id: regionId });
    if (!detailRegion) {
      return res.status(404).json({
        success: false,
        message: "Région non trouvée",
        data: []
      });
    }
    
    // 2. Récupérer tous les lieux de la région
    const places = await PopularPlace.find({
      _id: { $in: detailRegion.popularPlaces },
      regionDetailsId: detailRegion._id,
      isActive: true
    })
    .sort({ averageRating: -1, totalReviews: -1 })
    .lean();
    
    // 3. ✅ FORMAT SIMPLE POUR LISTE MOBILE - Données basiques seulement
    const processedPlaces = places.map(place => {
      
      if (place.hasFullDetails) {
        // ✅ DONNÉES COMPLÈTES - Format mobile basique
        return {
          id: place._id,
          title: place.title || '',
          location: place.location || '',
          category: place.category || '',
          rating: place.averageRating || 0,
          reviews: place.totalReviews || 0,
          isFeatured: false,
          hasImage: place.gallery && place.gallery.length > 0,
          imageUrl: place.gallery && place.gallery.length > 0 ? place.gallery[0] : null,
          description: place.description || `${place.title} est un lieu remarquable à découvrir.`,
          createdAt: place.createdAt || new Date()
        };
        
      } else {
        // ✅ FALLBACK - Données basiques
        return {
          id: place._id,
          title: place.title || '',
          location: place.location || detailRegion.location || '',
          category: place.category || 'Lieu touristique',
          rating: place.averageRating || 0,
          reviews: place.totalReviews || 0,
          isFeatured: false,
          hasImage: place.gallery && place.gallery.length > 0,
          imageUrl: place.gallery && place.gallery.length > 0 ? place.gallery[0] : null,
          description: place.title ? `${place.title} est un lieu remarquable à découvrir.` : '',
          createdAt: place.createdAt || new Date()
        };
      }
    });
    
    console.log(`✅ ${processedPlaces.length} lieux populaires trouvés pour région ${regionId}`);
    
    // 4. ✅ RÉPONSE SIMPLE
    return res.json({
      success: true,
      data: processedPlaces
    });
    
  } catch (error) {
    console.error(`❌ Erreur getPopularPlacesByRegion:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: []
    });
  }
};*/
exports.getPopularPlacesByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    
    console.log(`🏛️ Récupération lieux populaires région: ${regionId}`);
    
    // 1. Chercher la région par region_id
    const detailRegion = await RegionDetails.findOne({ region_id: regionId });
    if (!detailRegion) {
      return res.status(404).json({
        success: false,
        message: "Région non trouvée",
        data: []
      });
    }
    
    console.log(`🔍 Région trouvée: ${detailRegion.name}, PopularPlaces IDs:`, detailRegion.popularPlaces);
    
    // 2. Récupérer tous les lieux de la région
    const places = await PopularPlace.find({
      _id: { $in: detailRegion.popularPlaces },
      regionDetailsId: detailRegion._id,
      isActive: true
    })
    .sort({ averageRating: -1, totalReviews: -1 })
    .lean();
    
    console.log(`📊 ${places.length} places trouvées en base pour ${regionId}`);
    
    // 3. ✅ DEBUG DÉTAILLÉ - Examiner chaque place
    places.forEach((place, index) => {
      console.log(`\n📋 === PLACE ${index + 1} ===`);
      console.log(`ID: ${place._id}`);
      console.log(`Title: "${place.title}" (${typeof place.title}) - ${place.title ? 'OK' : '❌ MANQUANT'}`);
      console.log(`Location: "${place.location}" (${typeof place.location}) - ${place.location ? 'OK' : '❌ MANQUANT'}`);
      console.log(`Category: "${place.category}" (${typeof place.category}) - ${place.category ? 'OK' : '❌ MANQUANT'}`);
      console.log(`Description: ${place.description ? `"${place.description.substring(0, 50)}..."` : '❌ MANQUANT'} (longueur: ${place.description?.length || 0})`);
      console.log(`Coordinates: ${place.coordinates?.latitude && place.coordinates?.longitude ? `${place.coordinates.latitude}, ${place.coordinates.longitude}` : '❌ MANQUANT'}`);
      console.log(`Gallery: ${place.gallery?.length || 0} images`);
      console.log(`HasFullDetails: ${place.hasFullDetails}`);
      console.log(`IsActive: ${place.isActive}`);
      console.log(`CreatedBy: ${place.createdBy ? 'OK' : '❌ MANQUANT'}`);
      
      // Vérifier tous les champs requis
      const missingFields = [];
      if (!place.title || place.title.trim() === '') missingFields.push('title');
      if (!place.location || place.location.trim() === '') missingFields.push('location');
      if (!place.category || place.category.trim() === '') missingFields.push('category');
      if (!place.description || place.description.trim() === '' || place.description.length < 50) missingFields.push('description (min 50 chars)');
      if (!place.coordinates?.latitude || !place.coordinates?.longitude) missingFields.push('coordinates');
      if (!place.createdBy) missingFields.push('createdBy');
      
      if (missingFields.length > 0) {
        console.log(`❌ CHAMPS MANQUANTS: ${missingFields.join(', ')}`);
      } else {
        console.log(`✅ PLACE VALIDE`);
      }
    });
    
    // 4. ✅ TRAITEMENT avec gestion des erreurs
    const processedPlaces = places.map((place, index) => {
      
      // Vérifier si la place a les données minimales requises
      const hasMinimalData = place.title && 
                            place.title.trim() !== '' &&
                            place.location &&
                            place.category;
      
      if (!hasMinimalData) {
        console.warn(`⚠️ Place ${index + 1} ignorée - données minimales manquantes`);
        return null; // Sera filtrée
      }
      
      if (place.hasFullDetails) {
        // ✅ DONNÉES COMPLÈTES
        return {
          id: place._id,
          title: place.title || '',
          location: place.location || '',
          category: place.category || '',
          rating: place.averageRating || 0,
          reviews: place.totalReviews || 0,
          isFeatured: false,
          hasImage: place.gallery && place.gallery.length > 0,
          imageUrl: place.gallery && place.gallery.length > 0 ? place.gallery[0] : null,
          description: place.description || `${place.title} est un lieu remarquable à découvrir.`,
          createdAt: place.createdAt || new Date()
        };
        
      } else {
        // ✅ FALLBACK - Données basiques
        return {
          id: place._id,
          title: place.title || '',
          location: place.location || detailRegion.location || '',
          category: place.category || 'Lieu touristique',
          rating: place.averageRating || 0,
          reviews: place.totalReviews || 0,
          isFeatured: false,
          hasImage: place.gallery && place.gallery.length > 0,
          imageUrl: place.gallery && place.gallery.length > 0 ? place.gallery[0] : null,
          description: place.title ? `${place.title} est un lieu remarquable à découvrir.` : '',
          createdAt: place.createdAt || new Date()
        };
      }
    }).filter(place => place !== null); // Filtrer les places nulles
    
    console.log(`\n📊 RÉSULTAT FINAL:`);
    console.log(`${places.length} places trouvées en base`);
    console.log(`${processedPlaces.length} places valides après traitement`);
    console.log(`${places.length - processedPlaces.length} places filtrées comme invalides`);
    
    // 5. ✅ RÉPONSE
    return res.json({
      success: true,
      data: processedPlaces
    });
    
  } catch (error) {
    console.error(`❌ Erreur getPopularPlacesByRegion:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: []
    });
  }
};
// ===== AJOUTER UN AVIS =====
exports.submitFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array()
      });
    }
    
    const { placeId } = req.params;
    const { rating, comment = '' } = req.body;
    const { id: user_id, username } = req.user;

    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`⭐ Ajout avis lieu: ${placeId} par ${displayName}`);
    
    // ✅ CORRIGÉ : Recherche par ObjectId directement
    const place = await PopularPlace.findOne({ _id: placeId, isActive: true });
    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Lieu non trouvé"
      });
    }
    
    // ✅ VÉRIFICATION : L'utilisateur a-t-il déjà donné un avis ?
    const existingReview = place.reviews.find(review => 
      review.userId.toString() === user_id.toString()
    );
    
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "Vous avez déjà donné un avis pour ce lieu"
      });
    }
    
    // ✅ AJOUTER LE NOUVEL AVIS
    const newReview = {
      userId: new mongoose.Types.ObjectId(user_id),
      username: displayName,
      rating: parseInt(rating),
      comment: comment.trim(),
      helpful: 0,
      helpfulBy: [],
      createdAt: new Date()
    };
    
    place.reviews.push(newReview);
    
    // ✅ RECALCULER LES STATISTIQUES
    place.totalReviews = place.reviews.length;
    const totalRating = place.reviews.reduce((sum, review) => sum + review.rating, 0);
    place.averageRating = parseFloat((totalRating / place.totalReviews).toFixed(1));
    
    await place.save();
    
    console.log(`✅ Avis ajouté: ${rating}/5 par ${displayName} - Nouvelle moyenne: ${place.averageRating}`);
    
    return res.json({
      success: true,
      message: "Avis ajouté avec succès",
      data: {
        averageRating: place.averageRating,
        totalReviews: place.totalReviews,
        newRating: rating
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur submitFeedback:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== TOGGLE FAVORIS =====
exports.toggleFavorite = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { id: user_id, username } = req.user;

    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`❤️ Toggle favoris lieu: ${placeId} par ${displayName}`);
    
    // ✅ CORRIGÉ : Recherche par ObjectId directement
    const place = await PopularPlace.findOne({ _id: placeId, isActive: true });
    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Lieu non trouvé"
      });
    }
    
    const userObjectId = new mongoose.Types.ObjectId(user_id);
    const isCurrentlyFavorite = place.favoritedBy.some(userId => 
      userId.toString() === user_id.toString()
    );
    
    let action;
    if (isCurrentlyFavorite) {
      // Retirer des favoris
      place.favoritedBy = place.favoritedBy.filter(userId => 
        userId.toString() !== user_id.toString()
      );
      action = 'removed';
    } else {
      // Ajouter aux favoris
      place.favoritedBy.push(userObjectId);
      action = 'added';
    }
    
    // Mettre à jour le compteur
    place.favoritesCount = place.favoritedBy.length;
    
    await place.save();

    console.log(`✅ Favoris ${action}: ${!isCurrentlyFavorite ? 'ajouté' : 'retiré'} - Total: ${place.favoritesCount}`);
    
    return res.json({
      success: true,
      message: action === 'added' ? 'Ajouté aux favoris' : 'Retiré des favoris',
      data: {
        isFavorite: !isCurrentlyFavorite,
        favoritesCount: place.favoritesCount,
        action: action
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur toggleFavorite:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};


exports.getUserFavoritePlaces = async (req, res) => {
  try {
    const { id: userId, username } = req.user;
    const { sortBy = 'dateAdded' } = req.query;
    
    const displayName = username || `User${userId.slice(-6)}`;
    console.log(`💖 Récupération favoris lieux populaires pour: ${displayName}`);
    
    // Query: tous les lieux où l'utilisateur est dans favoritedBy
    const query = { 
      favoritedBy: userId,
      isActive: true
    };
    
    // Options de tri
    const sortOptions = {
      'dateAdded': { updatedAt: -1 }, // Plus récemment ajouté en favoris
      'rating': { averageRating: -1 },
      'reviews': { totalReviews: -1 },
      'name': { title: 1 },
      'views': { viewsCount: -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.dateAdded;
    
    // Récupération de TOUS les favoris de l'utilisateur avec populate de la région
    const favoritePlaces = await PopularPlace.find(query)
      .sort(sort)
      .populate('regionDetailsId', 'region_id name location')
      .lean();
    
    // Enrichir avec les données formatées
    const userFavoritePlaces = await Promise.all(
      favoritePlaces.map(async (place) => {
        try {
          // Récupérer les infos de base de la région
          let regionInfo = null;
          
          if (place.regionDetailsId) {
            regionInfo = {
              id: place.regionDetailsId.region_id,
              name: place.regionDetailsId.name || 'Région inconnue',
              location: place.regionDetailsId.location || ''
            };
          }
          
          return {
            id: place._id,
            title: place.title || '',
            description: place.description 
              ? place.description.substring(0, 120) + (place.description.length > 120 ? '...' : '')
              : `${place.title} est un lieu remarquable à découvrir.`,
            
            // Localisation
            location: place.location || regionInfo?.location || '',
            category: place.category || 'Lieu touristique',
            
            // Coordonnées
            coordinates: place.coordinates || null,
            
            // Notes et avis
            rating: place.averageRating || 0,
            totalReviews: place.totalReviews || 0,
            
            // Images
            imageUrl: place.gallery && place.gallery.length > 0 ? place.gallery[0] : null,
            gallery: place.gallery || [],
            galleryCount: place.gallery ? place.gallery.length : 0,
            hasImage: place.gallery && place.gallery.length > 0,
            
            // Région associée
            regionInfo: regionInfo,
            
            // Statistiques
            isFavoriteByUser: true, // Toujours true puisque c'est SA liste de favoris
            favoritesCount: place.favoritesCount || 0,
            viewsCount: place.viewsCount || 0,
            
            // Détails supplémentaires
            hasFullDetails: place.hasFullDetails || false,
            visitSchedules: place.visitSchedules || null,
            practicalInfos: place.practicalInfos || null,
            activities: place.activities ? place.activities.slice(0, 3) : [],
            
            // Métadonnées
            addedToFavoritesAt: place.updatedAt || place.createdAt,
            createdAt: place.createdAt
          };
          
        } catch (placeError) {
          console.warn(`⚠️ Erreur enrichissement lieu ${place._id}:`, placeError.message);
          // Inclure quand même avec des données minimales
          return {
            id: place._id,
            title: place.title || 'Lieu non trouvé',
            description: place.description || '',
            location: place.location || '',
            category: place.category || 'Lieu touristique',
            rating: place.averageRating || 0,
            totalReviews: place.totalReviews || 0,
            imageUrl: place.gallery?.[0] || null,
            gallery: place.gallery || [],
            hasImage: place.gallery && place.gallery.length > 0,
            regionInfo: place.regionDetailsId ? {
              id: place.regionDetailsId.region_id,
              name: place.regionDetailsId.name || 'Région inconnue'
            } : null,
            isFavoriteByUser: true,
            favoritesCount: place.favoritesCount || 0,
            addedToFavoritesAt: place.updatedAt || place.createdAt
          };
        }
      })
    );
    
    console.log(`✅ ${userFavoritePlaces.length} lieux populaires favoris trouvés pour ${displayName}`);
    
    return res.json({
      success: true,
      data: userFavoritePlaces,
      totalFavorites: userFavoritePlaces.length,
      sortedBy: sortBy,
      message: userFavoritePlaces.length === 0 
        ? "Vous n'avez pas encore de lieux favoris" 
        : `Vous avez ${userFavoritePlaces.length} lieu${userFavoritePlaces.length > 1 ? 'x' : ''} en favoris`
    });
    
  } catch (error) {
    console.error(`❌ Erreur getUserFavoritePlaces:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos lieux favoris",
      data: [],
      totalFavorites: 0
    });
  }
};

// ===== MARQUER AVIS UTILE =====
exports.markReviewAsHelpful = async (req, res) => {
  try {
    const { placeId, reviewId } = req.params;
    const { id: user_id, username } = req.user;

    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`👍 Mark helpful avis: ${reviewId} lieu: ${placeId} par ${displayName}`);
    
    // ✅ CORRIGÉ : Recherche par ObjectId directement
    const place = await PopularPlace.findOne({ _id: placeId, isActive: true });
    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Lieu non trouvé"
      });
    }
    
    const review = place.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Avis non trouvé"
      });
    }
    
    const userObjectId = new mongoose.Types.ObjectId(user_id);
    const alreadyMarked = review.helpfulBy.some(userId => userId.toString() === user_id);
    
    let result = {};
    
    if (alreadyMarked) {
      // Retirer le vote
      review.helpfulBy = review.helpfulBy.filter(userId => userId.toString() !== user_id);
      review.helpful = Math.max(0, review.helpful - 1);
      result = { action: 'unmarked', newCount: review.helpful };
      console.log(`👎 Avis unmarked: ${review.helpful} votes`);
    } else {
      // Ajouter le vote
      review.helpfulBy.push(userObjectId);
      review.helpful += 1;
      result = { action: 'marked', newCount: review.helpful };
      console.log(`👍 Avis marked: ${review.helpful} votes`);
    }
    
    await place.save();

    console.log(`✅ markReviewAsHelpful réussi`);
    
    return res.json({
      success: true,
      message: result.action === 'marked' ? 'Avis marqué comme utile' : 'Vote retiré',
      data: {
        helpful: result.newCount,
        isMarkedHelpful: result.action === 'marked',
        action: result.action
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur markReviewAsHelpful:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== CRÉER/MODIFIER DÉTAILS (ADMIN/MAINTENANCIER) =====
exports.createOrUpdateDetails = async (req, res) => {
  try {
    // ✅ VALIDATION EXPRESS-VALIDATOR
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Erreurs de validation:', errors.array());
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array(),
        debug: {
          receivedFields: Object.keys(req.body || {}),
          filesCount: req.files ? req.files.length : 0
        }
      });
    }

    // ✅ DEBUG REQUÊTE
    console.log('🔍 === DEBUG REQUÊTE POPULAR PLACE ===');
    console.log('📋 req.body:', Object.keys(req.body || {}));
    console.log('📋 req.files:', req.files ? req.files.length : 0);

    // Vérifier que req.body existe
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Aucune donnée reçue"
      });
    }

    // ✅ EXTRACTION SÉCURISÉE DES CHAMPS
    const regionId = req.body.regionId;
    const placeId = req.body._id;
    const title = req.body.title;
    const description = req.body.description;
    const location = req.body.location;
    const category = req.body.category;

    // Parse des objets JSON avec gestion d'erreurs robuste
    let coordinates, visitSchedules, practicalInfos, contact, activities, specialTips;

    try {
      // ✅ COORDONNÉES
      coordinates = req.body.coordinates ? JSON.parse(req.body.coordinates) : {};
      console.log('🗺️ Coordonnées parsées:', coordinates);
      
      // ✅ HORAIRES CORRIGÉS - STRUCTURE SIMPLE
      let rawSchedules = req.body.visitSchedules ? JSON.parse(req.body.visitSchedules) : {};
      
      // Restructurer pour correspondre au modèle (strings simples)
      visitSchedules = {
          weekdays: {
              open: rawSchedules.weekdays?.open?.open || rawSchedules.weekdays?.open || '08:00',
              close: rawSchedules.weekdays?.open?.close || rawSchedules.weekdays?.close || '18:00'
          },
          weekends: {
              open: rawSchedules.weekends?.open?.open || rawSchedules.weekends?.open || '09:00',
              close: rawSchedules.weekends?.open?.close || rawSchedules.weekends?.close || '17:00'
          },
          holidays: {
              open: rawSchedules.holidays?.open?.open || rawSchedules.holidays?.open || '10:00',
              close: rawSchedules.holidays?.open?.close || rawSchedules.holidays?.close || '16:00'
          }
      };
      console.log('🕐 Horaires restructurés:', visitSchedules);
      
      // ✅ INFOS PRATIQUES
      practicalInfos = req.body.practicalInfos ? JSON.parse(req.body.practicalInfos) : {};
      console.log('ℹ️ Infos pratiques parsées:', Object.keys(practicalInfos));
      
      // ✅ CONTACT
      contact = req.body.contact ? JSON.parse(req.body.contact) : {};
      console.log('📞 Contact parsé:', Object.keys(contact));
      
      // ✅ ACTIVITÉS ET CONSEILS
      activities = req.body.activities ? JSON.parse(req.body.activities) : [];
      specialTips = req.body.specialTips ? JSON.parse(req.body.specialTips) : [];
      console.log('🎯 Activités:', activities.length, 'conseils:', specialTips.length);
      
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      return res.status(400).json({
        success: false,
        message: "Format des données JSON invalide: " + parseError.message,
        field: parseError.message.includes('visitSchedules') ? 'visitSchedules' : 'unknown'
      });
    }

    console.log('✅ Données extraites:', {
      regionId,
      title: title ? title.substring(0, 30) + '...' : 'MANQUANT',
      hasCoordinates: !!coordinates.latitude && !!coordinates.longitude,
      filesCount: req.files ? req.files.length : 0
    });

    // ✅ VALIDATION DES CHAMPS OBLIGATOIRES
    const missingFields = [];
    if (!regionId) missingFields.push('regionId');
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!location) missingFields.push('location');
    if (!category) missingFields.push('category');
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) missingFields.push('coordinates');

    if (missingFields.length > 0) {
      console.error('❌ Champs manquants:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`
      });
    }

    console.log('✅ Tous les champs obligatoires sont présents');

    // ✅ VÉRIFICATION DES PERMISSIONS
    const userRole = req.user.role;
    if (!['superAdmin', 'maintenancier'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seuls les administrateurs et maintenanciers peuvent modifier les détails."
      });
    }

    console.log('📋 Utilisateur autorisé:', userRole);

    // ✅ CHERCHER LA RÉGION PAR region_id
    console.log('🔍 Recherche région avec region_id:', regionId);
    const regionDetails = await RegionDetails.findOne({ region_id: regionId });
    
    if (!regionDetails) {
      console.error('❌ Région non trouvée pour region_id:', regionId);
      return res.status(404).json({
        success: false,
        message: "Région non trouvée"
      });
    }

    console.log('✅ Région trouvée:', regionDetails.region_id, 'ObjectId:', regionDetails._id);

    // ✅ NOUVELLE LOGIQUE CRÉATION VS MODIFICATION AVEC OBJECTID
    let placeDocumentId;
    let isNewPlace = false;
    let existingPlace = null;

    if (placeId && placeId !== 'null' && placeId !== '' && placeId !== 'undefined') {
      // MODE MODIFICATION - utiliser l'ObjectId existant
      console.log('🔄 Mode modification - lieu existant:', placeId);
      
      // ✅ Valider que c'est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(placeId)) {
        return res.status(400).json({
          success: false,
          message: "ID du lieu invalide (doit être un ObjectId)"
        });
      }
      
      placeDocumentId = new mongoose.Types.ObjectId(placeId);
      
      // Vérifier que le lieu existe dans PopularPlace
      existingPlace = await PopularPlace.findOne({ _id: placeDocumentId, isActive: true });
      if (!existingPlace) {
        return res.status(404).json({
          success: false,
          message: "Lieu non trouvé dans la collection PopularPlace"
        });
      }
      
      console.log(`✅ Lieu existant trouvé: ${existingPlace.title} (ID: ${placeDocumentId})`);
      
    } else {
      // MODE CRÉATION - générer nouvel ObjectId
      console.log('➕ Mode création - nouveau lieu');
      isNewPlace = true;
      placeDocumentId = new mongoose.Types.ObjectId();
      console.log('🆕 Nouvel ObjectId généré:', placeDocumentId);
    }

    // ✅ ADMINISTRATION INFO
    const adminInfo = {
      userId: req.user.id,
      role: userRole,
      username: req.user.username || `${userRole}_${req.user.id.slice(-6)}`
    };

    // ✅ TRAITEMENT DES IMAGES
    let galleryUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`📷 Traitement de ${req.files.length} images...`);
      
      try {
        const galleryDir = path.join(process.cwd(), 'assets', 'images', 'places', String(placeDocumentId));
        await fs.mkdir(galleryDir, { recursive: true });
        console.log(`📁 Dossier créé: ${galleryDir}`);

        for (let i = 0; i < req.files.length; i++) {
          const image = req.files[i];
          console.log(`🔄 Traitement image ${i+1}: ${image.originalname}`);
          
          const filename = `${Date.now()}-${i}.webp`;
          const outputPath = path.join(galleryDir, filename);

          await sharp(image.path)
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(outputPath);

          console.log(`✅ Image sauvée: ${outputPath}`);

          try {
            await fs.unlink(image.path);
            console.log(`🗑️ Fichier temp supprimé: ${image.path}`);
          } catch (unlinkError) {
            console.warn(`Impossible de supprimer le fichier temporaire: ${image.path}`);
          }

          galleryUrls.push(`/assets/images/places/${placeDocumentId}/${filename}`);
        }

        console.log(`🎉 ${galleryUrls.length} images traitées avec succès`);
        
      } catch (imageError) {
        console.error("❌ Erreur lors du traitement des images:", imageError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors du traitement des images de la galerie."
        });
      }
    }

    // ✅ GESTION DES DÉTAILS DANS POPULARPLACE
    let place;

    if (existingPlace) {
      // ✅ MISE À JOUR DU LIEU EXISTANT
      console.log('🔄 Mise à jour des détails existants');
      
      place = existingPlace;
      place.title = title;
      place.description = description;
      place.location = location;
      place.category = category;
      place.coordinates = coordinates;
      place.visitSchedules = visitSchedules;
      place.practicalInfos = practicalInfos;
      place.contact = contact;
      place.activities = activities || [];
      place.specialTips = specialTips || [];
      place.lastEditedBy = adminInfo;
      place.lastEditedBy.editedAt = new Date();
      
      // Ajouter nouvelles images à la galerie existante
      if (galleryUrls.length > 0) {
        place.gallery = [...(place.gallery || []), ...galleryUrls];
      }
      
      await place.save();
      console.log(`✅ Lieu mis à jour: ${title}`);
      
    } else {
      // ✅ CRÉATION D'UN NOUVEAU LIEU
      console.log('➕ Création de nouveaux détails dans PopularPlace');
      
      place = new PopularPlace({
        _id: placeDocumentId, // ObjectId
        regionDetailsId: regionDetails._id, // ObjectId de RegionDetails
        title,
        description,
        location,
        category,
        coordinates,
        visitSchedules,
        practicalInfos,
        contact,
        activities: activities || [],
        specialTips: specialTips || [],
        gallery: galleryUrls,
        hasFullDetails: true, // Marquer comme ayant des détails complets
        createdBy: adminInfo,
        lastEditedBy: adminInfo
      });
      
      await place.save();
      console.log(`✅ Nouveau lieu créé: ${title}`);
    }

    // ✅ GESTION DE LA RÉFÉRENCE DANS REGIONDETAILS.POPULARPLACES
    // Cette logique est maintenant simplifiée : on stocke seulement l'ObjectId
    
    if (isNewPlace) {
      // ✅ CRÉATION : Ajouter l'ObjectId à la liste des lieux populaires
      console.log('➕ Ajout de la référence ObjectId dans RegionDetails.popularPlaces');
      
      // Vérifier que l'ObjectId n'existe pas déjà
      const existsInRegion = regionDetails.popularPlaces.some(placeRef => 
        String(placeRef) === String(placeDocumentId)
      );
      
      if (!existsInRegion) {
        regionDetails.popularPlaces.push(placeDocumentId); // Juste l'ObjectId, pas un objet
        regionDetails.updatedAt = new Date();
        await regionDetails.save();
        console.log('✅ ObjectId ajouté à RegionDetails.popularPlaces:', placeDocumentId);
      } else {
        console.log('ℹ️ ObjectId déjà présent dans RegionDetails.popularPlaces');
      }
      
    } else {
      // ✅ MODIFICATION : Vérifier que la référence existe
      console.log('🔄 Vérification de la référence dans RegionDetails lors de la modification');
      
      const existsInRegion = regionDetails.popularPlaces.some(placeRef => 
        String(placeRef) === String(placeDocumentId)
      );
      
      if (!existsInRegion) {
        console.warn('⚠️ Référence manquante dans RegionDetails, ajout automatique');
        regionDetails.popularPlaces.push(placeDocumentId);
        regionDetails.updatedAt = new Date();
        await regionDetails.save();
      }
    }

    // ✅ FONCTION DE CALCUL DE COMPLÉTION
    const calculateCompletionStatus = (place) => {
      let completed = 0;
      let total = 8;
      
      if (place.title && place.title.length >= 3) completed++;
      if (place.description && place.description.length >= 50) completed++;
      if (place.location && place.location.length >= 5) completed++;
      if (place.coordinates && place.coordinates.latitude && place.coordinates.longitude) completed++;
      if (place.visitSchedules && Object.keys(place.visitSchedules).length > 0) completed++;
      if (place.practicalInfos && Object.keys(place.practicalInfos).length > 0) completed++;
      if (place.contact && (place.contact.phone || place.contact.email || place.contact.website)) completed++;
      if (place.gallery && place.gallery.length > 0) completed++;
      
      return {
        percentage: Math.round((completed / total) * 100),
        completed,
        total
      };
    };

    // ✅ LOG FINAL DÉTAILLÉ
    console.log('📊 === RÉSUMÉ FINAL ===');
    console.log('- ID du lieu (ObjectId):', placeDocumentId);
    console.log('- Titre:', place.title);
    console.log('- Type d\'opération:', isNewPlace ? 'CRÉATION' : 'MISE À JOUR');
    console.log('- Région associée:', regionDetails.region_id);
    console.log('- Activités configurées:', place.activities?.length || 0);
    console.log('- Images galerie:', place.gallery?.length || 0);
    console.log('- Description longueur:', (place.description || '').length);
    console.log('- Coordonnées:', place.coordinates ? 'Définies' : 'Non définies');

    const completionStatus = calculateCompletionStatus(place);
    console.log('- Complétion:', `${completionStatus.percentage}% (${completionStatus.completed}/${completionStatus.total})`);

    // ✅ RÉPONSE FINALE
    return res.json({
      success: true,
      message: isNewPlace ? "Détails du lieu créés avec succès" : "Détails du lieu mis à jour avec succès",
      details: {
        ...place.toObject(),
        metadata: {
          isNewPlace,
          placeId: placeDocumentId,
          regionId: regionDetails.region_id,
          regionObjectId: regionDetails._id,
          totalGalleryImages: place.gallery?.length || 0,
          totalActivities: place.activities?.length || 0,
          totalSpecialTips: place.specialTips?.length || 0,
          lastUpdated: place.updatedAt,
          completionStatus: completionStatus,
          referencedInRegion: true // Confirme que la référence existe dans RegionDetails
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur createOrUpdateDetails:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/*exports.createOrUpdateDetails = async (req, res) => {
  try {
    // ✅ VALIDATION EXPRESS-VALIDATOR (Décommentée et corrigée)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Erreurs de validation:', errors.array());
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array(),
        debug: {
          receivedFields: Object.keys(req.body || {}),
          filesCount: req.files ? req.files.length : 0
        }
      });
    }

    // ✅ DEBUG REQUÊTE
    console.log('🔍 === DEBUG REQUÊTE POPULAR PLACE ===');
    console.log('📋 req.body:', Object.keys(req.body || {}));
    console.log('📋 req.files:', req.files ? req.files.length : 0);

    // Vérifier que req.body existe
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Aucune donnée reçue"
      });
    }

    // ✅ EXTRACTION SÉCURISÉE DES CHAMPS
    const regionId = req.body.regionId;
    const placeId = req.body._id;
    const title = req.body.title;
    const description = req.body.description;
    const location = req.body.location;
    const category = req.body.category;

    // Parse des objets JSON avec gestion d'erreurs robuste
    let coordinates, visitSchedules, practicalInfos, contact, activities, specialTips;

    try {
      // ✅ COORDONNÉES
      coordinates = req.body.coordinates ? JSON.parse(req.body.coordinates) : {};
      console.log('🗺️ Coordonnées parsées:', coordinates);
      
      // ✅ HORAIRES CORRIGÉS - STRUCTURE SIMPLE
      let rawSchedules = req.body.visitSchedules ? JSON.parse(req.body.visitSchedules) : {};
      
      // Restructurer pour correspondre au modèle (strings simples)
      visitSchedules = {
          weekdays: {
              open: rawSchedules.weekdays?.open?.open || rawSchedules.weekdays?.open || '08:00',
              close: rawSchedules.weekdays?.open?.close || rawSchedules.weekdays?.close || '18:00'
          },
          weekends: {
              open: rawSchedules.weekends?.open?.open || rawSchedules.weekends?.open || '09:00',
              close: rawSchedules.weekends?.open?.close || rawSchedules.weekends?.close || '17:00'
          },
          holidays: {
              open: rawSchedules.holidays?.open?.open || rawSchedules.holidays?.open || '10:00',
              close: rawSchedules.holidays?.open?.close || rawSchedules.holidays?.close || '16:00'
          }
      };
      console.log('🕐 Horaires restructurés:', visitSchedules);
      
      // ✅ INFOS PRATIQUES
      practicalInfos = req.body.practicalInfos ? JSON.parse(req.body.practicalInfos) : {};
      console.log('ℹ️ Infos pratiques parsées:', Object.keys(practicalInfos));
      
      // ✅ CONTACT
      contact = req.body.contact ? JSON.parse(req.body.contact) : {};
      console.log('📞 Contact parsé:', Object.keys(contact));
      
      // ✅ ACTIVITÉS ET CONSEILS
      activities = req.body.activities ? JSON.parse(req.body.activities) : [];
      specialTips = req.body.specialTips ? JSON.parse(req.body.specialTips) : [];
      console.log('🎯 Activités:', activities.length, 'conseils:', specialTips.length);
      
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      return res.status(400).json({
        success: false,
        message: "Format des données JSON invalide: " + parseError.message,
        field: parseError.message.includes('visitSchedules') ? 'visitSchedules' : 'unknown'
      });
    }

    console.log('✅ Données extraites:', {
      regionId,
      title: title ? title.substring(0, 30) + '...' : 'MANQUANT',
      hasCoordinates: !!coordinates.latitude && !!coordinates.longitude,
      filesCount: req.files ? req.files.length : 0
    });

    // ✅ VALIDATION DES CHAMPS OBLIGATOIRES
    const missingFields = [];
    if (!regionId) missingFields.push('regionId');
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!location) missingFields.push('location');
    if (!category) missingFields.push('category');
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) missingFields.push('coordinates');

    if (missingFields.length > 0) {
      console.error('❌ Champs manquants:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`
      });
    }

    console.log('✅ Tous les champs obligatoires sont présents');

    // ✅ VÉRIFICATION DES PERMISSIONS
    const userRole = req.user.role;
    if (!['superAdmin', 'maintenancier'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seuls les administrateurs et maintenanciers peuvent modifier les détails."
      });
    }

    console.log('📋 Utilisateur autorisé:', userRole);

    // ✅ CORRECTION 1: CHERCHER LA RÉGION PAR region_id (pas _id)
    console.log('🔍 Recherche région avec region_id:', regionId);
    const regionDetails = await RegionDetails.findOne({ region_id: regionId });
    
    if (!regionDetails) {
      console.error('❌ Région non trouvée pour region_id:', regionId);
      return res.status(404).json({
        success: false,
        message: "Région non trouvée"
      });
    }

    console.log('✅ Région trouvée:', regionDetails.region_id, 'ObjectId:', regionDetails._id);

    // ✅ CORRECTION 2: LOGIQUE CRÉATION VS MODIFICATION AMÉLIORÉE - ObjectId
    let placeDocumentId;
    let isNewPlace = false;

    if (placeId && placeId !== 'null' && placeId !== '') {
      // MODE MODIFICATION - utiliser l'ObjectId existant
      console.log('🔄 Mode modification - lieu existant:', placeId);
      
      // ✅ CORRIGÉ : Valider que c'est un ObjectId valide
      if (!mongoose.Types.ObjectId.isValid(placeId)) {
        return res.status(400).json({
          success: false,
          message: "ID du lieu invalide (doit être un ObjectId)"
        });
      }
      
      placeDocumentId = placeId; // Garder comme ObjectId string
      
      // Vérifier que le lieu existe
      const existingPlace = await PopularPlace.findOne({ _id: placeId, isActive: true });
      if (!existingPlace) {
        return res.status(404).json({
          success: false,
          message: "Lieu non trouvé"
        });
      }
      
      console.log(`✅ Lieu existant trouvé: ${existingPlace.title} (ID: ${placeDocumentId})`);
      
    } else {
      // MODE CRÉATION - générer nouvel ObjectId
      console.log('➕ Mode création - nouveau lieu');
      isNewPlace = true;
      
      // ✅ CORRIGÉ : Générer un ObjectId
      placeDocumentId = new mongoose.Types.ObjectId();
      console.log('🆕 Nouvel ObjectId généré:', placeDocumentId);
      
      // ✅ CORRECTION 3: AJOUTER LE LIEU BASIQUE À RegionDetails.popularPlaces avec un ID numérique pour compatibilité
      // Générer un ID numérique pour le système de base
      const lastBasicPlace = regionDetails.popularPlaces?.length > 0 
        ? Math.max(...regionDetails.popularPlaces.map(p => p.id || 0))
        : 2999;
      const numericId = lastBasicPlace + 1;
      
      const newBasicPlace = {
        id: numericId, // ID numérique pour compatibilité
        title: title,
        location: location,
        category: category,
        hasImage: false, // Sera mis à jour si images uploadées
        imageUrl: '',
        rating: 0,
        reviews: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      regionDetails.popularPlaces.push(newBasicPlace);
      await regionDetails.save();
      
      console.log('✅ Lieu basique ajouté à RegionDetails.popularPlaces avec ID numérique:', numericId);
    }

    // ✅ ADMINSITRATION INFO
    const adminInfo = {
      userId: req.user.id,
      role: userRole,
      username: req.user.username || `${userRole}_${req.user.id.slice(-6)}`
    };

    // ✅ TRAITEMENT DES IMAGES (pattern treasures)
    let galleryUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`📷 Traitement de ${req.files.length} images...`);
      
      try {
        const galleryDir = path.join(process.cwd(), 'assets', 'images', 'places', String(placeDocumentId));
        await fs.mkdir(galleryDir, { recursive: true });
        console.log(`📁 Dossier créé: ${galleryDir}`);

        for (let i = 0; i < req.files.length; i++) {
          const image = req.files[i];
          console.log(`🔄 Traitement image ${i+1}: ${image.originalname}`);
          
          const filename = `${Date.now()}-${i}.webp`;
          const outputPath = path.join(galleryDir, filename);

          await sharp(image.path)
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(outputPath);

          console.log(`✅ Image sauvée: ${outputPath}`);

          try {
            await fs.unlink(image.path);
            console.log(`🗑️ Fichier temp supprimé: ${image.path}`);
          } catch (unlinkError) {
            console.warn(`Impossible de supprimer le fichier temporaire: ${image.path}`);
          }

          galleryUrls.push(`/assets/images/places/${placeDocumentId}/${filename}`);
        }

        console.log(`🎉 ${galleryUrls.length} images traitées avec succès`);
        
        // ✅ METTRE À JOUR hasImage dans RegionDetails si images ajoutées
        if (galleryUrls.length > 0) {
          const basicPlace = regionDetails.popularPlaces.find(p => {
            // Pour les nouveaux lieux, chercher par titre car l'ID pourrait être différent
            if (isNewPlace) {
              return p.title === title;
            }
            // Pour les modifications, utiliser l'ID ou le titre
            return String(p.id) === String(placeDocumentId) || p.title === title;
          });
          
          if (basicPlace) {
            basicPlace.hasImage = true;
            if (!basicPlace.imageUrl && galleryUrls[0]) {
              basicPlace.imageUrl = galleryUrls[0]; // Première image comme image principale
            }
            basicPlace.updatedAt = new Date();
            await regionDetails.save();
            console.log('✅ hasImage mis à jour dans RegionDetails');
          }
        }
        
      } catch (imageError) {
        console.error("❌ Erreur lors du traitement des images:", imageError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors du traitement des images de la galerie."
        });
      }
    }

    // ✅ CHERCHER LE DOCUMENT POPULARPLACE EXISTANT
    let place = await PopularPlace.findOne({ _id: placeDocumentId, isActive: true });

    if (place) {
      // ✅ MISE À JOUR
      console.log('🔄 Mise à jour des détails existants');
      
      place.title = title;
      place.description = description;
      place.location = location;
      place.category = category;
      place.coordinates = coordinates;
      place.visitSchedules = visitSchedules;
      place.practicalInfos = practicalInfos;
      place.contact = contact;
      place.activities = activities || [];
      place.specialTips = specialTips || [];
      place.lastEditedBy = adminInfo;
      place.lastEditedBy.editedAt = new Date();
      
      // Ajouter nouvelles images à la galerie existante
      if (galleryUrls.length > 0) {
        place.gallery = [...(place.gallery || []), ...galleryUrls];
      }
      
      await place.save();
      
      // ✅ METTRE À JOUR AUSSI LE LIEU BASIQUE dans RegionDetails
      const basicPlace = regionDetails.popularPlaces.find(p => 
        p.title === title || String(p.id) === String(placeDocumentId)
      );
      if (basicPlace) {
        basicPlace.title = title;
        basicPlace.location = location;
        basicPlace.category = category;
        basicPlace.updatedAt = new Date();
        
        if (galleryUrls.length > 0 && !basicPlace.hasImage) {
          basicPlace.hasImage = true;
          basicPlace.imageUrl = galleryUrls[0];
        }
        
        await regionDetails.save();
        console.log('✅ Lieu basique synchronisé lors de la mise à jour');
      }
      
      console.log(`✅ Lieu mis à jour par ${userRole}: ${title}`);
      
    } else {
      // ✅ CRÉATION
      console.log('➕ Création de nouveaux détails');
      
      place = new PopularPlace({
        _id: placeDocumentId, // ObjectId
        regionDetailsId: regionDetails._id, // ✅ CORRECTION: ObjectId de RegionDetails
        title,
        description,
        location,
        category,
        coordinates,
        visitSchedules,
        practicalInfos,
        contact,
        activities: activities || [],
        specialTips: specialTips || [],
        gallery: galleryUrls,
        hasFullDetails: true, // ✅ Marquer comme ayant des détails complets
        createdBy: adminInfo,
        lastEditedBy: adminInfo
      });
      
      await place.save();
      
      console.log(`✅ Nouveau lieu créé par ${userRole}: ${title}`);
    }

    // ✅ FONCTION DE CALCUL DE COMPLÉTION
    const calculateCompletionStatus = (place) => {
      let completed = 0;
      let total = 8;
      
      if (place.title && place.title.length >= 3) completed++;
      if (place.description && place.description.length >= 50) completed++;
      if (place.location && place.location.length >= 5) completed++;
      if (place.coordinates && place.coordinates.latitude && place.coordinates.longitude) completed++;
      if (place.visitSchedules && Object.keys(place.visitSchedules).length > 0) completed++;
      if (place.practicalInfos && Object.keys(place.practicalInfos).length > 0) completed++;
      if (place.contact && (place.contact.phone || place.contact.email || place.contact.website)) completed++;
      if (place.gallery && place.gallery.length > 0) completed++;
      
      return {
        percentage: Math.round((completed / total) * 100),
        completed,
        total
      };
    };

    // ✅ LOG FINAL DÉTAILLÉ
    console.log('📊 === RÉSUMÉ FINAL ===');
    console.log('- ID du lieu:', placeDocumentId);
    console.log('- Titre:', place.title);
    console.log('- Type d\'opération:', isNewPlace ? 'CRÉATION' : 'MISE À JOUR');
    console.log('- Région associée:', regionDetails.region_id);
    console.log('- Activités configurées:', place.activities?.length || 0);
    console.log('- Images galerie:', place.gallery?.length || 0);
    console.log('- Description longueur:', (place.description || '').length);
    console.log('- Coordonnées:', place.coordinates ? 'Définies' : 'Non définies');

    const completionStatus = calculateCompletionStatus(place);
    console.log('- Complétion:', `${completionStatus.percentage}% (${completionStatus.completed}/${completionStatus.total})`);

    // ✅ RÉPONSE FINALE
    return res.json({
      success: true,
      message: isNewPlace ? "Détails du lieu créés avec succès" : "Détails du lieu mis à jour avec succès",
      details: {
        ...place.toObject(),
        metadata: {
          isNewPlace,
          placeId: placeDocumentId,
          regionId: regionDetails.region_id,
          regionObjectId: regionDetails._id,
          totalGalleryImages: place.gallery?.length || 0,
          totalActivities: place.activities?.length || 0,
          totalSpecialTips: place.specialTips?.length || 0,
          lastUpdated: place.updatedAt,
          completionStatus: completionStatus
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur createOrUpdateDetails:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};*/

// ===== LISTER LIEUX POUR ADMIN =====
exports.getAdminPlacesList = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      regionId, 
      hasFullDetails,
      sortBy = 'updatedAt'
    } = req.query;
    
    // Vérifier les permissions
    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }
    
    const query = { isActive: true };
    
    // ✅ FILTRAGE PAR RÉGION CORRIGÉ
    if (regionId) {
      const detailRegion = await RegionDetails.findOne({ region_id: regionId });
      if (detailRegion) {
        query.regionDetailsId = detailRegion._id;
      } else {
        return res.status(404).json({
          success: false,
          message: "Région non trouvée"
        });
      }
    }
    
    if (hasFullDetails !== undefined) {
      query.hasFullDetails = hasFullDetails === 'true';
    }
    
    const sortOptions = {
      'updatedAt': { updatedAt: -1 },
      'createdAt': { createdAt: -1 },
      'title': { title: 1 },
      'rating': { averageRating: -1 },
      'views': { viewsCount: -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.updatedAt;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const places = await PopularPlace.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('regionDetailsId', 'region_id name location')
      .lean(); // ✅ AJOUTÉ pour performance
    
    const total = await PopularPlace.countDocuments(query);
    
    // ✅ ENRICHIR LES DONNÉES
    const enrichedPlaces = places.map(place => ({
      ...place,
      completionStatus: calculateCompletionStatus(place),
      regionInfo: place.regionDetailsId ? {
        id: place.regionDetailsId.region_id,
        name: place.regionDetailsId.name || 'Région inconnue'
      } : null
    }));
    
    console.log(`✅ Liste admin: ${enrichedPlaces.length} lieux trouvés`);
    
    return res.json({
      success: true,
      data: enrichedPlaces,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getAdminPlacesList:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== STATISTIQUES DES LIEUX =====
exports.getPlacesStats = async (req, res) => {
  try {
    // Vérifier les permissions
    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }
    
    console.log('📊 Calcul des statistiques PopularPlaces...');
    
    const stats = await PopularPlace.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalPlaces: { $sum: 1 },
          placesWithFullDetails: {
            $sum: { $cond: [{ $eq: ['$hasFullDetails', true] }, 1, 0] }
          },
          totalViews: { $sum: '$viewsCount' },
          totalFavorites: { $sum: '$favoritesCount' },
          totalReviews: { $sum: '$totalReviews' },
          averageRatingOverall: { $avg: '$averageRating' }
        }
      }
    ]);
    
    const regionStats = await PopularPlace.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'regiondetails',
          localField: 'regionDetailsId',
          foreignField: '_id',
          as: 'region'
        }
      },
      { $unwind: '$region' },
      {
        $group: {
          _id: '$region.region_id',
          regionName: { $first: '$region.name' },
          count: { $sum: 1 },
          averageRating: { $avg: '$averageRating' },
          totalViews: { $sum: '$viewsCount' },
          totalReviews: { $sum: '$totalReviews' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const overallStats = stats[0] || {
      totalPlaces: 0,
      placesWithFullDetails: 0,
      totalViews: 0,
      totalFavorites: 0,
      totalReviews: 0,
      averageRatingOverall: 0
    };
    
    // ✅ ARRONDIR LA MOYENNE GÉNÉRALE
    if (overallStats.averageRatingOverall) {
      overallStats.averageRatingOverall = parseFloat(overallStats.averageRatingOverall.toFixed(1));
    }
    
    console.log(`✅ Stats calculées: ${overallStats.totalPlaces} lieux, ${regionStats.length} régions`);
    
    return res.json({
      success: true,
      data: {
        overall: overallStats,
        byRegion: regionStats,
        summary: {
          completionRate: overallStats.totalPlaces > 0 
            ? Math.round((overallStats.placesWithFullDetails / overallStats.totalPlaces) * 100)
            : 0,
          averageViewsPerPlace: overallStats.totalPlaces > 0 
            ? Math.round(overallStats.totalViews / overallStats.totalPlaces)
            : 0
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getPlacesStats:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RÉCUPÉRER LIEUX PAR RÉGION =====
exports.getPlacesByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    const { 
      sortBy = 'rating', 
      limit = 20, 
      page = 1, 
      hasFullDetails 
    } = req.query;
    
    console.log(`🏛️ Récupération lieux région: ${regionId}`);
    
    // 1. Chercher la région par region_id
    const detailRegion = await RegionDetails.findOne({ region_id: regionId });
    if (!detailRegion) {
      return res.status(404).json({
        success: false,
        message: "Région non trouvée"
      });
    }
    
    // 2. Récupérer les lieux de base depuis RegionDetails
    let places = detailRegion.popularPlaces || [];
    
    // 3. Filtrer par hasFullDetails si demandé
    if (hasFullDetails !== undefined) {
      const hasDetails = hasFullDetails === 'true';
      
      // ✅ CORRIGÉ : Récupérer les ObjectIds des lieux avec détails complets
      const placesWithDetails = await PopularPlace.find({
        regionDetailsId: detailRegion._id,
        isActive: true,
        hasFullDetails: true
      }).select('_id').lean();
      
      const detailedPlaceIds = placesWithDetails.map(p => String(p._id));
      
      // Note : Comparaison délicate car les IDs peuvent être différents entre basic et detailed
      places = places.filter(place => {
        // Pour l'instant, on utilise le titre pour la correspondance
        // Car l'ID numérique du basic peut ne pas correspondre à l'ObjectId
        const hasDetail = placesWithDetails.some(detailedPlace => {
          // Vous pourriez avoir besoin d'une logique de correspondance plus sophistiquée ici
          return true; // Temporaire - à adapter selon votre logique
        });
        return hasDetails ? hasDetail : !hasDetail;
      });
    }
    
    // 4. Tri
    const sortOptions = {
      'rating': (a, b) => (b.rating || 0) - (a.rating || 0),
      'name': (a, b) => (a.title || '').localeCompare(b.title || ''),
      'reviews': (a, b) => (b.reviews || 0) - (a.reviews || 0),
      'updated': (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    };
    
    if (sortOptions[sortBy]) {
      places.sort(sortOptions[sortBy]);
    }
    
    // 5. Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPlaces = places.slice(startIndex, endIndex);
    
    console.log(`✅ ${paginatedPlaces.length} lieux trouvés pour région ${regionId}`);
    
    return res.json({
      success: true,
      data: paginatedPlaces,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(places.length / parseInt(limit)),
        totalItems: places.length,
        itemsPerPage: parseInt(limit)
      },
      region: {
        id: detailRegion.region_id,
        name: detailRegion.name || 'Région',
        location: detailRegion.location
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getPlacesByRegion:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RECHERCHER LIEUX =====
exports.searchPlaces = async (req, res) => {
  try {
    const { 
      query: searchQuery = '', 
      regionId, 
      minRating = 0,
      category,
      sortBy = 'rating',
      limit = 20,
      page = 1
    } = req.query;
    
    console.log(`🔍 Recherche: "${searchQuery}" ${regionId ? `dans ${regionId}` : 'toutes régions'}`);
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Le terme de recherche doit contenir au moins 2 caractères"
      });
    }
    
    // 1. Construction de la requête RegionDetails
    let regionQuery = {};
    if (regionId) {
      regionQuery.region_id = regionId;
    }
    
    // 2. Rechercher dans toutes les régions
    const detailRegions = await RegionDetails.find(regionQuery).lean();
    let allPlaces = [];
    
    for (const detailRegion of detailRegions) {
      if (detailRegion.popularPlaces && detailRegion.popularPlaces.length > 0) {
        const regionPlaces = detailRegion.popularPlaces.map(place => ({
          ...place,
          regionInfo: {
            id: detailRegion.region_id,
            name: detailRegion.name || 'Région',
            location: detailRegion.location
          }
        }));
        allPlaces = [...allPlaces, ...regionPlaces];
      }
    }
    
    // 3. Filtrage par terme de recherche
    const searchTerm = searchQuery.toLowerCase().trim();
    let filteredPlaces = allPlaces.filter(place => {
      const title = (place.title || '').toLowerCase();
      const location = (place.location || place.regionInfo?.location || '').toLowerCase();
      const category = (place.category || '').toLowerCase();
      
      return title.includes(searchTerm) || 
             location.includes(searchTerm) || 
             category.includes(searchTerm);
    });
    
    // 4. Filtrage par rating minimum
    if (minRating > 0) {
      filteredPlaces = filteredPlaces.filter(place => 
        (place.rating || 0) >= parseFloat(minRating)
      );
    }
    
    // 5. Filtrage par catégorie
    if (category) {
      filteredPlaces = filteredPlaces.filter(place => 
        (place.category || '').toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // 6. Tri
    const sortOptions = {
      'rating': (a, b) => (b.rating || 0) - (a.rating || 0),
      'name': (a, b) => (a.title || '').localeCompare(b.title || ''),
      'reviews': (a, b) => (b.reviews || 0) - (a.reviews || 0),
      'relevance': (a, b) => {
        // Tri par pertinence : titre exact > début titre > contenu
        const aTitle = (a.title || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();
        
        const aExact = aTitle === searchTerm ? 3 : (aTitle.startsWith(searchTerm) ? 2 : 1);
        const bExact = bTitle === searchTerm ? 3 : (bTitle.startsWith(searchTerm) ? 2 : 1);
        
        return bExact - aExact;
      }
    };
    
    if (sortOptions[sortBy]) {
      filteredPlaces.sort(sortOptions[sortBy]);
    }
    
    // 7. Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPlaces = filteredPlaces.slice(startIndex, endIndex);
    
    console.log(`✅ ${paginatedPlaces.length} résultats trouvés pour "${searchQuery}"`);
    
    return res.json({
      success: true,
      data: paginatedPlaces,
      search: {
        query: searchQuery,
        regionId: regionId || 'all',
        minRating: parseFloat(minRating),
        category: category || 'all',
        totalResults: filteredPlaces.length
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredPlaces.length / parseInt(limit)),
        totalItems: filteredPlaces.length,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur searchPlaces:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== SUPPRIMER LIEU =====
exports.deletePlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;
    
    // Vérifier les permissions
    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }
    
    // ✅ CORRIGÉ : Recherche par ObjectId directement
    const place = await PopularPlace.findOne({ _id: placeId, isActive: true });
    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Lieu non trouvé"
      });
    }
    
    // ✅ SOFT DELETE + MISE À JOUR ADMIN INFO
    place.isActive = false;
    place.lastEditedBy = {
      userId: req.user.id,
      role: req.user.role,
      username: req.user.username || `${req.user.role}_${req.user.id.slice(-6)}`,
      editedAt: new Date()
    };
    
    await place.save();
    
    console.log(`🗑️ Lieu supprimé par ${req.user.role}: ${place.title} (ID: ${placeId})`);
    
    return res.json({
      success: true,
      message: "Lieu supprimé avec succès",
      data: {
        placeId: placeId, // ✅ CORRIGÉ : garder comme ObjectId
        title: place.title,
        deletedBy: req.user.role,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur deletePlaceDetails:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== SYNCHRONISER DONNÉES =====
exports.syncBasicData = async (req, res) => {
  try {
    // Vérifier les permissions
    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }
    
    console.log('🔄 Début de la synchronisation des données de base...');
    
    const places = await PopularPlace.find({ isActive: true })
      .populate('regionDetailsId')
      .lean();
    
    let updated = 0;
    let errors = 0;
    
    for (const place of places) {
      try {
        const detailRegion = await RegionDetails.findById(place.regionDetailsId._id);
        if (!detailRegion) {
          console.warn(`⚠️ Région non trouvée pour lieu ${place._id}`);
          errors++;
          continue;
        }
        
        // ✅ CORRIGÉ : Recherche par titre au lieu de l'ID car les IDs peuvent être différents
        const basicPlace = detailRegion.popularPlaces?.find(p => 
          p.title === place.title || String(p.id) === String(place._id)
        );
        
        if (basicPlace) {
          let hasChanges = false;
          
          // Synchroniser rating
          if (Math.abs((place.averageRating || 0) - (basicPlace.rating || 0)) > 0.1) {
            basicPlace.rating = place.averageRating || 0;
            hasChanges = true;
          }
          
          // Synchroniser title
          if (place.title !== basicPlace.title) {
            basicPlace.title = place.title;
            hasChanges = true;
          }
          
          // Synchroniser location
          if (place.location !== basicPlace.location) {
            basicPlace.location = place.location;
            hasChanges = true;
          }
          
          // Synchroniser category
          if (place.category !== basicPlace.category) {
            basicPlace.category = place.category;
            hasChanges = true;
          }
          
          // Synchroniser hasImage
          const hasGallery = place.gallery && place.gallery.length > 0;
          if (hasGallery !== basicPlace.hasImage) {
            basicPlace.hasImage = hasGallery;
            if (hasGallery && place.gallery[0] && !basicPlace.imageUrl) {
              basicPlace.imageUrl = place.gallery[0];
            }
            hasChanges = true;
          }
          
          // Mettre à jour timestamp
          if (hasChanges) {
            basicPlace.updatedAt = new Date();
            await detailRegion.save();
            updated++;
            console.log(`✅ Synchronisé: ${place.title}`);
          }
        } else {
          console.warn(`⚠️ Lieu basique non trouvé pour PopularPlace ${place._id} (${place.title})`);
          errors++;
        }
      } catch (syncError) {
        console.error(`❌ Erreur sync lieu ${place._id}:`, syncError.message);
        errors++;
      }
    }
    
    console.log(`🎉 Synchronisation terminée: ${updated} lieux mis à jour, ${errors} erreurs`);
    
    return res.json({
      success: true,
      message: `Synchronisation terminée: ${updated} lieux mis à jour${errors > 0 ? `, ${errors} erreurs` : ''}`,
      data: { 
        updated, 
        errors,
        totalProcessed: places.length
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur syncBasicData:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== FONCTION HELPER COMPLÉTION =====
function calculateCompletionStatus(placeDetails) {
  let completed = 0;
  let total = 8;
  
  // 1. Titre (12.5%)
  if ((placeDetails.title || '').trim().length >= 3) completed++;
  
  // 2. Description (12.5%)
  if ((placeDetails.description || '').trim().length >= 50) completed++;
  
  // 3. Localisation (12.5%)
  if ((placeDetails.location || '').trim().length >= 5) completed++;
  
  // 4. Coordonnées (12.5%)
  if (placeDetails.coordinates && 
      placeDetails.coordinates.latitude && 
      placeDetails.coordinates.longitude) completed++;
  
  // 5. Horaires (12.5%)
  if (placeDetails.visitSchedules && 
      placeDetails.visitSchedules.weekdays && 
      placeDetails.visitSchedules.weekdays.open) completed++;
  
  // 6. Informations pratiques (12.5%)
  if (placeDetails.practicalInfos && 
      (placeDetails.practicalInfos.duration || '').trim().length >= 5) completed++;
  
  // 7. Contact (12.5%)
  if (placeDetails.contact && 
      (placeDetails.contact.phone || placeDetails.contact.email || placeDetails.contact.website)) completed++;
  
  // 8. Images (12.5%)
  if (placeDetails.gallery && placeDetails.gallery.length > 0) completed++;
  
  const percentage = Math.round((completed / total) * 100);
  
  let status = 'empty';
  if (percentage >= 100) status = 'complete';
  else if (percentage >= 88) status = 'nearly_complete';
  else if (percentage >= 75) status = 'good';
  else if (percentage >= 50) status = 'partial';
  else if (percentage >= 25) status = 'basic';
  
  return {
    percentage,
    status,
    completed,
    total,
    missing: total - completed,
    details: {
      hasTitle: (placeDetails.title || '').trim().length >= 3,
      hasDescription: (placeDetails.description || '').trim().length >= 50,
      hasLocation: (placeDetails.location || '').trim().length >= 5,
      hasCoordinates: !!(placeDetails.coordinates?.latitude && placeDetails.coordinates?.longitude),
      hasSchedules: !!(placeDetails.visitSchedules?.weekdays?.open),
      hasPracticalInfos: !!(placeDetails.practicalInfos?.duration),
      hasContact: !!(placeDetails.contact?.phone || placeDetails.contact?.email || placeDetails.contact?.website),
      hasImages: !!(placeDetails.gallery?.length > 0)
    }
  };
}

module.exports = {
  getPopularPlacesByRegion:exports.getPopularPlacesByRegion,
  getPlaceByOriginalId: exports.getPlaceByOriginalId,
  submitFeedback: exports.submitFeedback,
  toggleFavorite: exports.toggleFavorite,
  markReviewAsHelpful: exports.markReviewAsHelpful,
  createOrUpdateDetails: exports.createOrUpdateDetails,
  getAdminPlacesList: exports.getAdminPlacesList,
  getPlacesStats: exports.getPlacesStats,
  getPlacesByRegion: exports.getPlacesByRegion,
  searchPlaces: exports.searchPlaces,
  deletePlaceDetails: exports.deletePlaceDetails,
  syncBasicData: exports.syncBasicData,
  getUserFavoritePlaces:exports.getUserFavoritePlaces,
  calculateCompletionStatus
};
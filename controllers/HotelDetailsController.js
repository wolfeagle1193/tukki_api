// controllers/hotelController.js - CONTRÔLEUR COMPLET CORRIGÉ
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const HotelDetails = require('../models/HotelDetails');
const { validationResult } = require('express-validator');









// Récupérer tous les hôtels favoris d'un utilisateur
exports.getUserFavoriteHotels = async (req, res) => {
  try {
    const { id: userId, username } = req.user;
    const { sortBy = 'dateAdded' } = req.query;
    
    const displayName = username || `User${userId.slice(-6)}`;
    console.log(`💖 Récupération favoris pour: ${displayName}`);
    
    // Query simple : tous les hôtels où l'utilisateur est dans favoritedBy
    const query = { 
      isActive: true,
      favoritedBy: userId
    };
    
    // Options de tri
    const sortOptions = {
      'dateAdded': { updatedAt: -1 }, // Plus récemment ajouté en favoris
      'title': { title: 1 },         // Alphabétique
      'rating': { averageRating: -1 }, // Par note (mais c'est le choix de l'utilisateur)
      'price': { 'price.minPrice': 1 } // Par prix
    };
    
    const sort = sortOptions[sortBy] || sortOptions.dateAdded;
    
    // Récupération de TOUS les favoris de l'utilisateur
    const favoriteHotels = await HotelDetails.find(query)
      .sort(sort)
      .lean();
    
    // Format simple pour mobile
    const userFavorites = favoriteHotels.map(hotel => ({
      id: hotel._id,
      title: hotel.title || '',
      location: hotel.location || '',
      region: hotel.region_Name || '',
      rating: hotel.averageRating || 0,
      totalReviews: hotel.totalReviews || 0,
      price: hotel.price ? hotel.price.minPrice || 0 : 0,
      priceDisplay: hotel.price && hotel.price.minPrice && hotel.price.maxPrice && hotel.price.minPrice !== hotel.price.maxPrice 
        ? `${hotel.price.minPrice} - ${hotel.price.maxPrice} FCFA`
        : `À partir de ${hotel.price ? hotel.price.minPrice || 0 : 0} FCFA`,
      imageUrl: hotel.placeImage || null,
      description: hotel.description ? hotel.description.substring(0, 100) + '...' : '',
      isFavoriteByUser: true, // Toujours true puisque c'est SA liste de favoris
      addedToFavoritesAt: hotel.updatedAt || hotel.createdAt
    }));
    
    console.log(`✅ ${userFavorites.length} favoris trouvés pour ${displayName}`);
    
    return res.json({
      success: true,
      data: userFavorites,
      totalFavorites: userFavorites.length,
      message: userFavorites.length === 0 
        ? "Vous n'avez pas encore d'hôtels favoris" 
        : `Vous avez ${userFavorites.length} hôtel${userFavorites.length > 1 ? 's' : ''} en favoris`
    });
    
  } catch (error) {
    console.error(`❌ Erreur getUserFavoriteHotels:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos favoris",
      data: []
    });
  }
}


// ===== RÉCUPÉRER TOUS LES HÔTELS (SCROLL MOBILE) =====
exports.getAllHotels = async (req, res) => {
  try {
    const { 
      sortBy = 'averageRating',
      minRating = 0,
      maxPrice,
      minPrice,
      hasRooms,
      isActive = true
    } = req.query;
    
    console.log(`🏨 Récupération de tous les hôtels pour scroll mobile`);
    
    const query = { 
      isActive: isActive === 'true' || isActive === true,
      hasFullDetails: true
    };
    
    // Filtrage par rating minimum
    if (minRating && parseFloat(minRating) > 0) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }
    
    // Filtrage par prix avec nouvelle structure price: { minPrice, maxPrice }
    if (minPrice || maxPrice) {
      const priceConditions = [];
      
      if (minPrice) {
        const minPriceValue = parseFloat(minPrice);
        priceConditions.push({
          $or: [
            { 'price.minPrice': { $gte: minPriceValue } },
            { 
              $and: [
                { 'price.minPrice': { $lte: minPriceValue } },
                { 'price.maxPrice': { $gte: minPriceValue } }
              ]
            }
          ]
        });
      }
      
      if (maxPrice) {
        const maxPriceValue = parseFloat(maxPrice);
        priceConditions.push({
          'price.minPrice': { $lte: maxPriceValue }
        });
      }
      
      if (priceConditions.length > 0) {
        query.$and = query.$and ? [...query.$and, ...priceConditions] : priceConditions;
      }
    }
    
    // Filtrage par disponibilité des chambres
    if (hasRooms !== undefined) {
      if (hasRooms === 'true') {
        query.rooms = { $exists: true, $not: { $size: 0 } };
      } else {
        query.$or = [
          { rooms: { $exists: false } },
          { rooms: { $size: 0 } }
        ];
      }
    }
    
    // Options de tri
    const sortOptions = {
      'averageRating': { averageRating: -1, totalReviews: -1 },
      'price_asc': { 'price.minPrice': 1 },
      'price_desc': { 'price.maxPrice': -1 },
      'title': { title: 1 },
      'location': { location: 1 },
      'newest': { createdAt: -1 },
      'popular': { viewsCount: -1, favoritesCount: -1 },
      'reviews': { totalReviews: -1, averageRating: -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.averageRating;
    
    // Récupération TOUS les hôtels (pas de pagination pour le scroll mobile)
    const hotels = await HotelDetails.find(query)
      .sort(sort)
      //.populate('rooms', 'type capacity price')
      .lean();
    
    const totalHotels = hotels.length;
    
    // Format des données pour le mobile
    const processedHotels = hotels.map(hotel => ({
      id: hotel._id,
      title: hotel.title || '',
      location: hotel.location || '',
      region: hotel.region_Name || '',
      rating: hotel.averageRating || 0,
      totalReviews: hotel.totalReviews || 0,
      price: hotel.price ? hotel.price.minPrice || 0 : 0,
      priceRange: {
        min: hotel.price ? hotel.price.minPrice || 0 : 0,
        max: hotel.price ? hotel.price.maxPrice || 0 : 0,
        display: hotel.price && hotel.price.minPrice && hotel.price.maxPrice && hotel.price.minPrice !== hotel.price.maxPrice 
          ? `${hotel.price.minPrice} - ${hotel.price.maxPrice} FCFA`
          : `À partir de ${hotel.price ? hotel.price.minPrice || 0 : 0} FCFA`
      },
      hasImage: hotel.placeImage ? true : false,
      imageUrl: hotel.placeImage || null,
      gallery: hotel.gallery || [],
      description: hotel.description ? hotel.description.substring(0, 150) + '...' : '',
      availability: hotel.availability ? {
        start: hotel.availability.start,
        end: hotel.availability.end,
        formatted: hotel.getFormattedAvailability ? hotel.getFormattedAvailability() : ''
      } : null,
      facilities: hotel.facilities || [],
      services: hotel.services ? hotel.services.filter(s => s.available) : [],
      viewsCount: hotel.viewsCount || 0,
      favoritesCount: hotel.favoritesCount || 0,
      hasRooms: hotel.rooms && hotel.rooms.length > 0,
      roomsCount: hotel.rooms ? hotel.rooms.length : 0,
      createdAt: hotel.createdAt || new Date()
    }));
    
    console.log(`✅ ${processedHotels.length} hôtels récupérés pour affichage mobile`);
    
    return res.json({
      success: true,
      data: processedHotels,
      stats: {
        totalHotels,
        averageRating: totalHotels > 0 
          ? parseFloat((processedHotels.reduce((sum, hotel) => sum + hotel.rating, 0) / totalHotels).toFixed(1))
          : 0,
        priceRange: totalHotels > 0 ? {
          min: Math.min(...processedHotels.map(h => h.priceRange.min)),
          max: Math.max(...processedHotels.map(h => h.priceRange.max))
        } : { min: 0, max: 0 }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getAllHotels:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: []
    });
  }
};

// ===== RÉCUPÉRER HÔTELS PAR RÉGION =====
exports.getHotelsByRegion = async (req, res) => {
  try {
    const { regionName } = req.params;
    const { 
      sortBy = 'averageRating',
      minRating = 0,
      maxPrice,
      minPrice,
      hasRooms
    } = req.query;
    
    console.log(`🏨 Récupération hôtels pour région: ${regionName}`);
    
    const query = { 
      isActive: true,
      hasFullDetails: true,
      region_Name: { $regex: regionName, $options: 'i' }
    };
    
    // Filtrage par rating minimum
    if (minRating && parseFloat(minRating) > 0) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }
    
    // Filtrage par prix avec nouvelle structure price: { minPrice, maxPrice }
    if (minPrice || maxPrice) {
      const priceConditions = [];
      
      if (minPrice) {
        const minPriceValue = parseFloat(minPrice);
        priceConditions.push({
          $or: [
            { 'price.minPrice': { $gte: minPriceValue } },
            { 
              $and: [
                { 'price.minPrice': { $lte: minPriceValue } },
                { 'price.maxPrice': { $gte: minPriceValue } }
              ]
            }
          ]
        });
      }
      
      if (maxPrice) {
        const maxPriceValue = parseFloat(maxPrice);
        priceConditions.push({
          'price.minPrice': { $lte: maxPriceValue }
        });
      }
      
      if (priceConditions.length > 0) {
        query.$and = query.$and ? [...query.$and, ...priceConditions] : priceConditions;
      }
    }
    
    // Filtrage par disponibilité des chambres
    if (hasRooms !== undefined) {
      if (hasRooms === 'true') {
        query.rooms = { $exists: true, $not: { $size: 0 } };
      } else {
        query.$or = [
          { rooms: { $exists: false } },
          { rooms: { $size: 0 } }
        ];
      }
    }
    
    // Options de tri
    const sortOptions = {
      'averageRating': { averageRating: -1, totalReviews: -1 },
      'price_asc': { 'price.minPrice': 1 },
      'price_desc': { 'price.maxPrice': -1 },
      'title': { title: 1 },
      'location': { location: 1 },
      'newest': { createdAt: -1 },
      'popular': { viewsCount: -1, favoritesCount: -1 },
      'reviews': { totalReviews: -1, averageRating: -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.averageRating;
    
    // Récupération des hôtels de la région (tous pour le scroll mobile)
    const hotels = await HotelDetails.find(query)
      .sort(sort)
      .populate('rooms', 'type capacity price')
      .lean();
    
    // Vérifier si la région existe (au moins un hôtel trouvé)
    if (hotels.length === 0) {
      return res.json({
        success: true,
        data: [],
        regionInfo: {
          name: regionName,
          location: ''
        },
        message: "Aucun hôtel disponible dans cette région pour le moment"
      });
    }
    
    // Format des données pour le mobile
    const processedHotels = hotels.map(hotel => ({
      id: hotel._id,
      title: hotel.title || '',
      location: hotel.location || '',
      region: hotel.region_Name || '',
      rating: hotel.averageRating || 0,
      totalReviews: hotel.totalReviews || 0,
      price: hotel.price ? hotel.price.minPrice || 0 : 0,
      priceRange: {
        min: hotel.price ? hotel.price.minPrice || 0 : 0,
        max: hotel.price ? hotel.price.maxPrice || 0 : 0,
        display: hotel.price && hotel.price.minPrice && hotel.price.maxPrice && hotel.price.minPrice !== hotel.price.maxPrice 
          ? `${hotel.price.minPrice} - ${hotel.price.maxPrice} FCFA`
          : `À partir de ${hotel.price ? hotel.price.minPrice || 0 : 0} FCFA`
      },
      hasImage: hotel.placeImage ? true : false,
      imageUrl: hotel.placeImage || null,
      gallery: hotel.gallery || [],
      description: hotel.description ? hotel.description.substring(0, 150) + '...' : '',
      availability: hotel.availability ? {
        start: hotel.availability.start,
        end: hotel.availability.end,
        formatted: hotel.getFormattedAvailability ? hotel.getFormattedAvailability() : ''
      } : null,
      facilities: hotel.facilities || [],
      services: hotel.services ? hotel.services.filter(s => s.available) : [],
      viewsCount: hotel.viewsCount || 0,
      favoritesCount: hotel.favoritesCount || 0,
      hasRooms: hotel.rooms && hotel.rooms.length > 0,
      roomsCount: hotel.rooms ? hotel.rooms.length : 0,
      createdAt: hotel.createdAt || new Date()
    }));
    
    console.log(`✅ ${processedHotels.length} hôtels trouvés dans la région ${regionName}`);
    
    return res.json({
      success: true,
      data: processedHotels,
      regionInfo: {
        name: regionName,
        totalHotels: processedHotels.length
      },
      stats: {
        totalHotels: processedHotels.length,
        averageRating: processedHotels.length > 0 
          ? parseFloat((processedHotels.reduce((sum, hotel) => sum + hotel.rating, 0) / processedHotels.length).toFixed(1))
          : 0,
        priceRange: processedHotels.length > 0 ? {
          min: Math.min(...processedHotels.map(h => h.priceRange.min)),
          max: Math.max(...processedHotels.map(h => h.priceRange.max))
        } : { min: 0, max: 0 },
        facilitiesAvailable: [...new Set(
          processedHotels.flatMap(h => h.facilities.flatMap(f => Object.keys(f).filter(key => key !== '_id' && f[key] === true)))
        )],
        hasRoomsCount: processedHotels.filter(h => h.hasRooms).length
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getHotelsByRegion:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: []
    });
  }
};

// ===== RÉCUPÉRER DÉTAILS D'UN HÔTEL PAR ID =====
exports.getHotelById = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const currentUserId = req.user.id;
    
    console.log(`🔍 Recherche hôtel ID: ${hotelId}`);
    console.log(`👤 Utilisateur connecté: ${currentUserId}`);
    
    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        success: false,
        message: "ID d'hôtel invalide"
      });
    }
    
    const hotel = await HotelDetails.findOne({ 
      _id: hotelId, 
      isActive: true 
    })//.populate('rooms')
    .lean();
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hôtel non trouvé"
      });
    }
    
    // Incrémenter les vues
    await HotelDetails.findByIdAndUpdate(
      hotelId, 
      { $inc: { viewsCount: 1 } }
    );
    
    // Traitement des données utilisateur
    const processedHotel = {
      ...hotel,
      viewsCount: (hotel.viewsCount || 0) + 1
    };

    // Traitement simple des avis (sans helpful)
    if (processedHotel.reviews && processedHotel.reviews.length > 0) {
      processedHotel.reviews = processedHotel.reviews.map(review => ({
        ...review
      }));
    }

    // Vérifier si l'utilisateur a mis en favoris
    const isFavorite = hotel.favoritedBy && Array.isArray(hotel.favoritedBy)
      ? hotel.favoritedBy.some(userId => userId.toString() === currentUserId.toString())
      : false;
    
    processedHotel.isFavoriteByUser = isFavorite;

    console.log(`✅ Détails hôtel trouvés: ${hotel.title}`);
    
    return res.json({
      success: true,
      details: {
        ...processedHotel,
        priceInfo: {
          minPrice: hotel.price ? hotel.price.minPrice || 0 : 0,
          maxPrice: hotel.price ? hotel.price.maxPrice || 0 : 0,
          display: hotel.price && hotel.price.minPrice && hotel.price.maxPrice && hotel.price.minPrice !== hotel.price.maxPrice 
            ? `${hotel.price.minPrice} - ${hotel.price.maxPrice} FCFA`
            : `À partir de ${hotel.price ? hotel.price.minPrice || 0 : 0} FCFA`
        },
        availabilityInfo: hotel.availability ? {
          start: hotel.availability.start,
          end: hotel.availability.end,
          formatted: hotel.getFormattedAvailability ? hotel.getFormattedAvailability() : ''
        } : null,
        facilitiesAvailable: hotel.facilities ? hotel.facilities.filter(f => Object.values(f).some(v => v === true)) : [],
        servicesAvailable: hotel.services ? hotel.services.filter(s => s.available) : []
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getHotelById:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== AJOUTER UN AVIS HÔTEL =====
// ===== AJOUTER UN AVIS HÔTEL - VERSION COMPLÈTEMENT CORRIGÉE =====
exports.submitHotelReview = async (req, res) => {
  let hotelId;
  let userId;
  
  try {
    console.log('🎯 Début submitHotelReview');
    
    // Validation initiale des paramètres
    hotelId = req.params.hotelId;
    const { rating, review = '' } = req.body;
    
    // Vérification de l'authentification
    if (!req.user || !req.user.id) {
      console.log('❌ Utilisateur non authentifié');
      return res.status(401).json({
        success: false,
        message: "Authentification requise pour donner un avis"
      });
    }
    
    userId = req.user.id;
    const { username = '', profile = '' } = req.user;
    const displayName = username || `User${userId.slice(-6)}`;

    console.log('📋 Données reçues:', {
      hotelId,
      userId,
      displayName,
      rating: typeof rating,
      ratingValue: rating,
      reviewLength: review ? review.trim().length : 0,
      timestamp: new Date().toISOString()
    });

    // Validation des données reçues
    if (!hotelId) {
      console.log('❌ Hotel ID manquant');
      return res.status(400).json({
        success: false,
        message: "ID de l'hôtel requis"
      });
    }

    if (!rating || rating === null || rating === undefined) {
      console.log('❌ Rating manquant:', rating);
      return res.status(400).json({
        success: false,
        message: "La note est obligatoire"
      });
    }

    // Conversion et validation de la note
    const numericRating = parseInt(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      console.log('❌ Rating invalide:', { rating, numericRating });
      return res.status(400).json({
        success: false,
        message: "La note doit être un nombre entre 1 et 5"
      });
    }

    // Validation de l'avis si fourni
    const trimmedReview = review ? review.trim() : '';
    if (trimmedReview && trimmedReview.length > 0) {
      if (trimmedReview.length < 5) {
        console.log('❌ Avis trop court:', trimmedReview.length);
        return res.status(400).json({
          success: false,
          message: "L'avis doit contenir au moins 5 caractères"
        });
      }
      
      if (trimmedReview.length > 500) {
        console.log('❌ Avis trop long:', trimmedReview.length);
        return res.status(400).json({
          success: false,
          message: "L'avis ne peut pas dépasser 500 caractères"
        });
      }
    }

    console.log(`⭐ Recherche hôtel: ${hotelId}`);
    
    // Recherche de l'hôtel avec gestion d'erreur spécifique
    let hotel;
    try {
      hotel = await HotelDetails.findOne({ 
        _id: hotelId, 
        isActive: true 
      });
    } catch (findError) {
      console.log('❌ Erreur recherche hôtel:', findError.message);
      
      if (findError.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: "Format d'ID d'hôtel invalide"
        });
      }
      
      throw findError; // Re-lancer l'erreur pour la gestion générale
    }
    
    if (!hotel) {
      console.log('❌ Hôtel non trouvé ou inactif:', hotelId);
      return res.status(404).json({
        success: false,
        message: "Hôtel non trouvé ou non disponible"
      });
    }

    console.log('✅ Hôtel trouvé:', hotel.title);
    
    // Vérification si l'utilisateur a déjà donné un avis
    const existingReview = hotel.reviews && hotel.reviews.find(
      r => r.user && r.user.toString() === userId
    );
    
    if (existingReview) {
      console.log('❌ Avis déjà existant pour utilisateur:', userId);
      return res.status(409).json({
        success: false,
        message: "Vous avez déjà donné un avis pour cet hôtel"
      });
    }

    // Utiliser la méthode du modèle pour ajouter l'avis
    console.log('📝 Ajout de l\'avis...');
    try {
      await hotel.addReview(
        userId, 
        { 
          username: displayName, 
          profile: profile || '' 
        }, 
        numericRating, 
        trimmedReview
      );
      
      console.log(`✅ Avis ajouté avec succès:`, {
        rating: numericRating,
        reviewLength: trimmedReview.length,
        newAverageRating: hotel.averageRating,
        totalReviews: hotel.totalReviews
      });
      
      return res.status(201).json({
        success: true,
        message: "Avis ajouté avec succès",
        data: {
          averageRating: hotel.averageRating,
          totalReviews: hotel.totalReviews,
          newRating: numericRating,
          reviewId: hotel.reviews[hotel.reviews.length - 1]._id
        }
      });
      
    } catch (addReviewError) {
      console.log('❌ Erreur lors de l\'ajout d\'avis:', addReviewError.message);
      
      // Gestion des erreurs spécifiques de la méthode addReview
      if (addReviewError.message === 'Vous avez déjà donné un avis pour cet hôtel') {
        return res.status(409).json({
          success: false,
          message: addReviewError.message
        });
      }
      
      if (addReviewError.name === 'ValidationError') {
        const validationErrors = Object.values(addReviewError.errors).map(e => e.message);
        return res.status(400).json({
          success: false,
          message: "Erreur de validation",
          errors: validationErrors
        });
      }
      
      // Re-lancer pour gestion générale
      throw addReviewError;
    }
    
  } catch (error) {
    // Gestion d'erreur globale avec logs détaillés
    console.error(`❌ Erreur critique submitHotelReview:`, {
      error: error.message,
      stack: error.stack,
      hotelId: hotelId || 'undefined',
      userId: userId || 'undefined',
      timestamp: new Date().toISOString()
    });

    // Réponses spécifiques selon le type d'erreur
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        message: "Problème de base de données temporaire"
      });
    }
    
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: "Problème de connexion temporaire"
      });
    }

    // Erreur générale 500
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite lors de l'ajout de l'avis",
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

// ===== FONCTION UTILITAIRE POUR DIAGNOSTIQUER LES PROBLÈMES D'AVIS =====
exports.diagnoseReviewIssues = async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    console.log('🔍 Diagnostic des problèmes d\'avis pour:', hotelId);
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      hotelId: hotelId,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      } : 'Non authentifié',
      issues: []
    };
    
    // Test 1: Vérifier l'hôtel
    let hotel;
    try {
      hotel = await HotelDetails.findOne({ _id: hotelId });
      if (!hotel) {
        diagnostics.issues.push('Hôtel non trouvé dans la base de données');
      } else if (!hotel.isActive) {
        diagnostics.issues.push('Hôtel trouvé mais marqué comme inactif');
      } else {
        diagnostics.hotel = {
          title: hotel.title,
          isActive: hotel.isActive,
          reviewsCount: hotel.reviews ? hotel.reviews.length : 0,
          averageRating: hotel.averageRating
        };
      }
    } catch (error) {
      diagnostics.issues.push(`Erreur recherche hôtel: ${error.message}`);
    }
    
    // Test 2: Vérifier l'authentification
    if (!req.user || !req.user.id) {
      diagnostics.issues.push('Utilisateur non authentifié');
    }
    
    // Test 3: Vérifier si l'utilisateur a déjà un avis
    if (hotel && req.user && req.user.id) {
      const existingReview = hotel.reviews && hotel.reviews.find(
        r => r.user && r.user.toString() === req.user.id
      );
      
      if (existingReview) {
        diagnostics.existingReview = {
          id: existingReview._id,
          rating: existingReview.rating,
          createdAt: existingReview.createdAt
        };
      }
    }
    
    // Test 4: Tester la connectivité base de données
    try {
      const dbStatus = await HotelDetails.db.db.admin().ping();
      diagnostics.database = 'Connexion OK';
    } catch (dbError) {
      diagnostics.issues.push(`Problème base de données: ${dbError.message}`);
    }
    
    return res.json({
      success: true,
      diagnostics: diagnostics
    });
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du diagnostic',
      error: error.message
    });
  }
};
/*exports.submitHotelReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array()
      });
    }
    
    const { hotelId } = req.params;
    const { rating, review = '' } = req.body;
    const { id: user_id, username } = req.user;

    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`⭐ Ajout avis hôtel: ${hotelId} par ${displayName}`);
    
    const hotel = await HotelDetails.findOne({ _id: hotelId, isActive: true });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hôtel non trouvé"
      });
    }
    
    // Utiliser la méthode du modèle
    try {
      await hotel.addReview(user_id, { username: displayName, profile: req.user.profile || '' }, parseInt(rating), review.trim());
      
      console.log(`✅ Avis ajouté: ${rating}/5 par ${displayName} - Nouvelle moyenne: ${hotel.averageRating}`);
      
      return res.json({
        success: true,
        message: "Avis ajouté avec succès",
        data: {
          averageRating: hotel.averageRating,
          totalReviews: hotel.totalReviews,
          newRating: rating
        }
      });
      
    } catch (reviewError) {
      if (reviewError.message === 'Vous avez déjà donné un avis pour cet hôtel') {
        return res.status(409).json({
          success: false,
          message: reviewError.message
        });
      }
      throw reviewError;
    }
    
  } catch (error) {
    console.error(`❌ Erreur submitHotelReview:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};*/

// ===== TOGGLE FAVORIS HÔTEL =====
//Toggle favoris (déjà existant mais simplifié)
exports.toggleHotelFavorite = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { id: userId, username } = req.user;

    const displayName = username || `User${userId.slice(-6)}`;
    console.log(`❤️ Toggle favoris hôtel: ${hotelId} par ${displayName}`);
    
    const hotel = await HotelDetails.findOne({ _id: hotelId, isActive: true });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hôtel non trouvé"
      });
    }
    
    // Utiliser la méthode existante du modèle
    const result = hotel.toggleFavorite(userId);
    await hotel.save();

    const message = result.action === 'added' 
      ? `${hotel.title} ajouté à vos favoris`
      : `${hotel.title} retiré de vos favoris`;

    console.log(`✅ ${message} - Total favoris hôtel: ${hotel.favoritesCount}`);
    
    return res.json({
      success: true,
      message: message,
      data: {
        hotelId: hotel._id,
        isFavorite: result.isFavorite,
        action: result.action,
        hotelTitle: hotel.title
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur toggleHotelFavorite:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue"
    });
  }
};



/*exports.toggleHotelFavorite = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { id: user_id, username } = req.user;

    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`❤️ Toggle favoris hôtel: ${hotelId} par ${displayName}`);
    
    const hotel = await HotelDetails.findOne({ _id: hotelId, isActive: true });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hôtel non trouvé"
      });
    }
    
    const result = hotel.toggleFavorite(user_id);
    await hotel.save();

    console.log(`✅ Favoris ${result.action}: ${result.isFavorite ? 'ajouté' : 'retiré'} - Total: ${hotel.favoritesCount}`);
    
    return res.json({
      success: true,
      message: result.action === 'added' ? 'Ajouté aux favoris' : 'Retiré des favoris',
      data: {
        isFavorite: result.isFavorite,
        favoritesCount: hotel.favoritesCount,
        action: result.action
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur toggleHotelFavorite:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};*/

// ===== RECHERCHER HÔTELS =====
exports.searchHotels = async (req, res) => {
  try {
    const { 
      query: searchQuery = '', 
      region_Name, 
      minRating = 0,
      minPrice,
      maxPrice,
      sortBy = 'rating',
      hasRooms
    } = req.query;
    
    console.log(`🔍 Recherche hôtels: "${searchQuery}"`);
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Le terme de recherche doit contenir au moins 2 caractères"
      });
    }
    
    // Utiliser la méthode statique du modèle
    const options = {
      limit: 50,
      priceRange: {},
      regionName: region_Name
    };
    
    if (minPrice) options.priceRange.min = parseFloat(minPrice);
    if (maxPrice) options.priceRange.max = parseFloat(maxPrice);
    
    let hotels = await HotelDetails.searchHotels(searchQuery.trim(), options);
    
    // Filtres additionnels
    if (minRating > 0) {
      hotels = hotels.filter(hotel => (hotel.averageRating || 0) >= parseFloat(minRating));
    }
    
    if (hasRooms !== undefined) {
      if (hasRooms === 'true') {
        hotels = hotels.filter(hotel => hotel.rooms && hotel.rooms.length > 0);
      }
    }
    
    // Options de tri
    const sortOptions = {
      'rating': (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
      'price_asc': (a, b) => (a.price?.minPrice || 0) - (b.price?.minPrice || 0),
      'price_desc': (a, b) => (b.price?.maxPrice || 0) - (a.price?.maxPrice || 0),
      'name': (a, b) => (a.title || '').localeCompare(b.title || ''),
      'newest': (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      'popular': (a, b) => ((b.viewsCount || 0) + (b.favoritesCount || 0)) - ((a.viewsCount || 0) + (a.favoritesCount || 0))
    };
    
    if (sortOptions[sortBy]) {
      hotels.sort(sortOptions[sortBy]);
    }
    
    // Format des résultats
    const processedResults = hotels.map(hotel => ({
      id: hotel._id,
      title: hotel.title || '',
      location: hotel.location || '',
      region: hotel.region_Name || '',
      rating: hotel.averageRating || 0,
      totalReviews: hotel.totalReviews || 0,
      priceRange: {
        min: hotel.price ? hotel.price.minPrice || 0 : 0,
        max: hotel.price ? hotel.price.maxPrice || 0 : 0,
        display: hotel.price && hotel.price.minPrice && hotel.price.maxPrice && hotel.price.minPrice !== hotel.price.maxPrice 
          ? `${hotel.price.minPrice} - ${hotel.price.maxPrice} FCFA`
          : `À partir de ${hotel.price ? hotel.price.minPrice || 0 : 0} FCFA`
      },
      hasImage: hotel.placeImage ? true : false,
      imageUrl: hotel.placeImage || null,
      description: hotel.description ? hotel.description.substring(0, 100) + '...' : '',
      hasRooms: hotel.rooms && hotel.rooms.length > 0,
      roomsCount: hotel.rooms ? hotel.rooms.length : 0,
      viewsCount: hotel.viewsCount || 0,
      favoritesCount: hotel.favoritesCount || 0
    }));
    
    console.log(`✅ ${processedResults.length} résultats trouvés pour "${searchQuery}"`);
    
    return res.json({
      success: true,
      data: processedResults,
      search: {
        query: searchQuery,
        region: region_Name || 'all',
        totalResults: processedResults.length,
        filters: {
          minRating: parseFloat(minRating),
          minPrice: minPrice ? parseFloat(minPrice) : null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          hasRooms: hasRooms === 'true'
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur searchHotels:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== CRÉER/MODIFIER DÉTAILS HÔTEL (ADMIN) =====
exports.createOrUpdateHotelDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Erreurs de validation:', errors.array());
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array()
      });
    }

    console.log('🔍 === DEBUG REQUÊTE HÔTEL ===');
    console.log('📋 req.body:', Object.keys(req.body || {}));
    console.log('📋 req.files:', req.files ? req.files.length : 0);

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Aucune donnée reçue"
      });
    }

    // Extraction des champs
    const hotelId = req.body._id;
    const title = req.body.title;
    const description = req.body.description;
    const location = req.body.location;
    const region_Name = req.body.region_Name;

    // Parse des objets JSON
    let coordinates, price, availability, facilities, services;

    try {
      coordinates = req.body.coordinates ? JSON.parse(req.body.coordinates) : {};
      price = req.body.price ? JSON.parse(req.body.price) : {};
      availability = req.body.availability ? JSON.parse(req.body.availability) : {};
      facilities = req.body.facilities ? JSON.parse(req.body.facilities) : [];
      services = req.body.services ? JSON.parse(req.body.services) : [];
      
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      return res.status(400).json({
        success: false,
        message: "Format des données JSON invalide: " + parseError.message
      });
    }

    // Validation des champs obligatoires
    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!location) missingFields.push('location');
    if (!region_Name) missingFields.push('region_Name');
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) missingFields.push('coordinates');
    if (!price || !price.minPrice || !price.maxPrice) missingFields.push('price');
    if (!availability || !availability.start || !availability.end) missingFields.push('availability');

    if (missingFields.length > 0) {
      console.error('❌ Champs manquants:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`
      });
    }

    // Vérification des permissions
    const userRole = req.user.role;
    if (!['superAdmin', 'maintenancier'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seuls les administrateurs et maintenanciers peuvent modifier les détails."
      });
    }

    // Logique création vs modification
    let hotelDocumentId;
    let isNewHotel = false;
    let existingHotel = null;

    if (hotelId && hotelId !== 'null' && hotelId !== '' && hotelId !== 'undefined') {
      console.log('🔄 Mode modification - hôtel existant:', hotelId);
      
      if (!mongoose.Types.ObjectId.isValid(hotelId)) {
        return res.status(400).json({
          success: false,
          message: "ID de l'hôtel invalide (doit être un ObjectId)"
        });
      }
      
      hotelDocumentId = new mongoose.Types.ObjectId(hotelId);
      
      existingHotel = await HotelDetails.findOne({ _id: hotelDocumentId, isActive: true });
      if (!existingHotel) {
        return res.status(404).json({
          success: false,
          message: "Hôtel non trouvé"
        });
      }
      
      console.log(`✅ Hôtel existant trouvé: ${existingHotel.title} (ID: ${hotelDocumentId})`);
      
    } else {
      console.log('➕ Mode création - nouvel hôtel');
      isNewHotel = true;
      hotelDocumentId = new mongoose.Types.ObjectId();
      console.log('🆕 Nouvel ObjectId généré:', hotelDocumentId);
    }

    // Administration info
    const adminInfo = {
      userId: req.user.id,
      role: userRole,
      username: req.user.username || `${userRole}_${req.user.id.slice(-6)}`
    };

    // Traitement des images
    let galleryUrls = [];
    let placeImageUrl = '';
    
    if (req.files && req.files.length > 0) {
      console.log(`📷 Traitement de ${req.files.length} images...`);
      
      try {
        const galleryDir = path.join(process.cwd(), 'assets', 'images', 'hotels', String(hotelDocumentId));
        await fs.mkdir(galleryDir, { recursive: true });

        for (let i = 0; i < req.files.length; i++) {
          const image = req.files[i];
          const filename = `${Date.now()}-${i}.webp`;
          const outputPath = path.join(galleryDir, filename);

          await sharp(image.path)
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(outputPath);

          try {
            await fs.unlink(image.path);
          } catch (unlinkError) {
            console.warn(`Impossible de supprimer le fichier temporaire: ${image.path}`);
          }

          const imageUrl = `/assets/images/hotels/${hotelDocumentId}/${filename}`;
          
          if (i === 0) {
            placeImageUrl = imageUrl;
          }
          
          galleryUrls.push(imageUrl);
        }

        console.log(`🎉 ${galleryUrls.length} images traitées avec succès`);
        
      } catch (imageError) {
        console.error("❌ Erreur lors du traitement des images:", imageError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors du traitement des images."
        });
      }
    }

    // Gestion des détails dans HotelDetails
    let hotel;

    if (existingHotel) {
      console.log('🔄 Mise à jour de l\'hôtel existant');
      
      hotel = existingHotel;
      hotel.title = title;
      hotel.description = description;
      hotel.location = location;
      hotel.region_Name = region_Name;
      hotel.coordinates = coordinates;
      hotel.price = price;
      hotel.availability = {
        start: new Date(availability.start),
        end: new Date(availability.end)
      };
      hotel.facilities = facilities;
      hotel.services = services;
      hotel.lastEditedBy = adminInfo;
      hotel.lastEditedBy.editedAt = new Date();
      
      // Ajouter nouvelles images
      if (galleryUrls.length > 0) {
        hotel.gallery = [...(hotel.gallery || []), ...galleryUrls];
      }
      if (placeImageUrl && !hotel.placeImage) {
        hotel.placeImage = placeImageUrl;
      }
      
      await hotel.save();
      console.log(`✅ Hôtel mis à jour: ${title}`);
      
    } else {
      console.log('➕ Création d\'un nouvel hôtel');
      
      hotel = new HotelDetails({
        _id: hotelDocumentId,
        title,
        description,
        location,
        region_Name,
        coordinates,
        price,
        availability: {
          start: new Date(availability.start),
          end: new Date(availability.end)
        },
        facilities,
        services,
        placeImage: placeImageUrl,
        gallery: galleryUrls,
        hasFullDetails: true,
        createdBy: adminInfo,
        lastEditedBy: adminInfo
      });
      
      await hotel.save();
      console.log(`✅ Nouvel hôtel créé: ${title}`);
    }

    // Fonction de calcul de complétion
    const completionStatus = calculateHotelCompletionStatus(hotel);

    console.log('📊 === RÉSUMÉ FINAL HÔTEL ===');
    console.log('- ID de l\'hôtel (ObjectId):', hotelDocumentId);
    console.log('- Titre:', hotel.title);
    console.log('- Type d\'opération:', isNewHotel ? 'CRÉATION' : 'MISE À JOUR');
    console.log('- Région:', hotel.region_Name);
    console.log('- Prix min-max:', hotel.price ? `${hotel.price.minPrice} - ${hotel.price.maxPrice}` : 'Non défini');
    console.log('- Images galerie:', hotel.gallery?.length || 0);
    console.log('- Complétion:', `${completionStatus.percentage}% (${completionStatus.completed}/${completionStatus.total})`);

    return res.json({
      success: true,
      message: isNewHotel ? "Détails de l'hôtel créés avec succès" : "Détails de l'hôtel mis à jour avec succès",
      details: {
        ...hotel.toObject(),
        metadata: {
          isNewHotel,
          hotelId: hotelDocumentId,
          region: hotel.region_Name,
          totalGalleryImages: hotel.gallery?.length || 0,
          totalFacilities: hotel.facilities?.length || 0,
          totalServices: hotel.services?.length || 0,
          lastUpdated: hotel.updatedAt,
          completionStatus: completionStatus
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur createOrUpdateHotelDetails:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== LISTER HÔTELS POUR ADMIN =====
exports.getAdminHotelsList = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      region_Name, 
      hasFullDetails,
      sortBy = 'updatedAt'
    } = req.query;
    
    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }
    
    const query = { isActive: true };
    
    if (region_Name) {
      query.region_Name = { $regex: region_Name, $options: 'i' };
    }
    
    if (hasFullDetails !== undefined) {
      query.hasFullDetails = hasFullDetails === 'true';
    }
    
    const sortOptions = {
      'updatedAt': { updatedAt: -1 },
      'createdAt': { createdAt: -1 },
      'title': { title: 1 },
      'rating': { averageRating: -1 },
      'views': { viewsCount: -1 },
      'price': { 'price.minPrice': 1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.updatedAt;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const hotels = await HotelDetails.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('rooms', 'type capacity')
      .lean();
    
    const total = await HotelDetails.countDocuments(query);
    
    const enrichedHotels = hotels.map(hotel => ({
      ...hotel,
      priceDisplay: hotel.price && hotel.price.minPrice && hotel.price.maxPrice && hotel.price.minPrice !== hotel.price.maxPrice 
        ? `${hotel.price.minPrice} - ${hotel.price.maxPrice} FCFA`
        : `À partir de ${hotel.price ? hotel.price.minPrice || 0 : 0} FCFA`,
      completionStatus: calculateHotelCompletionStatus(hotel),
      availabilityStatus: hotel.availability && hotel.availability.start && hotel.availability.end ? {
        isActive: new Date() >= hotel.availability.start && new Date() <= hotel.availability.end,
        formatted: hotel.getFormattedAvailability ? hotel.getFormattedAvailability() : ''
      } : null
    }));

    console.log(`✅ Liste admin: ${enrichedHotels.length} hôtels trouvés`);

    return res.json({
      success: true,
      data: enrichedHotels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getAdminHotelsList:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== STATISTIQUES DES HÔTELS =====
exports.getHotelsStats = async (req, res) => {
  try {
    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }

    console.log('📊 Calcul des statistiques Hôtels...');

    const stats = await HotelDetails.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalHotels: { $sum: 1 },
          hotelsWithFullDetails: {
            $sum: { $cond: [{ $eq: ['$hasFullDetails', true] }, 1, 0] }
          },
          totalViews: { $sum: '$viewsCount' },
          totalFavorites: { $sum: '$favoritesCount' },
          totalReviews: { $sum: '$totalReviews' },
          averageRatingOverall: { $avg: '$averageRating' },
          averageMinPrice: { $avg: '$price.minPrice' },
          averageMaxPrice: { $avg: '$price.maxPrice' },
          hotelsWithRooms: {
            $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$rooms', []] } }, 0] }, 1, 0] }
          }
        }
      }
    ]);

    const regionStats = await HotelDetails.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$region_Name',
          regionName: { $first: '$region_Name' },
          count: { $sum: 1 },
          averageRating: { $avg: '$averageRating' },
          averageMinPrice: { $avg: '$price.minPrice' },
          averageMaxPrice: { $avg: '$price.maxPrice' },
          totalViews: { $sum: '$viewsCount' },
          totalReviews: { $sum: '$totalReviews' },
          hotelsWithRooms: {
            $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$rooms', []] } }, 0] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const overallStats = stats[0] || {
      totalHotels: 0,
      hotelsWithFullDetails: 0,
      totalViews: 0,
      totalFavorites: 0,
      totalReviews: 0,
      averageRatingOverall: 0,
      averageMinPrice: 0,
      averageMaxPrice: 0,
      hotelsWithRooms: 0
    };

    if (overallStats.averageRatingOverall) {
      overallStats.averageRatingOverall = parseFloat(overallStats.averageRatingOverall.toFixed(1));
    }
    if (overallStats.averageMinPrice) {
      overallStats.averageMinPrice = Math.round(overallStats.averageMinPrice);
    }
    if (overallStats.averageMaxPrice) {
      overallStats.averageMaxPrice = Math.round(overallStats.averageMaxPrice);
    }

    console.log(`✅ Stats calculées: ${overallStats.totalHotels} hôtels, ${regionStats.length} régions`);

    return res.json({
      success: true,
      data: {
        overall: overallStats,
        byRegion: regionStats,
        summary: {
          completionRate: overallStats.totalHotels > 0 
            ? Math.round((overallStats.hotelsWithFullDetails / overallStats.totalHotels) * 100)
            : 0,
          averageViewsPerHotel: overallStats.totalHotels > 0 
            ? Math.round(overallStats.totalViews / overallStats.totalHotels)
            : 0,
          roomsAvailabilityRate: overallStats.totalHotels > 0
            ? Math.round((overallStats.hotelsWithRooms / overallStats.totalHotels) * 100)
            : 0,
          priceRange: {
            averageMin: overallStats.averageMinPrice,
            averageMax: overallStats.averageMaxPrice
          }
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getHotelsStats:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== SUPPRIMER HÔTEL =====
exports.deleteHotelDetails = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }

    const hotel = await HotelDetails.findOne({ _id: hotelId, isActive: true });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hôtel non trouvé"
      });
    }

    // Soft delete + mise à jour admin info
    hotel.isActive = false;
    hotel.lastEditedBy = {
      userId: req.user.id,
      role: req.user.role,
      username: req.user.username || `${req.user.role}_${req.user.id.slice(-6)}`,
      editedAt: new Date()
    };

    await hotel.save();

    console.log(`🗑️ Hôtel supprimé par ${req.user.role}: ${hotel.title} (ID: ${hotelId})`);

    return res.json({
      success: true,
      message: "Hôtel supprimé avec succès",
      data: {
        hotelId: hotelId,
        title: hotel.title,
        deletedBy: req.user.role,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur deleteHotelDetails:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RESTAURER HÔTEL SUPPRIMÉ =====
exports.restoreHotelDetails = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!['superAdmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seuls les super administrateurs peuvent restaurer."
      });
    }

    const hotel = await HotelDetails.findOne({ _id: hotelId, isActive: false });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hôtel supprimé non trouvé"
      });
    }

    hotel.isActive = true;
    hotel.lastEditedBy = {
      userId: req.user.id,
      role: req.user.role,
      username: req.user.username || `${req.user.role}_${req.user.id.slice(-6)}`,
      editedAt: new Date()
    };

    await hotel.save();

    console.log(`♻️ Hôtel restauré par ${req.user.role}: ${hotel.title} (ID: ${hotelId})`);

    return res.json({
      success: true,
      message: "Hôtel restauré avec succès",
      data: {
        hotelId: hotelId,
        title: hotel.title,
        restoredBy: req.user.role,
        restoredAt: new Date()
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur restoreHotelDetails:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== SYNCHRONISER DONNÉES HÔTELS =====
exports.syncHotelData = async (req, res) => {
  try {
    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }

    console.log('🔄 Début de la synchronisation des données hôtels...');

    const hotels = await HotelDetails.find({ isActive: true }).lean();

    let updated = 0;
    let errors = 0;

    for (const hotel of hotels) {
      try {
        const hotelDoc = await HotelDetails.findById(hotel._id);
        
        if (!hotelDoc) {
          errors++;
          continue;
        }
        
        let hasChanges = false;
        
        // Recalculer les statistiques des avis
        if (hotelDoc.reviews && hotelDoc.reviews.length > 0) {
          const oldAverage = hotelDoc.averageRating;
          hotelDoc.calculateAverageRating();
          
          if (Math.abs(oldAverage - hotelDoc.averageRating) > 0.1) {
            hasChanges = true;
          }
        }
        
        // Vérifier la cohérence des compteurs
        const actualFavoritesCount = hotelDoc.favoritedBy ? hotelDoc.favoritedBy.length : 0;
        if (hotelDoc.favoritesCount !== actualFavoritesCount) {
          hotelDoc.favoritesCount = actualFavoritesCount;
          hasChanges = true;
        }
        
        // Vérifier la complétion des détails
        const completionStatus = calculateHotelCompletionStatus(hotelDoc);
        const shouldHaveFullDetails = completionStatus.percentage >= 80;
        
        if (hotelDoc.hasFullDetails !== shouldHaveFullDetails) {
          hotelDoc.hasFullDetails = shouldHaveFullDetails;
          hasChanges = true;
        }
        
        if (hasChanges) {
          await hotelDoc.save();
          updated++;
          console.log(`✅ Synchronisé: ${hotel.title}`);
        }
        
      } catch (syncError) {
        console.error(`❌ Erreur sync hôtel ${hotel._id}:`, syncError.message);
        errors++;
      }
    }

    console.log(`🎉 Synchronisation terminée: ${updated} hôtels mis à jour, ${errors} erreurs`);

    return res.json({
      success: true,
      message: `Synchronisation terminée: ${updated} hôtels mis à jour${errors > 0 ? `, ${errors} erreurs` : ''}`,
      data: { 
        updated, 
        errors,
        totalProcessed: hotels.length
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur syncHotelData:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RÉCUPÉRER HÔTELS SUPPRIMÉS (ADMIN) =====
exports.getDeletedHotels = async (req, res) => {
  try {
    if (!['superAdmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seuls les super administrateurs peuvent voir les hôtels supprimés."
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deletedHotels = await HotelDetails.find({ isActive: false })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title location region_Name price averageRating totalReviews lastEditedBy updatedAt')
      .lean();

    const total = await HotelDetails.countDocuments({ isActive: false });

    const processedHotels = deletedHotels.map(hotel => ({
      ...hotel,
      priceDisplay: hotel.price && hotel.price.minPrice && hotel.price.maxPrice && hotel.price.minPrice !== hotel.price.maxPrice 
        ? `${hotel.price.minPrice} - ${hotel.price.maxPrice} FCFA`
        : `À partir de ${hotel.price ? hotel.price.minPrice || 0 : 0} FCFA`,
      deletedBy: hotel.lastEditedBy ? {
        username: hotel.lastEditedBy.username,
        role: hotel.lastEditedBy.role,
        deletedAt: hotel.lastEditedBy.editedAt
      } : null
    }));

    console.log(`✅ ${deletedHotels.length} hôtels supprimés récupérés`);

    return res.json({
      success: true,
      data: processedHotels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getDeletedHotels:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== FONCTION HELPER COMPLÉTION HÔTEL =====
function calculateHotelCompletionStatus(hotelDetails) {
  let completed = 0;
  let total = 9; // Total ajusté sans le champ contact

  // 1. Titre (11%)
  if ((hotelDetails.title || '').trim().length >= 3) completed++;

  // 2. Description (11%)
  if ((hotelDetails.description || '').trim().length >= 50) completed++;

  // 3. Localisation (11%)
  if ((hotelDetails.location || '').trim().length >= 5) completed++;

  // 4. Région (11%)
  if ((hotelDetails.region_Name || '').trim().length >= 3) completed++;

  // 5. Coordonnées (11%)
  if (hotelDetails.coordinates && 
      hotelDetails.coordinates.latitude && 
      hotelDetails.coordinates.longitude) completed++;

  // 6. Prix (11%)
  if (hotelDetails.price && 
      hotelDetails.price.minPrice && 
      hotelDetails.price.maxPrice) completed++;

  // 7. Disponibilité (11%)
  if (hotelDetails.availability && 
      hotelDetails.availability.start && 
      hotelDetails.availability.end) completed++;

  // 8. Équipements (11%)
  if (hotelDetails.facilities && hotelDetails.facilities.length > 0) completed++;

  // 9. Images (11%)
  if (hotelDetails.gallery && hotelDetails.gallery.length > 0) completed++;

  const percentage = Math.round((completed / total) * 100);

  let status = 'empty';
  if (percentage >= 100) status = 'complete';
  else if (percentage >= 90) status = 'nearly_complete';
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
      hasTitle: (hotelDetails.title || '').trim().length >= 3,
      hasDescription: (hotelDetails.description || '').trim().length >= 50,
      hasLocation: (hotelDetails.location || '').trim().length >= 5,
      hasRegion: (hotelDetails.region_Name || '').trim().length >= 3,
      hasCoordinates: !!(hotelDetails.coordinates?.latitude && hotelDetails.coordinates?.longitude),
      hasPrice: !!(hotelDetails.price?.minPrice && hotelDetails.price?.maxPrice),
      hasAvailability: !!(hotelDetails.availability?.start && hotelDetails.availability?.end),
      hasFacilities: !!(hotelDetails.facilities?.length > 0),
      hasImages: !!(hotelDetails.gallery?.length > 0)
    }
  };
}

// ===== EXPORTS =====
module.exports = {
  getUserFavoriteHotels: exports.getUserFavoriteHotels,
  getAllHotels: exports.getAllHotels,
  getHotelsByRegion: exports.getHotelsByRegion,
  getHotelById: exports.getHotelById,
  submitHotelReview: exports.submitHotelReview,
  toggleHotelFavorite: exports.toggleHotelFavorite,
  searchHotels: exports.searchHotels,
  createOrUpdateHotelDetails: exports.createOrUpdateHotelDetails,
  getAdminHotelsList: exports.getAdminHotelsList,
  getHotelsStats: exports.getHotelsStats,
  deleteHotelDetails: exports.deleteHotelDetails,
  restoreHotelDetails: exports.restoreHotelDetails,
  syncHotelData: exports.syncHotelData,
  getDeletedHotels: exports.getDeletedHotels,
  calculateHotelCompletionStatus
};
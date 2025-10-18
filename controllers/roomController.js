// controllers/roomController.js - CONTRÔLEUR ROOM COMPLET
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const Room = require('../models/Room');
const HotelDetails = require('../models/HotelDetails');
const { validationResult } = require('express-validator');

// ===== RÉCUPÉRER TOUTES LES CHAMBRES D'UN HÔTEL =====
exports.getRoomsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { 
      sortBy = 'price_asc',
      minPrice,
      maxPrice,
      capacity,
      available = true,
      checkIn,
      checkOut
    } = req.query;
    
    console.log(`🏨 Récupération des chambres pour l'hôtel: ${hotelId}`);
    
    // Vérifier que l'hôtel existe
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({
        success: false,
        message: "ID d'hôtel invalide"
      });
    }
    
    const hotel = await HotelDetails.findOne({ _id: hotelId, isActive: true });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hôtel non trouvé"
      });
    }
    
    // Options de recherche
    const options = {
      available: available === 'true',
      sortBy: sortBy
    };
    
    if (capacity) options.capacity = parseInt(capacity);
    if (minPrice || maxPrice) {
      options.priceRange = {};
      if (minPrice) options.priceRange.min = parseFloat(minPrice);
      if (maxPrice) options.priceRange.max = parseFloat(maxPrice);
    }
    
    // Récupération des chambres
    let rooms = await Room.findByHotel(hotelId, options);
    
    // Filtrage par disponibilité pour des dates spécifiques
    if (checkIn && checkOut && available === 'true') {
      rooms = rooms.filter(room => room.isAvailableForDates(checkIn, checkOut));
    }
    
    // Format des données pour l'application mobile
    const processedRooms = rooms.map(room => ({
      id: room._id,
      title: room.title,
      type: room.type,
      description: room.description,
      capacity: {
        adults: room.capacity.adults,
        children: room.capacity.children,
        total: room.capacity.totalGuests,
        formatted: room.formattedCapacity
      },
      dimensions: {
        surface: room.dimensions.surface,
        unit: room.dimensions.unit,
        formatted: room.formattedSurface
      },
      pricing: {
        pricePerNight: room.pricing.pricePerNight,
        currency: room.pricing.currency,
        formatted: room.formattedPrice,
        // Calcul du prix pour les dates spécifiées si fournies
        ...(checkIn && checkOut ? room.getPriceForDates(checkIn, checkOut, capacity) : {})
      },
      images: {
        main: room.images.mainImage,
        gallery: room.images.gallery,
        hasMultiple: room.images.gallery.length > 1
      },
      ratings: {
        average: room.stats.averageRating,
        totalReviews: room.stats.totalReviews,
        formatted: room.formattedRating,
        detailed: room.stats.detailedRatings
      },
      bedConfiguration: room.getFormattedBedConfiguration(),
      equipments: room.getFormattedEquipments(),
      availability: {
        isAvailable: room.isCurrentlyAvailable,
        availableFrom: room.availability.availableFrom,
        availableTo: room.availability.availableTo,
        ...(checkIn && checkOut ? {
          availableForDates: room.isAvailableForDates(checkIn, checkOut)
        } : {})
      },
      policies: room.policies,
      featured: room.featured,
      priority: room.priority,
      viewsCount: room.stats.viewsCount,
      favoritesCount: room.stats.favoritesCount,
      createdAt: room.createdAt
    }));
    
    // Statistiques pour l'hôtel
    const roomStats = {
      totalRooms: processedRooms.length,
      availableRooms: processedRooms.filter(r => r.availability.isAvailable).length,
      priceRange: processedRooms.length > 0 ? {
        min: Math.min(...processedRooms.map(r => r.pricing.pricePerNight)),
        max: Math.max(...processedRooms.map(r => r.pricing.pricePerNight))
      } : { min: 0, max: 0 },
      averageRating: processedRooms.length > 0 
        ? parseFloat((processedRooms.reduce((sum, r) => sum + r.ratings.average, 0) / processedRooms.length).toFixed(1))
        : 0,
      roomTypes: [...new Set(processedRooms.map(r => r.type))],
      totalCapacity: processedRooms.reduce((sum, r) => sum + r.capacity.total, 0)
    };
    
    console.log(`✅ ${processedRooms.length} chambres trouvées pour l'hôtel ${hotel.title}`);
    
    return res.json({
      success: true,
      data: processedRooms,
      hotel: {
        id: hotel._id,
        title: hotel.title,
        location: hotel.location,
        region: hotel.region_Name
      },
      stats: roomStats
    });
    
  } catch (error) {
    console.error(`❌ Erreur getRoomsByHotel:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: []
    });
  }
};

// ===== RÉCUPÉRER DÉTAILS D'UNE CHAMBRE PAR ID =====
exports.getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { checkIn, checkOut, guestCount } = req.query;
    const currentUserId = req.user?.id;
    
    console.log(`🔍 Recherche chambre ID: ${roomId}`);
    
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: "ID de chambre invalide"
      });
    }
    
    const room = await Room.findOne({ 
      _id: roomId, 
      status: { $in: ['active', 'maintenance'] }
    }).populate('hotelId', 'title location region_Name averageRating totalReviews')
    .lean();
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Chambre non trouvée"
      });
    }
    
    // Incrémenter les vues
    await Room.findByIdAndUpdate(
      roomId, 
      { $inc: { 'stats.viewsCount': 1 } }
    );
    
    // Traitement des données pour l'affichage détaillé
    const roomDoc = await Room.findById(roomId);
    
    const processedRoom = {
      ...room,
      stats: {
        ...room.stats,
        viewsCount: (room.stats.viewsCount || 0) + 1
      }
    };
    
    // Vérifier si l'utilisateur a mis en favoris
    const isFavorite = currentUserId && room.favoritedBy && Array.isArray(room.favoritedBy)
      ? room.favoritedBy.some(userId => userId.toString() === currentUserId.toString())
      : false;
    
    // Calcul du prix pour les dates spécifiées
    let pricingInfo = {
      basePrice: room.pricing.pricePerNight,
      currency: room.pricing.currency,
      formatted: roomDoc.formattedPrice
    };
    
    if (checkIn && checkOut) {
      const guestCountNum = guestCount ? parseInt(guestCount) : room.capacity.adults;
      pricingInfo = {
        ...pricingInfo,
        ...roomDoc.getPriceForDates(checkIn, checkOut, guestCountNum),
        availableForDates: roomDoc.isAvailableForDates(checkIn, checkOut)
      };
    }
    
    // Dates indisponibles pour le calendrier (3 mois à venir)
    const nextMonths = new Date();
    nextMonths.setMonth(nextMonths.getMonth() + 3);
    const unavailableDates = roomDoc.getUnavailableDates(new Date(), nextMonths);
    
    console.log(`✅ Détails chambre trouvés: ${room.title} (${room.type})`);
    
    return res.json({
      success: true,
      details: {
        ...processedRoom,
        hotel: room.hotelId,
        capacity: {
          adults: room.capacity.adults,
          children: room.capacity.children,
          total: room.capacity.totalGuests,
          formatted: roomDoc.formattedCapacity
        },
        dimensions: {
          surface: room.dimensions.surface,
          unit: room.dimensions.unit,
          formatted: roomDoc.formattedSurface
        },
        pricing: pricingInfo,
        ratings: {
          average: room.stats.averageRating,
          totalReviews: room.stats.totalReviews,
          formatted: roomDoc.formattedRating,
          detailed: room.stats.detailedRatings
        },
        bedConfiguration: roomDoc.getFormattedBedConfiguration(),
        equipments: roomDoc.getFormattedEquipments(),
        availability: {
          isAvailable: roomDoc.isCurrentlyAvailable,
          availableFrom: room.availability.availableFrom,
          availableTo: room.availability.availableTo,
          unavailableDates: unavailableDates,
          ...(checkIn && checkOut ? {
            availableForDates: roomDoc.isAvailableForDates(checkIn, checkOut)
          } : {})
        },
        isFavoriteByUser: isFavorite,
        servicesIncluded: room.includedServices.filter(s => s.available),
        servicesPaid: room.paidServices.filter(s => s.available),
        accessibility: room.accessibility
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getRoomById:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RECHERCHER CHAMBRES DISPONIBLES =====
exports.searchAvailableRooms = async (req, res) => {
  try {
    const { 
      hotelId,
      checkIn,
      checkOut, 
      guestCount = 1,
      minPrice,
      maxPrice,
      roomType,
      sortBy = 'price_asc'
    } = req.query;
    
    console.log(`🔍 Recherche chambres disponibles: ${checkIn} - ${checkOut}, ${guestCount} personnes`);
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Les dates d'arrivée et de départ sont obligatoires"
      });
    }
    
    // Validation des dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    
    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        message: "La date d'arrivée ne peut pas être dans le passé"
      });
    }
    
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: "La date de départ doit être après la date d'arrivée"
      });
    }
    
    let query = {};
    
    // Filtrer par hôtel si spécifié
    if (hotelId) {
      if (!mongoose.Types.ObjectId.isValid(hotelId)) {
        return res.status(400).json({
          success: false,
          message: "ID d'hôtel invalide"
        });
      }
      query.hotelId = hotelId;
    }
    
    // Utiliser la méthode statique du modèle
    let availableRooms = await Room.findAvailable(
      hotelId, 
      checkInDate, 
      checkOutDate, 
      parseInt(guestCount)
    );
    
    // Filtres additionnels
    if (minPrice || maxPrice) {
      availableRooms = availableRooms.filter(room => {
        const price = room.pricing.pricePerNight;
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }
    
    if (roomType) {
      availableRooms = availableRooms.filter(room => 
        room.type.toLowerCase().includes(roomType.toLowerCase())
      );
    }
    
    // Tri des résultats
    const sortOptions = {
      'price_asc': (a, b) => a.pricing.pricePerNight - b.pricing.pricePerNight,
      'price_desc': (a, b) => b.pricing.pricePerNight - a.pricing.pricePerNight,
      'rating': (a, b) => (b.stats.averageRating || 0) - (a.stats.averageRating || 0),
      'capacity': (a, b) => b.capacity.totalGuests - a.capacity.totalGuests,
      'surface': (a, b) => b.dimensions.surface - a.dimensions.surface,
      'featured': (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    };
    
    if (sortOptions[sortBy]) {
      availableRooms.sort(sortOptions[sortBy]);
    }
    
    // Format des résultats avec calcul de prix pour les dates
    const processedRooms = await Promise.all(
      availableRooms.map(async (room) => {
        const roomDoc = await Room.findById(room._id);
        const pricingForDates = roomDoc.getPriceForDates(checkIn, checkOut, parseInt(guestCount));
        
        return {
          id: room._id,
          title: room.title,
          type: room.type,
          description: room.description.substring(0, 150) + '...',
          capacity: {
            adults: room.capacity.adults,
            children: room.capacity.children,
            total: room.capacity.totalGuests,
            formatted: roomDoc.formattedCapacity
          },
          dimensions: {
            surface: room.dimensions.surface,
            unit: room.dimensions.unit,
            formatted: roomDoc.formattedSurface
          },
          pricing: {
            ...pricingForDates,
            formatted: roomDoc.formattedPrice
          },
          images: {
            main: room.images.mainImage,
            gallery: room.images.gallery.slice(0, 3),
            hasMultiple: room.images.gallery.length > 1
          },
          ratings: {
            average: room.stats.averageRating,
            totalReviews: room.stats.totalReviews,
            formatted: roomDoc.formattedRating
          },
          bedConfiguration: roomDoc.getFormattedBedConfiguration(),
          topEquipments: roomDoc.getFormattedEquipments().slice(0, 6), // Top 6 pour affichage
          hotel: room.hotelId ? {
            id: room.hotelId._id,
            title: room.hotelId.title,
            location: room.hotelId.location
          } : null,
          availability: {
            isAvailable: true,
            availableForDates: true
          },
          featured: room.featured,
          viewsCount: room.stats.viewsCount,
          favoritesCount: room.stats.favoritesCount
        };
      })
    );
    
    console.log(`✅ ${processedRooms.length} chambres disponibles trouvées`);
    
    return res.json({
      success: true,
      data: processedRooms,
      searchCriteria: {
        checkIn,
        checkOut,
        nights: Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)),
        guestCount: parseInt(guestCount),
        hotelId: hotelId || null,
        filters: {
          minPrice: minPrice ? parseFloat(minPrice) : null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          roomType: roomType || null
        }
      },
      stats: {
        totalResults: processedRooms.length,
        priceRange: processedRooms.length > 0 ? {
          min: Math.min(...processedRooms.map(r => r.pricing.totalPrice)),
          max: Math.max(...processedRooms.map(r => r.pricing.totalPrice))
        } : { min: 0, max: 0 },
        availableTypes: [...new Set(processedRooms.map(r => r.type))]
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur searchAvailableRooms:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: []
    });
  }
};

// ===== AJOUTER UN AVIS CHAMBRE =====
exports.submitRoomReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array()
      });
    }
    
    const { roomId } = req.params;
    const { 
      ratings, 
      review = '', 
      reservationId,
      stayDuration = 1,
      travelType = 'Leisure'
    } = req.body;
    const { id: user_id, username } = req.user;

    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`⭐ Ajout avis chambre: ${roomId} par ${displayName}`);
    
    const room = await Room.findOne({ _id: roomId, status: 'active' });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Chambre non trouvée"
      });
    }
    
    // Validation des notes
    if (!ratings || !ratings.overall || ratings.overall < 1 || ratings.overall > 5) {
      return res.status(400).json({
        success: false,
        message: "La note générale est obligatoire et doit être comprise entre 1 et 5"
      });
    }
    
    // Utiliser la méthode du modèle
    try {
      await room.addReview(
        user_id, 
        { username: displayName, profile: req.user.profile || '' }, 
        ratings, 
        review.trim(),
        reservationId,
        { stayDuration: parseInt(stayDuration), travelType }
      );
      
      console.log(`✅ Avis ajouté: ${ratings.overall}/5 par ${displayName} - Nouvelle moyenne: ${room.stats.averageRating}`);
      
      return res.json({
        success: true,
        message: "Avis ajouté avec succès",
        data: {
          averageRating: room.stats.averageRating,
          totalReviews: room.stats.totalReviews,
          detailedRatings: room.stats.detailedRatings,
          newRating: ratings.overall
        }
      });
      
    } catch (reviewError) {
      if (reviewError.message === 'Vous avez déjà donné un avis pour cette chambre') {
        return res.status(409).json({
          success: false,
          message: reviewError.message
        });
      }
      throw reviewError;
    }
    
  } catch (error) {
    console.error(`❌ Erreur submitRoomReview:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== TOGGLE FAVORIS CHAMBRE =====
exports.toggleRoomFavorite = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { id: user_id, username } = req.user;

    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`❤️ Toggle favoris chambre: ${roomId} par ${displayName}`);
    
    const room = await Room.findOne({ _id: roomId, status: 'active' });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Chambre non trouvée"
      });
    }
    
    const result = room.toggleFavorite(user_id);
    await room.save();

    console.log(`✅ Favoris ${result.action}: ${result.isFavorite ? 'ajouté' : 'retiré'} - Total: ${room.stats.favoritesCount}`);
    
    return res.json({
      success: true,
      message: result.action === 'added' ? 'Ajouté aux favoris' : 'Retiré des favoris',
      data: {
        isFavorite: result.isFavorite,
        favoritesCount: room.stats.favoritesCount,
        action: result.action
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur toggleRoomFavorite:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

exports.getUserFavoriteRooms = async (req, res) => {
  try {
    const { id: userId, username } = req.user;
    const { sortBy = 'dateAdded' } = req.query;
    
    const displayName = username || `User${userId.slice(-6)}`;
    console.log(`💖 Récupération favoris chambres pour: ${displayName}`);
    
    // Query: toutes les chambres où l'utilisateur est dans favoritedBy
    const query = { 
      favoritedBy: userId,
      status: 'active'
    };
    
    // Options de tri
    const sortOptions = {
      'dateAdded': { updatedAt: -1 }, // Plus récemment ajouté en favoris
      'price_asc': { 'pricing.pricePerNight': 1 },
      'price_desc': { 'pricing.pricePerNight': -1 },
      'rating': { 'stats.averageRating': -1 },
      'capacity': { 'capacity.totalGuests': -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.dateAdded;
    
    // Récupération de TOUS les favoris de l'utilisateur avec populate de l'hôtel
    const favoriteRooms = await Room.find(query)
      .sort(sort)
      .populate('hotelId', 'title location region_Name averageRating totalReviews')
      .lean();
    
    // Enrichir avec les données formatées
    const userFavoriteRooms = await Promise.all(
      favoriteRooms.map(async (room) => {
        try {
          const roomDoc = await Room.findById(room._id);
          
          return {
            id: room._id,
            title: room.title,
            type: room.type,
            description: room.description 
              ? room.description.substring(0, 120) + (room.description.length > 120 ? '...' : '')
              : '',
            
            // Capacité
            capacity: {
              adults: room.capacity.adults,
              children: room.capacity.children,
              total: room.capacity.totalGuests,
              formatted: roomDoc.formattedCapacity
            },
            
            // Dimensions
            dimensions: {
              surface: room.dimensions.surface,
              unit: room.dimensions.unit,
              formatted: roomDoc.formattedSurface
            },
            
            // Prix
            pricing: {
              pricePerNight: room.pricing.pricePerNight,
              currency: room.pricing.currency,
              formatted: roomDoc.formattedPrice
            },
            
            // Images
            images: {
              main: room.images.mainImage,
              gallery: room.images.gallery,
              hasMultiple: room.images.gallery.length > 1
            },
            
            // Notes
            ratings: {
              average: room.stats.averageRating || 0,
              totalReviews: room.stats.totalReviews || 0,
              formatted: roomDoc.formattedRating
            },
            
            // Hôtel associé
            hotel: room.hotelId ? {
              id: room.hotelId._id,
              title: room.hotelId.title,
              location: room.hotelId.location,
              region: room.hotelId.region_Name,
              rating: room.hotelId.averageRating || 0,
              totalReviews: room.hotelId.totalReviews || 0
            } : null,
            
            // Disponibilité
            availability: {
              isAvailable: roomDoc.isCurrentlyAvailable,
              availableFrom: room.availability.availableFrom,
              availableTo: room.availability.availableTo
            },
            
            // Statistiques
            isFavoriteByUser: true, // Toujours true puisque c'est SA liste de favoris
            favoritesCount: room.stats.favoritesCount || 0,
            viewsCount: room.stats.viewsCount || 0,
            bookingsCount: room.stats.bookingsCount || 0,
            
            // Top équipements
            topEquipments: roomDoc.getFormattedEquipments().slice(0, 4),
            bedConfiguration: roomDoc.getFormattedBedConfiguration(),
            
            // Métadonnées
            featured: room.featured || false,
            addedToFavoritesAt: room.updatedAt || room.createdAt,
            createdAt: room.createdAt
          };
          
        } catch (roomError) {
          console.warn(`⚠️ Erreur enrichissement chambre ${room._id}:`, roomError.message);
          // Inclure quand même avec des données minimales
          return {
            id: room._id,
            title: room.title || 'Chambre non trouvée',
            type: room.type || 'Type inconnu',
            description: room.description || '',
            pricing: {
              pricePerNight: room.pricing?.pricePerNight || 0,
              currency: room.pricing?.currency || 'FCFA',
              formatted: `${room.pricing?.pricePerNight || 0} ${room.pricing?.currency || 'FCFA'}`
            },
            images: {
              main: room.images?.mainImage || null,
              gallery: room.images?.gallery || [],
              hasMultiple: false
            },
            ratings: {
              average: room.stats?.averageRating || 0,
              totalReviews: room.stats?.totalReviews || 0,
              formatted: '0/5'
            },
            hotel: room.hotelId || null,
            isFavoriteByUser: true,
            addedToFavoritesAt: room.updatedAt || room.createdAt
          };
        }
      })
    );
    
    console.log(`✅ ${userFavoriteRooms.length} chambres favorites trouvées pour ${displayName}`);
    
    return res.json({
      success: true,
      data: userFavoriteRooms,
      totalFavorites: userFavoriteRooms.length,
      sortedBy: sortBy,
      message: userFavoriteRooms.length === 0 
        ? "Vous n'avez pas encore de chambres favorites" 
        : `Vous avez ${userFavoriteRooms.length} chambre${userFavoriteRooms.length > 1 ? 's' : ''} en favoris`
    });
    
  } catch (error) {
    console.error(`❌ Erreur getUserFavoriteRooms:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos chambres favorites",
      data: [],
      totalFavorites: 0
    });
  }
};

// ===== CRÉER UNE RÉSERVATION =====
exports.createRoomBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array()
      });
    }
    
    const { roomId } = req.params;
    const { 
      checkIn, 
      checkOut, 
      guestCount,
      guestDetails,
      additionalInfo = ''
    } = req.body;
    const { id: user_id, username } = req.user;

    console.log(`📅 Création réservation chambre: ${roomId} du ${checkIn} au ${checkOut}`);
    
    const room = await Room.findOne({ _id: roomId, status: 'active' });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Chambre non trouvée"
      });
    }
    
    // Vérifier la disponibilité
    if (!room.isAvailableForDates(checkIn, checkOut)) {
      return res.status(409).json({
        success: false,
        message: "La chambre n'est pas disponible pour ces dates"
      });
    }
    
    // Vérifier la capacité
    const totalGuests = parseInt(guestCount);
    if (totalGuests > room.capacity.totalGuests) {
      return res.status(400).json({
        success: false,
        message: `Cette chambre peut accueillir au maximum ${room.capacity.totalGuests} personnes`
      });
    }
    
    // Générer un ID de réservation
    const reservationId = new mongoose.Types.ObjectId();
    const guestName = guestDetails?.name || username || `User${user_id.slice(-6)}`;
    
    // Calculer le prix
    const pricingInfo = room.getPriceForDates(checkIn, checkOut, totalGuests);
    
    try {
      // Ajouter la réservation à la chambre
      await room.addBooking(checkIn, checkOut, reservationId, guestName);
      
      console.log(`✅ Réservation créée: ${reservationId} pour ${guestName}`);
      
      // Ici, vous pourriez créer un document Reservation séparé dans votre base de données
      // const reservation = new Reservation({...});
      // await reservation.save();
      
      return res.json({
        success: true,
        message: "Réservation créée avec succès",
        data: {
          reservationId: reservationId,
          room: {
            id: room._id,
            title: room.title,
            type: room.type
          },
          dates: {
            checkIn,
            checkOut,
            nights: pricingInfo.nights
          },
          guests: {
            count: totalGuests,
            details: guestDetails
          },
          pricing: pricingInfo,
          additionalInfo,
          status: 'confirmée',
          createdAt: new Date()
        }
      });
      
    } catch (bookingError) {
      return res.status(409).json({
        success: false,
        message: bookingError.message
      });
    }
    
  } catch (error) {
    console.error(`❌ Erreur createRoomBooking:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RECHERCHER CHAMBRES PAR CRITÈRES =====
exports.searchRooms = async (req, res) => {
  try {
    const { 
      query: searchQuery = '', 
      hotelId,
      minPrice,
      maxPrice,
      capacity,
      roomType,
      sortBy = 'rating',
      limit = 20
    } = req.query;
    
    console.log(`🔍 Recherche chambres: "${searchQuery}"`);
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Le terme de recherche doit contenir au moins 2 caractères"
      });
    }
    
    // Utiliser la méthode statique du modèle
    const options = {
      limit: parseInt(limit)
    };
    
    if (hotelId) options.hotelId = hotelId;
    if (capacity) options.capacity = parseInt(capacity);
    if (minPrice || maxPrice) {
      options.priceRange = {};
      if (minPrice) options.priceRange.min = parseFloat(minPrice);
      if (maxPrice) options.priceRange.max = parseFloat(maxPrice);
    }
    
    let rooms = await Room.searchRooms(searchQuery.trim(), options);
    
    // Filtres additionnels
    if (roomType) {
      rooms = rooms.filter(room => 
        room.type.toLowerCase().includes(roomType.toLowerCase())
      );
    }
    
    // Tri des résultats
    const sortOptions = {
      'rating': (a, b) => (b.stats.averageRating || 0) - (a.stats.averageRating || 0),
      'price_asc': (a, b) => a.pricing.pricePerNight - b.pricing.pricePerNight,
      'price_desc': (a, b) => b.pricing.pricePerNight - a.pricing.pricePerNight,
      'capacity': (a, b) => b.capacity.totalGuests - a.capacity.totalGuests,
      'name': (a, b) => (a.title || '').localeCompare(b.title || ''),
      'newest': (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    };
    
    if (sortOptions[sortBy]) {
      rooms.sort(sortOptions[sortBy]);
    }
    
    // Format des résultats
    const processedResults = await Promise.all(
      rooms.map(async (room) => {
        const roomDoc = await Room.findById(room._id);
        
        return {
          id: room._id,
          title: room.title,
          type: room.type,
          description: room.description ? room.description.substring(0, 100) + '...' : '',
          capacity: {
            adults: room.capacity.adults,
            children: room.capacity.children,
            total: room.capacity.totalGuests,
            formatted: roomDoc.formattedCapacity
          },
          dimensions: {
            surface: room.dimensions.surface,
            unit: room.dimensions.unit,
            formatted: roomDoc.formattedSurface
          },
          pricing: {
            pricePerNight: room.pricing.pricePerNight,
            currency: room.pricing.currency,
            formatted: roomDoc.formattedPrice
          },
          images: {
            main: room.images.mainImage,
            hasGallery: room.images.gallery.length > 0
          },
          ratings: {
            average: room.stats.averageRating,
            totalReviews: room.stats.totalReviews,
            formatted: roomDoc.formattedRating
          },
          hotel: room.hotelId ? {
            id: room.hotelId,
            // Populer les détails de l'hôtel si nécessaire
          } : null,
          availability: {
            isAvailable: roomDoc.isCurrentlyAvailable
          },
          viewsCount: room.stats.viewsCount,
          favoritesCount: room.stats.favoritesCount
        };
      })
    );
    
    console.log(`✅ ${processedResults.length} résultats trouvés pour "${searchQuery}"`);
    
    return res.json({
      success: true,
      data: processedResults,
      search: {
        query: searchQuery,
        totalResults: processedResults.length,
        filters: {
          hotelId: hotelId || null,
          minPrice: minPrice ? parseFloat(minPrice) : null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          capacity: capacity ? parseInt(capacity) : null,
          roomType: roomType || null
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur searchRooms:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== CRÉER/MODIFIER CHAMBRE (ADMIN) =====
exports.createOrUpdateRoom = async (req, res) => {
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

    console.log('🔍 === DEBUG REQUÊTE CHAMBRE ===');
    console.log('📋 req.body:', Object.keys(req.body || {}));
    console.log('📋 req.files:', req.files ? req.files.length : 0);

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Aucune donnée reçue"
      });
    }

    // Extraction des champs
    const roomId = req.body._id;
    const title = req.body.title;
    const type = req.body.type;
    const description = req.body.description;
    const hotelId = req.body.hotelId;

    // Parse des objets JSON
    let capacity, dimensions, pricing, bedConfiguration, roomEquipments, policies, includedServices;

    try {
      capacity = req.body.capacity ? JSON.parse(req.body.capacity) : {};
      dimensions = req.body.dimensions ? JSON.parse(req.body.dimensions) : {};
      pricing = req.body.pricing ? JSON.parse(req.body.pricing) : {};
      bedConfiguration = req.body.bedConfiguration ? JSON.parse(req.body.bedConfiguration) : [];
      roomEquipments = req.body.roomEquipments ? JSON.parse(req.body.roomEquipments) : [];
      policies = req.body.policies ? JSON.parse(req.body.policies) : {};
      includedServices = req.body.includedServices ? JSON.parse(req.body.includedServices) : [];
      
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
    if (!type) missingFields.push('type');
    if (!description) missingFields.push('description');
    if (!hotelId) missingFields.push('hotelId');
    if (!capacity || !capacity.adults) missingFields.push('capacity');
    if (!dimensions || !dimensions.surface) missingFields.push('dimensions');
    if (!pricing || !pricing.pricePerNight) missingFields.push('pricing');

    if (missingFields.length > 0) {
      console.error('❌ Champs manquants:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Champs obligatoires manquants: ${missingFields.join(', ')}`
      });
    }

    // Vérification des permissions
    const userRole = req.user.role;
    if (!['superAdmin', 'maintenancier', 'hotelManager'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seuls les administrateurs et gestionnaires peuvent modifier les chambres."
      });
    }

    // Vérifier que l'hôtel existe
    const hotel = await HotelDetails.findOne({ _id: hotelId, isActive: true });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hôtel non trouvé"
      });
    }

    // Logique création vs modification
    let roomDocumentId;
    let isNewRoom = false;
    let existingRoom = null;

    if (roomId && roomId !== 'null' && roomId !== '' && roomId !== 'undefined') {
      console.log('🔄 Mode modification - chambre existante:', roomId);
      
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({
          success: false,
          message: "ID de la chambre invalide (doit être un ObjectId)"
        });
      }
      
      roomDocumentId = new mongoose.Types.ObjectId(roomId);
      
      existingRoom = await Room.findOne({ _id: roomDocumentId, status: { $in: ['active', 'inactive'] } });
      if (!existingRoom) {
        return res.status(404).json({
          success: false,
          message: "Chambre non trouvée"
        });
      }
      
      console.log(`✅ Chambre existante trouvée: ${existingRoom.title} (ID: ${roomDocumentId})`);
      
    } else {
      console.log('➕ Mode création - nouvelle chambre');
      isNewRoom = true;
      roomDocumentId = new mongoose.Types.ObjectId();
      console.log('🆕 Nouvel ObjectId généré:', roomDocumentId);
    }

    // Administration info
    const adminInfo = {
      userId: req.user.id,
      role: userRole,
      username: req.user.username || `${userRole}_${req.user.id.slice(-6)}`
    };

    // Traitement des images
    let galleryUrls = [];
    let mainImageUrl = '';
    
    if (req.files && req.files.length > 0) {
      console.log(`📷 Traitement de ${req.files.length} images...`);
      
      try {
        const galleryDir = path.join(process.cwd(), 'assets', 'images', 'rooms', String(roomDocumentId));
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

          const imageUrl = `/assets/images/rooms/${roomDocumentId}/${filename}`;
          
          if (i === 0) {
            mainImageUrl = imageUrl;
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

    // Gestion des détails de la chambre
    let room;

    if (existingRoom) {
      console.log('🔄 Mise à jour de la chambre existante');
      
      room = existingRoom;
      room.title = title;
      room.type = type;
      room.description = description;
      room.hotelId = hotelId;
      room.capacity = {
        adults: capacity.adults,
        children: capacity.children || 0,
        totalGuests: capacity.adults + (capacity.children || 0)
      };
      room.dimensions = dimensions;
      room.pricing = {
        ...room.pricing,
        pricePerNight: pricing.pricePerNight,
        basePrice: pricing.basePrice || pricing.pricePerNight,
        currency: pricing.currency || 'FCFA'
      };
      room.bedConfiguration = bedConfiguration;
      room.roomEquipments = roomEquipments;
      room.policies = policies;
      room.includedServices = includedServices;
      room.lastEditedBy = adminInfo;
      room.lastEditedBy.editedAt = new Date();
      
      // Ajouter nouvelles images
      if (galleryUrls.length > 0) {
        room.images.gallery = [...(room.images.gallery || []), ...galleryUrls];
      }
      if (mainImageUrl && !room.images.mainImage) {
        room.images.mainImage = mainImageUrl;
      }
      
      await room.save();
      console.log(`✅ Chambre mise à jour: ${title}`);
      
    } else {
      console.log('➕ Création d\'une nouvelle chambre');
      
      room = new Room({
        _id: roomDocumentId,
        title,
        type,
        description,
        hotelId,
        capacity: {
          adults: capacity.adults,
          children: capacity.children || 0,
          totalGuests: capacity.adults + (capacity.children || 0)
        },
        dimensions,
        pricing: {
          pricePerNight: pricing.pricePerNight,
          basePrice: pricing.basePrice || pricing.pricePerNight,
          currency: pricing.currency || 'FCFA'
        },
        bedConfiguration: bedConfiguration || [],
        roomEquipments: roomEquipments || [],
        policies: policies || {},
        includedServices: includedServices || [],
        images: {
          mainImage: mainImageUrl,
          gallery: galleryUrls
        },
        availability: {
          isAvailable: true,
          availableFrom: new Date(),
          availableTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 an
        },
        createdBy: adminInfo,
        lastEditedBy: adminInfo
      });
      
      await room.save();
      console.log(`✅ Nouvelle chambre créée: ${title}`);
    }

    // Mettre à jour la référence dans l'hôtel
    if (isNewRoom) {
      await HotelDetails.findByIdAndUpdate(
        hotelId,
        { $addToSet: { rooms: roomDocumentId } }
      );
    }

    console.log('📊 === RÉSUMÉ FINAL CHAMBRE ===');
    console.log('- ID de la chambre (ObjectId):', roomDocumentId);
    console.log('- Titre:', room.title);
    console.log('- Type:', room.type);
    console.log('- Type d\'opération:', isNewRoom ? 'CRÉATION' : 'MISE À JOUR');
    console.log('- Hôtel:', hotel.title);
    console.log('- Capacité:', `${room.capacity.adults} adultes, ${room.capacity.children} enfants`);
    console.log('- Prix:', `${room.pricing.pricePerNight} ${room.pricing.currency}`);
    console.log('- Images galerie:', room.images.gallery?.length || 0);

    return res.json({
      success: true,
      message: isNewRoom ? "Chambre créée avec succès" : "Chambre mise à jour avec succès",
      details: {
        ...room.toObject(),
        metadata: {
          isNewRoom,
          roomId: roomDocumentId,
          hotelId: hotelId,
          totalGalleryImages: room.images.gallery?.length || 0,
          totalEquipments: room.roomEquipments?.length || 0,
          totalServices: room.includedServices?.length || 0,
          lastUpdated: room.updatedAt
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur createOrUpdateRoom:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== SUPPRIMER CHAMBRE =====
exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!['superAdmin', 'maintenancier', 'hotelManager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }

    const room = await Room.findOne({ _id: roomId, status: { $in: ['active', 'inactive'] } });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Chambre non trouvée"
      });
    }

    // Vérifier s'il y a des réservations actives
    const hasActiveBookings = room.availability.bookedDates.some(booking => 
      booking.status === 'confirmée' && booking.checkOut > new Date()
    );

    if (hasActiveBookings) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer une chambre avec des réservations actives"
      });
    }

    // Soft delete
    room.status = 'inactive';
    room.lastEditedBy = {
      userId: req.user.id,
      role: req.user.role,
      username: req.user.username || `${req.user.role}_${req.user.id.slice(-6)}`,
      editedAt: new Date()
    };

    await room.save();

    // Retirer de l'hôtel
    await HotelDetails.findByIdAndUpdate(
      room.hotelId,
      { $pull: { rooms: roomId } }
    );

    console.log(`🗑️ Chambre supprimée par ${req.user.role}: ${room.title} (ID: ${roomId})`);

    return res.json({
      success: true,
      message: "Chambre supprimée avec succès",
      data: {
        roomId: roomId,
        title: room.title,
        deletedBy: req.user.role,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur deleteRoom:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== OBTENIR CHAMBRES RECOMMANDÉES =====
exports.getFeaturedRooms = async (req, res) => {
  try {
    const { hotelId, limit = 10 } = req.query;
    
    console.log(`⭐ Récupération chambres recommandées${hotelId ? ` pour hôtel ${hotelId}` : ''}`);
    
    const rooms = await Room.getFeaturedRooms(hotelId, parseInt(limit));
    
    // Format des données
    const processedRooms = await Promise.all(
      rooms.map(async (room) => {
        const roomDoc = await Room.findById(room._id);
        
        return {
          id: room._id,
          title: room.title,
          type: room.type,
          description: room.description.substring(0, 100) + '...',
          capacity: {
            adults: room.capacity.adults,
            children: room.capacity.children,
            total: room.capacity.totalGuests,
            formatted: roomDoc.formattedCapacity
          },
          dimensions: {
            surface: room.dimensions.surface,
            unit: room.dimensions.unit,
            formatted: roomDoc.formattedSurface
          },
          pricing: {
            pricePerNight: room.pricing.pricePerNight,
            currency: room.pricing.currency,
            formatted: roomDoc.formattedPrice
          },
          images: {
            main: room.images.mainImage,
            gallery: room.images.gallery.slice(0, 3),
            hasMultiple: room.images.gallery.length > 1
          },
          ratings: {
            average: room.stats.averageRating,
            totalReviews: room.stats.totalReviews,
            formatted: roomDoc.formattedRating
          },
          topEquipments: roomDoc.getFormattedEquipments().slice(0, 4),
          hotel: room.hotelId ? {
            id: room.hotelId._id,
            title: room.hotelId.title,
            location: room.hotelId.location
          } : null,
          featured: room.featured,
          priority: room.priority,
          viewsCount: room.stats.viewsCount,
          favoritesCount: room.stats.favoritesCount
        };
      })
    );
    
    console.log(`✅ ${processedRooms.length} chambres recommandées trouvées`);
    
    return res.json({
      success: true,
      data: processedRooms
    });
    
  } catch (error) {
    console.error(`❌ Erreur getFeaturedRooms:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: []
    });
  }
};

// ===== LISTER CHAMBRES POUR ADMIN =====
exports.getAdminRoomsList = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      hotelId, 
      status,
      roomType,
      sortBy = 'updatedAt'
    } = req.query;
    
    if (!['superAdmin', 'maintenancier', 'hotelManager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }
    
    const query = {};
    
    if (hotelId) {
      query.hotelId = hotelId;
    }
    
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['active', 'inactive', 'maintenance'] };
    }
    
    if (roomType) {
      query.type = { $regex: roomType, $options: 'i' };
    }
    
    const sortOptions = {
      'updatedAt': { updatedAt: -1 },
      'createdAt': { createdAt: -1 },
      'title': { title: 1 },
      'type': { type: 1 },
      'rating': { 'stats.averageRating': -1 },
      'price': { 'pricing.pricePerNight': 1 },
      'bookings': { 'stats.bookingsCount': -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.updatedAt;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const rooms = await Room.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('hotelId', 'title location region_Name')
      .lean();
    
    const total = await Room.countDocuments(query);
    
    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const roomDoc = await Room.findById(room._id);
        
        return {
          ...room,
          formattedPrice: roomDoc.formattedPrice,
          formattedCapacity: roomDoc.formattedCapacity,
          formattedSurface: roomDoc.formattedSurface,
          formattedRating: roomDoc.formattedRating,
          occupancyRate: room.stats.occupancyRate || 0,
          hasActiveBookings: room.availability.bookedDates.some(booking => 
            booking.status === 'confirmée' && booking.checkOut > new Date()
          ),
          nextBooking: room.availability.bookedDates
            .filter(booking => booking.status === 'confirmée' && booking.checkIn > new Date())
            .sort((a, b) => a.checkIn - b.checkIn)[0] || null
        };
      })
    );

    console.log(`✅ Liste admin: ${enrichedRooms.length} chambres trouvées`);

    return res.json({
      success: true,
      data: enrichedRooms,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getAdminRoomsList:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== STATISTIQUES DES CHAMBRES =====
exports.getRoomsStats = async (req, res) => {
  try {
    if (!['superAdmin', 'maintenancier', 'hotelManager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }

    const { hotelId } = req.query;

    console.log('📊 Calcul des statistiques Chambres...');

    const matchStage = hotelId ? 
      { $match: { status: 'active', hotelId: new mongoose.Types.ObjectId(hotelId) } } :
      { $match: { status: 'active' } };

    const stats = await Room.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          totalCapacity: { $sum: '$capacity.totalGuests' },
          totalBookings: { $sum: '$stats.bookingsCount' },
          totalViews: { $sum: '$stats.viewsCount' },
          totalFavorites: { $sum: '$stats.favoritesCount' },
          totalReviews: { $sum: '$stats.totalReviews' },
          averageRatingOverall: { $avg: '$stats.averageRating' },
          averagePrice: { $avg: '$pricing.pricePerNight' },
          minPrice: { $min: '$pricing.pricePerNight' },
          maxPrice: { $max: '$pricing.pricePerNight' },
          averageSurface: { $avg: '$dimensions.surface' },
          featuredRooms: {
            $sum: { $cond: [{ $eq: ['$featured', true] }, 1, 0] }
          },
          availableRooms: {
            $sum: { $cond: [{ $eq: ['$availability.isAvailable', true] }, 1, 0] }
          }
        }
      }
    ]);

    const typeStats = await Room.aggregate([
      matchStage,
      {
        $group: {
          _id: '$type',
          roomType: { $first: '$type' },
          count: { $sum: 1 },
          averageRating: { $avg: '$stats.averageRating' },
          averagePrice: { $avg: '$pricing.pricePerNight' },
          totalBookings: { $sum: '$stats.bookingsCount' },
          totalCapacity: { $sum: '$capacity.totalGuests' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const hotelStats = await Room.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$hotelId',
          roomCount: { $sum: 1 },
          averageRating: { $avg: '$stats.averageRating' },
          averagePrice: { $avg: '$pricing.pricePerNight' },
          totalBookings: { $sum: '$stats.bookingsCount' },
          totalCapacity: { $sum: '$capacity.totalGuests' }
        }
      },
      {
        $lookup: {
          from: 'hoteldetails',
          localField: '_id',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $project: {
          hotelId: '$_id',
          hotelName: '$hotel.title',
          hotelLocation: '$hotel.location',
          roomCount: 1,
          averageRating: 1,
          averagePrice: 1,
          totalBookings: 1,
          totalCapacity: 1
        }
      },
      { $sort: { roomCount: -1 } }
    ]);

    const overallStats = stats[0] || {
      totalRooms: 0,
      totalCapacity: 0,
      totalBookings: 0,
      totalViews: 0,
      totalFavorites: 0,
      totalReviews: 0,
      averageRatingOverall: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      averageSurface: 0,
      featuredRooms: 0,
      availableRooms: 0
    };

    // Arrondir les valeurs
    if (overallStats.averageRatingOverall) {
      overallStats.averageRatingOverall = parseFloat(overallStats.averageRatingOverall.toFixed(1));
    }
    if (overallStats.averagePrice) {
      overallStats.averagePrice = Math.round(overallStats.averagePrice);
    }
    if (overallStats.averageSurface) {
      overallStats.averageSurface = Math.round(overallStats.averageSurface);
    }

    console.log(`✅ Stats calculées: ${overallStats.totalRooms} chambres, ${typeStats.length} types`);

    return res.json({
      success: true,
      data: {
        overall: overallStats,
        byType: typeStats,
        byHotel: hotelStats,
        summary: {
          occupancyRate: overallStats.totalRooms > 0 && overallStats.totalBookings > 0
            ? Math.round((overallStats.totalBookings / overallStats.totalRooms) * 10) // Approximation
            : 0,
          averageViewsPerRoom: overallStats.totalRooms > 0 
            ? Math.round(overallStats.totalViews / overallStats.totalRooms)
            : 0,
          featuredRate: overallStats.totalRooms > 0
            ? Math.round((overallStats.featuredRooms / overallStats.totalRooms) * 100)
            : 0,
          availabilityRate: overallStats.totalRooms > 0
            ? Math.round((overallStats.availableRooms / overallStats.totalRooms) * 100)
            : 0,
          priceRange: {
            min: overallStats.minPrice,
            max: overallStats.maxPrice,
            average: overallStats.averagePrice
          }
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getRoomsStats:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== SYNCHRONISER DONNÉES CHAMBRES =====
exports.syncRoomData = async (req, res) => {
  try {
    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }

    console.log('🔄 Début de la synchronisation des données chambres...');

    const rooms = await Room.find({ status: { $in: ['active', 'inactive'] } }).lean();

    let updated = 0;
    let errors = 0;

    for (const room of rooms) {
      try {
        const roomDoc = await Room.findById(room._id);
        
        if (!roomDoc) {
          errors++;
          continue;
        }
        
        let hasChanges = false;
        
        // Recalculer les statistiques des avis
        if (roomDoc.reviews && roomDoc.reviews.length > 0) {
          const oldAverage = roomDoc.stats.averageRating;
          roomDoc.calculateAverageRating();
          
          if (Math.abs(oldAverage - roomDoc.stats.averageRating) > 0.1) {
            hasChanges = true;
          }
        }
        
        // Vérifier la cohérence des compteurs
        const actualFavoritesCount = roomDoc.favoritedBy ? roomDoc.favoritedBy.length : 0;
        if (roomDoc.stats.favoritesCount !== actualFavoritesCount) {
          roomDoc.stats.favoritesCount = actualFavoritesCount;
          hasChanges = true;
        }
        
        // Vérifier la cohérence de la capacité
        const calculatedCapacity = roomDoc.capacity.adults + roomDoc.capacity.children;
        if (roomDoc.capacity.totalGuests !== calculatedCapacity) {
          roomDoc.capacity.totalGuests = calculatedCapacity;
          hasChanges = true;
        }
        
        // Calculer le taux d'occupation pour les 30 derniers jours
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const occupancyRate = roomDoc.calculateOccupancyRate(thirtyDaysAgo, new Date());
        
        if (Math.abs(roomDoc.stats.occupancyRate - occupancyRate) > 1) {
          roomDoc.stats.occupancyRate = occupancyRate;
          hasChanges = true;
        }
        
        if (hasChanges) {
          await roomDoc.save();
          updated++;
          console.log(`✅ Synchronisé: ${room.title}`);
        }
        
      } catch (syncError) {
        console.error(`❌ Erreur sync chambre ${room._id}:`, syncError.message);
        errors++;
      }
    }

    console.log(`🎉 Synchronisation terminée: ${updated} chambres mises à jour, ${errors} erreurs`);

    return res.json({
      success: true,
      message: `Synchronisation terminée: ${updated} chambres mises à jour${errors > 0 ? `, ${errors} erreurs` : ''}`,
      data: { 
        updated, 
        errors,
        totalProcessed: rooms.length
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur syncRoomData:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

module.exports = {
  getRoomsByHotel: exports.getRoomsByHotel,
  getRoomById: exports.getRoomById,
  searchAvailableRooms: exports.searchAvailableRooms,
  submitRoomReview: exports.submitRoomReview,
  toggleRoomFavorite: exports.toggleRoomFavorite,
  getUserFavoriteRooms: exports.getUserFavoriteRooms,
  createRoomBooking: exports.createRoomBooking,
  searchRooms: exports.searchRooms,
  createOrUpdateRoom: exports.createOrUpdateRoom,
  deleteRoom: exports.deleteRoom,
  getFeaturedRooms: exports.getFeaturedRooms,
  getAdminRoomsList: exports.getAdminRoomsList,
  getRoomsStats: exports.getRoomsStats,
  syncRoomData: exports.syncRoomData
};
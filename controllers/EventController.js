// controllers/eventController.js - CONTRÔLEUR ÉVÉNEMENTS CORRIGÉ ET COHÉRENT
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const EventDetails = require('../models/EventDetails');
const { validationResult } = require('express-validator');






// FONCTION UTILITAIRE COMMUNE POUR VÉRIFIER LES FAVORIS
const checkUserFavoriteStatus = (event, currentUserId) => {
  if (!currentUserId) {
    console.log("❌ Pas d'utilisateur connecté pour vérifier les favoris");
    return false;
  }
  
  if (!event.favoritedBy || !Array.isArray(event.favoritedBy)) {
    console.log(`❌ ${event.title}: Pas de tableau favoritedBy`);
    return false;
  }
  
  const isFavorite = event.favoritedBy.some(userId => {
    const userIdStr = userId.toString();
    const currentUserIdStr = currentUserId.toString();
    const match = userIdStr === currentUserIdStr;
    
    if (match) {
      console.log(`✅ ${event.title}: Utilisateur ${currentUserIdStr} trouvé dans favoris`);
    }
    
    return match;
  });
  
  console.log(`Favoris check pour ${event.title}: ${isFavorite} (${event.favoritedBy.length} favoris total)`);
  return isFavorite;
};

// FONCTION COMMUNE POUR TRAITER LES ÉVÉNEMENTS
const processEventData = (event, currentUserId, index = 0) => {
  const isFavorite = checkUserFavoriteStatus(event, currentUserId);
  
  return {
    _id: event._id,
    title: event.title || 'Titre manquant',
    location: event.location || 'Lieu non spécifié',
    category: event.category || 'autre',
    date: event.date || 'Date non spécifiée',
    time: event.time || 'Heure non spécifiée',
    rating: event.averageRating || 0,
    review: event.review || '0 avis',
    totalReviews: event.totalReviews || 0,
    
    // Prix simplifié
    price: event.fixedPrice 
      ? `${event.fixedPrice.toLocaleString()} Fcfa`
      : event.price?.solo || `À partir de ${event.priceRange?.min || 0} Fcfa`,
    
    // Informations prix détaillées
    priceInfo: event.fixedPrice ? {
      type: 'fixed',
      value: event.fixedPrice,
      display: `${event.fixedPrice.toLocaleString()} Fcfa`
    } : {
      type: 'categories',
      solo: event.price?.solo,
      couple: event.price?.couple,
      group: event.price?.group,
      range: {
        min: event.priceRange?.min || 0,
        max: event.priceRange?.max || 0
      }
    },
    
    // Images
    hasImage: !!event.eventImage,
    eventImage: event.eventImage || null,
    images: event.images || [],
    
    // Description tronquée
    description: event.description ? event.description.substring(0, 150) + '...' : 'Description non disponible',
    
    // Disponibilité
    availability: {
      isAvailable: event.isAvailable || false,
      capacity: event.capacity || null
    },
    
    // Informations organisateur
    organisateur: event.organisateur || 'Organisateur non spécifié',
    highlights: event.highlights || [],
    inclusions: event.inclusions || [],
    
    // Statistiques
    viewsCount: event.viewsCount || 0,
    favoritesCount: event.favoritesCount || 0,
    bookingsCount: event.bookingsCount || 0,
    
    // Dates et géolocalisation
    eventDates: event.eventDates || null,
    coordinates: event.coordinates || null,
    
    // CORRECTION CRITIQUE: Favoris utilisateur
    isFavorite: isFavorite,
    createdAt: event.createdAt || new Date(),
    
    // Debug complet
    debug: {
      hasFullDetails: event.hasFullDetails,
      isActive: event.isActive,
      isAvailable: event.isAvailable,
      userHasFavorited: isFavorite,
      favoritedByCount: event.favoritedBy ? event.favoritedBy.length : 0,
      currentUserId: currentUserId,
      favoritedByArray: event.favoritedBy ? event.favoritedBy.map(id => id.toString()) : [],
      userIdInArray: event.favoritedBy ? event.favoritedBy.some(id => id.toString() === currentUserId.toString()) : false
    }
  };
};

// ===== CORRECTION DÉFINITIVE DE getAllEvents =====
exports.getAllEvents = async (req, res) => {
  try {
    console.log('🎪 ===== getAllEvents AVEC DEBUG FAVORIS =====');
    
    const currentUserId = req.user?.id;
    console.log('👤 Utilisateur connecté:', currentUserId);
    
    if (!currentUserId) {
      console.log('⚠️ ATTENTION: Pas d\'utilisateur connecté - favoris non vérifiés');
    }
    
    const query = { isActive: true };
    console.log('🔍 Requête MongoDB:', query);
    
    const events = await EventDetails.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`📊 Événements trouvés: ${events.length}`);
    
    const processedEvents = events.map((event, index) => {
      return processEventData(event, currentUserId, index);
    });
    
    const userFavoritesCount = processedEvents.filter(e => e.isFavorite).length;
    console.log(`❤️ getAllEvents - Favoris utilisateur: ${userFavoritesCount}/${processedEvents.length}`);
    
    // Debug des 3 premiers événements
    console.log('\n🔍 DEBUG PREMIERS ÉVÉNEMENTS:');
    processedEvents.slice(0, 3).forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}:`);
      console.log(`   - isFavorite: ${event.isFavorite}`);
      console.log(`   - favoritedByCount: ${event.debug.favoritedByCount}`);
      console.log(`   - userIdInArray: ${event.debug.userIdInArray}`);
    });
    
    const stats = {
      totalEvents: processedEvents.length,
      userFavorites: userFavoritesCount,
      averageRating: processedEvents.length > 0 
        ? parseFloat((processedEvents.reduce((sum, event) => sum + event.rating, 0) / processedEvents.length).toFixed(1))
        : 0,
      categoriesAvailable: [...new Set(processedEvents.map(e => e.category))],
      withImages: processedEvents.filter(e => e.hasImage).length,
      available: processedEvents.filter(e => e.availability.isAvailable).length
    };
    
    console.log('✅ getAllEvents terminé - Stats:', {
      total: stats.totalEvents,
      userFavorites: stats.userFavorites,
      currentUserId: currentUserId
    });
    
    return res.json({
      success: true,
      data: processedEvents,
      stats: stats,
      debug: {
        currentUserId: currentUserId,
        userFavoritesCount: userFavoritesCount,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur getAllEvents:', error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: [],
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};

// ===== CORRECTION DÉFINITIVE DE getEventsByCategory =====
exports.getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const currentUserId = req.user?.id;
    
    console.log('📂 ===== getEventsByCategory AVEC DEBUG FAVORIS =====');
    console.log('📂 Catégorie:', category);
    console.log('👤 Utilisateur connecté:', currentUserId);
    
    if (!currentUserId) {
      console.log('⚠️ ATTENTION: Pas d\'utilisateur connecté - favoris non vérifiés');
    }
    
    const query = { 
      isActive: true,
      category: category
    };
    
    console.log('🔍 Requête MongoDB:', query);
    
    const events = await EventDetails.find(query)
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(20)
      .lean();
    
    console.log(`📊 Événements trouvés pour ${category}: ${events.length}`);
    
    if (events.length === 0) {
      const totalInCategory = await EventDetails.countDocuments({ 
        isActive: true, 
        category: category 
      });
      console.log(`🔍 Debug ${category}: ${totalInCategory} événements actifs dans cette catégorie`);
    }
    
    const processedEvents = events.map((event, index) => {
      return processEventData(event, currentUserId, index);
    });
    
    const userFavoritesCount = processedEvents.filter(e => e.isFavorite).length;
    console.log(`❤️ getEventsByCategory - Favoris utilisateur: ${userFavoritesCount}/${processedEvents.length}`);
    
    // Debug des événements de la catégorie
    console.log('\n🔍 DEBUG ÉVÉNEMENTS CATÉGORIE:');
    processedEvents.slice(0, 3).forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}:`);
      console.log(`   - isFavorite: ${event.isFavorite}`);
      console.log(`   - favoritedByCount: ${event.debug.favoritedByCount}`);
      console.log(`   - userIdInArray: ${event.debug.userIdInArray}`);
    });
    
    console.log('✅ getEventsByCategory terminé - Stats:', {
      category: category,
      total: processedEvents.length,
      userFavorites: userFavoritesCount,
      currentUserId: currentUserId
    });
    
    return res.json({
      success: true,
      data: processedEvents,
      categoryInfo: {
        name: category,
        totalEvents: processedEvents.length,
        userFavorites: userFavoritesCount
      },
      debug: {
        currentUserId: currentUserId,
        userFavoritesCount: userFavoritesCount,
        category: category,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getEventsByCategory:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== CORRECTION DÉFINITIVE DE getEventById =====
exports.getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const currentUserId = req.user?.id;
    
    console.log('🔍 ===== getEventById AVEC DEBUG FAVORIS =====');
    console.log('🔍 Event ID:', eventId);
    console.log('👤 Utilisateur connecté:', currentUserId);
    
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "ID d'événement invalide"
      });
    }
    
    const event = await EventDetails.findOne({ 
      _id: eventId, 
      isActive: true 
    }).lean();
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }
    
    // Incrémenter les vues
    await EventDetails.findByIdAndUpdate(
      eventId, 
      { $inc: { viewsCount: 1 } }
    );
    
    // Vérifier favoris avec la fonction commune
    const isFavorite = checkUserFavoriteStatus(event, currentUserId);
    
    console.log('🔍 DEBUG getEventById:');
    console.log(`   - Titre: ${event.title}`);
    console.log(`   - isFavorite: ${isFavorite}`);
    console.log(`   - favoritedBy length: ${event.favoritedBy?.length || 0}`);
    console.log(`   - currentUserId: ${currentUserId}`);
    console.log(`   - favoritedBy includes user: ${event.favoritedBy?.some(id => id.toString() === currentUserId?.toString())}`);
    
    const processedEvent = {
      ...event,
      viewsCount: (event.viewsCount || 0) + 1,
      isFavorite: isFavorite
    };

    // Traitement des avis avec structure user cohérente
    if (processedEvent.reviews && processedEvent.reviews.length > 0) {
      processedEvent.reviews = processedEvent.reviews.map(review => ({
        ...review,
        userName: review.user ? review.user.username : (review.userName || 'Utilisateur'),
        userAvatar: review.user ? review.user.avatar : (review.avatar || ''),
        user: review.user ? review.user.username : (review.userName || 'Utilisateur'),
        avatar: review.user ? review.user.avatar : (review.avatar || '')
      }));
    }

    console.log(`✅ getEventById terminé: ${event.title}, isFavorite: ${isFavorite}`);
    
    return res.json({
      success: true,
      details: {
        ...processedEvent,
        priceInfo: event.fixedPrice ? {
          type: 'fixed',
          value: event.fixedPrice,
          display: `${event.fixedPrice.toLocaleString()} FCFA`
        } : {
          type: 'categories',
          solo: event.price?.solo,
          couple: event.price?.couple,
          group: event.price?.group,
          range: {
            min: event.priceRange?.min || 0,
            max: event.priceRange?.max || 0,
            display: event.priceRange && event.priceRange.min && event.priceRange.max && event.priceRange.min !== event.priceRange.max 
              ? `${event.priceRange.min.toLocaleString()} - ${event.priceRange.max.toLocaleString()} FCFA`
              : `À partir de ${event.priceRange?.min || 0} FCFA`
          }
        },
        eventDatesInfo: event.eventDates ? {
          startDate: event.eventDates.startDate,
          endDate: event.eventDates.endDate,
          isUpcoming: new Date(event.eventDates.startDate) > new Date(),
          daysUntil: Math.ceil((new Date(event.eventDates.startDate) - new Date()) / (1000 * 60 * 60 * 24))
        } : null,
        availabilityInfo: {
          isAvailable: event.isAvailable || false,
          capacity: event.capacity || null,
          bookingsCount: event.bookingsCount || 0
        },
        debug: {
          currentUserId: currentUserId,
          isFavorite: isFavorite,
          favoritedByCount: event.favoritedBy?.length || 0,
          userInFavoritedBy: event.favoritedBy?.some(id => id.toString() === currentUserId?.toString())
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getEventById:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};




// ===== RÉCUPÉRER TOUS LES ÉVÉNEMENTS (SCROLL MOBILE) =====
// ===== CORRECTION DE getAllEvents =====
/*exports.getAllEvents = async (req, res) => {
  try {
    console.log('🎪 ===== CONTROLLER getAllEvents SIMPLIFIÉ =====');
    console.log('🔍 Requête reçue:', {
      method: req.method,
      url: req.originalUrl,
      query: req.query,
      userId: req.user?.id
    });
    
    const currentUserId = req.user?.id; // Récupérer l'ID utilisateur connecté
    
    // REQUÊTE MONGODB SIMPLIFIÉE
    const simpleQuery = { 
      isActive: true
    };
    
    console.log('🔍 Requête MongoDB simplifiée:', simpleQuery);
    
    // EXÉCUTION DE LA REQUÊTE
    console.log('💾 Exécution requête database...');
    const startTime = Date.now();
    
    const events = await EventDetails.find(simpleQuery)
      .sort({ createdAt: -1 })
      .lean();
    
    const endTime = Date.now();
    console.log(`⏱️ Temps requête: ${endTime - startTime}ms`);
    console.log(`📊 Événements trouvés en DB: ${events.length}`);
    
    // TRAITEMENT DES DONNÉES AVEC VÉRIFICATION FAVORIS
    console.log('\n🔄 Traitement des données avec vérification favoris...');
    const processedEvents = events.map((event, index) => {
      // Vérifier si l'utilisateur a mis cet événement en favoris
      const isFavorite = currentUserId && event.favoritedBy && Array.isArray(event.favoritedBy)
        ? event.favoritedBy.some(userId => userId.toString() === currentUserId.toString())
        : false;
      
      return {
        _id: event._id,
        title: event.title || 'Titre manquant',
        location: event.location || 'Lieu non spécifié',
        category: event.category || 'autre',
        date: event.date || 'Date non spécifiée',
        time: event.time || 'Heure non spécifiée',
        rating: event.averageRating || 0,
        review: event.review || '0 avis',
        totalReviews: event.totalReviews || 0,
        
        // Prix simplifié
        price: event.fixedPrice 
          ? `${event.fixedPrice.toLocaleString()} Fcfa`
          : event.price?.solo || `À partir de ${event.priceRange?.min || 0} Fcfa`,
        
        // Informations prix détaillées
        priceInfo: event.fixedPrice ? {
          type: 'fixed',
          value: event.fixedPrice,
          display: `${event.fixedPrice.toLocaleString()} Fcfa`
        } : {
          type: 'categories',
          solo: event.price?.solo,
          couple: event.price?.couple,
          group: event.price?.group,
          range: {
            min: event.priceRange?.min || 0,
            max: event.priceRange?.max || 0
          }
        },
        
        // Images
        hasImage: event.eventImage ? true : false,
        eventImage: event.eventImage || null,
        images: event.images || [],
        
        // Description tronquée
        description: event.description ? event.description.substring(0, 150) + '...' : 'Description non disponible',
        
        // Disponibilité
        availability: {
          isAvailable: event.isAvailable || false,
          capacity: event.capacity || null
        },
        
        // Informations organisateur
        organisateur: event.organisateur || 'Organisateur non spécifié',
        highlights: event.highlights || [],
        inclusions: event.inclusions || [],
        
        // Statistiques
        viewsCount: event.viewsCount || 0,
        favoritesCount: event.favoritesCount || 0,
        bookingsCount: event.bookingsCount || 0,
        
        // Dates et géolocalisation
        eventDates: event.eventDates || null,
        coordinates: event.coordinates || null,
        
        // CORRECTION: Favoris spécifique à l'utilisateur
        isFavorite: isFavorite,
        createdAt: event.createdAt || new Date(),
        
        // Debug info
        debug: {
          hasFullDetails: event.hasFullDetails,
          isActive: event.isActive,
          isAvailable: event.isAvailable,
          userHasFavorited: isFavorite, // Debug pour voir si la logique fonctionne
          favoritedByCount: event.favoritedBy ? event.favoritedBy.length : 0
        }
      };
    });
    
    console.log(`✅ ${processedEvents.length} événements traités`);
    
    // Debug favoris
    const userFavoritesCount = processedEvents.filter(e => e.isFavorite).length;
    console.log(`❤️ ${userFavoritesCount} événements en favoris pour cet utilisateur`);
    
    // STATISTIQUES SIMPLIFIÉES
    const stats = {
      totalEvents: processedEvents.length,
      userFavorites: userFavoritesCount, // Nouveauté
      averageRating: processedEvents.length > 0 
        ? parseFloat((processedEvents.reduce((sum, event) => sum + event.rating, 0) / processedEvents.length).toFixed(1))
        : 0,
      categoriesAvailable: [...new Set(processedEvents.map(e => e.category))],
      regionsAvailable: [...new Set(processedEvents.map(e => event => event.location))],
      withImages: processedEvents.filter(e => e.hasImage).length,
      available: processedEvents.filter(e => e.availability.isAvailable).length
    };
    
    // RÉPONSE FINALE AVEC DEBUG
    const responseData = {
      success: true,
      data: processedEvents,
      stats: stats,
      debug: {
        queryUsed: simpleQuery,
        totalFoundInDb: events.length,
        userFavoritesCount: userFavoritesCount,
        currentUserId: currentUserId,
        processingTime: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('\n📤 Réponse finale préparée:');
    console.log('  - success:', responseData.success);
    console.log('  - data.length:', responseData.data.length);
    console.log('  - stats.totalEvents:', responseData.stats.totalEvents);
    console.log('  - stats.userFavorites:', responseData.stats.userFavorites);
    console.log('  - debug.totalFoundInDb:', responseData.debug.totalFoundInDb);
    
    console.log('\n🎉 ===== FIN CONTROLLER getAllEvents SIMPLIFIÉ =====\n');
    
    return res.json(responseData);
    
  } catch (error) {
    console.log('\n❌ ===== ERREUR CONTROLLER getAllEvents =====');
    console.error('Type d\'erreur:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.log('=============================================\n');
    
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite lors de la récupération des événements.",
      data: [],
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : 'Erreur serveur interne',
      debug: {
        timestamp: new Date().toISOString(),
        controller: 'getAllEvents'
      }
    });
  }
};*/
/*exports.getAllEvents = async (req, res) => {
  try {
    console.log('\n🎪 ===== CONTROLLER getAllEvents DIAGNOSTIC =====');
    console.log('🔍 Informations requête:');
    console.log('  - Method:', req.method);
    console.log('  - URL:', req.originalUrl);
    console.log('  - Path:', req.path);
    console.log('  - Query params:', req.query);
    console.log('  - Headers:', req.headers);
    console.log('  - User ID:', req.user?.id);
    console.log('  - Timestamp:', new Date().toISOString());
    
    const { 
      sortBy = 'averageRating',
      minRating = 0,
      maxPrice,
      minPrice,
      category,
      isAvailable = true,
      upcoming = true
    } = req.query;
    
    console.log('\n🔧 Paramètres traités:');
    console.log('  - sortBy:', sortBy);
    console.log('  - minRating:', minRating);
    console.log('  - maxPrice:', maxPrice);
    console.log('  - minPrice:', minPrice);
    console.log('  - category:', category);
    console.log('  - isAvailable:', isAvailable);
    console.log('  - upcoming:', upcoming);
    
    // Construction de la requête MongoDB
    const query = { 
      isActive: isAvailable === 'true' || isAvailable === true,
      hasFullDetails: true
    };
    
    // Ajout des filtres
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (minRating && parseFloat(minRating) > 0) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }
    
    if (minPrice || maxPrice) {
      const priceConditions = [];
      
      if (minPrice) {
        const minPriceValue = parseFloat(minPrice);
        priceConditions.push({
          $or: [
            { 'priceRange.min': { $gte: minPriceValue } },
            { 
              $and: [
                { 'priceRange.min': { $lte: minPriceValue } },
                { 'priceRange.max': { $gte: minPriceValue } }
              ]
            }
          ]
        });
      }
      
      if (maxPrice) {
        const maxPriceValue = parseFloat(maxPrice);
        priceConditions.push({
          'priceRange.min': { $lte: maxPriceValue }
        });
      }
      
      if (priceConditions.length > 0) {
        query.$and = query.$and ? [...query.$and, ...priceConditions] : priceConditions;
      }
    }
    
    if (upcoming === 'true') {
      query['eventDates.startDate'] = { $gt: new Date() };
    }
    
    if (isAvailable === 'true') {
      query.isAvailable = true;
    }
    
    console.log('\n🔍 Requête MongoDB construite:');
    console.log(JSON.stringify(query, null, 2));
    
    // Options de tri
    const sortOptions = {
      'averageRating': { averageRating: -1, totalReviews: -1 },
      'price_asc': { 'priceRange.min': 1 },
      'price_desc': { 'priceRange.max': -1 },
      'title': { title: 1 },
      'date': { 'eventDates.startDate': 1 },
      'location': { location: 1 },
      'newest': { createdAt: -1 },
      'popular': { viewsCount: -1, favoritesCount: -1 },
      'reviews': { totalReviews: -1, averageRating: -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.averageRating;
    console.log('\n📊 Tri appliqué:', sort);
    
    // REQUÊTE DATABASE
    console.log('\n💾 Exécution requête database...');
    const startDbTime = Date.now();
    
    const events = await EventDetails.find(query)
      .sort(sort)
      .lean();
    
    const endDbTime = Date.now();
    console.log(`⏱️ Temps requête DB: ${endDbTime - startDbTime}ms`);
    
    const totalEvents = events.length;
    console.log(`📊 Événements trouvés en DB: ${totalEvents}`);
    
    if (totalEvents === 0) {
      console.log('⚠️ Aucun événement trouvé avec ces critères');
      console.log('💡 Vérifications suggérées:');
      console.log('  - Événements avec isActive=true:', await EventDetails.countDocuments({ isActive: true }));
      console.log('  - Événements avec hasFullDetails=true:', await EventDetails.countDocuments({ hasFullDetails: true }));
      console.log('  - Total événements en DB:', await EventDetails.countDocuments());
    } else {
      console.log('\n📋 Aperçu des événements trouvés:');
      events.slice(0, 5).forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} (${event.category}) - ${event.region_Name}`);
      });
      
      console.log('\n🔍 Analyse des données:');
      console.log('  - Avec images:', events.filter(e => e.eventImage).length);
      console.log('  - Disponibles:', events.filter(e => e.isAvailable).length);
      console.log('  - Avec détails complets:', events.filter(e => e.hasFullDetails).length);
      console.log('  - Par catégorie:', events.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {}));
    }
    
    // TRAITEMENT DES DONNÉES
    console.log('\n🔄 Traitement des données...');
    const startProcessTime = Date.now();
    
    const processedEvents = events.map((event, index) => {
      if (index < 3) {
        console.log(`🔄 Traitement événement ${index + 1}: ${event.title}`);
      }
      
      return {
        _id: event._id,
        title: event.title || '',
        location: event.location || '',
        category: event.category || 'autre',
        date: event.date || '',
        time: event.time || '',
        rating: event.averageRating || 0,
        review: event.review || '0 avis',
        totalReviews: event.totalReviews || 0,
        
        price: event.fixedPrice 
          ? `${event.fixedPrice.toLocaleString()} Fcfa`
          : event.price?.solo || `À partir de ${event.priceRange?.min || 0} Fcfa`,
        
        priceInfo: event.fixedPrice ? {
          type: 'fixed',
          value: event.fixedPrice,
          display: `${event.fixedPrice.toLocaleString()} Fcfa`
        } : {
          type: 'categories',
          solo: event.price?.solo,
          couple: event.price?.couple,
          group: event.price?.group,
          range: {
            min: event.priceRange?.min || 0,
            max: event.priceRange?.max || 0
          }
        },
        
        hasImage: event.eventImage ? true : false,
        eventImage: event.eventImage || null,
        images: event.images || [],
        description: event.description ? event.description.substring(0, 150) + '...' : '',
        
        availability: {
          isAvailable: event.isAvailable || false,
          capacity: event.capacity || null
        },
        
        organisateur: event.organisateur || '',
        highlights: event.highlights || [],
        inclusions: event.inclusions || [],
        
        viewsCount: event.viewsCount || 0,
        favoritesCount: event.favoritesCount || 0,
        bookingsCount: event.bookingsCount || 0,
        
        eventDates: event.eventDates || null,
        coordinates: event.coordinates || null,
        
        isFavorite: false,
        createdAt: event.createdAt || new Date()
      };
    });
    
    const endProcessTime = Date.now();
    console.log(`⏱️ Temps traitement: ${endProcessTime - startProcessTime}ms`);
    console.log(`✅ Événements traités: ${processedEvents.length}`);
    
    // STATISTIQUES
    const stats = {
      totalEvents,
      averageRating: totalEvents > 0 
        ? parseFloat((processedEvents.reduce((sum, event) => sum + event.rating, 0) / totalEvents).toFixed(1))
        : 0,
      priceRange: totalEvents > 0 ? {
        min: Math.min(...processedEvents.map(e => e.priceInfo.type === 'fixed' ? e.priceInfo.value : e.priceInfo.range.min)),
        max: Math.max(...processedEvents.map(e => e.priceInfo.type === 'fixed' ? e.priceInfo.value : e.priceInfo.range.max))
      } : { min: 0, max: 0 },
      categoriesAvailable: [...new Set(processedEvents.map(e => e.category))],
      upcomingCount: processedEvents.filter(e => new Date(e.eventDates?.startDate) > new Date()).length
    };
    
    console.log('\n📊 Statistiques calculées:', stats);
    
    // RÉPONSE FINALE
    console.log('\n📤 Préparation réponse finale...');
    const responseData = {
      success: true,
      data: processedEvents,
      stats: stats
    };
    
    console.log('✅ Réponse prête:');
    console.log('  - success:', responseData.success);
    console.log('  - data.length:', responseData.data.length);
    console.log('  - stats.totalEvents:', responseData.stats.totalEvents);
    
    console.log('\n🎉 ===== FIN CONTROLLER getAllEvents =====');
    console.log('===========================================\n');
    
    return res.json(responseData);
    
  } catch (error) {
    console.log('\n❌ ===== ERREUR CONTROLLER getAllEvents =====');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.log('===============================================\n');
    
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: [],
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
    });
  }
};*/

// À ajouter à la fin de controllers/eventController.js

// ===== AJOUTER UNE RÉPONSE À UN AVIS =====
exports.addReviewReply = async (req, res) => {
  try {
    const { eventId, reviewId } = req.params;
    const { comment } = req.body;
    const { id: userId, username } = req.user;

    const displayName = username || `User${userId.slice(-6)}`;

    console.log(`💬 Ajout réponse à l'avis ${reviewId} pour événement ${eventId} par ${displayName}`);

    // Validation
    if (!comment || comment.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "La réponse doit contenir au moins 3 caractères"
      });
    }

    if (comment.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "La réponse ne peut pas dépasser 500 caractères"
      });
    }

    // Trouver l'événement
    const event = await EventDetails.findOne({ _id: eventId, isActive: true });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }

    // Trouver l'avis dans l'événement
    const review = event.reviews.find(r => r._id.toString() === reviewId || r.id === reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Avis non trouvé"
      });
    }

    // Créer la nouvelle réponse
    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      username: displayName,
      comment: comment.trim(),
      likes: 0,
      likedBy: [],
      createdAt: new Date()
    };

    // Ajouter la réponse au tableau replies de l'avis
    if (!review.replies) {
      review.replies = [];
    }
    review.replies.push(newReply);

    // Marquer le document comme modifié et sauvegarder
    event.markModified('reviews');
    await event.save();

    console.log(`✅ Réponse ajoutée avec succès: ${newReply._id}`);

    return res.json({
      success: true,
      message: "Réponse ajoutée avec succès",
      data: {
        reply: {
          _id: newReply._id,
          user: newReply.user,
          username: newReply.username,
          comment: newReply.comment,
          likes: newReply.likes,
          likedBy: newReply.likedBy,
          createdAt: newReply.createdAt
        },
        reviewId: reviewId
      }
    });

  } catch (error) {
    console.error(`❌ Erreur addReviewReply:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== TOGGLE LIKE SUR UNE RÉPONSE =====
// ===== TOGGLE LIKE SUR UNE RÉPONSE - VERSION CORRIGÉE =====
exports.toggleReplyLike = async (req, res) => {
  try {
    const { eventId, reviewId, replyId } = req.params;
    const { id: userId } = req.user;

    console.log(`❤️ Toggle like réponse: événement=${eventId}, avis=${reviewId}, réponse=${replyId}, user=${userId}`);

    // Trouver l'événement
    const event = await EventDetails.findOne({ _id: eventId, isActive: true });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }

    // Utiliser la méthode du modèle pour toggle le like
    try {
      const result = event.toggleReplyLike(reviewId, replyId, userId);
      await event.save();

      console.log(`✅ Like réponse ${result.action}: ${result.newCount} likes`);

      return res.json({
        success: true,
        message: `Réponse ${result.action === 'liked' ? 'likée' : 'unlikée'} avec succès`,
        data: {
          action: result.action,
          likesCount: result.newCount,
          liked: result.action === 'liked'
        }
      });

    } catch (methodError) {
      // Gestion des erreurs spécifiques de la méthode du modèle
      if (methodError.message.includes('non trouvé')) {
        return res.status(404).json({
          success: false,
          message: methodError.message
        });
      }
      throw methodError;
    }

  } catch (error) {
    console.error(`❌ Erreur toggleReplyLike:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};
/*exports.getAllEvents = async (req, res) => {
  try {
    const { 
      sortBy = 'averageRating',
      minRating = 0,
      maxPrice,
      minPrice,
      category,
      isAvailable = true,
      upcoming = true
    } = req.query;
    
    console.log(`🎪 Récupération de tous les événements pour scroll mobile`);
    
    const query = { 
      isActive: isAvailable === 'true' || isAvailable === true,
      hasFullDetails: true
    };
    
    // Filtrage par catégorie
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filtrage par rating minimum
    if (minRating && parseFloat(minRating) > 0) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }
    
    // Filtrage par prix avec structure priceRange: { min, max }
    if (minPrice || maxPrice) {
      const priceConditions = [];
      
      if (minPrice) {
        const minPriceValue = parseFloat(minPrice);
        priceConditions.push({
          $or: [
            { 'priceRange.min': { $gte: minPriceValue } },
            { 
              $and: [
                { 'priceRange.min': { $lte: minPriceValue } },
                { 'priceRange.max': { $gte: minPriceValue } }
              ]
            }
          ]
        });
      }
      
      if (maxPrice) {
        const maxPriceValue = parseFloat(maxPrice);
        priceConditions.push({
          'priceRange.min': { $lte: maxPriceValue }
        });
      }
      
      if (priceConditions.length > 0) {
        query.$and = query.$and ? [...query.$and, ...priceConditions] : priceConditions;
      }
    }
    
    // Filtrage par disponibilité et événements à venir
    if (upcoming === 'true') {
      query['eventDates.startDate'] = { $gt: new Date() };
    }
    
    if (isAvailable === 'true') {
      query.isAvailable = true;
    }
    
    // Options de tri
    const sortOptions = {
      'averageRating': { averageRating: -1, totalReviews: -1 },
      'price_asc': { 'priceRange.min': 1 },
      'price_desc': { 'priceRange.max': -1 },
      'title': { title: 1 },
      'date': { 'eventDates.startDate': 1 },
      'location': { location: 1 },
      'newest': { createdAt: -1 },
      'popular': { viewsCount: -1, favoritesCount: -1 },
      'reviews': { totalReviews: -1, averageRating: -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.averageRating;
    
    // Récupération TOUS les événements (pas de pagination pour le scroll mobile)
    const events = await EventDetails.find(query)
      .sort(sort)
      .lean();
    
    const totalEvents = events.length;
    
    // Format des données pour le mobile
    const processedEvents = events.map(event => ({
      _id: event._id,
      title: event.title || '',
      location: event.location || '',
      category: event.category || 'autre',
      date: event.date || '',
      time: event.time || '',
      rating: event.averageRating || 0,
      review: event.review || '0 avis',
      totalReviews: event.totalReviews || 0,
      
      // Gestion des prix selon le mode (fixe ou catégories)
      price: event.fixedPrice 
        ? `${event.fixedPrice.toLocaleString()} Fcfa`
        : event.price?.solo || `À partir de ${event.priceRange?.min || 0} Fcfa`,
      
      priceInfo: event.fixedPrice ? {
        type: 'fixed',
        value: event.fixedPrice,
        display: `${event.fixedPrice.toLocaleString()} Fcfa`
      } : {
        type: 'categories',
        solo: event.price?.solo,
        couple: event.price?.couple,
        group: event.price?.group,
        range: {
          min: event.priceRange?.min || 0,
          max: event.priceRange?.max || 0
        }
      },
      
      hasImage: event.eventImage ? true : false,
      eventImage: event.eventImage || null,
      images: event.images || [],
      description: event.description ? event.description.substring(0, 150) + '...' : '',
      
      availability: {
        isAvailable: event.isAvailable || false,
        capacity: event.capacity || null
      },
      
      organisateur: event.organisateur || '',
      highlights: event.highlights || [],
      inclusions: event.inclusions || [],
      
      viewsCount: event.viewsCount || 0,
      favoritesCount: event.favoritesCount || 0,
      bookingsCount: event.bookingsCount || 0,
      
      eventDates: event.eventDates || null,
      coordinates: event.coordinates || null,
      
      isFavorite: false, // Sera mis à jour côté client selon l'utilisateur connecté
      createdAt: event.createdAt || new Date()
    }));
    
    console.log(`✅ ${processedEvents.length} événements récupérés pour affichage mobile`);
    
    return res.json({
      success: true,
      data: processedEvents,
      stats: {
        totalEvents,
        averageRating: totalEvents > 0 
          ? parseFloat((processedEvents.reduce((sum, event) => sum + event.rating, 0) / totalEvents).toFixed(1))
          : 0,
        priceRange: totalEvents > 0 ? {
          min: Math.min(...processedEvents.map(e => e.priceInfo.type === 'fixed' ? e.priceInfo.value : e.priceInfo.range.min)),
          max: Math.max(...processedEvents.map(e => e.priceInfo.type === 'fixed' ? e.priceInfo.value : e.priceInfo.range.max))
        } : { min: 0, max: 0 },
        categoriesAvailable: [...new Set(processedEvents.map(e => e.category))],
        upcomingCount: processedEvents.filter(e => new Date(e.eventDates?.startDate) > new Date()).length
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getAllEvents:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: []
    });
  }
};*/

// ===== RÉCUPÉRER ÉVÉNEMENTS PAR RÉGION =====
exports.getEventsByRegion = async (req, res) => {
  try {
    const { regionName } = req.params;
    const { 
      sortBy = 'averageRating',
      minRating = 0,
      maxPrice,
      minPrice,
      category,
      upcoming = true
    } = req.query;
    
    console.log(`🎪 Récupération événements pour région: ${regionName}`);
    
    const query = { 
      isActive: true,
      hasFullDetails: true,
      region_Name: { $regex: regionName, $options: 'i' }
    };
    
    // Filtrage par catégorie
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filtrage par rating minimum
    if (minRating && parseFloat(minRating) > 0) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }
    
    // Filtrage par prix
    if (minPrice || maxPrice) {
      const priceConditions = [];
      
      if (minPrice) {
        const minPriceValue = parseFloat(minPrice);
        priceConditions.push({
          $or: [
            { 'priceRange.min': { $gte: minPriceValue } },
            { 
              $and: [
                { 'priceRange.min': { $lte: minPriceValue } },
                { 'priceRange.max': { $gte: minPriceValue } }
              ]
            }
          ]
        });
      }
      
      if (maxPrice) {
        const maxPriceValue = parseFloat(maxPrice);
        priceConditions.push({
          'priceRange.min': { $lte: maxPriceValue }
        });
      }
      
      if (priceConditions.length > 0) {
        query.$and = query.$and ? [...query.$and, ...priceConditions] : priceConditions;
      }
    }
    
    // Filtrage par événements à venir
    if (upcoming === 'true') {
      query['eventDates.startDate'] = { $gt: new Date() };
    }
    
    // Options de tri
    const sortOptions = {
      'averageRating': { averageRating: -1, totalReviews: -1 },
      'price_asc': { 'priceRange.min': 1 },
      'price_desc': { 'priceRange.max': -1 },
      'date': { 'eventDates.startDate': 1 },
      'title': { title: 1 },
      'location': { location: 1 },
      'newest': { createdAt: -1 },
      'popular': { viewsCount: -1, favoritesCount: -1 },
      'reviews': { totalReviews: -1, averageRating: -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.averageRating;
    
    // Récupération des événements de la région
    const events = await EventDetails.find(query)
      .sort(sort)
      .lean();
    
    // Vérifier si la région existe
    if (events.length === 0) {
      return res.json({
        success: true,
        data: [],
        regionInfo: {
          name: regionName,
          location: ''
        },
        message: "Aucun événement disponible dans cette région pour le moment"
      });
    }
    
    // Format des données pour le mobile (même processing que getAllEvents)
    const processedEvents = events.map(event => ({
      _id: event._id,
      title: event.title || '',
      location: event.location || '',
      region: event.region_Name || '',
      category: event.category || 'autre',
      date: event.date || '',
      time: event.time || '',
      rating: event.averageRating || 0,
      review: event.review || '0 avis',
      totalReviews: event.totalReviews || 0,
      
      price: event.fixedPrice 
        ? `${event.fixedPrice.toLocaleString()} Fcfa`
        : event.price?.solo || `À partir de ${event.priceRange?.min || 0} Fcfa`,
      
      priceInfo: event.fixedPrice ? {
        type: 'fixed',
        value: event.fixedPrice,
        display: `${event.fixedPrice.toLocaleString()} Fcfa`
      } : {
        type: 'categories',
        solo: event.price?.solo,
        couple: event.price?.couple,
        group: event.price?.group,
        range: {
          min: event.priceRange?.min || 0,
          max: event.priceRange?.max || 0
        }
      },
      
      hasImage: event.eventImage ? true : false,
      eventImage: event.eventImage || null,
      images: event.images || [],
      description: event.description ? event.description.substring(0, 150) + '...' : '',
      
      availability: {
        isAvailable: event.isAvailable || false,
        capacity: event.capacity || null
      },
      
      organisateur: event.organisateur || '',
      highlights: event.highlights || [],
      inclusions: event.inclusions || [],
      
      viewsCount: event.viewsCount || 0,
      favoritesCount: event.favoritesCount || 0,
      bookingsCount: event.bookingsCount || 0,
      
      eventDates: event.eventDates || null,
      coordinates: event.coordinates || null,
      createdAt: event.createdAt || new Date()
    }));
    
    console.log(`✅ ${processedEvents.length} événements trouvés dans la région ${regionName}`);
    
    return res.json({
      success: true,
      data: processedEvents,
      regionInfo: {
        name: regionName,
        totalEvents: processedEvents.length
      },
      stats: {
        totalEvents: processedEvents.length,
        averageRating: processedEvents.length > 0 
          ? parseFloat((processedEvents.reduce((sum, event) => sum + event.rating, 0) / processedEvents.length).toFixed(1))
          : 0,
        priceRange: processedEvents.length > 0 ? {
          min: Math.min(...processedEvents.map(e => e.priceInfo.type === 'fixed' ? e.priceInfo.value : e.priceInfo.range.min)),
          max: Math.max(...processedEvents.map(e => e.priceInfo.type === 'fixed' ? e.priceInfo.value : e.priceInfo.range.max))
        } : { min: 0, max: 0 },
        categoriesAvailable: [...new Set(processedEvents.map(e => e.category))],
        upcomingCount: processedEvents.filter(e => new Date(e.eventDates?.startDate) > new Date()).length
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getEventsByRegion:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      data: []
    });
  }
};


// =====================================================================
// 💖 RÉCUPÉRER TOUS LES ÉVÉNEMENTS FAVORIS DE L'UTILISATEUR
// =====================================================================

exports.getUserFavoriteEvents = async (req, res) => {
  try {
    const { id: userId, username } = req.user;
    const { 
      sortBy = 'dateAdded',
      category,
      region 
    } = req.query;
    
    const displayName = username || `User${userId.slice(-6)}`;
    console.log(`💖 Récupération favoris événements pour: ${displayName}`);
    
    // ============================================
    // 1. CONSTRUCTION DE LA REQUÊTE
    // ============================================
    const query = {
      isActive: true,
      favoritedBy: userId // Tous les événements où l'utilisateur est dans favoritedBy
    };
    
    // Filtres optionnels
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (region) {
      query.region_Name = { $regex: region, $options: 'i' };
    }
    
    // ============================================
    // 2. OPTIONS DE TRI
    // ============================================
    const sortOptions = {
      'dateAdded': { updatedAt: -1 }, // Plus récemment ajouté en favoris
      'rating': { averageRating: -1 },
      'date': { 'eventDates.startDate': 1 },
      'title': { title: 1 },
      'price': { 'priceRange.min': 1 },
      'popular': { viewsCount: -1, favoritesCount: -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.dateAdded;
    
    // ============================================
    // 3. RÉCUPÉRATION DE TOUS LES FAVORIS
    // ============================================
    const favoriteEvents = await EventDetails.find(query)
      .sort(sort)
      .lean(); // Pas de pagination - tous les favoris
    
    const totalFavorites = favoriteEvents.length;
    console.log(`📊 ${totalFavorites} événements favoris trouvés`);
    
    // ============================================
    // 4. TRAITEMENT DES ÉVÉNEMENTS
    // ============================================
    const processedFavorites = favoriteEvents.map(event => {
      return {
        _id: event._id,
        title: event.title || '',
        location: event.location || '',
        region: event.region_Name || '',
        category: event.category || 'autre',
        date: event.date || '',
        time: event.time || '',
        rating: event.averageRating || 0,
        totalReviews: event.totalReviews || 0,
        
        // Informations prix
        priceInfo: event.fixedPrice ? {
          type: 'fixed',
          value: event.fixedPrice,
          display: `${event.fixedPrice.toLocaleString()} Fcfa`
        } : {
          type: 'categories',
          solo: event.price?.solo,
          couple: event.price?.couple,
          group: event.price?.group,
          range: {
            min: event.priceRange?.min || 0,
            max: event.priceRange?.max || 0
          }
        },
        
        // Images
        eventImage: event.eventImage || null,
        images: event.images || [],
        
        // Description
        description: event.description 
          ? event.description.substring(0, 150) + (event.description.length > 150 ? '...' : '')
          : '',
        
        // Organisateur et informations
        organisateur: event.organisateur || '',
        
        // Disponibilité
        availability: {
          isAvailable: event.isAvailable || false,
          capacity: event.capacity || null
        },
        
        // Dates
        eventDates: event.eventDates || null,
        
        // Statistiques
        viewsCount: event.viewsCount || 0,
        favoritesCount: event.favoritesCount || 0,
        bookingsCount: event.bookingsCount || 0,
        
        // Toujours true puisque c'est la liste des favoris
        isFavorite: true,
        
        // Date d'ajout aux favoris (approximative)
        favoriteAddedAt: event.updatedAt,
        
        // Statut de l'événement
        eventStatus: {
          isUpcoming: event.eventDates?.startDate 
            ? new Date(event.eventDates.startDate) > new Date() 
            : false,
          isPast: event.eventDates?.endDate 
            ? new Date(event.eventDates.endDate) < new Date() 
            : false,
          daysUntil: event.eventDates?.startDate 
            ? Math.ceil((new Date(event.eventDates.startDate) - new Date()) / (1000 * 60 * 60 * 24))
            : null
        },
        
        // Coordonnées
        coordinates: event.coordinates || null
      };
    });
    
    // ============================================
    // 5. STATISTIQUES ENRICHIES
    // ============================================
    const stats = {
      totalFavorites: totalFavorites,
      categoriesInFavorites: [...new Set(processedFavorites.map(e => e.category))],
      regionsInFavorites: [...new Set(processedFavorites.map(e => e.region).filter(r => r))],
      upcomingFavorites: processedFavorites.filter(e => e.eventStatus.isUpcoming).length,
      availableFavorites: processedFavorites.filter(e => e.availability.isAvailable).length,
      averageRating: totalFavorites > 0
        ? parseFloat((processedFavorites.reduce((sum, e) => sum + e.rating, 0) / totalFavorites).toFixed(1))
        : 0,
      priceRange: totalFavorites > 0 ? {
        min: Math.min(...processedFavorites.map(e => 
          e.priceInfo.type === 'fixed' ? e.priceInfo.value : e.priceInfo.range.min
        )),
        max: Math.max(...processedFavorites.map(e => 
          e.priceInfo.type === 'fixed' ? e.priceInfo.value : e.priceInfo.range.max
        ))
      } : { min: 0, max: 0 }
    };
    
    console.log(`✅ ${totalFavorites} événements favoris traités pour ${displayName}`);
    console.log(`📊 Statistiques: ${stats.upcomingFavorites} à venir, ${stats.availableFavorites} disponibles`);
    
    // ============================================
    // 6. RÉPONSE FINALE
    // ============================================
    return res.json({
      success: true,
      data: processedFavorites,
      meta: {
        total: totalFavorites,
        count: processedFavorites.length,
        sortBy: sortBy,
        filters: {
          category: category || 'all',
          region: region || 'all'
        }
      },
      stats: stats,
      user: {
        id: userId,
        username: displayName
      },
      message: totalFavorites === 0 
        ? "Vous n'avez pas encore d'événements favoris" 
        : `Vous avez ${totalFavorites} événement${totalFavorites > 1 ? 's' : ''} en favoris`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ Erreur getUserFavoriteEvents:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos événements favoris",
      data: [],
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne',
      timestamp: new Date().toISOString()
    });
  }
};

// ===== CORRECTION DE getEventById =====
/*exports.getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const currentUserId = req.user.id;
    
    console.log(`🔍 Recherche événement ID: ${eventId}`);
    console.log(`👤 Utilisateur connecté: ${currentUserId}`);
    
    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "ID d'événement invalide"
      });
    }
    
    const event = await EventDetails.findOne({ 
      _id: eventId, 
      isActive: true 
    }).lean();
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }
    
    // Incrémenter les vues
    await EventDetails.findByIdAndUpdate(
      eventId, 
      { $inc: { viewsCount: 1 } }
    );
    
    // CORRECTION: Vérifier si l'utilisateur a mis en favoris
    const isFavorite = event.favoritedBy && Array.isArray(event.favoritedBy)
      ? event.favoritedBy.some(userId => userId.toString() === currentUserId.toString())
      : false;
    
    // Traitement des données utilisateur
    const processedEvent = {
      ...event,
      viewsCount: (event.viewsCount || 0) + 1,
      isFavorite: isFavorite // CORRECTION: Utiliser isFavorite au lieu de isFavoriteByUser
    };

    // ✅ CORRECTION: Traitement des avis avec structure user cohérente
    if (processedEvent.reviews && processedEvent.reviews.length > 0) {
      processedEvent.reviews = processedEvent.reviews.map(review => ({
        ...review,
        // Gestion de compatibilité avec les différentes structures
        userName: review.user ? review.user.username : (review.userName || 'Utilisateur'),
        userAvatar: review.user ? review.user.avatar : (review.avatar || ''),
        // Conserver la structure originale pour compatibilité
        user: review.user ? review.user.username : (review.userName || 'Utilisateur'),
        avatar: review.user ? review.user.avatar : (review.avatar || '')
      }));
    }

    console.log(`✅ Détails événement trouvés: ${event.title}`);
    console.log(`❤️ Utilisateur a mis en favoris: ${isFavorite}`);
    
    return res.json({
      success: true,
      details: {
        ...processedEvent,
        priceInfo: event.fixedPrice ? {
          type: 'fixed',
          value: event.fixedPrice,
          display: `${event.fixedPrice.toLocaleString()} FCFA`
        } : {
          type: 'categories',
          solo: event.price?.solo,
          couple: event.price?.couple,
          group: event.price?.group,
          range: {
            min: event.priceRange?.min || 0,
            max: event.priceRange?.max || 0,
            display: event.priceRange && event.priceRange.min && event.priceRange.max && event.priceRange.min !== event.priceRange.max 
              ? `${event.priceRange.min.toLocaleString()} - ${event.priceRange.max.toLocaleString()} FCFA`
              : `À partir de ${event.priceRange?.min || 0} FCFA`
          }
        },
        eventDatesInfo: event.eventDates ? {
          startDate: event.eventDates.startDate,
          endDate: event.eventDates.endDate,
          isUpcoming: new Date(event.eventDates.startDate) > new Date(),
          daysUntil: Math.ceil((new Date(event.eventDates.startDate) - new Date()) / (1000 * 60 * 60 * 24))
        } : null,
        availabilityInfo: {
          isAvailable: event.isAvailable || false,
          capacity: event.capacity || null,
          bookingsCount: event.bookingsCount || 0
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getEventById:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};*/

// ===== AJOUTER UN AVIS ÉVÉNEMENT =====
exports.submitEventReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array()
      });
    }
    
    const { eventId } = req.params;
    const { rating, review = '' } = req.body;
    const { id: user_id, username, profile } = req.user;

    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`⭐ Ajout avis événement: ${eventId} par ${displayName}`);
    
    const event = await EventDetails.findOne({ _id: eventId, isActive: true });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }
    
    // ✅ CORRECTION: Utiliser la méthode du modèle avec les bons paramètres
    try {
      await event.addReview(user_id, { 
        username: displayName, 
        avatar: profile || '' 
      }, parseInt(rating), review.trim());
      
      console.log(`✅ Avis ajouté: ${rating}/5 par ${displayName} - Nouvelle moyenne: ${event.averageRating}`);
      
      return res.json({
        success: true,
        message: "Avis ajouté avec succès",
        data: {
          averageRating: event.averageRating,
          totalReviews: event.totalReviews,
          newRating: rating
        }
      });
      
    } catch (reviewError) {
      if (reviewError.message === 'Vous avez déjà donné un avis pour cet événement') {
        return res.status(409).json({
          success: false,
          message: reviewError.message
        });
      }
      throw reviewError;
    }
    
  } catch (error) {
    console.error(`❌ Erreur submitEventReview:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== TOGGLE FAVORIS ÉVÉNEMENT =====
// ===== TOGGLE FAVORIS ÉVÉNEMENT - VERSION CORRIGÉE =====
exports.toggleEventFavorite = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { id: user_id, username } = req.user;

    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`❤️ Toggle favoris événement: ${eventId} par ${displayName}`);
    
    const event = await EventDetails.findOne({ _id: eventId, isActive: true });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }
    
    // ✅ CORRECTION: Nettoyer les avis avant de sauvegarder
    if (event.reviews && event.reviews.length > 0) {
      event.reviews.forEach((review, index) => {
        // S'assurer que replies est un tableau
        if (!Array.isArray(review.replies)) {
          console.log(`🔧 Correction review ${index}: replies n'est pas un tableau, initialisation...`);
          review.replies = [];
        }
        
        // Nettoyer les replies qui ne sont pas des objets valides
        review.replies = review.replies.filter(reply => {
          if (typeof reply === 'object' && reply !== null && reply._id) {
            return true;
          } else {
            console.log(`🧹 Suppression reply invalide:`, reply);
            return false;
          }
        });
      });
    }
    
    const result = event.toggleFavorite(user_id);
    
    // ✅ CORRECTION: Marquer explicitement le document comme modifié
    event.markModified('reviews');
    await event.save();

    console.log(`✅ Favoris ${result.action}: ${result.isFavorite ? 'ajouté' : 'retiré'} - Total: ${event.favoritesCount}`);
    
    return res.json({
      success: true,
      message: result.action === 'added' ? 'Ajouté aux favoris' : 'Retiré des favoris',
      data: {
        isFavorite: result.isFavorite,
        favoritesCount: event.favoritesCount,
        action: result.action
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur toggleEventFavorite:`, error);
    
    // ✅ CORRECTION: Gestion spécifique de l'erreur de validation
    if (error.name === 'ValidationError' && error.message.includes('replies')) {
      console.log('🔧 Erreur de validation des replies détectée, tentative de correction...');
      
      try {
        // Recharger l'événement et nettoyer les données
        const eventToFix = await EventDetails.findById(req.params.eventId);
        if (eventToFix) {
          // Nettoyer tous les avis
          if (eventToFix.reviews) {
            eventToFix.reviews.forEach(review => {
              if (!Array.isArray(review.replies)) {
                review.replies = [];
              }
            });
          }
          
          // Refaire l'opération favoris
          const result = eventToFix.toggleFavorite(req.user.id);
          eventToFix.markModified('reviews');
          await eventToFix.save();
          
          return res.json({
            success: true,
            message: result.action === 'added' ? 'Ajouté aux favoris (après correction)' : 'Retiré des favoris (après correction)',
            data: {
              isFavorite: result.isFavorite,
              favoritesCount: eventToFix.favoritesCount,
              action: result.action
            }
          });
        }
      } catch (retryError) {
        console.error('❌ Erreur lors de la tentative de correction:', retryError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RECHERCHER ÉVÉNEMENTS =====
exports.searchEvents = async (req, res) => {
  try {
    const { 
      query: searchQuery = '', 
      region_Name, 
      category,
      minRating = 0,
      minPrice,
      maxPrice,
      sortBy = 'rating',
      upcoming = true
    } = req.query;
    
    console.log(`🔍 Recherche événements: "${searchQuery}"`);
    
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
      regionName: region_Name,
      category: category
    };
    
    if (minPrice) options.priceRange.min = parseFloat(minPrice);
    if (maxPrice) options.priceRange.max = parseFloat(maxPrice);
    if (upcoming === 'true') options.upcoming = true;
    
    let events = await EventDetails.searchEvents(searchQuery.trim(), options);
    
    // Filtres additionnels
    if (minRating > 0) {
      events = events.filter(event => (event.averageRating || 0) >= parseFloat(minRating));
    }
    
    // Options de tri
    const sortOptions = {
      'rating': (a, b) => (b.averageRating || 0) - (a.averageRating || 0),
      'price_asc': (a, b) => (a.priceRange?.min || 0) - (b.priceRange?.min || 0),
      'price_desc': (a, b) => (b.priceRange?.max || 0) - (a.priceRange?.max || 0),
      'date': (a, b) => new Date(a.eventDates?.startDate || 0) - new Date(b.eventDates?.startDate || 0),
      'name': (a, b) => (a.title || '').localeCompare(b.title || ''),
      'newest': (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      'popular': (a, b) => ((b.viewsCount || 0) + (b.favoritesCount || 0)) - ((a.viewsCount || 0) + (a.favoritesCount || 0))
    };
    
    if (sortOptions[sortBy]) {
      events.sort(sortOptions[sortBy]);
    }
    
    // Format des résultats
    const processedResults = events.map(event => ({
      _id: event._id,
      title: event.title || '',
      location: event.location || '',
      region: event.region_Name || '',
      category: event.category || 'autre',
      date: event.date || '',
      time: event.time || '',
      rating: event.averageRating || 0,
      totalReviews: event.totalReviews || 0,
      
      priceInfo: event.fixedPrice ? {
        type: 'fixed',
        value: event.fixedPrice,
        display: `${event.fixedPrice.toLocaleString()} Fcfa`
      } : {
        type: 'categories',
        solo: event.price?.solo,
        couple: event.price?.couple,
        group: event.price?.group,
        range: {
          min: event.priceRange?.min || 0,
          max: event.priceRange?.max || 0
        }
      },
      
      hasImage: event.eventImage ? true : false,
      eventImage: event.eventImage || null,
      description: event.description ? event.description.substring(0, 100) + '...' : '',
      
      isAvailable: event.isAvailable || false,
      organisateur: event.organisateur || '',
      
      viewsCount: event.viewsCount || 0,
      favoritesCount: event.favoritesCount || 0,
      bookingsCount: event.bookingsCount || 0,
      
      eventDates: event.eventDates || null,
      coordinates: event.coordinates || null
    }));
    
    console.log(`✅ ${processedResults.length} résultats trouvés pour "${searchQuery}"`);
    
    return res.json({
      success: true,
      data: processedResults,
      search: {
        query: searchQuery,
        region: region_Name || 'all',
        category: category || 'all',
        totalResults: processedResults.length,
        filters: {
          minRating: parseFloat(minRating),
          minPrice: minPrice ? parseFloat(minPrice) : null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          upcoming: upcoming === 'true'
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur searchEvents:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RÉSERVER UN ÉVÉNEMENT =====
exports.bookEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array()
      });
    }
    
    const { eventId } = req.params;
    const { 
      bookingType, // 'solo', 'couple', 'group', 'fixed'
      numberOfPersons,
      paymentMethod,
      phoneNumber 
    } = req.body;
    const { id: user_id, username } = req.user;

    console.log(`🎫 Réservation événement ${eventId} par ${username || user_id}`);
    
    const event = await EventDetails.findOne({ _id: eventId, isActive: true });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }
    
    // Vérifier la disponibilité
    if (!event.checkAvailability()) {
      return res.status(400).json({
        success: false,
        message: "Événement non disponible pour réservation"
      });
    }
    
    // Calculer le prix selon le type de réservation
    let totalPrice = 0;
    
    if (event.fixedPrice) {
      // Mode prix fixe
      totalPrice = event.fixedPrice * numberOfPersons;
    } else {
      // Mode prix par catégories
      switch(bookingType) {
        case 'solo':
          totalPrice = parseFloat(event.price.solo.replace(/[^\d]/g, ""));
          break;
        case 'couple':
          totalPrice = parseFloat(event.price.couple.replace(/[^\d]/g, ""));
          break;
        case 'group':
          const groupPrice = parseFloat(event.price.group.replace(/[^\d]/g, ""));
          totalPrice = groupPrice * numberOfPersons;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Type de réservation invalide"
          });
      }
    }
    
   

    
    const serviceFee = 1000;
    const finalTotal = totalPrice + serviceFee;
    
    // Créer la réservation
    const bookingData = {
      userId: user_id,
      bookingType: event.fixedPrice ? 'fixed' : bookingType,
      numberOfPersons: parseInt(numberOfPersons),
      totalPrice: finalTotal,
      paymentMethod,
      phoneNumber,
      paymentStatus: 'confirmed' // Simulation - normalement pending puis confirmed
    };
    
    // ✅ CORRECTION: Meilleure gestion d'erreur de réservation
    try {
      const booking = event.createBooking(bookingData);
      await event.save();
      
      console.log(`✅ Réservation créée: ${booking.bookingReference} - ${numberOfPersons} personnes - ${finalTotal} FCFA`);
      
      return res.json({
        success: true,
        message: "Réservation confirmée avec succès",
        data: {
          bookingReference: booking.bookingReference,
          eventTitle: event.title,
          eventDate: event.date,
          numberOfPersons: booking.numberOfPersons,
          totalPrice: booking.totalPrice,
          paymentMethod: booking.paymentMethod,
          paymentStatus: booking.paymentStatus,
          bookingDate: booking.bookingDate,
          details: {
            serviceFee,
            basePrice: totalPrice,
            bookingType: booking.bookingType
          }
        }
      });
      
    } catch (bookingError) {
      console.error(`❌ Erreur création réservation:`, bookingError);
      
      // Gestion spécifique des erreurs de réservation
      if (bookingError.message.includes('non disponible')) {
        return res.status(400).json({
          success: false,
          message: "Événement complet ou non disponible"
        });
      }
      
      if (bookingError.message.includes('bookingReference') || bookingError.code === 11000) {
        // Erreur d'unicité de référence - réessayer une fois
        console.log('🔄 Tentative de génération d\'une nouvelle référence...');
        try {
          // Regénérer une nouvelle référence
          const newBookingData = {
            ...bookingData,
            // La méthode createBooking génère automatiquement une nouvelle référence
          };
          const retryBooking = event.createBooking(newBookingData);
          await event.save();
          
          return res.json({
            success: true,
            message: "Réservation confirmée avec succès",
            data: {
              bookingReference: retryBooking.bookingReference,
              eventTitle: event.title,
              eventDate: event.date,
              numberOfPersons: retryBooking.numberOfPersons,
              totalPrice: retryBooking.totalPrice,
              paymentMethod: retryBooking.paymentMethod,
              paymentStatus: retryBooking.paymentStatus,
              bookingDate: retryBooking.bookingDate,
              details: {
                serviceFee,
                basePrice: totalPrice,
                bookingType: retryBooking.bookingType
              }
            }
          });
        } catch (retryError) {
          return res.status(500).json({
            success: false,
            message: "Erreur technique de réservation. Veuillez réessayer dans quelques instants."
          });
        }
      }
      
      return res.status(400).json({
        success: false,
        message: bookingError.message || "Erreur lors de la création de la réservation"
      });
    }
    
  } catch (error) {
    console.error(`❌ Erreur bookEvent:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RÉCUPÉRER RÉSERVATIONS UTILISATEUR =====
exports.getUserBookings = async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const { status, limit = 10, page = 1 } = req.query;
    
    console.log(`📋 Récupération réservations utilisateur: ${user_id}`);
    
    const query = {
      isActive: true,
      'bookings.userId': user_id
    };
    
    if (status) {
      query['bookings.paymentStatus'] = status;
    }
    
    const events = await EventDetails.find(query)
      .sort({ 'bookings.bookingDate': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();
    
    // Extraire et formatter les réservations
    const userBookings = [];
    
    events.forEach(event => {
      const userEventBookings = event.bookings.filter(
        booking => booking.userId.toString() === user_id.toString()
      );
      
      userEventBookings.forEach(booking => {
        userBookings.push({
          bookingId: booking._id,
          bookingReference: booking.bookingReference,
          event: {
            _id: event._id,
            title: event.title,
            location: event.location,
            date: event.date,
            time: event.time,
            eventImage: event.eventImage,
            category: event.category
          },
          bookingDetails: {
            bookingType: booking.bookingType,
            numberOfPersons: booking.numberOfPersons,
            totalPrice: booking.totalPrice,
            paymentMethod: booking.paymentMethod,
            paymentStatus: booking.paymentStatus,
            phoneNumber: booking.phoneNumber,
            bookingDate: booking.bookingDate
          },
          eventDates: event.eventDates,
          canCancel: booking.paymentStatus === 'confirmed' && 
                     new Date(event.eventDates.startDate) > new Date()
        });
      });
    });
    
    console.log(`✅ ${userBookings.length} réservations trouvées`);
    
    return res.json({
      success: true,
      data: userBookings,
      pagination: {
        currentPage: parseInt(page),
        totalItems: userBookings.length,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getUserBookings:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== ANNULER UNE RÉSERVATION =====
exports.cancelBooking = async (req, res) => {
  try {
    const { eventId, bookingId } = req.params;
    const { id: user_id } = req.user;
    
    console.log(`❌ Annulation réservation ${bookingId} pour événement ${eventId}`);
    
    const event = await EventDetails.findOne({ 
      _id: eventId, 
      isActive: true,
      'bookings._id': bookingId
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }
    
    const booking = event.bookings.find(b => b._id.toString() === bookingId);
    
    if (!booking || booking.userId.toString() !== user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé à cette réservation"
      });
    }
    
    if (booking.paymentStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: "Réservation déjà annulée"
      });
    }
    
    // Vérifier si l'annulation est possible (24h avant l'événement)
    const eventStart = new Date(event.eventDates.startDate);
    const now = new Date();
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60);
    
    if (hoursUntilEvent < 24) {
      return res.status(400).json({
        success: false,
        message: "Impossible d'annuler moins de 24h avant l'événement"
      });
    }
    
    // Annuler la réservation
    booking.paymentStatus = 'cancelled';
    event.bookingsCount = Math.max(0, event.bookingsCount - 1);
    
    // Remettre à jour la capacité
    if (event.capacity && event.capacity.total) {
      event.capacity.remaining = Math.min(
        event.capacity.total, 
        event.capacity.remaining + booking.numberOfPersons
      );
    }
    
    await event.save();
    
    console.log(`✅ Réservation ${booking.bookingReference} annulée`);
    
    return res.json({
      success: true,
      message: "Réservation annulée avec succès",
      data: {
        bookingReference: booking.bookingReference,
        refundAmount: booking.totalPrice * 0.8, // 80% de remboursement
        refundMethod: booking.paymentMethod
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur cancelBooking:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== ÉVÉNEMENTS PAR CATÉGORIE =====
// ===== CORRECTION DE getEventsByCategory =====
// ===== CORRECTION DE getEventsByCategory AVEC GESTION DES FAVORIS =====
// ===== CORRECTION DE getEventsByCategory AVEC GESTION DES FAVORIS =====
/*exports.getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const currentUserId = req.user?.id; // ✅ AJOUT : Récupérer l'utilisateur connecté
    const { 
      sortBy = 'averageRating',
      minRating = 0,
      maxPrice,
      minPrice,
      region,
      upcoming = true,
      limit = 20
    } = req.query;
    
    console.log(`📂 getEventsByCategory pour: ${category}`);
    console.log(`👤 Utilisateur connecté: ${currentUserId}`); // ✅ AJOUT : Debug utilisateur
    
    // REQUÊTE SIMPLIFIÉE
    const query = { 
      isActive: true,
      category: category
    };
    
    console.log('🔍 Requête catégorie:', query);
    
    const events = await EventDetails.find(query)
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(parseInt(limit))
      .lean();
    
    console.log(`📊 Événements trouvés pour ${category}: ${events.length}`);
    
    if (events.length === 0) {
      const totalInCategory = await EventDetails.countDocuments({ 
        isActive: true, 
        category: category 
      });
      console.log(`🔍 Debug ${category}: ${totalInCategory} événements actifs dans cette catégorie`);
    }
    
    // ✅ CORRECTION : Traitement avec vérification favoris utilisateur
    const processedEvents = events.map(event => {
      // ✅ AJOUT : Vérifier si l'utilisateur a mis cet événement en favoris
      const isFavorite = currentUserId && event.favoritedBy && Array.isArray(event.favoritedBy)
        ? event.favoritedBy.some(userId => userId.toString() === currentUserId.toString())
        : false;
      
      return {
        _id: event._id,
        title: event.title || 'Titre manquant',
        location: event.location || 'Lieu non spécifié',
        category: event.category || 'autre',
        date: event.date || 'Date non spécifiée',
        time: event.time || 'Heure non spécifiée',
        rating: event.averageRating || 0,
        review: event.review || '0 avis',
        totalReviews: event.totalReviews || 0,
        
        // Prix simplifié
        price: event.fixedPrice 
          ? `${event.fixedPrice.toLocaleString()} Fcfa`
          : event.price?.solo || `À partir de ${event.priceRange?.min || 0} Fcfa`,
        
        // Informations prix détaillées
        priceInfo: event.fixedPrice ? {
          type: 'fixed',
          value: event.fixedPrice,
          display: `${event.fixedPrice.toLocaleString()} Fcfa`
        } : {
          type: 'categories',
          solo: event.price?.solo,
          couple: event.price?.couple,
          group: event.price?.group,
          range: {
            min: event.priceRange?.min || 0,
            max: event.priceRange?.max || 0
          }
        },
        
        // Images
        hasImage: event.eventImage ? true : false,
        eventImage: event.eventImage || null,
        images: event.images || [],
        
        // Description tronquée
        description: event.description ? event.description.substring(0, 150) + '...' : 'Description non disponible',
        
        // Disponibilité
        availability: {
          isAvailable: event.isAvailable || false,
          capacity: event.capacity || null
        },
        
        // Informations organisateur
        organisateur: event.organisateur || 'Organisateur non spécifié',
        highlights: event.highlights || [],
        inclusions: event.inclusions || [],
        
        // Statistiques
        viewsCount: event.viewsCount || 0,
        favoritesCount: event.favoritesCount || 0,
        bookingsCount: event.bookingsCount || 0,
        
        // Dates et géolocalisation
        eventDates: event.eventDates || null,
        coordinates: event.coordinates || null,
        
        // ✅ CORRECTION : Favoris spécifique à l'utilisateur
        isFavorite: isFavorite, // ✅ MAINTENANT CORRECTEMENT DÉFINI
        createdAt: event.createdAt || new Date(),
        
        // Debug info
        debug: {
          hasFullDetails: event.hasFullDetails,
          isActive: event.isActive,
          isAvailable: event.isAvailable,
          userHasFavorited: isFavorite, // ✅ AJOUT : Debug pour voir si la logique fonctionne
          favoritedByCount: event.favoritedBy ? event.favoritedBy.length : 0
        }
      };
    });
    
    // ✅ AJOUT : Debug favoris
    const userFavoritesCount = processedEvents.filter(e => e.isFavorite).length;
    console.log(`❤️ ${userFavoritesCount} événements en favoris pour cet utilisateur dans ${category}`);
    
    return res.json({
      success: true,
      data: processedEvents,
      categoryInfo: {
        name: category,
        totalEvents: processedEvents.length,
        userFavorites: userFavoritesCount // ✅ AJOUT : Nombre de favoris utilisateur
      },
      debug: {
        currentUserId: currentUserId,
        userFavoritesCount: userFavoritesCount, // ✅ AJOUT : Debug favoris
        category: category
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getEventsByCategory:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};*/

/*exports.getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { 
      sortBy = 'averageRating',
      minRating = 0,
      maxPrice,
      minPrice,
      region,
      upcoming = true,
      limit = 20
    } = req.query;
    
    console.log(`📂 Récupération événements pour catégorie: ${category}`);
    
    const query = { 
      isActive: true,
      hasFullDetails: true,
      category: category
    };
    
    // Filtres additionnels
    if (region) {
      query.region_Name = { $regex: region, $options: 'i' };
    }
    
    if (minRating && parseFloat(minRating) > 0) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }
    
    if (minPrice || maxPrice) {
      const priceConditions = [];
      
      if (minPrice) {
        priceConditions.push({ 'priceRange.min': { $gte: parseFloat(minPrice) } });
      }
      
      if (maxPrice) {
        priceConditions.push({ 'priceRange.max': { $lte: parseFloat(maxPrice) } });
      }
      
      if (priceConditions.length > 0) {
        query.$and = priceConditions;
      }
    }
    
    if (upcoming === 'true') {
      query['eventDates.startDate'] = { $gt: new Date() };
      query.isAvailable = true;
    }
    
    const sortOptions = {
      'averageRating': { averageRating: -1, totalReviews: -1 },
      'price_asc': { 'priceRange.min': 1 },
      'price_desc': { 'priceRange.max': -1 },
      'date': { 'eventDates.startDate': 1 },
      'popular': { viewsCount: -1, favoritesCount: -1 },
      'newest': { createdAt: -1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.averageRating;
    
    const events = await EventDetails.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .lean();
    
    if (events.length === 0) {
      return res.json({
        success: true,
        data: [],
        categoryInfo: {
          name: category,
          displayName: getCategoryDisplayName(category)
        },
        message: `Aucun événement disponible dans la catégorie "${category}"`
      });
    }
    
    const processedEvents = events.map(event => ({
      _id: event._id,
      title: event.title || '',
      location: event.location || '',
      region: event.region_Name || '',
      category: event.category || '',
      date: event.date || '',
      time: event.time || '',
      rating: event.averageRating || 0,
      review: event.review || '0 avis',
      totalReviews: event.totalReviews || 0,
      
      priceInfo: event.fixedPrice ? {
        type: 'fixed',
        value: event.fixedPrice,
        display: `${event.fixedPrice.toLocaleString()} Fcfa`
      } : {
        type: 'categories',
        range: {
          min: event.priceRange?.min || 0,
          max: event.priceRange?.max || 0
        }
      },
      
      eventImage: event.eventImage || null,
      description: event.description ? event.description.substring(0, 150) + '...' : '',
      organisateur: event.organisateur || '',
      isAvailable: event.isAvailable || false,
      
      eventDates: event.eventDates || null,
      viewsCount: event.viewsCount || 0,
      favoritesCount: event.favoritesCount || 0,
      bookingsCount: event.bookingsCount || 0
    }));
    
    console.log(`✅ ${processedEvents.length} événements trouvés pour catégorie ${category}`);
    
    return res.json({
      success: true,
      data: processedEvents,
      categoryInfo: {
        name: category,
        displayName: getCategoryDisplayName(category),
        totalEvents: processedEvents.length
      },
      stats: {
        averageRating: processedEvents.length > 0 
          ? parseFloat((processedEvents.reduce((sum, event) => sum + event.rating, 0) / processedEvents.length).toFixed(1))
          : 0,
        availableCount: processedEvents.filter(e => e.isAvailable).length,
        upcomingCount: processedEvents.filter(e => new Date(e.eventDates?.startDate) > new Date()).length
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getEventsByCategory:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};*/

// ===== ÉVÉNEMENTS POPULAIRES/MIS EN AVANT =====
exports.getFeaturedEvents = async (req, res) => {
  try {
    const { limit = 10, region } = req.query;
    
    console.log('🌟 Récupération événements populaires');
    
    const query = {
      isActive: true,
      hasFullDetails: true,
      isAvailable: true,
      'eventDates.startDate': { $gt: new Date() }
    };
    
    if (region) {
      query.region_Name = { $regex: region, $options: 'i' };
    }
    
    const events = await EventDetails.find({
      ...query,
      $or: [
        { isFeatured: true },
        { averageRating: { $gte: 4.5 } },
        { viewsCount: { $gte: 500 } },
        { bookingsCount: { $gte: 10 } }
      ]
    })
    .sort({ isFeatured: -1, averageRating: -1, viewsCount: -1 })
    .limit(parseInt(limit))
    .lean();
    
    const processedEvents = events.map(event => ({
      _id: event._id,
      title: event.title || '',
      location: event.location || '',
      region: event.region_Name || '',
      category: event.category || '',
      date: event.date || '',
      rating: event.averageRating || 0,
      review: event.review || '0 avis',
      
      priceInfo: event.fixedPrice ? {
        type: 'fixed',
        value: event.fixedPrice,
        display: `${event.fixedPrice.toLocaleString()} Fcfa`
      } : {
        type: 'categories',
        range: {
          min: event.priceRange?.min || 0,
          max: event.priceRange?.max || 0
        }
      },
      
      eventImage: event.eventImage || null,
      description: event.description ? event.description.substring(0, 100) + '...' : '',
      organisateur: event.organisateur || '',
      
      isFeatured: event.isFeatured || false,
      popularityScore: (event.viewsCount || 0) + (event.favoritesCount || 0) * 2 + (event.bookingsCount || 0) * 5,
      
      eventDates: event.eventDates || null
    }));
    
    console.log(`✅ ${processedEvents.length} événements populaires récupérés`);
    
    return res.json({
      success: true,
      data: processedEvents,
      info: {
        totalFeatured: processedEvents.length,
        criteria: 'isFeatured, rating ≥ 4.5, views ≥ 500, ou bookings ≥ 10'
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getFeaturedEvents:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== CRÉER/MODIFIER DÉTAILS ÉVÉNEMENT (ADMIN) =====
exports.createOrUpdateEventDetails = async (req, res) => {
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

    console.log('🔍 === DEBUG REQUÊTE ÉVÉNEMENT ===');
    console.log('📋 req.body:', Object.keys(req.body || {}));
    console.log('📋 req.files:', req.files ? req.files.length : 0);

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Aucune donnée reçue"
      });
    }

    // Extraction des champs
    const eventId = req.body._id;
    const title = req.body.title;
    const description = req.body.description;
    const longDescription = req.body.longDescription;
    const location = req.body.location;
    const region_Name = req.body.region_Name;
    const category = req.body.category;
    const date = req.body.date;
    const time = req.body.time;
    const organisateur = req.body.organisateur;

    // Parse des objets JSON
    let coordinates, eventDates, price, priceRange, highlights, inclusions, exclusions, contact, capacity;
    let fixedPrice = req.body.fixedPrice ? parseFloat(req.body.fixedPrice) : null;

    try {
      coordinates = req.body.coordinates ? JSON.parse(req.body.coordinates) : {};
      eventDates = req.body.eventDates ? JSON.parse(req.body.eventDates) : {};
      price = req.body.price ? JSON.parse(req.body.price) : {};
      priceRange = req.body.priceRange ? JSON.parse(req.body.priceRange) : {};
      highlights = req.body.highlights ? JSON.parse(req.body.highlights) : [];
      inclusions = req.body.inclusions ? JSON.parse(req.body.inclusions) : [];
      exclusions = req.body.exclusions ? JSON.parse(req.body.exclusions) : [];
      contact = req.body.contact ? JSON.parse(req.body.contact) : {};
      capacity = req.body.capacity ? JSON.parse(req.body.capacity) : {};
      
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
    if (!category) missingFields.push('category');
    if (!date) missingFields.push('date');
    if (!time) missingFields.push('time');
    if (!organisateur) missingFields.push('organisateur');
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) missingFields.push('coordinates');
    if (!eventDates || !eventDates.startDate || !eventDates.endDate) missingFields.push('eventDates');
    
    // Validation des prix (soit fixedPrice soit price + priceRange)
    const hasFixedPrice = fixedPrice && fixedPrice > 0;
    const hasCategoryPrice = price && (price.solo || price.couple || price.group) && 
                            priceRange && priceRange.min && priceRange.max;
    
    if (!hasFixedPrice && !hasCategoryPrice) {
      missingFields.push('pricing (fixedPrice OU price + priceRange)');
    }

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
        message: "Accès refusé. Seuls les administrateurs et maintenanciers peuvent modifier les événements."
      });
    }

    // Logique création vs modification
    let eventDocumentId;
    let isNewEvent = false;
    let existingEvent = null;

    if (eventId && eventId !== 'null' && eventId !== '' && eventId !== 'undefined') {
      console.log('🔄 Mode modification - événement existant:', eventId);
      
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          message: "ID de l'événement invalide (doit être un ObjectId)"
        });
      }
      
      eventDocumentId = new mongoose.Types.ObjectId(eventId);
      
      existingEvent = await EventDetails.findOne({ _id: eventDocumentId, isActive: true });
      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: "Événement non trouvé"
        });
      }
      
      console.log(`✅ Événement existant trouvé: ${existingEvent.title} (ID: ${eventDocumentId})`);
      
    } else {
      console.log('➕ Mode création - nouvel événement');
      isNewEvent = true;
      eventDocumentId = new mongoose.Types.ObjectId();
      console.log('🆕 Nouvel ObjectId généré:', eventDocumentId);
    }

    // Administration info
    const adminInfo = {
      userId: req.user.id,
      role: userRole,
      username: req.user.username || `${userRole}_${req.user.id.slice(-6)}`
    };

    // Traitement des images
    let imageUrls = [];
    let eventImageUrl = '';
    
    if (req.files && req.files.length > 0) {
      console.log(`📷 Traitement de ${req.files.length} images...`);
      
      try {
        const imageDir = path.join(process.cwd(), 'assets', 'images', 'events', String(eventDocumentId));
        await fs.mkdir(imageDir, { recursive: true });

        for (let i = 0; i < req.files.length; i++) {
          const image = req.files[i];
          const filename = `${Date.now()}-${i}.webp`;
          const outputPath = path.join(imageDir, filename);

          await sharp(image.path)
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(outputPath);

          try {
            await fs.unlink(image.path);
          } catch (unlinkError) {
            console.warn(`Impossible de supprimer le fichier temporaire: ${image.path}`);
          }

          const imageUrl = `/assets/images/events/${eventDocumentId}/${filename}`;
          
          if (i === 0) {
            eventImageUrl = imageUrl;
          }
          
          imageUrls.push(imageUrl);
        }

        console.log(`🎉 ${imageUrls.length} images traitées avec succès`);
        
      } catch (imageError) {
        console.error("❌ Erreur lors du traitement des images:", imageError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors du traitement des images."
        });
      }
    }

    // Gestion des détails dans EventDetails
    let event;

    if (existingEvent) {
      console.log('🔄 Mise à jour de l\'événement existant');
      
      event = existingEvent;
      event.title = title;
      event.description = description;
      event.longDescription = longDescription;
      event.location = location;
      event.region_Name = region_Name;
      event.category = category;
      event.date = date;
      event.time = time;
      event.organisateur = organisateur;
      event.coordinates = coordinates;
      event.eventDates = {
        startDate: new Date(eventDates.startDate),
        endDate: new Date(eventDates.endDate)
      };
      
      // Gestion des prix
      if (hasFixedPrice) {
        event.fixedPrice = fixedPrice;
        event.price = undefined;
        event.priceRange = { min: fixedPrice, max: fixedPrice };
      } else {
        event.price = price;
        event.priceRange = priceRange;
        event.fixedPrice = undefined;
      }
      
      event.highlights = highlights;
      event.inclusions = inclusions;
      event.exclusions = exclusions;
      event.contact = contact;
      event.capacity = capacity;
      event.lastEditedBy = adminInfo;
      event.lastEditedBy.editedAt = new Date();
      
      // Ajouter nouvelles images
      if (imageUrls.length > 0) {
        event.images = [...(event.images || []), ...imageUrls];
      }
      if (eventImageUrl && !event.eventImage) {
        event.eventImage = eventImageUrl;
      }
      
      await event.save();
      console.log(`✅ Événement mis à jour: ${title}`);
      
    } else {
      console.log('➕ Création d\'un nouvel événement');
      
      const eventData = {
        _id: eventDocumentId,
        title,
        description,
        longDescription,
        location,
        region_Name,
        category,
        date,
        time,
        organisateur,
        coordinates,
        eventDates: {
          startDate: new Date(eventDates.startDate),
          endDate: new Date(eventDates.endDate)
        },
        highlights,
        inclusions,
        exclusions,
        contact,
        capacity,
        eventImage: eventImageUrl,
        images: imageUrls,
        hasFullDetails: true,
        createdBy: adminInfo,
        lastEditedBy: adminInfo
      };
      
      // Gestion des prix
      if (hasFixedPrice) {
        eventData.fixedPrice = fixedPrice;
        eventData.priceRange = { min: fixedPrice, max: fixedPrice };
      } else {
        eventData.price = price;
        eventData.priceRange = priceRange;
      }
      
      event = new EventDetails(eventData);
      await event.save();
      console.log(`✅ Nouvel événement créé: ${title}`);
    }

    // Fonction de calcul de complétion
    const completionStatus = calculateEventCompletionStatus(event);

    console.log('📊 === RÉSUMÉ FINAL ÉVÉNEMENT ===');
    console.log('- ID de l\'événement (ObjectId):', eventDocumentId);
    console.log('- Titre:', event.title);
    console.log('- Type d\'opération:', isNewEvent ? 'CRÉATION' : 'MISE À JOUR');
    console.log('- Catégorie:', event.category);
    console.log('- Région:', event.region_Name);
    console.log('- Date:', event.date);
    console.log('- Organisateur:', event.organisateur);
    console.log('- Mode prix:', hasFixedPrice ? `Fixe: ${fixedPrice} FCFA` : `Catégories: ${JSON.stringify(price)}`);
    console.log('- Images:', event.images?.length || 0);
    console.log('- Complétion:', `${completionStatus.percentage}% (${completionStatus.completed}/${completionStatus.total})`);

    return res.json({
      success: true,
      message: isNewEvent ? "Événement créé avec succès" : "Événement mis à jour avec succès",
      details: {
        ...event.toObject(),
        metadata: {
          isNewEvent,
          eventId: eventDocumentId,
          category: event.category,
          region: event.region_Name,
          totalImages: event.images?.length || 0,
          totalHighlights: event.highlights?.length || 0,
          totalInclusions: event.inclusions?.length || 0,
          pricingMode: hasFixedPrice ? 'fixed' : 'categories',
          lastUpdated: event.updatedAt,
          completionStatus: completionStatus
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur createOrUpdateEventDetails:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== LISTER ÉVÉNEMENTS POUR ADMIN =====
exports.getAdminEventsList = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      region_Name, 
      category,
      hasFullDetails,
      isAvailable,
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
    
    if (category) {
      query.category = category;
    }
    
    if (hasFullDetails !== undefined) {
      query.hasFullDetails = hasFullDetails === 'true';
    }
    
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }
    
    const sortOptions = {
      'updatedAt': { updatedAt: -1 },
      'createdAt': { createdAt: -1 },
      'title': { title: 1 },
      'date': { 'eventDates.startDate': 1 },
      'rating': { averageRating: -1 },
      'views': { viewsCount: -1 },
      'bookings': { bookingsCount: -1 },
      'price': { 'priceRange.min': 1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.updatedAt;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await EventDetails.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await EventDetails.countDocuments(query);
    
    const enrichedEvents = events.map(event => ({
      ...event,
      priceDisplay: event.fixedPrice 
        ? `${event.fixedPrice.toLocaleString()} FCFA (fixe)`
        : event.priceRange && event.priceRange.min && event.priceRange.max && event.priceRange.min !== event.priceRange.max 
          ? `${event.priceRange.min.toLocaleString()} - ${event.priceRange.max.toLocaleString()} FCFA`
          : `À partir de ${event.priceRange?.min || 0} FCFA`,
      completionStatus: calculateEventCompletionStatus(event),
      eventStatus: {
        isUpcoming: new Date(event.eventDates?.startDate) > new Date(),
        daysUntil: event.eventDates?.startDate ? Math.ceil((new Date(event.eventDates.startDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
        isAvailable: event.isAvailable
      },
      stats: {
        totalBookings: event.bookingsCount || 0,
        capacityUsed: event.capacity?.total ? 
          Math.round(((event.capacity.total - (event.capacity.remaining || 0)) / event.capacity.total) * 100) : null
      }
    }));

    console.log(`✅ Liste admin: ${enrichedEvents.length} événements trouvés`);

    return res.json({
      success: true,
      data: enrichedEvents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getAdminEventsList:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== STATISTIQUES DES ÉVÉNEMENTS =====
exports.getEventsStats = async (req, res) => {
  try {
    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }

    console.log('📊 Calcul des statistiques Événements...');

    const stats = await EventDetails.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          eventsWithFullDetails: {
            $sum: { $cond: [{ $eq: ['$hasFullDetails', true] }, 1, 0] }
          },
          availableEvents: {
            $sum: { $cond: [{ $eq: ['$isAvailable', true] }, 1, 0] }
          },
          upcomingEvents: {
            $sum: { $cond: [{ $gt: ['$eventDates.startDate', new Date()] }, 1, 0] }
          },
          totalViews: { $sum: '$viewsCount' },
          totalFavorites: { $sum: '$favoritesCount' },
          totalBookings: { $sum: '$bookingsCount' },
          totalReviews: { $sum: '$totalReviews' },
          averageRatingOverall: { $avg: '$averageRating' },
          averageMinPrice: { $avg: '$priceRange.min' },
          averageMaxPrice: { $avg: '$priceRange.max' },
          fixedPriceEvents: {
            $sum: { $cond: [{ $ne: ['$fixedPrice', null] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await EventDetails.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          categoryName: { $first: '$category' },
          count: { $sum: 1 },
          averageRating: { $avg: '$averageRating' },
          averageMinPrice: { $avg: '$priceRange.min' },
          averageMaxPrice: { $avg: '$priceRange.max' },
          totalViews: { $sum: '$viewsCount' },
          totalBookings: { $sum: '$bookingsCount' },
          totalReviews: { $sum: '$totalReviews' },
          availableCount: {
            $sum: { $cond: [{ $eq: ['$isAvailable', true] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const regionStats = await EventDetails.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$region_Name',
          regionName: { $first: '$region_Name' },
          count: { $sum: 1 },
          averageRating: { $avg: '$averageRating' },
          totalBookings: { $sum: '$bookingsCount' },
          totalViews: { $sum: '$viewsCount' },
          availableCount: {
            $sum: { $cond: [{ $eq: ['$isAvailable', true] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const overallStats = stats[0] || {
      totalEvents: 0,
      eventsWithFullDetails: 0,
      availableEvents: 0,
      upcomingEvents: 0,
      totalViews: 0,
      totalFavorites: 0,
      totalBookings: 0,
      totalReviews: 0,
      averageRatingOverall: 0,
      averageMinPrice: 0,
      averageMaxPrice: 0,
      fixedPriceEvents: 0
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

    console.log(`✅ Stats calculées: ${overallStats.totalEvents} événements, ${categoryStats.length} catégories, ${regionStats.length} régions`);

    return res.json({
      success: true,
      data: {
        overall: overallStats,
        byCategory: categoryStats,
        byRegion: regionStats,
        summary: {
          completionRate: overallStats.totalEvents > 0 
            ? Math.round((overallStats.eventsWithFullDetails / overallStats.totalEvents) * 100)
            : 0,
          availabilityRate: overallStats.totalEvents > 0
            ? Math.round((overallStats.availableEvents / overallStats.totalEvents) * 100)
            : 0,
          upcomingRate: overallStats.totalEvents > 0
            ? Math.round((overallStats.upcomingEvents / overallStats.totalEvents) * 100)
            : 0,
          averageViewsPerEvent: overallStats.totalEvents > 0 
            ? Math.round(overallStats.totalViews / overallStats.totalEvents)
            : 0,
          averageBookingsPerEvent: overallStats.totalEvents > 0
            ? Math.round(overallStats.totalBookings / overallStats.totalEvents)
            : 0,
          pricingModes: {
            fixed: overallStats.fixedPriceEvents,
            categories: overallStats.totalEvents - overallStats.fixedPriceEvents
          },
          priceRange: {
            averageMin: overallStats.averageMinPrice,
            averageMax: overallStats.averageMaxPrice
          }
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getEventsStats:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== SUPPRIMER ÉVÉNEMENT =====
exports.deleteEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }

    const event = await EventDetails.findOne({ _id: eventId, isActive: true });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }

    // Vérifier s'il y a des réservations confirmées
    const confirmedBookings = event.bookings.filter(booking => 
      booking.paymentStatus === 'confirmed'
    );

    if (confirmedBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer: ${confirmedBookings.length} réservation(s) confirmée(s)`,
        data: { confirmedBookingsCount: confirmedBookings.length }
      });
    }

    // Soft delete + mise à jour admin info
    event.isActive = false;
    event.lastEditedBy = {
      userId: req.user.id,
      role: req.user.role,
      username: req.user.username || `${req.user.role}_${req.user.id.slice(-6)}`,
      editedAt: new Date()
    };

    await event.save();

    console.log(`🗑️ Événement supprimé par ${req.user.role}: ${event.title} (ID: ${eventId})`);

    return res.json({
      success: true,
      message: "Événement supprimé avec succès",
      data: {
        eventId: eventId,
        title: event.title,
        deletedBy: req.user.role,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur deleteEventDetails:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RESTAURER ÉVÉNEMENT SUPPRIMÉ =====
exports.restoreEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!['superAdmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seuls les super administrateurs peuvent restaurer."
      });
    }

    const event = await EventDetails.findOne({ _id: eventId, isActive: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement supprimé non trouvé"
      });
    }

    event.isActive = true;
    event.lastEditedBy = {
      userId: req.user.id,
      role: req.user.role,
      username: req.user.username || `${req.user.role}_${req.user.id.slice(-6)}`,
      editedAt: new Date()
    };

    await event.save();

    console.log(`♻️ Événement restauré par ${req.user.role}: ${event.title} (ID: ${eventId})`);

    return res.json({
      success: true,
      message: "Événement restauré avec succès",
      data: {
        eventId: eventId,
        title: event.title,
        restoredBy: req.user.role,
        restoredAt: new Date()
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur restoreEventDetails:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== SYNCHRONISER DONNÉES ÉVÉNEMENTS =====
exports.syncEventData = async (req, res) => {
  try {
    if (!['superAdmin', 'maintenancier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }

    console.log('🔄 Début de la synchronisation des données événements...');

    const events = await EventDetails.find({ isActive: true }).lean();

    let updated = 0;
    let errors = 0;

    for (const event of events) {
      try {
        const eventDoc = await EventDetails.findById(event._id);
        
        if (!eventDoc) {
          errors++;
          continue;
        }
        
        let hasChanges = false;
        
        // Recalculer les statistiques des avis
        if (eventDoc.reviews && eventDoc.reviews.length > 0) {
          const oldAverage = eventDoc.averageRating;
          eventDoc.calculateAverageRating();
          
          if (Math.abs(oldAverage - eventDoc.averageRating) > 0.1) {
            hasChanges = true;
          }
        }
        
        // Vérifier la cohérence des compteurs
        const actualFavoritesCount = eventDoc.favoritedBy ? eventDoc.favoritedBy.length : 0;
        if (eventDoc.favoritesCount !== actualFavoritesCount) {
          eventDoc.favoritesCount = actualFavoritesCount;
          hasChanges = true;
        }

        const actualBookingsCount = eventDoc.bookings ? eventDoc.bookings.filter(b => b.paymentStatus === 'confirmed').length : 0;
        if (eventDoc.bookingsCount !== actualBookingsCount) {
          eventDoc.bookingsCount = actualBookingsCount;
          hasChanges = true;
        }
        
        // Vérifier la disponibilité automatique
        const shouldBeAvailable = eventDoc.checkAvailability();
        if (eventDoc.isAvailable !== shouldBeAvailable) {
          eventDoc.isAvailable = shouldBeAvailable;
          hasChanges = true;
        }
        
        // Vérifier la complétion des détails
        const completionStatus = calculateEventCompletionStatus(eventDoc);
        const shouldHaveFullDetails = completionStatus.percentage >= 80;
        
        if (eventDoc.hasFullDetails !== shouldHaveFullDetails) {
          eventDoc.hasFullDetails = shouldHaveFullDetails;
          hasChanges = true;
        }
        
        if (hasChanges) {
          await eventDoc.save();
          updated++;
          console.log(`✅ Synchronisé: ${event.title}`);
        }
        
      } catch (syncError) {
        console.error(`❌ Erreur sync événement ${event._id}:`, syncError.message);
        errors++;
      }
    }

    console.log(`🎉 Synchronisation terminée: ${updated} événements mis à jour, ${errors} erreurs`);

    return res.json({
      success: true,
      message: `Synchronisation terminée: ${updated} événements mis à jour${errors > 0 ? `, ${errors} erreurs` : ''}`,
      data: { 
        updated, 
        errors,
        totalProcessed: events.length
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur syncEventData:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== RÉCUPÉRER ÉVÉNEMENTS SUPPRIMÉS (ADMIN) =====
exports.getDeletedEvents = async (req, res) => {
  try {
    if (!['superAdmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé. Seuls les super administrateurs peuvent voir les événements supprimés."
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deletedEvents = await EventDetails.find({ isActive: false })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title location region_Name category date organisateur priceRange averageRating totalReviews bookingsCount lastEditedBy updatedAt')
      .lean();

    const total = await EventDetails.countDocuments({ isActive: false });

    const processedEvents = deletedEvents.map(event => ({
      ...event,
      priceDisplay: event.priceRange && event.priceRange.min && event.priceRange.max && event.priceRange.min !== event.priceRange.max 
        ? `${event.priceRange.min.toLocaleString()} - ${event.priceRange.max.toLocaleString()} FCFA`
        : `À partir de ${event.priceRange?.min || 0} FCFA`,
      deletedBy: event.lastEditedBy ? {
        username: event.lastEditedBy.username,
        role: event.lastEditedBy.role,
        deletedAt: event.lastEditedBy.editedAt
      } : null
    }));

    console.log(`✅ ${deletedEvents.length} événements supprimés récupérés`);

    return res.json({
      success: true,
      data: processedEvents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getDeletedEvents:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};

// ===== FONCTION HELPER COMPLÉTION ÉVÉNEMENT =====
function calculateEventCompletionStatus(eventDetails) {
  let completed = 0;
  let total = 10; // Total des critères

  // 1. Titre (10%)
  if ((eventDetails.title || '').trim().length >= 3) completed++;

  // 2. Description (10%)
  if ((eventDetails.description || '').trim().length >= 50) completed++;

  // 3. Localisation (10%)
  if ((eventDetails.location || '').trim().length >= 5) completed++;

  // 4. Région (10%)
  if ((eventDetails.region_Name || '').trim().length >= 3) completed++;

  // 5. Catégorie (10%)
  if (eventDetails.category && eventDetails.category !== 'autre') completed++;

  // 6. Coordonnées (10%)
  if (eventDetails.coordinates && 
      eventDetails.coordinates.latitude && 
      eventDetails.coordinates.longitude) completed++;

  // 7. Dates événement (10%)
  if (eventDetails.eventDates && 
      eventDetails.eventDates.startDate && 
      eventDetails.eventDates.endDate) completed++;

  // 8. Organisateur (10%)
  if ((eventDetails.organisateur || '').trim().length >= 3) completed++;

  // 9. Prix (10%)
  const hasPricing = eventDetails.fixedPrice || 
                    (eventDetails.price && (eventDetails.price.solo || eventDetails.price.couple || eventDetails.price.group));
  if (hasPricing) completed++;

  // 10. Images (10%)
  if (eventDetails.images && eventDetails.images.length > 0) completed++;

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
      hasTitle: (eventDetails.title || '').trim().length >= 3,
      hasDescription: (eventDetails.description || '').trim().length >= 50,
      hasLocation: (eventDetails.location || '').trim().length >= 5,
      hasRegion: (eventDetails.region_Name || '').trim().length >= 3,
      hasCategory: !!(eventDetails.category && eventDetails.category !== 'autre'),
      hasCoordinates: !!(eventDetails.coordinates?.latitude && eventDetails.coordinates?.longitude),
      hasEventDates: !!(eventDetails.eventDates?.startDate && eventDetails.eventDates?.endDate),
      hasOrganisateur: (eventDetails.organisateur || '').trim().length >= 3,
      hasPricing: !!(eventDetails.fixedPrice || (eventDetails.price && (eventDetails.price.solo || eventDetails.price.couple || eventDetails.price.group))),
      hasImages: !!(eventDetails.images?.length > 0)
    }
  };
}

// ===== FONCTION HELPER NOMS CATÉGORIES =====


// ===== NOUVELLE MÉTHODE: RÉCUPÉRER LES FAVORIS DE L'UTILISATEUR =====
exports.getUserFavoriteEvents = async (req, res) => {
  try {
    const { id: currentUserId } = req.user;
    const { 
      sortBy = 'dateAdded',
      category,
      region 
    } = req.query;
    
    console.log(`❤️ Récupération favoris utilisateur: ${currentUserId}`);
    
    // Construire la requête pour les événements favoris de l'utilisateur
    const query = {
      isActive: true,
      favoritedBy: currentUserId
    };
    
    // Filtres optionnels
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (region) {
      query.region_Name = { $regex: region, $options: 'i' };
    }
    
    // Options de tri
    const sortOptions = {
      'dateAdded': { updatedAt: -1 }, // Plus récemment mis en favoris
      'rating': { averageRating: -1 },
      'date': { 'eventDates.startDate': 1 },
      'title': { title: 1 },
      'price': { 'priceRange.min': 1 }
    };
    
    const sort = sortOptions[sortBy] || sortOptions.dateAdded;
    
    // SUPPRESSION DE LA PAGINATION - Récupération de TOUS les favoris
    const favoriteEvents = await EventDetails.find(query)
      .sort(sort)
      .lean(); // Pas de skip/limit pour récupérer tous les favoris
    
    const totalFavorites = favoriteEvents.length; // Pas besoin de countDocuments séparé
    
    // Traitement des événements favoris (tous sont favoris par définition)
    const processedFavorites = favoriteEvents.map(event => ({
      _id: event._id,
      title: event.title || '',
      location: event.location || '',
      region: event.region_Name || '',
      category: event.category || 'autre',
      date: event.date || '',
      time: event.time || '',
      rating: event.averageRating || 0,
      totalReviews: event.totalReviews || 0,
      
      priceInfo: event.fixedPrice ? {
        type: 'fixed',
        value: event.fixedPrice,
        display: `${event.fixedPrice.toLocaleString()} Fcfa`
      } : {
        type: 'categories',
        solo: event.price?.solo,
        couple: event.price?.couple,
        group: event.price?.group,
        range: {
          min: event.priceRange?.min || 0,
          max: event.priceRange?.max || 0
        }
      },
      
      eventImage: event.eventImage || null,
      description: event.description ? event.description.substring(0, 150) + '...' : '',
      organisateur: event.organisateur || '',
      
      availability: {
        isAvailable: event.isAvailable || false,
        capacity: event.capacity || null
      },
      
      eventDates: event.eventDates || null,
      viewsCount: event.viewsCount || 0,
      favoritesCount: event.favoritesCount || 0,
      bookingsCount: event.bookingsCount || 0,
      
      // Toujours true puisque c'est la liste des favoris
      isFavorite: true,
      
      // Date d'ajout aux favoris (approximative via updatedAt)
      favoriteAddedAt: event.updatedAt,
      
      // Statut de l'événement
      eventStatus: {
        isUpcoming: event.eventDates?.startDate ? new Date(event.eventDates.startDate) > new Date() : false,
        isPast: event.eventDates?.endDate ? new Date(event.eventDates.endDate) < new Date() : false
      }
    }));
    
    console.log(`✅ ${processedFavorites.length} événements favoris trouvés`);
    
    return res.json({
      success: true,
      data: processedFavorites,
      // SUPPRESSION de la pagination - remplacée par un simple total
      meta: {
        total: totalFavorites,
        count: processedFavorites.length,
        sortBy: sortBy,
        filters: {
          category: category || 'all',
          region: region || 'all'
        }
      },
      stats: {
        totalFavorites: totalFavorites,
        categoriesInFavorites: [...new Set(processedFavorites.map(e => e.category))],
        regionsInFavorites: [...new Set(processedFavorites.map(e => e.region))],
        upcomingFavorites: processedFavorites.filter(e => e.eventStatus.isUpcoming).length,
        availableFavorites: processedFavorites.filter(e => e.availability.isAvailable).length
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getUserFavoriteEvents:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite."
    });
  }
};
module.exports = {
  // Méthodes principales existantes
  getUserFavoriteEvents: exports.getUserFavoriteEvents,
  getAllEvents: exports.getAllEvents,
  getEventsByRegion: exports.getEventsByRegion,
  getEventsByCategory: exports.getEventsByCategory,
  getEventById: exports.getEventById,
  submitEventReview: exports.submitEventReview,
  toggleEventFavorite: exports.toggleEventFavorite,
  searchEvents: exports.searchEvents,
  bookEvent: exports.bookEvent,
  getUserBookings: exports.getUserBookings,
  cancelBooking: exports.cancelBooking,
  getFeaturedEvents: exports.getFeaturedEvents,
  
  // NOUVELLES MÉTHODES POUR LES RÉPONSES AUX AVIS
  addReviewReply: exports.addReviewReply,
  toggleReplyLike: exports.toggleReplyLike,
  
  // Méthodes admin
  createOrUpdateEventDetails: exports.createOrUpdateEventDetails,
  getAdminEventsList: exports.getAdminEventsList,
  getEventsStats: exports.getEventsStats,
  deleteEventDetails: exports.deleteEventDetails,
  restoreEventDetails: exports.restoreEventDetails,
  syncEventData: exports.syncEventData,
  getDeletedEvents: exports.getDeletedEvents,
  calculateEventCompletionStatus
};
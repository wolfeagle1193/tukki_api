// models/Room.js - MODÈLE ROOM COMPLET
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  // ===== INFORMATIONS DE BASE =====
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200,
    minlength: 5
  },
  
  type: {
    type: String,
    required: true,
    enum: [
      'Single Room',
      'Double Room', 
      'Twin Room',
      'Suite Junior',
      'Suite Executive',
      'Suite Présidentielle',
      'Chambre Familiale',
      'Chambre Deluxe',
      'Chambre Standard',
      'Studio',
      'Appartement'
    ]
  },
  
  description: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 50,
    maxlength: 1500
  },
  
  // ===== RÉFÉRENCE HÔTEL =====
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HotelDetails',
    required: true,
    index: true
  },
  
  // ===== CAPACITÉ ET DIMENSIONS =====
  capacity: {
    adults: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
      default: 2
    },
    children: {
      type: Number,
      default: 0,
      min: 0,
      max: 4
    },
    totalGuests: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    }
  },
  
  dimensions: {
    surface: {
      type: Number, // en m²
      required: true,
      min: 10,
      max: 200
    },
    unit: {
      type: String,
      default: 'm²',
      enum: ['m²', 'ft²']
    }
  },
  
  // ===== CONFIGURATION DES LITS =====
  bedConfiguration: [{
    type: {
      type: String,
      required: true,
      enum: [
        'Lit simple',
        'Lit double',
        'Lit king size',
        'Lit queen size',
        'Lits jumeaux',
        'Canapé-lit',
        'Lit superposé'
      ]
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },
    size: {
      type: String,
      enum: ['90x200', '140x200', '160x200', '180x200', '200x200', 'Variable']
    }
  }],
  
  // ===== TARIFICATION =====
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'FCFA',
      enum: ['FCFA', 'EUR', 'USD']
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },
    // Tarifs saisonniers optionnels
    seasonalPricing: [{
      season: {
        type: String,
        enum: ['Haute saison', 'Moyenne saison', 'Basse saison', 'Périodes spéciales']
      },
      startDate: Date,
      endDate: Date,
      price: {
        type: Number,
        min: 0
      },
      discount: {
        type: Number,
        min: 0,
        max: 100 // Pourcentage
      }
    }],
    // Suppléments
    extras: {
      extraPersonPrice: {
        type: Number,
        default: 0,
        min: 0
      },
      childPrice: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  
  // ===== DISPONIBILITÉ =====
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    availableFrom: {
      type: Date,
      required: true
    },
    availableTo: {
      type: Date,
      required: true
    },
    // Réservations (pour bloquer les dates)
    bookedDates: [{
      checkIn: {
        type: Date,
        required: true
      },
      checkOut: {
        type: Date,
        required: true
      },
      reservationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation'
      },
      guestName: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['confirmée', 'en attente', 'annulée'],
        default: 'confirmée'
      }
    }],
    maintenanceDates: [{
      startDate: Date,
      endDate: Date,
      reason: {
        type: String,
        maxlength: 200
      }
    }]
  },
  
  // ===== ÉQUIPEMENTS DE LA CHAMBRE =====
  roomEquipments: [{
    category: {
      type: String,
      required: true,
      enum: [
        'Technologie',
        'Confort',
        'Salle de bain',
        'Cuisine',
        'Mobilier',
        'Climatisation',
        'Sécurité',
        'Accessibilité'
      ]
    },
    items: [{
      name: {
        type: String,
        required: true
      },
      icon: {
        type: String, // Nom de l'icône MaterialIcons
        required: true
      },
      available: {
        type: Boolean,
        default: true
      },
      description: {
        type: String,
        maxlength: 100
      }
    }]
  }],
  
  // Équipements standards (pour compatibilité avec les composants existants)
  standardEquipments: {
    tv: { type: Boolean, default: false },
    wifi: { type: Boolean, default: true },
    airConditioning: { type: Boolean, default: false },
    minibar: { type: Boolean, default: false },
    safe: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    seaView: { type: Boolean, default: false },
    cityView: { type: Boolean, default: false },
    gardenView: { type: Boolean, default: false },
    coffeMachine: { type: Boolean, default: false },
    iron: { type: Boolean, default: false },
    hairDryer: { type: Boolean, default: false },
    bathtub: { type: Boolean, default: false },
    shower: { type: Boolean, default: true },
    workDesk: { type: Boolean, default: false },
    telephone: { type: Boolean, default: false }
  },
  
  // ===== IMAGES =====
  images: {
    mainImage: {
      type: String,
      required: true,
      match: /\.(jpg|jpeg|png|webp)$/i
    },
    gallery: [{
      type: String,
      match: /\.(jpg|jpeg|png|webp)$/i
    }],
    // Images par catégorie
    categorizedImages: {
      bedroom: [String],
      bathroom: [String], 
      view: [String],
      amenities: [String]
    }
  },
  
  // ===== AVIS ET ÉVALUATIONS =====
  reviews: [{
    id: {
      type: String,
      required: true
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation'
    },
    user: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      username: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 50
      },
      profile: {
        type: String,
        match: /\.(jpg|jpeg|png|webp)$/i
      }
    },
    ratings: {
      overall: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 5
      },
      comfort: {
        type: Number,
        min: 1,
        max: 5
      },
      location: {
        type: Number,
        min: 1,
        max: 5
      },
      service: {
        type: Number,
        min: 1,
        max: 5
      },
      valueForMoney: {
        type: Number,
        min: 1,
        max: 5
      }
    },
    review: { 
      type: String, 
      required: true,
      maxlength: 1000
    },
    stayDuration: {
      type: Number, // Nombre de nuits
      min: 1
    },
    travelType: {
      type: String,
      enum: ['Business', 'Leisure', 'Family', 'Couple', 'Solo', 'Group']
    },
    helpful: { 
      type: Number, 
      default: 0,
      min: 0
    },
    helpfulBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: {
      type: String, // Format: "DD-MM-YYYY" pour l'affichage
      required: true
    }
  }],
  
  // ===== STATISTIQUES =====
  stats: {
    totalReviews: { 
      type: Number, 
      default: 0,
      min: 0
    },
    averageRating: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 5
    },
    detailedRatings: {
      cleanliness: { type: Number, default: 0, min: 0, max: 5 },
      comfort: { type: Number, default: 0, min: 0, max: 5 },
      location: { type: Number, default: 0, min: 0, max: 5 },
      service: { type: Number, default: 0, min: 0, max: 5 },
      valueForMoney: { type: Number, default: 0, min: 0, max: 5 }
    },
    viewsCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    bookingsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    favoritesCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    occupancyRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100 // Pourcentage
    }
  },
  
  // Utilisateurs qui ont mis en favoris
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // ===== POLITIQUES DE LA CHAMBRE =====
  policies: {
    checkIn: {
      from: {
        type: String,
        default: '14:00',
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      to: {
        type: String,
        default: '22:00',
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    checkOut: {
      until: {
        type: String,
        default: '12:00',
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    },
    cancellation: {
      policy: {
        type: String,
        enum: ['Flexible', 'Modérée', 'Stricte', 'Super stricte'],
        default: 'Modérée'
      },
      freeUntil: {
        type: Number, // Heures avant l'arrivée
        default: 24
      },
      penaltyPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    smoking: {
      type: String,
      enum: ['Interdit', 'Autorisé', 'Balcon uniquement'],
      default: 'Interdit'
    },
    pets: {
      allowed: {
        type: Boolean,
        default: false
      },
      fee: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    children: {
      ageLimit: {
        type: Number,
        default: 12
      },
      freeUnder: {
        type: Number,
        default: 2
      }
    }
  },
  
  // ===== SERVICES INCLUS =====
  includedServices: [{
    name: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    description: {
      type: String,
      maxlength: 200
    },
    available: {
      type: Boolean,
      default: true
    },
    scheduleRestriction: {
      from: String, // Format HH:MM
      to: String    // Format HH:MM
    }
  }],
  
  // ===== SERVICES PAYANTS =====
  paidServices: [{
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['Par personne', 'Par séjour', 'Par nuit', 'Par utilisation'],
      default: 'Par utilisation'
    },
    available: {
      type: Boolean,
      default: true
    }
  }],
  
  // ===== ACCESSIBILITÉ =====
  accessibility: {
    wheelchairAccessible: {
      type: Boolean,
      default: false
    },
    features: [{
      type: String,
      enum: [
        'Douche accessible',
        'Barres d\'appui',
        'Porte élargie', 
        'Lit réglable',
        'Alarme visuelle',
        'Téléphone amplifié',
        'Accès niveau plain-pied'
      ]
    }]
  },
  
  // ===== MÉTADONNÉES =====
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'renovation'],
    default: 'active'
  },
  
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10 // Pour l'ordre d'affichage
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  // ===== DONNÉES D'ADMINISTRATION =====
  createdBy: {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    role: { 
      type: String, 
      enum: ['superAdmin', 'maintenancier', 'hotelManager'],
      required: true
    },
    username: { 
      type: String, 
      required: true
    }
  },
  
  lastEditedBy: {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User'
    },
    role: { 
      type: String, 
      enum: ['superAdmin', 'maintenancier', 'hotelManager']
    },
    username: { type: String },
    editedAt: { type: Date, default: Date.now }
  },
  
  // Version pour le contrôle de concurrence
  version: {
    type: Number,
    default: 1
  },
  
  // Dates
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt' 
  }
});

// ===== INDEX POUR PERFORMANCE =====
roomSchema.index({ hotelId: 1, status: 1 }); // Recherche par hôtel
roomSchema.index({ type: 1, status: 1 }); // Filtrage par type
roomSchema.index({ 'capacity.totalGuests': 1, status: 1 }); // Filtrage par capacité
roomSchema.index({ 'pricing.pricePerNight': 1, status: 1 }); // Tri par prix
roomSchema.index({ 'stats.averageRating': -1, 'stats.totalReviews': -1 }); // Tri par popularité
roomSchema.index({ 'availability.isAvailable': 1, status: 1 }); // Filtrage disponibilité
roomSchema.index({ featured: 1, priority: -1 }); // Chambres mises en avant
roomSchema.index({ createdAt: -1 }); // Tri par date
roomSchema.index({ 
  title: 'text', 
  description: 'text', 
  type: 'text'
}); // Index de recherche textuelle

// Index composé pour les requêtes complexes
roomSchema.index({ 
  hotelId: 1, 
  'availability.isAvailable': 1, 
  'pricing.pricePerNight': 1 
});

// ===== MÉTHODES STATIQUES =====

// Trouver les chambres d'un hôtel
roomSchema.statics.findByHotel = function(hotelId, options = {}) {
  const query = { 
    hotelId: hotelId,
    status: options.includeInactive ? { $in: ['active', 'inactive'] } : 'active'
  };
  
  if (options.available) {
    query['availability.isAvailable'] = true;
  }
  
  if (options.capacity) {
    query['capacity.totalGuests'] = { $gte: options.capacity };
  }
  
  if (options.priceRange) {
    if (options.priceRange.min) {
      query['pricing.pricePerNight'] = { $gte: options.priceRange.min };
    }
    if (options.priceRange.max) {
      query['pricing.pricePerNight'] = { ...query['pricing.pricePerNight'], $lte: options.priceRange.max };
    }
  }
  
  let sort = {};
  if (options.sortBy === 'price_asc') {
    sort = { 'pricing.pricePerNight': 1 };
  } else if (options.sortBy === 'price_desc') {
    sort = { 'pricing.pricePerNight': -1 };
  } else if (options.sortBy === 'rating') {
    sort = { 'stats.averageRating': -1, 'stats.totalReviews': -1 };
  } else if (options.sortBy === 'capacity') {
    sort = { 'capacity.totalGuests': -1 };
  } else {
    sort = { priority: -1, featured: -1, 'stats.averageRating': -1 };
  }
  
  return this.find(query)
    .sort(sort)
    .limit(options.limit || 50);
};

// Recherche de chambres disponibles pour des dates spécifiques
roomSchema.statics.findAvailable = function(hotelId, checkIn, checkOut, guestCount = 1) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  return this.find({
    hotelId: hotelId,
    status: 'active',
    'availability.isAvailable': true,
    'availability.availableFrom': { $lte: checkInDate },
    'availability.availableTo': { $gte: checkOutDate },
    'capacity.totalGuests': { $gte: guestCount },
    'availability.bookedDates': {
      $not: {
        $elemMatch: {
          status: { $in: ['confirmée', 'en attente'] },
          $or: [
            {
              checkIn: { $lt: checkOutDate },
              checkOut: { $gt: checkInDate }
            }
          ]
        }
      }
    }
  }).sort({ 'pricing.pricePerNight': 1, priority: -1 });
};

// Recherche par type de chambre
roomSchema.statics.findByType = function(type, hotelId = null) {
  const query = { 
    type: type,
    status: 'active'
  };
  
  if (hotelId) {
    query.hotelId = hotelId;
  }
  
  return this.find(query)
    .sort({ 'stats.averageRating': -1, 'pricing.pricePerNight': 1 });
};

// Recherche globale de chambres
roomSchema.statics.searchRooms = function(searchTerm, options = {}) {
  const query = {
    status: 'active',
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { type: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (options.hotelId) {
    query.hotelId = options.hotelId;
  }
  
  if (options.priceRange) {
    if (options.priceRange.min) {
      query['pricing.pricePerNight'] = { $gte: options.priceRange.min };
    }
    if (options.priceRange.max) {
      query['pricing.pricePerNight'] = { ...query['pricing.pricePerNight'], $lte: options.priceRange.max };
    }
  }
  
  if (options.capacity) {
    query['capacity.totalGuests'] = { $gte: options.capacity };
  }
  
  return this.find(query)
    .sort({ 'stats.averageRating': -1, 'stats.totalReviews': -1 })
    .limit(options.limit || 20);
};

// Chambres recommandées
roomSchema.statics.getFeaturedRooms = function(hotelId = null, limit = 10) {
  const query = { 
    status: 'active',
    $or: [
      { featured: true },
      { 'stats.averageRating': { $gte: 4.0 } }
    ]
  };
  
  if (hotelId) {
    query.hotelId = hotelId;
  }
  
  return this.find(query)
    .sort({ 
      featured: -1, 
      priority: -1, 
      'stats.averageRating': -1, 
      'stats.totalReviews': -1 
    })
    .limit(limit);
};

// ===== MÉTHODES D'INSTANCE =====

// Calculer la note moyenne
roomSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.stats.averageRating = 0;
    this.stats.totalReviews = 0;
    
    // Réinitialiser les notes détaillées
    this.stats.detailedRatings = {
      cleanliness: 0,
      comfort: 0,
      location: 0,
      service: 0,
      valueForMoney: 0
    };
    return 0;
  }
  
  const validReviews = this.reviews.filter(review => review.ratings && review.ratings.overall);
  
  if (validReviews.length === 0) {
    this.stats.averageRating = 0;
    this.stats.totalReviews = this.reviews.length;
    return 0;
  }
  
  // Calculer la moyenne générale
  const overallSum = validReviews.reduce((acc, review) => acc + review.ratings.overall, 0);
  this.stats.averageRating = Math.round((overallSum / validReviews.length) * 10) / 10;
  this.stats.totalReviews = this.reviews.length;
  
  // Calculer les moyennes détaillées
  const categories = ['cleanliness', 'comfort', 'location', 'service', 'valueForMoney'];
  
  categories.forEach(category => {
    const categoryReviews = validReviews.filter(review => 
      review.ratings[category] !== undefined && review.ratings[category] !== null
    );
    
    if (categoryReviews.length > 0) {
      const categorySum = categoryReviews.reduce((acc, review) => acc + review.ratings[category], 0);
      this.stats.detailedRatings[category] = Math.round((categorySum / categoryReviews.length) * 10) / 10;
    } else {
      this.stats.detailedRatings[category] = 0;
    }
  });
  
  return this.stats.averageRating;
};

// Ajouter un avis
roomSchema.methods.addReview = function(userId, userInfo, ratings, reviewText, reservationId = null, additionalInfo = {}) {
  // Vérifier si l'utilisateur a déjà donné un avis
  const existingReview = this.reviews.find(
    review => review.userId.toString() === userId.toString()
  );
  
  if (existingReview) {
    throw new Error('Vous avez déjà donné un avis pour cette chambre');
  }
  
  // Validation des notes
  if (!ratings.overall || ratings.overall < 1 || ratings.overall > 5) {
    throw new Error('La note générale doit être comprise entre 1 et 5');
  }
  
  const reviewId = new mongoose.Types.ObjectId().toString();
  const now = new Date();
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
  
  const newReview = {
    id: reviewId,
    userId,
    reservationId,
    user: {
      id: userId,
      username: userInfo.username,
      profile: userInfo.profile || ''
    },
    ratings: {
      overall: ratings.overall,
      cleanliness: ratings.cleanliness || ratings.overall,
      comfort: ratings.comfort || ratings.overall,
      location: ratings.location || ratings.overall,
      service: ratings.service || ratings.overall,
      valueForMoney: ratings.valueForMoney || ratings.overall
    },
    review: reviewText,
    stayDuration: additionalInfo.stayDuration || 1,
    travelType: additionalInfo.travelType || 'Leisure',
    helpful: 0,
    helpfulBy: [],
    createdAt: now,
    updatedAt: formattedDate
  };
  
  this.reviews.push(newReview);
  this.calculateAverageRating();
  this.markModified('reviews');
  
  return this.save();
};

// Incrémenter les vues
roomSchema.methods.incrementViews = function() {
  this.stats.viewsCount += 1;
  return this.save();
};

// Ajouter/Retirer des favoris
roomSchema.methods.toggleFavorite = function(userId) {
  const index = this.favoritedBy.indexOf(userId);
  
  if (index === -1) {
    // Ajouter aux favoris
    this.favoritedBy.push(userId);
    this.stats.favoritesCount += 1;
    return { action: 'added', isFavorite: true };
  } else {
    // Retirer des favoris
    this.favoritedBy.splice(index, 1);
    this.stats.favoritesCount = Math.max(0, this.stats.favoritesCount - 1);
    return { action: 'removed', isFavorite: false };
  }
};

// Vérifier la disponibilité pour des dates spécifiques
roomSchema.methods.isAvailableForDates = function(checkIn, checkOut) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  // Vérifier la disponibilité générale
  if (!this.availability.isAvailable || 
      checkInDate < this.availability.availableFrom || 
      checkOutDate > this.availability.availableTo) {
    return false;
  }
  
  // Vérifier les conflits avec les réservations existantes
  const hasConflict = this.availability.bookedDates.some(booking => {
    if (booking.status === 'annulée') return false;
    
    return (checkInDate < booking.checkOut && checkOutDate > booking.checkIn);
  });
  
  return !hasConflict;
};

// Ajouter une réservation
roomSchema.methods.addBooking = function(checkIn, checkOut, reservationId, guestName) {
  if (!this.isAvailableForDates(checkIn, checkOut)) {
    throw new Error('La chambre n\'est pas disponible pour ces dates');
  }
  
  this.availability.bookedDates.push({
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    reservationId,
    guestName,
    status: 'confirmée'
  });
  
  this.stats.bookingsCount += 1;
  this.markModified('availability.bookedDates');
  
  return this.save();
};

// Annuler une réservation
roomSchema.methods.cancelBooking = function(reservationId) {
  const bookingIndex = this.availability.bookedDates.findIndex(
    booking => booking.reservationId.toString() === reservationId.toString()
  );
  
  if (bookingIndex === -1) {
    throw new Error('Réservation non trouvée');
  }
  
  this.availability.bookedDates[bookingIndex].status = 'annulée';
  this.markModified('availability.bookedDates');
  
  return this.save();
};

// Calculer le taux d'occupation
roomSchema.methods.calculateOccupancyRate = function(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  if (totalDays <= 0) return 0;
  
  let bookedDays = 0;
  
  this.availability.bookedDates.forEach(booking => {
    if (booking.status === 'confirmée') {
      const bookingStart = Math.max(start, booking.checkIn);
      const bookingEnd = Math.min(end, booking.checkOut);
      
      if (bookingStart < bookingEnd) {
        bookedDays += Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24));
      }
    }
  });
  
  const occupancyRate = Math.round((bookedDays / totalDays) * 100);
  this.stats.occupancyRate = occupancyRate;
  
  return occupancyRate;
};

// Obtenir le prix pour des dates spécifiques (avec tarifs saisonniers)
roomSchema.methods.getPriceForDates = function(checkIn, checkOut, guestCount = null) {
  let basePrice = this.pricing.pricePerNight;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  
  // Vérifier les tarifs saisonniers
  const applicableSeasonal = this.pricing.seasonalPricing.find(seasonal => {
    return checkInDate >= seasonal.startDate && checkOutDate <= seasonal.endDate;
  });
  
  if (applicableSeasonal) {
    if (applicableSeasonal.price) {
      basePrice = applicableSeasonal.price;
    } else if (applicableSeasonal.discount) {
      basePrice = basePrice * (1 - applicableSeasonal.discount / 100);
    }
  }
  
  let totalPrice = basePrice * nights;
  
  // Ajouter les suppléments pour personnes supplémentaires
  if (guestCount && guestCount > this.capacity.adults) {
    const extraGuests = guestCount - this.capacity.adults;
    totalPrice += (extraGuests * this.pricing.extras.extraPersonPrice * nights);
  }
  
  return {
    basePrice: basePrice,
    nights: nights,
    subtotal: basePrice * nights,
    extraGuestsFee: guestCount && guestCount > this.capacity.adults ? 
      (guestCount - this.capacity.adults) * this.pricing.extras.extraPersonPrice * nights : 0,
    totalPrice: totalPrice,
    pricePerNight: basePrice,
    currency: this.pricing.currency
  };
};

// Obtenir les équipements formatés pour l'affichage
roomSchema.methods.getFormattedEquipments = function() {
  const formatted = [];
  
  // Équipements par catégorie
  this.roomEquipments.forEach(category => {
    category.items.forEach(item => {
      if (item.available) {
        formatted.push({
          icon: item.icon,
          label: item.name,
          category: category.category,
          description: item.description
        });
      }
    });
  });
  
  // Équipements standards (pour compatibilité)
  Object.entries(this.standardEquipments.toObject()).forEach(([key, value]) => {
    if (value === true) {
      const equipmentMap = {
        tv: { icon: 'tv', label: 'TV LCD' },
        wifi: { icon: 'wifi', label: 'Wi-Fi gratuit' },
        airConditioning: { icon: 'ac-unit', label: 'Climatisation' },
        minibar: { icon: 'local-bar', label: 'Minibar' },
        safe: { icon: 'lock', label: 'Coffre-fort' },
        balcony: { icon: 'balcony', label: 'Balcon' },
        seaView: { icon: 'waves', label: 'Vue sur mer' },
        cityView: { icon: 'location-city', label: 'Vue sur ville' },
        gardenView: { icon: 'local-florist', label: 'Vue sur jardin' },
        coffeMachine: { icon: 'coffee', label: 'Machine à café' },
        iron: { icon: 'iron', label: 'Fer à repasser' },
        hairDryer: { icon: 'toys', label: 'Sèche-cheveux' },
        bathtub: { icon: 'bathtub', label: 'Baignoire' },
        shower: { icon: 'shower', label: 'Douche' },
        workDesk: { icon: 'desk', label: 'Bureau de travail' },
        telephone: { icon: 'phone', label: 'Téléphone' }
      };
      
      if (equipmentMap[key]) {
        formatted.push({
          ...equipmentMap[key],
          category: 'Standard'
        });
      }
    }
  });
  
  return formatted;
};

// Obtenir la configuration des lits formatée
roomSchema.methods.getFormattedBedConfiguration = function() {
  return this.bedConfiguration.map(bed => ({
    type: bed.type,
    quantity: bed.quantity,
    size: bed.size,
    description: `${bed.quantity} ${bed.type}${bed.quantity > 1 ? 's' : ''}${bed.size ? ` (${bed.size})` : ''}`
  }));
};

// Vérifier si la chambre correspond aux critères de recherche
roomSchema.methods.matchesSearchCriteria = function(criteria) {
  // Vérifier la capacité
  if (criteria.guestCount && this.capacity.totalGuests < criteria.guestCount) {
    return false;
  }
  
  // Vérifier le budget
  if (criteria.maxPrice && this.pricing.pricePerNight > criteria.maxPrice) {
    return false;
  }
  
  if (criteria.minPrice && this.pricing.pricePerNight < criteria.minPrice) {
    return false;
  }
  
  // Vérifier les équipements requis
  if (criteria.requiredEquipments && criteria.requiredEquipments.length > 0) {
    const availableEquipments = this.getFormattedEquipments().map(eq => eq.label.toLowerCase());
    const hasAllRequired = criteria.requiredEquipments.every(required => 
      availableEquipments.some(available => available.includes(required.toLowerCase()))
    );
    
    if (!hasAllRequired) {
      return false;
    }
  }
  
  // Vérifier la disponibilité si dates fournies
  if (criteria.checkIn && criteria.checkOut) {
    if (!this.isAvailableForDates(criteria.checkIn, criteria.checkOut)) {
      return false;
    }
  }
  
  return true;
};

// Obtenir les dates indisponibles pour le calendrier
roomSchema.methods.getUnavailableDates = function(startMonth, endMonth) {
  const unavailableDates = [];
  
  // Ajouter les dates de réservation confirmées
  this.availability.bookedDates.forEach(booking => {
    if (booking.status === 'confirmée') {
      const current = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      
      while (current < end) {
        unavailableDates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    }
  });
  
  // Ajouter les dates de maintenance
  this.availability.maintenanceDates.forEach(maintenance => {
    const current = new Date(maintenance.startDate);
    const end = new Date(maintenance.endDate);
    
    while (current <= end) {
      unavailableDates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  });
  
  return [...new Set(unavailableDates)].sort();
};

// ===== MIDDLEWARE PRE-SAVE =====
roomSchema.pre('save', function(next) {
  // Mettre à jour la version
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  // Recalculer la capacité totale
  if (this.isModified('capacity')) {
    this.capacity.totalGuests = this.capacity.adults + this.capacity.children;
  }
  
  // Recalculer la note moyenne si les avis ont changé
  if (this.isModified('reviews')) {
    this.calculateAverageRating();
  }
  
  // Valider les dates de disponibilité
  if (this.availability && this.availability.availableFrom && this.availability.availableTo) {
    if (this.availability.availableFrom >= this.availability.availableTo) {
      throw new Error('La date de fin de disponibilité doit être postérieure à la date de début');
    }
  }
  
  // Valider la cohérence des prix
  if (this.pricing && this.pricing.basePrice && this.pricing.pricePerNight) {
    if (this.pricing.basePrice > this.pricing.pricePerNight * 1.5) {
      console.warn(`Prix de base élevé pour la chambre ${this.title}`);
    }
  }
  
  // Valider la capacité vs configuration des lits
  if (this.bedConfiguration && this.bedConfiguration.length > 0) {
    const estimatedCapacity = this.bedConfiguration.reduce((total, bed) => {
      const bedCapacity = bed.type.includes('double') || bed.type.includes('king') || bed.type.includes('queen') ? 2 : 1;
      return total + (bed.quantity * bedCapacity);
    }, 0);
    
    if (estimatedCapacity < this.capacity.adults) {
      console.warn(`Capacité des lits insuffisante pour la chambre ${this.title}`);
    }
  }
  
  // S'assurer qu'il y a au moins une image
  if (!this.images.mainImage && this.images.gallery.length === 0) {
    throw new Error('Au moins une image est requise pour la chambre');
  }
  
  // Définir l'image principale si elle n'existe pas
  if (!this.images.mainImage && this.images.gallery.length > 0) {
    this.images.mainImage = this.images.gallery[0];
  }
  
  next();
});

// ===== MIDDLEWARE PRE-FIND =====
roomSchema.pre(/^find/, function(next) {
  // Exclure les chambres inactives par défaut
  if (!this.getQuery().status) {
    this.find({ status: { $in: ['active', 'maintenance'] } });
  }
  next();
});

// ===== MIDDLEWARE POST-SAVE =====
roomSchema.post('save', function(doc) {
  console.log(`Chambre sauvegardée: ${doc.title} (${doc.type}) - v${doc.version}`);
});

// ===== VIRTUAL POUR LE PRIX FORMATÉ =====
roomSchema.virtual('formattedPrice').get(function() {
  return `${this.pricing.pricePerNight.toLocaleString()} ${this.pricing.currency}`;
});

// ===== VIRTUAL POUR LA CAPACITÉ FORMATÉE =====
roomSchema.virtual('formattedCapacity').get(function() {
  let capacity = `${this.capacity.adults} adulte${this.capacity.adults > 1 ? 's' : ''}`;
  if (this.capacity.children > 0) {
    capacity += `, ${this.capacity.children} enfant${this.capacity.children > 1 ? 's' : ''}`;
  }
  return capacity;
});

// ===== VIRTUAL POUR LA SURFACE FORMATÉE =====
roomSchema.virtual('formattedSurface').get(function() {
  return `${this.dimensions.surface}${this.dimensions.unit}`;
});

// ===== VIRTUAL POUR LE STATUT DE DISPONIBILITÉ =====
roomSchema.virtual('isCurrentlyAvailable').get(function() {
  if (!this.availability.isAvailable || this.status !== 'active') {
    return false;
  }
  
  const now = new Date();
  return this.availability.availableFrom <= now && this.availability.availableTo >= now;
});

// ===== VIRTUAL POUR LE NOMBRE D'AVIS =====
roomSchema.virtual('reviewCount').get(function() {
  return this.reviews ? this.reviews.length : 0;
});

// ===== VIRTUAL POUR LA NOTE FORMATÉE =====
roomSchema.virtual('formattedRating').get(function() {
  if (this.stats.averageRating === 0) {
    return 'Pas encore d\'avis';
  }
  return `${this.stats.averageRating}/5 (${this.stats.totalReviews} avis)`;
});

// Inclure les virtuals dans JSON
roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

// ===== MÉTHODES DE VALIDATION PERSONNALISÉES =====

// Validation de la capacité
roomSchema.path('capacity.totalGuests').validate(function(value) {
  return value === (this.capacity.adults + this.capacity.children);
}, 'La capacité totale doit correspondre à la somme des adultes et enfants');

// Validation des prix saisonniers
roomSchema.path('pricing.seasonalPricing').validate(function(seasonalPricing) {
  for (let i = 0; i < seasonalPricing.length; i++) {
    const season = seasonalPricing[i];
    if (season.startDate >= season.endDate) {
      return false;
    }
    
    // Vérifier les chevauchements
    for (let j = i + 1; j < seasonalPricing.length; j++) {
      const otherSeason = seasonalPricing[j];
      if (season.startDate < otherSeason.endDate && season.endDate > otherSeason.startDate) {
        return false;
      }
    }
  }
  return true;
}, 'Les périodes saisonnières ne doivent pas se chevaucher');

// Validation des heures
roomSchema.path('policies.checkIn.from').validate(function(time) {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}, 'Format d\'heure invalide (HH:MM)');

roomSchema.path('policies.checkIn.to').validate(function(time) {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}, 'Format d\'heure invalide (HH:MM)');

roomSchema.path('policies.checkOut.until').validate(function(time) {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}, 'Format d\'heure invalide (HH:MM)');

module.exports = mongoose.model('Room', roomSchema);
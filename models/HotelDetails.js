// models/Hotel.js - MODÈLE COMPLET
const mongoose = require('mongoose');

const hotelDetailSchema = new mongoose.Schema({
  // ===== INFORMATIONS DE BASE =====
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  
  location: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 150
  },
  
  region_Name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  
  description: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 50,
    maxlength: 2000
  },
  
  // ===== COORDONNÉES ET GÉOLOCALISATION =====
  coordinates: {
    latitude: { 
      type: Number, 
      required: true,
      min: -90,
      max: 90
    },
    longitude: { 
      type: Number, 
      required: true,
      min: -180,
      max: 180
    }
  },
  

  
  // ===== TARIFICATION AVEC STRUCTURE IMBRIQUÉE =====
  price: {
    minPrice: {
      type: Number,
      required: true,
      min: 0
    },
    maxPrice: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // ===== DISPONIBILITÉ =====
  availability: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  
  // ===== IMAGES =====
  placeImage: {
    type: String,
    required: true,
    match: /\.(jpg|jpeg|png|webp)$/i
  },
  
  // Galerie d'images supplémentaires
  gallery: [{
    type: String,
    match: /\.(jpg|jpeg|png|webp)$/i
  }],
  
  // ===== ÉVALUATIONS =====
  rating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  
  review: {
    type: String,
    default: "0 avis"
  },
  
  // ===== ÉQUIPEMENTS ET SERVICES =====
  facilities: [{
    wifi: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    restaurant: { type: Boolean, default: false },
    piscine: { type: Boolean, default: false },
    spa: { type: Boolean, default: false },
    salleDeSport: { type: Boolean, default: false },
    plagePrivee: { type: Boolean, default: false },
    serviceDeChambre: { type: Boolean, default: false },
    sallesDeReunion: { type: Boolean, default: false },
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
  }],
  
  // ===== SERVICES DÉTAILLÉS =====
  services: [{
    icon: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true,
      maxlength: 50
    },
    available: {
      type: Boolean,
      default: true
    }
  }],
  
  // ===== CHAMBRES =====
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  
  // ===== AVIS ET COMMENTAIRES =====
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
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    review: { 
      type: String, 
      required: true,
      maxlength: 1000
    },
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
  
  viewsCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  favoritesCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  // Utilisateurs qui ont mis en favoris
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // ===== MÉTADONNÉES =====
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  hasFullDetails: {
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
      enum: ['superAdmin', 'maintenancier'],
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
      enum: ['superAdmin', 'maintenancier']
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
hotelDetailSchema.index({ location: 1, isActive: 1 });
hotelDetailSchema.index({ region_Name: 1, isActive: 1 });
hotelDetailSchema.index({ coordinates: '2dsphere' }); // Géolocalisation
hotelDetailSchema.index({ averageRating: -1, totalReviews: -1 }); // Tri par popularité
hotelDetailSchema.index({ 'price.minPrice': 1, 'price.maxPrice': 1 }); // Tri par prix
hotelDetailSchema.index({ 'availability.start': 1, 'availability.end': 1 }); // Disponibilité
hotelDetailSchema.index({ createdAt: -1 }); // Tri par date
hotelDetailSchema.index({ hasFullDetails: 1 }); // Filtrer hôtels complets
hotelDetailSchema.index({ 
  title: 'text', 
  description: 'text', 
  location: 'text',
  region_Name: 'text'
}); // Index de recherche textuelle

// ===== MÉTHODES STATIQUES =====

// Trouver par ID
hotelDetailSchema.statics.findByHotelId = function(hotelId) {
  return this.findOne({ 
    _id: hotelId, 
    isActive: true 
  }).populate('rooms');
};

// Recherche d'hôtels par région
hotelDetailSchema.statics.findByRegion = function(regionName, options = {}) {
  const query = { 
    region_Name: { $regex: regionName, $options: 'i' },
    isActive: true 
  };
  
  if (options.priceRange) {
    if (options.priceRange.min) {
      query['price.minPrice'] = { $lte: options.priceRange.min };
    }
    if (options.priceRange.max) {
      query['price.maxPrice'] = { $gte: options.priceRange.max };
    }
  }
  
  if (options.availability) {
    query.$and = [
      { 'availability.start': { $lte: new Date(options.availability.start) } },
      { 'availability.end': { $gte: new Date(options.availability.end) } }
    ];
  }
  
  let sort = {};
  if (options.sortBy === 'rating') {
    sort = { averageRating: -1, totalReviews: -1 };
  } else if (options.sortBy === 'price_asc') {
    sort = { 'price.minPrice': 1 };
  } else if (options.sortBy === 'price_desc') {
    sort = { 'price.maxPrice': -1 };
  } else {
    sort = { averageRating: -1 };
  }
  
  return this.find(query)
    .sort(sort)
    .limit(options.limit || 50)
    .populate('rooms');
};

// Recherche d'hôtels par proximité géographique
hotelDetailSchema.statics.findNearby = function(latitude, longitude, maxDistance = 5000) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // en mètres
      }
    },
    isActive: true
  }).limit(20);
};

// Recherche globale d'hôtels
hotelDetailSchema.statics.searchHotels = function(searchTerm, options = {}) {
  const query = {
    isActive: true,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { location: { $regex: searchTerm, $options: 'i' } },
      { region_Name: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (options.priceRange) {
    if (options.priceRange.min) {
      query['price.minPrice'] = { $lte: options.priceRange.min };
    }
    if (options.priceRange.max) {
      query['price.maxPrice'] = { $gte: options.priceRange.max };
    }
  }
  
  if (options.regionName) {
    query.region_Name = { $regex: options.regionName, $options: 'i' };
  }
  
  return this.find(query)
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(options.limit || 20)
    .populate('rooms');
};

// Recherche d'hôtels avec disponibilité
hotelDetailSchema.statics.findAvailable = function(startDate, endDate, options = {}) {
  const query = {
    isActive: true,
    'availability.start': { $lte: new Date(startDate) },
    'availability.end': { $gte: new Date(endDate) }
  };
  
  if (options.region_Name) {
    query.region_Name = { $regex: options.region_Name, $options: 'i' };
  }
  
  if (options.minRating) {
    query.averageRating = { $gte: options.minRating };
  }
  
  return this.find(query)
    .sort({ averageRating: -1, 'price.minPrice': 1 })
    .populate('rooms');
};

// ===== MÉTHODES D'INSTANCE =====

// Calculer la note moyenne
hotelDetailSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
    this.review = "0 avis";
    return 0;
  }
  
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
  this.totalReviews = this.reviews.length;
  this.review = `${this.totalReviews} avis`;
  
  return this.averageRating;
};

// Ajouter un avis
hotelDetailSchema.methods.addReview = function(userId, userInfo, rating, reviewText) {
  // Vérifier si l'utilisateur a déjà donné un avis
  const existingReview = this.reviews.find(
    review => review.userId.toString() === userId.toString()
  );
  
  if (existingReview) {
    throw new Error('Vous avez déjà donné un avis pour cet hôtel');
  }
  
  const reviewId = new mongoose.Types.ObjectId().toString();
  const now = new Date();
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
  
  this.reviews.push({
    id: reviewId,
    userId,
    user: {
      id: userId,
      username: userInfo.username,
      profile: userInfo.profile
    },
    rating,
    review: reviewText,
    helpful: 0,
    helpfulBy: [],
    createdAt: now,
    updatedAt: formattedDate
  });
  
  this.calculateAverageRating();
  this.markModified('reviews');
  
  return this.save();
};

// Incrémenter les vues
hotelDetailSchema.methods.incrementViews = function() {
  this.viewsCount += 1;
  return this.save();
};

// Ajouter/Retirer des favoris
hotelDetailSchema.methods.toggleFavorite = function(userId) {
  const index = this.favoritedBy.indexOf(userId);
  
  if (index === -1) {
    // Ajouter aux favoris
    this.favoritedBy.push(userId);
    this.favoritesCount += 1;
    return { action: 'added', isFavorite: true };
  } else {
    // Retirer des favoris
    this.favoritedBy.splice(index, 1);
    this.favoritesCount = Math.max(0, this.favoritesCount - 1);
    return { action: 'removed', isFavorite: false };
  }
};

// Vérifier la disponibilité
hotelDetailSchema.methods.isAvailable = function(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return start >= this.availability.start && end <= this.availability.end;
};

// Formater la plage de dates de disponibilité
hotelDetailSchema.methods.getFormattedAvailability = function() {
  const start = this.availability.start;
  const end = this.availability.end;
  
  const startDay = start.getDate();
  const startMonth = start.toLocaleString('default', { month: 'short' });
  
  const endDay = end.getDate();
  const endMonth = end.toLocaleString('default', { month: 'short' });
  
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
};

// Obtenir les services disponibles
hotelDetailSchema.methods.getAvailableServices = function() {
  return this.services.filter(service => service.available);
};

// Obtenir la fourchette de prix formatée
hotelDetailSchema.methods.getFormattedPriceRange = function() {
  if (!this.price || !this.price.minPrice || !this.price.maxPrice) {
    return 'Prix non disponible';
  }
  
  if (this.price.minPrice === this.price.maxPrice) {
    return `${this.price.minPrice} FCFA`;
  }
  
  return `${this.price.minPrice} - ${this.price.maxPrice} FCFA`;
};

// Vérifier si l'hôtel a des chambres
hotelDetailSchema.methods.hasRooms = function() {
  return this.rooms && this.rooms.length > 0;
};

// Obtenir les équipements activés
hotelDetailSchema.methods.getActiveFacilities = function() {
  if (!this.facilities || this.facilities.length === 0) return [];
  
  const activeFacilities = [];
  for (const facilityGroup of this.facilities) {
    for (const [key, value] of Object.entries(facilityGroup.toObject())) {
      if (key !== '_id' && value === true) {
        activeFacilities.push(key);
      }
    }
  }
  return activeFacilities;
};

// ===== MIDDLEWARE PRE-SAVE =====
hotelDetailSchema.pre('save', function(next) {
  // Mettre à jour la version
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  // Recalculer la note moyenne si les avis ont changé
  if (this.isModified('reviews')) {
    this.calculateAverageRating();
  }
  
  // Vérifier si les détails sont complets
  const requiredFields = [
    'description', 'coordinates.latitude', 'coordinates.longitude',
    'price.minPrice', 'price.maxPrice', 'availability.start', 'availability.end'
  ];
  
  const hasAllDetails = requiredFields.every(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], this);
    return value !== undefined && value !== null && value !== '';
  });
  
  this.hasFullDetails = hasAllDetails && this.gallery && this.gallery.length > 0;
  
  // Valider les dates de disponibilité
  if (this.availability && this.availability.start && this.availability.end) {
    if (this.availability.start >= this.availability.end) {
      throw new Error('La date de fin doit être postérieure à la date de début');
    }
  }
  
  // Valider la cohérence des prix
  if (this.price && this.price.minPrice && this.price.maxPrice) {
    if (this.price.minPrice > this.price.maxPrice) {
      throw new Error('Le prix minimum ne peut pas être supérieur au prix maximum');
    }
  }
  
  next();
});

// ===== MIDDLEWARE PRE-FIND =====
hotelDetailSchema.pre(/^find/, function(next) {
  // Exclure les hôtels inactifs par défaut
  if (!this.getQuery().isActive) {
    this.find({ isActive: { $ne: false } });
  }
  next();
});

// ===== MIDDLEWARE POST-SAVE =====
hotelDetailSchema.post('save', function(doc) {
  console.log(`Hôtel sauvegardé: ${doc.title} (v${doc.version})`);
});

// ===== VIRTUAL POUR LE STATUT DE DISPONIBILITÉ =====
hotelDetailSchema.virtual('isCurrentlyAvailable').get(function() {
  const now = new Date();
  return this.availability && 
         this.availability.start <= now && 
         this.availability.end >= now;
});

// ===== VIRTUAL POUR LE PRIX MOYEN =====
hotelDetailSchema.virtual('averagePrice').get(function() {
  if (!this.price || !this.price.minPrice || !this.price.maxPrice) {
    return 0;
  }
  return Math.round((this.price.minPrice + this.price.maxPrice) / 2);
});

// Inclure les virtuals dans JSON
hotelDetailSchema.set('toJSON', { virtuals: true });
hotelDetailSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('HotelDetails', hotelDetailSchema);
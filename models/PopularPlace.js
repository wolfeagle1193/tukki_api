// models/PopularPlace.js - MODÈLE CORRIGÉ AVEC AUTHENTIFICATION
const mongoose = require('mongoose');

const popularPlaceSchema = new mongoose.Schema({
  // ✅ SUPPRIMÉ : _id personnalisé - utilise ObjectId par défaut
  
  // 🔗 RÉFÉRENCES vers RegionDetails - CORRIGÉ
  regionDetailsId: { 
    type: mongoose.Schema.Types.ObjectId,  // ✅ CORRIGÉ : ObjectId au lieu de String
    ref: 'RegionDetails',
    required: true,
    index: true
  },
  
  // ===== DONNÉES DE BASE (synchronisées avec RegionDetails) =====
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
  
  category: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  
  rating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  
  // ===== DONNÉES DÉTAILLÉES (exclusives à PopularPlace) =====
  description: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 50,
    maxlength: 2000
  },
  
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
  
  // Horaires de visite
  visitSchedules: {
    weekdays: {
      open: { type: String, default: '08:00', match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      close: { type: String, default: '18:00', match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    },
    weekends: {
      open: { type: String, default: '09:00', match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      close: { type: String, default: '17:00', match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    },
    holidays: {
      open: { type: String, default: '10:00', match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      close: { type: String, default: '16:00', match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }
    }
  },
  
  // Informations pratiques
  practicalInfos: {
    duration: { 
      type: String, 
      default: '2-3 heures',
      maxlength: 100
    },
    bestTimeToVisit: { 
      type: String, 
      default: 'Matin ou fin d\'après-midi',
      maxlength: 200
    },
    accessibility: { 
      type: String, 
      default: 'Accessible',
      maxlength: 200
    },
    entryFee: { 
      type: String, 
      default: 'Gratuit',
      maxlength: 100
    },
    parking: { 
      type: String, 
      default: 'Parking disponible',
      maxlength: 200
    },
    tips: { 
      type: String, 
      default: '',
      maxlength: 500
    }
  },
  
  // Contact
  contact: {
    phone: { 
      type: String, 
      default: '',
      match: /^(\+221\s?)?[0-9\s\-]{8,15}$/
    },
    email: { 
      type: String, 
      default: '',
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    website: { 
      type: String, 
      default: '',
      match: /^https?:\/\/.+/
    }
  },
  
  // Galerie d'images (URLs)
  gallery: [{
    type: String,
    match: /\.(jpg|jpeg|png|webp)$/i
  }],
  
  // Activités disponibles
  activities: [{
    type: String,
    maxlength: 100
  }],
  
  // Conseils spécialisés
  specialTips: [{
    type: String,
    maxlength: 200
  }],
  
  // ===== AVIS ET COMMENTAIRES (CÔTÉ MOBILE) =====
  reviews: [{
    userId: { 
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
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5 
    },
    comment: { 
      type: String, 
      default: '',
      maxlength: 500
    },
    helpful: { 
      type: Number, 
      default: 0,
      min: 0
    },
    // Qui a trouvé cet avis utile
    helpfulBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isReported: {
      type: Boolean,
      default: false
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
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
  
  // 🎛️ DONNÉES D'ADMINISTRATION
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
  // ✅ SUPPRIMÉ : _id: false - utilise ObjectId par défaut
  timestamps: { 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt' 
  }
});

// ===== INDEX POUR PERFORMANCE - CORRIGÉ =====
popularPlaceSchema.index({ regionDetailsId: 1, _id: 1 }); 
popularPlaceSchema.index({ regionDetailsId: 1, isActive: 1 });
popularPlaceSchema.index({ coordinates: '2dsphere' }); // Géolocalisation
popularPlaceSchema.index({ averageRating: -1, totalReviews: -1 }); // Tri par popularité
popularPlaceSchema.index({ createdAt: -1 }); // Tri par date
popularPlaceSchema.index({ hasFullDetails: 1 }); // Filtrer lieux complets

// ===== MÉTHODES STATIQUES - CORRIGÉES =====

// Trouver par ObjectId et région - CORRIGÉ
popularPlaceSchema.statics.findByPlaceId = function(regionDetailsId, placeId) {
  return this.findOne({ 
    regionDetailsId, 
    _id: placeId, // Utilise l'ObjectId par défaut
    isActive: true 
  }).populate('regionDetailsId', 'region_id location');
};

// Lieux populaires d'une région
popularPlaceSchema.statics.findByRegion = function(regionDetailsId, options = {}) {
  const query = { regionDetailsId, isActive: true };
  
  if (options.hasFullDetails !== undefined) {
    query.hasFullDetails = options.hasFullDetails;
  }
  
  let sort = {};
  if (options.sortBy === 'rating') {
    sort = { averageRating: -1, totalReviews: -1 };
  } else if (options.sortBy === 'views') {
    sort = { viewsCount: -1 };
  } else if (options.sortBy === 'recent') {
    sort = { updatedAt: -1 };
  } else {
    sort = { averageRating: -1 };
  }
  
  return this.find(query)
    .sort(sort)
    .limit(options.limit || 50)
    .populate('regionDetailsId', 'region_id location');
};

// Recherche de lieux
popularPlaceSchema.statics.searchPlaces = function(searchTerm, regionDetailsId = null) {
  const query = {
    isActive: true,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { location: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (regionDetailsId) {
    query.regionDetailsId = regionDetailsId;
  }
  
  return this.find(query)
    .sort({ averageRating: -1, totalReviews: -1 })
    .limit(20)
    .populate('regionDetailsId', 'region_id location');
};

// ===== MÉTHODES D'INSTANCE =====

// Calculer la note moyenne
popularPlaceSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
    return 0;
  }
  
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
  this.totalReviews = this.reviews.length;
  
  return this.averageRating;
};

// Ajouter un avis
popularPlaceSchema.methods.addReview = function(userId, username, rating, comment = '') {
  // Vérifier si l'utilisateur a déjà donné un avis
  const existingReview = this.reviews.find(
    review => review.userId.toString() === userId.toString()
  );
  
  if (existingReview) {
    throw new Error('Vous avez déjà donné un avis pour ce lieu');
  }
  
  this.reviews.push({
    userId,
    username,
    rating,
    comment,
    createdAt: new Date()
  });
  
  this.calculateAverageRating();
  this.markModified('reviews');
  
  return this.save();
};

// Incrémenter les vues
popularPlaceSchema.methods.incrementViews = function() {
  this.viewsCount += 1;
  return this.save();
};

// Ajouter/Retirer des favoris
popularPlaceSchema.methods.toggleFavorite = function(userId) {
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

// ===== MIDDLEWARE PRE-SAVE =====
popularPlaceSchema.pre('save', function(next) {
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
    'visitSchedules.weekdays.open', 'practicalInfos.duration'
  ];
  
  const hasAllDetails = requiredFields.every(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], this);
    return value !== undefined && value !== null && value !== '';
  });
  
  this.hasFullDetails = hasAllDetails;
  
  next();
});

// ===== MIDDLEWARE POST-SAVE =====
popularPlaceSchema.post('save', function(doc) {
  console.log(`✅ PopularPlace sauvegardé: ${doc.title} (v${doc.version})`);
});

module.exports = mongoose.model('PopularPlace', popularPlaceSchema);
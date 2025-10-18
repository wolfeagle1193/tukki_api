// models/EventDetails.js - MODÈLE COMPLET AVEC SYSTÈME DE RÉPONSES
const mongoose = require('mongoose');

const eventDetailSchema = new mongoose.Schema({
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
  
  longDescription: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  
  // ===== CATÉGORIE ET TYPE =====
  category: {
    type: String,
    required: true,
    enum: ['festival', 'excursion', 'nightlife', 'conference', 'culture', 'sport', 'atelier', 'plage', 'gastronomie', 'art', 'musique', 'danse', 'autre'],
    default: 'autre'
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
  
  // ===== DATES ET HORAIRES =====
  date: {
    type: String, // Format: "12 mai 2025"
    required: true
  },
  
  time: {
    type: String, // Format: "18h00 - 23h00"
    required: true
  },
  
  // Dates structurées pour les requêtes
  eventDates: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  
  // Programme détaillé (pour événements multi-jours)
  upcomingDates: [{
    type: String // Ex: "12 mai 2025 - Ouverture"
  }],
  
  // ===== TARIFICATION =====
  // Mode prix fixe OU prix par catégories
  fixedPrice: {
    type: Number, // Pour événements à prix unique
    min: 0
  },
  
  // Prix par catégories (solo, couple, groupe)
  price: {
    solo: {
      type: String // Ex: "15.000 Fcfa"
    },
    couple: {
      type: String // Ex: "25.000 Fcfa"
    },
    group: {
      type: String // Ex: "12.000 Fcfa/personne"
    }
  },
  
  // Prix numériques pour calculs et filtres
  priceRange: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // ===== DISPONIBILITÉ =====
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  capacity: {
    total: {
      type: Number,
      min: 1
    },
    remaining: {
      type: Number,
      min: 0
    }
  },
  
  // ===== IMAGES =====
  eventImage: {
    type: String,
    required: true,
    match: /\.(jpg|jpeg|png|webp)$/i
  },
  
  // Galerie d'images supplémentaires
  images: [{
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
  
  // ===== ORGANISATEUR =====
  organisateur: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  
  website: {
    type: String,
    trim: true
  },
  
  // ===== POINTS FORTS ET CARACTÉRISTIQUES =====
  highlights: [{
    type: String,
    maxlength: 200
  }],
  
  // ===== INCLUSIONS/EXCLUSIONS =====
  inclusions: [{
    type: String,
    required: true,
    maxlength: 200
  }],
  
  exclusions: [{
    type: String,
    maxlength: 200
  }],
  
  // ===== AVIS ET COMMENTAIRES AVEC RÉPONSES (MODIFIÉ) =====
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
      avatar: {
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
    comment: { 
      type: String, 
      required: true,
      maxlength: 1000
    },
    likes: {
      type: Number,
      default: 0,
      min: 0
    },
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // NOUVEAU: Système de réponses comme RegionDetails
    replies: [{
      user: {
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
      comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
      },
      likes: {
        type: Number,
        default: 0,
        min: 0
      },
      likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    date: {
      type: String, // Format: "2 mars 2025"
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
  
  // ===== RÉSERVATIONS =====
  bookingsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  bookings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bookingType: {
      type: String,
      enum: ['solo', 'couple', 'group', 'fixed'],
      required: true
    },
    numberOfPersons: {
      type: Number,
      required: true,
      min: 1
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['Orange Money', 'Wave', 'PayPal', 'Carte de crédit'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending'
    },
    phoneNumber: {
      type: String,
      required: true
    },
    bookingDate: {
      type: Date,
      default: Date.now
    },
    bookingReference: {
      type: String,
    }
  }],
  
  // ===== MÉTADONNÉES =====
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  isFeatured: {
    type: Boolean,
    default: false
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
eventDetailSchema.index({ location: 1, isActive: 1 });
eventDetailSchema.index({ region_Name: 1, isActive: 1 });
eventDetailSchema.index({ category: 1, isActive: 1 });
eventDetailSchema.index({ coordinates: '2dsphere' });
eventDetailSchema.index({ averageRating: -1, totalReviews: -1 });
eventDetailSchema.index({ 'priceRange.min': 1, 'priceRange.max': 1 });
eventDetailSchema.index({ 'eventDates.startDate': 1, 'eventDates.endDate': 1 });
eventDetailSchema.index({ createdAt: -1 });
eventDetailSchema.index({ hasFullDetails: 1 });
eventDetailSchema.index({ isAvailable: 1, isActive: 1 });
eventDetailSchema.index({ isFeatured: -1, averageRating: -1 });

// Index pour les bookings
eventDetailSchema.index(
  { 
    'bookings.bookingReference': 1,
    'bookings.userId': 1 
  }, 
  { 
    sparse: true,
    unique: true,
    partialFilterExpression: { 
      'bookings.bookingReference': { $exists: true, $ne: null, $ne: '' }
    }
  }
);

// Index de recherche textuelle
eventDetailSchema.index({ 
  title: 'text', 
  description: 'text', 
  location: 'text',
  region_Name: 'text',
  organisateur: 'text'
}); 

// ===== MÉTHODES POUR GESTION DES RÉPONSES (NOUVELLES) =====

// Ajouter une réponse à un avis
eventDetailSchema.methods.addReplyToReview = function(reviewId, userId, username, comment) {
  const review = this.reviews.find(r => r._id.toString() === reviewId || r.id === reviewId);
  if (!review) {
    throw new Error('Avis non trouvé');
  }
  
  if (!review.replies) {
    review.replies = [];
  }
  
  const newReply = {
    _id: new mongoose.Types.ObjectId(),
    user: userId,
    username: username,
    comment: comment.trim(),
    likes: 0,
    likedBy: [],
    createdAt: new Date()
  };
  
  review.replies.push(newReply);
  this.markModified('reviews');
  
  return newReply;
};

// Vérifier si un utilisateur a liké une réponse
eventDetailSchema.methods.hasUserLikedReply = function(reviewId, replyId, userId) {
  try {
    const review = this.reviews.find(r => r._id.toString() === reviewId || r.id === reviewId);
    if (!review || !review.replies) return false;
    
    const reply = review.replies.find(r => r._id.toString() === replyId);
    if (!reply) return false;
    
    return reply.likedBy.some(id => id.toString() === userId.toString());
  } catch (error) {
    return false;
  }
};

// Toggle like sur une réponse
eventDetailSchema.methods.toggleReplyLike = function(reviewId, replyId, userId) {
  const review = this.reviews.find(r => r._id.toString() === reviewId || r.id === reviewId);
  if (!review || !review.replies) {
    throw new Error('Avis ou réponse non trouvé');
  }
  
  const reply = review.replies.find(r => r._id.toString() === replyId);
  if (!reply) {
    throw new Error('Réponse non trouvée');
  }
  
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const hasLiked = reply.likedBy.some(id => id.toString() === userId.toString());
  
  if (hasLiked) {
    reply.likedBy = reply.likedBy.filter(id => id.toString() !== userId.toString());
    reply.likes = Math.max(0, reply.likes - 1);
    this.markModified('reviews');
    return { action: 'unliked', newCount: reply.likes };
  } else {
    reply.likedBy.push(userObjectId);
    reply.likes += 1;
    this.markModified('reviews');
    return { action: 'liked', newCount: reply.likes };
  }
};

// ===== MÉTHODES EXISTANTES (CONSERVÉES) =====

// Calculer la note moyenne
eventDetailSchema.methods.calculateAverageRating = function() {
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
eventDetailSchema.methods.addReview = function(userId, userInfo, rating, reviewText) {
  const existingReview = this.reviews.find(
    review => review.userId.toString() === userId.toString()
  );
  
  if (existingReview) {
    throw new Error('Vous avez déjà donné un avis pour cet événement');
  }
  
  const reviewId = new mongoose.Types.ObjectId().toString();
  const now = new Date();
  const formattedDate = `${now.getDate()} ${now.toLocaleString('fr-FR', { month: 'long' })} ${now.getFullYear()}`;
  
  this.reviews.push({
    id: reviewId,
    userId,
    user: {
      id: userId,
      username: userInfo.username,
      avatar: userInfo.avatar
    },
    rating,
    comment: reviewText,
    likes: 0,
    likedBy: [],
    replies: [], // Initialiser tableau vide
    createdAt: now,
    date: formattedDate
  });
  
  this.calculateAverageRating();
  this.markModified('reviews');
  
  return this.save();
};

// Incrémenter les vues
eventDetailSchema.methods.incrementViews = function() {
  this.viewsCount += 1;
  return this.save();
};

// Toggle favoris
eventDetailSchema.methods.toggleFavorite = function(userId) {
  const index = this.favoritedBy.indexOf(userId);
  
  if (index === -1) {
    this.favoritedBy.push(userId);
    this.favoritesCount += 1;
    return { action: 'added', isFavorite: true };
  } else {
    this.favoritedBy.splice(index, 1);
    this.favoritesCount = Math.max(0, this.favoritesCount - 1);
    return { action: 'removed', isFavorite: false };
  }
};

// Vérifier la disponibilité
eventDetailSchema.methods.checkAvailability = function() {
  const now = new Date();
  const eventStart = this.eventDates.startDate;
  
  if (eventStart < now) {
    this.isAvailable = false;
    return false;
  }
  
  if (this.capacity && this.capacity.total && this.capacity.remaining <= 0) {
    this.isAvailable = false;
    return false;
  }
  
  return this.isAvailable;
};

// Créer une réservation
eventDetailSchema.methods.createBooking = function(bookingData) {
  if (!this.checkAvailability()) {
    throw new Error('Événement non disponible pour réservation');
  }
  
  const bookingReference = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const booking = {
    ...bookingData,
    bookingReference,
    bookingDate: new Date()
  };
  
  this.bookings.push(booking);
  this.bookingsCount += 1;
  
  if (this.capacity && this.capacity.total) {
    this.capacity.remaining = Math.max(0, this.capacity.remaining - bookingData.numberOfPersons);
  }
  
  this.markModified('bookings');
  return booking;
};

// MIDDLEWARE PRE-SAVE
eventDetailSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  if (this.isModified('reviews')) {
    this.calculateAverageRating();
  }
  
  this.checkAvailability();
  
  next();
});

// VIRTUALS
eventDetailSchema.virtual('isCurrentlyBookable').get(function() {
  const now = new Date();
  return this.isActive && 
         this.isAvailable && 
         this.eventDates.startDate > now;
});

eventDetailSchema.virtual('daysUntilEvent').get(function() {
  const now = new Date();
  const eventStart = this.eventDates.startDate;
  const timeDiff = eventStart - now;
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
});

eventDetailSchema.set('toJSON', { virtuals: true });
eventDetailSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EventDetails', eventDetailSchema);
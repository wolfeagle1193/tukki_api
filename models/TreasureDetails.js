



// models/TreasureDetails.js - MODÈLE AMÉLIORÉ POUR LES SERVICES DYNAMIQUES
const mongoose = require('mongoose');

// ✅ SCHÉMA AMÉLIORÉ POUR LES SERVICES
const serviceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'Hébergement',
      'Restauration', 
      'Transport',
      'Guide touristique',
      'Loisirs',
      'Administration',
      'Accessibilité',
      'Boutique souvenirs',
      'Santé',
      'Banque'
    ]
  },
  icon: {
    type: String,
    default: '⚙️',
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    enum: [
      'logement',
      'restauration',
      'transport',
      'tourisme',
      'loisirs',
      'administration',
      'accessibilite',
      'shopping',
      'sante',
      'finance',
      'general'
    ],
    default: 'general'
  },
  customDescription: {
    type: String,
    trim: true,
    maxlength: 300
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  pricing: {
    range: {
      type: String,
      enum: ['gratuit', 'economique', 'moyen', 'premium', 'luxe'],
      default: 'moyen'
    },
    currency: {
      type: String,
      default: 'FCFA'
    },
    averagePrice: Number,
    priceDescription: String
  },
  availability: {
    openingHours: String,
    seasonality: {
      type: String,
      enum: ['toute-annee', 'saison-seche', 'saison-pluies', 'sur-reservation']
    },
    bookingRequired: {
      type: Boolean,
      default: false
    }
  },
  quality: {
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastReviewed: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  addedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Schéma commentaire avec tracking des likes (INCHANGÉ)
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  comment: {
    type: String,
    required: true,
    trim: true,
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
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true,
      trim: true
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
  }
});

// ✅ Schéma photo avec tracking des likes (INCHANGÉ)
const photoSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
});

// ✅ SCHÉMA PRINCIPAL AMÉLIORÉ
const treasureDetailsSchema = new mongoose.Schema({
  treasure_id: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000 // Augmenté pour des descriptions plus riches
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  favoritedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
       default: []
    }],

  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  gallery: [String],
  
  // ✅ SERVICES AVEC SCHÉMA AMÉLIORÉ
  services: [serviceSchema],
  
  photos: [photoSchema],
  comments: [commentSchema],
  popularPlaces: [{
    title: String,
    imageUrl: String,
    rating: Number,
    reviews: Number,
    location: String
  }],
  
  // ✅ PARAMÈTRES TEXTE AMÉLIORÉS
  textSettings: {
    fontSize: {
      type: Number,
      default: 16,
      min: 12,
      max: 24
    },
    lineHeight: {
      type: Number,
      default: 1.4,
      min: 1.0,
      max: 2.0
    },
    fontFamily: {
      type: String,
      enum: ['system', 'serif', 'sans-serif'],
      default: 'system'
    },
    alignment: {
      type: String,
      enum: ['left', 'center', 'right', 'justify'],
      default: 'left'
    }
  },
  
  // ✅ MÉTADONNÉES AMÉLIORÉES
  metadata: {
    completionStatus: {
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      lastCalculated: {
        type: Date,
        default: Date.now
      }
    },
    seoOptimized: {
      type: Boolean,
      default: false
    },
    featuredServices: [{
      type: String,
      trim: true
    }],
    tags: [{
      type: String,
      trim: true
    }],
    language: {
      type: String,
      default: 'fr',
      enum: ['fr', 'en', 'wo'] // français, anglais, wolof
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ INDEX POUR LES PERFORMANCES
treasureDetailsSchema.index({ treasure_id: 1 });
treasureDetailsSchema.index({ createdAt: -1 });
treasureDetailsSchema.index({ 'photos.createdAt': -1 });
treasureDetailsSchema.index({ 'comments.createdAt': -1 });
treasureDetailsSchema.index({ 'services.type': 1 });
treasureDetailsSchema.index({ 'services.category': 1 });
treasureDetailsSchema.index({ 'services.isActive': 1 });

// ✅ MIDDLEWARE POUR METTRE À JOUR updatedAt
treasureDetailsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Recalculer le statut de complétion
  if (this.isModified('description') || this.isModified('location') || 
      this.isModified('services') || this.isModified('gallery')) {
    this.metadata.completionStatus = this.calculateCompletionStatus();
  }
  
  next();
});

// ✅ MÉTHODES INSTANCE AMÉLIORÉES
treasureDetailsSchema.methods.hasUserLiked = function(userId, type, itemId) {
  try {
    const userObjectId = mongoose.Types.ObjectId(userId);
    
    switch(type) {
      case 'photo':
        const photo = this.photos.id(itemId);
        return photo ? photo.likedBy.includes(userObjectId) : false;
        
      case 'comment':
        const comment = this.comments.id(itemId);
        return comment ? comment.likedBy.includes(userObjectId) : false;
        
      case 'reply':
        for (let comment of this.comments) {
          const reply = comment.replies.id(itemId);
          if (reply) {
            return reply.likedBy.includes(userObjectId);
          }
        }
        return false;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Erreur hasUserLiked:', error);
    return false;
  }
};

// ✅ NOUVELLE MÉTHODE POUR CALCULER LA COMPLÉTION
treasureDetailsSchema.methods.calculateCompletionStatus = function() {
  let completed = 0;
  let total = 4;
  
  // Description (25%)
  if (this.description && this.description.trim().length >= 50) completed++;
  
  // Localisation (25%)
  if (this.location && this.location.trim().length >= 10) completed++;
  
  // Services (25%)
  if (this.services && this.services.length > 0) completed++;
  
  // Images (25%)
  if (this.gallery && this.gallery.length > 0) completed++;
  
  const percentage = Math.round((completed / total) * 100);
  
  return {
    percentage: percentage,
    lastCalculated: new Date(),
    details: {
      hasDescription: !!(this.description && this.description.trim().length >= 50),
      hasLocation: !!(this.location && this.location.trim().length >= 10),
      hasServices: !!(this.services && this.services.length > 0),
      hasImages: !!(this.gallery && this.gallery.length > 0)
    }
  };
};

// ✅ MÉTHODE POUR OBTENIR LES SERVICES ACTIFS
treasureDetailsSchema.methods.getActiveServices = function() {
  return this.services.filter(service => service.isActive);
};

// ✅ MÉTHODE POUR OBTENIR LES SERVICES PAR CATÉGORIE
treasureDetailsSchema.methods.getServicesByCategory = function(category) {
  return this.services.filter(service => 
    service.isActive && service.category === category
  );
};

// ✅ MÉTHODES STATIQUES
treasureDetailsSchema.statics.getPopularServices = function() {
  return this.aggregate([
    { $unwind: '$services' },
    { $match: { 'services.isActive': true } },
    { $group: {
        _id: '$services.type',
        count: { $sum: 1 },
        category: { $first: '$services.category' },
        description: { $first: '$services.description' }
    }},
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
};

module.exports = mongoose.model('TreasureDetails', treasureDetailsSchema);
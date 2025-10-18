// models/Excursion.js
/*const mongoose = require("mongoose");

// === SOUS-SCHÉMAS ===

// Schéma pour la durée
/*const durationSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    enum: ['minutes', 'hours', 'days'],
    default: 'hours'
  },
  displayText: {
    type: String,
    required: true
  }
}, { _id: false });

// Schéma pour la tarification
const pricingSchema = new mongoose.Schema({
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'FCFA'
  },
  depositPercentage: {
    type: Number,
    required: true,
    min: 10,
    max: 100,
    default: 33
  },
  depositAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Schéma pour l'organisateur
const organizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  company: {
    type: String,
    trim: true
  }
}, { _id: false });

// Schéma pour le point de rendez-vous
const meetingPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  instructions: {
    type: String,
    trim: true
  }
}, { _id: false });

// Schéma pour les prérequis
const requirementsSchema = new mongoose.Schema({
  physicalLevel: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'expert'],
    default: 'easy'
  },
  ageMin: {
    type: Number,
    min: 0,
    max: 100
  },
  ageMax: {
    type: Number,
    min: 0,
    max: 100
  },
  equipment: [{
    type: String,
    trim: true
  }],
  restrictions: [{
    type: String,
    trim: true
  }]
}, { _id: false });

// Schéma pour les paramètres de notification
const notificationSettingsSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    enum: ['minutes', 'hours', 'days', 'weeks']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Schéma pour les paramètres de compteur
const countdownSettingsSchema = new mongoose.Schema({
  showFromDays: {
    type: Number,
    default: 10,
    min: 1
  },
  showUntilHours: {
    type: Number,
    default: 24,
    min: 1
  },
  urgentThresholdDays: {
    type: Number,
    default: 3,
    min: 1
  },
  criticalThresholdDays: {
    type: Number,
    default: 1,
    min: 0
  }
}, { _id: false });

// Schéma pour l'historique des paiements
const paymentHistorySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'balance', 'refund', 'penalty']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'mobile_money', 'bank_transfer'],
    default: 'mobile_money'
  },
  transactionId: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

// Schéma pour les participants
const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  numberOfPersons: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  remainingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'deposit_paid', 'fully_paid', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentHistory: [paymentHistorySchema],
  specialRequests: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relation: {
      type: String,
      trim: true
    }
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  confirmationDate: {
    type: Date
  },
  cancellationDate: {
    type: Date
  },
  isConfirmed: {
    type: Boolean,
    default: false
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// === SCHÉMA PRINCIPAL EXCURSION ===
const excursionSchema = new mongoose.Schema({
  // Informations de base
  title: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  
  description: {
    type: String,
    required: [true, 'La description est obligatoire'],
    trim: true,
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'La description courte ne peut pas dépasser 300 caractères']
  },

  // Association avec le lieu (trésor)
  treasureId: {
    type: String,  // ✅ CORRECTION - correspond à votre modèle Treasure
    ref: 'Treasure',
    required: [true, 'Le lieu est obligatoire']
  },
  
  treasureName: {
    type: String,
    required: [true, 'Le nom du lieu est obligatoire'],
    trim: true
  },

  // Date et durée
  date: {
    type: Date,
    required: [true, 'La date est obligatoire'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'La date ne peut pas être dans le passé'
    }
  },
  
  duration: {
    type: durationSchema,
    required: true,
    default: {
      value: 6,
      unit: 'hours',
      displayText: '6 heures'
    }
  },

  // Participants
  maxParticipants: {
    type: Number,
    required: [true, 'Le nombre maximum de participants est obligatoire'],
    min: [1, 'Au moins 1 participant requis'],
    max: [100, 'Maximum 100 participants autorisés']
  },
  
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  
  participants: [participantSchema],

  // Tarification
  pricing: {
    type: pricingSchema,
    required: true
  },

  // Organisateur
  organizer: {
    type: organizerSchema,
    required: true
  },

  // Point de rendez-vous
  meetingPoint: {
    type: meetingPointSchema,
    required: true
  },

  // Services inclus
  included: [{
    type: String,
    trim: true
  }],

  // Prérequis
  requirements: {
    type: requirementsSchema,
    default: {}
  },

  // Statut
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published', 'cancelled', 'completed', 'suspended'],
    default: 'draft'
  },

  // Priorité
  isPriority: {
    type: Boolean,
    default: false
  },

  // Images et médias
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      trim: true
    },
    isMain: {
      type: Boolean,
      default: false
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

  // Paramètres de notification
  notificationSettings: [notificationSettingsSchema],

  // Paramètres de compteur à rebours
  countdownSettings: {
    type: countdownSettingsSchema,
    default: {}
  },

  // Métadonnées
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Statistiques
  stats: {
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalDeposits: {
      type: Number,
      default: 0
    },
    totalBalance: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },

  // Commentaires et avis
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    date: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],

  // Audit trail
  auditLog: [{
    action: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'published', 'cancelled', 'participant_added', 'participant_removed', 'payment_received']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    details: {
      type: String,
      trim: true
    },
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed
  }]

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === INDEX POUR PERFORMANCE ===
excursionSchema.index({ treasureId: 1, date: 1 });
excursionSchema.index({ status: 1, date: 1 });
excursionSchema.index({ 'participants.userId': 1 });
excursionSchema.index({ date: 1, status: 1 });
excursionSchema.index({ createdBy: 1 });
excursionSchema.index({ 'organizer.phone': 1 });

// === PROPRIÉTÉS VIRTUELLES ===

// Places disponibles
excursionSchema.virtual('availableSpots').get(function() {
  return this.maxParticipants - this.currentParticipants;
});

// Statut de disponibilité
excursionSchema.virtual('isFullyBooked').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Taux de remplissage
excursionSchema.virtual('fillRate').get(function() {
  return this.maxParticipants > 0 ? (this.currentParticipants / this.maxParticipants) * 100 : 0;
});

// Temps restant avant l'excursion
excursionSchema.virtual('timeUntilExcursion').get(function() {
  const now = new Date();
  const excursionDate = new Date(this.date);
  const diffMs = excursionDate - now;
  
  if (diffMs <= 0) {
    return { isPast: true, days: 0, hours: 0, minutes: 0 };
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { isPast: false, days, hours, minutes, totalMs: diffMs };
});

// === MIDDLEWARE PRE-SAVE ===
excursionSchema.pre('save', function(next) {
  // Calculer les montants de tarification
  if (this.pricing && this.pricing.basePrice && this.pricing.depositPercentage) {
    this.pricing.depositAmount = Math.round((this.pricing.basePrice * this.pricing.depositPercentage) / 100);
    this.pricing.remainingAmount = this.pricing.basePrice - this.pricing.depositAmount;
  }
  
  // Mettre à jour le texte d'affichage de la durée
  if (this.duration && this.duration.value && this.duration.unit) {
    const unitLabels = {
      'minutes': this.duration.value > 1 ? 'minutes' : 'minute',
      'hours': this.duration.value > 1 ? 'heures' : 'heure', 
      'days': this.duration.value > 1 ? 'jours' : 'jour'
    };
    this.duration.displayText = `${this.duration.value} ${unitLabels[this.duration.unit]}`;
  }
  
  // Valider que la date n'est pas dans le passé (sauf si c'est une mise à jour d'un document existant)
  if (this.isNew && this.date <= new Date()) {
    const error = new Error('La date de l\'excursion ne peut pas être dans le passé');
    return next(error);
  }
  
  // Valider le nombre de participants
  if (this.currentParticipants > this.maxParticipants) {
    const error = new Error('Le nombre de participants ne peut pas dépasser la limite maximale');
    return next(error);
  }
  
  // Calculer les statistiques financières
  this.calculateFinancialStats();
  
  next();
});

// === MÉTHODES D'INSTANCE ===

// Calculer les statistiques financières
excursionSchema.methods.calculateFinancialStats = function() {
  let totalRevenue = 0;
  let totalDeposits = 0;
  let totalBalance = 0;
  
  this.participants.forEach(participant => {
    participant.paymentHistory.forEach(payment => {
      if (payment.status === 'success') {
        totalRevenue += payment.amount;
        if (payment.type === 'deposit') {
          totalDeposits += payment.amount;
        } else if (payment.type === 'balance') {
          totalBalance += payment.amount;
        }
      }
    });
  });
  
  this.stats.totalRevenue = totalRevenue;
  this.stats.totalDeposits = totalDeposits;
  this.stats.totalBalance = totalBalance;
};

// Ajouter un participant
excursionSchema.methods.addParticipant = function(participantData) {
  if (this.isFullyBooked) {
    throw new Error('Cette excursion est complète');
  }
  
  // Vérifier si l'utilisateur n'est pas déjà inscrit
  const existingParticipant = this.participants.find(p => 
    p.userId.toString() === participantData.userId.toString()
  );
  
  if (existingParticipant) {
    throw new Error('Cet utilisateur est déjà inscrit à cette excursion');
  }
  
  // Calculer les montants
  const totalAmount = this.pricing.basePrice * participantData.numberOfPersons;
  const depositAmount = Math.round((totalAmount * this.pricing.depositPercentage) / 100);
  const remainingAmount = totalAmount - depositAmount;
  
  const participant = {
    ...participantData,
    totalAmount,
    depositAmount,
    remainingAmount,
    paymentStatus: 'pending',
    paymentHistory: [],
    registrationDate: new Date(),
    isConfirmed: false,
    isCancelled: false
  };
  
  this.participants.push(participant);
  this.currentParticipants += participantData.numberOfPersons;
  
  return participant;
};

// Retirer un participant
excursionSchema.methods.removeParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (participantIndex === -1) {
    throw new Error('Participant non trouvé');
  }
  
  const participant = this.participants[participantIndex];
  this.currentParticipants -= participant.numberOfPersons;
  this.participants.splice(participantIndex, 1);
  
  return participant;
};

// Enregistrer un paiement
excursionSchema.methods.recordPayment = function(userId, paymentData) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('Participant non trouvé');
  }
  
  const payment = {
    ...paymentData,
    date: new Date()
  };
  
  participant.paymentHistory.push(payment);
  
  // Mettre à jour le statut de paiement
  if (payment.status === 'success') {
    const totalPaid = participant.paymentHistory
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid >= participant.totalAmount) {
      participant.paymentStatus = 'fully_paid';
    } else if (totalPaid >= participant.depositAmount) {
      participant.paymentStatus = 'deposit_paid';
    }
  }
  
  return payment;
};

// === MÉTHODES STATIQUES ===

// Trouver les excursions pour un lieu spécifique
excursionSchema.statics.findByTreasure = function(treasureId, options = {}) {
  const query = { treasureId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.upcoming) {
    query.date = { $gte: new Date() };
  }
  
  return this.find(query)
    .populate('treasureId', 'name location')
    .populate('participants.userId', 'username email')
    .sort({ date: 1 });
};

// Trouver les excursions d'un utilisateur
excursionSchema.statics.findByUser = function(userId, options = {}) {
  const query = { 'participants.userId': userId };
  
  if (options.status) {
    query[`participants.$.paymentStatus`] = options.status;
  }
  
  return this.find(query)
    .populate('treasureId', 'name location placeImage')
    .sort({ date: 1 });
};

// Statistiques pour le dashboard
excursionSchema.statics.getDashboardStats = function() {
  const now = new Date();
  
  return this.aggregate([
    {
      $facet: {
        total: [{ $count: "count" }],
        upcoming: [
          { $match: { date: { $gte: now }, status: { $ne: 'cancelled' } } },
          { $count: "count" }
        ],
        revenue: [
          { $group: { _id: null, total: { $sum: "$stats.totalRevenue" } } }
        ],
        participants: [
          { $group: { _id: null, total: { $sum: "$currentParticipants" } } }
        ]
      }
    }
  ]);
};

module.exports = mongoose.model("Excursion", excursionSchema);*/



// models/Excursion.js
// ✅ ÉTAPE 1 - MODÈLE AVEC TÉLÉPHONE ET CONTACT D'URGENCE OBLIGATOIRES

const mongoose = require("mongoose");

// === SOUS-SCHÉMAS ===

// Schéma pour la durée
const durationSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    enum: ['minutes', 'hours', 'days'],
    default: 'hours'
  },
  displayText: {
    type: String,
    required: true
  }
}, { _id: false });

// Schéma pour la tarification
const pricingSchema = new mongoose.Schema({
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'FCFA'
  },
  depositPercentage: {
    type: Number,
    required: true,
    min: 10,
    max: 100,
    default: 33
  },
  depositAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Schéma pour l'organisateur
const organizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  company: {
    type: String,
    trim: true
  }
}, { _id: false });

// Schéma pour le point de rendez-vous
const meetingPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  instructions: {
    type: String,
    trim: true
  }
}, { _id: false });

// Schéma pour les prérequis
const requirementsSchema = new mongoose.Schema({
  physicalLevel: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'expert'],
    default: 'easy'
  },
  ageMin: {
    type: Number,
    min: 0,
    max: 100
  },
  ageMax: {
    type: Number,
    min: 0,
    max: 100
  },
  equipment: [{
    type: String,
    trim: true
  }],
  restrictions: [{
    type: String,
    trim: true
  }]
}, { _id: false });

// Schéma pour les paramètres de notification
const notificationSettingsSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true,
    enum: ['minutes', 'hours', 'days', 'weeks']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Schéma pour les paramètres de compteur
const countdownSettingsSchema = new mongoose.Schema({
  showFromDays: {
    type: Number,
    default: 10,
    min: 1
  },
  showUntilHours: {
    type: Number,
    default: 24,
    min: 1
  },
  urgentThresholdDays: {
    type: Number,
    default: 3,
    min: 1
  },
  criticalThresholdDays: {
    type: Number,
    default: 1,
    min: 0
  }
}, { _id: false });

// Schéma pour l'historique des paiements
const paymentHistorySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'balance', 'refund', 'penalty']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'mobile_money', 'bank_transfer'],
    default: 'mobile_money'
  },
  transactionId: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

// ✅ SCHÉMA POUR LES PARTICIPANTS - MODIFIÉ AVEC CONTACT D'URGENCE OBLIGATOIRE
const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  // ✅ TÉLÉPHONE PRINCIPAL OBLIGATOIRE AVEC VALIDATION INTERNATIONALE
  phone: {
    type: String,
    required: [true, 'Le numéro de téléphone du participant est obligatoire'],
    trim: true,
    validate: {
      validator: function(v) {
        if (!v || v.trim().length === 0) {
          return false; // Le champ ne peut pas être vide
        }
        
        // ✅ VALIDATION INTERNATIONALE FLEXIBLE
        // Accepte : +33123456789, 0123456789, +221771234567, etc.
        const phoneRegex = /^[\+]?[1-9]\d{1,14}$/; // Format E.164 simplifié
        const cleanPhone = v.replace(/[\s\-\(\)\.]/g, ''); // Nettoyer les espaces et caractères
        
        return cleanPhone.length >= 8 && cleanPhone.length <= 15 && phoneRegex.test(cleanPhone);
      },
      message: 'Format de numéro de téléphone invalide. Utilisez un format international (ex: +221771234567, +33123456789)'
    }
  },
  
  numberOfPersons: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  remainingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'deposit_paid', 'fully_paid', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentHistory: [paymentHistorySchema],
  
  specialRequests: {
    type: String,
    trim: true
  },
  
  // ✅ CONTACT D'URGENCE OBLIGATOIRE COMPLET
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Le nom du contact d\'urgence est obligatoire'],
      trim: true,
      minlength: [2, 'Le nom du contact d\'urgence doit contenir au moins 2 caractères'],
      maxlength: [100, 'Le nom du contact d\'urgence ne peut pas dépasser 100 caractères']
    },
    phone: {
      type: String,
      required: [true, 'Le téléphone du contact d\'urgence est obligatoire'],
      trim: true,
      validate: {
        validator: function(v) {
          if (!v || v.trim().length === 0) {
            return false; // Le champ ne peut pas être vide
          }
          
          // ✅ MÊME VALIDATION QUE LE TÉLÉPHONE PRINCIPAL
          const phoneRegex = /^[\+]?[1-9]\d{1,14}$/;
          const cleanPhone = v.replace(/[\s\-\(\)\.]/g, '');
          
          return cleanPhone.length >= 8 && cleanPhone.length <= 15 && phoneRegex.test(cleanPhone);
        },
        message: 'Format de téléphone du contact d\'urgence invalide. Utilisez un format international (ex: +221771234567)'
      }
    },
    relation: {
      type: String,
      required: [true, 'La relation avec le contact d\'urgence est obligatoire'],
      trim: true,
      enum: {
        values: [
          // Famille proche
          'conjoint', 'conjointe', 'époux', 'épouse', 'mari', 'femme',
          'père', 'mère', 'parent', 'fils', 'fille', 'enfant',
          'frère', 'sœur', 'frère et sœur',
          // Famille élargie
          'grand-père', 'grand-mère', 'grand-parent',
          'oncle', 'tante', 'cousin', 'cousine',
          // Non-famille
          'ami', 'amie', 'ami proche', 'collègue',
          'tuteur', 'tutrice', 'responsable légal',
          'autre'
        ],
        message: 'Relation non reconnue. Utilisez: conjoint, parent, enfant, frère/sœur, ami, etc.'
      }
    }
  },
  
  registrationDate: {
    type: Date,
    default: Date.now
  },
  confirmationDate: {
    type: Date
  },
  cancellationDate: {
    type: Date
  },
  isConfirmed: {
    type: Boolean,
    default: false
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// === SCHÉMA PRINCIPAL EXCURSION ===
const excursionSchema = new mongoose.Schema({
  // Informations de base
  title: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  
  description: {
    type: String,
    required: [true, 'La description est obligatoire'],
    trim: true,
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'La description courte ne peut pas dépasser 300 caractères']
  },

  // Association avec le lieu (trésor)
  treasureId: {
    type: String,  // ✅ String selon votre modèle Treasure
    ref: 'Treasure',
    required: [true, 'Le lieu est obligatoire']
  },
  
  treasureName: {
    type: String,
    required: [true, 'Le nom du lieu est obligatoire'],
    trim: true
  },

  // Date et durée
  date: {
    type: Date,
    required: [true, 'La date est obligatoire'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'La date ne peut pas être dans le passé'
    }
  },
  
  duration: {
    type: durationSchema,
    required: true,
    default: {
      value: 6,
      unit: 'hours',
      displayText: '6 heures'
    }
  },

  // Participants
  maxParticipants: {
    type: Number,
    required: [true, 'Le nombre maximum de participants est obligatoire'],
    min: [1, 'Au moins 1 participant requis'],
    max: [100, 'Maximum 100 participants autorisés']
  },
  
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  
  participants: [participantSchema], // ✅ Utilise le schéma modifié

  // Tarification
  pricing: {
    type: pricingSchema,
    required: true
  },

  // Organisateur
  organizer: {
    type: organizerSchema,
    required: true
  },

  // Point de rendez-vous
  meetingPoint: {
    type: meetingPointSchema,
    required: true
  },

  // Services inclus
  included: [{
    type: String,
    trim: true
  }],

  // Services non inclus
  notIncluded: [{
    type: String,
    trim: true
  }],

  // Prérequis
  requirements: {
    type: requirementsSchema,
    default: {}
  },

  // Statut
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published', 'cancelled', 'completed', 'suspended'],
    default: 'draft'
  },

  // Priorité
  isPriority: {
    type: Boolean,
    default: false
  },

  // Images et médias
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      trim: true
    },
    isMain: {
      type: Boolean,
      default: false
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],

  // Paramètres de notification
  notificationSettings: [notificationSettingsSchema],

  // Paramètres de compteur à rebours
  countdownSettings: {
    type: countdownSettingsSchema,
    default: {}
  },

  // Métadonnées
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  notes: {
    type: String,
    trim: true
  },

  // Statistiques
  stats: {
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalDeposits: {
      type: Number,
      default: 0
    },
    totalBalance: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },

  // Commentaires et avis
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    date: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],

  // Audit trail
  auditLog: [{
    action: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'published', 'cancelled', 'participant_added', 'participant_removed', 'payment_received']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    details: {
      type: String,
      trim: true
    },
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed
  }]

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === INDEX POUR PERFORMANCE ===
excursionSchema.index({ treasureId: 1, date: 1 });
excursionSchema.index({ status: 1, date: 1 });
excursionSchema.index({ 'participants.userId': 1 });
excursionSchema.index({ date: 1, status: 1 });
excursionSchema.index({ createdBy: 1 });
excursionSchema.index({ 'organizer.phone': 1 });

// === PROPRIÉTÉS VIRTUELLES ===

// Places disponibles
excursionSchema.virtual('availableSpots').get(function() {
  return this.maxParticipants - this.currentParticipants;
});

// Statut de disponibilité
excursionSchema.virtual('isFullyBooked').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Taux de remplissage
excursionSchema.virtual('fillRate').get(function() {
  return this.maxParticipants > 0 ? (this.currentParticipants / this.maxParticipants) * 100 : 0;
});

// Temps restant avant l'excursion
excursionSchema.virtual('timeUntilExcursion').get(function() {
  const now = new Date();
  const excursionDate = new Date(this.date);
  const diffMs = excursionDate - now;
  
  if (diffMs <= 0) {
    return { isPast: true, days: 0, hours: 0, minutes: 0 };
  }
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { isPast: false, days, hours, minutes, totalMs: diffMs };
});

// === MIDDLEWARE PRE-SAVE ===
excursionSchema.pre('save', function(next) {
  // Calculer les montants de tarification
  if (this.pricing && this.pricing.basePrice && this.pricing.depositPercentage) {
    this.pricing.depositAmount = Math.round((this.pricing.basePrice * this.pricing.depositPercentage) / 100);
    this.pricing.remainingAmount = this.pricing.basePrice - this.pricing.depositAmount;
  }
  
  // Mettre à jour le texte d'affichage de la durée
  if (this.duration && this.duration.value && this.duration.unit) {
    const unitLabels = {
      'minutes': this.duration.value > 1 ? 'minutes' : 'minute',
      'hours': this.duration.value > 1 ? 'heures' : 'heure', 
      'days': this.duration.value > 1 ? 'jours' : 'jour'
    };
    this.duration.displayText = `${this.duration.value} ${unitLabels[this.duration.unit]}`;
  }
  
  // Valider que la date n'est pas dans le passé (sauf si c'est une mise à jour d'un document existant)
  if (this.isNew && this.date <= new Date()) {
    const error = new Error('La date de l\'excursion ne peut pas être dans le passé');
    return next(error);
  }
  
  // Valider le nombre de participants
  if (this.currentParticipants > this.maxParticipants) {
    const error = new Error('Le nombre de participants ne peut pas dépasser la limite maximale');
    return next(error);
  }
  
  // Calculer les statistiques financières
  this.calculateFinancialStats();
  
  next();
});

// === MÉTHODES D'INSTANCE ===

// Calculer les statistiques financières
excursionSchema.methods.calculateFinancialStats = function() {
  let totalRevenue = 0;
  let totalDeposits = 0;
  let totalBalance = 0;
  
  this.participants.forEach(participant => {
    participant.paymentHistory.forEach(payment => {
      if (payment.status === 'success') {
        totalRevenue += payment.amount;
        if (payment.type === 'deposit') {
          totalDeposits += payment.amount;
        } else if (payment.type === 'balance') {
          totalBalance += payment.amount;
        }
      }
    });
  });
  
  this.stats.totalRevenue = totalRevenue;
  this.stats.totalDeposits = totalDeposits;
  this.stats.totalBalance = totalBalance;
};

// ✅ MÉTHODE AJOUTER UN PARTICIPANT - MODIFIÉE POUR CONTACT D'URGENCE
excursionSchema.methods.addParticipant = function(participantData) {
  if (this.isFullyBooked) {
    throw new Error('Cette excursion est complète');
  }
  
  // Vérifier si l'utilisateur n'est pas déjà inscrit
  const existingParticipant = this.participants.find(p => 
    p.userId.toString() === participantData.userId.toString()
  );
  
  if (existingParticipant) {
    throw new Error('Cet utilisateur est déjà inscrit à cette excursion');
  }
  
  // ✅ VALIDATION SUPPLÉMENTAIRE CONTACT D'URGENCE
  if (!participantData.emergencyContact) {
    throw new Error('Le contact d\'urgence est obligatoire pour votre sécurité');
  }
  
  if (!participantData.emergencyContact.name || !participantData.emergencyContact.phone || !participantData.emergencyContact.relation) {
    throw new Error('Nom, téléphone et relation du contact d\'urgence sont obligatoires');
  }
  
  // Calculer les montants
  const totalAmount = this.pricing.basePrice * participantData.numberOfPersons;
  const depositAmount = Math.round((totalAmount * this.pricing.depositPercentage) / 100);
  const remainingAmount = totalAmount - depositAmount;
  
  const participant = {
    ...participantData,
    totalAmount,
    depositAmount,
    remainingAmount,
    paymentStatus: 'pending',
    paymentHistory: [],
    registrationDate: new Date(),
    isConfirmed: false,
    isCancelled: false
  };
  
  this.participants.push(participant);
  this.currentParticipants += participantData.numberOfPersons;
  
  return participant;
};

// Retirer un participant
excursionSchema.methods.removeParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (participantIndex === -1) {
    throw new Error('Participant non trouvé');
  }
  
  const participant = this.participants[participantIndex];
  this.currentParticipants -= participant.numberOfPersons;
  this.participants.splice(participantIndex, 1);
  
  return participant;
};

// Enregistrer un paiement
excursionSchema.methods.recordPayment = function(userId, paymentData) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('Participant non trouvé');
  }
  
  const payment = {
    ...paymentData,
    date: new Date()
  };
  
  participant.paymentHistory.push(payment);
  
  // Mettre à jour le statut de paiement
  if (payment.status === 'success') {
    const totalPaid = participant.paymentHistory
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid >= participant.totalAmount) {
      participant.paymentStatus = 'fully_paid';
    } else if (totalPaid >= participant.depositAmount) {
      participant.paymentStatus = 'deposit_paid';
    }
  }
  
  return payment;
};

// === MÉTHODES STATIQUES ===

// Trouver les excursions pour un lieu spécifique
excursionSchema.statics.findByTreasure = function(treasureId, options = {}) {
  const query = { treasureId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.upcoming) {
    query.date = { $gte: new Date() };
  }
  
  return this.find(query)
    .populate('treasureId', 'name location')
    .populate('participants.userId', 'username email')
    .sort({ date: 1 });
};

// Trouver les excursions d'un utilisateur
excursionSchema.statics.findByUser = function(userId, options = {}) {
  const query = { 'participants.userId': userId };
  
  if (options.status) {
    query[`participants.$.paymentStatus`] = options.status;
  }
  
  return this.find(query)
    .populate('treasureId', 'name location placeImage')
    .sort({ date: 1 });
};

// Statistiques pour le dashboard
excursionSchema.statics.getDashboardStats = function() {
  const now = new Date();
  
  return this.aggregate([
    {
      $facet: {
        total: [{ $count: "count" }],
        upcoming: [
          { $match: { date: { $gte: now }, status: { $ne: 'cancelled' } } },
          { $count: "count" }
        ],
        revenue: [
          { $group: { _id: null, total: { $sum: "$stats.totalRevenue" } } }
        ],
        participants: [
          { $group: { _id: null, total: { $sum: "$currentParticipants" } } }
        ]
      }
    }
  ]);
};

module.exports = mongoose.model("Excursion", excursionSchema);
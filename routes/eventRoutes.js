// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/EventController');
const EventValidation = require('../middlewares/eventValidation');
const { verifyToken, verifyTokenForUpload } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');
const { body } = require('express-validator');

const multer = require('multer');
const path = require('path');

// Configuration multer pour les événements
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp/'); // Dossier temporaire
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'), false);
        }
    }
});

// ===== ROUTES PUBLIQUES/UTILISATEUR =====

/**
 * Récupérer les événements favoris de l'utilisateur connecté
 * GET /api/events/user/favorites?sortBy=dateAdded&category=festival&region=dakar
 */
router.get(
  '/user/favorites',
  verifyToken,
  eventController.getUserFavoriteEvents
);

/**
 * Récupérer les réservations de l'utilisateur connecté
 * GET /api/events/user/bookings?status=confirmed&page=1&limit=10
 */
router.get(
  '/user/bookings',
  verifyToken,
  eventController.getUserBookings
);

/**
 * Récupérer événements par catégorie
 * GET /api/events/category/:category?sortBy=rating&region=dakar&upcoming=true
 */
router.get(
  '/category/:category',
  verifyToken,
  eventController.getEventsByCategory
);

/**
 * Récupérer événements par région
 * GET /api/events/region/:regionName?sortBy=date&category=festival&upcoming=true
 */
router.get(
  '/region/:regionName',
  verifyToken,
  eventController.getEventsByRegion
);

/**
 * Récupérer événements populaires/mis en avant
 * GET /api/events/featured?limit=10&region=dakar
 */
router.get(
  '/featured',
  verifyToken,
  eventController.getFeaturedEvents
);

/**
 * Rechercher des événements
 * GET /api/events/search?query=jazz&region_Name=saint-louis&category=festival&upcoming=true
 */
router.get(
  '/search',
  verifyToken,
  eventController.searchEvents
);

/**
 * Récupérer tous les événements (scroll mobile)
 * GET /api/events?sortBy=averageRating&minRating=3&category=festival&upcoming=true
 */
router.get(
  '/',
  verifyToken,
  eventController.getAllEvents
);

/**
 * Récupérer détails d'un événement par ID
 * GET /api/events/:eventId
 */
router.get(
  '/:eventId',
  verifyToken,
  eventController.getEventById
);

/**
 * Ajouter un avis à un événement
 * POST /api/events/:eventId/review
 * Body: { rating: 5, review: "Excellent événement!" }
 */
router.post(
  '/:eventId/review',
  verifyToken,
  EventValidation.validateReview,
  eventController.submitEventReview
);

/**
 * Ajouter une réponse à un avis d'événement
 * POST /api/events/:eventId/reviews/:reviewId/reply
 * Body: { comment: "Merci pour votre avis!" }
 */
router.post(
  '/:eventId/reviews/:reviewId/reply',
  verifyToken,
  [
    body('comment')
      .trim()
      .isLength({ min: 3, max: 500 })
      .withMessage('La réponse doit contenir entre 3 et 500 caractères')
      .escape()
  ],
  eventController.addReviewReply
);

/**
 * Toggle like sur une réponse d'avis
 * POST /api/events/:eventId/reviews/:reviewId/replies/:replyId/like
 */
router.post(
  '/:eventId/reviews/:reviewId/replies/:replyId/like',
  verifyToken,
  eventController.toggleReplyLike
);

/**
 * Toggle favoris d'un événement
 * POST /api/events/:eventId/favorite
 */
router.post(
  '/:eventId/favorite',
  verifyToken,
  eventController.toggleEventFavorite
);

/**
 * Réserver un événement
 * POST /api/events/:eventId/book
 * Body: { bookingType: 'solo|couple|group|fixed', numberOfPersons: 2, paymentMethod: 'Orange Money', phoneNumber: '771234567' }
 */
router.post(
  '/:eventId/book',
  verifyToken,
  EventValidation.validateBooking,
  eventController.bookEvent
);

/**
 * Annuler une réservation
 * DELETE /api/events/:eventId/bookings/:bookingId
 */
router.delete(
  '/:eventId/bookings/:bookingId',
  verifyToken,
  eventController.cancelBooking
);

// ===== ROUTES ADMIN/MAINTENANCIER UNIQUEMENT =====

/**
 * Créer ou mettre à jour les détails complets d'un événement
 * POST /api/events/admin/create-or-update
 * Body: FormData avec images + { title, description, category, location, region_Name, date, time, organisateur, coordinates, eventDates, price/fixedPrice, ... }
 */
router.post(
  '/admin/create-or-update',
  verifyTokenForUpload,
  checkRole(['superAdmin', 'maintenancier']),
  upload.array('images', 12), // Jusqu'à 12 images pour les événements
  EventValidation.validateCreateOrUpdate, 
  eventController.createOrUpdateEventDetails
);

/**
 * Lister tous les événements pour l'administration
 * GET /api/events/admin/list?page=1&limit=20&region_Name=dakar&category=festival&isAvailable=true&sortBy=updatedAt
 */
router.get(
  '/admin/list',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  eventController.getAdminEventsList
);

/**
 * Obtenir les statistiques des événements
 * GET /api/events/admin/stats
 */
router.get(
  '/admin/stats',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  eventController.getEventsStats
);

/**
 * Obtenir la liste des événements supprimés
 * GET /api/events/admin/deleted?page=1&limit=20
 */
router.get(
  '/admin/deleted',
  verifyToken,
  checkRole(['superAdmin']),
  eventController.getDeletedEvents
);

/**
 * Récupérer toutes les réservations (Admin)
 * GET /api/events/admin/bookings?status=confirmed&page=1&limit=20&eventId=xxx
 */
router.get(
  '/admin/bookings',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      const { 
        status, 
        eventId, 
        page = 1, 
        limit = 20,
        startDate,
        endDate,
        paymentMethod
      } = req.query;
      
      console.log('📋 Récupération réservations admin...');
      
      const EventDetails = require('../models/EventDetails');
      
      const query = { isActive: true };
      
      if (eventId) {
        query._id = eventId;
      }
      
      if (startDate || endDate) {
        query['eventDates.startDate'] = {};
        if (startDate) query['eventDates.startDate'].$gte = new Date(startDate);
        if (endDate) query['eventDates.startDate'].$lte = new Date(endDate);
      }
      
      const events = await EventDetails.find(query)
        .sort({ 'bookings.bookingDate': -1 })
        .lean();
      
      // Extraire toutes les réservations
      const allBookings = [];
      
      events.forEach(event => {
        if (event.bookings && event.bookings.length > 0) {
          event.bookings.forEach(booking => {
            // Filtrer par statut
            if (status && booking.paymentStatus !== status) return;
            
            // Filtrer par méthode de paiement
            if (paymentMethod && booking.paymentMethod !== paymentMethod) return;
            
            allBookings.push({
              bookingId: booking._id,
              bookingReference: booking.bookingReference,
              event: {
                _id: event._id,
                title: event.title,
                location: event.location,
                date: event.date,
                time: event.time,
                category: event.category
              },
              user: {
                userId: booking.userId,
                phoneNumber: booking.phoneNumber
              },
              details: {
                bookingType: booking.bookingType,
                numberOfPersons: booking.numberOfPersons,
                totalPrice: booking.totalPrice,
                paymentMethod: booking.paymentMethod,
                paymentStatus: booking.paymentStatus,
                bookingDate: booking.bookingDate
              }
            });
          });
        }
      });
      
      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedBookings = allBookings.slice(skip, skip + parseInt(limit));
      
      console.log(`✅ ${paginatedBookings.length} réservations récupérées`);
      
      return res.json({
        success: true,
        data: paginatedBookings,
        pagination: {
          currentPage: parseInt(page),
          totalItems: allBookings.length,
          itemsPerPage: parseInt(limit),
          totalPages: Math.ceil(allBookings.length / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération réservations admin:', error);
      return res.status(500).json({
        success: false,
        message: "Une erreur interne s'est produite."
      });
    }
  }
);

/**
 * Statistiques des réservations
 * GET /api/events/admin/bookings/stats
 */
router.get(
  '/admin/bookings/stats',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      console.log('📊 Calcul statistiques réservations...');
      
      const EventDetails = require('../models/EventDetails');
      
      const bookingStats = await EventDetails.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$bookings' },
        {
          $group: {
            _id: '$bookings.paymentStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$bookings.totalPrice' },
            averageAmount: { $avg: '$bookings.totalPrice' }
          }
        }
      ]);
      
      const paymentMethodStats = await EventDetails.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$bookings' },
        {
          $group: {
            _id: '$bookings.paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$bookings.totalPrice' }
          }
        }
      ]);
      
      const bookingTypeStats = await EventDetails.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$bookings' },
        {
          $group: {
            _id: '$bookings.bookingType',
            count: { $sum: 1 },
            totalPersons: { $sum: '$bookings.numberOfPersons' }
          }
        }
      ]);
      
      const monthlyStats = await EventDetails.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$bookings' },
        {
          $group: {
            _id: {
              year: { $year: '$bookings.bookingDate' },
              month: { $month: '$bookings.bookingDate' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$bookings.totalPrice' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);
      
      return res.json({
        success: true,
        data: {
          byStatus: bookingStats,
          byPaymentMethod: paymentMethodStats,
          byBookingType: bookingTypeStats,
          monthlyTrend: monthlyStats
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur stats réservations:', error);
      return res.status(500).json({
        success: false,
        message: "Une erreur interne s'est produite."
      });
    }
  }
);

/**
 * Confirmer manuellement une réservation (Admin)
 * POST /api/events/admin/bookings/:bookingId/confirm
 */
router.post(
  '/admin/bookings/:bookingId/confirm',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      console.log(`✅ Confirmation manuelle réservation: ${bookingId}`);
      
      const EventDetails = require('../models/EventDetails');
      
      const event = await EventDetails.findOne({ 
        'bookings._id': bookingId,
        isActive: true 
      });
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Réservation non trouvée"
        });
      }
      
      const booking = event.bookings.find(b => b._id.toString() === bookingId);
      
      if (booking.paymentStatus === 'confirmed') {
        return res.status(400).json({
          success: false,
          message: "Réservation déjà confirmée"
        });
      }
      
      booking.paymentStatus = 'confirmed';
      event.bookingsCount = event.bookings.filter(b => b.paymentStatus === 'confirmed').length;
      
      await event.save();
      
      console.log(`✅ Réservation ${booking.bookingReference} confirmée manuellement`);
      
      return res.json({
        success: true,
        message: "Réservation confirmée avec succès",
        data: {
          bookingReference: booking.bookingReference,
          newStatus: 'confirmed'
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur confirmation réservation:', error);
      return res.status(500).json({
        success: false,
        message: "Une erreur interne s'est produite."
      });
    }
  }
);

/**
 * Rembourser une réservation (Admin)
 * POST /api/events/admin/bookings/:bookingId/refund
 * Body: { refundAmount: 15000, reason: "Annulation événement" }
 */
router.post(
  '/admin/bookings/:bookingId/refund',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { refundAmount, reason } = req.body;
      
      console.log(`💰 Remboursement réservation: ${bookingId}`);
      
      const EventDetails = require('../models/EventDetails');
      
      const event = await EventDetails.findOne({ 
        'bookings._id': bookingId,
        isActive: true 
      });
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Réservation non trouvée"
        });
      }
      
      const booking = event.bookings.find(b => b._id.toString() === bookingId);
      
      if (booking.paymentStatus === 'refunded') {
        return res.status(400).json({
          success: false,
          message: "Réservation déjà remboursée"
        });
      }
      
      booking.paymentStatus = 'refunded';
      booking.refundInfo = {
        amount: refundAmount || booking.totalPrice,
        reason: reason || 'Remboursement administrateur',
        refundedBy: req.user.id,
        refundedAt: new Date()
      };
      
      // Remettre à jour la capacité
      if (event.capacity && event.capacity.total) {
        event.capacity.remaining = Math.min(
          event.capacity.total,
          event.capacity.remaining + booking.numberOfPersons
        );
      }
      
      event.bookingsCount = event.bookings.filter(b => b.paymentStatus === 'confirmed').length;
      
      await event.save();
      
      console.log(`💰 Réservation ${booking.bookingReference} remboursée`);
      
      return res.json({
        success: true,
        message: "Réservation remboursée avec succès",
        data: {
          bookingReference: booking.bookingReference,
          refundAmount: booking.refundInfo.amount,
          newStatus: 'refunded'
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur remboursement:', error);
      return res.status(500).json({
        success: false,
        message: "Une erreur interne s'est produite."
      });
    }
  }
);

/**
 * Supprimer un événement (soft delete)
 * DELETE /api/events/admin/:eventId
 */
router.delete(
  '/admin/:eventId',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  eventController.deleteEventDetails
);

/**
 * Restaurer un événement supprimé
 * POST /api/events/admin/:eventId/restore
 */
router.post(
  '/admin/:eventId/restore',
  verifyToken,
  checkRole(['superAdmin']),
  eventController.restoreEventDetails
);

/**
 * Synchroniser les données des événements
 * POST /api/events/admin/sync-data
 */
router.post(
  '/admin/sync-data',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  eventController.syncEventData
);

// ===== ROUTES DE MAINTENANCE (ADMIN UNIQUEMENT) =====

/**
 * Réparer les données incohérentes des événements
 * POST /api/events/maintenance/repair
 */
router.post(
  '/maintenance/repair',
  verifyToken,
  checkRole(['superAdmin']),
  async (req, res) => {
    try {
      console.log('🔧 Début de la réparation des données événements...');
      
      const EventDetails = require('../models/EventDetails');
      
      const events = await EventDetails.find({ isActive: true });
      let repaired = 0;
      
      for (const event of events) {
        let hasChanges = false;
        
        // Recalculer les ratings
        const oldRating = event.averageRating;
        event.calculateAverageRating();
        
        if (Math.abs(oldRating - event.averageRating) > 0.01) {
          hasChanges = true;
        }
        
        // Vérifier la cohérence des compteurs de favoris
        const actualFavoritesCount = event.favoritedBy ? event.favoritedBy.length : 0;
        if (event.favoritesCount !== actualFavoritesCount) {
          event.favoritesCount = actualFavoritesCount;
          hasChanges = true;
        }
        
        // Vérifier la cohérence des réservations
        const actualBookingsCount = event.bookings ? event.bookings.filter(b => b.paymentStatus === 'confirmed').length : 0;
        if (event.bookingsCount !== actualBookingsCount) {
          event.bookingsCount = actualBookingsCount;
          hasChanges = true;
        }
        
        // Vérifier la disponibilité automatique
        if (event.checkAvailability) {
          const shouldBeAvailable = event.checkAvailability();
          if (event.isAvailable !== shouldBeAvailable) {
            event.isAvailable = shouldBeAvailable;
            hasChanges = true;
          }
        }
        
        // Vérifier la structure des prix
        if (event.price && event.priceRange) {
          // Cohérence entre prix catégories et priceRange
          if (event.price.solo || event.price.couple || event.price.group) {
            const prices = [];
            if (event.price.solo) prices.push(parseFloat(event.price.solo.replace(/[^\d]/g, "")));
            if (event.price.couple) prices.push(parseFloat(event.price.couple.replace(/[^\d]/g, "")));
            if (event.price.group) prices.push(parseFloat(event.price.group.replace(/[^\d]/g, "")));
            
            if (prices.length > 0) {
              const newMin = Math.min(...prices);
              const newMax = Math.max(...prices);
              
              if (event.priceRange.min !== newMin || event.priceRange.max !== newMax) {
                event.priceRange.min = newMin;
                event.priceRange.max = newMax;
                hasChanges = true;
              }
            }
          }
        }
        
        // Vérifier les dates d'événements
        if (event.eventDates && event.eventDates.startDate && event.eventDates.endDate) {
          if (event.eventDates.startDate >= event.eventDates.endDate) {
            console.warn(`⚠️ Dates incohérentes pour ${event.title}`);
          }
        }
        
        if (hasChanges) {
          await event.save();
          repaired++;
          console.log(`✅ Réparé: ${event.title}`);
        }
      }
      
      console.log(`🎉 Réparation terminée: ${repaired} événements corrigés`);
      
      return res.json({
        success: true,
        message: `Réparation terminée: ${repaired} événements corrigés`,
        data: { repaired }
      });
      
    } catch (error) {
      console.error('❌ Erreur réparation événements:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la réparation"
      });
    }
  }
);

/**
 * Vérifier l'intégrité des données des événements
 * GET /api/events/maintenance/verify
 */
router.get(
  '/maintenance/verify',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      const EventDetails = require('../models/EventDetails');
      
      console.log('🔍 Vérification de l\'intégrité des données événements...');
      
      const issues = [];
      const events = await EventDetails.find({ isActive: true });
      
      for (const event of events) {
        // Vérifier la structure des prix
        const hasFixedPrice = event.fixedPrice && event.fixedPrice > 0;
        const hasCategoryPrice = event.price && (event.price.solo || event.price.couple || event.price.group);
        
        if (!hasFixedPrice && !hasCategoryPrice) {
          issues.push({
            type: 'invalid_price_structure',
            eventId: event._id,
            eventTitle: event.title,
            currentPrice: { fixed: event.fixedPrice, categories: event.price }
          });
        }
        
        // Vérifier les coordonnées
        if (!event.coordinates || !event.coordinates.latitude || !event.coordinates.longitude) {
          issues.push({
            type: 'missing_coordinates',
            eventId: event._id,
            eventTitle: event.title
          });
        }
        
        // Vérifier les dates d'événement
        if (!event.eventDates || !event.eventDates.startDate || !event.eventDates.endDate) {
          issues.push({
            type: 'missing_event_dates',
            eventId: event._id,
            eventTitle: event.title
          });
        } else if (event.eventDates.startDate >= event.eventDates.endDate) {
          issues.push({
            type: 'invalid_event_dates',
            eventId: event._id,
            eventTitle: event.title,
            startDate: event.eventDates.startDate,
            endDate: event.eventDates.endDate
          });
        }
        
        // Vérifier l'organisateur
        if (!event.organisateur || event.organisateur.trim().length === 0) {
          issues.push({
            type: 'missing_organizer',
            eventId: event._id,
            eventTitle: event.title
          });
        }
        
        // Vérifier la cohérence des statistiques
        const actualReviewsCount = event.reviews ? event.reviews.length : 0;
        if (event.totalReviews !== actualReviewsCount) {
          issues.push({
            type: 'reviews_count_mismatch',
            eventId: event._id,
            eventTitle: event.title,
            storedCount: event.totalReviews,
            actualCount: actualReviewsCount
          });
        }
        
        const actualBookingsCount = event.bookings ? event.bookings.filter(b => b.paymentStatus === 'confirmed').length : 0;
        if (event.bookingsCount !== actualBookingsCount) {
          issues.push({
            type: 'bookings_count_mismatch',
            eventId: event._id,
            eventTitle: event.title,
            storedCount: event.bookingsCount,
            actualCount: actualBookingsCount
          });
        }
        
        // Vérifier les champs obligatoires
        const requiredFields = ['title', 'description', 'location', 'region_Name', 'category', 'date', 'time'];
        for (const field of requiredFields) {
          if (!event[field] || event[field].toString().trim().length === 0) {
            issues.push({
              type: 'missing_required_field',
              eventId: event._id,
              eventTitle: event.title,
              missingField: field
            });
          }
        }
        
        // Vérifier la catégorie
        const validCategories = ['festival', 'excursion', 'nightlife', 'conference', 'culture', 'sport', 'atelier', 'plage', 'gastronomie', 'art', 'musique', 'danse', 'autre'];
        if (!validCategories.includes(event.category)) {
          issues.push({
            type: 'invalid_category',
            eventId: event._id,
            eventTitle: event.title,
            currentCategory: event.category
          });
        }
        
        // Vérifier la disponibilité passée
        if (event.eventDates && event.eventDates.startDate && new Date(event.eventDates.startDate) < new Date() && event.isAvailable) {
          issues.push({
            type: 'past_event_still_available',
            eventId: event._id,
            eventTitle: event.title,
            eventDate: event.eventDates.startDate
          });
        }
      }
      
      console.log(`✅ Vérification terminée: ${issues.length} problèmes détectés`);
      
      return res.json({
        success: true,
        data: {
          totalChecked: events.length,
          issuesFound: issues.length,
          issues: issues,
          issuesByType: issues.reduce((acc, issue) => {
            acc[issue.type] = (acc[issue.type] || 0) + 1;
            return acc;
          }, {})
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur vérification événements:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la vérification"
      });
    }
  }
);

/**
 * Mise à jour automatique des statuts hasFullDetails
 * POST /api/events/maintenance/update-completion-status
 */
router.post(
  '/maintenance/update-completion-status',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      console.log('🔄 Mise à jour des statuts de complétion...');
      
      const EventDetails = require('../models/EventDetails');
      const { calculateEventCompletionStatus } = require('../controllers/EventController');
      
      const events = await EventDetails.find({ isActive: true });
      let updated = 0;
      
      for (const event of events) {
        const completionStatus = calculateEventCompletionStatus(event);
        const shouldHaveFullDetails = completionStatus.percentage >= 80;
        
        if (event.hasFullDetails !== shouldHaveFullDetails) {
          event.hasFullDetails = shouldHaveFullDetails;
          await event.save();
          updated++;
          console.log(`✅ Statut mis à jour: ${event.title} - ${completionStatus.percentage}%`);
        }
      }
      
      console.log(`🎉 Mise à jour terminée: ${updated} événements mis à jour`);
      
      return res.json({
        success: true,
        message: `Mise à jour terminée: ${updated} événements mis à jour`,
        data: { 
          updated,
          totalProcessed: events.length 
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur mise à jour statuts:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour des statuts"
      });
    }
  }
);

/**
 * Mise à jour automatique de la disponibilité des événements
 * POST /api/events/maintenance/update-availability
 */
router.post(
  '/maintenance/update-availability',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      console.log('📅 Mise à jour de la disponibilité des événements...');
      
      const EventDetails = require('../models/EventDetails');
      const events = await EventDetails.find({ isActive: true });
      
      let updated = 0;
      const now = new Date();
      
      for (const event of events) {
        let hasChanges = false;
        
        // Vérifier si l'événement est passé
        if (event.eventDates && event.eventDates.startDate && new Date(event.eventDates.startDate) < now) {
          if (event.isAvailable) {
            event.isAvailable = false;
            hasChanges = true;
          }
        }
        
        // Vérifier la capacité si définie
        if (event.capacity && event.capacity.total && event.capacity.remaining <= 0) {
          if (event.isAvailable) {
            event.isAvailable = false;
            hasChanges = true;
          }
        }
        
        // Utiliser la méthode du modèle si disponible
        if (event.checkAvailability && typeof event.checkAvailability === 'function') {
          const shouldBeAvailable = event.checkAvailability();
          if (event.isAvailable !== shouldBeAvailable) {
            event.isAvailable = shouldBeAvailable;
            hasChanges = true;
          }
        }
        
        if (hasChanges) {
          await event.save();
          updated++;
          console.log(`✅ Disponibilité mise à jour: ${event.title} - ${event.isAvailable ? 'Disponible' : 'Indisponible'}`);
        }
      }
      
      console.log(`🎉 Mise à jour terminée: ${updated} événements mis à jour`);
      
      return res.json({
        success: true,
        message: `Mise à jour de disponibilité terminée: ${updated} événements mis à jour`,
        data: { 
          updated,
          totalProcessed: events.length,
          currentDate: now
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur mise à jour disponibilité:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de la disponibilité"
      });
    }
  }
);

/**
 * Nettoyage d'urgence des événements avec données corrompues
 * DELETE /api/events/maintenance/emergency-cleanup
 * Body: { confirm: 'YES_CLEANUP_CORRUPTED_EVENTS' }
 */
router.delete(
  '/maintenance/emergency-cleanup',
  verifyToken,
  checkRole(['superAdmin']),
  async (req, res) => {
    try {
      const { confirm } = req.body;
      
      if (confirm !== 'YES_CLEANUP_CORRUPTED_EVENTS') {
        return res.status(400).json({
          success: false,
          message: "Confirmation requise. Utilisez: { confirm: 'YES_CLEANUP_CORRUPTED_EVENTS' }"
        });
      }
      
      console.log('🚨 NETTOYAGE D\'URGENCE - Suppression des événements corrompus...');
      
      const EventDetails = require('../models/EventDetails');
      const corruptedEvents = [];
      const events = await EventDetails.find({ isActive: true });
      
      for (const event of events) {
        let isCorrupted = false;
        
        // Critères de corruption
        if (!event.title || event.title.trim().length === 0) isCorrupted = true;
        if (!event.description || event.description.trim().length < 10) isCorrupted = true;
        if (!event.region_Name || event.region_Name.trim().length === 0) isCorrupted = true;
        if (!event.category || event.category.trim().length === 0) isCorrupted = true;
        if (!event.organisateur || event.organisateur.trim().length === 0) isCorrupted = true;
        
        // Vérifier les prix
        const hasFixedPrice = event.fixedPrice && event.fixedPrice > 0;
        const hasCategoryPrice = event.price && (event.price.solo || event.price.couple || event.price.group);
        if (!hasFixedPrice && !hasCategoryPrice) isCorrupted = true;
        
        // Vérifier les dates
        if (!event.eventDates || !event.eventDates.startDate || !event.eventDates.endDate) isCorrupted = true;
        
        if (isCorrupted) {
          corruptedEvents.push(event);
        }
      }
      
      // Supprimer les événements corrompus
      for (const event of corruptedEvents) {
        event.isActive = false;
        event.lastEditedBy = {
          userId: req.user.id,
          role: req.user.role,
          username: req.user.username,
          editedAt: new Date()
        };
        await event.save();
      }
      
      console.log(`🧹 Nettoyage terminé: ${corruptedEvents.length} événements corrompus supprimés`);
      
      return res.json({
        success: true,
        message: `Nettoyage terminé: ${corruptedEvents.length} événements corrompus supprimés`,
        data: {
          corruptedEventsRemoved: corruptedEvents.length,
          corruptedEvents: corruptedEvents.map(e => ({
            id: e._id,
            title: e.title,
            region: e.region_Name,
            category: e.category,
            organisateur: e.organisateur
          }))
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur nettoyage d\'urgence événements:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors du nettoyage"
      });
    }
  }
);

/**
 * Recalculer toutes les statistiques des événements
 * POST /api/events/maintenance/recalculate-stats
 */
router.post(
  '/maintenance/recalculate-stats',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      console.log('📊 Recalcul de toutes les statistiques événements...');
      
      const EventDetails = require('../models/EventDetails');
      const events = await EventDetails.find({ isActive: true });
      
      let processed = 0;
      
      for (const event of events) {
        // Recalculer ratings et compteurs
        if (event.calculateAverageRating && typeof event.calculateAverageRating === 'function') {
          event.calculateAverageRating();
        }
        
        // Recalculer compteur favoris
        event.favoritesCount = event.favoritedBy ? event.favoritedBy.length : 0;
        
        // Recalculer compteur réservations confirmées
        const confirmedBookings = event.bookings ? event.bookings.filter(b => b.paymentStatus === 'confirmed') : [];
        event.bookingsCount = confirmedBookings.length;
        
        // Recalculer capacité restante si définie
        if (event.capacity && event.capacity.total) {
          const totalBookedPersons = confirmedBookings.reduce((sum, booking) => sum + (booking.numberOfPersons || 0), 0);
          event.capacity.remaining = Math.max(0, event.capacity.total - totalBookedPersons);
        }
        
        // Recalculer compteur vues (garder existant)
        event.viewsCount = event.viewsCount || 0;
        
        await event.save();
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`📊 Traité: ${processed}/${events.length} événements`);
        }
      }
      
      console.log(`🎉 Recalcul terminé: ${processed} événements traités`);
      
      return res.json({
        success: true,
        message: `Recalcul terminé: ${processed} événements traités`,
        data: { processed }
      });
      
    } catch (error) {
      console.error('❌ Erreur recalcul statistiques:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors du recalcul des statistiques"
      });
    }
  }
);

/**
 * Générer rapport de santé des événements
 * GET /api/events/maintenance/health-report
 */
router.get(
  '/maintenance/health-report',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  async (req, res) => {
    try {
      console.log('🏥 Génération du rapport de santé des événements...');
      
      const EventDetails = require('../models/EventDetails');
      
      // Statistiques générales
      const totalEvents = await EventDetails.countDocuments({ isActive: true });
      const totalDeleted = await EventDetails.countDocuments({ isActive: false });
      
      // Événements par statut
      const availableEvents = await EventDetails.countDocuments({ isActive: true, isAvailable: true });
      const upcomingEvents = await EventDetails.countDocuments({ 
        isActive: true, 
        'eventDates.startDate': { $gt: new Date() }
      });
      const pastEvents = await EventDetails.countDocuments({ 
        isActive: true, 
        'eventDates.startDate': { $lt: new Date() }
      });
      
      // Événements par catégorie
      const eventsByCategory = await EventDetails.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Événements par région
      const eventsByRegion = await EventDetails.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$region_Name', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Événements avec des problèmes potentiels
      const eventsWithoutImages = await EventDetails.countDocuments({ 
        isActive: true, 
        $or: [
          { images: { $exists: false } },
          { images: { $size: 0 } }
        ]
      });
      
      const eventsWithoutCoordinates = await EventDetails.countDocuments({ 
        isActive: true, 
        $or: [
          { coordinates: { $exists: false } },
          { 'coordinates.latitude': { $exists: false } },
          { 'coordinates.longitude': { $exists: false } }
        ]
      });
      
      const eventsWithIncompleteDetails = await EventDetails.countDocuments({ 
        isActive: true, 
        hasFullDetails: false
      });
      
      // Statistiques de réservations
      const totalBookingsStats = await EventDetails.aggregate([
        { $match: { isActive: true } },
        { 
          $group: { 
            _id: null, 
            totalBookings: { $sum: '$bookingsCount' },
            totalViews: { $sum: '$viewsCount' },
            totalFavorites: { $sum: '$favoritesCount' },
            averageRating: { $avg: '$averageRating' }
          } 
        }
      ]);
      const stats = totalBookingsStats[0] || {
        totalBookings: 0,
        totalViews: 0,
        totalFavorites: 0,
        averageRating: 0
      };
      
      // Événements populaires (top 5)
      const popularEvents = await EventDetails.find({ isActive: true })
        .sort({ viewsCount: -1, favoritesCount: -1 })
        .limit(5)
        .select('title viewsCount favoritesCount bookingsCount averageRating')
        .lean();
      
      // Événements récents
      const recentEvents = await EventDetails.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt category region_Name')
        .lean();
      
      const healthReport = {
        overview: {
          totalEvents,
          totalDeleted,
          availableEvents,
          upcomingEvents,
          pastEvents,
          healthScore: Math.round((availableEvents / totalEvents) * 100) || 0
        },
        distribution: {
          byCategory: eventsByCategory,
          byRegion: eventsByRegion
        },
        issues: {
          eventsWithoutImages,
          eventsWithoutCoordinates,
          eventsWithIncompleteDetails,
          totalIssues: eventsWithoutImages + eventsWithoutCoordinates + eventsWithIncompleteDetails
        },
        engagement: {
          totalBookings: stats.totalBookings,
          totalViews: stats.totalViews,
          totalFavorites: stats.totalFavorites,
          averageRating: parseFloat((stats.averageRating || 0).toFixed(1)),
          averageBookingsPerEvent: totalEvents > 0 ? Math.round(stats.totalBookings / totalEvents) : 0,
          averageViewsPerEvent: totalEvents > 0 ? Math.round(stats.totalViews / totalEvents) : 0
        },
        topPerformers: {
          popularEvents,
          recentEvents
        },
        recommendations: []
      };
      
      // Générer des recommandations
      if (healthReport.issues.totalIssues > totalEvents * 0.1) {
        healthReport.recommendations.push("Corriger les problèmes de données détectés (images, coordonnées, détails incomplets)");
      }
      
      if (healthReport.overview.healthScore < 70) {
        healthReport.recommendations.push("Améliorer la disponibilité des événements");
      }
      
      if (healthReport.engagement.averageRating < 4.0) {
        healthReport.recommendations.push("Améliorer la qualité des événements pour augmenter les notes");
      }
      
      if (upcomingEvents < totalEvents * 0.3) {
        healthReport.recommendations.push("Ajouter plus d'événements à venir pour maintenir l'engagement");
      }
      
      console.log(`📊 Rapport de santé généré - Score: ${healthReport.overview.healthScore}%`);
      
      return res.json({
        success: true,
        data: healthReport
      });
      
    } catch (error) {
      console.error('❌ Erreur génération rapport santé:', error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la génération du rapport"
      });
    }
  }
);

// ===== MIDDLEWARE DE GESTION D'ERREURS SPÉCIFIQUE =====
router.use((err, req, res, next) => {
  console.error('❌ Erreur dans eventRoutes:', err);
  
  // Gestion spécifique pour les erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Gestion spécifique pour les erreurs de cast (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID d\'événement invalide'
    });
  }
  
  // Gestion spécifique pour les erreurs de duplication
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Cet événement existe déjà'
    });
  }
  
  // Gestion spécifique pour les fichiers trop volumineux
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Le fichier est trop volumineux'
    });
  }
  
  // Gestion spécifique pour les erreurs Multer
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'Fichier trop volumineux (max 10MB par image)'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({
        success: false,
        message: 'Trop d\'images (max 12 images)'
      });
    }
  }
  
  // Gestion spécifique pour les erreurs de réservation
  if (err.message && err.message.includes('disponible')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // Gestion spécifique pour les erreurs de capacité
  if (err.message && err.message.includes('capacité')) {
    return res.status(400).json({
      success: false,
      message: 'Événement complet'
    });
  }
  
  // Gestion spécifique pour les erreurs de paiement
  if (err.message && err.message.includes('paiement')) {
    return res.status(400).json({
      success: false,
      message: 'Erreur lors du traitement du paiement'
    });
  }
  
  // Gestion spécifique pour les erreurs de dates
  if (err.message && err.message.includes('date')) {
    return res.status(400).json({
      success: false,
      message: 'Dates d\'événement invalides'
    });
  }
  
  // Erreur générale
  return res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
  });
});

module.exports = router;
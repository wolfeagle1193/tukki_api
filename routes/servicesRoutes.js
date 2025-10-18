// routes/servicesRoutes.js - ROUTES DÉDIÉES AUX SERVICES
const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const { verifyToken } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');

// ===== ROUTES PUBLIQUES =====

// ✅ Obtenir la liste de tous les services disponibles
// GET /api/services/available
router.get('/available', servicesController.getAvailableServices);

// ✅ Obtenir les services d'un trésor spécifique
// GET /api/services/treasure/:treasureId
router.get('/treasure/:treasureId', servicesController.getTreasureServices);

// ===== ROUTES PROTÉGÉES - ADMIN SEULEMENT =====

// ✅ Mettre à jour tous les services d'un trésor
// PUT /api/services/treasure/:treasureId
router.put(
    '/treasure/:treasureId',
    verifyToken, // Authentification requise
    checkRole(['superAdmin', 'maintenancier']), // Vérification du rôle admin
    servicesController.updateTreasureServices
);

// ✅ Ajouter un service à un trésor
// POST /api/services/treasure/:treasureId/add
router.post(
    '/treasure/:treasureId/add',
    verifyToken, // Authentification requise
    checkRole(['superAdmin', 'maintenancier']), // Vérification du rôle admin
    servicesController.addServiceToTreasure
);

// ✅ Supprimer un service d'un trésor
// DELETE /api/services/treasure/:treasureId/:serviceType
router.delete(
    '/treasure/:treasureId/:serviceType',
    verifyToken, // Authentification requise
    checkRole(['superAdmin', 'maintenancier']), // Vérification du rôle admin
    servicesController.removeServiceFromTreasure
);

// ===== ROUTES ADMIN - STATISTIQUES =====

// ✅ Obtenir les statistiques globales des services
// GET /api/services/stats
router.get(
    '/stats',
    verifyToken, // Authentification requise
    checkRole(['superAdmin', 'maintenancier']), // Vérification du rôle admin
    servicesController.getServicesStats
);

// ===== MIDDLEWARE DE GESTION D'ERREURS SPÉCIFIQUE =====
router.use((err, req, res, next) => {
    console.error('❌ Erreur dans servicesRoutes:', err);
    
    // Gestion spécifique pour les erreurs de validation
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Erreur de validation des données',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    
    // Gestion spécifique pour les erreurs de cast (ID invalide)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'ID de trésor invalide'
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
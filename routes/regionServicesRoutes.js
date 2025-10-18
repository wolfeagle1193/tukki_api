// routes/regionServicesRoutes.js - ROUTES DÉDIÉES AUX SERVICES DES RÉGIONS
const express = require('express');
const router = express.Router();
const regionServicesController = require('../controllers/regionServicesController');
const { verifyToken } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');

// ===== ROUTES PUBLIQUES =====

// ✅ Obtenir la liste de tous les services disponibles
// GET /api/region-services/available
router.get('/available', regionServicesController.getAvailableServices);

// ✅ Obtenir les services d'une région spécifique
// GET /api/region-services/region/:regionId
router.get('/region/:regionId', regionServicesController.getRegionServices);

// ===== ROUTES PROTÉGÉES - ADMIN SEULEMENT =====

// ✅ Mettre à jour tous les services d'une région
// PUT /api/region-services/region/:regionId
router.put(
    '/region/:regionId',
    verifyToken, // Authentification requise
    checkRole(['superAdmin', 'maintenancier']), // Vérification du rôle admin
    regionServicesController.updateRegionServices
);

// ✅ Ajouter un service à une région
// POST /api/region-services/region/:regionId/add
router.post(
    '/region/:regionId/add',
    verifyToken, // Authentification requise
    checkRole(['superAdmin', 'maintenancier']), // Vérification du rôle admin
    regionServicesController.addServiceToRegion
);

// ✅ Supprimer un service d'une région
// DELETE /api/region-services/region/:regionId/:serviceType
router.delete(
    '/region/:regionId/:serviceType',
    verifyToken, // Authentification requise
    checkRole(['superAdmin', 'maintenancier']), // Vérification du rôle admin
    regionServicesController.removeServiceFromRegion
);

// ===== ROUTES ADMIN - STATISTIQUES =====

// ✅ Obtenir les statistiques globales des services
// GET /api/region-services/stats
router.get(
    '/stats',
    verifyToken, // Authentification requise
    checkRole(['superAdmin', 'maintenancier']), // Vérification du rôle admin
    regionServicesController.getServicesStats
);

// ===== MIDDLEWARE DE GESTION D'ERREURS SPÉCIFIQUE =====
router.use((err, req, res, next) => {
    console.error('❌ Erreur dans regionServicesRoutes:', err);
    
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
            message: 'ID de région invalide'
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
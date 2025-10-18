const express = require('express');
const router = express.Router();
const bestHotelController = require('../controllers/HotelController');
const { verifyToken } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');
const { uploadWithErrorHandling } = require('../middlewares/uploads');

// Route de test pour vérifier l'upload
router.post(
  '/test-upload',
  uploadWithErrorHandling('placeImage'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Aucun fichier n'a été téléchargé" 
      });
    }
    res.json({ 
      success: true,
      message: "Upload réussi", 
      file: req.file 
    });
  }
);

// Route pour créer un meilleur hôtel
router.post(
  '/createBestHotel',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  uploadWithErrorHandling('placeImage'), 
  bestHotelController.createBestHotel
);

// Route pour modifier un hôtel
router.put(
  '/modifyBestHotel/:id',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  uploadWithErrorHandling('placeImage'),
  bestHotelController.updateBestHotel
);

// Route pour supprimer un hôtel
router.delete(
  '/deleteBestHotel/:id',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  bestHotelController.deleteBestHotel
);

// Routes publiques - accessibles par tous
router.get('/getBestHotels', bestHotelController.getBestHotels);

// Nouvelle route pour obtenir les hôtels par région - accessible par tous
router.get('/getHotelsByRegion/:regionId', bestHotelController.getHotelsByRegion);

module.exports = router;
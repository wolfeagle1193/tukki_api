const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController'); // Adjust the path as necessary
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

// Route pour créer une région
router.post(
  '/createRegion',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  uploadWithErrorHandling('placeImage'), 
  regionController.createRegion
);

// Route pour modifier une région
router.put(
  '/modifyRegion/:id',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  uploadWithErrorHandling('placeImage'),
  regionController.updateRegion
);

// Route pour supprimer une région
router.delete(
  '/deleteRegion/:id',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  regionController.deleteRegion
);

// Route publique - accessible par tous
router.get('/getRegion', regionController.getRegions);

module.exports = router;
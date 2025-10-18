
const express = require('express');
const router = express.Router();
const treasureController = require('../controllers/treasureController');
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

router.post(
    '/createTreasure',
    verifyToken,
    checkRole(['superAdmin', 'maintenancier']),
    uploadWithErrorHandling('placeImage'), 
    treasureController.createTreasure
  );

router.put(
  '/modifyTreasure/:id',
  verifyToken,
  checkRole(['superAdmin', 'maintenancier']),
  uploadWithErrorHandling('placeImage'),
  treasureController.updateTreasure
);



router.delete(
    '/deleteTreasure/:id',
    verifyToken,
    checkRole(['superAdmin', 'maintenancier']),
    treasureController.deleteTreasure
  );

// Route publique - accessible par tous
router.get('/getTreasure', treasureController.getTreasures);

module.exports = router
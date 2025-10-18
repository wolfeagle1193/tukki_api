

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/jwt_token');
const { checkRole } = require('../middlewares/checkRole');
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');

// Configuration de Multer pour les téléversements d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Dossier temporaire pour les téléversements
    cb(null, path.join(process.cwd(), 'temp'));
  },
  filename: function (req, file, cb) {
    // Générer un nom unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Filtre pour s'assurer que seules les images sont téléversées
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Routes pour tous les utilisateurs authentifiés
router.get('/getUser', verifyToken, userController.getUser);
router.delete('/deleteUser', verifyToken, userController.deleteUser);

// Ajouter la route pour la mise à jour du profil
router.put('/updateProfile', verifyToken, upload.single('profileImage'), userController.updateUserProfile);


// ⭐ NOUVELLE ROUTE : Supprimer MA photo de profil
router.delete('/deleteMyPicture', verifyToken, userController.deleteMyUserPicture);

// Routes réservées aux administrateurs
// Route racine pour le dashboard
router.get('/', verifyToken, checkRole(['admin', 'superAdmin','maintenancier']), userController.getAllUsers);
router.get('/getAllUsers', verifyToken, checkRole(['admin', 'superAdmin']), userController.getAllUsers);
router.put('/updateRole', verifyToken, checkRole(['admin', 'superAdmin']), userController.updateUserRole);

module.exports = router;
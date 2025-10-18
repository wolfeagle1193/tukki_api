
// =====================================================================
// 🔧 MIDDLEWARE UPLOAD - MISE À JOUR SAFE (GARDER CE QUI FONCTIONNE)
// =====================================================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ CONSERVÉ : fs-extra pour ensureDirSync
const fsExtra = require('fs-extra');

// ✅ CONSERVÉ : Configuration du stockage temporaire (INCHANGÉE)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(process.cwd(), 'temp');
    
    // Créer le dossier temp s'il n'existe pas
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

// ✅ MISE À JOUR : Filtre pour valider les types de fichiers (SUPPRESSION popularPlaceImages)
const fileFilter = (req, file, cb) => {
  console.log(`📁 Fichier reçu: ${file.originalname}, champ: ${file.fieldname}, type: ${file.mimetype}`);
  
  // ✅ CHAMPS AUTORISÉS (SUPPRIMÉ popularPlaceImages)
  const allowedFields = ['image', 'photo', 'profileImage', 'gallery'];
  
  // Vérifier que le champ est autorisé
  if (!allowedFields.includes(file.fieldname)) {
    console.log(`❌ Champ non autorisé: ${file.fieldname}`);
    const error = new Error(`Champ non autorisé: ${file.fieldname}`);
    error.code = 'INVALID_FIELD';
    return cb(error, false);
  }
  
  // Accepter seulement les images
  if (file.mimetype.startsWith('image/')) {
    console.log(`✅ Fichier accepté: ${file.originalname} (champ: ${file.fieldname})`);
    cb(null, true);
  } else {
    const error = new Error('Seules les images sont autorisées');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// ✅ CONSERVÉ : Configuration de base pour multer
const multerConfig = {
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max (pour compatibilité avec vos trésors)
    files: 10 // Maximum de fichiers
  }
};

// ✅ CONSERVÉ : FONCTION PRINCIPALE RESTAURÉE (pour vos trésors)
const uploadWithErrorHandling = (fieldName = 'image', multiple = false) => {
  const upload = multiple 
    ? multer(multerConfig).array(fieldName, 10)
    : multer(multerConfig).single(fieldName);
    
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        console.error('❌ Erreur multer:', err);
        
        let message = 'Erreur lors de l\'upload du fichier';
        let statusCode = 400;
        
        // Gestion des différents types d'erreurs multer
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              message = 'Le fichier est trop volumineux (max: 10MB)';
              break;
            case 'LIMIT_FILE_COUNT':
              message = 'Trop de fichiers (max: 10)';
              break;
            case 'LIMIT_UNEXPECTED_FILE':
              message = `Champ de fichier inattendu: ${err.field}`;
              break;
            default:
              message = `Erreur multer: ${err.message}`;
          }
        } else if (err.code === 'INVALID_FILE_TYPE') {
          message = err.message;
        } else if (err.code === 'INVALID_FIELD') {
          message = err.message;
        } else {
          message = err.message || 'Erreur inconnue lors de l\'upload';
          statusCode = 500;
        }
        
        return res.status(statusCode).json({
          success: false,
          message: message,
          error: err.code || 'UPLOAD_ERROR'
        });
      }
      
      // Log pour débogage
      if (req.file) {
        console.log('✅ Fichier uploadé:', {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path
        });
      } else if (req.files) {
        console.log(`✅ ${req.files.length} fichiers uploadés`);
      }
      
      next();
    });
  };
};

// ✅ MISE À JOUR : MIDDLEWARE SPÉCIALISÉ POUR RÉGION DETAILS (SUPPRESSION popularPlaceImages)
const uploadRegionDetailsWithErrorHandling = () => {
  console.log('🔧 === CRÉATION MIDDLEWARE UPLOAD REGION DETAILS (VERSION ÉPURÉE) ===');
  
  // ✅ CONSERVÉ : VÉRIFICATION DES DÉPENDANCES
  if (!multer) {
    console.error('❌ ERREUR CRITIQUE: multer non disponible');
    throw new Error('multer non disponible');
  }
  
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
        
        try {
          // ✅ CONSERVÉ : UTILISER fs-extra OU fallback
          if (fsExtra && fsExtra.ensureDirSync) {
            fsExtra.ensureDirSync(uploadDir);
          } else {
            // Fallback avec fs natif
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
          }
          console.log(`✅ Dossier upload créé/vérifié: ${uploadDir}`);
          cb(null, uploadDir);
        } catch (dirError) {
          console.error('❌ Erreur création dossier upload:', dirError);
          cb(dirError, null);
        }
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${Math.round(Math.random() * 1E9)}_${file.originalname}`;
        cb(null, uniqueName);
      }
    }),
    fileFilter: (req, file, cb) => {
      console.log(`📁 RegionDetails - Fichier reçu: ${file.originalname}, champ: ${file.fieldname}`);
      
      if (file.mimetype.startsWith('image/')) {
        console.log(`✅ Fichier accepté: ${file.originalname}`);
        cb(null, true);
      } else {
        console.log(`❌ Type rejeté: ${file.mimetype}`);
        cb(new Error(`Type de fichier non supporté: ${file.mimetype}`), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024,   // 10MB par fichier
      files: 10,                    // ✅ RÉDUIT : 10 fichiers max (au lieu de 15)
      fieldSize: 5 * 1024 * 1024,   // 5MB pour champs texte
      parts: 50                     // 50 parties max
    }
  }).fields([
    { name: 'gallery', maxCount: 5 }
    // ❌ SUPPRIMÉ : { name: 'popularPlaceImages', maxCount: 10 }
  ]);
    
  const middleware = (req, res, next) => {
    console.log('🚀 === MIDDLEWARE UPLOAD REGION DETAILS (VERSION ÉPURÉE) ===');
    
    // ✅ CONSERVÉ : TIMEOUTS ULTRA-ÉTENDUS
    if (req.socket) {
      req.socket.setTimeout(35 * 60 * 1000); // 35 MINUTES
      console.log('⏰ Middleware: Socket timeout 35 minutes');
    }
    
    upload(req, res, (err) => {
      if (err) {
        console.error('❌ === ERREUR UPLOAD MIDDLEWARE ===');
        console.error('Type:', err.constructor.name);
        console.error('Code:', err.code);
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        
        let message = 'Erreur upload';
        let statusCode = 400;
        
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              message = 'Fichier trop volumineux (max: 10MB par fichier)';
              statusCode = 413;
              break;
            case 'LIMIT_FILE_COUNT':
              message = 'Trop de fichiers (max: 10 total)'; // ✅ MISE À JOUR : 10 au lieu de 15
              statusCode = 413;
              break;
            case 'LIMIT_FIELD_VALUE':
              message = 'Champ trop volumineux (max: 5MB)';
              statusCode = 413;
              break;
            case 'LIMIT_UNEXPECTED_FILE':
              message = `Champ de fichier inattendu: ${err.field}`;
              statusCode = 400;
              break;
            default:
              message = `Erreur upload: ${err.message}`;
          }
        } else {
          message = err.message || 'Erreur upload inconnue';
          statusCode = 500;
        }
        
        return res.status(statusCode).json({
          success: false,
          message: message,
          error: err.code || 'UPLOAD_ERROR',
          timestamp: new Date().toISOString()
        });
      }
      
      if (req.files) {
        const totalFiles = Object.values(req.files).flat().length;
        const totalSize = Object.values(req.files).flat()
          .reduce((sum, file) => sum + file.size, 0);
        
        console.log('✅ === UPLOAD MIDDLEWARE RÉUSSI ===');
        console.log(`📊 ${totalFiles} fichiers reçus, ${Math.round(totalSize / 1024)}KB total`);
        
        // Log détaillé par type
        Object.keys(req.files).forEach(fieldName => {
          const files = req.files[fieldName];
          console.log(`📁 ${fieldName}: ${files.length} fichier(s)`);
          files.forEach((file, index) => {
            console.log(`  📄 ${index}: ${file.originalname} (${Math.round(file.size/1024)}KB)`);
          });
        });
      } else {
        console.log('📊 Aucun fichier reçu');
      }
      
      console.log('✅ === MIDDLEWARE UPLOAD TERMINÉ ===');
      next();
    });
  };
  
  console.log('✅ Middleware uploadRegionDetailsWithErrorHandling créé avec succès (version épurée)');
  return middleware;
};

// ✅ CONSERVÉ : Middleware spécifique pour les photos communautaires
const uploadCommunityPhotoWithErrorHandling = (fieldName = 'photo') => {
  console.log(`🔧 Création middleware photo communautaire pour champ: ${fieldName}`);
  return uploadWithErrorHandling(fieldName, false);
};

// ✅ CONSERVÉ : Middleware pour les profils utilisateur
const uploadProfileImageWithErrorHandling = (fieldName = 'profileImage') => {
  console.log(`🔧 Création middleware image profil pour champ: ${fieldName}`);
  return uploadWithErrorHandling(fieldName, false);
};

// ✅ MISE À JOUR : FONCTION DE TEST (mise à jour des messages)
const testUploadMiddlewares = () => {
  console.log('🧪 === TEST DES MIDDLEWARES (VERSION ÉPURÉE) ===');
  
  try {
    // Test 1: uploadRegionDetailsWithErrorHandling
    const regionMiddleware = uploadRegionDetailsWithErrorHandling();
    if (typeof regionMiddleware !== 'function') {
      console.error('❌ uploadRegionDetailsWithErrorHandling ne retourne pas une fonction');
      return false;
    }
    console.log('✅ uploadRegionDetailsWithErrorHandling (épuré): OK');
    
    // Test 2: uploadCommunityPhotoWithErrorHandling
    const photoMiddleware = uploadCommunityPhotoWithErrorHandling('photo');
    if (typeof photoMiddleware !== 'function') {
      console.error('❌ uploadCommunityPhotoWithErrorHandling ne retourne pas une fonction');
      return false;
    }
    console.log('✅ uploadCommunityPhotoWithErrorHandling: OK');
    
    // Test 3: uploadWithErrorHandling
    const basicMiddleware = uploadWithErrorHandling('image');
    if (typeof basicMiddleware !== 'function') {
      console.error('❌ uploadWithErrorHandling ne retourne pas une fonction');
      return false;
    }
    console.log('✅ uploadWithErrorHandling: OK');
    
    console.log('✅ === TOUS LES TESTS RÉUSSIS (VERSION ÉPURÉE) ===');
    console.log('📋 Champs supportés: gallery (max 5), photo, profileImage, image');
    console.log('❌ Places populaires: SUPPRIMÉES');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error.message);
    return false;
  }
};

// ✅ CONSERVÉ : EXPORTS COMPLETS
module.exports = {
  uploadWithErrorHandling,                    // ✅ CONSERVÉ pour vos trésors
  uploadRegionDetailsWithErrorHandling,       // ✅ Épuré (sans places populaires)
  uploadCommunityPhotoWithErrorHandling,      // ✅ CONSERVÉ
  uploadProfileImageWithErrorHandling,        // ✅ CONSERVÉ
  storage,                                    // ✅ CONSERVÉ
  fileFilter,                                 // ✅ CONSERVÉ (mis à jour)
  multerConfig,                              // ✅ CONSERVÉ
  testUploadMiddlewares                       // ✅ CONSERVÉ (mis à jour)
};

// ✅ CONSERVÉ : AUTO-TEST AU CHARGEMENT
console.log('🔧 === CHARGEMENT MIDDLEWARE UPLOAD (VERSION ÉPURÉE) ===');

// Vérifier les dépendances
if (!multer) {
  console.error('❌ ERREUR CRITIQUE: multer manquant');
} else {
  console.log('✅ multer disponible');
}

if (!fsExtra || !fsExtra.ensureDirSync) {
  console.warn('⚠️ fs-extra manquant, utilisation de fs natif');
} else {
  console.log('✅ fs-extra disponible');
}

// Test des middlewares
try {
  const testResult = testUploadMiddlewares();
  if (testResult) {
    console.log('🎉 === MIDDLEWARES UPLOAD PRÊTS (VERSION ÉPURÉE) ===');
    console.log('✅ Galerie: Supportée (max 5 images)');
    console.log('✅ Photos communauté: Supportées');
    console.log('✅ Images profil: Supportées');
    console.log('❌ Places populaires: SUPPRIMÉES');
  } else {
    console.error('❌ === PROBLÈME CONFIGURATION MIDDLEWARES ===');
  }
} catch (testError) {
  console.error('❌ Erreur lors des tests:', testError.message);
  console.log('⚠️ Les middlewares peuvent fonctionner malgré cette erreur de test');
}
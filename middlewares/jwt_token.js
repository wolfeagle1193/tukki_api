// middlewares/jwt_token.js
// ✅ Middleware d'authentification JWT
// Modifié pour inclure le username nécessaire pour les commentaires et photos

/*const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérifier si l'utilisateur existe toujours dans la base de données
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "Utilisateur non trouvé." 
        });
      }
      
      // ✅ MODIFICATION: Ajout du username pour les commentaires et photos
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: user.username, // ✅ Ajouté pour les commentaires/photos
        role: user.role
      };
      req.userRole = user.role;
      req.fullUser = user;
      
      next();
    } catch (err) {
      console.error("Erreur de vérification du token:", err);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: "Token expiré. Veuillez vous reconnecter.",
          tokenExpired: true
        });
      }
      
      return res.status(403).json({ 
        success: false,
        message: "Token invalide."
      });
    }
  } else {
    return res.status(401).json({ 
      success: false,
      message: "Vous n'êtes pas authentifié." 
    });
  }
};

module.exports = { verifyToken };*/







//new









// middlewares/jwt_token.js
// ✅ Middleware d'authentification JWT AMÉLIORÉ
// Version renforcée pour éviter les déconnexions pendant les uploads

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ MIDDLEWARE STANDARD (votre version existante améliorée)
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérifier si l'utilisateur existe toujours dans la base de données
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "Utilisateur non trouvé." 
        });
      }
      
      // ✅ VOTRE VERSION EXISTANTE CONSERVÉE
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: user.username,
        role: user.role
      };
      req.userRole = user.role;
      req.fullUser = user;
      
      next();
    } catch (err) {
      console.error("Erreur de vérification du token:", err);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: "Token expiré. Veuillez vous reconnecter.",
          tokenExpired: true
        });
      }
      
      return res.status(403).json({ 
        success: false,
        message: "Token invalide."
      });
    }
  } else {
    return res.status(401).json({ 
      success: false,
      message: "Vous n'êtes pas authentifié." 
    });
  }
};

// ✅ NOUVEAU: MIDDLEWARE SPÉCIAL POUR LES UPLOADS (évite les déconnexions)
const verifyTokenForUpload = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log('🔐 === VÉRIFICATION TOKEN UPLOAD ===');
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    
    try {
      // ✅ VÉRIFICATION PRÉALABLE DE L'EXPIRATION
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('📋 Token décodé:', {
        userId: decoded.id,
        email: decoded.email,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
      
      // ✅ VÉRIFICATION UTILISATEUR EN BASE
      const user = await User.findById(decoded.id);
      if (!user) {
        console.error('❌ Utilisateur non trouvé pour upload:', decoded.id);
        return res.status(401).json({ 
          success: false,
          message: "Utilisateur non trouvé pour l'upload.",
          error: "USER_NOT_FOUND_UPLOAD"
        });
      }
      
      console.log('✅ Utilisateur authentifié pour upload:', {
        id: user._id,
        username: user.username,
        email: user.email
      });
      
      // ✅ MÊME STRUCTURE QUE VOTRE MIDDLEWARE EXISTANT
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: user.username,
        role: user.role
      };
      req.userRole = user.role;
      req.fullUser = user;
      
      // ✅ LOGS SPÉCIAUX POUR LES UPLOADS
      if (req.files && Object.keys(req.files).length > 0) {
        const totalFiles = Object.values(req.files).flat().length;
        console.log(`📸 Upload authentifié: ${totalFiles} fichier(s) pour ${user.username}`);
      }
      
      next();
      
    } catch (err) {
      console.error("❌ Erreur vérification token upload:", err);
      
      if (err.name === 'TokenExpiredError') {
        console.error('❌ Token expiré pendant upload');
        return res.status(401).json({ 
          success: false,
          message: "Votre session a expiré pendant l'upload. Veuillez vous reconnecter et réessayer.",
          error: "TOKEN_EXPIRED_DURING_UPLOAD",
          tokenExpired: true
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        console.error('❌ Token invalide pendant upload');
        return res.status(401).json({ 
          success: false,
          message: "Token invalide pendant l'upload. Veuillez vous reconnecter.",
          error: "TOKEN_INVALID_DURING_UPLOAD"
        });
      }
      
      return res.status(403).json({ 
        success: false,
        message: "Erreur d'authentification pendant l'upload.",
        error: "AUTH_ERROR_DURING_UPLOAD"
      });
    }
  } else {
    console.error('❌ Pas de token pour upload');
    return res.status(401).json({ 
      success: false,
      message: "Token d'authentification requis pour l'upload.",
      error: "NO_TOKEN_FOR_UPLOAD"
    });
  }
};

// ✅ MIDDLEWARE POUR VÉRIFIER SI LE TOKEN VA EXPIRER BIENTÔT
const checkTokenExpiry = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - currentTime;
      
      // Si le token expire dans moins de 5 minutes
      if (timeUntilExpiry < 300) { // 300 secondes = 5 minutes
        console.warn(`⚠️ Token expire dans ${timeUntilExpiry} secondes`);
        
        // Ajouter un header pour informer le client
        res.set('X-Token-Expires-Soon', 'true');
        res.set('X-Token-Expires-In', timeUntilExpiry.toString());
      }
      
      next();
    } catch (err) {
      // Si le token est déjà expiré, laisser les autres middlewares gérer
      next();
    }
  } else {
    next();
  }
};

module.exports = { 
  verifyToken,           // ✅ Votre middleware existant (conservé)
  verifyTokenForUpload,  // ✅ Nouveau pour les uploads
  checkTokenExpiry       // ✅ Utilitaire pour vérifier l'expiration
};
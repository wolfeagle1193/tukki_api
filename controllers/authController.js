

const User = require("../models/User");
const Cryptojs = require("crypto-js");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

module.exports = {
  createUser: async (req, res, next) => {
    try {
      // Vérification des données requises
      if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json({ 
          status: false, 
          message: "Veuillez fournir tous les champs obligatoires (username, email, password)." 
        });
      }

      // Création du nouvel utilisateur
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: Cryptojs.AES.encrypt(req.body.password, process.env.SECRET).toString(),
        role: req.body.role || 'user', // Par défaut, le rôle est 'user'
      });

      // Si superAdmin est demandé, vérifier s'il existe déjà un superAdmin
      if (req.body.role === 'superAdmin') {
        const existingSuperAdmin = await User.findOne({ role: 'superAdmin' });
        if (existingSuperAdmin) {
          return res.status(403).json({
            status: false,
            message: "Un compte superAdmin existe déjà."
          });
        }
      }

      await newUser.save();
      res.status(201).json({ status: true, message: "Votre compte a été créé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      
      // Gestion de l'erreur pour email duplicé
      if (error.code === 11000) {
        return res.status(400).json({
          status: false,
          message: "Cet email est déjà utilisé."
        });
      }
      
      return res.status(500).json({
        status: false,
        message: "Erreur du serveur lors de la création du compte.",
        error: error.message
      });
    }
  },
  
  loginUser: async (req, res, next) => {
    try {
      // Vérifier que l'email et le mot de passe sont fournis
      if (!req.body.email || !req.body.password) {
        return res.status(400).json({ 
          status: false, 
          message: "Veuillez fournir l'email et le mot de passe." 
        });
      }

      // Rechercher l'utilisateur par email
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(401).json({ status: false, message: "Utilisateur non trouvé." });
      }
      
      // Vérifier le mot de passe
      const decryptedPassword = Cryptojs.AES.decrypt(user.password, process.env.SECRET);
      const decryptedString = decryptedPassword.toString(Cryptojs.enc.Utf8);

      if (decryptedString !== req.body.password) {
        return res.status(401).json({ status: false, message: "Mot de passe incorrect." });
      }

      // Générer un token d'accès
      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      
      // Générer un refresh token
      const refreshToken = crypto.randomBytes(40).toString('hex');
      
      // Sauvegarder le refresh token dans la base de données
      user.refreshToken = refreshToken;
      await user.save();

      return res.status(200).json({ 
        status: true, 
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      });
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return res.status(500).json({ 
        status: false, 
        message: "Erreur du serveur lors de la connexion.",
        error: error.message
      });
    }
  },

  logoutUser: async (req, res, next) => {
    try {
      // Supprimer le refresh token de l'utilisateur
      await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
      
      res.status(200).json({ 
        status: true, 
        message: "Déconnexion réussie." 
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      return res.status(500).json({ 
        status: false, 
        message: "Erreur du serveur lors de la déconnexion.",
        error: error.message
      });
    }
  },
  
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ 
          status: false, 
          message: "Refresh token manquant." 
        });
      }
      
      // Chercher l'utilisateur avec ce refresh token
      const user = await User.findOne({ refreshToken });
      if (!user) {
        return res.status(403).json({ 
          status: false, 
          message: "Refresh token invalide ou expiré." 
        });
      }
      
      // Générer un nouveau token d'accès
      const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      
      // Générer un nouveau refresh token
      const newRefreshToken = crypto.randomBytes(40).toString('hex');
      
      // Mettre à jour le refresh token dans la base de données
      user.refreshToken = newRefreshToken;
      await user.save();
      
      res.status(200).json({
        status: true,
        accessToken,
        refreshToken: newRefreshToken
      });
      
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du token:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur du serveur lors du rafraîchissement du token.",
        error: error.message
      });
    }
  }
};

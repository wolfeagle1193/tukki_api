
const User = require("../models/User");
const Cryptojs = require("crypto-js");
const fs = require('fs').promises;  
const path = require('path');

module.exports = {
  deleteUser: async (req, res, next) => {
    try {
      // Vérifier si l'utilisateur existe
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "Utilisateur non trouvé.",
        });
      }
      
      // Si c'est un superAdmin qui fait la demande, vérifier si l'ID cible est fourni
      if (req.userRole === 'superAdmin' && req.body.userId) {
        // SuperAdmin peut supprimer n'importe quel utilisateur sauf lui-même
        if (req.body.userId === req.user.id) {
          return res.status(403).json({
            status: false,
            message: "Vous ne pouvez pas supprimer votre propre compte en tant que superAdmin.",
          });
        }
        
        const targetUser = await User.findByIdAndDelete(req.body.userId);
        if (!targetUser) {
          return res.status(404).json({
            status: false,
            message: "Utilisateur cible non trouvé.",
          });
        }
        
        return res.status(200).json({
          status: true,
          message: "Compte utilisateur supprimé avec succès.",
        });
      } 
      
      // Si c'est un admin qui fait la demande
      else if (req.userRole === 'admin' && req.body.userId) {
        // Admin peut supprimer tout utilisateur sauf superAdmin et lui-même
        const targetUser = await User.findById(req.body.userId);
        
        if (!targetUser) {
          return res.status(404).json({
            status: false,
            message: "Utilisateur cible non trouvé.",
          });
        }
        
        if (targetUser.role === 'superAdmin') {
          return res.status(403).json({
            status: false,
            message: "Vous n'avez pas la permission de supprimer un superAdmin.",
          });
        }
        
        if (req.body.userId === req.user.id) {
          return res.status(403).json({
            status: false,
            message: "Utilisez la route de suppression standard pour supprimer votre propre compte.",
          });
        }
        
        await User.findByIdAndDelete(req.body.userId);
        return res.status(200).json({
          status: true,
          message: "Compte utilisateur supprimé avec succès.",
        });
      } 
      
      // Suppression standard de son propre compte
      else {
        await User.findByIdAndDelete(req.user.id);
        return res.status(200).json({
          status: true,
          message: "Votre compte a été supprimé avec succès.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur du serveur lors de la suppression.",
        error: error.message,
      });
    }
  },

  getUser: async (req, res, next) => {
    // Si un ID spécifique est fourni et que l'utilisateur a les droits d'admin
    const userId = req.query.userId || req.user.id;
    
    try {
      // Si l'utilisateur demande des infos sur un autre utilisateur
      if (userId !== req.user.id) {
        // Vérifier les permissions
        if (!['admin', 'superAdmin'].includes(req.userRole)) {
          return res.status(403).json({
            status: false,
            message: "Vous n'avez pas les permissions nécessaires pour voir cet utilisateur.",
          });
        }
      }
      
      const user = await User.findById(userId, { 
        password: 0, 
        __v: 0, 
        refreshToken: 0 
      });
      
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "Utilisateur non trouvé.",
        });
      }
     
      res.status(200).json({
        status: true,
        user: user
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return res.status(500).json({ 
        status: false, 
        message: "Erreur du serveur lors de la récupération des données.",
        error: error.message
      });
    }
  },
  
  getAllUsers: async (req, res, next) => {
    try {
      // Vérifier que l'utilisateur a les permissions nécessaires
      if (!['admin', 'superAdmin'].includes(req.userRole)) {
        return res.status(403).json({
          status: false,
          message: "Vous n'avez pas les permissions nécessaires pour cette action.",
        });
      }
      
      // Paramètres de pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Filtres
      const filter = {};
      if (req.query.role) {
        filter.role = req.query.role;
      }
      
      // Récupérer les utilisateurs
      const users = await User.find(filter, { 
        password: 0, 
        __v: 0, 
        refreshToken: 0 
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
      // Compter le nombre total d'utilisateurs pour la pagination
      const total = await User.countDocuments(filter);
      
      res.status(200).json({
        status: true,
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur du serveur lors de la récupération des utilisateurs.",
        error: error.message
      });
    }
  },
  
  updateUserRole: async (req, res, next) => {
    try {
      const { userId, newRole } = req.body;
      
      if (!userId || !newRole) {
        return res.status(400).json({
          status: false,
          message: "L'ID utilisateur et le nouveau rôle sont requis.",
        });
      }
      
      // Vérifier que le rôle est valide
      const validRoles = ['user', 'maintenancier', 'admin', 'superAdmin'];
      if (!validRoles.includes(newRole)) {
        return res.status(400).json({
          status: false,
          message: "Rôle invalide. Les rôles valides sont: user, maintenancier, admin, superAdmin.",
        });
      }
      
      // SuperAdmin peut changer tous les rôles
      if (req.userRole === 'superAdmin') {
        // Vérifier si on essaie de modifier un autre superAdmin
        if (newRole === 'superAdmin' && userId !== req.user.id) {
          const existingSuperAdmin = await User.findOne({ role: 'superAdmin' });
          if (existingSuperAdmin) {
            return res.status(403).json({
              status: false,
              message: "Un compte superAdmin existe déjà."
            });
          }
        }
      } 
      // Admin ne peut pas promouvoir au rôle de superAdmin ni modifier un superAdmin
      else if (req.userRole === 'admin') {
        if (newRole === 'superAdmin') {
          return res.status(403).json({
            status: false,
            message: "Vous n'avez pas la permission de promouvoir au rôle de superAdmin.",
          });
        }
        
        const targetUser = await User.findById(userId);
        if (!targetUser) {
          return res.status(404).json({
            status: false,
            message: "Utilisateur cible non trouvé.",
          });
        }
        
        if (targetUser.role === 'superAdmin') {
          return res.status(403).json({
            status: false,
            message: "Vous n'avez pas la permission de modifier un superAdmin.",
          });
        }
      } else {
        return res.status(403).json({
          status: false,
          message: "Vous n'avez pas les permissions nécessaires pour cette action.",
        });
      }
      
      // Mettre à jour le rôle
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { role: newRole },
        { new: true, select: '-password -refreshToken -__v' }
      );
      
      if (!updatedUser) {
        return res.status(404).json({
          status: false,
          message: "Utilisateur non trouvé.",
        });
      }
      
      res.status(200).json({
        status: true,
        message: `Rôle de l'utilisateur mis à jour vers ${newRole}.`,
        user: updatedUser
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rôle:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur du serveur lors de la mise à jour du rôle.",
        error: error.message
      });
    }
  },
  
  updateUserProfile: async (req, res, next) => {
    try {
      const userId = req.body.userId || req.user.id;
      
      // Vérifier les permissions si on essaie de modifier un autre utilisateur
      if (userId !== req.user.id && !['admin', 'superAdmin'].includes(req.userRole)) {
        return res.status(403).json({
          status: false,
          message: "Vous n'avez pas les permissions nécessaires pour modifier cet utilisateur.",
        });
      }
      
      // Si admin essaie de modifier un superAdmin
      if (req.userRole === 'admin') {
        const targetUser = await User.findById(userId);
        if (targetUser && targetUser.role === 'superAdmin') {
          return res.status(403).json({
            status: false,
            message: "Vous n'avez pas la permission de modifier un superAdmin.",
          });
        }
      }
      
      // Préparer les champs à mettre à jour
      const updates = {};
      
      if (req.body.username) updates.username = req.body.username;
      if (req.body.email) updates.email = req.body.email;
      if (req.body.profile) updates.profile = req.body.profile;
      
      // Pour la mise à jour du mot de passe, demander l'ancien mot de passe
      if (req.body.newPassword) {
        // Si c'est l'utilisateur lui-même qui modifie son mot de passe
        if (userId === req.user.id) {
          if (!req.body.currentPassword) {
            return res.status(400).json({
              status: false,
              message: "Le mot de passe actuel est requis pour changer de mot de passe.",
            });
          }
          
          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({
              status: false,
              message: "Utilisateur non trouvé.",
            });
          }
          
          // Vérifier l'ancien mot de passe
          const decryptedPassword = Cryptojs.AES.decrypt(user.password, process.env.SECRET);
          const decryptedString = decryptedPassword.toString(Cryptojs.enc.Utf8);
          
          if (decryptedString !== req.body.currentPassword) {
            return res.status(401).json({
              status: false,
              message: "Mot de passe actuel incorrect.",
            });
          }
        }
        
        // Crypter et mettre à jour le nouveau mot de passe
        updates.password = Cryptojs.AES.encrypt(req.body.newPassword, process.env.SECRET).toString();
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          status: false,
          message: "Aucune donnée fournie pour la mise à jour.",
        });
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updates,
        { new: true, select: '-password -refreshToken -__v' }
      );
      
      if (!updatedUser) {
        return res.status(404).json({
          status: false,
          message: "Utilisateur non trouvé.",
        });
      }
      
      res.status(200).json({
        status: true,
        message: "Profil mis à jour avec succès.",
        user: updatedUser
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      
      // Gestion de l'erreur pour email duplicé
      if (error.code === 11000) {
        return res.status(400).json({
          status: false,
          message: "Cet email est déjà utilisé."
        });
      }
      
      return res.status(500).json({
        status: false,
        message: "Erreur du serveur lors de la mise à jour du profil.",
        error: error.message
      });
    }
  },

deleteMyUserPicture: async (req, res, next) => {
  try {
    console.log("🔐 verifyToken OK - userId:", req.user?.id);
    
    const userId = req.user.id;
    
    console.log("1️⃣ Recherche utilisateur avec ID:", userId);
    const user = await User.findById(userId);
    
    if (!user) {
      console.log("❌ Utilisateur non trouvé");
      return res.status(404).json({
        status: false,
        message: "Utilisateur non trouvé.",
      });
    }
    
    console.log("2️⃣ Utilisateur trouvé:", user.username);
    console.log("3️⃣ user.profile:", user.profile);
    
    if (!user.profile) {
      console.log("❌ Pas de profile");
      return res.status(404).json({
        status: false,
        message: "Aucune photo de profil à supprimer.",
      });
    }
    
    console.log("4️⃣ Profile URL:", user.profile);
    
    const imageUrl = user.profile;
    
    // Suppression du fichier...
    try {
      const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      const imagePath = path.join(process.cwd(), relativePath);
      
      console.log("5️⃣ Tentative de suppression du fichier : ${imagePath}");
      
      try {
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        console.log("✅ Fichier supprimé avec succès");
      } catch (fileError) {
        console.log("⚠️ Erreur fichier:", fileError.code);
      }
    } catch (error) {
      console.error("❌ Erreur construction chemin:", error);
    }
    
    user.profile = null;
    await user.save();
    
    console.log("6️⃣ Profil mis à jour en DB");
    
    return res.status(200).json({
      status: true,
      message: "Photo de profil supprimée avec succès.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur globale:", error);
    return res.status(500).json({
      status: false,
      message: "Erreur du serveur.",
      error: error.message,
    });
  }
},
  //new function

  getAllUsers: async (req, res, next) => {
    try {
      const users = await User.find().select('-password -refreshToken');
      res.status(200).json({ 
        status: true, 
        users: users 
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      return res.status(500).json({ 
        status: false, 
        message: "Erreur du serveur lors de la récupération des utilisateurs.",
        error: error.message
      });
    }
  }


};

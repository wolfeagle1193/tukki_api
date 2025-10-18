

/**
 * Middleware pour vérifier si l'utilisateur a le rôle requis
 * @param {Array} roles - Tableau des rôles autorisés
 * @returns {Function} Middleware Express
 */
const checkRole = (roles) => {
    return async (req, res, next) => {
      try {
        // Vérification simplifiée - pas de nouvelle requête DB
        if (!req.user || !req.user.id) {
          return res.status(401).json({ 
            success: false,
            message: "Vous n'êtes pas authentifié." 
          });
        }

        // Utiliser le rôle déjà récupéré dans verifyToken
        const userRole = req.userRole || req.user.role;
        
        if (!userRole) {
          return res.status(401).json({ 
            success: false,
            message: "Rôle utilisateur non défini." 
          });
        }
        
        // Vérifier si le rôle est autorisé
        if (!roles.includes(userRole)) {
          return res.status(403).json({ 
            success: false,
            message: "Vous n'avez pas les permissions nécessaires." 
          });
        }
        
        next();
      } catch (error) {
        console.error("Erreur lors de la vérification du rôle:", error);
        return res.status(500).json({ 
          success: false,
          message: "Erreur du serveur lors de la vérification des permissions."
        });
      }
    };
  };
  
  module.exports = { checkRole };
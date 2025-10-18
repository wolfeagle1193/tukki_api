// =====================================================================
// 🔧 MIDDLEWARE DE VALIDATION POUR LES PARAMÈTRES DE RÉGION
// Fichier: middlewares/regionValidation.js (nouveau fichier à créer)
// =====================================================================

const mongoose = require('mongoose');

// =====================================================================
// 🔍 VALIDATION DES PARAMÈTRES DE RÉGION
// =====================================================================

/**
 * Middleware pour valider les paramètres de région dans les routes
 * Vérifie la présence et la validité du region_id
 */
const validateRegionParams = (req, res, next) => {
  try {
    const { region_id } = req.params;
    
    // Vérifier la présence du region_id
    if (!region_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID de la région est requis.",
        error: 'MISSING_REGION_ID',
        field: 'region_id'
      });
    }
    
    // Vérifier que ce n'est pas une chaîne vide
    if (typeof region_id !== 'string' || region_id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "L'ID de la région ne peut pas être vide.",
        error: 'EMPTY_REGION_ID',
        field: 'region_id'
      });
    }
    
    const cleanRegionId = region_id.trim();
    
    // Vérifier la longueur (MongoDB ObjectId = 24 caractères hexadécimaux)
    if (cleanRegionId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Format d'ID de région invalide (doit faire 24 caractères).",
        error: 'INVALID_REGION_ID_LENGTH',
        field: 'region_id',
        received: cleanRegionId,
        expectedLength: 24,
        actualLength: cleanRegionId.length
      });
    }
    
    // Vérifier que c'est un ObjectId MongoDB valide
    if (!mongoose.Types.ObjectId.isValid(cleanRegionId)) {
      return res.status(400).json({
        success: false,
        message: "Format d'ID de région invalide (ObjectId MongoDB attendu).",
        error: 'INVALID_MONGODB_OBJECTID',
        field: 'region_id',
        received: cleanRegionId
      });
    }
    
    // Si tout est valide, nettoyer le paramètre et continuer
    req.params.region_id = cleanRegionId;
    
    console.log(`✅ Validation region_id réussie: ${cleanRegionId}`);
    next();
    
  } catch (error) {
    console.error('❌ Erreur dans validateRegionParams:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la validation des paramètres.",
      error: 'VALIDATION_INTERNAL_ERROR'
    });
  }
};

// =====================================================================
// 🔍 VALIDATION DES PARAMÈTRES DE COMMENTAIRE
// =====================================================================

/**
 * Middleware pour valider les paramètres de commentaire
 * Vérifie la présence et la validité du comment_id
 */
const validateCommentParams = (req, res, next) => {
  try {
    const { comment_id } = req.params;
    
    if (!comment_id || typeof comment_id !== 'string' || comment_id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "L'ID du commentaire est requis.",
        error: 'MISSING_COMMENT_ID',
        field: 'comment_id'
      });
    }
    
    const cleanCommentId = comment_id.trim();
    
    if (!mongoose.Types.ObjectId.isValid(cleanCommentId)) {
      return res.status(400).json({
        success: false,
        message: "Format d'ID de commentaire invalide.",
        error: 'INVALID_COMMENT_ID',
        field: 'comment_id',
        received: cleanCommentId
      });
    }
    
    req.params.comment_id = cleanCommentId;
    
    console.log(`✅ Validation comment_id réussie: ${cleanCommentId}`);
    next();
    
  } catch (error) {
    console.error('❌ Erreur dans validateCommentParams:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la validation du commentaire.",
      error: 'COMMENT_VALIDATION_INTERNAL_ERROR'
    });
  }
};

// =====================================================================
// 🔍 VALIDATION DES PARAMÈTRES DE LIKE
// =====================================================================

/**
 * Middleware pour valider les paramètres de like/unlike
 * Vérifie le type (photo/comment/reply) et l'ID
 */
const validateLikeParams = (req, res, next) => {
  try {
    const { region_id, type, id } = req.params;
    
    // Valider le type
    const validTypes = ['photo', 'comment', 'reply'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type de like invalide. Types acceptés: photo, comment, reply.",
        error: 'INVALID_LIKE_TYPE',
        field: 'type',
        received: type,
        validTypes: validTypes
      });
    }
    
    // Valider l'ID de l'élément à liker
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "L'ID de l'élément à liker est requis.",
        error: 'MISSING_ITEM_ID',
        field: 'id'
      });
    }
    
    const cleanId = id.trim();
    
    if (!mongoose.Types.ObjectId.isValid(cleanId)) {
      return res.status(400).json({
        success: false,
        message: "Format d'ID d'élément invalide.",
        error: 'INVALID_ITEM_ID',
        field: 'id',
        received: cleanId
      });
    }
    
    req.params.id = cleanId;
    
    console.log(`✅ Validation like params réussie: ${type}/${cleanId} sur région ${region_id}`);
    next();
    
  } catch (error) {
    console.error('❌ Erreur dans validateLikeParams:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la validation des paramètres de like.",
      error: 'LIKE_VALIDATION_INTERNAL_ERROR'
    });
  }
};

// =====================================================================
// 🔍 VALIDATION DES DONNÉES DE COMMENTAIRE
// =====================================================================

/**
 * Middleware pour valider le contenu des commentaires
 * Vérifie la présence et la longueur du commentaire
 */
const validateCommentData = (req, res, next) => {
  try {
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: "Le contenu du commentaire est requis.",
        error: 'MISSING_COMMENT_CONTENT',
        field: 'comment'
      });
    }
    
    if (typeof comment !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Le commentaire doit être une chaîne de caractères.",
        error: 'INVALID_COMMENT_TYPE',
        field: 'comment',
        received: typeof comment
      });
    }
    
    const trimmedComment = comment.trim();
    
    if (trimmedComment.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Le commentaire ne peut pas être vide.",
        error: 'EMPTY_COMMENT',
        field: 'comment'
      });
    }
    
    if (trimmedComment.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Le commentaire doit contenir au moins 2 caractères.",
        error: 'COMMENT_TOO_SHORT',
        field: 'comment',
        minLength: 2,
        actualLength: trimmedComment.length
      });
    }
    
    if (trimmedComment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Le commentaire ne peut pas dépasser 1000 caractères.",
        error: 'COMMENT_TOO_LONG',
        field: 'comment',
        maxLength: 1000,
        actualLength: trimmedComment.length
      });
    }
    
    // Nettoyer le commentaire
    req.body.comment = trimmedComment;
    
    console.log(`✅ Validation commentaire réussie: ${trimmedComment.length} caractères`);
    next();
    
  } catch (error) {
    console.error('❌ Erreur dans validateCommentData:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la validation du commentaire.",
      error: 'COMMENT_DATA_VALIDATION_ERROR'
    });
  }
};

// =====================================================================
// 🔍 VALIDATION DES DONNÉES DE RÉPONSE
// =====================================================================

/**
 * Middleware pour valider le contenu des réponses aux commentaires
 * Vérifie la présence et la longueur de la réponse
 */
const validateReplyData = (req, res, next) => {
  try {
    const { reply } = req.body;
    
    if (!reply) {
      return res.status(400).json({
        success: false,
        message: "Le contenu de la réponse est requis.",
        error: 'MISSING_REPLY_CONTENT',
        field: 'reply'
      });
    }
    
    if (typeof reply !== 'string') {
      return res.status(400).json({
        success: false,
        message: "La réponse doit être une chaîne de caractères.",
        error: 'INVALID_REPLY_TYPE',
        field: 'reply',
        received: typeof reply
      });
    }
    
    const trimmedReply = reply.trim();
    
    if (trimmedReply.length === 0) {
      return res.status(400).json({
        success: false,
        message: "La réponse ne peut pas être vide.",
        error: 'EMPTY_REPLY',
        field: 'reply'
      });
    }
    
    if (trimmedReply.length < 2) {
      return res.status(400).json({
        success: false,
        message: "La réponse doit contenir au moins 2 caractères.",
        error: 'REPLY_TOO_SHORT',
        field: 'reply',
        minLength: 2,
        actualLength: trimmedReply.length
      });
    }
    
    if (trimmedReply.length > 500) {
      return res.status(400).json({
        success: false,
        message: "La réponse ne peut pas dépasser 500 caractères.",
        error: 'REPLY_TOO_LONG',
        field: 'reply',
        maxLength: 500,
        actualLength: trimmedReply.length
      });
    }
    
    // Nettoyer la réponse
    req.body.reply = trimmedReply;
    
    console.log(`✅ Validation réponse réussie: ${trimmedReply.length} caractères`);
    next();
    
  } catch (error) {
    console.error('❌ Erreur dans validateReplyData:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la validation de la réponse.",
      error: 'REPLY_DATA_VALIDATION_ERROR'
    });
  }
};

// =====================================================================
// 🔍 VALIDATION POUR LES FAVORIS
// =====================================================================

/**
 * Middleware pour valider les paramètres de requête pour les favoris
 * Vérifie les paramètres de tri et de pagination
 */
const validateGetUserFavorites = (req, res, next) => {
  try {
    const { sortBy, page, limit } = req.query;
    
    // Valider sortBy
    if (sortBy) {
      const validSortOptions = ['dateAdded', 'name', 'rating', 'totalReviews'];
      if (!validSortOptions.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          message: "Option de tri invalide.",
          error: 'INVALID_SORT_OPTION',
          field: 'sortBy',
          received: sortBy,
          validOptions: validSortOptions
        });
      }
    }
    
    // Valider page si fournie
    if (page) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: "Le numéro de page doit être un nombre entier positif.",
          error: 'INVALID_PAGE_NUMBER',
          field: 'page',
          received: page
        });
      }
      req.query.page = pageNum;
    }
    
    // Valider limit si fournie
    if (limit) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: "La limite doit être un nombre entre 1 et 100.",
          error: 'INVALID_LIMIT',
          field: 'limit',
          received: limit,
          min: 1,
          max: 100
        });
      }
      req.query.limit = limitNum;
    }
    
    console.log(`✅ Validation favoris réussie: sortBy=${sortBy || 'default'}, page=${page || 'all'}, limit=${limit || 'all'}`);
    next();
    
  } catch (error) {
    console.error('❌ Erreur dans validateGetUserFavorites:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la validation des paramètres de favoris.",
      error: 'FAVORITES_VALIDATION_ERROR'
    });
  }
};

// =====================================================================
// 📋 EXPORTS
// =====================================================================

module.exports = {
  validateRegionParams,
  validateCommentParams,
  validateLikeParams,
  validateCommentData,
  validateReplyData,
  validateGetUserFavorites
};

// =====================================================================
// 📋 LOGGING
// =====================================================================

console.log('✅ === MIDDLEWARE VALIDATION RÉGIONS CHARGÉ ===');
console.log('🔧 Validateurs disponibles:');
console.log('  ✅ validateRegionParams - Validation region_id');
console.log('  ✅ validateCommentParams - Validation comment_id');
console.log('  ✅ validateLikeParams - Validation type/id pour likes');
console.log('  ✅ validateCommentData - Validation contenu commentaire');
console.log('  ✅ validateReplyData - Validation contenu réponse');
console.log('  ✅ validateGetUserFavorites - Validation paramètres favoris');
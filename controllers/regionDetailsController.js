// =====================================================================
// 🎯 CONTRÔLEUR RÉGION DETAILS - VERSION ÉPURÉE (SANS PLACES POPULAIRES)
// =====================================================================

const mongoose = require('mongoose'); 
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const sharp = require('sharp');
const RegionDetails = require('../models/RegionDetails');
const Region = require('../models/Region');

// =====================================================================
// 🎯 CONTRÔLEUR PRINCIPAL - CRÉATION/MISE À JOUR (ÉPURÉ)
// =====================================================================


// =====================================================================
// 💖 AJOUT DES CONTRÔLEURS FAVORIS - À AJOUTER À LA FIN DE RegionDetailsController.js
// Insérer ces fonctions avant le console.log final et l'export
// =====================================================================

// =====================================================================
// 💖 TOGGLE FAVORIS RÉGION
// =====================================================================

exports.toggleRegionFavorite = async (req, res) => {
  try {
    const { region_id } = req.params;
    const { id: userId, username } = req.user;
    
    const displayName = username || `User${userId.slice(-6)}`;
    console.log(`💖 Toggle favoris région ${region_id} par ${displayName}`);
    
    if (!region_id || String(region_id).trim() === '') {
      return res.status(400).json({
        success: false,
        message: "L'ID de la région est requis."
      });
    }
    
    // Vérifier que la région existe
    const regionExists = await Region.findById(region_id);
    if (!regionExists) {
      return res.status(404).json({
        success: false,
        message: "La région spécifiée n'existe pas."
      });
    }
    
    // Trouver ou créer RegionDetails
    let regionDetails = await RegionDetails.findOne({ region_id });
    
    if (!regionDetails) {
      console.log(`⚠️ Création RegionDetails pour favoris - région ${region_id}`);
      
      regionDetails = new RegionDetails({
        region_id,
        description: regionExists.description || `Découvrez ${regionExists.name}, une région magnifique à explorer.`,
        location: regionExists.location || regionExists.country || "Localisation à préciser",
        rating: 0,
        totalReviews: 0,
        gallery: [],
        services: [
          { type: "Loisirs", icon: "🎯", description: "Activités de loisirs et découvertes", isActive: true, priority: 1, createdAt: new Date() },
          { type: "Hébergement", icon: "🏨", description: "Hôtels, auberges et logements", isActive: true, priority: 2, createdAt: new Date() },
          { type: "Restauration", icon: "🍽️", description: "Restaurants et spécialités locales", isActive: true, priority: 3, createdAt: new Date() }
        ],
        photos: [],
        comments: [],
        favoritedBy: [], // Initialiser le tableau des favoris
        textSettings: { fontSize: 16, lineHeight: 1.4 }
      });
      
      await regionDetails.save();
      console.log(`✅ RegionDetails créé pour favoris: ${regionExists.name}`);
    }
    
    // Vérifier si l'utilisateur a déjà mis en favori
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isFavorited = regionDetails.favoritedBy.some(id => 
      id.toString() === userId.toString()
    );
    
    let message = '';
    let action = '';
    
    if (isFavorited) {
      // Retirer des favoris
      regionDetails.favoritedBy = regionDetails.favoritedBy.filter(id => 
        id.toString() !== userId.toString()
      );
      message = `${regionExists.name} retiré de vos favoris`;
      action = 'removed';
      console.log(`💔 Favori retiré: ${regionExists.name} par ${displayName}`);
    } else {
      // Ajouter aux favoris
      regionDetails.favoritedBy.push(userObjectId);
      message = `${regionExists.name} ajouté à vos favoris`;
      action = 'added';
      console.log(`💖 Favori ajouté: ${regionExists.name} par ${displayName}`);
    }
    
    regionDetails.updatedAt = new Date();
    await regionDetails.save();
    
    const totalFavorites = regionDetails.favoritedBy.length;
    
    return res.status(200).json({
      success: true,
      message,
      data: {
        regionId: region_id,
        regionName: regionExists.name,
        action, // 'added' ou 'removed'
        isFavorited: !isFavorited, // Nouveau statut
        totalFavorites,
        userId
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur toggleRegionFavorite:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la gestion des favoris",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};

// =====================================================================
// 💖 RÉCUPÉRER LES FAVORIS DE L'UTILISATEUR
// =====================================================================

exports.getUserFavoriteRegions = async (req, res) => {
  try {
    const { id: userId, username } = req.user;
    const { sortBy = 'dateAdded' } = req.query;
    
    const displayName = username || `User${userId.slice(-6)}`;
    console.log(`💖 Récupération favoris régions pour: ${displayName}`);
    
    // Query: toutes les régions où l'utilisateur est dans favoritedBy
    const query = { 
      favoritedBy: userId
    };
    
    // Options de tri
    const sortOptions = {
      'dateAdded': { updatedAt: -1 }, // Plus récemment ajouté en favoris
      'name': { region_id: 1 },       // Alphabétique par nom (nécessitera un populate)
      'rating': { rating: -1 },       // Par note
      'totalReviews': { totalReviews: -1 } // Par popularité
    };
    
    const sort = sortOptions[sortBy] || sortOptions.dateAdded;
    
    // Récupération de TOUS les favoris de l'utilisateur
    const favoriteRegionsDetails = await RegionDetails.find(query)
      .sort(sort)
      .lean();
    
    // Enrichir avec les données des régions
    const userFavoriteRegions = [];
    
    for (const regionDetails of favoriteRegionsDetails) {
      try {
        // Récupérer les infos de base de la région
        const region = await Region.findById(regionDetails.region_id).lean();
        
        if (region) {
          userFavoriteRegions.push({
            id: regionDetails.region_id,
            regionDetailsId: regionDetails._id,
            name: region.name || 'Région sans nom',
            description: regionDetails.description || region.description || '',
            shortDescription: regionDetails.description 
              ? regionDetails.description.substring(0, 120) + (regionDetails.description.length > 120 ? '...' : '')
              : (region.description || '').substring(0, 120) + ((region.description || '').length > 120 ? '...' : ''),
            location: regionDetails.location || region.location || region.country || '',
            country: region.country || '',
            rating: regionDetails.rating || 0,
            totalReviews: regionDetails.totalReviews || 0,
            totalPhotos: regionDetails.photos ? regionDetails.photos.length : 0,
            totalComments: regionDetails.comments ? regionDetails.comments.length : 0,
            totalServices: regionDetails.services ? regionDetails.services.filter(s => s.isActive).length : 0,
            imageUrl: region.placeImage || regionDetails.gallery?.[0] || null,
            galleryCount: regionDetails.gallery ? regionDetails.gallery.length : 0,
            isFavoriteByUser: true, // Toujours true puisque c'est SA liste de favoris
            addedToFavoritesAt: regionDetails.updatedAt || regionDetails.createdAt,
            
            // Statistiques enrichies
            completionStatus: regionDetails.metadata?.completionStatus?.percentage || 0,
            hasFullDetails: (regionDetails.metadata?.completionStatus?.percentage || 0) >= 80,
            
            // Services disponibles (aperçu)
            availableServices: regionDetails.services 
              ? regionDetails.services
                  .filter(s => s.isActive)
                  .slice(0, 3)
                  .map(s => ({ type: s.type, icon: s.icon }))
              : []
          });
        }
      } catch (regionError) {
        console.warn(`⚠️ Erreur enrichissement région ${regionDetails.region_id}:`, regionError.message);
        // Inclure quand même avec des données minimales
        userFavoriteRegions.push({
          id: regionDetails.region_id,
          regionDetailsId: regionDetails._id,
          name: 'Région non trouvée',
          description: regionDetails.description || '',
          shortDescription: (regionDetails.description || '').substring(0, 120),
          location: regionDetails.location || '',
          country: '',
          rating: regionDetails.rating || 0,
          totalReviews: regionDetails.totalReviews || 0,
          totalPhotos: regionDetails.photos ? regionDetails.photos.length : 0,
          totalComments: regionDetails.comments ? regionDetails.comments.length : 0,
          imageUrl: regionDetails.gallery?.[0] || null,
          isFavoriteByUser: true,
          addedToFavoritesAt: regionDetails.updatedAt || regionDetails.createdAt
        });
      }
    }
    
    console.log(`✅ ${userFavoriteRegions.length} régions favorites trouvées pour ${displayName}`);
    
    return res.json({
      success: true,
      data: userFavoriteRegions,
      totalFavorites: userFavoriteRegions.length,
      sortedBy: sortBy,
      message: userFavoriteRegions.length === 0 
        ? "Vous n'avez pas encore de régions favorites" 
        : `Vous avez ${userFavoriteRegions.length} région${userFavoriteRegions.length > 1 ? 's' : ''} en favoris`
    });
    
  } catch (error) {
    console.error(`❌ Erreur getUserFavoriteRegions:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos régions favorites",
      data: [],
      totalFavorites: 0
    });
  }
};

// =====================================================================
// 📊 STATISTIQUES FAVORIS RÉGION
// =====================================================================

exports.getRegionFavoritesStats = async (req, res) => {
  try {
    const { region_id } = req.params;
    
    console.log(`📊 Statistiques favoris pour région: ${region_id}`);
    
    if (!region_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID de la région est requis."
      });
    }
    
    // Vérifier que la région existe
    const regionExists = await Region.findById(region_id);
    if (!regionExists) {
      return res.status(404).json({
        success: false,
        message: "La région spécifiée n'existe pas."
      });
    }
    
    // Récupérer RegionDetails
    const regionDetails = await RegionDetails.findOne({ region_id });
    
    if (!regionDetails) {
      return res.json({
        success: true,
        data: {
          regionId: region_id,
          regionName: regionExists.name,
          totalFavorites: 0,
          favoritedBy: [],
          message: "Aucune donnée de favoris pour cette région"
        }
      });
    }
    
    const totalFavorites = regionDetails.favoritedBy ? regionDetails.favoritedBy.length : 0;
    
    return res.json({
      success: true,
      data: {
        regionId: region_id,
        regionName: regionExists.name,
        totalFavorites,
        favoritedBy: regionDetails.favoritedBy || [],
        lastFavoriteAdded: regionDetails.updatedAt
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur getRegionFavoritesStats:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques de favoris"
    });
  }
};

// =====================================================================
// 🔍 VÉRIFIER SI UNE RÉGION EST EN FAVORI
// =====================================================================

exports.checkRegionFavoriteStatus = async (req, res) => {
  try {
    const { region_id } = req.params;
    const { id: userId } = req.user;
    
    if (!region_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID de la région est requis."
      });
    }
    
    // Vérifier que la région existe
    const regionExists = await Region.findById(region_id);
    if (!regionExists) {
      return res.status(404).json({
        success: false,
        message: "La région spécifiée n'existe pas."
      });
    }
    
    // Récupérer RegionDetails
    const regionDetails = await RegionDetails.findOne({ region_id });
    
    let isFavorited = false;
    let totalFavorites = 0;
    
    if (regionDetails && regionDetails.favoritedBy) {
      isFavorited = regionDetails.favoritedBy.some(id => 
        id.toString() === userId.toString()
      );
      totalFavorites = regionDetails.favoritedBy.length;
    }
    
    return res.json({
      success: true,
      data: {
        regionId: region_id,
        regionName: regionExists.name,
        isFavorited,
        totalFavorites,
        userId
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur checkRegionFavoriteStatus:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du statut de favori"
    });
  }
};










exports.createOrUpdateRegionDetails = async (req, res) => {
  let originalTimeout = null;
  let timeoutHandlers = [];
  
  try {
    console.log('🚀 === DÉBUT TRAITEMENT RÉGION DETAILS (VERSION ÉPURÉE) ===');
    
    // ============================================
    // 1. CONFIGURATION TIMEOUTS
    // ============================================
    if (req.socket) {
      originalTimeout = req.socket.timeout;
      req.socket.setTimeout(30 * 60 * 1000); // 30 MINUTES
      console.log('🔧 Socket timeout étendu à 30 minutes');
    }
    
    const requestTimeoutId = setTimeout(() => {
      console.error('❌ REQUEST TIMEOUT (30min)');
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Traitement interrompu (30min max). Réduisez le nombre d\'images.',
          error: 'PROCESSING_TIMEOUT'
        });
      }
    }, 30 * 60 * 1000);
    timeoutHandlers.push(requestTimeoutId);

    // ============================================
    // 2. EXTRACTION ET VALIDATION DES DONNÉES
    // ============================================
    const { region_id, description, location, services, textSettings } = req.body;

    console.log('📋 === DONNÉES REÇUES ===');
    console.log('🆔 Région ID:', region_id);
    console.log('📊 Fichiers reçus:', {
      gallery: req.files?.gallery?.length || 0,
      totalFiles: req.files ? Object.values(req.files).flat().length : 0
    });

    // Validation région ID
    if (!region_id) {
      return res.status(400).json({ 
        success: false, 
        message: "L'ID de la région est requis." 
      });
    }

    // Vérifier existence région
    const regionExists = await Region.findById(region_id);
    if (!regionExists) {
      return res.status(404).json({ 
        success: false, 
        message: "La région spécifiée n'existe pas." 
      });
    }
    console.log('✅ Région trouvée:', regionExists.name);

    // ============================================
    // 3. TRAITEMENT DES DONNÉES DE BASE
    // ============================================
    const processedData = {
      description: description || "",
      location: (location && location.trim()) || regionExists.name?.trim() || "Non spécifiée"
    };

    // Traitement services
    processedData.services = await processServicesOptimized(services);
    console.log(`⚙️ ${processedData.services.length} services traités`);

    // Traitement paramètres texte
    processedData.textSettings = processTextSettingsOptimized(textSettings);

    // ============================================
    // 4. TRAITEMENT GALERIE D'IMAGES
    // ============================================
    processedData.gallery = [];
    if (req.files?.gallery && req.files.gallery.length > 0) {
      try {
        console.log(`📷 Traitement ${req.files.gallery.length} images galerie...`);
        
        // Traitement optimisé avec métadonnées
        const galleryResults = await processGalleryImagesOptimized(req.files.gallery, region_id);
        
        // Récupérer les URLs pour la base de données
        processedData.gallery = galleryResults.map(result => result.url);
        
        console.log(`✅ ${processedData.gallery.length} images galerie traitées avec métadonnées`);
        
        // Log des images traitées
        galleryResults.forEach((result, i) => {
          console.log(`📸 Image ${i+1}: ${result.filename} (${(result.size/1024).toFixed(1)}KB) -> ${result.url}`);
        });
        
      } catch (galleryError) {
        console.error('❌ Erreur traitement galerie:', galleryError.message);
        processedData.gallery = [];
      }
    }

    // ============================================
    // 5. SAUVEGARDE EN BASE DE DONNÉES
    // ============================================
    console.log('💾 === SAUVEGARDE EN BASE ===');
    const savedRegionDetails = await saveRegionDetailsOptimized(region_id, processedData);
    console.log('✅ Données sauvegardées en base');

    // ============================================
    // 6. RÉPONSE FINALE AVEC STATISTIQUES
    // ============================================
    timeoutHandlers.forEach(id => clearTimeout(id));
    
    console.log('🎉 === TRAITEMENT TERMINÉ AVEC SUCCÈS ===');

    // Statistiques finales
    const stats = {
      totalServices: savedRegionDetails.services?.length || 0,
      totalGalleryImages: savedRegionDetails.gallery?.length || 0,
      lastUpdated: savedRegionDetails.updatedAt,
      completionStatus: 'Updated'
    };

    console.log('📊 Statistiques finales:', stats);

    res.status(200).json({
      success: true,
      message: "Détails de la région mis à jour avec succès.",
      details: {
        ...savedRegionDetails.toObject(),
        metadata: stats
      }
    });

  } catch (error) {
    console.error("❌ === ERREUR GLOBALE CONTROLLER ===");
    console.error("Type:", error.constructor.name);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    
    if (req.files) {
      await cleanupTempFilesAdvanced(req.files);
    }
    
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite lors de la sauvegarde.",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne',
      timestamp: new Date().toISOString()
    });

  } finally {
    // Nettoyage final
    if (req.socket && originalTimeout !== null) {
      req.socket.setTimeout(originalTimeout);
    }
    
    timeoutHandlers.forEach(id => {
      try {
        clearTimeout(id);
      } catch (e) {
        // Ignore
      }
    });
    
    console.log('🧹 === NETTOYAGE TERMINÉ ===');
    console.log('🏁 === FIN TRAITEMENT RÉGION ===\n');
  }
};

// =====================================================================
// 🔧 FONCTIONS UTILITAIRES
// =====================================================================

// ✅ TRAITEMENT SERVICES
async function processServicesOptimized(services) {
  if (!services) return [];

  try {
    let parsedServices = [];
    
    if (typeof services === 'string') {
      parsedServices = JSON.parse(services);
    } else if (Array.isArray(services)) {
      parsedServices = services;
    } else {
      return [];
    }

    return parsedServices
      .filter(service => service && typeof service === 'object' && service.type)
      .slice(0, 20)
      .map(service => ({
        type: String(service.type).trim(),
        icon: service.icon || '⚙️',
        description: service.description || service.type,
        isActive: service.isActive !== undefined ? Boolean(service.isActive) : true,
        priority: service.priority || 0,
        createdAt: new Date()
      }));

  } catch (error) {
    console.error('❌ Erreur traitement services:', error.message);
    return [];
  }
}

// ✅ TRAITEMENT PARAMÈTRES TEXTE
function processTextSettingsOptimized(textSettings) {
  if (!textSettings) {
    return { fontSize: 16, lineHeight: 1.4 };
  }

  try {
    let parsed = {};
    
    if (typeof textSettings === 'string') {
      parsed = JSON.parse(textSettings);
    } else if (typeof textSettings === 'object') {
      parsed = textSettings;
    }

    return {
      fontSize: Math.min(Math.max(parseInt(parsed.fontSize) || 16, 12), 24),
      lineHeight: Math.min(Math.max(parseFloat(parsed.lineHeight) || 1.4, 1.0), 2.0)
    };

  } catch (error) {
    console.error('❌ Erreur textSettings:', error.message);
    return { fontSize: 16, lineHeight: 1.4 };
  }
}

// ✅ TRAITEMENT GALERIE OPTIMISÉ
async function processGalleryImagesOptimized(galleryFiles, regionId) {
  console.log('📷 === TRAITEMENT GALERIE OPTIMISÉ ===');
  console.log(`📊 ${galleryFiles.length} images à traiter pour région ${regionId}`);
  
  const galleryDir = path.join(process.cwd(), 'assets', 'images', 'galleries_region', regionId);
  await fs.mkdir(galleryDir, { recursive: true });
  console.log(`📁 Dossier créé: ${galleryDir}`);

  const galleryResults = [];
  const maxGalleryImages = Math.min(galleryFiles.length, 5);

  for (let i = 0; i < maxGalleryImages; i++) {
    const image = galleryFiles[i];
    
    try {
      console.log(`🔄 Traitement image galerie ${i+1}/${maxGalleryImages}: ${image.originalname}`);
      
      // Validation fichier
      if (!image.path || !fsSync.existsSync(image.path)) {
        console.warn(`⚠️ Image galerie ${i+1}: fichier temporaire introuvable`);
        continue;
      }

      const stats = await fs.stat(image.path);
      if (stats.size > 10 * 1024 * 1024) {
        console.warn(`⚠️ Image galerie ${i+1}: trop volumineux (${Math.round(stats.size / 1024 / 1024)}MB)`);
        continue;
      }

      // Génération nom de fichier unique
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1000);
      const filename = `gallery_${regionId}_${timestamp}_${i}_${randomSuffix}.webp`;
      const outputPath = path.join(galleryDir, filename);

      // Traitement image avec Sharp
      await Promise.race([
        sharp(image.path)
          .resize(1200, 800, { 
            fit: 'inside', 
            withoutEnlargement: true,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .webp({ 
            quality: 85,
            effort: 4
          })
          .toFile(outputPath),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout traitement image galerie')), 45000)
        )
      ]);

      // Génération URL publique
      const publicUrl = `/assets/images/galleries_region/${regionId}/${filename}`;
      
      // Métadonnées de l'image
      const finalStats = await fs.stat(outputPath);
      const imageData = {
        id: `gallery_${timestamp}_${randomSuffix}`,
        url: publicUrl,
        filename: filename,
        originalName: image.originalname,
        size: finalStats.size,
        uploadedAt: new Date().toISOString(),
        processedAt: new Date()
      };

      galleryResults.push(imageData);
      console.log(`✅ Image galerie ${i+1} traitée: ${filename} (${(finalStats.size/1024).toFixed(1)}KB)`);

      // Nettoyage fichier temporaire
      await cleanupTempFileSecure(image.path);

    } catch (imageError) {
      console.error(`❌ Erreur image galerie ${i+1}:`, imageError.message);
      
      // Nettoyage en cas d'erreur
      try {
        await fs.unlink(image.path);
      } catch {}
    }
  }

  console.log(`✅ Traitement galerie terminé: ${galleryResults.length}/${galleryFiles.length} images traitées`);
  return galleryResults;
}

// ✅ SAUVEGARDE OPTIMISÉE
async function saveRegionDetailsOptimized(regionId, processedData) {
  try {
    console.log('💾 Sauvegarde avec gestion galerie...');
    
    let existingRegion = await RegionDetails.findOne({ region_id: regionId });
    
    if (existingRegion) {
      console.log('📝 Mise à jour région existante avec fusion galerie');
      
      // Fusion intelligente de la galerie
      let finalGallery = [];
      
      if (processedData.gallery && processedData.gallery.length > 0) {
        // Ajouter les nouvelles images aux existantes
        const existingGallery = existingRegion.gallery || [];
        finalGallery = [...existingGallery, ...processedData.gallery];
        
        // Supprimer les doublons
        finalGallery = [...new Set(finalGallery)];
        
        // Limiter à 10 images max (garder les plus récentes)
        if (finalGallery.length > 10) {
          finalGallery = finalGallery.slice(-10);
        }
        
        console.log(`🖼️ Galerie fusionnée: ${existingGallery.length} + ${processedData.gallery.length} = ${finalGallery.length} images`);
      } else {
        // Pas de nouvelles images, garder les existantes
        finalGallery = existingRegion.gallery || [];
        console.log(`🔒 Conservation galerie existante: ${finalGallery.length} images`);
      }
      
      const updateData = {
        ...processedData,
        gallery: finalGallery,
        updatedAt: new Date()
      };

      existingRegion = await RegionDetails.findOneAndUpdate(
        { region_id: regionId },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      console.log(`✅ Région mise à jour avec ${finalGallery.length} images en galerie`);
      return existingRegion;
      
    } else {
      console.log('🆕 Création nouvelle région avec galerie');
      
      const newRegionData = {
        region_id: regionId,
        ...processedData,
        gallery: processedData.gallery || [],
        services: processedData.services || [],
        photos: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newRegion = new RegionDetails(newRegionData);
      await newRegion.save();
      
      console.log(`✅ Nouvelle région créée avec ${newRegionData.gallery.length} images`);
      return newRegion;
    }
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde avec galerie:', error);
    throw error;
  }
}

// =====================================================================
// 📖 CONTRÔLEUR LECTURE - GET REGION DETAILS (ÉPURÉ)
// =====================================================================

// =====================================================================
// 📖 CONTRÔLEUR LECTURE - GET REGION DETAILS (RÉÉCRITURE COMPLÈTE AVEC FAVORIS)
// =====================================================================

exports.getRegionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ============================================
    // 1. VALIDATION AUTHENTIFICATION
    // ============================================
    if (!req.user || !req.user.id) {
      console.error('❌ Utilisateur non authentifié');
      return res.status(401).json({
        success: false,
        message: "Authentification requise pour accéder aux détails de la région."
      });
    }
    
    const currentUserId = req.user.id;
    const currentUsername = req.user.username || `User${currentUserId.slice(-6)}`;
    
    console.log(`👤 Utilisateur connecté: ${currentUsername} (${currentUserId})`);
    console.log(`🏝️ Détails demandés pour la région: ${id}`);

    // ============================================
    // 2. VALIDATION ID RÉGION
    // ============================================
    if (!id || String(id).trim() === '') {
      return res.status(400).json({
        success: false,
        message: "L'ID de la région est requis et ne peut pas être vide."
      });
    }

    const cleanId = String(id).trim();

    // ============================================
    // 3. RECHERCHE RÉGION DE BASE
    // ============================================
    let regionExists;
    try {
      console.log(`🔍 Recherche région avec ID: "${cleanId}"`);
      
      regionExists = await Region.findById(cleanId).lean();
      
      if (!regionExists) {
        regionExists = await Region.findOne({ 
          $or: [
            { _id: cleanId },
            { name: { $regex: new RegExp(cleanId, 'i') } }
          ]
        }).lean();
      }
      
    } catch (findError) {
      console.error(`❌ Erreur recherche région:`, findError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la recherche de la région en base de données.",
        error: process.env.NODE_ENV === 'development' ? findError.message : 'Erreur de base de données'
      });
    }

    if (!regionExists) {
      console.log(`❌ Région avec ID "${cleanId}" non trouvée`);
      return res.status(404).json({
        success: false,
        message: `Région avec l'ID "${cleanId}" non trouvée dans la base de données.`
      });
    }

    console.log(`✅ Région trouvée: "${regionExists.name}" (ID: ${regionExists._id})`);

    // ============================================
    // 4. RECHERCHE OU CRÉATION REGIONDETAILS
    // ============================================
    let details;
    try {
      console.log(`🔍 Recherche RegionDetails pour region_id: ${cleanId}`);
      details = await RegionDetails.findOne({ region_id: cleanId }).lean();
      
    } catch (detailsError) {
      console.error(`❌ Erreur recherche RegionDetails:`, detailsError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la recherche des détails de la région.",
        error: process.env.NODE_ENV === 'development' ? detailsError.message : 'Erreur de base de données'
      });
    }
    
    // Créer RegionDetails s'il n'existe pas
    if (!details) {
      console.log(`⚠️ Création RegionDetails pour la région ${cleanId} (${regionExists.name})`);
      
      try {
        const newDetails = new RegionDetails({
          region_id: cleanId,
          description: regionExists.description || `Découvrez ${regionExists.name}, une région magnifique à explorer.`,
          location: regionExists.location || regionExists.country || "Localisation à préciser",
          rating: 0,
          totalReviews: 0,
          gallery: [],
          services: [
            { type: "Loisirs", icon: "🎯", description: "Activités de loisirs et découvertes", isActive: true, priority: 1, createdAt: new Date() },
            { type: "Hébergement", icon: "🏨", description: "Hôtels, auberges et logements", isActive: true, priority: 2, createdAt: new Date() },
            { type: "Restauration", icon: "🍽️", description: "Restaurants et spécialités locales", isActive: true, priority: 3, createdAt: new Date() },
            { type: "Guide touristique", icon: "👥", description: "Guides locaux et visites guidées", isActive: true, priority: 4, createdAt: new Date() },
            { type: "Transport", icon: "🚗", description: "Moyens de transport et location", isActive: true, priority: 5, createdAt: new Date() },
            { type: "Administration", icon: "🏛️", description: "Services administratifs et officiels", isActive: true, priority: 6, createdAt: new Date() }
          ],
          photos: [],
          comments: [],
          favoritedBy: [], // Initialiser le tableau des favoris
          textSettings: { fontSize: 16, lineHeight: 1.4 }
        });
        
        details = await newDetails.save();
        console.log(`✅ RegionDetails créé avec succès pour "${regionExists.name}"`);
        details = details.toObject();
        
      } catch (saveError) {
        console.error(`❌ Erreur sauvegarde RegionDetails:`, saveError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la création des détails de la région.",
          error: process.env.NODE_ENV === 'development' ? saveError.message : 'Erreur de sauvegarde'
        });
      }
    }

    // ============================================
    // 5. TRAITEMENT DES DONNÉES - BASE
    // ============================================
    console.log(`🔄 Traitement des données pour la région "${regionExists.name}"`);
    
    const processedDetails = {
      ...details,
      name: regionExists.name,
      regionImage: regionExists.placeImage || null,
      placeImage: regionExists.placeImage || null,
      country: regionExists.country || null
    };

    // ============================================
    // 6. TRAITEMENT DES FAVORIS
    // ============================================
    console.log(`💖 Vérification statut favoris pour utilisateur ${currentUsername}`);
    
    const isFavoritedByCurrentUser = details.favoritedBy && Array.isArray(details.favoritedBy) 
      ? details.favoritedBy.some(userId => userId && userId.toString() === currentUserId.toString())
      : false;
    
    const totalFavorites = details.favoritedBy ? details.favoritedBy.length : 0;
    
    processedDetails.isFavoriteByUser = isFavoritedByCurrentUser;
    processedDetails.totalFavorites = totalFavorites;
    
    console.log(`💖 Statut favori: ${isFavoritedByCurrentUser ? 'EN FAVORI' : 'PAS EN FAVORI'} (Total: ${totalFavorites} utilisateurs)`);

    // ============================================
    // 7. TRAITEMENT DES PHOTOS COMMUNAUTÉ
    // ============================================
    if (processedDetails.photos && Array.isArray(processedDetails.photos) && processedDetails.photos.length > 0) {
      console.log(`📸 Traitement de ${processedDetails.photos.length} photos communauté`);
      
      processedDetails.photos = processedDetails.photos.map((photo, index) => {
        try {
          const likedBy = photo.likedBy || [];
          const hasUserLiked = Array.isArray(likedBy) ? likedBy.some(userId => userId && userId.toString() === currentUserId.toString()) : false;
          
          return {
            ...photo,
            _id: photo._id || `photo_${index}`,
            isLikedByUser: hasUserLiked,
            likes: Math.max(0, parseInt(photo.likes) || 0),
            username: photo.username || 'Utilisateur',
            createdAt: photo.createdAt || new Date(),
            imageUrl: photo.imageUrl || null
          };
        } catch (photoError) {
          console.warn(`⚠️ Erreur traitement photo ${index}:`, photoError.message);
          return { 
            ...photo, 
            _id: photo._id || `photo_${index}`, 
            isLikedByUser: false, 
            likes: 0, 
            username: photo.username || 'Utilisateur', 
            createdAt: photo.createdAt || new Date(), 
            imageUrl: photo.imageUrl || null 
          };
        }
      });
      
      console.log(`✅ ${processedDetails.photos.length} photos traitées avec succès`);
    } else {
      processedDetails.photos = [];
      console.log(`📸 Aucune photo communauté pour la région "${regionExists.name}"`);
    }

    // ============================================
    // 8. TRAITEMENT DES COMMENTAIRES
    // ============================================
    if (processedDetails.comments && Array.isArray(processedDetails.comments) && processedDetails.comments.length > 0) {
      console.log(`💬 Traitement de ${processedDetails.comments.length} commentaires`);
      
      processedDetails.comments = processedDetails.comments.map((comment, commentIndex) => {
        try {
          const commentLikedBy = comment.likedBy || [];
          const hasUserLikedComment = Array.isArray(commentLikedBy) ? commentLikedBy.some(userId => userId && userId.toString() === currentUserId.toString()) : false;
          
          const processedComment = {
            ...comment,
            _id: comment._id || `comment_${commentIndex}`,
            isLikedByUser: hasUserLikedComment,
            likes: Math.max(0, parseInt(comment.likes) || 0),
            username: comment.username || 'Utilisateur',
            comment: comment.comment || '',
            createdAt: comment.createdAt || new Date(),
            replies: []
          };
          
          // Traitement des réponses
          if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
            processedComment.replies = comment.replies.map((reply, replyIndex) => {
              try {
                const replyLikedBy = reply.likedBy || [];
                const hasUserLikedReply = Array.isArray(replyLikedBy) ? replyLikedBy.some(userId => userId && userId.toString() === currentUserId.toString()) : false;
                
                return {
                  ...reply,
                  _id: reply._id || `reply_${commentIndex}_${replyIndex}`,
                  isLikedByUser: hasUserLikedReply,
                  likes: Math.max(0, parseInt(reply.likes) || 0),
                  username: reply.username || 'Utilisateur',
                  comment: reply.comment || '',
                  createdAt: reply.createdAt || new Date()
                };
              } catch (replyError) {
                console.warn(`⚠️ Erreur traitement réponse ${commentIndex}-${replyIndex}:`, replyError.message);
                return { 
                  ...reply, 
                  _id: reply._id || `reply_${commentIndex}_${replyIndex}`, 
                  isLikedByUser: false, 
                  likes: 0, 
                  username: reply.username || 'Utilisateur', 
                  comment: reply.comment || '', 
                  createdAt: reply.createdAt || new Date() 
                };
              }
            });
            
            console.log(`↪️ ${processedComment.replies.length} réponses traitées pour commentaire ${commentIndex}`);
          }
          
          return processedComment;
        } catch (commentError) {
          console.warn(`⚠️ Erreur traitement commentaire ${commentIndex}:`, commentError.message);
          return { 
            ...comment, 
            _id: comment._id || `comment_${commentIndex}`, 
            isLikedByUser: false, 
            likes: 0, 
            username: comment.username || 'Utilisateur', 
            comment: comment.comment || '', 
            createdAt: comment.createdAt || new Date(), 
            replies: [] 
          };
        }
      });
      
      console.log(`✅ ${processedDetails.comments.length} commentaires traités avec succès`);
    } else {
      processedDetails.comments = [];
      console.log(`💬 Aucun commentaire pour la région "${regionExists.name}"`);
    }

    // ============================================
    // 9. TRAITEMENT DES SERVICES   
    // ============================================
    if (processedDetails.services && Array.isArray(processedDetails.services)) {
      processedDetails.services = processedDetails.services
        .filter(service => service && service.type && service.isActive !== false)
        .sort((a, b) => (a.priority || 0) - (b.priority || 0));
      console.log(`⚙️ ${processedDetails.services.length} services actifs traités`);
    } else {
      processedDetails.services = [];
      console.log(`⚙️ Aucun service pour la région "${regionExists.name}"`);
    }

    // ============================================
    // 10. TRAITEMENT DE LA GALERIE
    // ============================================
    if (processedDetails.gallery && Array.isArray(processedDetails.gallery)) {
      processedDetails.gallery = processedDetails.gallery.filter(url => url && typeof url === 'string');
      console.log(`🖼️ ${processedDetails.gallery.length} images de galerie traitées`);
    } else {
      processedDetails.gallery = [];
      console.log(`🖼️ Aucune image de galerie pour la région "${regionExists.name}"`);
    }

    // ============================================
    // 11. CALCULS FINAUX ET STATISTIQUES
    // ============================================
    processedDetails.totalReviews = processedDetails.comments.length;
    
    // Calcul du statut de complétion
    const completionPercentage = processedDetails.metadata?.completionStatus?.percentage || 0;
    processedDetails.hasFullDetails = completionPercentage >= 80;
    
    // Statistiques enrichies pour la réponse
    const enrichedStats = {
      totalPhotos: processedDetails.photos.length,
      totalComments: processedDetails.comments.length,
      totalServices: processedDetails.services.length,
      totalGalleryImages: processedDetails.gallery.length,
      totalFavorites: processedDetails.totalFavorites,
      isFavoriteByUser: processedDetails.isFavoriteByUser,
      completionPercentage: completionPercentage,
      hasFullDetails: processedDetails.hasFullDetails,
      totalReplies: processedDetails.comments.reduce((total, comment) => total + (comment.replies ? comment.replies.length : 0), 0)
    };

    console.log(`✅ Données complètement traitées pour "${regionExists.name}"`);
    console.log(`📊 Statistiques finales:`, enrichedStats);

    // ============================================
    // 12. RÉPONSE FINALE STRUCTURÉE
    // ============================================
    return res.status(200).json({
      success: true,
      details: processedDetails,
      stats: enrichedStats,
      user: {
        id: currentUserId,
        username: currentUsername,
        isFavorite: processedDetails.isFavoriteByUser
      },
      message: `Détails de la région "${regionExists.name}" récupérés avec succès.`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // ============================================
    // 13. GESTION GLOBALE DES ERREURS
    // ============================================
    console.error("❌ === ERREUR GLOBALE getRegionDetails ===");
    console.error("Type:", error.constructor.name);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Utilisateur:", req.user?.id || 'Non authentifié');
    console.error("Région demandée:", req.params?.id || 'Non spécifiée');
    
    return res.status(500).json({
      success: false,
      message: "Une erreur interne critique s'est produite lors de la récupération des détails de la région.",
      error: process.env.NODE_ENV === 'development' ? {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack
      } : 'Erreur serveur interne',
      timestamp: new Date().toISOString(),
      requestInfo: {
        regionId: req.params?.id || null,
        userId: req.user?.id || null
      }
    });
  }
};

// =====================================================================
// 📊 RÉSUMÉ DES AMÉLIORATIONS APPORTÉES
// =====================================================================



// =====================================================================
// 📸 ROUTES GALERIE - UPLOAD ET SUPPRESSION
// =====================================================================

// Route upload galerie
exports.uploadGalleryImages = async (req, res) => {
  console.log('📤 === UPLOAD GALERIE IMAGES ===');
  
  try {
    const { region_id } = req.body;
    
    if (!region_id) {
      return res.status(400).json({
        success: false,
        message: 'Région non trouvée'
      });
    }
    
    // Traitement des images
    const processedImages = await processGalleryImagesOptimized(req.files.gallery, region_id);
    
    if (processedImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image n\'a pu être traitée'
      });
    }
    
    // Mise à jour de la base de données
    let regionDetails = await RegionDetails.findOne({ region_id });
    
    if (!regionDetails) {
      // Créer RegionDetails s'il n'existe pas
      const regionExists = await Region.findById(region_id);
      if (!regionExists) {
        return res.status(404).json({
          success: false,
          message: 'Région non trouvée'
        });
      }
      
      regionDetails = new RegionDetails({
        region_id,
        description: regionExists.description || `Découvrez ${regionExists.name}, une région magnifique à explorer.`,
        location: regionExists.location || regionExists.country || "Localisation à préciser",
        gallery: [],
        services: [],
        photos: [],
        comments: [],
        textSettings: { fontSize: 16, lineHeight: 1.4 }
      });
    }
    
    // Ajouter les nouvelles images à la galerie existante
    const newGalleryUrls = processedImages.map(img => img.url);
    regionDetails.gallery = [...(regionDetails.gallery || []), ...newGalleryUrls];
    
    // Limiter à 10 images max
    if (regionDetails.gallery.length > 10) {
      regionDetails.gallery = regionDetails.gallery.slice(-10);
    }
    
    regionDetails.updatedAt = new Date();
    await regionDetails.save();
    
    console.log(`✅ ${processedImages.length} images ajoutées à la galerie de la région ${region_id}`);
    
    res.json({
      success: true,
      message: `${processedImages.length} image(s) uploadée(s) avec succès`,
      data: {
        uploaded: processedImages,
        totalGalleryImages: regionDetails.gallery.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur upload galerie:', error);
    
    // Nettoyer les fichiers temporaires en cas d'erreur
    if (req.files && req.files.gallery) {
      for (const file of req.files.gallery) {
        try {
          await fs.unlink(file.path);
        } catch {}
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload',
      error: error.message
    });
  }
};

// Route suppression image galerie
exports.deleteGalleryImage = async (req, res) => {
  console.log('🗑️ === SUPPRESSION IMAGE GALERIE ===');
  
  try {
    const { region_id, image_url } = req.params;
    
    console.log(`🗑️ Suppression demandée: région ${region_id}, image ${image_url}`);
    
    if (!region_id || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'region_id et image_url sont requis'
      });
    }
    
    // Décoder l'URL de l'image
    const decodedImageUrl = decodeURIComponent(image_url);
    console.log(`📋 URL décodée: ${decodedImageUrl}`);
    
    // Trouver RegionDetails
    const regionDetails = await RegionDetails.findOne({ region_id });
    
    if (!regionDetails) {
      return res.status(404).json({
        success: false,
        message: 'Région non trouvée'
      });
    }
    
    // Vérifier si l'image existe dans la galerie
    const imageIndex = regionDetails.gallery.findIndex(url => 
      url === decodedImageUrl || 
      url.includes(decodedImageUrl) ||
      decodedImageUrl.includes(url)
    );
    
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image non trouvée dans la galerie'
      });
    }
    
    const imageUrl = regionDetails.gallery[imageIndex];
    console.log(`📸 Image trouvée: ${imageUrl}`);
    
    // Extraire le nom du fichier de l'URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Construire le chemin physique du fichier
    const filePath = path.join(process.cwd(), 'assets', 'images', 'galleries_region', region_id, filename);
    
    console.log(`📁 Chemin fichier: ${filePath}`);
    
    // Supprimer le fichier physique
    try {
      if (fsSync.existsSync(filePath)) {
        await fs.unlink(filePath);
        console.log(`✅ Fichier physique supprimé: ${filename}`);
      } else {
        console.warn(`⚠️ Fichier physique non trouvé: ${filePath}`);
      }
    } catch (fileError) {
      console.error(`❌ Erreur suppression fichier: ${fileError.message}`);
      // Continuer même si la suppression physique échoue
    }
    
    // Supprimer l'URL de la galerie en base
    regionDetails.gallery.splice(imageIndex, 1);
    regionDetails.updatedAt = new Date();
    await regionDetails.save();
    
    console.log(`✅ Image supprimée de la galerie. Reste ${regionDetails.gallery.length} images`);
    
    res.json({
      success: true,
      message: 'Image supprimée avec succès',
      data: {
        deletedImage: imageUrl,
        remainingImages: regionDetails.gallery.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression image galerie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};

// Route liste galerie
exports.getGalleryImages = async (req, res) => {
  try {
    const { region_id } = req.params;
    
    if (!region_id) {
      return res.status(400).json({
        success: false,
        message: 'region_id est requis'
      });
    }
    
    const regionDetails = await RegionDetails.findOne({ region_id });
    
    if (!regionDetails) {
      return res.json({
        success: true,
        data: {
          images: [],
          count: 0
        }
      });
    }
    
    // Vérifier l'existence physique des fichiers
    const validImages = [];
    
    for (const imageUrl of regionDetails.gallery || []) {
      try {
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        const filePath = path.join(process.cwd(), 'assets', 'images', 'galleries_region', region_id, filename);
        
        if (fsSync.existsSync(filePath)) {
          const stats = await fs.stat(filePath);
          validImages.push({
            url: imageUrl,
            filename: filename,
            size: stats.size,
            uploadedAt: stats.birthtime || stats.ctime
          });
        }
      } catch (error) {
        console.warn(`⚠️ Erreur vérification image ${imageUrl}:`, error.message);
      }
    }
    
    // Mettre à jour la base si des images n'existent plus
    if (validImages.length !== (regionDetails.gallery || []).length) {
      regionDetails.gallery = validImages.map(img => img.url);
      await regionDetails.save();
      console.log(`🔄 Galerie mise à jour: ${validImages.length} images valides`);
    }
    
    res.json({
      success: true,
      data: {
        images: validImages,
        count: validImages.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur liste galerie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la galerie',
      error: error.message
    });
  }
};

// =====================================================================
// 📸 CONTRÔLEURS PHOTOS ET COMMENTAIRES (CONSERVÉS)
// =====================================================================

exports.addPhoto = async (req, res) => {
  try {
    const { region_id } = req.params;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise pour ajouter une photo."
      });
    }
    
    const { id: user_id, username } = req.user;
    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`📸 Tentative d'ajout de photo pour la région: ${region_id}`);

    if (!region_id || String(region_id).trim() === '') {
      return res.status(400).json({
        success: false,
        message: "L'ID de la région est requis."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucune image n'a été téléchargée."
      });
    }

    let regionDetails = await RegionDetails.findOne({ region_id });
    
    if (!regionDetails) {
      const regionExists = await Region.findById(region_id);
      if (!regionExists) {
        return res.status(404).json({
          success: false,
          message: "Région non trouvée."
        });
      }
      
      regionDetails = new RegionDetails({
        region_id,
        description: regionExists.description || "Description en cours de rédaction", 
        location: regionExists.location || regionExists.country || "Localisation à préciser",
        gallery: [],
        services: [],
        photos: [],
        comments: [],
        textSettings: { fontSize: 16, lineHeight: 1.4 }
      });
      
      await regionDetails.save();
    }

    try {
      const photosDir = path.join(process.cwd(), 'assets', 'images', 'community_region', region_id);
      await fs.mkdir(photosDir, { recursive: true });

      const filename = `${Date.now()}-${user_id}-${Math.random().toString(36).substr(2, 9)}.webp`;
      const outputPath = path.join(photosDir, filename);

      await sharp(req.file.path)
        .resize(1200, 900, { 
          fit: 'inside', 
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ 
          quality: 85,
          effort: 4
        })
        .toFile(outputPath);

      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn(`⚠️ Impossible de supprimer le fichier temporaire: ${req.file.path}`);
      }

      const imageUrl = `/assets/images/community_region/${region_id}/${filename}`;

      const newPhoto = {
        imageUrl,
        user: new mongoose.Types.ObjectId(user_id),
        username: displayName,
        userId: new mongoose.Types.ObjectId(user_id),
        likes: 0,
        likedBy: [],
        createdAt: new Date()
      };

      regionDetails.photos.push(newPhoto);
      await regionDetails.save();

      const addedPhoto = regionDetails.photos[regionDetails.photos.length - 1];

      return res.status(200).json({
        success: true,
        message: "Photo ajoutée avec succès.",
        photo: {
          ...addedPhoto.toObject ? addedPhoto.toObject() : addedPhoto,
          isLikedByUser: false
        }
      });

    } catch (imageError) {
      console.error("❌ Erreur traitement image:", imageError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors du traitement de l'image."
      });
    }
  } catch (error) {
    console.error("❌ Erreur générale addPhoto:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite lors de l'ajout de la photo."
    });
  }
};

exports.deleteSharedPhoto = async (req, res) => {
  try {
    const { region_id, photo_id } = req.params;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise pour supprimer une photo."
      });
    }

    const { id: user_id } = req.user;

    console.log(`🗑️ Tentative de suppression de photo`);
    console.log(`🌍 Région: ${region_id}`);
    console.log(`📸 Photo: ${photo_id}`);
    console.log(`👤 Utilisateur: ${user_id}`);

    // Validations
    if (!region_id || String(region_id).trim() === '') {
      return res.status(400).json({
        success: false,
        message: "L'ID de la région est requis."
      });
    }

    if (!photo_id || String(photo_id).trim() === '') {
      return res.status(400).json({
        success: false,
        message: "L'ID de la photo est requis."
      });
    }

    // Chercher les détails de la région
    const regionDetails = await RegionDetails.findOne({ region_id });
    
    if (!regionDetails) {
      console.log("❌ RegionDetails non trouvé");
      return res.status(404).json({
        success: false,
        message: "Région non trouvée."
      });
    }

    console.log(`✅ RegionDetails trouvé`);

    // Chercher la photo dans la collection
    const photoIndex = regionDetails.photos.findIndex(
      photo => photo._id.toString() === photo_id
    );

    if (photoIndex === -1) {
      console.log("❌ Photo non trouvée dans la collection");
      return res.status(404).json({
        success: false,
        message: "Photo non trouvée."
      });
    }

    const photo = regionDetails.photos[photoIndex];
    console.log(`✅ Photo trouvée:`, {
      id: photo._id,
      owner: photo.userId,
      currentUser: user_id
    });

    // Vérifier que l'utilisateur est propriétaire de la photo
    if (photo.userId.toString() !== user_id.toString()) {
      console.log("❌ L'utilisateur n'est pas propriétaire de cette photo");
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas la permission de supprimer cette photo."
      });
    }

    // Supprimer le fichier physique
    try {
      const imagePath = path.join(process.cwd(), photo.imageUrl);
      
      console.log(`🔍 Vérification du fichier: ${imagePath}`);

      try {
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        console.log(`✅ Fichier supprimé avec succès: ${imagePath}`);
      } catch (fileError) {
        if (fileError.code === 'ENOENT') {
          console.log(`⚠️ Fichier non trouvé (déjà supprimé): ${imagePath}`);
        } else {
          console.error("❌ Erreur lors de la suppression du fichier:", fileError);
          // On continue même si la suppression échoue
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la construction du chemin:", error);
      // On continue même si la suppression du fichier échoue
    }

    // Supprimer la photo de la collection
    regionDetails.photos.splice(photoIndex, 1);

    // Sauvegarder les changements
    try {
      await regionDetails.save();
      console.log(`✅ Photo supprimée de la base de données`);
    } catch (saveError) {
      console.error("❌ Erreur lors de la sauvegarde:", saveError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de la photo.",
        error: saveError.message
      });
    }

    res.status(200).json({
      success: true,
      message: "Photo supprimée avec succès.",
      deletedPhotoId: photo_id,
      regionId: region_id
    });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la photo:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite lors de la suppression de la photo.",
      error: error.message
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { region_id } = req.params;
    const { comment } = req.body;
    const { id: user_id, username } = req.user;

    if (!region_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID de la région est requis."
      });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Le commentaire ne peut pas être vide."
      });
    }

    let regionDetails = await RegionDetails.findOne({ region_id });
    if (!regionDetails) {
      return res.status(404).json({
        success: false,
        message: "Détails de la région non trouvés."
      });
    }

    regionDetails.comments.push({
      user: user_id,
      username,
      comment: comment.trim(),
      likes: 0,
      likedBy: [],
      replies: []
    });

    await regionDetails.save();

    res.status(200).json({
      success: true,
      message: "Commentaire ajouté avec succès.",
      comment: regionDetails.comments[regionDetails.comments.length - 1]
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer."
    });
  }
};

exports.addReply = async (req, res) => {
  try {
    const { region_id, comment_id } = req.params;
    const { reply } = req.body;
    const { id: user_id, username } = req.user;

    if (!region_id || !comment_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID de la région et du commentaire sont requis."
      });
    }

    if (!reply || reply.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "La réponse ne peut pas être vide."
      });
    }

    let regionDetails = await RegionDetails.findOne({ region_id });
    if (!regionDetails) {
      return res.status(404).json({
        success: false,
        message: "Détails de la région non trouvés."
      });
    }

    const commentIndex = regionDetails.comments.findIndex(c => c._id.toString() === comment_id);
    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Commentaire non trouvé."
      });
    }

    regionDetails.comments[commentIndex].replies.push({
      user: user_id,
      username,
      comment: reply.trim(),
      likes: 0,
      likedBy: [],
      createdAt: new Date()
    });

    await regionDetails.save();

    res.status(200).json({
      success: true,
      message: "Réponse ajoutée avec succès.",
      reply: regionDetails.comments[commentIndex].replies[regionDetails.comments[commentIndex].replies.length - 1]
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la réponse:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer."
    });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const { region_id, type, id } = req.params;
    const { id: user_id } = req.user;

    if (!region_id || !type || !id) {
      return res.status(400).json({
        success: false,
        message: "Tous les paramètres sont requis."
      });
    }

    if (!['comment', 'reply', 'photo'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type invalide. Les types valides sont: comment, reply, photo."
      });
    }

    let regionDetails = await RegionDetails.findOne({ region_id: region_id });
    if (!regionDetails) {
      return res.status(404).json({
        success: false,
        message: "Détails de la région non trouvés."
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(user_id);
    let result = {};

    if (type === 'photo') {
      const photoIndex = regionDetails.photos.findIndex(p => p._id.toString() === id);
      if (photoIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Photo non trouvée."
        });
      }
      
      const photo = regionDetails.photos[photoIndex];
      const hasLiked = photo.likedBy.some(userId => userId.toString() === user_id);
      
      if (hasLiked) {
        photo.likedBy = photo.likedBy.filter(userId => userId.toString() !== user_id);
        photo.likes = Math.max(0, photo.likes - 1);
        result = { action: 'unliked', newCount: photo.likes };
      } else {
        photo.likedBy.push(userObjectId);
        photo.likes += 1;
        result = { action: 'liked', newCount: photo.likes };
      }
      
    } else if (type === 'comment') {
      const commentIndex = regionDetails.comments.findIndex(c => c._id.toString() === id);
      if (commentIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Commentaire non trouvé."
        });
      }
      
      const comment = regionDetails.comments[commentIndex];
      const hasLiked = comment.likedBy.some(userId => userId.toString() === user_id);
      
      if (hasLiked) {
        comment.likedBy = comment.likedBy.filter(userId => userId.toString() !== user_id);
        comment.likes = Math.max(0, comment.likes - 1);
        result = { action: 'unliked', newCount: comment.likes };
      } else {
        comment.likedBy.push(userObjectId);
        comment.likes += 1;
        result = { action: 'liked', newCount: comment.likes };
      }
      
    } else if (type === 'reply') {
      let replyFound = false;
      let commentIndex = -1;
      let replyIndex = -1;
      
      for (let i = 0; i < regionDetails.comments.length; i++) {
        const comment = regionDetails.comments[i];
        for (let j = 0; j < comment.replies.length; j++) {
          if (comment.replies[j]._id.toString() === id) {
            commentIndex = i;
            replyIndex = j;
            replyFound = true;
            break;
          }
        }
        if (replyFound) break;
      }
      
      if (!replyFound) {
        return res.status(404).json({
          success: false,
          message: "Réponse non trouvée."
        });
      }
      
      const reply = regionDetails.comments[commentIndex].replies[replyIndex];
      const hasLiked = reply.likedBy.some(userId => userId.toString() === user_id);
      
      if (hasLiked) {
        reply.likedBy = reply.likedBy.filter(userId => userId.toString() !== user_id);
        reply.likes = Math.max(0, reply.likes - 1);
        result = { action: 'unliked', newCount: reply.likes };
      } else {
        reply.likedBy.push(userObjectId);
        reply.likes += 1;
        result = { action: 'liked', newCount: reply.likes };
      }
    }

    await regionDetails.save();

    res.status(200).json({
      success: true,
      message: `${result.action === 'liked' ? 'Like ajouté' : 'Like retiré'} avec succès.`,
      data: result
    });

  } catch (error) {
    console.error(`❌ Erreur toggleLike:`, error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer."
    });
  }
};

// =====================================================================
// 🛠️ UTILITAIRES DE NETTOYAGE
// =====================================================================

async function cleanupTempFileSecure(filePath) {
  try {
    if (filePath && fsSync.existsSync(filePath)) {
      await fs.unlink(filePath);
      console.log(`🗑️ Fichier temporaire supprimé: ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.warn(`⚠️ Erreur nettoyage ${filePath}:`, error.message);
  }
}

async function cleanupTempFilesAdvanced(files) {
  try {
    console.log('🧹 Nettoyage fichiers temporaires...');
    
    const allFiles = Object.values(files).flat();
    for (const file of allFiles) {
      try {
        if (file.path && fsSync.existsSync(file.path)) {
          await fs.unlink(file.path);
        }
      } catch (cleanupError) {
        console.warn(`⚠️ Erreur nettoyage ${file.originalname}:`, cleanupError.message);
      }
    }
    
    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.error('❌ Erreur nettoyage général:', error);
  }
}

// =====================================================================
// 🛠️ UTILITAIRES DE DEBUG (OPTIONNELS)
// =====================================================================

exports.emergencyCleanup = async (req, res) => {
  try {
    const { regionId } = req.params;
    const result = await RegionDetails.updateOne(
      { region_id: regionId },
      { $set: { gallery: [], updatedAt: new Date() } }
    );
    res.json({ success: true, message: "Nettoyage galerie réussi", result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================================================
// 📋 EXPORTS MODULE - TOUTES LES FONCTIONS DISPONIBLES
// =====================================================================

console.log('✅ === CONTRÔLEUR RÉGION DETAILS ÉPURÉ CHARGÉ ===');
console.log('🔧 Fonctionnalités disponibles:');
console.log('  ✅ Création/Mise à jour région (sans places populaires)');
console.log('  ✅ Galerie d\'images : upload, suppression, liste');
console.log('  ✅ Photos communauté : ajout, likes');
console.log('  ✅ Commentaires : ajout, réponses, likes');
console.log('  ✅ Services configurables');
console.log('  ✅ Paramètres de typographie');
console.log('  ✅ Gestion des erreurs robuste');
console.log('  ❌ Places populaires : SUPPRIMÉES COMPLÈTEMENT');
console.log('✅ === getRegionDetails COMPLÈTEMENT RÉÉCRIT ===');
console.log('🔧 Nouvelles fonctionnalités:');
console.log('  ✅ Gestion complète des favoris utilisateur');
console.log('  ✅ Statut isFavoriteByUser dans la réponse');
console.log('  ✅ Compteur totalFavorites affiché');
console.log('  ✅ Structure de réponse enrichie avec stats');
console.log('  ✅ Gestion d\'erreurs améliorée');
console.log('  ✅ Logging détaillé pour debug');
console.log('  ✅ Validation renforcée à chaque étape');
console.log('  ✅ Informations utilisateur dans la réponse');
console.log('  ✅ Timestamps et métadonnées complètes');

// ⚠️ IMPORTANT: Toutes les fonctions sont déjà exportées avec exports.nomFonction
// Pas besoin de module.exports = {...} à la fin car nous utilisons exports.fonction
// controllers/treasureDetailsController.js
const mongoose = require('mongoose'); 
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const TreasureDetails = require('../models/TreasureDetails');
const Treasure = require('../models/Treasures');

// Créer ou mettre à jour les détails d'un trésor

// ✅ MÉTHODE CORRIGÉE POUR createOrUpdateTreasureDetails
// Remplacer cette méthode dans votre treasureDetailsController.js

exports.createOrUpdateTreasureDetails = async (req, res) => {
  try {
    const { treasure_id, description, location, services, popularPlaces, textSettings } = req.body;

    // Validation des données requises
    if (!treasure_id) {
      return res.status(400).json({ 
        success: false, 
        message: "L'ID du trésor est requis." 
      });
    }

    console.log('📋 createOrUpdateTreasureDetails pour:', treasure_id);
    console.log('📋 Services reçus (brut):', services);
    console.log('📋 Type des services:', typeof services);

    // Vérifier si le trésor existe
    const treasureExists = await Treasure.findById(treasure_id);
    if (!treasureExists) {
      return res.status(404).json({ 
        success: false, 
        message: "Le trésor spécifié n'existe pas." 
      });
    }

    // Préparer les données
    let detailsData = {
      description: description || "",
      location: location || "",
    };

    // ✅ TRAITEMENT SPÉCIAL DES SERVICES (CORRECTION IMPORTANTE)
    if (services) {
      try {
        let parsedServices = [];
        
        // Si services est une chaîne JSON, la parser
        if (typeof services === 'string') {
          console.log('🔄 Parsing services JSON string:', services);
          parsedServices = JSON.parse(services);
        } else if (Array.isArray(services)) {
          console.log('✅ Services déjà en tableau');
          parsedServices = services;
        } else {
          console.log('⚠️ Format services non reconnu, ignoré');
          parsedServices = [];
        }

        // Valider et nettoyer les services
        const validatedServices = [];
        for (const service of parsedServices) {
          if (service && typeof service === 'object' && service.type) {
            const validatedService = {
              type: String(service.type).trim(),
              icon: service.icon || '⚙️',
              description: service.description || service.type,
              category: service.category || 'general',
              isActive: service.isActive !== undefined ? Boolean(service.isActive) : true,
              updatedAt: new Date()
            };
            
            validatedServices.push(validatedService);
            console.log(`✅ Service validé: ${validatedService.type}`);
          }
        }

        detailsData.services = validatedServices;
        console.log(`📋 ${validatedServices.length} service(s) traité(s) au total`);
        
      } catch (parseError) {
        console.error('❌ Erreur parsing services:', parseError);
        console.log('🔄 Utilisation de services vides par défaut');
        detailsData.services = [];
      }
    }

    // ✅ TRAITEMENT DES PARAMÈTRES TEXTE
    if (textSettings) {
      try {
        let parsedTextSettings = {};
        
        if (typeof textSettings === 'string') {
          parsedTextSettings = JSON.parse(textSettings);
        } else if (typeof textSettings === 'object') {
          parsedTextSettings = textSettings;
        }

        // Valider les paramètres texte
        detailsData.textSettings = {
          fontSize: Math.min(Math.max(parseInt(parsedTextSettings.fontSize) || 16, 12), 24),
          lineHeight: Math.min(Math.max(parseFloat(parsedTextSettings.lineHeight) || 1.4, 1.0), 2.0)
        };

        console.log('📝 Paramètres texte validés:', detailsData.textSettings);
      } catch (textError) {
        console.error('⚠️ Erreur parsing textSettings:', textError);
        detailsData.textSettings = { fontSize: 16, lineHeight: 1.4 };
      }
    }

    // Traiter les lieux populaires si fournis
    if (popularPlaces && Array.isArray(popularPlaces)) {
      detailsData.popularPlaces = popularPlaces;
    }

    // ✅ TRAITEMENT DES IMAGES DE GALERIE (CODE EXISTANT CONSERVÉ)
    if (req.files && req.files.length > 0) {
      console.log(`📷 Traitement de ${req.files.length} images...`);
      const galleryImages = req.files;
      const galleryUrls = [];

      try {
        // Créer le dossier des galeries s'il n'existe pas
        const galleryDir = path.join(process.cwd(), 'assets', 'images', 'galleries', treasure_id);
        await fs.mkdir(galleryDir, { recursive: true });
        console.log(`📁 Dossier créé: ${galleryDir}`);

        // Traiter chaque image
        for (let i = 0; i < galleryImages.length; i++) {
          const image = galleryImages[i];
          console.log(`🔄 Traitement image ${i+1}: ${image.originalname}`);
          
          const filename = `${Date.now()}-${i}.webp`;
          const outputPath = path.join(galleryDir, filename);

          // Convertir et sauvegarder l'image
          await sharp(image.path)
            .webp({ quality: 80 })
            .toFile(outputPath);

          console.log(`✅ Image sauvée: ${outputPath}`);

          // Supprimer le fichier temporaire
          try {
            await fs.unlink(image.path);
            console.log(`🗑️ Fichier temp supprimé: ${image.path}`);
          } catch (unlinkError) {
            console.warn(`Impossible de supprimer le fichier temporaire: ${image.path}`, unlinkError.message);
          }

          // Ajouter l'URL relative à la liste
          galleryUrls.push(`/assets/images/galleries/${treasure_id}/${filename}`);
        }

        detailsData.gallery = galleryUrls;
        console.log(`🎉 ${galleryUrls.length} images traitées avec succès`);
      } catch (imageError) {
        console.error("❌ Erreur lors du traitement des images:", imageError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors du traitement des images de la galerie."
        });
      }
    }

    // ✅ CHERCHER OU CRÉER LES DÉTAILS DU TRÉSOR
    let treasureDetails = await TreasureDetails.findOne({ treasure_id });

    if (treasureDetails) {
      console.log('🔄 Mise à jour des détails existants');
      
      // Mettre à jour les détails existants
      Object.keys(detailsData).forEach(key => {
        if (key === 'gallery' && detailsData.gallery) {
          // Ajouter aux images existantes plutôt que de remplacer
          treasureDetails.gallery = [...(treasureDetails.gallery || []), ...detailsData.gallery];
        } else if (detailsData[key] !== undefined) {
          treasureDetails[key] = detailsData[key];
        }
      });

      // Mettre à jour la date de modification
      treasureDetails.updatedAt = new Date();

      await treasureDetails.save();
      console.log('✅ Détails existants mis à jour');
    } else {
      console.log('➕ Création de nouveaux détails');
      
      // Créer un nouveau document de détails
      treasureDetails = new TreasureDetails({
        treasure_id,
        ...detailsData,
        // Valeurs par défaut si pas fournies
        gallery: detailsData.gallery || [],
        services: detailsData.services || [],
        photos: [],
        comments: [],
        popularPlaces: detailsData.popularPlaces || [],
        textSettings: detailsData.textSettings || { fontSize: 16, lineHeight: 1.4 },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await treasureDetails.save();
      console.log('✅ Nouveaux détails créés');
    }

    // ✅ LOG FINAL DES SERVICES
    console.log('📊 RÉSUMÉ FINAL:');
    console.log('- Services configurés:', treasureDetails.services?.length || 0);
    console.log('- Images galerie:', treasureDetails.gallery?.length || 0);
    console.log('- Description longueur:', (treasureDetails.description || '').length);
    console.log('- Localisation:', treasureDetails.location || 'Non défini');

    res.status(200).json({
      success: true,
      message: "Détails du trésor mis à jour avec succès.",
      details: {
        ...treasureDetails.toObject(),
        // Ajouter des métadonnées utiles
        metadata: {
          totalServices: treasureDetails.services?.length || 0,
          totalGalleryImages: treasureDetails.gallery?.length || 0,
          lastUpdated: treasureDetails.updatedAt,
          completionStatus: calculateCompletionStatus(treasureDetails)
        }
      }
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des détails du trésor:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer.",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
};


// FONCTION POUR OBTENIR TOUS LES FAVORIS D'UN UTILISATEUR (TREASURES + REGIONS)
exports.getUserAllFavorites = async (req, res) => {
  try {
    const { id: userId, username } = req.user;
    const { type = 'all', limit = 50 } = req.query;
    
    const displayName = username || `User${userId.slice(-6)}`;
    console.log(`💖 Récupération TOUS favoris pour: ${displayName} (type: ${type})`);
    
    const results = {
      treasures: [],
      regions: [],
      totalTreasures: 0,
      totalRegions: 0,
      totalFavorites: 0
    };

    // Récupérer favoris trésors si demandé
    if (type === 'all' || type === 'treasures') {
      try {
        const favoriteTreasuresDetails = await TreasureDetails.find({ 
          favoritedBy: userId 
        }).sort({ updatedAt: -1 }).limit(parseInt(limit)).lean();
        
        for (const treasureDetails of favoriteTreasuresDetails) {
          try {
            const treasure = await Treasure.findById(treasureDetails.treasure_id).lean();
            if (treasure) {
              results.treasures.push({
                id: treasureDetails.treasure_id,
                name: treasure.name || 'Trésor sans nom',
                type: 'treasure',
                description: treasureDetails.description || treasure.description || '',
                shortDescription: (treasureDetails.description || treasure.description || '').substring(0, 100) + '...',
                location: treasureDetails.location || treasure.location || '',
                imageUrl: treasure.placeImage || treasureDetails.gallery?.[0] || null,
                rating: treasureDetails.rating || 0,
                totalReviews: treasureDetails.totalReviews || 0,
                addedToFavoritesAt: treasureDetails.updatedAt || treasureDetails.createdAt
              });
            }
          } catch (error) {
            console.warn(`⚠️ Erreur enrichissement trésor ${treasureDetails.treasure_id}:`, error.message);
          }
        }
        results.totalTreasures = results.treasures.length;
      } catch (error) {
        console.error(`❌ Erreur récupération favoris trésors:`, error);
      }
    }

    // Récupérer favoris régions si demandé
    if (type === 'all' || type === 'regions') {
      try {
        // Import RegionDetails si nécessaire
        const RegionDetails = require('../models/RegionDetails');
        const Region = require('../models/Region');
        
        const favoriteRegionsDetails = await RegionDetails.find({ 
          favoritedBy: userId 
        }).sort({ updatedAt: -1 }).limit(parseInt(limit)).lean();
        
        for (const regionDetails of favoriteRegionsDetails) {
          try {
            const region = await Region.findById(regionDetails.region_id).lean();
            if (region) {
              results.regions.push({
                id: regionDetails.region_id,
                name: region.name || 'Région sans nom',
                type: 'region',
                description: regionDetails.description || region.description || '',
                shortDescription: (regionDetails.description || region.description || '').substring(0, 100) + '...',
                location: regionDetails.location || region.location || '',
                imageUrl: region.placeImage || regionDetails.gallery?.[0] || null,
                rating: regionDetails.rating || 0,
                totalReviews: regionDetails.totalReviews || 0,
                addedToFavoritesAt: regionDetails.updatedAt || regionDetails.createdAt
              });
            }
          } catch (error) {
            console.warn(`⚠️ Erreur enrichissement région ${regionDetails.region_id}:`, error.message);
          }
        }
        results.totalRegions = results.regions.length;
      } catch (error) {
        console.error(`❌ Erreur récupération favoris régions:`, error);
      }
    }

    results.totalFavorites = results.totalTreasures + results.totalRegions;

    console.log(`✅ Favoris récupérés: ${results.totalTreasures} trésors + ${results.totalRegions} régions = ${results.totalFavorites} total`);

    return res.json({
      success: true,
      data: results,
      message: results.totalFavorites === 0 
        ? "Vous n'avez pas encore de favoris" 
        : `Vous avez ${results.totalFavorites} favoris au total`
    });

  } catch (error) {
    console.error(`❌ Erreur getUserAllFavorites:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de tous vos favoris",
      data: {
        treasures: [],
        regions: [],
        totalTreasures: 0,
        totalRegions: 0,
        totalFavorites: 0
      }
    });
  }
};



// 🔍 VÉRIFIER SI UN TRÉSOR EST EN FAVORI
// =====================================================================

exports.checkTreasureFavoriteStatus = async (req, res) => {
  try {
    const { treasure_id } = req.params;
    const { id: userId } = req.user;
    
    if (!treasure_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID du trésor est requis."
      });
    }
    
    // Vérifier que le trésor existe
    const treasureExists = await Treasure.findById(treasure_id);
    if (!treasureExists) {
      return res.status(404).json({
        success: false,
        message: "Le trésor spécifié n'existe pas."
      });
    }
    
    // Récupérer TreasureDetails
    const treasureDetails = await TreasureDetails.findOne({ treasure_id });
    
    let isFavorited = false;
    let totalFavorites = 0;
    
    if (treasureDetails && treasureDetails.favoritedBy) {
      isFavorited = treasureDetails.favoritedBy.some(id => 
        id.toString() === userId.toString()
      );
      totalFavorites = treasureDetails.favoritedBy.length;
    }
    
    return res.json({
      success: true,
      data: {
        treasureId: treasure_id,
        treasureName: treasureExists.name,
        isFavorited,
        totalFavorites,
        userId
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur checkTreasureFavoriteStatus:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du statut de favori"
    });
  }
};


// 💖 TOGGLE FAVORIS TREASURE
// =====================================================================

exports.toggleTreasureFavorite = async (req, res) => {
  try {
    const { treasure_id } = req.params;
    const { id: userId, username } = req.user;
    
    const displayName = username || `User${userId.slice(-6)}`;
    console.log(`💖 Toggle favoris treasure ${treasure_id} par ${displayName}`);
    
    if (!treasure_id || String(treasure_id).trim() === '') {
      return res.status(400).json({
        success: false,
        message: "L'ID du trésor est requis."
      });
    }
    
    // Vérifier que le trésor existe
    const treasureExists = await Treasure.findById(treasure_id);
    if (!treasureExists) {
      return res.status(404).json({
        success: false,
        message: "Le trésor spécifié n'existe pas."
      });
    }
    
    // Trouver ou créer TreasureDetails
    let treasureDetails = await TreasureDetails.findOne({ treasure_id });
    
    if (!treasureDetails) {
      console.log(`⚠️ Création TreasureDetails pour favoris - treasure ${treasure_id}`);
      
      treasureDetails = new TreasureDetails({
        treasure_id,
        description: treasureExists.description || `Découvrez ${treasureExists.name}, un trésor magnifique à explorer.`,
        location: treasureExists.location || treasureExists.country || "Localisation à préciser",
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
      
      await treasureDetails.save();
      console.log(`✅ TreasureDetails créé pour favoris: ${treasureExists.name}`);
    }
    
    // Vérifier si l'utilisateur a déjà mis en favori
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isFavorited = treasureDetails.favoritedBy.some(id => 
      id.toString() === userId.toString()
    );
    
    let message = '';
    let action = '';
    
    if (isFavorited) {
      // Retirer des favoris
      treasureDetails.favoritedBy = treasureDetails.favoritedBy.filter(id => 
        id.toString() !== userId.toString()
      );
      message = `${treasureExists.name} retiré de vos favoris`;
      action = 'removed';
      console.log(`💔 Favori retiré: ${treasureExists.name} par ${displayName}`);
    } else {
      // Ajouter aux favoris
      treasureDetails.favoritedBy.push(userObjectId);
      message = `${treasureExists.name} ajouté à vos favoris`;
      action = 'added';
      console.log(`💖 Favori ajouté: ${treasureExists.name} par ${displayName}`);
    }
    
    treasureDetails.updatedAt = new Date();
    await treasureDetails.save();
    
    const totalFavorites = treasureDetails.favoritedBy.length;
    
    return res.status(200).json({
      success: true,
      message,
      data: {
        treasureId: treasure_id,
        treasureName: treasureExists.name,
        action, // 'added' ou 'removed'
        isFavorited: !isFavorited, // Nouveau statut
        totalFavorites,
        userId
      }
    });
    
  } catch (error) {
    console.error(`❌ Erreur toggleTreasureFavorite:`, error);
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

exports.getUserFavoriteTreasures = async (req, res) => {
  try {
    const { id: userId, username } = req.user;
    const { sortBy = 'dateAdded' } = req.query;
    
    const displayName = username || `User${userId.slice(-6)}`;
    console.log(`💖 Récupération favoris trésors pour: ${displayName}`);
    
    // Query: tous les trésors où l'utilisateur est dans favoritedBy
    const query = { 
      favoritedBy: userId
    };
    
    // Options de tri
    const sortOptions = {
      'dateAdded': { updatedAt: -1 }, // Plus récemment ajouté en favoris
      'name': { treasure_id: 1 },     // Alphabétique par nom (nécessitera un populate)
      'rating': { rating: -1 },       // Par note
      'totalReviews': { totalReviews: -1 } // Par popularité
    };
    
    const sort = sortOptions[sortBy] || sortOptions.dateAdded;
    
    // Récupération de TOUS les favoris de l'utilisateur
    const favoriteTreasuresDetails = await TreasureDetails.find(query)
      .sort(sort)
      .lean();
    
    // Enrichir avec les données des trésors
    const userFavoriteTreasures = [];
    
    for (const treasureDetails of favoriteTreasuresDetails) {
      try {
        // Récupérer les infos de base du trésor
        const treasure = await Treasure.findById(treasureDetails.treasure_id).lean();
        
        if (treasure) {
          userFavoriteTreasures.push({
            id: treasureDetails.treasure_id,
            treasureDetailsId: treasureDetails._id,
            name: treasure.name || 'Trésor sans nom',
            description: treasureDetails.description || treasure.description || '',
            shortDescription: treasureDetails.description 
              ? treasureDetails.description.substring(0, 120) + (treasureDetails.description.length > 120 ? '...' : '')
              : (treasure.description || '').substring(0, 120) + ((treasure.description || '').length > 120 ? '...' : ''),
            location: treasureDetails.location || treasure.location || treasure.country || '',
            country: treasure.country || '',
            rating: treasureDetails.rating || 0,
            totalReviews: treasureDetails.totalReviews || 0,
            totalPhotos: treasureDetails.photos ? treasureDetails.photos.length : 0,
            totalComments: treasureDetails.comments ? treasureDetails.comments.length : 0,
            totalServices: treasureDetails.services ? treasureDetails.services.filter(s => s.isActive).length : 0,
            imageUrl: treasure.placeImage || treasureDetails.gallery?.[0] || null,
            galleryCount: treasureDetails.gallery ? treasureDetails.gallery.length : 0,
            isFavoriteByUser: true, // Toujours true puisque c'est SA liste de favoris
            addedToFavoritesAt: treasureDetails.updatedAt || treasureDetails.createdAt,
            
            // Statistiques enrichies
            completionStatus: treasureDetails.metadata?.completionStatus?.percentage || 0,
            hasFullDetails: (treasureDetails.metadata?.completionStatus?.percentage || 0) >= 80,
            
            // Services disponibles (aperçu)
            availableServices: treasureDetails.services 
              ? treasureDetails.services
                  .filter(s => s.isActive)
                  .slice(0, 3)
                  .map(s => ({ type: s.type, icon: s.icon }))
              : []
          });
        }
      } catch (treasureError) {
        console.warn(`⚠️ Erreur enrichissement trésor ${treasureDetails.treasure_id}:`, treasureError.message);
        // Inclure quand même avec des données minimales
        userFavoriteTreasures.push({
          id: treasureDetails.treasure_id,
          treasureDetailsId: treasureDetails._id,
          name: 'Trésor non trouvé',
          description: treasureDetails.description || '',
          shortDescription: (treasureDetails.description || '').substring(0, 120),
          location: treasureDetails.location || '',
          country: '',
          rating: treasureDetails.rating || 0,
          totalReviews: treasureDetails.totalReviews || 0,
          totalPhotos: treasureDetails.photos ? treasureDetails.photos.length : 0,
          totalComments: treasureDetails.comments ? treasureDetails.comments.length : 0,
          imageUrl: treasureDetails.gallery?.[0] || null,
          isFavoriteByUser: true,
          addedToFavoritesAt: treasureDetails.updatedAt || treasureDetails.createdAt
        });
      }
    }
    
    console.log(`✅ ${userFavoriteTreasures.length} trésors favoris trouvés pour ${displayName}`);
    
    return res.json({
      success: true,
      data: userFavoriteTreasures,
      totalFavorites: userFavoriteTreasures.length,
      sortedBy: sortBy,
      message: userFavoriteTreasures.length === 0 
        ? "Vous n'avez pas encore de trésors favoris" 
        : `Vous avez ${userFavoriteTreasures.length} trésor${userFavoriteTreasures.length > 1 ? 's' : ''} en favoris`
    });
    
  } catch (error) {
    console.error(`❌ Erreur getUserFavoriteTreasures:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de vos trésors favoris",
      data: [],
      totalFavorites: 0
    });
  }
};

 //STATISTIQUES GLOBALES DES FAVORIS
// =====================================================================

exports.getFavoritesGlobalStats = async (req, res) => {
  try {
    console.log(`📊 Récupération statistiques globales favoris`);

    const stats = {
      treasures: {
        totalWithFavorites: 0,
        totalFavorites: 0,
        avgFavoritesPerTreasure: 0,
        mostFavoritedTreasure: null
      },
      regions: {
        totalWithFavorites: 0,
        totalFavorites: 0,
        avgFavoritesPerRegion: 0,
        mostFavoritedRegion: null
      },
      users: {
        usersWithFavorites: 0,
        avgFavoritesPerUser: 0
      }
    };

    // Statistiques trésors
    try {
      const treasureStats = await TreasureDetails.aggregate([
        { $match: { favoritedBy: { $exists: true, $ne: [] } } },
        {
          $group: {
            _id: null,
            totalTreasures: { $sum: 1 },
            totalFavorites: { $sum: { $size: "$favoritedBy" } },
            avgFavorites: { $avg: { $size: "$favoritedBy" } }
          }
        }
      ]);

      if (treasureStats.length > 0) {
        stats.treasures.totalWithFavorites = treasureStats[0].totalTreasures;
        stats.treasures.totalFavorites = treasureStats[0].totalFavorites;
        stats.treasures.avgFavoritesPerTreasure = Math.round(treasureStats[0].avgFavorites * 100) / 100;
      }

      // Trésor le plus favorisé
      const mostFavoritedTreasure = await TreasureDetails.findOne(
        { favoritedBy: { $exists: true, $ne: [] } }
      ).sort({ 'favoritedBy': -1 }).populate('treasure_id', 'name').lean();

      if (mostFavoritedTreasure) {
        stats.treasures.mostFavoritedTreasure = {
          id: mostFavoritedTreasure.treasure_id,
          favoritesCount: mostFavoritedTreasure.favoritedBy?.length || 0
        };
      }

    } catch (error) {
      console.warn(`⚠️ Erreur stats trésors:`, error.message);
    }

    // Statistiques régions (si le modèle existe)
    try {
      const RegionDetails = require('../models/RegionDetails');
      
      const regionStats = await RegionDetails.aggregate([
        { $match: { favoritedBy: { $exists: true, $ne: [] } } },
        {
          $group: {
            _id: null,
            totalRegions: { $sum: 1 },
            totalFavorites: { $sum: { $size: "$favoritedBy" } },
            avgFavorites: { $avg: { $size: "$favoritedBy" } }
          }
        }
      ]);

      if (regionStats.length > 0) {
        stats.regions.totalWithFavorites = regionStats[0].totalRegions;
        stats.regions.totalFavorites = regionStats[0].totalFavorites;
        stats.regions.avgFavoritesPerRegion = Math.round(regionStats[0].avgFavorites * 100) / 100;
      }

    } catch (error) {
      console.warn(`⚠️ Erreur stats régions (probablement pas de modèle):`, error.message);
    }

    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Erreur getFavoritesGlobalStats:`, error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques globales"
    });
  }
};



// ✅ FONCTION HELPER POUR CALCULER LE STATUT DE COMPLÉTION
function calculateCompletionStatus(treasureDetails) {
  let completed = 0;
  let total = 4;
  
  // Description (25%)
  if ((treasureDetails.description || '').trim().length >= 50) completed++;
  
  // Localisation (25%)
  if ((treasureDetails.location || '').trim().length >= 10) completed++;
  
  // Services (25%)
  if (treasureDetails.services && treasureDetails.services.length > 0) completed++;
  
  // Images (25%)
  if (treasureDetails.gallery && treasureDetails.gallery.length > 0) completed++;
  
  const percentage = Math.round((completed / total) * 100);
  
  let status = 'empty';
  if (percentage >= 100) status = 'complete';
  else if (percentage >= 75) status = 'nearly_complete';
  else if (percentage >= 50) status = 'good';
  else if (percentage > 0) status = 'partial';
  
  return {
    percentage,
    status,
    completed,
    total,
    missing: total - completed
  };
}

/*exports.createOrUpdateTreasureDetails = async (req, res) => {
  try {
    const { treasure_id, description, location, services, popularPlaces } = req.body;

    // Validation des données requises
    if (!treasure_id) {
      return res.status(400).json({ 
        success: false, 
        message: "L'ID du trésor est requis." 
      });
    }

    // Vérifier si le trésor existe
    const treasureExists = await Treasure.findById(treasure_id);
    if (!treasureExists) {
      return res.status(404).json({ 
        success: false, 
        message: "Le trésor spécifié n'existe pas." 
      });
    }

    // Préparer les données
    let detailsData = {
      description: description || "",
      location: location || "",
    };

    // Traiter les services si fournis
    if (services && Array.isArray(services)) {
      detailsData.services = services;
    }

    // Traiter les lieux populaires si fournis
    if (popularPlaces && Array.isArray(popularPlaces)) {
      detailsData.popularPlaces = popularPlaces;
    }

    //new one 

    // Traiter les fichiers d'images supplémentaires (galerie)
if (req.files && req.files.length > 0) {
  console.log(`📷 Traitement de ${req.files.length} images...`);
  const galleryImages = req.files;
  const galleryUrls = [];

  try {
    // Créer le dossier des galeries s'il n'existe pas
    const galleryDir = path.join(process.cwd(), 'assets', 'images', 'galleries', treasure_id);
    await fs.mkdir(galleryDir, { recursive: true });
    console.log(`📁 Dossier créé: ${galleryDir}`);

    // Traiter chaque image
    for (let i = 0; i < galleryImages.length; i++) {
      const image = galleryImages[i];
      console.log(`🔄 Traitement image ${i+1}: ${image.originalname}`);
      
      const filename = `${Date.now()}-${i}.webp`;
      const outputPath = path.join(galleryDir, filename);

      // Convertir et sauvegarder l'image
      await sharp(image.path)
        .webp({ quality: 80 })
        .toFile(outputPath);

      console.log(`✅ Image sauvée: ${outputPath}`);

      // Supprimer le fichier temporaire
      try {
        await fs.unlink(image.path);
        console.log(`🗑️ Fichier temp supprimé: ${image.path}`);
      } catch (unlinkError) {
        console.warn(`Impossible de supprimer le fichier temporaire: ${image.path}`, unlinkError.message);
      }

      // Ajouter l'URL relative à la liste
      galleryUrls.push(`/assets/images/galleries/${treasure_id}/${filename}`);
    }

    detailsData.gallery = galleryUrls;
    console.log(`🎉 ${galleryUrls.length} images traitées avec succès`);
  } catch (imageError) {
    console.error("❌ Erreur lors du traitement des images:", imageError);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du traitement des images de la galerie."
    });
  }
}
    

   

    // Chercher les détails existants ou créer un nouveau document
    let treasureDetails = await TreasureDetails.findOne({ treasure_id });

    if (treasureDetails) {
      // Mettre à jour les détails existants
      Object.keys(detailsData).forEach(key => {
        if (key === 'gallery' && detailsData.gallery) {
          // Ajouter aux images existantes plutôt que de remplacer
          treasureDetails.gallery = [...(treasureDetails.gallery || []), ...detailsData.gallery];
        } else if (detailsData[key] !== undefined) {
          treasureDetails[key] = detailsData[key];
        }
      });

      await treasureDetails.save();
    } else {
      // Créer un nouveau document de détails
      treasureDetails = new TreasureDetails({
        treasure_id,
        ...detailsData
      });

      await treasureDetails.save();
    }
       //new
       console.log('📤 📤 📤 JUSTE AVANT ENVOI RÉPONSE 📤 📤 📤');
console.log('✅ treasureDetails existe:', !!treasureDetails);
console.log('✅ gallery length:', treasureDetails.gallery?.length || 0);
    res.status(200).json({
      success: true,
      message: "Détails du trésor mis à jour avec succès.",
      details: treasureDetails
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des détails du trésor:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer."
    });
  }
};*/

/*exports.getTreasureDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id; // ✅ Utilisateur toujours connecté
    
    console.log(`👤 Utilisateur connecté: ${currentUserId}`);
    console.log(`🏝️ Détails demandés pour: ${id}`);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "L'ID du trésor est requis."
      });
    }

    // Chercher le trésor principal
    let treasureExists;
    try {
      if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
        treasureExists = await Treasure.findById(id);
      }
      if (!treasureExists) {
        treasureExists = await Treasure.findOne({
          $or: [{ _id: id }, { id: id }, { treasureId: id }]
        });
      }
    } catch (findError) {
      console.log(`⚠️ Erreur recherche trésor:`, findError.message);
    }

    if (!treasureExists) {
      return res.status(404).json({
        success: false,
        message: "Trésor non trouvé."
      });
    }

    // Chercher ou créer TreasureDetails
    let details = await TreasureDetails.findOne({ treasure_id: id });
    
    if (!details) {
      console.log(`⚠️ Création TreasureDetails pour ${id}`);
      details = new TreasureDetails({
        treasure_id: id,
        description: treasureExists.description || "Description en cours de rédaction",
        location: treasureExists.location || treasureExists.country || "Localisation à préciser",
        rating: 0,
        totalReviews: 0,
        gallery: [],
        services: [
          { type: "Loisirs", icon: "local-activity" },
          { type: "Hébergement", icon: "bed" },
          { type: "Accessibilité", icon: "accessible" },
          { type: "Administration", icon: "admin-panel-settings" },
          { type: "Restauration", icon: "restaurant" },
          { type: "Guide touristique", icon: "people" }
        ],
        photos: [],
        comments: [],
        popularPlaces: [],
        textSettings: { fontSize: 16, lineHeight: 1.4 }
      });
      await details.save();
    }

    // ✅ TRAITEMENT PRINCIPAL : Calcul des likes utilisateur
    const processedDetails = {
      ...details.toObject(),
      name: treasureExists.name,
      placeImage: treasureExists.placeImage,
    };

    // ✅ CALCUL SIMPLE pour les PHOTOS
    if (processedDetails.photos && processedDetails.photos.length > 0) {
      processedDetails.photos = processedDetails.photos.map(photo => {
        const hasUserLiked = photo.likedBy && Array.isArray(photo.likedBy)
          ? photo.likedBy.some(userId => userId.toString() === currentUserId.toString())
          : false;
        
        return {
          ...photo,
          isLikedByUser: hasUserLiked, // ✅ Cœur rose si true
          likes: Math.max(0, photo.likes || 0)  // ✅ Compteur sécurisé
        };
      });
      
      console.log(`📸 ${processedDetails.photos.length} photos avec calcul likes pour user ${currentUserId}`);
    }

    // ✅ CALCUL SIMPLE pour les COMMENTAIRES
    if (processedDetails.comments && processedDetails.comments.length > 0) {
      processedDetails.comments = processedDetails.comments.map(comment => {
        const hasUserLikedComment = comment.likedBy && Array.isArray(comment.likedBy)
          ? comment.likedBy.some(userId => userId.toString() === currentUserId.toString())
          : false;
        
        const processedComment = {
          ...comment,
          isLikedByUser: hasUserLikedComment,
          likes: Math.max(0, comment.likes || 0)
        };
        
        // Traitement des réponses
        if (comment.replies && Array.isArray(comment.replies)) {
          processedComment.replies = comment.replies.map(reply => {
            const hasUserLikedReply = reply.likedBy && Array.isArray(reply.likedBy)
              ? reply.likedBy.some(userId => userId.toString() === currentUserId.toString())
              : false;
            
            return {
              ...reply,
              isLikedByUser: hasUserLikedReply,
              likes: Math.max(0, reply.likes || 0)
            };
          });
        }
        
        return processedComment;
      });
      
      console.log(`💬 ${processedDetails.comments.length} commentaires avec calcul likes pour user ${currentUserId}`);
    }

    console.log(`✅ Détails préparés avec likes pour utilisateur ${currentUserId}`);

    res.status(200).json({
      success: true,
      details: processedDetails
    });
    
  } catch (error) {
    console.error("❌ Erreur getTreasureDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};*/


exports.addPhoto = async (req, res) => {
  try {
    const { treasure_id } = req.params;
    const { id: user_id, username } = req.user;

    // ✅ Créer un nom d'affichage unique
    const displayName = username || `User${user_id.slice(-6)}`;

    console.log(`📸 Tentative d'ajout de photo pour le trésor: ${treasure_id}`);
    console.log(`👤 Utilisateur: ${displayName} (ID: ${user_id})`);

    // Validations
    if (!treasure_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID du trésor est requis."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucune image n'a été téléchargée."
      });
    }

    console.log(`📁 Fichier reçu:`, {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Vérifier si les détails du trésor existent
    let treasureDetails = await TreasureDetails.findOne({ treasure_id });
    
    if (!treasureDetails) {
      console.log("⚠️ TreasureDetails n'existe pas, création en cours...");
      
      // Vérifier que le trésor principal existe
      const treasureExists = await Treasure.findById(treasure_id);
      if (!treasureExists) {
        return res.status(404).json({
          success: false,
          message: "Trésor non trouvé."
        });
      }
      
      console.log("✅ Trésor principal trouvé:", treasureExists.name);
      
      // ✅ Créer un document avec des valeurs par défaut appropriées
      treasureDetails = new TreasureDetails({
        treasure_id,
        description: treasureExists.description || "Description en cours de rédaction", 
        location: treasureExists.location || treasureExists.country || "Localisation à préciser",
        gallery: [],
        services: [],
        photos: [],
        comments: [],
        popularPlaces: []
      });
      
      // Sauvegarder le document de base
      try {
        await treasureDetails.save();
        console.log("✅ Document TreasureDetails créé avec succès");
      } catch (saveError) {
        console.error("❌ Erreur lors de la création du document TreasureDetails:", saveError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la création des détails du trésor.",
          error: saveError.message
        });
      }
    }

    try {
      // Préparer le dossier pour les photos
      const photosDir = path.join(process.cwd(), 'assets', 'images', 'community', treasure_id);
      await fs.mkdir(photosDir, { recursive: true });
      console.log(`✅ Dossier créé/vérifié: ${photosDir}`);

      // Traiter l'image
      const filename = `${Date.now()}-${user_id}.webp`;
      const outputPath = path.join(photosDir, filename);

      console.log(`🔄 Traitement de l'image: ${req.file.path} -> ${outputPath}`);

      await sharp(req.file.path)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      console.log(`✅ Image traitée et sauvegardée`);

      // Supprimer le fichier temporaire
      try {
        await fs.unlink(req.file.path);
        console.log(`🗑️ Fichier temporaire supprimé: ${req.file.path}`);
      } catch (unlinkError) {
        console.warn(`⚠️ Impossible de supprimer le fichier temporaire: ${req.file.path}`, unlinkError.message);
      }

      // URL de l'image
      const imageUrl = `/assets/images/community/${treasure_id}/${filename}`;
      console.log(`🔗 URL de l'image: ${imageUrl}`);

      // ✅ Créer l'objet photo avec ID unique
      const newPhoto = {
        imageUrl,
        user: user_id,
        username: displayName,
        userId: user_id, // ID de référence unique
        likes: 0,
        createdAt: new Date()
      };

      // Ajouter la photo à la collection
      treasureDetails.photos.push(newPhoto);
      
      // Sauvegarder avec gestion d'erreur
      try {
        await treasureDetails.save();
        console.log(`✅ Photo ajoutée avec succès à la base de données`);
      } catch (savePhotoError) {
        console.error("❌ Erreur lors de la sauvegarde de la photo:", savePhotoError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la sauvegarde de la photo en base de données.",
          error: savePhotoError.message
        });
      }

      const addedPhoto = treasureDetails.photos[treasureDetails.photos.length - 1];

      res.status(200).json({
        success: true,
        message: "Photo ajoutée avec succès.",
        photo: addedPhoto
      });

    } catch (imageError) {
      console.error("❌ Erreur lors du traitement de l'image:", imageError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors du traitement de l'image.",
        error: imageError.message
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de la photo:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      error: error.message
    });
  }
};


exports.deleteSharedPhoto = async (req, res) => {
  try {
    const { treasure_id, photo_id } = req.params;
    const { id: user_id } = req.user;

    console.log(`🗑️ Tentative de suppression de photo`);
    console.log(`🏆 Trésor: ${treasure_id}`);
    console.log(`📸 Photo: ${photo_id}`);
    console.log(`👤 Utilisateur: ${user_id}`);

    // Validations
    if (!treasure_id || !photo_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID du trésor et de la photo sont requis."
      });
    }

    // Vérifier que les détails du trésor existent
    const treasureDetails = await TreasureDetails.findOne({ treasure_id });
    
    if (!treasureDetails) {
      console.log("❌ TreasureDetails non trouvé");
      return res.status(404).json({
        success: false,
        message: "Trésor non trouvé."
      });
    }

    console.log(`✅ TreasureDetails trouvé`);

    // Chercher la photo dans la collection
    const photoIndex = treasureDetails.photos.findIndex(
      photo => photo._id.toString() === photo_id
    );

    if (photoIndex === -1) {
      console.log("❌ Photo non trouvée dans la collection");
      return res.status(404).json({
        success: false,
        message: "Photo non trouvée."
      });
    }

    const photo = treasureDetails.photos[photoIndex];
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
    treasureDetails.photos.splice(photoIndex, 1);

    // Sauvegarder les changements
    try {
      await treasureDetails.save();
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
      treasureId: treasure_id
    });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la photo:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite.",
      error: error.message
    });
  }
};


exports.getTreasureDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ============================================
    // 1. VALIDATION AUTHENTIFICATION
    // ============================================
    if (!req.user || !req.user.id) {
      console.error('❌ Utilisateur non authentifié');
      return res.status(401).json({
        success: false,
        message: "Authentification requise pour accéder aux détails du trésor."
      });
    }
    
    const currentUserId = req.user.id;
    const currentUsername = req.user.username || `User${currentUserId.slice(-6)}`;
    
    console.log(`👤 Utilisateur connecté: ${currentUsername} (${currentUserId})`);
    console.log(`🏝️ Détails demandés pour le trésor: ${id}`);

    // ============================================
    // 2. VALIDATION ID TREASURE
    // ============================================
    if (!id || String(id).trim() === '') {
      return res.status(400).json({
        success: false,
        message: "L'ID du trésor est requis et ne peut pas être vide."
      });
    }

    const cleanId = String(id).trim();

    // ============================================
    // 3. RECHERCHE TREASURE DE BASE
    // ============================================
    let treasureExists;
    try {
      console.log(`🔍 Recherche trésor avec ID: "${cleanId}"`);
      
      if (mongoose.Types.ObjectId.isValid(cleanId) && cleanId.length === 24) {
        treasureExists = await Treasure.findById(cleanId).lean();
      }
      
      if (!treasureExists) {
        treasureExists = await Treasure.findOne({
          $or: [{ _id: cleanId }, { id: cleanId }, { treasureId: cleanId }]
        }).lean();
      }
      
    } catch (findError) {
      console.error(`❌ Erreur recherche trésor:`, findError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la recherche du trésor en base de données.",
        error: process.env.NODE_ENV === 'development' ? findError.message : 'Erreur de base de données'
      });
    }

    if (!treasureExists) {
      console.log(`❌ Trésor avec ID "${cleanId}" non trouvé`);
      return res.status(404).json({
        success: false,
        message: `Trésor avec l'ID "${cleanId}" non trouvé dans la base de données.`
      });
    }

    console.log(`✅ Trésor trouvé: "${treasureExists.name}" (ID: ${treasureExists._id})`);

    // ============================================
    // 4. RECHERCHE OU CRÉATION TREASUREDETAILS
    // ============================================
    let details;
    try {
      console.log(`🔍 Recherche TreasureDetails pour treasure_id: ${cleanId}`);
      details = await TreasureDetails.findOne({ treasure_id: cleanId }).lean();
      
    } catch (detailsError) {
      console.error(`❌ Erreur recherche TreasureDetails:`, detailsError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la recherche des détails du trésor.",
        error: process.env.NODE_ENV === 'development' ? detailsError.message : 'Erreur de base de données'
      });
    }
    
    // Créer TreasureDetails s'il n'existe pas
    if (!details) {
      console.log(`⚠️ Création TreasureDetails pour le trésor ${cleanId} (${treasureExists.name})`);
      
      try {
        const newDetails = new TreasureDetails({
          treasure_id: cleanId,
          description: treasureExists.description || `Découvrez ${treasureExists.name}, un trésor magnifique à explorer.`,
          location: treasureExists.location || treasureExists.country || "Localisation à préciser",
          rating: 0,
          totalReviews: 0,
          gallery: [],
          services: [
            { type: "Loisirs", icon: "local-activity" },
            { type: "Hébergement", icon: "bed" },
            { type: "Accessibilité", icon: "accessible" },
            { type: "Administration", icon: "admin-panel-settings" },
            { type: "Restauration", icon: "restaurant" },
            { type: "Guide touristique", icon: "people" }
          ],
          photos: [],
          comments: [],
          favoritedBy: [], // Initialiser le tableau des favoris
          textSettings: { fontSize: 16, lineHeight: 1.4 }
        });
        
        details = await newDetails.save();
        console.log(`✅ TreasureDetails créé avec succès pour "${treasureExists.name}"`);
        details = details.toObject();
        
      } catch (saveError) {
        console.error(`❌ Erreur sauvegarde TreasureDetails:`, saveError);
        return res.status(500).json({
          success: false,
          message: "Erreur lors de la création des détails du trésor.",
          error: process.env.NODE_ENV === 'development' ? saveError.message : 'Erreur de sauvegarde'
        });
      }
    }

    // ============================================
    // 5. TRAITEMENT DES DONNÉES - BASE
    // ============================================
    console.log(`🔄 Traitement des données pour le trésor "${treasureExists.name}"`);
    
    const processedDetails = {
      ...details,
      name: treasureExists.name,
      placeImage: treasureExists.placeImage || null,
      country: treasureExists.country || null
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
      console.log(`📸 Aucune photo communauté pour le trésor "${treasureExists.name}"`);
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
      console.log(`💬 Aucun commentaire pour le trésor "${treasureExists.name}"`);
    }

    // ============================================
    // 9. CALCULS FINAUX ET STATISTIQUES
    // ============================================
    processedDetails.totalReviews = processedDetails.comments.length;
    
    // Calcul du statut de complétion
    const completionPercentage = processedDetails.metadata?.completionStatus?.percentage || 0;
    processedDetails.hasFullDetails = completionPercentage >= 80;
    
    // Statistiques enrichies pour la réponse
    const enrichedStats = {
      totalPhotos: processedDetails.photos.length,
      totalComments: processedDetails.comments.length,
      totalServices: processedDetails.services ? processedDetails.services.length : 0,
      totalGalleryImages: processedDetails.gallery ? processedDetails.gallery.length : 0,
      totalFavorites: processedDetails.totalFavorites,
      isFavoriteByUser: processedDetails.isFavoriteByUser,
      completionPercentage: completionPercentage,
      hasFullDetails: processedDetails.hasFullDetails,
      totalReplies: processedDetails.comments.reduce((total, comment) => total + (comment.replies ? comment.replies.length : 0), 0)
    };

    console.log(`✅ Données complètement traitées pour "${treasureExists.name}"`);
    console.log(`📊 Statistiques finales:`, enrichedStats);

    // ============================================
    // 10. RÉPONSE FINALE STRUCTURÉE
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
      message: `Détails du trésor "${treasureExists.name}" récupérés avec succès.`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // ============================================
    // 11. GESTION GLOBALE DES ERREURS
    // ============================================
    console.error("❌ === ERREUR GLOBALE getTreasureDetails ===");
    console.error("Type:", error.constructor.name);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Utilisateur:", req.user?.id || 'Non authentifié');
    console.error("Trésor demandé:", req.params?.id || 'Non spécifié');
    
    return res.status(500).json({
      success: false,
      message: "Une erreur interne critique s'est produite lors de la récupération des détails du trésor.",
      error: process.env.NODE_ENV === 'development' ? {
        type: error.constructor.name,
        message: error.message,
        stack: error.stack
      } : 'Erreur serveur interne',
      timestamp: new Date().toISOString(),
      requestInfo: {
        treasureId: req.params?.id || null,
        userId: req.user?.id || null
      }
    });
  }
};
    


// Ajouter un commentaire
exports.addComment = async (req, res) => {
  try {
    const { treasure_id } = req.params;
    const { comment } = req.body;
    // Récupérer les infos de l'utilisateur depuis le token
    const { id: user_id, username } = req.user;

    // Validations
    if (!treasure_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID du trésor est requis."
      });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Le commentaire ne peut pas être vide."
      });
    }

    // Vérifier si les détails du trésor existent
    let treasureDetails = await TreasureDetails.findOne({ treasure_id });
    if (!treasureDetails) {
      return res.status(404).json({
        success: false,
        message: "Détails du trésor non trouvés."
      });
    }

    // Ajouter le commentaire
    treasureDetails.comments.push({
      user: user_id,
      username,
      comment: comment.trim(),
      likes: 0,
      replies: []
    });

    await treasureDetails.save();

    res.status(200).json({
      success: true,
      message: "Commentaire ajouté avec succès.",
      comment: treasureDetails.comments[treasureDetails.comments.length - 1]
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer."
    });
  }
};

// Ajouter une réponse à un commentaire
exports.addReply = async (req, res) => {
  try {
    const { treasure_id, comment_id } = req.params;
    const { reply } = req.body;
    // Récupérer les infos de l'utilisateur depuis le token
    const { id: user_id, username } = req.user;

    // Validations
    if (!treasure_id || !comment_id) {
      return res.status(400).json({
        success: false,
        message: "L'ID du trésor et du commentaire sont requis."
      });
    }

    if (!reply || reply.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "La réponse ne peut pas être vide."
      });
    }

    // Vérifier si les détails du trésor existent
    let treasureDetails = await TreasureDetails.findOne({ treasure_id });
    if (!treasureDetails) {
      return res.status(404).json({
        success: false,
        message: "Détails du trésor non trouvés."
      });
    }

    // Trouver le commentaire parent
    const commentIndex = treasureDetails.comments.findIndex(c => c._id.toString() === comment_id);
    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Commentaire non trouvé."
      });
    }

    // Ajouter la réponse au commentaire
    treasureDetails.comments[commentIndex].replies.push({
      user: user_id,
      username,
      comment: reply.trim(),
      likes: 0
    });

    await treasureDetails.save();

    res.status(200).json({
      success: true,
      message: "Réponse ajoutée avec succès.",
      reply: treasureDetails.comments[commentIndex].replies[treasureDetails.comments[commentIndex].replies.length - 1]
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la réponse:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer."
    });
  }
};


// ✅ MÉTHODE TOGGLELIKE COMPLÈTEMENT CORRIGÉE
// Remplacez votre méthode toggleLike par celle-ci


// ✅ FONCTION TOGGLELIKE COMPLÈTEMENT CORRIGÉE - BACKEND
// Remplacez votre fonction toggleLike par cette version

exports.toggleLike = async (req, res) => {
  try {
    const { treasure_id, type, id } = req.params;
    const { id: user_id } = req.user;

    console.log(`🔄 toggleLike: treasure=${treasure_id}, type=${type}, id=${id}, user=${user_id}`);

    // ✅ VALIDATION DES PARAMÈTRES
    if (!treasure_id || !type || !id) {
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

    // ✅ VÉRIFIER SI LES DÉTAILS DU TRÉSOR EXISTENT
    let treasureDetails = await TreasureDetails.findOne({ treasure_id });
    if (!treasureDetails) {
      return res.status(404).json({
        success: false,
        message: "Détails du trésor non trouvés."
      });
    }

    // ✅ CRÉER L'OBJECTID UNE SEULE FOIS
    const userObjectId = new mongoose.Types.ObjectId(user_id);
    let result = {};

    // ✅ GESTION DES LIKES PAR TYPE
    if (type === 'photo') {
      console.log(`📸 Traitement like photo: ${id}`);
      
      const photoIndex = treasureDetails.photos.findIndex(p => p._id.toString() === id);
      if (photoIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Photo non trouvée."
        });
      }
      
      const photo = treasureDetails.photos[photoIndex];
      
      // ✅ VÉRIFIER SI L'UTILISATEUR A DÉJÀ LIKÉ (SERVEUR = SOURCE DE VÉRITÉ)
      const hasLiked = photo.likedBy.some(userId => userId.toString() === user_id);
      
      if (hasLiked) {
        // ✅ UNLIKER : Retirer l'utilisateur et décrémenter
        photo.likedBy = photo.likedBy.filter(userId => userId.toString() !== user_id);
        photo.likes = Math.max(0, photo.likes - 1);
        result = { action: 'unliked', newCount: photo.likes };
        console.log(`👎 Photo unlikée: ${photo.likes} likes`);
      } else {
        // ✅ LIKER : Ajouter l'utilisateur et incrémenter
        photo.likedBy.push(userObjectId);
        photo.likes += 1;
        result = { action: 'liked', newCount: photo.likes };
        console.log(`👍 Photo likée: ${photo.likes} likes`);
      }
      
    } else if (type === 'comment') {
      console.log(`💬 Traitement like commentaire: ${id}`);
      
      const commentIndex = treasureDetails.comments.findIndex(c => c._id.toString() === id);
      if (commentIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Commentaire non trouvé."
        });
      }
      
      const comment = treasureDetails.comments[commentIndex];
      
      // ✅ VÉRIFIER SI L'UTILISATEUR A DÉJÀ LIKÉ (SERVEUR = SOURCE DE VÉRITÉ)
      const hasLiked = comment.likedBy.some(userId => userId.toString() === user_id);
      
      if (hasLiked) {
        // ✅ UNLIKER
        comment.likedBy = comment.likedBy.filter(userId => userId.toString() !== user_id);
        comment.likes = Math.max(0, comment.likes - 1);
        result = { action: 'unliked', newCount: comment.likes };
        console.log(`👎 Commentaire unliké: ${comment.likes} likes`);
      } else {
        // ✅ LIKER
        comment.likedBy.push(userObjectId);
        comment.likes += 1;
        result = { action: 'liked', newCount: comment.likes };
        console.log(`👍 Commentaire liké: ${comment.likes} likes`);
      }
      
    } else if (type === 'reply') {
      console.log(`↪️ Traitement like réponse: ${id}`);
      
      // ✅ RECHERCHE AMÉLIORÉE DE LA RÉPONSE
      let replyFound = false;
      let commentIndex = -1;
      let replyIndex = -1;
      
      // Chercher la réponse dans tous les commentaires
      for (let i = 0; i < treasureDetails.comments.length; i++) {
        const comment = treasureDetails.comments[i];
        for (let j = 0; j < comment.replies.length; j++) {
          if (comment.replies[j]._id.toString() === id) {
            commentIndex = i;
            replyIndex = j;
            replyFound = true;
            console.log(`✅ Réponse trouvée: commentaire ${i}, réponse ${j}`);
            break;
          }
        }
        if (replyFound) break;
      }
      
      if (!replyFound) {
        console.log(`❌ Réponse non trouvée: ${id}`);
        return res.status(404).json({
          success: false,
          message: "Réponse non trouvée."
        });
      }
      
      const reply = treasureDetails.comments[commentIndex].replies[replyIndex];
      
      // ✅ VÉRIFIER SI L'UTILISATEUR A DÉJÀ LIKÉ (SERVEUR = SOURCE DE VÉRITÉ)
      const hasLiked = reply.likedBy.some(userId => userId.toString() === user_id);
      
      if (hasLiked) {
        // ✅ UNLIKER
        reply.likedBy = reply.likedBy.filter(userId => userId.toString() !== user_id);
        reply.likes = Math.max(0, reply.likes - 1);
        result = { action: 'unliked', newCount: reply.likes };
        console.log(`👎 Réponse unlikée: ${reply.likes} likes`);
      } else {
        // ✅ LIKER
        reply.likedBy.push(userObjectId);
        reply.likes += 1;
        result = { action: 'liked', newCount: reply.likes };
        console.log(`👍 Réponse likée: ${reply.likes} likes`);
      }
    }

    // ✅ SAUVEGARDER LES MODIFICATIONS
    await treasureDetails.save();

    console.log(`✅ toggleLike réussi:`, result);

    res.status(200).json({
      success: true,
      message: `${result.action === 'liked' ? 'Like ajouté' : 'Like retiré'} avec succès.`,
      data: result
    });

  } catch (error) {
    console.error(`❌ Erreur toggleLike:`, {
      message: error.message,
      stack: error.stack,
      treasureId: req.params.treasure_id,
      type: req.params.type,
      id: req.params.id,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      success: false,
      message: "Une erreur interne s'est produite. Veuillez réessayer.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


console.log('✅ === CONTRÔLEUR TREASURE FAVORIS CHARGÉ ===');
console.log('🔧 Nouvelles fonctionnalités favoris disponibles:');
console.log('  ✅ toggleTreasureFavorite : Ajouter/retirer un trésor des favoris');
console.log('  ✅ getUserFavoriteTreasures : Liste des trésors favoris utilisateur');
//console.log('  ✅ getTreasureFavoritesStats : Statistiques favoris d\'un trésor');
console.log('  ✅ checkTreasureFavoriteStatus : Vérifier statut favori');
console.log('  ✅ getTreasureDetails : MISE À JOUR avec support favoris');
console.log('  ✅ getUserAllFavorites : Tous favoris (trésors + régions)');
console.log('  ✅ clearUserFavorites : Suppression favoris utilisateur');
console.log('  ✅ getFavoritesGlobalStats : Statistiques globales');
console.log('💖 Compatibilité complète avec le système RegionDetails');
console.log('🔄 Prêt pour intégration routes API');
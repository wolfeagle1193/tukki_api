// controllers/excursionController.js
/*const Excursion = require('../models/Excursion');
const Treasure = require('../models/Treasures');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { validationResult } = require('express-validator');





//🛠️ FONCTION UTILITAIRE COMMUNE POUR NETTOYER LES DONNÉES
const cleanExcursionData = (reqBody) => {
  console.log('🧹 Nettoyage des données...');
  
  // Nettoyer et convertir les données de base
  const cleanedData = {
    title: reqBody.title?.trim(),
    description: reqBody.description?.trim(),
    shortDescription: reqBody.shortDescription?.trim(),
    date: reqBody.date,
    status: reqBody.status || 'draft',
    notes: reqBody.notes?.trim() || ''
  };
  
  // ✅ CORRECTION TREASUREID - gestion de '[object Object]'
  let treasureId = reqBody.treasureId;
  if (treasureId === '[object Object]' || !treasureId) {
    // Fallback vers d'autres champs possibles
    treasureId = reqBody.treasure || reqBody.treasureName || reqBody.place || null;
  }
  cleanedData.treasureId = treasureId?.toString().trim();
  
  // ✅ CONVERSION CORRECTE DES TYPES
  cleanedData.maxParticipants = parseInt(reqBody.maxParticipants) || 10;
  cleanedData.isPriority = reqBody.isPriority === 'true' || reqBody.isPriority === true;
  
  // ✅ NETTOYAGE TREASURENAME (supprimer \r\n)
  if (reqBody.treasureName) {
    cleanedData.treasureName = reqBody.treasureName.trim().replace(/\r\n|\r|\n/g, '');
  }
  
  // ✅ PARSER LES OBJETS JSON STRINGIFIÉS
  const jsonFields = ['duration', 'pricing', 'organizer', 'meetingPoint', 'requirements'];
  
  jsonFields.forEach(field => {
    try {
      if (reqBody[field]) {
        cleanedData[field] = typeof reqBody[field] === 'string' ? 
          JSON.parse(reqBody[field]) : reqBody[field];
      }
    } catch (parseError) {
      console.warn(`⚠️ Erreur parsing ${field}:`, parseError);
      cleanedData[field] = {};
    }
  });
  
  // ✅ PARSER LES ARRAYS JSON
  try {
    cleanedData.included = reqBody.included ? 
      (typeof reqBody.included === 'string' ? JSON.parse(reqBody.included) : reqBody.included) : [];
    
    cleanedData.notIncluded = reqBody.notIncluded ? 
      (typeof reqBody.notIncluded === 'string' ? JSON.parse(reqBody.notIncluded) : reqBody.notIncluded) : [];
  } catch (parseError) {
    console.warn('⚠️ Erreur parsing arrays:', parseError);
    cleanedData.included = [];
    cleanedData.notIncluded = [];
  }
  
  // ✅ NETTOYAGE DES COORDONNÉES NULL
  if (cleanedData.meetingPoint?.coordinates) {
    if (cleanedData.meetingPoint.coordinates.latitude === null) {
      cleanedData.meetingPoint.coordinates.latitude = 14.7167; // Dakar par défaut
    }
    if (cleanedData.meetingPoint.coordinates.longitude === null) {
      cleanedData.meetingPoint.coordinates.longitude = -17.4677; // Dakar par défaut
    }
  }
  
  console.log('✅ Données nettoyées:', {
    treasureId: cleanedData.treasureId,
    maxParticipants: cleanedData.maxParticipants,
    isPriority: cleanedData.isPriority,
    treasureName: cleanedData.treasureName,
    hasOrganizerName: !!cleanedData.organizer?.name,
    hasOrganizerPhone: !!cleanedData.organizer?.phone,
    hasMeetingPointName: !!cleanedData.meetingPoint?.name,
    hasPricingBasePrice: !!cleanedData.pricing?.basePrice
  });
  
  return cleanedData;
};

// ======= CONFIGURATION UPLOAD D'IMAGES =======



const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'assets', 'images', 'excursions');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `excursion-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});



const validateExcursionData = (data) => {
  const errors = [];
  
  console.log('🔍 Validation des données nettoyées:', {
    title: data.title?.length,
    description: data.description?.length,
    treasureId: data.treasureId,
    maxParticipants: data.maxParticipants,
    maxParticipantsType: typeof data.maxParticipants
  });
  
  if (!data.title || data.title.trim().length < 5) {
    errors.push('Le titre doit contenir au moins 5 caractères');
  }
  
  if (!data.description || data.description.trim().length < 20) {
    errors.push('La description doit contenir au moins 20 caractères');
  }
  
  if (!data.treasureId) {
    errors.push('Le lieu (treasureId) est obligatoire');
  }
  
  if (!data.date) {
    errors.push('La date est obligatoire');
  } else {
    const excursionDate = new Date(data.date);
    const now = new Date();
    const marginMs = 30 * 60 * 1000; // 30 minutes
    
    if (excursionDate.getTime() <= (now.getTime() - marginMs)) {
      errors.push('La date doit être dans le futur');
    }
  }
  
  // ✅ VALIDATION AMÉLIORÉE POUR LES NOMBRES
  if (!data.maxParticipants || isNaN(data.maxParticipants) || data.maxParticipants < 1) {
    errors.push('Le nombre maximum de participants doit être au moins 1');
  }
  
  // Validation pricing
  if (!data.pricing || !data.pricing.basePrice || data.pricing.basePrice < 0) {
    errors.push('Le prix de base est obligatoire et doit être positif');
  }
  
  // Validation organizer
  if (!data.organizer || !data.organizer.name || !data.organizer.phone) {
    errors.push('Les informations de l\'organisateur (nom et téléphone) sont obligatoires');
  }
  
  // Validation meetingPoint
  if (!data.meetingPoint || !data.meetingPoint.name) {
    errors.push('Le point de rendez-vous est obligatoire');
  }
  
  console.log('🔍 Erreurs trouvées:', errors);
  return errors;
}

// Traitement des images uploadées
const processUploadedImages = async (files) => {
  const processedImages = [];
  
  for (const file of files) {
    try {
      const outputPath = file.path.replace(path.extname(file.path), '.webp');
      
      await sharp(file.path)
        .resize(800, 600, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outputPath);
      
      // Supprimer l'original
      await fs.unlink(file.path);
      
      const imageUrl = `/assets/images/excursions/${path.basename(outputPath)}`;
      processedImages.push({
        url: imageUrl,
        caption: file.originalname,
        isMain: processedImages.length === 0, // Première image = principale
        uploadDate: new Date()
      });
      
    } catch (error) {
      console.error('Erreur traitement image:', error);
    }
  }
  
  return processedImages;
};

// Ajouter une entrée à l'audit log
const addAuditLog = (excursion, action, userId, username, details = '', oldValues = null, newValues = null) => {
  excursion.auditLog.push({
    action,
    userId,
    username,
    date: new Date(),
    details,
    oldValues,
    newValues
  });
};*/

// ======= CONTRÔLEUR PRINCIPAL =======
/*const excursionController = {

  // ===== 1. CRÉER UNE EXCURSION =====


  // ===== CORRECTION IMMÉDIATE DU CONTRÔLEUR =====
// Dans votre excursionController.js, modifiez createExcursion :

/*createExcursion: async (req, res) => {
  try {
    console.log('🎯 Création d\'une nouvelle excursion');
    console.log('📝 Données reçues:', req.body);
    console.log('📷 Fichiers reçus:', req.files?.length || 0);
    
    // ✅ NOUVELLE SECTION : NETTOYAGE ET CONVERSION DES TYPES
    console.log('🧹 Nettoyage des données...');
    
    // Nettoyer et convertir les données
    const cleanedData = {
      title: req.body.title?.trim(),
      description: req.body.description?.trim(),
      shortDescription: req.body.shortDescription?.trim(),
      treasureId: req.body.treasureId?.toString().trim(),
      date: req.body.date,
      maxParticipants: parseInt(req.body.maxParticipants), // ✅ String → Number
      status: req.body.status || 'draft',
      isPriority: req.body.isPriority === 'true', // ✅ String → Boolean
      treasureName: req.body.treasureName?.trim().replace(/\r\n|\r|\n/g, '') // ✅ Supprimer \r\n
    };
    
    // Parser les objets JSON stringifiés
    try {
      cleanedData.duration = typeof req.body.duration === 'string' ? 
        JSON.parse(req.body.duration) : req.body.duration;
      
      cleanedData.pricing = typeof req.body.pricing === 'string' ? 
        JSON.parse(req.body.pricing) : req.body.pricing;
      
      cleanedData.organizer = typeof req.body.organizer === 'string' ? 
        JSON.parse(req.body.organizer) : req.body.organizer;
      
      cleanedData.meetingPoint = typeof req.body.meetingPoint === 'string' ? 
        JSON.parse(req.body.meetingPoint) : req.body.meetingPoint;
      
      cleanedData.requirements = typeof req.body.requirements === 'string' ? 
        JSON.parse(req.body.requirements) : req.body.requirements;
      
      cleanedData.included = typeof req.body.included === 'string' ? 
        JSON.parse(req.body.included) : req.body.included;
        
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Format JSON invalide dans les données',
        error: parseError.message
      });
    }
    
    // ✅ NETTOYAGE DES COORDONNÉES NULL
    if (cleanedData.meetingPoint?.coordinates) {
      if (cleanedData.meetingPoint.coordinates.latitude === null) {
        cleanedData.meetingPoint.coordinates.latitude = 14.7167; // Dakar
      }
      if (cleanedData.meetingPoint.coordinates.longitude === null) {
        cleanedData.meetingPoint.coordinates.longitude = -17.4677; // Dakar
      }
    }
    
    console.log('✅ Données nettoyées:', {
      treasureId: cleanedData.treasureId,
      maxParticipants: cleanedData.maxParticipants, 
      isPriority: cleanedData.isPriority,
      treasureName: cleanedData.treasureName
    });
    
    // Validation des données nettoyées
    const validationErrors = validateExcursionData(cleanedData);
    if (validationErrors.length > 0) {
      console.log('❌ Erreurs de validation:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validationErrors // ✅ RETOURNER LES DÉTAILS
      });
    }
    
    // Vérifier que le trésor existe
    console.log('🔍 Recherche du trésor avec ID:', cleanedData.treasureId);
    const treasure = await Treasure.findById(cleanedData.treasureId);
    
    if (!treasure) {
      console.log('❌ Trésor non trouvé');
      
      // Debug: lister les trésors disponibles
      const availableTreasures = await Treasure.find().limit(5);
      console.log('📋 Trésors disponibles:');
      availableTreasures.forEach(t => {
        console.log(`  - "${t._id}" (${typeof t._id}): ${t.name}`);
      });
      
      return res.status(404).json({
        success: false,
        message: 'Lieu (trésor) non trouvé',
        debug: {
          searchedId: cleanedData.treasureId,
          searchedType: typeof cleanedData.treasureId,
          availableIds: availableTreasures.map(t => `${t._id} (${t.name})`)
        }
      });
    }
    
    console.log('✅ Trésor trouvé:', treasure.name);
    
    // Traitement des images (votre code existant)
    let processedImages = [];
    if (req.files && req.files.length > 0) {
      processedImages = await processUploadedImages(req.files);
    }
    
    // ✅ PRÉPARATION DES DONNÉES AVEC TYPES CORRECTS
    const excursionData = {
      ...cleanedData, // Utiliser les données nettoyées
      treasureName: treasure.name, // ✅ Utiliser le nom du trésor trouvé
      images: processedImages,
      createdBy: req.user.id,
      currentParticipants: 0,
      participants: [],
      stats: {
        totalRevenue: 0,
        totalDeposits: 0,
        totalBalance: 0,
        averageRating: 0,
        totalReviews: 0
      }
    };
    
    console.log('📋 Données finales pour création:', {
      title: excursionData.title,
      treasureId: excursionData.treasureId,
      treasureName: excursionData.treasureName,
      maxParticipants: excursionData.maxParticipants,
      isPriority: excursionData.isPriority
    });
    
    // Création de l'excursion
    const excursion = new Excursion(excursionData);
    
    // Ajout au log d'audit
    addAuditLog(
      excursion, 
      'created', 
      req.user.id, 
      req.user.username, 
      'Excursion créée'
    );
    
    const savedExcursion = await excursion.save();
    
    console.log('✅ Excursion créée avec succès:', savedExcursion._id);
    
    res.status(201).json({
      success: true,
      message: 'Excursion créée avec succès',
      data: savedExcursion
    });
    
  } catch (error) {
    console.error('❌ Erreur création excursion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'excursion',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
},*/

// ===== 1. CREATE EXCURSION CORRIGÉE =====
/*createExcursion: async (req, res) => {
  try {
    console.log('🎯 Création d\'une nouvelle excursion');
    console.log('📝 Données reçues:', req.body);
    console.log('📷 Fichiers reçus:', req.files?.length || 0);
    
    // ✅ UTILISER LA FONCTION DE NETTOYAGE COMMUNE
    const cleanedData = cleanExcursionData(req.body);
    
    // ✅ VALIDATION DES DONNÉES NETTOYÉES
    const validationErrors = validateExcursionData(cleanedData);
    if (validationErrors.length > 0) {
      console.log('❌ Erreurs de validation:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: validationErrors
      });
    }
    
    // ✅ VÉRIFIER QUE LE TRÉSOR EXISTE
    console.log('🔍 Recherche du trésor avec ID:', cleanedData.treasureId);
    const treasure = await Treasure.findById(cleanedData.treasureId);
    
    if (!treasure) {
      console.log('❌ Trésor non trouvé');
      
      // Debug: lister les trésors disponibles
      const availableTreasures = await Treasure.find().limit(5);
      console.log('📋 Trésors disponibles:');
      availableTreasures.forEach(t => {
        console.log(`  - "${t._id}": ${t.name}`);
      });
      
      return res.status(404).json({
        success: false,
        message: 'Lieu (trésor) non trouvé',
        debug: {
          searchedId: cleanedData.treasureId,
          availableIds: availableTreasures.map(t => `${t._id} (${t.name})`)
        }
      });
    }
    
    console.log('✅ Trésor trouvé:', treasure.name);
    
    // ✅ TRAITEMENT DES IMAGES
    let processedImages = [];
    if (req.files && req.files.length > 0) {
      processedImages = await processUploadedImages(req.files);
    }
    
    // ✅ PRÉPARATION DES DONNÉES FINALES
    const excursionData = {
      ...cleanedData,
      treasureName: treasure.name, // Utiliser le nom du trésor trouvé
      images: processedImages,
      createdBy: req.user.id,
      currentParticipants: 0,
      participants: [],
      stats: {
        totalRevenue: 0,
        totalDeposits: 0,
        totalBalance: 0,
        averageRating: 0,
        totalReviews: 0
      }
    };
    
    console.log('📋 Données finales pour création:', {
      title: excursionData.title,
      treasureId: excursionData.treasureId,
      treasureName: excursionData.treasureName,
      maxParticipants: excursionData.maxParticipants,
      isPriority: excursionData.isPriority
    });
    
    // ✅ CRÉATION DE L'EXCURSION
    const excursion = new Excursion(excursionData);
    
    // Ajout au log d'audit
    addAuditLog(
      excursion, 
      'created', 
      req.user.id, 
      req.user.username, 
      'Excursion créée'
    );
    
    const savedExcursion = await excursion.save();
    
    console.log('✅ Excursion créée avec succès:', savedExcursion._id);
    
    res.status(201).json({
      success: true,
      message: 'Excursion créée avec succès',
      data: savedExcursion
    });
    
  } catch (error) {
    console.error('❌ Erreur création excursion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'excursion',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
},

// ===== AMÉLIORATION DE LA VALIDATION =====
// Modifiez aussi validateExcursionData pour accepter les données nettoyées :






  // ===== 2. OBTENIR TOUTES LES EXCURSIONS =====
  getAllExcursions: async (req, res) => {
    try {
      console.log('📋 Récupération de toutes les excursions');
      console.log('🔍 Paramètres de requête:', req.query);
      
      const { 
        status, 
        treasureId, 
        upcoming, 
        search, 
        limit = 20, 
        page = 1,
        sortBy = 'date',
        sortOrder = 'asc'
      } = req.query;
      
      // Construction de la requête
      let query = {};
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (treasureId) {
        query.treasureId = treasureId;
      }
      
      if (upcoming === 'true') {
        query.date = { $gte: new Date() };
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { treasureName: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Configuration du tri
      const sortConfig = {};
      sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Exécution de la requête
      const [excursions, totalCount] = await Promise.all([
        Excursion.find(query)
          .populate('treasureId', 'name location placeImage')
          .populate('createdBy', 'username')
          .sort(sortConfig)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Excursion.countDocuments(query)
      ]);
      
      // Enrichissement des données
      const enrichedExcursions = excursions.map(excursion => ({
        ...excursion,
        availableSpots: excursion.maxParticipants - excursion.currentParticipants,
        isFullyBooked: excursion.currentParticipants >= excursion.maxParticipants,
        fillRate: excursion.maxParticipants > 0 ? 
          (excursion.currentParticipants / excursion.maxParticipants) * 100 : 0
      }));
      
      console.log(`✅ ${excursions.length} excursions récupérées sur ${totalCount} total`);
      
      res.status(200).json({
        success: true,
        data: enrichedExcursions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNext: skip + excursions.length < totalCount,
          hasPrev: parseInt(page) > 1
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération excursions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des excursions',
        error: error.message
      });
    }
  },

  // ===== 3. OBTENIR UNE EXCURSION PAR ID =====
  getExcursionById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔍 Récupération de l'excursion: ${id}`);
      
      const excursion = await Excursion.findById(id)
        .populate('treasureId', 'name location placeImage description')
        .populate('createdBy', 'username email')
        .populate('participants.userId', 'username email profile');
      
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      console.log('✅ Excursion trouvée');
      
      res.status(200).json({
        success: true,
        data: excursion
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération excursion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'excursion',
        error: error.message
      });
    }
  },

  // ===== 4. OBTENIR EXCURSIONS PAR LIEU =====
  getExcursionsByTreasure: async (req, res) => {
    try {
      const { treasureId } = req.params;
      const { upcoming = 'true', status = 'published' } = req.query;
      
      console.log(`🏝️ Récupération des excursions pour le lieu: ${treasureId}`);
      
      // Vérifier que le trésor existe
      const treasure = await Treasure.findById(treasureId);
      if (!treasure) {
        return res.status(404).json({
          success: false,
          message: 'Lieu non trouvé'
        });
      }
      
      // Options de recherche
      const options = {
        status: status !== 'all' ? status : undefined,
        upcoming: upcoming === 'true'
      };
      
      const excursions = await Excursion.findByTreasure(treasureId, options);
      
      console.log(`✅ ${excursions.length} excursions trouvées pour ce lieu`);
      
      res.status(200).json({
        success: true,
        data: excursions,
        treasure: {
          _id: treasure._id,
          name: treasure.name,
          location: treasure.location
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération excursions par lieu:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des excursions',
        error: error.message
      });
    }
  },

  // ===== 5. METTRE À JOUR UNE EXCURSION =====
updateExcursion: async (req, res) => {

   console.log("🔥🔥🔥 FONCTION updateExcursion APPELÉE !!! 🔥🔥🔥");
  console.log("📍 ID reçu:", req.params.id);
  console.log("📍 Body reçu:", Object.keys(req.body));
  try {
    const { id } = req.params;
    console.log(`✏️ Mise à jour de l'excursion: ${id}`);
    console.log('📝 Données reçues:', Object.keys(req.body));
    
    // ✅ VÉRIFIER QUE L'EXCURSION EXISTE
    const excursion = await Excursion.findById(id);
    if (!excursion) {
      return res.status(404).json({
        success: false,
        message: 'Excursion non trouvée'
      });
    }
    
    console.log('✅ Excursion trouvée:', excursion.title);
    
    // ✅ PRÉPARATION DES DONNÉES - VERSION SIMPLIFIÉE
    const updateData = {};
    
    // Champs de base
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.shortDescription) updateData.shortDescription = req.body.shortDescription;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.maxParticipants) updateData.maxParticipants = parseInt(req.body.maxParticipants);
    if (req.body.treasureId) updateData.treasureId = req.body.treasureId;
    if (req.body.treasureName) updateData.treasureName = req.body.treasureName;
    if (req.body.date) updateData.date = req.body.date;
    if (req.body.isPriority !== undefined) updateData.isPriority = req.body.isPriority === 'true';
    
    // Objets complexes (parsing JSON)
    try {
      if (req.body.duration && typeof req.body.duration === 'string') {
        updateData.duration = JSON.parse(req.body.duration);
      }
      if (req.body.pricing && typeof req.body.pricing === 'string') {
        updateData.pricing = JSON.parse(req.body.pricing);
      }
      if (req.body.organizer && typeof req.body.organizer === 'string') {
        updateData.organizer = JSON.parse(req.body.organizer);
      }
      if (req.body.meetingPoint && typeof req.body.meetingPoint === 'string') {
        updateData.meetingPoint = JSON.parse(req.body.meetingPoint);
      }
      if (req.body.requirements && typeof req.body.requirements === 'string') {
        updateData.requirements = JSON.parse(req.body.requirements);
      }
      if (req.body.included && typeof req.body.included === 'string') {
        updateData.included = JSON.parse(req.body.included);
      }
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Erreur de format des données',
        error: parseError.message
      });
    }
    
    // ✅ IDENTIFIER LES CHANGEMENTS
    const changes = [];
    if (updateData.title && updateData.title !== excursion.title) changes.push('titre');
    if (updateData.description && updateData.description !== excursion.description) changes.push('description');
    if (updateData.status && updateData.status !== excursion.status) changes.push('statut');
    
    // ✅ MÉTADONNÉES (sécurisées)
    updateData.updatedAt = new Date();
    if (req.user && req.user.id) {
      updateData.updatedBy = req.user.id;
    }
    
    console.log('💾 Application des changements...');
    console.log('📊 Changements:', changes.join(', ') || 'Aucun');
    
    // ✅ MISE À JOUR DIRECTE
    Object.assign(excursion, updateData);
    
    // ✅ AUDIT LOG SIMPLE
    if (!excursion.auditLog) {
      excursion.auditLog = [];
    }
    
    const auditEntry = {
      action: 'updated',
      userId: req.user && req.user.id ? req.user.id : 'anonymous',
      username: req.user && req.user.username ? req.user.username : 'Utilisateur',
      date: new Date(),
      details: 'Excursion modifiée',
      summary: changes.length > 0 ? changes.join(', ') : 'Modification'
    };
    
    excursion.auditLog.push(auditEntry);
    
    // ✅ LIMITE AUDIT LOG
    if (excursion.auditLog.length > 15) {
      excursion.auditLog = excursion.auditLog.slice(-15);
    }
    
    console.log('💾 Sauvegarde en base...');
    const savedExcursion = await excursion.save();
    
    console.log('✅ Excursion mise à jour avec succès!');
    
    res.status(200).json({
      success: true,
      message: 'Excursion mise à jour avec succès',
      data: savedExcursion,
      changes: changes
    });
    
  } catch (error) {
    console.error('❌ ERREUR COMPLÈTE:', error);
    console.error('📍 Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'excursion',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
},

  // ===== 6. SUPPRIMER UNE EXCURSION =====
  deleteExcursion: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Suppression de l'excursion: ${id}`);
      
      const excursion = await Excursion.findById(id);
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      // Vérifier s'il y a des participants avec paiements
      const paidParticipants = excursion.participants.filter(p => 
        p.paymentStatus === 'deposit_paid' || p.paymentStatus === 'fully_paid'
      );
      
      if (paidParticipants.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer une excursion avec des participants ayant payé',
          details: `${paidParticipants.length} participant(s) ont déjà payé`
        });
      }
      
      // Supprimer les images associées
      for (const image of excursion.images) {
        try {
          const imagePath = path.join(__dirname, '..', image.url);
          await fs.unlink(imagePath);
        } catch (error) {
          console.warn('Impossible de supprimer l\'image:', image.url);
        }
      }
      
      await Excursion.findByIdAndDelete(id);
      
      console.log('✅ Excursion supprimée avec succès');
      
      res.status(200).json({
        success: true,
        message: 'Excursion supprimée avec succès'
      });
      
    } catch (error) {
      console.error('❌ Erreur suppression excursion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'excursion',
        error: error.message
      });
    }
  },
  // AJOUTER UN PARTICIPANT - VERSION CORRIGÉE =====
addParticipant: async (req, res) => {
  try {
    const { excursionId } = req.params;
    let participantData = req.body;
    
    console.log(`👤 Ajout d'un participant à l'excursion: ${excursionId}`);
    console.log('📝 Données participant reçues:', participantData);
    
    // ✅ VALIDATION DES DONNÉES D'ENTRÉE
    if (!participantData.userId) {
      return res.status(400).json({
        success: false,
        message: 'UserId requis pour l\'inscription'
      });
    }
    
    if (!participantData.numberOfPersons || participantData.numberOfPersons < 1) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de personnes invalide'
      });
    }
    
    // ✅ VÉRIFIER QUE L'EXCURSION EXISTE
    const excursion = await Excursion.findById(excursionId);
    if (!excursion) {
      return res.status(404).json({
        success: false,
        message: 'Excursion non trouvée'
      });
    }
    
    console.log(`✅ Excursion trouvée: ${excursion.title}`);
    console.log(`📊 Places disponibles: ${excursion.availableSpots}`);
    
    // ✅ VÉRIFIER LA DISPONIBILITÉ
    if (excursion.isFullyBooked) {
      return res.status(400).json({
        success: false,
        message: 'Cette excursion est complète'
      });
    }
    
    if (participantData.numberOfPersons > excursion.availableSpots) {
      return res.status(400).json({
        success: false,
        message: `Plus que ${excursion.availableSpots} place(s) disponible(s)`
      });
    }
    
    // ✅ VÉRIFIER SI L'UTILISATEUR EXISTE
    const user = await User.findById(participantData.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.username}`);
    
    // ✅ VÉRIFIER SI L'UTILISATEUR N'EST PAS DÉJÀ INSCRIT
    const existingParticipant = excursion.participants.find(p => 
      p.userId.toString() === participantData.userId.toString()
    );
    
    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'Vous êtes déjà inscrit à cette excursion',
        data: {
          participant: existingParticipant,
          paymentStatus: existingParticipant.paymentStatus
        }
      });
    }
    
    // ✅ NETTOYER ET COMPLÉTER LES DONNÉES DU PARTICIPANT
    const cleanParticipantData = {
      userId: participantData.userId,
      username: participantData.username || user.username,
      fullName: participantData.fullName || user.fullName || user.username,
      email: participantData.email || user.email,
      phone: participantData.phone || user.phone || '',
      numberOfPersons: participantData.numberOfPersons,
      paymentStatus: 'pending',
      notificationsEnabled: participantData.notificationsEnabled !== false
    };
    
    // ✅ AJOUTER LES CHAMPS OPTIONNELS SEULEMENT S'ILS EXISTENT
    if (participantData.specialRequests) {
      cleanParticipantData.specialRequests = participantData.specialRequests;
    }
    
    if (participantData.emergencyContact && 
        (participantData.emergencyContact.name || 
         participantData.emergencyContact.phone || 
         participantData.emergencyContact.relation)) {
      cleanParticipantData.emergencyContact = {};
      
      if (participantData.emergencyContact.name) {
        cleanParticipantData.emergencyContact.name = participantData.emergencyContact.name;
      }
      if (participantData.emergencyContact.phone) {
        cleanParticipantData.emergencyContact.phone = participantData.emergencyContact.phone;
      }
      if (participantData.emergencyContact.relation) {
        cleanParticipantData.emergencyContact.relation = participantData.emergencyContact.relation;
      }
    }
    
    console.log('📝 Données participant nettoyées:', cleanParticipantData);
    
    // ✅ UTILISER LA MÉTHODE addParticipant DU MODÈLE
    let participant;
    try {
      participant = excursion.addParticipant(cleanParticipantData);
      console.log('✅ Participant ajouté au modèle');
    } catch (modelError) {
      console.error('❌ Erreur méthode addParticipant:', modelError);
      return res.status(400).json({
        success: false,
        message: modelError.message || 'Erreur lors de l\'ajout du participant'
      });
    }
    
    // ✅ AUDIT LOG SIMPLE (sans oldValues/newValues volumineux)
    if (!excursion.auditLog) {
      excursion.auditLog = [];
    }
    
    excursion.auditLog.push({
      action: 'participant_added',
      userId: req.user ? req.user.id : participantData.userId,
      username: req.user ? req.user.username : cleanParticipantData.username,
      date: new Date(),
      details: `Participant ajouté: ${cleanParticipantData.username} (${cleanParticipantData.numberOfPersons} personne(s))`
    });
    
    // ✅ LIMITER L'AUDIT LOG
    if (excursion.auditLog.length > 15) {
      excursion.auditLog = excursion.auditLog.slice(-15);
    }
    
    // ✅ SAUVEGARDER L'EXCURSION
    try {
      await excursion.save();
      console.log('✅ Excursion sauvegardée avec succès');
    } catch (saveError) {
      console.error('❌ Erreur sauvegarde excursion:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la sauvegarde',
        error: saveError.message
      });
    }
    
    console.log('🎉 Participant ajouté avec succès');
    
    // ✅ RÉPONSE AVEC DONNÉES UTILES
    res.status(201).json({
      success: true,
      message: 'Inscription réussie ! Vous recevrez bientôt les instructions de paiement.',
      data: {
        participant: {
          _id: participant._id,
          username: participant.username,
          fullName: participant.fullName,
          numberOfPersons: participant.numberOfPersons,
          totalAmount: participant.totalAmount,
          depositAmount: participant.depositAmount,
          remainingAmount: participant.remainingAmount,
          paymentStatus: participant.paymentStatus,
          registrationDate: participant.registrationDate
        },
        excursion: {
          _id: excursion._id,
          title: excursion.title,
          currentParticipants: excursion.currentParticipants,
          availableSpots: excursion.availableSpots,
          isFullyBooked: excursion.isFullyBooked
        }
      }
    });
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE addParticipant:', error);
    console.error('📍 Stack:', error.stack);
    
    // ✅ GESTION D'ERREURS SPÉCIFIQUES
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation des données',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Format d\'ID invalide',
        field: error.path
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur s\'est produite'
    });
  }
},

  // ===== 8. OBTENIR LES PARTICIPANTS =====
  getParticipants: async (req, res) => {
    try {
      const { excursionId } = req.params;
      console.log(`👥 Récupération des participants pour l'excursion: ${excursionId}`);
      
      const excursion = await Excursion.findById(excursionId)
        .populate('participants.userId', 'username email profile')
        .select('title date participants stats');
      
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      console.log(`✅ ${excursion.participants.length} participants trouvés`);
      
      res.status(200).json({
        success: true,
        data: {
          excursion: {
            _id: excursion._id,
            title: excursion.title,
            date: excursion.date
          },
          participants: excursion.participants,
          stats: {
            totalParticipants: excursion.participants.reduce((sum, p) => sum + p.numberOfPersons, 0),
            totalRegistrations: excursion.participants.length,
            pendingPayments: excursion.participants.filter(p => p.paymentStatus === 'pending').length,
            fullyPaid: excursion.participants.filter(p => p.paymentStatus === 'fully_paid').length,
            totalRevenue: excursion.stats.totalRevenue
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération participants:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des participants',
        error: error.message
      });
    }
  },

  // ===== 9. ENREGISTRER UN PAIEMENT =====
  recordPayment: async (req, res) => {
    try {
      const { excursionId, participantId } = req.params;
      const paymentData = req.body;
      
      console.log(`💰 Enregistrement d'un paiement pour l'excursion: ${excursionId}, participant: ${participantId}`);
      console.log('💳 Données paiement:', paymentData);
      
      const excursion = await Excursion.findById(excursionId);
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      const participant = excursion.participants.id(participantId);
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'Participant non trouvé'
        });
      }
      
      // Enregistrer le paiement
      const payment = excursion.recordPayment(participant.userId, paymentData);
      
      // Audit log
      addAuditLog(
        excursion,
        'payment_received',
        req.user.id,
        req.user.username,
        `Paiement reçu: ${paymentData.amount} FCFA de ${participant.username}`
      );
      
      await excursion.save();
      
      console.log('✅ Paiement enregistré avec succès');
      
      res.status(201).json({
        success: true,
        message: 'Paiement enregistré avec succès',
        data: {
          payment,
          participant: {
            _id: participant._id,
            paymentStatus: participant.paymentStatus,
            totalPaid: participant.paymentHistory
              .filter(p => p.status === 'success')
              .reduce((sum, p) => sum + p.amount, 0)
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur enregistrement paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement du paiement',
        error: error.message
      });
    }
  },

  // ===== 10. OBTENIR LES EXCURSIONS D'UN UTILISATEUR =====
  getUserExcursions: async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, upcoming = 'false' } = req.query;
      
      console.log(`👤 Récupération des excursions de l'utilisateur: ${userId}`);
      
      const options = {
        status: status !== 'all' ? status : undefined,
        upcoming: upcoming === 'true'
      };
      
      const excursions = await Excursion.findByUser(userId, options);
      
      console.log(`✅ ${excursions.length} excursions trouvées pour cet utilisateur`);
      
      res.status(200).json({
        success: true,
        data: excursions
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération excursions utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des excursions de l\'utilisateur',
        error: error.message
      });
    }
  },

  // ===== 11. OBTENIR LE STATUT D'UN UTILISATEUR =====
  getUserExcursionStatus: async (req, res) => {
    try {
      const { excursionId, userId } = req.params;
      
      console.log(`🔍 Vérification du statut utilisateur ${userId} pour l'excursion ${excursionId}`);
      
      const excursion = await Excursion.findById(excursionId);
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      const participant = excursion.participants.find(p => 
        p.userId.toString() === userId.toString()
      );
      
      if (!participant) {
        return res.status(200).json({
          success: true,
          data: {
            isRegistered: false,
            status: null
          }
        });
      }
      
      const totalPaid = participant.paymentHistory
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + p.amount, 0);
      
      res.status(200).json({
        success: true,
        data: {
          isRegistered: true,
          status: participant.paymentStatus,
          participant: {
            _id: participant._id,
            numberOfPersons: participant.numberOfPersons,
            totalAmount: participant.totalAmount,
            depositAmount: participant.depositAmount,
            remainingAmount: participant.remainingAmount,
            totalPaid,
            registrationDate: participant.registrationDate,
            isConfirmed: participant.isConfirmed
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur vérification statut utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du statut',
        error: error.message
      });
    }
  },

  // ===== 12. STATISTIQUES DASHBOARD =====
  getDashboardStats: async (req, res) => {
    try {
      console.log('📊 Récupération des statistiques dashboard');
      
      const stats = await Excursion.getDashboardStats();
      const result = stats[0];
      
      const dashboardData = {
        totalExcursions: result.total[0]?.count || 0,
        upcomingExcursions: result.upcoming[0]?.count || 0,
        totalRevenue: result.revenue[0]?.total || 0,
        totalParticipants: result.participants[0]?.total || 0
      };
      
      // Statistiques supplémentaires
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const [monthlyStats, statusStats] = await Promise.all([
        Excursion.aggregate([
          {
            $match: {
              createdAt: { $gte: thisMonth }
            }
          },
          {
            $group: {
              _id: null,
              newExcursions: { $sum: 1 },
              newRevenue: { $sum: "$stats.totalRevenue" }
            }
          }
        ]),
        Excursion.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ])
      ]);
      
      dashboardData.monthlyStats = {
        newExcursions: monthlyStats[0]?.newExcursions || 0,
        newRevenue: monthlyStats[0]?.newRevenue || 0
      };
      
      dashboardData.statusBreakdown = statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});
      
      console.log('✅ Statistiques récupérées');
      
      res.status(200).json({
        success: true,
        stats: dashboardData
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
};

// ======= MIDDLEWARE UPLOAD =======
excursionController.uploadMiddleware = upload.array('images', 5);

module.exports = excursionController;*/



// controllers/excursionController.js
// ✅ ÉTAPE 2 - CONTRÔLEUR AVEC VALIDATION TÉLÉPHONE ET CONTACT D'URGENCE OBLIGATOIRES

const Excursion = require('../models/Excursion');
const Treasure = require('../models/Treasures');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { validationResult } = require('express-validator');

// ✅ FONCTION UTILITAIRE POUR VALIDATION ET NETTOYAGE TÉLÉPHONE
const validateAndCleanPhone = (phoneInput, userPhone, context = 'principal') => {
  // Essayer d'abord le téléphone fourni, sinon celui de l'utilisateur
  const phones = [phoneInput, userPhone].filter(p => p && p.trim());
  
  for (const phone of phones) {
    if (!phone) continue;
    
    // Nettoyer le numéro (supprimer espaces, tirets, parenthèses)
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // Validation format international
    const phoneRegex = /^[\+]?[1-9]\d{1,14}$/;
    
    if (cleaned.length >= 8 && cleaned.length <= 15 && phoneRegex.test(cleaned)) {
      // Ajouter le + si manquant pour les numéros qui commencent par un code pays
      if (!cleaned.startsWith('+') && cleaned.length > 8) {
        return {
          isValid: true,
          phone: `+${cleaned}`,
          error: null
        };
      }
      return {
        isValid: true,
        phone: cleaned,
        error: null
      };
    }
  }
  
  return {
    isValid: false,
    phone: null,
    error: `Format de téléphone ${context} invalide. Utilisez un format international (ex: +221771234567, +33123456789)`
  };
};

// ✅ FONCTION VALIDATION CONTACT D'URGENCE COMPLET
const validateEmergencyContact = (emergencyContact) => {
  const errors = [];
  
  if (!emergencyContact) {
    return ['Le contact d\'urgence est obligatoire pour votre sécurité durant l\'excursion'];
  }
  
  // Validation nom
  if (!emergencyContact.name || !emergencyContact.name.trim()) {
    errors.push('Le nom du contact d\'urgence est obligatoire');
  } else if (emergencyContact.name.trim().length < 2) {
    errors.push('Le nom du contact d\'urgence doit contenir au moins 2 caractères');
  } else if (emergencyContact.name.trim().length > 100) {
    errors.push('Le nom du contact d\'urgence est trop long (max 100 caractères)');
  }
  
  // Validation téléphone d'urgence
  const phoneValidation = validateAndCleanPhone(emergencyContact.phone, null, 'd\'urgence');
  if (!phoneValidation.isValid) {
    errors.push(phoneValidation.error);
  }
  
  // Validation relation
  const validRelations = [
    'conjoint', 'conjointe', 'époux', 'épouse', 'mari', 'femme',
    'père', 'mère', 'parent', 'fils', 'fille', 'enfant',
    'frère', 'sœur', 'frère et sœur',
    'grand-père', 'grand-mère', 'grand-parent',
    'oncle', 'tante', 'cousin', 'cousine',
    'ami', 'amie', 'ami proche', 'collègue',
    'tuteur', 'tutrice', 'responsable légal',
    'autre'
  ];
  
  if (!emergencyContact.relation || !emergencyContact.relation.trim()) {
    errors.push('La relation avec le contact d\'urgence est obligatoire');
  } else {
    const relation = emergencyContact.relation.trim().toLowerCase();
    if (!validRelations.includes(relation)) {
      errors.push(`Relation "${emergencyContact.relation}" non reconnue. Utilisez: conjoint, parent, enfant, frère/sœur, ami, etc.`);
    }
  }
  
  return errors;
};

//🛠️ FONCTION UTILITAIRE COMMUNE POUR NETTOYER LES DONNÉES
const cleanExcursionData = (reqBody) => {
  console.log('🧹 Nettoyage des données...');
  
  // Nettoyer et convertir les données de base
  const cleanedData = {
    title: reqBody.title?.trim(),
    description: reqBody.description?.trim(),
    shortDescription: reqBody.shortDescription?.trim(),
    date: reqBody.date,
    status: reqBody.status || 'draft',
    notes: reqBody.notes?.trim() || ''
  };
  
  // ✅ CORRECTION TREASUREID - gestion de '[object Object]'
  let treasureId = reqBody.treasureId;
  if (treasureId === '[object Object]' || !treasureId) {
    // Fallback vers d'autres champs possibles
    treasureId = reqBody.treasure || reqBody.treasureName || reqBody.place || null;
  }
  cleanedData.treasureId = treasureId?.toString().trim();
  
  // ✅ CONVERSION CORRECTE DES TYPES
  cleanedData.maxParticipants = parseInt(reqBody.maxParticipants) || 10;
  cleanedData.isPriority = reqBody.isPriority === 'true' || reqBody.isPriority === true;
  
  // ✅ NETTOYAGE TREASURENAME (supprimer \r\n)
  if (reqBody.treasureName) {
    cleanedData.treasureName = reqBody.treasureName.trim().replace(/\r\n|\r|\n/g, '');
  }
  
  // ✅ PARSER LES OBJETS JSON STRINGIFIÉS
  const jsonFields = ['duration', 'pricing', 'organizer', 'meetingPoint', 'requirements'];
  
  jsonFields.forEach(field => {
    try {
      if (reqBody[field]) {
        cleanedData[field] = typeof reqBody[field] === 'string' ? 
          JSON.parse(reqBody[field]) : reqBody[field];
      }
    } catch (parseError) {
      console.warn(`⚠️ Erreur parsing ${field}:`, parseError);
      cleanedData[field] = {};
    }
  });
  
  // ✅ PARSER LES ARRAYS JSON
  try {
    cleanedData.included = reqBody.included ? 
      (typeof reqBody.included === 'string' ? JSON.parse(reqBody.included) : reqBody.included) : [];
    
    cleanedData.notIncluded = reqBody.notIncluded ? 
      (typeof reqBody.notIncluded === 'string' ? JSON.parse(reqBody.notIncluded) : reqBody.notIncluded) : [];
  } catch (parseError) {
    console.warn('⚠️ Erreur parsing arrays:', parseError);
    cleanedData.included = [];
    cleanedData.notIncluded = [];
  }
  
  // ✅ NETTOYAGE DES COORDONNÉES NULL
  if (cleanedData.meetingPoint?.coordinates) {
    if (cleanedData.meetingPoint.coordinates.latitude === null) {
      cleanedData.meetingPoint.coordinates.latitude = 14.7167; // Dakar par défaut
    }
    if (cleanedData.meetingPoint.coordinates.longitude === null) {
      cleanedData.meetingPoint.coordinates.longitude = -17.4677; // Dakar par défaut
    }
  }
  
  console.log('✅ Données nettoyées:', {
    treasureId: cleanedData.treasureId,
    maxParticipants: cleanedData.maxParticipants,
    isPriority: cleanedData.isPriority,
    treasureName: cleanedData.treasureName,
    hasOrganizerName: !!cleanedData.organizer?.name,
    hasOrganizerPhone: !!cleanedData.organizer?.phone,
    hasMeetingPointName: !!cleanedData.meetingPoint?.name,
    hasPricingBasePrice: !!cleanedData.pricing?.basePrice
  });
  
  return cleanedData;
};

// ======= CONFIGURATION UPLOAD D'IMAGES =======

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'assets', 'images', 'excursions');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `excursion-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

const validateExcursionData = (data) => {
  const errors = [];
  
  console.log('🔍 Validation des données nettoyées:', {
    title: data.title?.length,
    description: data.description?.length,
    treasureId: data.treasureId,
    maxParticipants: data.maxParticipants,
    maxParticipantsType: typeof data.maxParticipants
  });
  
  if (!data.title || data.title.trim().length < 5) {
    errors.push('Le titre doit contenir au moins 5 caractères');
  }
  
  if (!data.description || data.description.trim().length < 20) {
    errors.push('La description doit contenir au moins 20 caractères');
  }
  
  if (!data.treasureId) {
    errors.push('Le lieu (treasureId) est obligatoire');
  }
  
  if (!data.date) {
    errors.push('La date est obligatoire');
  } else {
    const excursionDate = new Date(data.date);
    const now = new Date();
    const marginMs = 30 * 60 * 1000; // 30 minutes
    
    if (excursionDate.getTime() <= (now.getTime() - marginMs)) {
      errors.push('La date doit être dans le futur');
    }
  }
  
  // ✅ VALIDATION AMÉLIORÉE POUR LES NOMBRES
  if (!data.maxParticipants || isNaN(data.maxParticipants) || data.maxParticipants < 1) {
    errors.push('Le nombre maximum de participants doit être au moins 1');
  }
  
  // Validation pricing
  if (!data.pricing || !data.pricing.basePrice || data.pricing.basePrice < 0) {
    errors.push('Le prix de base est obligatoire et doit être positif');
  }
  
  // Validation organizer
  if (!data.organizer || !data.organizer.name || !data.organizer.phone) {
    errors.push('Les informations de l\'organisateur (nom et téléphone) sont obligatoires');
  }
  
  // Validation meetingPoint
  if (!data.meetingPoint || !data.meetingPoint.name) {
    errors.push('Le point de rendez-vous est obligatoire');
  }
  
  console.log('🔍 Erreurs trouvées:', errors);
  return errors;
}

// Traitement des images uploadées
const processUploadedImages = async (files) => {
  const processedImages = [];
  
  for (const file of files) {
    try {
      const outputPath = file.path.replace(path.extname(file.path), '.webp');
      
      await sharp(file.path)
        .resize(800, 600, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outputPath);
      
      // Supprimer l'original
      await fs.unlink(file.path);
      
      const imageUrl = `/assets/images/excursions/${path.basename(outputPath)}`;
      processedImages.push({
        url: imageUrl,
        caption: file.originalname,
        isMain: processedImages.length === 0, // Première image = principale
        uploadDate: new Date()
      });
      
    } catch (error) {
      console.error('Erreur traitement image:', error);
    }
  }
  
  return processedImages;
};

// Ajouter une entrée à l'audit log
const addAuditLog = (excursion, action, userId, username, details = '', oldValues = null, newValues = null) => {
  excursion.auditLog.push({
    action,
    userId,
    username,
    date: new Date(),
    details,
    oldValues,
    newValues
  });
};

// ======= CONTRÔLEUR PRINCIPAL =======
const excursionController = {

  // ===== 1. CRÉER UNE EXCURSION =====
  createExcursion: async (req, res) => {
    try {
      console.log('🎯 Création d\'une nouvelle excursion');
      console.log('📝 Données reçues:', req.body);
      console.log('📷 Fichiers reçus:', req.files?.length || 0);
      
      // ✅ UTILISER LA FONCTION DE NETTOYAGE COMMUNE
      const cleanedData = cleanExcursionData(req.body);
      
      // ✅ VALIDATION DES DONNÉES NETTOYÉES
      const validationErrors = validateExcursionData(cleanedData);
      if (validationErrors.length > 0) {
        console.log('❌ Erreurs de validation:', validationErrors);
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: validationErrors
        });
      }
      
      // ✅ VÉRIFIER QUE LE TRÉSOR EXISTE
      console.log('🔍 Recherche du trésor avec ID:', cleanedData.treasureId);
      const treasure = await Treasure.findById(cleanedData.treasureId);
      
      if (!treasure) {
        console.log('❌ Trésor non trouvé');
        
        // Debug: lister les trésors disponibles
        const availableTreasures = await Treasure.find().limit(5);
        console.log('📋 Trésors disponibles:');
        availableTreasures.forEach(t => {
          console.log(`  - "${t._id}": ${t.name}`);
        });
        
        return res.status(404).json({
          success: false,
          message: 'Lieu (trésor) non trouvé',
          debug: {
            searchedId: cleanedData.treasureId,
            availableIds: availableTreasures.map(t => `${t._id} (${t.name})`)
          }
        });
      }
      
      console.log('✅ Trésor trouvé:', treasure.name);
      
      // ✅ TRAITEMENT DES IMAGES
      let processedImages = [];
      if (req.files && req.files.length > 0) {
        processedImages = await processUploadedImages(req.files);
      }
      
      // ✅ PRÉPARATION DES DONNÉES FINALES
      const excursionData = {
        ...cleanedData,
        treasureName: treasure.name, // Utiliser le nom du trésor trouvé
        images: processedImages,
        createdBy: req.user.id,
        currentParticipants: 0,
        participants: [],
        stats: {
          totalRevenue: 0,
          totalDeposits: 0,
          totalBalance: 0,
          averageRating: 0,
          totalReviews: 0
        }
      };
      
      console.log('📋 Données finales pour création:', {
        title: excursionData.title,
        treasureId: excursionData.treasureId,
        treasureName: excursionData.treasureName,
        maxParticipants: excursionData.maxParticipants,
        isPriority: excursionData.isPriority
      });
      
      // ✅ CRÉATION DE L'EXCURSION
      const excursion = new Excursion(excursionData);
      
      // Ajout au log d'audit
      addAuditLog(
        excursion, 
        'created', 
        req.user.id, 
        req.user.username, 
        'Excursion créée'
      );
      
      const savedExcursion = await excursion.save();
      
      console.log('✅ Excursion créée avec succès:', savedExcursion._id);
      
      res.status(201).json({
        success: true,
        message: 'Excursion créée avec succès',
        data: savedExcursion
      });
      
    } catch (error) {
      console.error('❌ Erreur création excursion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'excursion',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // ===== 2. OBTENIR TOUTES LES EXCURSIONS =====
  getAllExcursions: async (req, res) => {
    try {
      console.log('📋 Récupération de toutes les excursions');
      console.log('🔍 Paramètres de requête:', req.query);
      
      const { 
        status, 
        treasureId, 
        upcoming, 
        search, 
        limit = 20, 
        page = 1,
        sortBy = 'date',
        sortOrder = 'asc'
      } = req.query;
      
      // Construction de la requête
      let query = {};
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (treasureId) {
        query.treasureId = treasureId;
      }
      
      if (upcoming === 'true') {
        query.date = { $gte: new Date() };
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { treasureName: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Configuration du tri
      const sortConfig = {};
      sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Exécution de la requête
      const [excursions, totalCount] = await Promise.all([
        Excursion.find(query)
          .populate('treasureId', 'name location placeImage')
          .populate('createdBy', 'username')
          .sort(sortConfig)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Excursion.countDocuments(query)
      ]);
      
      // Enrichissement des données
      const enrichedExcursions = excursions.map(excursion => ({
        ...excursion,
        availableSpots: excursion.maxParticipants - excursion.currentParticipants,
        isFullyBooked: excursion.currentParticipants >= excursion.maxParticipants,
        fillRate: excursion.maxParticipants > 0 ? 
          (excursion.currentParticipants / excursion.maxParticipants) * 100 : 0
      }));
      
      console.log(`✅ ${excursions.length} excursions récupérées sur ${totalCount} total`);
      
      res.status(200).json({
        success: true,
        data: enrichedExcursions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNext: skip + excursions.length < totalCount,
          hasPrev: parseInt(page) > 1
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération excursions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des excursions',
        error: error.message
      });
    }
  },

  // ===== 3. OBTENIR UNE EXCURSION PAR ID =====
  getExcursionById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔍 Récupération de l'excursion: ${id}`);
      
      const excursion = await Excursion.findById(id)
        .populate('treasureId', 'name location placeImage description')
        .populate('createdBy', 'username email')
        .populate('participants.userId', 'username email profile');
      
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      console.log('✅ Excursion trouvée');
      
      res.status(200).json({
        success: true,
        data: excursion
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération excursion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'excursion',
        error: error.message
      });
    }
  },

  // ===== 4. OBTENIR EXCURSIONS PAR LIEU =====
  getExcursionsByTreasure: async (req, res) => {
    try {
      const { treasureId } = req.params;
      const { upcoming = 'true', status = 'published' } = req.query;
      
      console.log(`🏝️ Récupération des excursions pour le lieu: ${treasureId}`);
      
      // Vérifier que le trésor existe
      const treasure = await Treasure.findById(treasureId);
      if (!treasure) {
        return res.status(404).json({
          success: false,
          message: 'Lieu non trouvé'
        });
      }
      
      // Options de recherche
      const options = {
        status: status !== 'all' ? status : undefined,
        upcoming: upcoming === 'true'
      };
      
      const excursions = await Excursion.findByTreasure(treasureId, options);
      
      console.log(`✅ ${excursions.length} excursions trouvées pour ce lieu`);
      
      res.status(200).json({
        success: true,
        data: excursions,
        treasure: {
          _id: treasure._id,
          name: treasure.name,
          location: treasure.location
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération excursions par lieu:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des excursions',
        error: error.message
      });
    }
  },

  // ===== 5. METTRE À JOUR UNE EXCURSION =====
  updateExcursion: async (req, res) => {
    console.log("🔥🔥🔥 FONCTION updateExcursion APPELÉE !!! 🔥🔥🔥");
    console.log("📍 ID reçu:", req.params.id);
    console.log("📍 Body reçu:", Object.keys(req.body));
    try {
      const { id } = req.params;
      console.log(`✏️ Mise à jour de l'excursion: ${id}`);
      console.log('📝 Données reçues:', Object.keys(req.body));
      
      // ✅ VÉRIFIER QUE L'EXCURSION EXISTE
      const excursion = await Excursion.findById(id);
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      console.log('✅ Excursion trouvée:', excursion.title);
      
      // ✅ PRÉPARATION DES DONNÉES - VERSION SIMPLIFIÉE
      const updateData = {};
      
      // Champs de base
      if (req.body.title) updateData.title = req.body.title;
      if (req.body.description) updateData.description = req.body.description;
      if (req.body.shortDescription) updateData.shortDescription = req.body.shortDescription;
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.maxParticipants) updateData.maxParticipants = parseInt(req.body.maxParticipants);
      if (req.body.treasureId) updateData.treasureId = req.body.treasureId;
      if (req.body.treasureName) updateData.treasureName = req.body.treasureName;
      if (req.body.date) updateData.date = req.body.date;
      if (req.body.isPriority !== undefined) updateData.isPriority = req.body.isPriority === 'true';
      
      // Objets complexes (parsing JSON)
      try {
        if (req.body.duration && typeof req.body.duration === 'string') {
          updateData.duration = JSON.parse(req.body.duration);
        }
        if (req.body.pricing && typeof req.body.pricing === 'string') {
          updateData.pricing = JSON.parse(req.body.pricing);
        }
        if (req.body.organizer && typeof req.body.organizer === 'string') {
          updateData.organizer = JSON.parse(req.body.organizer);
        }
        if (req.body.meetingPoint && typeof req.body.meetingPoint === 'string') {
          updateData.meetingPoint = JSON.parse(req.body.meetingPoint);
        }
        if (req.body.requirements && typeof req.body.requirements === 'string') {
          updateData.requirements = JSON.parse(req.body.requirements);
        }
        if (req.body.included && typeof req.body.included === 'string') {
          updateData.included = JSON.parse(req.body.included);
        }
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        return res.status(400).json({
          success: false,
          message: 'Erreur de format des données',
          error: parseError.message
        });
      }
      
      // ✅ IDENTIFIER LES CHANGEMENTS
      const changes = [];
      if (updateData.title && updateData.title !== excursion.title) changes.push('titre');
      if (updateData.description && updateData.description !== excursion.description) changes.push('description');
      if (updateData.status && updateData.status !== excursion.status) changes.push('statut');
      
      // ✅ MÉTADONNÉES (sécurisées)
      updateData.updatedAt = new Date();
      if (req.user && req.user.id) {
        updateData.updatedBy = req.user.id;
      }
      
      console.log('💾 Application des changements...');
      console.log('📊 Changements:', changes.join(', ') || 'Aucun');
      
      // ✅ MISE À JOUR DIRECTE
      Object.assign(excursion, updateData);
      
      // ✅ AUDIT LOG SIMPLE
      if (!excursion.auditLog) {
        excursion.auditLog = [];
      }
      
      const auditEntry = {
        action: 'updated',
        userId: req.user && req.user.id ? req.user.id : 'anonymous',
        username: req.user && req.user.username ? req.user.username : 'Utilisateur',
        date: new Date(),
        details: 'Excursion modifiée',
        summary: changes.length > 0 ? changes.join(', ') : 'Modification'
      };
      
      excursion.auditLog.push(auditEntry);
      
      // ✅ LIMITE AUDIT LOG
      if (excursion.auditLog.length > 15) {
        excursion.auditLog = excursion.auditLog.slice(-15);
      }
      
      console.log('💾 Sauvegarde en base...');
      const savedExcursion = await excursion.save();
      
      console.log('✅ Excursion mise à jour avec succès!');
      
      res.status(200).json({
        success: true,
        message: 'Excursion mise à jour avec succès',
        data: savedExcursion,
        changes: changes
      });
      
    } catch (error) {
      console.error('❌ ERREUR COMPLÈTE:', error);
      console.error('📍 Stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'excursion',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // ===== 6. SUPPRIMER UNE EXCURSION =====
  deleteExcursion: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Suppression de l'excursion: ${id}`);
      
      const excursion = await Excursion.findById(id);
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      // Vérifier s'il y a des participants avec paiements
      const paidParticipants = excursion.participants.filter(p => 
        p.paymentStatus === 'deposit_paid' || p.paymentStatus === 'fully_paid'
      );
      
      if (paidParticipants.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de supprimer une excursion avec des participants ayant payé',
          details: `${paidParticipants.length} participant(s) ont déjà payé`
        });
      }
      
      // Supprimer les images associées
      for (const image of excursion.images) {
        try {
          const imagePath = path.join(__dirname, '..', image.url);
          await fs.unlink(imagePath);
        } catch (error) {
          console.warn('Impossible de supprimer l\'image:', image.url);
        }
      }
      
      await Excursion.findByIdAndDelete(id);
      
      console.log('✅ Excursion supprimée avec succès');
      
      res.status(200).json({
        success: true,
        message: 'Excursion supprimée avec succès'
      });
      
    } catch (error) {
      console.error('❌ Erreur suppression excursion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'excursion',
        error: error.message
      });
    }
  },

  // ✅ ===== 7. AJOUTER UN PARTICIPANT - VERSION CORRIGÉE AVEC CONTACT D'URGENCE OBLIGATOIRE =====
  addParticipant: async (req, res) => {
    try {
      const { excursionId } = req.params;
      let participantData = req.body;
      
      console.log(`👤 Ajout d'un participant à l'excursion: ${excursionId}`);
      console.log('📝 Données participant reçues:', {
        ...participantData,
        phone: participantData.phone ? '***' : 'Non fourni',
        emergencyContact: participantData.emergencyContact ? {
          name: participantData.emergencyContact.name || 'Non fourni',
          phone: participantData.emergencyContact.phone ? '***' : 'Non fourni',
          relation: participantData.emergencyContact.relation || 'Non fourni'
        } : 'Non fourni'
      });
      
      // ✅ VALIDATION DES DONNÉES D'ENTRÉE
      if (!participantData.userId) {
        return res.status(400).json({
          success: false,
          message: 'UserId requis pour l\'inscription'
        });
      }
      
      if (!participantData.numberOfPersons || participantData.numberOfPersons < 1) {
        return res.status(400).json({
          success: false,
          message: 'Nombre de personnes invalide'
        });
      }
      
      // ✅ VÉRIFICATIONS STANDARD (excursion, utilisateur, etc.)
      const excursion = await Excursion.findById(excursionId);
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      console.log(`✅ Excursion trouvée: ${excursion.title}`);
      console.log(`📊 Places disponibles: ${excursion.availableSpots}`);
      
      if (excursion.isFullyBooked) {
        return res.status(400).json({
          success: false,
          message: 'Cette excursion est complète'
        });
      }
      
      if (participantData.numberOfPersons > excursion.availableSpots) {
        return res.status(400).json({
          success: false,
          message: `Plus que ${excursion.availableSpots} place(s) disponible(s)`
        });
      }
      
      const user = await User.findById(participantData.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      console.log(`✅ Utilisateur trouvé: ${user.username}`);
      
      // ✅ VÉRIFIER SI DÉJÀ INSCRIT
      const existingParticipant = excursion.participants.find(p => 
        p.userId.toString() === participantData.userId.toString()
      );
      
      if (existingParticipant) {
        return res.status(400).json({
          success: false,
          message: 'Vous êtes déjà inscrit à cette excursion',
          data: {
            participant: existingParticipant,
            paymentStatus: existingParticipant.paymentStatus
          }
        });
      }
      
      // ✅ VALIDATION TÉLÉPHONE PRINCIPAL OBLIGATOIRE
      const phoneValidation = validateAndCleanPhone(
        participantData.phone,
        user.phone, 
        'principal'
      );
      
      if (!phoneValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Numéro de téléphone obligatoire',
          errorCode: 'PHONE_REQUIRED',
          details: {
            message: phoneValidation.error,
            format: 'Utilisez un format international (ex: +221771234567, +33123456789)',
            providedPhone: participantData.phone || 'Non fourni',
            userPhone: user.phone || 'Non renseigné dans le profil'
          }
        });
      }
      
      console.log(`✅ Téléphone principal validé: ${phoneValidation.phone.substring(0, 4)}****`);
      
      // ✅ VALIDATION CONTACT D'URGENCE OBLIGATOIRE
      const emergencyErrors = validateEmergencyContact(participantData.emergencyContact);
      
      if (emergencyErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Contact d\'urgence obligatoire',
          errorCode: 'EMERGENCY_CONTACT_REQUIRED',
          details: {
            errors: emergencyErrors,
            importance: 'Le contact d\'urgence est obligatoire pour votre sécurité pendant l\'excursion. En cas d\'urgence médicale, nous devons pouvoir contacter un proche immédiatement.'
          }
        });
      }
      
      // ✅ VALIDATION DU TÉLÉPHONE D'URGENCE
      const emergencyPhoneValidation = validateAndCleanPhone(
        participantData.emergencyContact.phone,
        null,
        'd\'urgence'
      );
      
      if (!emergencyPhoneValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Téléphone du contact d\'urgence invalide',
          errorCode: 'EMERGENCY_PHONE_INVALID',
          details: {
            error: emergencyPhoneValidation.error,
            format: 'Utilisez un format international (ex: +221771234567, +33123456789)'
          }
        });
      }
      
      console.log('✅ Toutes les validations passées (téléphone + contact d\'urgence)');
      
      // ✅ PRÉPARATION DES DONNÉES NETTOYÉES
      const cleanParticipantData = {
        userId: participantData.userId,
        username: participantData.username || user.username,
        fullName: participantData.fullName || user.fullName || user.username,
        email: participantData.email || user.email,
        phone: phoneValidation.phone, // ✅ TÉLÉPHONE PRINCIPAL VALIDÉ
        numberOfPersons: participantData.numberOfPersons,
        paymentStatus: 'pending',
        notificationsEnabled: participantData.notificationsEnabled !== false,
        
        // ✅ CONTACT D'URGENCE OBLIGATOIRE NETTOYÉ
        emergencyContact: {
          name: participantData.emergencyContact.name.trim(),
          phone: emergencyPhoneValidation.phone,
          relation: participantData.emergencyContact.relation.trim().toLowerCase()
        }
      };
      
      // ✅ DEMANDES SPÉCIALES (optionnel)
      if (participantData.specialRequests && participantData.specialRequests.trim()) {
        cleanParticipantData.specialRequests = participantData.specialRequests.trim();
      }
      
      console.log('📝 Données participant finales:', {
        ...cleanParticipantData,
        phone: cleanParticipantData.phone.substring(0, 4) + '****',
        emergencyContact: {
          name: cleanParticipantData.emergencyContact.name,
          phone: cleanParticipantData.emergencyContact.phone.substring(0, 4) + '****',
          relation: cleanParticipantData.emergencyContact.relation
        }
      });
      
      // ✅ AJOUTER LE PARTICIPANT AVEC LA MÉTHODE DU MODÈLE
      let participant;
      try {
        participant = excursion.addParticipant(cleanParticipantData);
        console.log('✅ Participant ajouté au modèle');
      } catch (modelError) {
        console.error('❌ Erreur méthode addParticipant:', modelError);
        return res.status(400).json({
          success: false,
          message: modelError.message || 'Erreur lors de l\'ajout du participant'
        });
      }
      
      // ✅ AUDIT LOG AVEC CONTACT D'URGENCE
      if (!excursion.auditLog) {
        excursion.auditLog = [];
      }
      
      excursion.auditLog.push({
        action: 'participant_added',
        userId: req.user ? req.user.id : participantData.userId,
        username: req.user ? req.user.username : cleanParticipantData.username,
        date: new Date(),
        details: `Participant ajouté: ${cleanParticipantData.username} (${cleanParticipantData.numberOfPersons} personne(s)) - Contact d'urgence: ${cleanParticipantData.emergencyContact.name} (${cleanParticipantData.emergencyContact.relation})`
      });
      
      if (excursion.auditLog.length > 15) {
        excursion.auditLog = excursion.auditLog.slice(-15);
      }
      
      // ✅ SAUVEGARDER
      try {
        await excursion.save();
        console.log('✅ Excursion sauvegardée avec succès');
      } catch (saveError) {
        console.error('❌ Erreur sauvegarde excursion:', saveError);
        
        // Gestion spécifique des erreurs de validation
        if (saveError.name === 'ValidationError') {
          const errorMessages = [];
          
          Object.keys(saveError.errors).forEach(key => {
            if (key.includes('phone')) {
              errorMessages.push('Format de téléphone invalide');
            } else if (key.includes('emergencyContact')) {
              errorMessages.push('Contact d\'urgence invalide');
            } else {
              errorMessages.push(saveError.errors[key].message);
            }
          });
          
          return res.status(400).json({
            success: false,
            message: 'Erreur de validation',
            errorCode: 'VALIDATION_FAILED',
            details: errorMessages
          });
        }
        
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la sauvegarde',
          error: saveError.message
        });
      }
      
      console.log('🎉 Participant ajouté avec succès avec contact d\'urgence');
      
      // ✅ RÉPONSE SUCCÈS AVEC CONTACT D'URGENCE
      res.status(201).json({
        success: true,
        message: 'Inscription réussie ! Votre contact d\'urgence a été enregistré pour votre sécurité.',
        data: {
          participant: {
            _id: participant._id,
            username: participant.username,
            fullName: participant.fullName,
            phone: participant.phone.substring(0, 4) + '****',
            numberOfPersons: participant.numberOfPersons,
            totalAmount: participant.totalAmount,
            depositAmount: participant.depositAmount,
            remainingAmount: participant.remainingAmount,
            paymentStatus: participant.paymentStatus,
            registrationDate: participant.registrationDate,
            emergencyContact: {
              name: participant.emergencyContact.name,
              relation: participant.emergencyContact.relation,
              hasPhone: true // Ne pas exposer le numéro complet
            }
          },
          excursion: {
            _id: excursion._id,
            title: excursion.title,
            currentParticipants: excursion.currentParticipants,
            availableSpots: excursion.availableSpots,
            isFullyBooked: excursion.isFullyBooked
          },
          securityInfo: {
            emergencyContactRegistered: true,
            importance: 'En cas d\'urgence pendant l\'excursion, nous contacterons immédiatement votre contact d\'urgence'
          }
        }
      });
      
    } catch (error) {
      console.error('❌ ERREUR CRITIQUE addParticipant:', error);
      console.error('📍 Stack:', error.stack);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Erreur de validation des données',
          errors: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Format d\'ID invalide',
          field: error.path
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur lors de l\'inscription',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur s\'est produite'
      });
    }
  },

  // ===== 8. OBTENIR LES PARTICIPANTS =====
  getParticipants: async (req, res) => {
    try {
      const { excursionId } = req.params;
      console.log(`👥 Récupération des participants pour l'excursion: ${excursionId}`);
      
      const excursion = await Excursion.findById(excursionId)
        .populate('participants.userId', 'username email profile')
        .select('title date participants stats');
      
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      console.log(`✅ ${excursion.participants.length} participants trouvés`);
      
      res.status(200).json({
        success: true,
        data: {
          excursion: {
            _id: excursion._id,
            title: excursion.title,
            date: excursion.date
          },
          participants: excursion.participants,
          stats: {
            totalParticipants: excursion.participants.reduce((sum, p) => sum + p.numberOfPersons, 0),
            totalRegistrations: excursion.participants.length,
            pendingPayments: excursion.participants.filter(p => p.paymentStatus === 'pending').length,
            fullyPaid: excursion.participants.filter(p => p.paymentStatus === 'fully_paid').length,
            totalRevenue: excursion.stats.totalRevenue
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération participants:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des participants',
        error: error.message
      });
    }
  },

  // ===== 9. ENREGISTRER UN PAIEMENT =====
  recordPayment: async (req, res) => {
    try {
      const { excursionId, participantId } = req.params;
      const paymentData = req.body;
      
      console.log(`💰 Enregistrement d'un paiement pour l'excursion: ${excursionId}, participant: ${participantId}`);
      console.log('💳 Données paiement:', paymentData);
      
      const excursion = await Excursion.findById(excursionId);
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      const participant = excursion.participants.id(participantId);
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'Participant non trouvé'
        });
      }
      
      // Enregistrer le paiement
      const payment = excursion.recordPayment(participant.userId, paymentData);
      
      // Audit log
      addAuditLog(
        excursion,
        'payment_received',
        req.user.id,
        req.user.username,
        `Paiement reçu: ${paymentData.amount} FCFA de ${participant.username}`
      );
      
      await excursion.save();
      
      console.log('✅ Paiement enregistré avec succès');
      
      res.status(201).json({
        success: true,
        message: 'Paiement enregistré avec succès',
        data: {
          payment,
          participant: {
            _id: participant._id,
            paymentStatus: participant.paymentStatus,
            totalPaid: participant.paymentHistory
              .filter(p => p.status === 'success')
              .reduce((sum, p) => sum + p.amount, 0)
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur enregistrement paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement du paiement',
        error: error.message
      });
    }
  },

  // ===== 10. OBTENIR LES EXCURSIONS D'UN UTILISATEUR =====
  getUserExcursions: async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, upcoming = 'false' } = req.query;
      
      console.log(`👤 Récupération des excursions de l'utilisateur: ${userId}`);
      
      const options = {
        status: status !== 'all' ? status : undefined,
        upcoming: upcoming === 'true'
      };
      
      const excursions = await Excursion.findByUser(userId, options);
      
      console.log(`✅ ${excursions.length} excursions trouvées pour cet utilisateur`);
      
      res.status(200).json({
        success: true,
        data: excursions
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération excursions utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des excursions de l\'utilisateur',
        error: error.message
      });
    }
  },

  // ===== 11. OBTENIR LE STATUT D'UN UTILISATEUR =====
  getUserExcursionStatus: async (req, res) => {
    try {
      const { excursionId, userId } = req.params;
      
      console.log(`🔍 Vérification du statut utilisateur ${userId} pour l'excursion ${excursionId}`);
      
      const excursion = await Excursion.findById(excursionId);
      if (!excursion) {
        return res.status(404).json({
          success: false,
          message: 'Excursion non trouvée'
        });
      }
      
      const participant = excursion.participants.find(p => 
        p.userId.toString() === userId.toString()
      );
      
      if (!participant) {
        return res.status(200).json({
          success: true,
          data: {
            isRegistered: false,
            status: null
          }
        });
      }
      
      const totalPaid = participant.paymentHistory
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + p.amount, 0);
      
      res.status(200).json({
        success: true,
        data: {
          isRegistered: true,
          status: participant.paymentStatus,
          participant: {
            _id: participant._id,
            numberOfPersons: participant.numberOfPersons,
            totalAmount: participant.totalAmount,
            depositAmount: participant.depositAmount,
            remainingAmount: participant.remainingAmount,
            totalPaid,
            registrationDate: participant.registrationDate,
            isConfirmed: participant.isConfirmed,
            hasEmergencyContact: !!(participant.emergencyContact && participant.emergencyContact.name)
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur vérification statut utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification du statut',
        error: error.message
      });
    }
  },

  // ===== 12. STATISTIQUES DASHBOARD =====
  getDashboardStats: async (req, res) => {
    try {
      console.log('📊 Récupération des statistiques dashboard');
      
      const stats = await Excursion.getDashboardStats();
      const result = stats[0];
      
      const dashboardData = {
        totalExcursions: result.total[0]?.count || 0,
        upcomingExcursions: result.upcoming[0]?.count || 0,
        totalRevenue: result.revenue[0]?.total || 0,
        totalParticipants: result.participants[0]?.total || 0
      };
      
      // Statistiques supplémentaires
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const [monthlyStats, statusStats] = await Promise.all([
        Excursion.aggregate([
          {
            $match: {
              createdAt: { $gte: thisMonth }
            }
          },
          {
            $group: {
              _id: null,
              newExcursions: { $sum: 1 },
              newRevenue: { $sum: "$stats.totalRevenue" }
            }
          }
        ]),
        Excursion.aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ])
      ]);
      
      dashboardData.monthlyStats = {
        newExcursions: monthlyStats[0]?.newExcursions || 0,
        newRevenue: monthlyStats[0]?.newRevenue || 0
      };
      
      dashboardData.statusBreakdown = statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});
      
      console.log('✅ Statistiques récupérées');
      
      res.status(200).json({
        success: true,
        stats: dashboardData
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
};

// ======= MIDDLEWARE UPLOAD =======
excursionController.uploadMiddleware = upload.array('images', 5);

module.exports = excursionController;
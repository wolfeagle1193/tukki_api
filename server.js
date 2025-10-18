// server.js - VERSION MISE À JOUR AVEC NOUVEAUX HÔTELS, EXCURSIONS, ÉVÉNEMENTS ET TIMEOUTS ÉTENDUS
const express = require("express");
const app = express();
const port = process.env.PORT || 5002;
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const errorHandler = require("./middlewares/errorHandling");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const treasureRoutes = require("./routes/treasure");
const regionRoutes = require("./routes/region");
const treasureDetailsRoutes = require('./routes/treasureDetailsRoutes');
const regionServicesRoutes= require('./routes/regionServicesRoutes')
const excursionRoutes = require('./routes/excursionRoutes');
const regionDetailsRoutes = require('./routes/regionDetails');
const servicesRoutes = require('./routes/servicesRoutes');
const popularPlacesRoutes = require('./routes/PopularPlaces');
// ✅ NOUVELLE ROUTE HÔTELS DÉTAILLÉS
const hotelRoutes = require('./routes/hotelRoutes');
const roomRoutes = require('./routes/roomRoutes');
// ✅ NOUVELLE ROUTE ÉVÉNEMENTS
const eventRoutes = require('./routes/eventRoutes');

const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs").promises;
const { existsSync } = require('fs');
const sharp = require("sharp");
const { verifyToken } = require("./middlewares/jwt_token");

dotenv.config();

// ======= INITIALISATION DES DOSSIERS (MISE À JOUR) =======
const setupDirectories = async () => {
  const directories = [
    path.join(__dirname, 'temp'),
    path.join(__dirname, 'uploads', 'temp'), // ✅ NOUVEAU DOSSIER POUR UPLOAD TEMP
    path.join(__dirname, 'assets'),
    path.join(__dirname, 'assets', 'images'),
    path.join(__dirname, 'assets', 'images', 'profiles'),
    path.join(__dirname, 'assets', 'images', 'community'),
    path.join(__dirname, 'assets', 'images', 'excursions'),
    path.join(__dirname, 'assets', 'images', 'galleries_region'),
    path.join(__dirname, 'assets', 'images', 'popular_places'),
    // ✅ NOUVEAUX DOSSIERS POUR LES HÔTELS DÉTAILLÉS
    path.join(__dirname, 'assets', 'images', 'hotels'),
    path.join(__dirname, 'assets', 'images', 'places'),
    // ✅ NOUVEAU DOSSIER POUR LES ÉVÉNEMENTS
    path.join(__dirname, 'assets', 'images', 'events')
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Directory created or exists: ${dir}`);
    } catch (error) {
      console.error(`❌ Error creating directory ${dir}:`, error);
    }
  }
};

setupDirectories();

// ======= CONFIGURATION DE L'APPLICATION =======
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ CONFIGURATION DES CHEMINS STATIQUES MISE À JOUR
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/BACKEND_TUKKI/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'assets/images')));
app.use('/profiles', express.static(path.join(__dirname, 'assets/images/profiles')));
app.use('/excursions', express.static(path.join(__dirname, 'assets/images/excursions')));
app.use('/galleries_region', express.static(path.join(__dirname, 'assets/images/galleries_region')));
app.use('/popular_places', express.static(path.join(__dirname, 'assets/images/popular_places')));
// ✅ NOUVEAUX CHEMINS STATIQUES POUR LES HÔTELS
app.use('/hotels', express.static(path.join(__dirname, 'assets/images/hotels')));
app.use('/places', express.static(path.join(__dirname, 'assets/images/places')));
// ✅ NOUVEAU CHEMIN STATIQUE POUR LES ÉVÉNEMENTS
app.use('/events', express.static(path.join(__dirname, 'assets/images/events')));

// ======= CONFIGURATION MULTER (EXISTANTE + AMÉLIORÉE) =======
const multerDestination = (req, file, cb) => {
  const dir = path.join(__dirname, 'temp');
  if (!existsSync(dir)) {
    try {
      require('fs').mkdirSync(dir, { recursive: true });
      console.log(`✅ Created temp directory: ${dir}`);
    } catch (err) {
      console.error(`❌ Error creating temp directory: ${err.message}`);
    }
  }
  cb(null, dir);
};

const multerFilename = (req, file, cb) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname) || '.jpg';
  cb(null, 'upload-' + uniqueSuffix + ext);
};

const fileFilter = (req, file, cb) => {
  console.log("📋 Received file:", file.originalname, file.mimetype);
  
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    console.error(`❌ File type not allowed: ${file.mimetype}`);
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

const storage = multer.diskStorage({
  destination: multerDestination,
  filename: multerFilename
});

// ✅ CONFIGURATION MULTER AMÉLIORÉE AVEC LIMITES ÉTENDUES
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB par fichier
    files: 15, // ✅ AUGMENTÉ: 15 fichiers pour les hôtels et événements
    fieldSize: 2 * 1024 * 1024, // 2MB pour les champs texte
    parts: 50 // Limite les parties de requête
  }
});

// ✅ MIDDLEWARE TIMEOUTS ÉTENDUS (AMÉLIORÉ)
app.use((req, res, next) => {
  if ((req.path.includes('/createOrUpdate') || req.path.includes('/create-or-update')) && req.method === 'POST') {
    console.log('🔧 Configuration timeouts étendus pour:', req.path);
    
    // Socket timeout (le plus important)
    if (req.socket) {
      req.socket.setTimeout(15 * 60 * 1000); // 15 minutes
    }
    
    // Request timeout avec callback
    req.setTimeout(15 * 60 * 1000, () => {
      console.error('❌ REQUEST TIMEOUT (15min) pour:', req.path);
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Timeout de requête (15min)',
          error: 'REQUEST_TIMEOUT'
        });
      }
    });
    
    // Response timeout avec callback
    res.setTimeout(15 * 60 * 1000, () => {
      console.error('❌ RESPONSE TIMEOUT (15min) pour:', req.path);
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Timeout de réponse (15min)', 
          error: 'RESPONSE_TIMEOUT'
        });
      }
    });
  }
  next();
});

// ======= MIDDLEWARE DE JOURNALISATION (MISE À JOUR) =======
app.use((req, res, next) => {
  // Logging spécialisé pour les différents types de requêtes
  if (req.path.includes('.webp') || req.path.includes('.jpg') || req.path.includes('.png') || req.path.includes('.jpeg')) {
    console.log(`📷 Image request: ${req.method} ${req.path}`);
  } else if (req.path.includes('/excursions')) {
    console.log(`🎯 Excursion API: ${req.method} ${req.path}`);
  } else if (req.path.includes('/treasureDetails')) {
    console.log(`🏝️ Treasure Details API: ${req.method} ${req.path}`);
  } else if (req.path.includes('/regionDetails')) {
    console.log(`🗺️ Region Details API: ${req.method} ${req.path}`);
  } else if (req.path.includes('/hotels') && !req.path.includes('/besthotels')) {
    // ✅ NOUVEAU LOGGING POUR NOUVEAUX HÔTELS
    console.log(`🏨 New Hotel API: ${req.method} ${req.path}`);
  } else if (req.path.includes('/events')) {
    // ✅ NOUVEAU LOGGING POUR ÉVÉNEMENTS
    console.log(`🎪 Event API: ${req.method} ${req.path}`);
  } else if (req.path.includes('/popular-places')) {
    console.log(`🏛️ Popular Places API: ${req.method} ${req.path}`);
  } else if (req.path.includes('/createOrUpdate') || req.path.includes('/create-or-update')) {
    console.log(`🚀 Upload API: ${req.method} ${req.path}`);
  }
  next();
});

// ======= ROUTES API (MISE À JOUR) =======
console.log('\n🚀 CONFIGURATION DES ROUTES API');

// Routes d'authentification
app.use("/api/", authRouter);
console.log('✅ Auth routes configured: /api/*');

// Routes utilisateurs
app.use("/api/users", userRouter);
console.log('✅ User routes configured: /api/users/*');

// Routes régions
app.use("/api/regions", regionRoutes);
console.log('✅ Region routes configured: /api/regions/*');

// ✅ NOUVELLES ROUTES HÔTELS DÉTAILLÉS (PRIORITAIRE)
app.use('/api/hotels', hotelRoutes);
console.log('✅ New Hotel routes configured: /api/hotels/*');

// ✅ NOUVELLES ROUTES ÉVÉNEMENTS
app.use('/api/events', eventRoutes);
console.log('✅ Event routes configured: /api/events/*');

// Routes excursions
app.use('/api/excursions', excursionRoutes);
console.log('✅ Excursion routes configured: /api/excursions/*');

// Routes services
app.use('/api/services', servicesRoutes);
console.log('✅ Services routes configured: /api/services/*');

// Routes des détails des trésors
app.use('/api/treasureDetails', treasureDetailsRoutes);
console.log('✅ Treasure details routes configured: /api/treasureDetails/*');

// Routes région details
app.use('/api/regionDetails', regionDetailsRoutes);
console.log('✅ Region details routes configured: /api/regionDetails/*');

// Routes services région
app.use('/api/region-services', regionServicesRoutes);
console.log('✅ ServicesRegion routes configured: /api/region-services/*');
app.use('/api/rooms', roomRoutes);

// Routes lieux populaires
app.use('/api/popular-places', popularPlacesRoutes);
console.log('✅ Places Populaires routes configured: /api/popular-places/*');

// Routes trésors (avec middleware de transformation d'images)
app.use("/api/treasures", (req, res, next) => {
  if (req.path === '/getTreasure') {
    const originalSend = res.send;
    
    res.send = function(data) {
      let parsedData;
      
      try {
        if (typeof data === 'string') {
          parsedData = JSON.parse(data);
        } else {
          parsedData = data;
        }
        
        if (parsedData.success && Array.isArray(parsedData.treasures)) {
          parsedData.treasures = parsedData.treasures.map(item => {
            if (item.placeImage && !item.placeImage.startsWith('/')) {
              item.placeImage = '/' + item.placeImage;
            }
            if (item.placeImage && item.placeImage.startsWith('/BACKEND_TUKKI/')) {
              item.placeImage = item.placeImage.replace('/BACKEND_TUKKI', '');
            }
            return item;
          });
          return originalSend.call(this, JSON.stringify(parsedData));
        }
      } catch (e) {
        console.error('Erreur lors du traitement des chemins d\'images:', e);
      }
      return originalSend.call(this, data);
    };
  }
  
  next();
}, treasureRoutes);
console.log('✅ Treasure routes configured: /api/treasures/*');

// ======= ROUTE D'UPLOAD D'IMAGE DE PROFIL (EXISTANTE) =======
app.post("/api/upload", verifyToken, upload.single('profileImage'), async (req, res) => {
  console.log("\n==== DÉBUT UPLOAD IMAGE PROFIL ====");
  console.log("🔑 User ID:", req.user?.id);
  
  if (!req.file) {
    console.error("❌ Aucun fichier n'a été reçu");
    return res.status(400).json({ 
      success: false, 
      message: "Aucune image n'a été fournie." 
    });
  }

  try {
    const tempFilePath = req.file.path;
    const profilesDir = path.join(__dirname, 'assets', 'images', 'profiles');
    await fs.mkdir(profilesDir, { recursive: true });

    const userId = req.user.id;
    const timestamp = Date.now();
    const filename = `profile-${userId}-${timestamp}.webp`;
    const outputPath = path.join(profilesDir, filename);

    const imageBuffer = await fs.readFile(tempFilePath);
    
    await sharp(imageBuffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(outputPath);

    try {
      await fs.unlink(tempFilePath);
    } catch (unlinkError) {
      console.warn("⚠️ Impossible de supprimer le fichier temporaire");
    }

    const imageUrl = `/assets/images/profiles/${filename}`;
    console.log("🔗 URL de l'image profil:", imageUrl);
    console.log("==== FIN UPLOAD IMAGE PROFIL ====\n");

    return res.status(200).json({
      success: true,
      message: "Image uploadée avec succès",
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error("❌ Erreur lors de l'upload de l'image profil:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur s'est produite lors de l'upload de l'image",
      error: error.message
    });
  }
});

// ======= ROUTES DE TEST (MISE À JOUR) =======

// ✅ NOUVELLE ROUTE DE TEST POUR LES HÔTELS DÉTAILLÉS
app.get('/test-hotels', async (req, res) => {
  try {
    const HotelDetails = require('./models/Hotel');
    
    const stats = {
      totalHotels: await HotelDetails.countDocuments(),
      activeHotels: await HotelDetails.countDocuments({ isActive: true }),
      hotelsWithFullDetails: await HotelDetails.countDocuments({ 
        hasFullDetails: true,
        isActive: true 
      }),
      hotelsByRegion: await HotelDetails.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$region_Name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    };
    
    res.json({
      success: true,
      message: 'Test nouveaux hôtels API',
      stats,
      endpoints: {
        // Utilisateur
        getAll: 'GET /api/hotels',
        getByRegion: 'GET /api/hotels/region/:regionName',
        getById: 'GET /api/hotels/:hotelId',
        search: 'GET /api/hotels/search',
        addReview: 'POST /api/hotels/:hotelId/review',
        toggleFavorite: 'POST /api/hotels/:hotelId/favorite',
        
        // Admin
        createUpdate: 'POST /api/hotels/admin/create-or-update',
        adminList: 'GET /api/hotels/admin/list',
        stats: 'GET /api/hotels/admin/stats',
        delete: 'DELETE /api/hotels/admin/:hotelId',
        restore: 'POST /api/hotels/admin/:hotelId/restore'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ NOUVELLE ROUTE DE TEST POUR LES ÉVÉNEMENTS
app.get('/test-events', async (req, res) => {
  try {
    const EventDetails = require('./models/EventDetails');
    
    const stats = {
      totalEvents: await EventDetails.countDocuments(),
      activeEvents: await EventDetails.countDocuments({ isActive: true }),
      upcomingEvents: await EventDetails.countDocuments({ 
        isActive: true,
        'eventDates.startDate': { $gt: new Date() }
      }),
      eventsWithFullDetails: await EventDetails.countDocuments({ 
        hasFullDetails: true,
        isActive: true 
      }),
      eventsByCategory: await EventDetails.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    };
    
    res.json({
      success: true,
      message: 'Test événements API',
      stats,
      endpoints: {
        // Utilisateur
        getAll: 'GET /api/events',
        getByRegion: 'GET /api/events/region/:regionName',
        getByCategory: 'GET /api/events/category/:category',
        getById: 'GET /api/events/:eventId',
        search: 'GET /api/events/search',
        featured: 'GET /api/events/featured',
        addReview: 'POST /api/events/:eventId/review',
        toggleFavorite: 'POST /api/events/:eventId/favorite',
        bookEvent: 'POST /api/events/:eventId/book',
        userBookings: 'GET /api/events/user/bookings',
        cancelBooking: 'DELETE /api/events/:eventId/bookings/:bookingId',
        
        // Admin
        createUpdate: 'POST /api/events/admin/create-or-update',
        adminList: 'GET /api/events/admin/list',
        adminBookings: 'GET /api/events/admin/bookings',
        stats: 'GET /api/events/admin/stats',
        delete: 'DELETE /api/events/admin/:eventId',
        restore: 'POST /api/events/admin/:eventId/restore',
        maintenance: 'GET /api/events/maintenance/*'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de test pour les excursions
app.get('/test-excursions', async (req, res) => {
  try {
    const Excursion = require('./models/Excursion');
    
    const stats = {
      totalExcursions: await Excursion.countDocuments(),
      publishedExcursions: await Excursion.countDocuments({ status: 'published' }),
      upcomingExcursions: await Excursion.countDocuments({ 
        date: { $gte: new Date() },
        status: 'published'
      })
    };
    
    res.json({
      success: true,
      message: 'Test excursions API',
      stats,
      endpoints: {
        create: 'POST /api/excursions',
        getAll: 'GET /api/excursions',
        getById: 'GET /api/excursions/:id',
        getByPlace: 'GET /api/excursions/place/:treasureId',
        dashboard: 'GET /api/excursions/admin/dashboard'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de test pour les services
app.get('/test-services', async (req, res) => {
  try {
    const TreasureDetails = require('./models/TreasureDetails');
    
    const totalTreasuresWithServices = await TreasureDetails.countDocuments({
      services: { $exists: true, $not: { $size: 0 } }
    });
    
    const totalTreasures = await TreasureDetails.countDocuments();
    
    const availableServices = [
      'Hébergement', 'Restauration', 'Transport', 'Guide touristique',
      'Loisirs', 'Administration', 'Accessibilité', 'Boutique souvenirs',
      'Santé', 'Banque'
    ];
    
    res.json({
      success: true,
      message: 'Test services API',
      stats: {
        totalTreasures,
        treasuresWithServices: totalTreasuresWithServices,
        availableServices: availableServices.length,
        coverage: totalTreasures > 0 
          ? Math.round((totalTreasuresWithServices / totalTreasures) * 100) 
          : 0
      },
      endpoints: {
        availableServices: 'GET /api/services/available',
        treasureServices: 'GET /api/services/treasure/:treasureId',
        stats: 'GET /api/services/stats',
        updateServices: 'PUT /api/services/treasure/:treasureId',
        addService: 'POST /api/services/treasure/:treasureId/add',
        removeService: 'DELETE /api/services/treasure/:treasureId/:serviceType'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route de test pour les timeouts
app.get('/test-timeouts', (req, res) => {
  res.json({
    success: true,
    message: 'Test configuration timeouts upload',
    config: {
      socketTimeout: '15min pour uploads',
      requestTimeout: '15min pour uploads', 
      serverTimeout: '35min global',
      multerLimits: {
        fileSize: '10MB',
        files: 15, // ✅ MIS À JOUR
        parts: 50,
        fieldSize: '2MB'
      }
    },
    paths: {
      uploadProfile: '/api/upload',
      regionDetails: '/api/regionDetails/createOrUpdate',
      treasureDetails: '/api/treasureDetails/*/createOrUpdate',
      hotels: '/api/hotels/admin/create-or-update', // ✅ NOUVEAU
      events: '/api/events/admin/create-or-update' // ✅ NOUVEAU
    },
    timestamp: new Date().toISOString()
  });
});
//confidentialite

// ===== ROUTE POLITIQUE DE CONFIDENTIALITÉ =====

app.get('/privacy-policy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Politique de Confidentialité - Tukki</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .date { color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <h1>📋 Politique de Confidentialité - Tukki</h1>
      <p class="date">Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}</p>

      <h2>1. Introduction</h2>
      <p>Bienvenue sur Tukki. Nous respectons votre vie privée et nous engageons à protéger vos données personnelles.</p>

      <h2>2. Données Collectées</h2>
      <p>Tukki collecte les données suivantes :</p>
      <ul>
        <li><strong>Authentification :</strong> Email, mot de passe (hashé), ID utilisateur</li>
        <li><strong>Profil :</strong> Nom, photo de profil, numéro de téléphone (optionnel), adresse (optionnelle)</li>
        <li><strong>Localisation :</strong> Position GPS pour créer et afficher les trésors</li>
        <li><strong>Contenu :</strong> Photos de trésors, galeries, commentaires, likes</li>
        <li><strong>Analytique :</strong> Utilisation de l'app (optionnel)</li>
      </ul>

      <h2>3. Utilisation des Données</h2>
      <p>Vos données sont utilisées pour :</p>
      <ul>
        <li>Vous permettre d'utiliser Tukki (création de compte, connexion)</li>
        <li>Afficher vos trésors et régions</li>
        <li>Traiter vos commentaires et interactions</li>
        <li>Améliorer l'expérience utilisateur</li>
        <li>Sécurité et prévention des fraudes</li>
      </ul>

      <h2>4. Partage des Données</h2>
      <p><strong>Vos données ne sont pas partagées avec des tiers.</strong></p>
      <p>Les données publiques (photos, commentaires) sont visibles par les autres utilisateurs de Tukki.</p>

      <h2>5. Sécurité</h2>
      <p>Vos données sont protégées par :</p>
      <ul>
        <li>Chiffrement HTTPS en transit</li>
        <li>Authentification par JWT tokens</li>
        <li>Stockage sécurisé sur serveurs Render et MongoDB</li>
        <li>Mots de passe hashés (jamais stockés en clair)</li>
      </ul>

      <h2>6. Vos Droits</h2>
      <p>Vous pouvez :</p>
      <ul>
        <li><strong>Accéder à vos données</strong> via votre profil</li>
        <li><strong>Modifier vos données</strong> dans les paramètres de l'app</li>
        <li><strong>Supprimer votre compte et toutes vos données</strong> via Paramètres > Supprimer mon compte</li>
      </ul>

      <h2>7. Suppression du Compte</h2>
      <p>Pour supprimer votre compte et toutes vos données :</p>
      <ol>
        <li>Ouvrez Tukki</li>
        <li>Allez dans Paramètres > Supprimer mon compte</li>
        <li>Confirmez la suppression</li>
      </ol>
      <p><strong>Attention :</strong> Cette action est irréversible. Toutes vos données seront supprimées.</p>

      <h2>8. Conservation des Données</h2>
      <p>Vos données sont conservées tant que votre compte existe. Une fois supprimé, toutes les données sont effacées.</p>

      <h2>9. Contact</h2>
      <p>Pour toute question sur cette politique ou vos données :</p>
      <p><strong>Email :</strong> wolfeagle1193@gmail.com </p>

      <h2>10. Modifications</h2>
      <p>Nous pouvons modifier cette politique à tout moment. Les modifications seront affichées sur cette page.</p>

      <hr>
      <p style="text-align: center; color: #666; font-size: 12px;">© 2025 Tukki. Tous droits réservés.</p>
    </body>
    </html>
  `);
});

// ===== OU AJOUTE AUSSI CETTE ROUTE =====

app.get('/api/privacy-policy', (req, res) => {
  res.json({
    title: "Politique de Confidentialité - Tukki",
    lastUpdated: new Date(),
    content: "Voir https://tukki-api.onrender.com/privacy-policy"
  });
});





// Route de test image existante
app.get('/test-image/:filename', (req, res) => {
  const { filename } = req.params;
  const imagePath = path.join(__dirname, 'assets', 'images', 'profiles', filename);
  
  console.log(`🧪 Test image request: ${filename}`);
  console.log(`📁 Chemin physique: ${imagePath}`);
  console.log(`📁 Existe: ${require('fs').existsSync(imagePath)}`);
  
  if (require('fs').existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({
      error: 'Image not found',
      requestedPath: imagePath,
      exists: false
    });
  }
});

// Route de diagnostic mise à jour
app.get('/debug-images', (req, res) => {
  const directories = [
    { name: 'profiles', path: path.join(__dirname, 'assets', 'images', 'profiles') },
    { name: 'community', path: path.join(__dirname, 'assets', 'images', 'community') },
    { name: 'excursions', path: path.join(__dirname, 'assets', 'images', 'excursions') },
    { name: 'galleries_region', path: path.join(__dirname, 'assets', 'images', 'galleries_region') },
    { name: 'popular_places', path: path.join(__dirname, 'assets', 'images', 'popular_places') },
    // ✅ NOUVEAUX DOSSIERS POUR DIAGNOSTIC
    { name: 'hotels', path: path.join(__dirname, 'assets', 'images', 'hotels') },
    { name: 'places', path: path.join(__dirname, 'assets', 'images', 'places') },
    { name: 'events', path: path.join(__dirname, 'assets', 'images', 'events') } // ✅ NOUVEAU
  ];
  
  try {
    const result = {};
    
    directories.forEach(dir => {
      try {
        const files = require('fs').readdirSync(dir.path);
        result[dir.name] = {
          path: dir.path,
          filesCount: files.length,
          files: files.slice(0, 5), // Premiers 5 fichiers
          sampleUrls: files.slice(0, 2).map(file => 
            `${req.protocol}://${req.get('host')}/assets/images/${dir.name}/${file}`
          )
        };
      } catch (error) {
        result[dir.name] = {
          path: dir.path,
          error: error.message
        };
      }
    });
    
    res.json({
      success: true,
      directories: result,
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ ROUTE DE SANTÉ GLOBALE AMÉLIORÉE
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Tukki - Backend opérationnel",
    version: "2.3.0", // ✅ Version mise à jour
    features: [
      "✅ Authentification JWT",
      "✅ Gestion des trésors",
      "✅ Détails des trésors",
      "✅ Gestion des régions",
      "✅ Détails des régions avec images",
      "✅ Lieux populaires avec avis", 
      "✅ Upload d'images optimisé",
      "✅ Excursions complètes",
      "✅ Paiements et participants",
      "✅ Hôtels détaillés avec admin", // ✅ NOUVEAU
      "✅ Événements complets avec réservations", // ✅ NOUVEAU
      "✅ Timeouts étendus (15min)"
    ],
    endpoints: {
      auth: "/api/login, /api/register",
      treasures: "/api/treasures/*",
      treasureDetails: "/api/treasureDetails/*",
      regions: "/api/regions/*",
      regionDetails: "/api/regionDetails/*",
      users: "/api/users/*",
      excursions: "/api/excursions/*",
      popularPlaces: "/api/popular-places/*",
      hotels: "/api/hotels/*", // Routes hôtels modernes
      events: "/api/events/*", // ✅ NOUVEAU: Routes événements
      upload: "/api/upload",
      health: "/test-hotels, /test-events, /test-excursions, /test-timeouts" // ✅ MIS À JOUR
    },
    timestamp: new Date().toISOString()
  });
});

// Route de test des uploads mise à jour
app.get('/api/test/uploads', (req, res) => {
  const testPaths = [
    path.join(__dirname, 'temp'),
    path.join(__dirname, 'uploads', 'temp'), // ✅ NOUVEAU
    path.join(__dirname, 'assets'),
    path.join(__dirname, 'assets', 'images'),
    path.join(__dirname, 'assets', 'images', 'community'),
    path.join(__dirname, 'assets', 'images', 'profiles'),
    path.join(__dirname, 'assets', 'images', 'excursions'),
    path.join(__dirname, 'assets', 'images', 'galleries_region'),
    path.join(__dirname, 'assets', 'images', 'popular_places'),
    // ✅ NOUVEAUX CHEMINS POUR TEST
    path.join(__dirname, 'assets', 'images', 'hotels'),
    path.join(__dirname, 'assets', 'images', 'places'),
    path.join(__dirname, 'assets', 'images', 'events') // ✅ NOUVEAU
  ];
  
  const status = testPaths.map(testPath => ({
    path: testPath,
    exists: existsSync(testPath),
    permissions: (() => {
      try {
        require('fs').accessSync(testPath, require('fs').constants.W_OK);
        return 'writable';
      } catch (error) {
        return 'not writable';
      }
    })()
  }));
  
  res.json({
    success: true,
    message: 'Test des dossiers d\'upload',
    directories: status,
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd()
    }
  });
});

// Route de test upload
app.post("/test-upload", upload.single('testImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    console.log("Test upload received:", req.file.path);
    res.json({ success: true, file: req.file });
  } catch (error) {
    console.error("Test upload error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ======= MIDDLEWARE DE GESTION D'ERREURS (MISE À JOUR) =======
app.use((err, req, res, next) => {
  // ✅ GESTION SPÉCIFIQUE POUR LES NOUVEAUX HÔTELS
  if (req.path.includes('/api/hotels') && !req.path.includes('/besthotels')) {
    console.error("❌ Erreur dans les routes nouveaux hôtels:", err);
  }
  
  // ✅ GESTION SPÉCIFIQUE POUR LES ÉVÉNEMENTS
  if (req.path.includes('/api/events')) {
    console.error("❌ Erreur dans les routes événements:", err);
  }
  
  if (req.path.includes('/excursions')) {
    console.error("❌ Erreur dans les routes excursions:", err);
  }
  
  if (req.path.includes('/regionDetails')) {
    console.error("❌ Erreur dans les routes régions details:", err);
  }
  
  if (err.code === 'TIMEOUT' || err.message.includes('timeout')) {
    console.error("❌ Erreur timeout:", err);
    return res.status(408).json({
      success: false,
      message: 'Timeout - opération trop longue',
      error: 'TIMEOUT'
    });
  }
  
  if (err instanceof multer.MulterError) {
    console.error("❌ Erreur Multer:", err);
    let message = "Erreur lors de l'upload du fichier";
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = "Le fichier est trop volumineux (max: 10MB)";
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = "Type de fichier non attendu";
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = "Trop de fichiers (max: 15)"; // ✅ MIS À JOUR
    } else if (err.code === 'LIMIT_PART_COUNT') {
      message = "Trop de parties dans la requête (max: 50)";
    } else if (err.code === 'LIMIT_FIELD_VALUE') {
      message = "Champ trop volumineux (max: 2MB)";
    }
    
    return res.status(400).json({
      success: false,
      message: message,
      error: err.code
    });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux (max: 10MB)'
    });
  }
  
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: 'Type de fichier non autorisé'
    });
  }
  
  if (err) {
    console.error("❌ Erreur serveur:", err);
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: err.message
    });
  }
  
  next();
});

// ======= MIDDLEWARE TIMEOUTS CRITIQUES POUR RÉGION DETAILS =======
app.use((req, res, next) => {
  // Configuration spéciale pour les uploads de région
  if (req.path.includes('/regionDetails') && req.method === 'POST') {
    console.log('🔧 === TIMEOUTS CRITIQUES RÉGION DETAILS ===');
    
    // 1. Socket timeout (LE PLUS IMPORTANT)
    if (req.socket) {
      req.socket.setTimeout(25 * 60 * 1000); // 25 MINUTES
      console.log('⏰ Socket timeout: 25 minutes');
    }
    
    // 2. Request timeout
    req.setTimeout(25 * 60 * 1000, () => {
      console.error('❌ REQUEST TIMEOUT (25min)');
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Upload trop long (25min)',
          error: 'REQUEST_TIMEOUT'
        });
      }
    });
    
    // 3. Response timeout  
    res.setTimeout(25 * 60 * 1000, () => {
      console.error('❌ RESPONSE TIMEOUT (25min)');
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Réponse trop longue (25min)', 
          error: 'RESPONSE_TIMEOUT'
        });
      }
    });
    
    console.log('✅ Timeouts critiques configurés pour:', req.path);
  }
  
  next();
});

app.use(errorHandler);

// ======= DÉMARRAGE DU SERVEUR (MISE À JOUR AVEC TIMEOUTS) =======
mongoose
  .connect(process.env.MongoDB_URI)
  .then(() => {
    console.log("✅ Tukki_DB Connected");
    
    const server = app.listen(process.env.PORT || port, '0.0.0.0', () => {
      const serverPort = process.env.PORT || port;
      
      // ✅ CONFIGURATION DES TIMEOUTS SERVEUR ÉTENDUS
      // 🚨 CONFIGURATION SERVEUR CRITIQUE
      server.headersTimeout = 30 * 60 * 1000;    // 30 MINUTES
      server.requestTimeout = 25 * 60 * 1000;    // 25 MINUTES  
      server.timeout = 35 * 60 * 1000;           // 35 MINUTES
      server.keepAliveTimeout = 10000;            // 10 SECONDES
      
      console.log('🚨 =====================================');
      console.log('🚨 TIMEOUTS SERVEUR CRITIQUES:');
      console.log('🚨 - Headers: 30min');
      console.log('🚨 - Request: 25min'); 
      console.log('🚨 - Global: 35min');
      console.log('🚨 - KeepAlive: 10s');
      console.log('🚨 =====================================');
      
      console.log(`\n📋 ENDPOINTS DISPONIBLES:`);
      console.log(`🔐 Auth: http://localhost:${serverPort}/api/login`);
      console.log(`👤 Users: http://localhost:${serverPort}/api/users/*`);
      console.log(`🏝️ Treasures: http://localhost:${serverPort}/api/treasures/*`);
      console.log(`📋 Treasure Details: http://localhost:${serverPort}/api/treasureDetails/*`);
      console.log(`🗺️ Region Details: http://localhost:${serverPort}/api/regionDetails/*`);
      console.log(`🗺️ Regions: http://localhost:${serverPort}/api/regions/*`);
      console.log(`🗺️ RegionServices: http://localhost:${serverPort}/api/region-services/*`);
      console.log(`🏛️ Popular Places: http://localhost:${serverPort}/api/popular-places/*`);
      console.log(`🏨 Hotels: http://localhost:${serverPort}/api/hotels/*`);
      console.log(`🎪 Events: http://localhost:${serverPort}/api/events/*`);
      console.log(`🎯 Excursions: http://localhost:${serverPort}/api/excursions/*`);
      console.log(`📊 Dashboard: http://localhost:${serverPort}/api/excursions/admin/dashboard`);
      console.log(`⚙️ Services: http://localhost:${serverPort}/api/services/*`);
      
      console.log(`\n📷 UPLOADS:`);
      console.log(`👤 Profile: http://localhost:${serverPort}/api/upload`);
      console.log(`📸 Community: http://localhost:${serverPort}/api/treasureDetails/TREASURE_ID/addPhoto`);
      console.log(`🎯 Excursions: http://localhost:${serverPort}/api/excursions (avec images)`);
      console.log(`🗺️ Region Details: http://localhost:${serverPort}/api/regionDetails/createOrUpdate`);
      console.log(`🏛️ Popular Places: http://localhost:${serverPort}/api/popular-places/admin/create-or-update`);
      // ✅ NOUVEAUX ENDPOINTS UPLOAD
      console.log(`🏨 Hotels: http://localhost:${serverPort}/api/hotels/admin/create-or-update`);
      console.log(`🎪 Events: http://localhost:${serverPort}/api/events/admin/create-or-update`);
      
      console.log(`\n🧪 TESTS:`);
      console.log(`🔍 Directories: http://localhost:${serverPort}/api/test/uploads`);
      console.log(`🎯 Excursions: http://localhost:${serverPort}/test-excursions`);
      console.log(`⚙️ Services: http://localhost:${serverPort}/test-services`);
      console.log(`⏰ Timeouts: http://localhost:${serverPort}/test-timeouts`);
      console.log(`📷 Images: http://localhost:${serverPort}/debug-images`);
      // ✅ NOUVEAUX TESTS
      console.log(`🏨 Hotels: http://localhost:${serverPort}/test-hotels`);
      console.log(`🎪 Events: http://localhost:${serverPort}/test-events`);

      console.log(`\n✅ =====================================`);
      console.log(`✅ API COMPLÈTE INTÉGRÉE AVEC SUCCÈS !`);
      console.log(`✅ - Hôtels modernes avec admin 🏨`);
      console.log(`✅ - Événements avec réservations 🎪`); // ✅ NOUVEAU
      console.log(`✅ - Lieux populaires avec avis 🏛️`);
      console.log(`✅ - Excursions avec paiements 🎯`);
      console.log(`✅ - Services dynamiques ⚙️`);
      console.log(`✅ - Région Details avec images 🗺️`);
      console.log(`✅ - Timeouts étendus (15-25min) ⏰`);
      console.log(`✅ - Upload optimisé (15 fichiers) 📷`);
      console.log(`✅ =====================================\n`);

      // ✅ RÉSUMÉ DES NOUVELLES FONCTIONNALITÉS ÉVÉNEMENTS
      console.log(`\n🎪 === NOUVELLES FONCTIONNALITÉS ÉVÉNEMENTS ===`);
      console.log(`✅ Gestion complète des événements avec validation`);
      console.log(`✅ Upload d'images multiples (jusqu'à 12)`);
      console.log(`✅ Système de réservations avec paiements`);
      console.log(`✅ Gestion des capacités et disponibilité`);
      console.log(`✅ Avis et système de favoris`);
      console.log(`✅ Recherche et filtrage avancés`);
      console.log(`✅ Administration complète avec stats`);
      console.log(`✅ Structure prix: fixe ou par catégories`);
      console.log(`✅ Dates d'événements avec validation`);
      console.log(`✅ Catégories: festival, culture, sport, etc.`);
      console.log(`✅ Maintenance et réparation des données`);
      console.log(`✅ Rapports de santé et statistiques`);
      console.log(`✅ Gestion des réservations administrateur`);
      console.log(`🎪 ==========================================\n`);

      // ✅ RÉSUMÉ DES NOUVELLES FONCTIONNALITÉS HÔTELS
      console.log(`\n🏨 === NOUVELLES FONCTIONNALITÉS HÔTELS ===`);
      console.log(`✅ Gestion complète des hôtels avec validation`);
      console.log(`✅ Upload d'images multiples (jusqu'à 15)`);
      console.log(`✅ Système d'avis et favoris`);
      console.log(`✅ Recherche et filtrage avancés`);
      console.log(`✅ Administration complète`);
      console.log(`✅ Statistiques et maintenance`);
      console.log(`✅ Structure prix: minPrice/maxPrice`);
      console.log(`✅ Coordonnées géographiques`);
      console.log(`✅ Disponibilité avec dates`);
      console.log(`✅ Équipements et services`);
      console.log(`🏨 ==========================================\n`);

      console.log(`\n📊 === ENDPOINTS ÉVÉNEMENTS COMPLETS ===`);
      console.log(`👥 UTILISATEUR:`);
      console.log(`  GET  /api/events                     - Tous les événements`);
      console.log(`  GET  /api/events/region/:name        - Par région`);
      console.log(`  GET  /api/events/category/:category  - Par catégorie`);
      console.log(`  GET  /api/events/featured            - Événements populaires`);
      console.log(`  GET  /api/events/search              - Recherche`);
      console.log(`  GET  /api/events/:id                 - Détails événement`);
      console.log(`  POST /api/events/:id/review          - Ajouter avis`);
      console.log(`  POST /api/events/:id/favorite        - Toggle favoris`);
      console.log(`  POST /api/events/:id/book            - Réserver`);
      console.log(`  GET  /api/events/user/bookings       - Mes réservations`);
      console.log(`  DEL  /api/events/:id/bookings/:bid   - Annuler réservation`);
      console.log(`\n🔧 ADMINISTRATION:`);
      console.log(`  POST /api/events/admin/create-or-update - Créer/Modifier`);
      console.log(`  GET  /api/events/admin/list          - Liste admin`);
      console.log(`  GET  /api/events/admin/stats         - Statistiques`);
      console.log(`  GET  /api/events/admin/bookings      - Toutes réservations`);
      console.log(`  DEL  /api/events/admin/:id           - Supprimer`);
      console.log(`  POST /api/events/admin/:id/restore   - Restaurer`);
      console.log(`  POST /api/events/admin/sync-data     - Synchroniser`);
      console.log(`\n🛠️ MAINTENANCE:`);
      console.log(`  POST /api/events/maintenance/repair           - Réparer données`);
      console.log(`  GET  /api/events/maintenance/verify           - Vérifier intégrité`);
      console.log(`  POST /api/events/maintenance/update-completion - Maj complétion`);
      console.log(`  POST /api/events/maintenance/update-availability - Maj disponibilité`);
      console.log(`  GET  /api/events/maintenance/health-report    - Rapport santé`);
      console.log(`  POST /api/events/maintenance/recalculate-stats - Recalcul stats`);
      console.log(`  DEL  /api/events/maintenance/emergency-cleanup - Nettoyage`);
      console.log(`📊 ==========================================\n`);

      console.log(`\n🎯 ARCHITECTURE API FINALE:`);
      console.log(`📁 /api/auth/*           - Authentification`);
      console.log(`📁 /api/users/*          - Gestion utilisateurs`);
      console.log(`📁 /api/treasures/*      - Trésors de base`);
      console.log(`📁 /api/treasureDetails/* - Détails des trésors`);
      console.log(`📁 /api/regions/*        - Régions de base`);
      console.log(`📁 /api/regionDetails/*  - Détails des régions`);
      console.log(`📁 /api/excursions/*     - Excursions complètes`);
      console.log(`📁 /api/popular-places/* - Lieux populaires`);
      console.log(`📁 /api/hotels/*         - Hôtels modernes`);
      console.log(`📁 /api/events/*         - Événements complets`);
      console.log(`📁 /api/services/*       - Services dynamiques`);
      console.log(`📁 /api/region-services/* - Services par région`);
      console.log(`📁 /api/rooms/*          - Gestion des chambres`);
      
      console.log(`\n🎉 SERVEUR TUKKI 2.3.0 OPÉRATIONNEL`);
      console.log(`🚀 Port: ${serverPort}`);
      console.log(`🌐 Host: 0.0.0.0 (accessible externalement)`);
      console.log(`📅 Démarré: ${new Date().toLocaleString('fr-FR')}`);
      console.log(`⏱️  Timeouts configurés pour uploads lourds`);
      console.log(`📸 Support multi-images: 15 fichiers/10MB`);
      console.log(`🔐 JWT authentification activée`);
      console.log(`🗄️  MongoDB connecté`);
      console.log(`\n🎊 TOUTES LES FONCTIONNALITÉS INTÉGRÉES ! 🎊\n`);
    });
  })
  .catch((error) => {
    console.error("❌ Error connecting to MongoDB:", error);
  });
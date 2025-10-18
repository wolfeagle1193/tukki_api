// scripts/seedTerroubiRooms.js - SCRIPT CHAMBRES HÔTEL TERROUBI
const mongoose = require('mongoose');
const Room = require('../models/Room');
const HotelDetails = require('../models/HotelDetails');

// ID MongoDB du Terroubi (de votre liste)
const TERROUBI_HOTEL_ID = '68b970498a31189a2ed2d080';

// Données des chambres pour l'Hôtel Terroubi
const terroubiRooms = [
  {
    // SUITE PRÉSIDENTIELLE VUE OCÉAN
    title: "Suite Présidentielle Vue Océan",
    type: "Suite Présidentielle",
    description: "Notre suite la plus luxueuse offrant une vue panoramique exceptionnelle sur l'océan Atlantique. Cette suite spacieuse de 85m² dispose d'un salon séparé, d'une chambre king size, d'une salle de bain avec baignoire jacuzzi et d'une terrasse privée. Décorée avec raffinement dans un style contemporain africain, elle comprend un mobilier haut de gamme, des œuvres d'art locales et tous les équipements modernes pour un séjour d'exception. Idéale pour les lunes de miel, anniversaires spéciaux ou voyages d'affaires prestigieux.",
    capacity: {
      adults: 2,
      children: 2,
      totalGuests: 4
    },
    dimensions: {
      surface: 85,
      unit: "m²"
    },
    bedConfiguration: [
      {
        type: "Lit king size",
        quantity: 1,
        size: "200x200"
      },
      {
        type: "Canapé-lit",
        quantity: 1,
        size: "Variable"
      }
    ],
    pricing: {
      basePrice: 180000,
      pricePerNight: 180000,
      currency: "FCFA",
      extras: {
        extraPersonPrice: 25000,
        childPrice: 15000
      }
    },
    availability: {
      isAvailable: true,
      availableFrom: new Date('2025-01-01'),
      availableTo: new Date('2025-12-31'),
      bookedDates: [],
      maintenanceDates: []
    },
    roomEquipments: [
      {
        category: "Technologie",
        items: [
          { name: "TV LED 55 pouces", icon: "tv", available: true, description: "Chaînes internationales et locales" },
          { name: "Wi-Fi Premium", icon: "wifi", available: true, description: "Connexion haut débit gratuite" },
          { name: "Système audio Bluetooth", icon: "speaker", available: true, description: "Son haute qualité" },
          { name: "Coffre-fort électronique", icon: "lock", available: true, description: "Pour ordinateur portable" }
        ]
      },
      {
        category: "Confort",
        items: [
          { name: "Climatisation individuelle", icon: "ac-unit", available: true, description: "Contrôle température" },
          { name: "Minibar premium", icon: "local-bar", available: true, description: "Boissons et snacks" },
          { name: "Machine à café Nespresso", icon: "coffee", available: true, description: "Café et thé gratuits" },
          { name: "Terrasse privée", icon: "balcony", available: true, description: "Vue océan avec mobilier" }
        ]
      },
      {
        category: "Salle de bain",
        items: [
          { name: "Baignoire jacuzzi", icon: "bathtub", available: true, description: "Balnéothérapie" },
          { name: "Douche à l'italienne", icon: "shower", available: true, description: "Douche pluie" },
          { name: "Sèche-cheveux professionnel", icon: "toys", available: true, description: "Haute performance" },
          { name: "Produits de toilette premium", icon: "soap", available: true, description: "Marque de luxe" }
        ]
      }
    ],
    standardEquipments: {
      tv: true,
      wifi: true,
      airConditioning: true,
      minibar: true,
      safe: true,
      balcony: true,
      seaView: true,
      coffeMachine: true,
      bathtub: true,
      shower: true,
      workDesk: true,
      telephone: true
    },
    images: {
      mainImage: "/assets/images/rooms/terroubi/suite-presidentielle-main.jpg",
      gallery: [
        "/assets/images/rooms/terroubi/suite-presidentielle-salon.jpg",
        "/assets/images/rooms/terroubi/suite-presidentielle-chambre.jpg",
        "/assets/images/rooms/terroubi/suite-presidentielle-terrasse.jpg",
        "/assets/images/rooms/terroubi/suite-presidentielle-sdb.jpg"
      ],
      categorizedImages: {
        bedroom: ["/assets/images/rooms/terroubi/suite-presidentielle-chambre.jpg"],
        bathroom: ["/assets/images/rooms/terroubi/suite-presidentielle-sdb.jpg"],
        view: ["/assets/images/rooms/terroubi/suite-presidentielle-terrasse.jpg"],
        amenities: ["/assets/images/rooms/terroubi/suite-presidentielle-salon.jpg"]
      }
    },
    includedServices: [
      { name: "Petit-déjeuner continental", icon: "restaurant", description: "Servi en chambre ou au restaurant", available: true },
      { name: "Accès piscine privée", icon: "pool", description: "Espace VIP", available: true },
      { name: "Service de conciergerie", icon: "concierge-bell", description: "24h/24", available: true },
      { name: "Transfert aéroport", icon: "local-taxi", description: "Aller-retour inclus", available: true }
    ],
    featured: true,
    priority: 10,
    status: "active"
  },

  {
    // SUITE JUNIOR VUE MER
    title: "Suite Junior Vue Mer",
    type: "Suite Junior",
    description: "Élégante suite junior de 60m² avec vue directe sur l'océan Atlantique. Comprend une chambre spacieuse avec lit king size, un coin salon confortable et une salle de bain moderne avec douche à l'italienne. La décoration allie modernité et touches africaines traditionnelles. Large balcon avec mobilier extérieur pour profiter des couchers de soleil spectaculaires. Parfaite pour les couples en quête de romantisme ou les voyageurs d'affaires souhaitant plus d'espace.",
    capacity: {
      adults: 2,
      children: 1,
      totalGuests: 3
    },
    dimensions: {
      surface: 60,
      unit: "m²"
    },
    bedConfiguration: [
      {
        type: "Lit king size",
        quantity: 1,
        size: "200x200"
      }
    ],
    pricing: {
      basePrice: 135000,
      pricePerNight: 135000,
      currency: "FCFA",
      extras: {
        extraPersonPrice: 20000,
        childPrice: 12000
      }
    },
    availability: {
      isAvailable: true,
      availableFrom: new Date('2025-01-01'),
      availableTo: new Date('2025-12-31'),
      bookedDates: [],
      maintenanceDates: []
    },
    roomEquipments: [
      {
        category: "Technologie",
        items: [
          { name: "TV LED 50 pouces", icon: "tv", available: true, description: "Chaînes internationales" },
          { name: "Wi-Fi haut débit", icon: "wifi", available: true, description: "Connexion gratuite" },
          { name: "Coffre-fort", icon: "lock", available: true, description: "Sécurisé" }
        ]
      },
      {
        category: "Confort",
        items: [
          { name: "Climatisation", icon: "ac-unit", available: true, description: "Contrôle individuel" },
          { name: "Minibar", icon: "local-bar", available: true, description: "Bien approvisionné" },
          { name: "Machine à café", icon: "coffee", available: true, description: "Expresso et thé" },
          { name: "Balcon vue mer", icon: "balcony", available: true, description: "Mobilier extérieur" }
        ]
      }
    ],
    standardEquipments: {
      tv: true,
      wifi: true,
      airConditioning: true,
      minibar: true,
      safe: true,
      balcony: true,
      seaView: true,
      coffeMachine: true,
      shower: true,
      workDesk: true,
      telephone: true
    },
    images: {
      mainImage: "/assets/images/rooms/terroubi/suite-junior-main.jpg",
      gallery: [
        "/assets/images/rooms/terroubi/suite-junior-chambre.jpg",
        "/assets/images/rooms/terroubi/suite-junior-salon.jpg",
        "/assets/images/rooms/terroubi/suite-junior-balcon.jpg",
        "/assets/images/rooms/terroubi/suite-junior-sdb.jpg"
      ]
    },
    includedServices: [
      { name: "Petit-déjeuner buffet", icon: "restaurant", description: "Au restaurant principal", available: true },
      { name: "Accès spa", icon: "spa", description: "Réduction 20%", available: true }
    ],
    featured: true,
    priority: 9,
    status: "active"
  },

  {
    // CHAMBRE DELUXE VUE MER
    title: "Chambre Deluxe Vue Mer",
    type: "Chambre Deluxe",
    description: "Chambre deluxe moderne de 45m² avec vue directe sur l'océan. Lit queen size confortable, salle de bain avec douche, balcon privatif avec vue panoramique sur la côte dakaroise. Décoration contemporaine avec des accents culturels sénégalais. Équipements modernes incluant TV satellite, Wi-Fi gratuit, climatisation et minibar. Idéale pour découvrir le charme de Dakar dans un cadre raffiné.",
    capacity: {
      adults: 2,
      children: 1,
      totalGuests: 3
    },
    dimensions: {
      surface: 45,
      unit: "m²"
    },
    bedConfiguration: [
      {
        type: "Lit queen size",
        quantity: 1,
        size: "160x200"
      }
    ],
    pricing: {
      basePrice: 110000,
      pricePerNight: 110000,
      currency: "FCFA",
      extras: {
        extraPersonPrice: 15000,
        childPrice: 8000
      }
    },
    availability: {
      isAvailable: true,
      availableFrom: new Date('2025-01-01'),
      availableTo: new Date('2025-12-31'),
      bookedDates: [],
      maintenanceDates: []
    },
    roomEquipments: [
      {
        category: "Technologie",
        items: [
          { name: "TV LED 43 pouces", icon: "tv", available: true },
          { name: "Wi-Fi gratuit", icon: "wifi", available: true },
          { name: "Coffre-fort", icon: "lock", available: true }
        ]
      },
      {
        category: "Confort",
        items: [
          { name: "Climatisation", icon: "ac-unit", available: true },
          { name: "Minibar", icon: "local-bar", available: true },
          { name: "Balcon vue mer", icon: "balcony", available: true }
        ]
      }
    ],
    standardEquipments: {
      tv: true,
      wifi: true,
      airConditioning: true,
      minibar: true,
      safe: true,
      balcony: true,
      seaView: true,
      shower: true,
      workDesk: true,
      telephone: true
    },
    images: {
      mainImage: "/assets/images/rooms/terroubi/deluxe-mer-main.jpg",
      gallery: [
        "/assets/images/rooms/terroubi/deluxe-mer-chambre.jpg",
        "/assets/images/rooms/terroubi/deluxe-mer-balcon.jpg",
        "/assets/images/rooms/terroubi/deluxe-mer-sdb.jpg"
      ]
    },
    featured: true,
    priority: 8,
    status: "active"
  },

  {
    // CHAMBRE DELUXE VUE JARDIN
    title: "Chambre Deluxe Vue Jardin",
    type: "Chambre Deluxe",
    description: "Chambre deluxe de 40m² donnant sur les jardins tropicaux luxuriants de l'hôtel. Atmosphère paisible et reposante avec lit queen size, salle de bain moderne, et balcon privé face aux espaces verts. Parfaite pour les voyageurs recherchant le calme tout en restant proche de toutes les commodités. Décoration élégante mêlant confort moderne et artisanat local.",
    capacity: {
      adults: 2,
      children: 1,
      totalGuests: 3
    },
    dimensions: {
      surface: 40,
      unit: "m²"
    },
    bedConfiguration: [
      {
        type: "Lit queen size",
        quantity: 1,
        size: "160x200"
      }
    ],
    pricing: {
      basePrice: 95000,
      pricePerNight: 95000,
      currency: "FCFA",
      extras: {
        extraPersonPrice: 12000,
        childPrice: 7000
      }
    },
    availability: {
      isAvailable: true,
      availableFrom: new Date('2025-01-01'),
      availableTo: new Date('2025-12-31'),
      bookedDates: [],
      maintenanceDates: []
    },
    roomEquipments: [
      {
        category: "Technologie",
        items: [
          { name: "TV LED 43 pouces", icon: "tv", available: true },
          { name: "Wi-Fi gratuit", icon: "wifi", available: true },
          { name: "Coffre-fort", icon: "lock", available: true }
        ]
      },
      {
        category: "Confort",
        items: [
          { name: "Climatisation", icon: "ac-unit", available: true },
          { name: "Minibar", icon: "local-bar", available: true },
          { name: "Balcon vue jardin", icon: "balcony", available: true }
        ]
      }
    ],
    standardEquipments: {
      tv: true,
      wifi: true,
      airConditioning: true,
      minibar: true,
      safe: true,
      balcony: true,
      gardenView: true,
      shower: true,
      workDesk: true,
      telephone: true
    },
    images: {
      mainImage: "/assets/images/rooms/terroubi/deluxe-jardin-main.jpg",
      gallery: [
        "/assets/images/rooms/terroubi/deluxe-jardin-chambre.jpg",
        "/assets/images/rooms/terroubi/deluxe-jardin-balcon.jpg",
        "/assets/images/rooms/terroubi/deluxe-jardin-sdb.jpg"
      ]
    },
    priority: 7,
    status: "active"
  },

  {
    // CHAMBRE FAMILIALE
    title: "Chambre Familiale Vue Mer",
    type: "Chambre Familiale",
    description: "Spacieuse chambre familiale de 55m² parfaite pour accueillir jusqu'à 5 personnes. Comprend un lit double, deux lits simples et la possibilité d'un lit d'appoint. Vue sur l'océan depuis le balcon privatif. Salle de bain familiale avec douche et baignoire. Aménagement pensé pour le confort des familles avec enfants : espace de jeu, réfrigérateur, et équipements adaptés. Idéale pour des vacances en famille mémorables.",
    capacity: {
      adults: 2,
      children: 3,
      totalGuests: 5
    },
    dimensions: {
      surface: 55,
      unit: "m²"
    },
    bedConfiguration: [
      {
        type: "Lit double",
        quantity: 1,
        size: "140x200"
      },
      {
        type: "Lits jumeaux",
        quantity: 2,
        size: "90x200"
      }
    ],
    pricing: {
      basePrice: 140000,
      pricePerNight: 140000,
      currency: "FCFA",
      extras: {
        extraPersonPrice: 10000,
        childPrice: 5000
      }
    },
    availability: {
      isAvailable: true,
      availableFrom: new Date('2025-01-01'),
      availableTo: new Date('2025-12-31'),
      bookedDates: [],
      maintenanceDates: []
    },
    roomEquipments: [
      {
        category: "Technologie",
        items: [
          { name: "TV LED 50 pouces", icon: "tv", available: true, description: "Chaînes enfants incluses" },
          { name: "Wi-Fi gratuit", icon: "wifi", available: true },
          { name: "Réfrigérateur", icon: "kitchen", available: true, description: "Pour conservation" }
        ]
      },
      {
        category: "Confort",
        items: [
          { name: "Climatisation", icon: "ac-unit", available: true },
          { name: "Balcon sécurisé", icon: "balcony", available: true, description: "Vue mer, sécurisé enfants" },
          { name: "Espace de jeu", icon: "toys", available: true, description: "Zone dédiée enfants" }
        ]
      },
      {
        category: "Salle de bain",
        items: [
          { name: "Baignoire familiale", icon: "bathtub", available: true, description: "Pour enfants" },
          { name: "Douche séparée", icon: "shower", available: true },
          { name: "Accessoires enfants", icon: "child-care", available: true }
        ]
      }
    ],
    standardEquipments: {
      tv: true,
      wifi: true,
      airConditioning: true,
      safe: true,
      balcony: true,
      seaView: true,
      bathtub: true,
      shower: true,
      telephone: true
    },
    images: {
      mainImage: "/assets/images/rooms/terroubi/familiale-main.jpg",
      gallery: [
        "/assets/images/rooms/terroubi/familiale-chambre-parents.jpg",
        "/assets/images/rooms/terroubi/familiale-chambre-enfants.jpg",
        "/assets/images/rooms/terroubi/familiale-balcon.jpg",
        "/assets/images/rooms/terroubi/familiale-sdb.jpg"
      ]
    },
    includedServices: [
      { name: "Lit bébé gratuit", icon: "child-care", description: "Sur demande", available: true },
      { name: "Kit enfants", icon: "toys", description: "Produits de toilette adaptés", available: true }
    ],
    featured: true,
    priority: 8,
    status: "active"
  },

  {
    // CHAMBRE STANDARD VUE MER
    title: "Chambre Standard Vue Mer",
    type: "Chambre Standard",
    description: "Chambre confortable de 35m² avec vue directe sur l'océan Atlantique. Lit double de qualité, salle de bain moderne avec douche, et balcon privé pour admirer les couchers de soleil. Bien équipée avec TV satellite, Wi-Fi gratuit, climatisation et téléphone. Excellent rapport qualité-prix pour découvrir le charme de Dakar et profiter des installations de l'hôtel Terroubi.",
    capacity: {
      adults: 2,
      children: 1,
      totalGuests: 3
    },
    dimensions: {
      surface: 35,
      unit: "m²"
    },
    bedConfiguration: [
      {
        type: "Lit double",
        quantity: 1,
        size: "140x200"
      }
    ],
    pricing: {
      basePrice: 85000,
      pricePerNight: 85000,
      currency: "FCFA",
      extras: {
        extraPersonPrice: 10000,
        childPrice: 6000
      }
    },
    availability: {
      isAvailable: true,
      availableFrom: new Date('2025-01-01'),
      availableTo: new Date('2025-12-31'),
      bookedDates: [],
      maintenanceDates: []
    },
    roomEquipments: [
      {
        category: "Technologie",
        items: [
          { name: "TV LED 32 pouces", icon: "tv", available: true },
          { name: "Wi-Fi gratuit", icon: "wifi", available: true },
          { name: "Téléphone", icon: "phone", available: true }
        ]
      },
      {
        category: "Confort",
        items: [
          { name: "Climatisation", icon: "ac-unit", available: true },
          { name: "Balcon vue mer", icon: "balcony", available: true },
          { name: "Bureau", icon: "desk", available: true }
        ]
      }
    ],
    standardEquipments: {
      tv: true,
      wifi: true,
      airConditioning: true,
      safe: true,
      balcony: true,
      seaView: true,
      shower: true,
      workDesk: true,
      telephone: true
    },
    images: {
      mainImage: "/assets/images/rooms/terroubi/standard-mer-main.jpg",
      gallery: [
        "/assets/images/rooms/terroubi/standard-mer-chambre.jpg",
        "/assets/images/rooms/terroubi/standard-mer-balcon.jpg",
        "/assets/images/rooms/terroubi/standard-mer-sdb.jpg"
      ]
    },
    priority: 6,
    status: "active"
  },

  {
    // DOUBLE ROOM VUE JARDIN
    title: "Double Room Vue Jardin",
    type: "Double Room",
    description: "Chambre double accueillante de 30m² donnant sur les jardins tropicaux de l'hôtel. Ambiance calme et relaxante avec lit double confortable, salle de bain compacte mais fonctionnelle, et balcon face à la végétation luxuriante. Parfaite pour un séjour économique sans compromis sur le confort. Accès à toutes les installations de l'hôtel.",
    capacity: {
      adults: 2,
      children: 0,
      totalGuests: 2
    },
    dimensions: {
      surface: 30,
      unit: "m²"
    },
    bedConfiguration: [
      {
        type: "Lit double",
        quantity: 1,
        size: "140x200"
      }
    ],
    pricing: {
      basePrice: 70000,
      pricePerNight: 70000,
      currency: "FCFA",
      extras: {
        extraPersonPrice: 8000,
        childPrice: 5000
      }
    },
    availability: {
      isAvailable: true,
      availableFrom: new Date('2025-01-01'),
      availableTo: new Date('2025-12-31'),
      bookedDates: [],
      maintenanceDates: []
    },
    roomEquipments: [
      {
        category: "Technologie",
        items: [
          { name: "TV LED 32 pouces", icon: "tv", available: true },
          { name: "Wi-Fi gratuit", icon: "wifi", available: true }
        ]
      },
      {
        category: "Confort",
        items: [
          { name: "Climatisation", icon: "ac-unit", available: true },
          { name: "Balcon vue jardin", icon: "balcony", available: true }
        ]
      }
    ],
    standardEquipments: {
      tv: true,
      wifi: true,
      airConditioning: true,
      balcony: true,
      gardenView: true,
      shower: true,
      telephone: true
    },
    images: {
      mainImage: "/assets/images/rooms/terroubi/double-jardin-main.jpg",
      gallery: [
        "/assets/images/rooms/terroubi/double-jardin-chambre.jpg",
        "/assets/images/rooms/terroubi/double-jardin-balcon.jpg",
        "/assets/images/rooms/terroubi/double-jardin-sdb.jpg"
      ]
    },
    priority: 5,
    status: "active"
  },

  {
    // TWIN ROOM
    title: "Twin Room Vue Jardin",
    type: "Twin Room",
    description: "Chambre twin pratique de 32m² avec deux lits simples, idéale pour les amis ou collègues. Vue sur les jardins paisibles de l'hôtel, salle de bain moderne avec douche, et petit balcon. Configuration parfaite pour les voyages d'affaires ou entre amis. Equipements standard incluant TV, Wi-Fi, climatisation et téléphone.",
    capacity: {
      adults: 2,
      children: 0,
      totalGuests: 2
    },
    dimensions: {
      surface: 32,
      unit: "m²"
    },
    bedConfiguration: [
      {
        type: "Lits jumeaux",
        quantity: 2,
        size: "90x200"
      }
    ],
    pricing: {
      basePrice: 75000,
      pricePerNight: 75000,
      currency: "FCFA",
      extras: {
        extraPersonPrice: 8000,
        childPrice: 5000
      }
    },
    availability: {
      isAvailable: true,
      availableFrom: new Date('2025-01-01'),
      availableTo: new Date('2025-12-31'),
      bookedDates: [],
      maintenanceDates: []
    },
    roomEquipments: [
      {
        category: "Technologie",
        items: [
          { name: "TV LED 32 pouces", icon: "tv", available: true },
          { name: "Wi-Fi gratuit", icon: "wifi", available: true }
        ]
      },
      {
        category: "Confort",
        items: [
          { name: "Climatisation", icon: "ac-unit", available: true },
          { name: "Bureau de travail", icon: "desk", available: true },
          { name: "Balcon", icon: "balcony", available: true }
        ]
      }
    ],
    standardEquipments: {
      tv: true,
      wifi: true,
      airConditioning: true,
      balcony: true,
      gardenView: true,
      shower: true,
      workDesk: true,
      telephone: true
    },
    images: {
      mainImage: "/assets/images/rooms/terroubi/twin-main.jpg",
      gallery: [
        "/assets/images/rooms/terroubi/twin-chambre.jpg",
        "/assets/images/rooms/terroubi/twin-bureau.jpg",
        "/assets/images/rooms/terroubi/twin-sdb.jpg"
      ]
    },
    priority: 4,
    status: "active"
  }
];

// Politiques communes pour toutes les chambres du Terroubi
const commonPolicies = {
  checkIn: {
    from: "15:00",
    to: "23:00"
  },
  checkOut: {
    until: "12:00"
  },
  cancellation: {
    policy: "Modérée",
    freeUntil: 24,
    penaltyPercentage: 50
  },
  smoking: "Interdit",
  pets: {
    allowed: false,
    fee: 0
  },
  children: {
    ageLimit: 12,
    freeUnder: 3
  }
};

// Services inclus communs
const commonIncludedServices = [
  { name: "Accès Wi-Fi", icon: "wifi", description: "Gratuit dans tout l'hôtel", available: true },
  { name: "Accès piscine", icon: "pool", description: "Piscine extérieure", available: true },
  { name: "Accès plage privée", icon: "beach-access", description: "Accès direct", available: true },
  { name: "Parking", icon: "local-parking", description: "Gratuit", available: true }
];

// Script pour insérer les données
async function seedTerroubiRooms() {
  try {
    console.log('🏨 === CRÉATION DES CHAMBRES HÔTEL TERROUBI ===\n');
    
    // Vérifier que l'hôtel Terroubi existe
    const terroubi = await HotelDetails.findById(TERROUBI_HOTEL_ID);
    if (!terroubi) {
      throw new Error(`Hôtel Terroubi non trouvé avec l'ID: ${TERROUBI_HOTEL_ID}`);
    }
    
    console.log(`✅ Hôtel trouvé: ${terroubi.title}`);
    console.log(`📍 Localisation: ${terroubi.location}\n`);
    
    // Supprimer les chambres existantes du Terroubi (optionnel)
    const existingRooms = await Room.find({ hotelId: TERROUBI_HOTEL_ID });
    if (existingRooms.length > 0) {
      console.log(`⚠️  ${existingRooms.length} chambre(s) existante(s) trouvée(s)`);
      
      const deleteExisting = process.argv.includes('--replace');
      if (deleteExisting) {
        await Room.deleteMany({ hotelId: TERROUBI_HOTEL_ID });
        console.log('🗑️  Chambres existantes supprimées\n');
      } else {
        console.log('ℹ️  Utilisation des données existantes (ajoutez --replace pour les remplacer)\n');
      }
    }
    
    const insertedRooms = [];
    
    // Administration info
    const adminInfo = {
      userId: new mongoose.Types.ObjectId(),
      role: 'superAdmin',
      username: 'system_terroubi'
    };
    
    for (const roomData of terroubiRooms) {
      try {
        // Vérifier si la chambre existe déjà
        const existingRoom = await Room.findOne({
          hotelId: TERROUBI_HOTEL_ID,
          title: roomData.title,
          type: roomData.type
        });
        
        if (existingRoom && !process.argv.includes('--replace')) {
          console.log(`⚠️  Chambre existante: ${roomData.title}`);
          continue;
        }
        
        // Préparer les données complètes
        const completeRoomData = {
          ...roomData,
          hotelId: TERROUBI_HOTEL_ID,
          policies: commonPolicies,
          includedServices: [
            ...commonIncludedServices,
            ...(roomData.includedServices || [])
          ],
          paidServices: [
            { name: "Service en chambre", price: 5000, unit: "Par utilisation", available: true },
            { name: "Blanchisserie", price: 3000, unit: "Par personne", available: true },
            { name: "Massage en chambre", price: 25000, unit: "Par utilisation", available: true }
          ],
          accessibility: {
            wheelchairAccessible: ['Suite Présidentielle Vue Océan', 'Suite Junior Vue Mer'].includes(roomData.title),
            features: ['Suite Présidentielle Vue Océan', 'Suite Junior Vue Mer'].includes(roomData.title) 
              ? ['Douche accessible', 'Barres d\'appui', 'Porte élargie'] 
              : []
          },
          createdBy: adminInfo,
          lastEditedBy: {
            ...adminInfo,
            editedAt: new Date()
          },
          reviews: [], // Vide au départ
          stats: {
            totalReviews: 0,
            averageRating: 0,
            detailedRatings: {
              cleanliness: 0,
              comfort: 0,
              location: 0,
              service: 0,
              valueForMoney: 0
            },
            viewsCount: Math.floor(Math.random() * 100) + 20, // Vues initiales aléatoires
            bookingsCount: 0,
            favoritesCount: 0,
            occupancyRate: 0
          },
          favoritedBy: [],
          version: 1
        };
        
        // Créer et sauvegarder la chambre
        const room = new Room(completeRoomData);
        await room.save();
        
        insertedRooms.push({
          id: room._id,
          title: room.title,
          type: room.type,
          surface: room.dimensions.surface,
          capacity: room.capacity.totalGuests,
          pricePerNight: room.pricing.pricePerNight,
          featured: room.featured || false
        });
        
        console.log(`✅ Chambre créée: ${room.title}`);
        console.log(`   Type: ${room.type}`);
        console.log(`   Surface: ${room.dimensions.surface}m²`);
        console.log(`   Capacité: ${room.capacity.totalGuests} personnes`);
        console.log(`   Prix: ${room.formattedPrice}`);
        console.log(`   Featured: ${room.featured ? 'Oui' : 'Non'}`);
        console.log('   ' + '-'.repeat(50));
        
      } catch (roomError) {
        console.error(`❌ Erreur création chambre ${roomData.title}:`, roomError.message);
      }
    }
    
    // Mettre à jour l'hôtel avec les références des chambres
    if (insertedRooms.length > 0) {
      const roomIds = insertedRooms.map(room => room.id);
      await HotelDetails.findByIdAndUpdate(
        TERROUBI_HOTEL_ID,
        { $addToSet: { rooms: { $each: roomIds } } }
      );
      console.log(`🔗 ${roomIds.length} chambres associées à l'hôtel`);
    }
    
    console.log('\n🎉 === RÉSUMÉ CRÉATION CHAMBRES TERROUBI ===');
    console.log(`Hôtel: ${terroubi.title}`);
    console.log(`Total chambres créées: ${insertedRooms.length}`);
    
    if (insertedRooms.length > 0) {
      console.log('\n📊 Répartition par type:');
      const byType = insertedRooms.reduce((acc, room) => {
        acc[room.type] = (acc[room.type] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`- ${type}: ${count} chambre(s)`);
      });
      
      console.log('\n💰 Gamme de prix:');
      const prices = insertedRooms.map(r => r.pricePerNight);
      console.log(`- Prix minimum: ${Math.min(...prices).toLocaleString()} FCFA`);
      console.log(`- Prix maximum: ${Math.max(...prices).toLocaleString()} FCFA`);
      console.log(`- Prix moyen: ${Math.round(prices.reduce((a, b) => a + b, 0) / prices.length).toLocaleString()} FCFA`);
      
      console.log('\n⭐ Chambres vedettes:');
      const featured = insertedRooms.filter(r => r.featured);
      if (featured.length > 0) {
        featured.forEach(room => {
          console.log(`- ${room.title} (${room.pricePerNight.toLocaleString()} FCFA)`);
        });
      } else {
        console.log('- Aucune chambre vedette');
      }
      
      console.log('\n🏠 Capacités:');
      const totalCapacity = insertedRooms.reduce((sum, room) => sum + room.capacity, 0);
      const avgCapacity = Math.round(totalCapacity / insertedRooms.length);
      console.log(`- Capacité totale: ${totalCapacity} personnes`);
      console.log(`- Capacité moyenne: ${avgCapacity} personnes par chambre`);
      
      console.log('\n📐 Surfaces:');
      const surfaces = insertedRooms.map(r => r.surface);
      console.log(`- Surface minimum: ${Math.min(...surfaces)}m²`);
      console.log(`- Surface maximum: ${Math.max(...surfaces)}m²`);
      console.log(`- Surface moyenne: ${Math.round(surfaces.reduce((a, b) => a + b, 0) / surfaces.length)}m²`);
    }
    
    return {
      success: true,
      message: `${insertedRooms.length} chambres créées pour l'hôtel Terroubi`,
      data: insertedRooms,
      hotel: {
        id: terroubi._id,
        title: terroubi.title,
        location: terroubi.location
      }
    };
    
  } catch (error) {
    console.error('❌ Erreur générale lors de la création:', error);
    return {
      success: false,
      message: 'Erreur lors de la création des chambres',
      error: error.message
    };
  }
}

// Fonction pour ajouter des avis de démonstration aux chambres
async function addSampleRoomReviews() {
  try {
    console.log('\n⭐ === AJOUT D\'AVIS CHAMBRES TERROUBI ===\n');
    
    const rooms = await Room.find({ hotelId: TERROUBI_HOTEL_ID, status: 'active' });
    
    if (rooms.length === 0) {
      console.log('⚠️  Aucune chambre trouvée pour ajouter des avis');
      return { success: false, message: 'Aucune chambre trouvée' };
    }
    
    const sampleReviews = [
      {
        userInfo: { username: "Aminata Sarr", profile: "/assets/images/users/user1.jpg" },
        ratings: { overall: 5, cleanliness: 5, comfort: 5, location: 5, service: 5, valueForMoney: 4 },
        review: "Séjour absolument fantastique au Terroubi ! La vue sur l'océan est à couper le souffle, le service irréprochable et la chambre d'une propreté impeccable. Je recommande vivement cet établissement d'exception.",
        travelType: "Couple",
        stayDuration: 3
      },
      {
        userInfo: { username: "Jean-Baptiste Martin", profile: "/assets/images/users/user2.jpg" },
        ratings: { overall: 4, cleanliness: 5, comfort: 4, location: 5, service: 4, valueForMoney: 4 },
        review: "Excellent hôtel avec une localisation parfaite sur la corniche. Le personnel est très professionnel et les équipements modernes. Petit bémol sur l'insonorisation mais rien de rédhibitoire.",
        travelType: "Business",
        stayDuration: 2
      },
      {
        userInfo: { username: "Fatou Ba", profile: "/assets/images/users/user3.jpg" },
        ratings: { overall: 5, cleanliness: 5, comfort: 5, location: 5, service: 5, valueForMoney: 5 },
        review: "Parfait pour des vacances en famille ! Les enfants ont adoré la piscine et la plage privée. La chambre familiale était spacieuse et bien aménagée. Personnel aux petits soins.",
        travelType: "Family",
        stayDuration: 5
      },
      {
        userInfo: { username: "Mohamed Diallo", profile: "/assets/images/users/user4.jpg" },
        ratings: { overall: 4, cleanliness: 4, comfort: 5, location: 5, service: 4, valueForMoney: 3 },
        review: "Très bel hôtel avec une vue magnifique. Le confort de la chambre et la qualité des installations sont au rendez-vous. Un peu cher mais la qualité justifie le prix.",
        travelType: "Solo",
        stayDuration: 1
      },
      {
        userInfo: { username: "Sophie Dubois", profile: "/assets/images/users/user5.jpg" },
        ratings: { overall: 5, cleanliness: 5, comfort: 5, location: 4, service: 5, valueForMoney: 4 },
        review: "Séjour de rêve dans la suite présidentielle ! Le luxe à la sénégalaise avec un service digne des plus grands palaces. La terrasse privée avec vue océan est magique au coucher du soleil.",
        travelType: "Couple",
        stayDuration: 4
      }
    ];
    
    let reviewsAdded = 0;
    
    for (const room of rooms) {
      try {
        // Ajouter 1-3 avis par chambre selon le type
        const numReviews = room.featured ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < numReviews && i < sampleReviews.length; i++) {
          const review = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
          const userId = new mongoose.Types.ObjectId();
          
          try {
            await room.addReview(
              userId,
              review.userInfo,
              review.ratings,
              review.review,
              null, // pas de reservationId
              {
                stayDuration: review.stayDuration,
                travelType: review.travelType
              }
            );
            
            reviewsAdded++;
            console.log(`✅ Avis ajouté: ${room.title} - ${review.ratings.overall}/5 par ${review.userInfo.username}`);
            
          } catch (reviewError) {
            if (!reviewError.message.includes('déjà donné un avis')) {
              console.error(`❌ Erreur ajout avis ${room.title}:`, reviewError.message);
            }
          }
        }
        
      } catch (roomError) {
        console.error(`❌ Erreur traitement chambre ${room.title}:`, roomError.message);
      }
    }
    
    console.log(`\n🎉 ${reviewsAdded} avis ajoutés aux chambres Terroubi`);
    
    return { success: true, reviewsAdded, totalRooms: rooms.length };
    
  } catch (error) {
    console.error('❌ Erreur ajout avis chambres:', error);
    return { success: false, error: error.message };
  }
}

// Fonction pour générer un rapport des chambres créées
async function generateRoomsReport() {
  try {
    console.log('\n📊 === RAPPORT CHAMBRES TERROUBI ===\n');
    
    const rooms = await Room.find({ hotelId: TERROUBI_HOTEL_ID }).populate('hotelId', 'title location');
    
    if (rooms.length === 0) {
      console.log('ℹ️  Aucune chambre trouvée');
      return;
    }
    
    console.log(`Hôtel: ${rooms[0].hotelId.title}`);
    console.log(`Localisation: ${rooms[0].hotelId.location}`);
    console.log(`Total chambres: ${rooms.length}\n`);
    
    // Statistiques par type
    const byType = rooms.reduce((acc, room) => {
      if (!acc[room.type]) {
        acc[room.type] = { count: 0, totalSurface: 0, totalPrice: 0, avgRating: 0 };
      }
      acc[room.type].count++;
      acc[room.type].totalSurface += room.dimensions.surface;
      acc[room.type].totalPrice += room.pricing.pricePerNight;
      acc[room.type].avgRating += room.stats.averageRating;
      return acc;
    }, {});
    
    console.log('📋 Répartition par type:');
    Object.entries(byType).forEach(([type, data]) => {
      console.log(`\n${type}:`);
      console.log(`  - Nombre: ${data.count}`);
      console.log(`  - Surface moyenne: ${Math.round(data.totalSurface / data.count)}m²`);
      console.log(`  - Prix moyen: ${Math.round(data.totalPrice / data.count).toLocaleString()} FCFA`);
      console.log(`  - Note moyenne: ${(data.avgRating / data.count).toFixed(1)}/5`);
    });
    
    // Top 3 plus chères
    const topExpensive = rooms
      .sort((a, b) => b.pricing.pricePerNight - a.pricing.pricePerNight)
      .slice(0, 3);
    
    console.log('\n💎 Top 3 chambres les plus chères:');
    topExpensive.forEach((room, index) => {
      console.log(`${index + 1}. ${room.title} - ${room.pricing.pricePerNight.toLocaleString()} FCFA`);
    });
    
    // Chambres vedettes
    const featured = rooms.filter(room => room.featured);
    console.log(`\n⭐ Chambres vedettes: ${featured.length}/${rooms.length}`);
    featured.forEach(room => {
      console.log(`- ${room.title} (${room.pricing.pricePerNight.toLocaleString()} FCFA)`);
    });
    
    // Statistiques générales
    const prices = rooms.map(r => r.pricing.pricePerNight);
    const surfaces = rooms.map(r => r.dimensions.surface);
    const capacities = rooms.map(r => r.capacity.totalGuests);
    
    console.log('\n📊 Statistiques générales:');
    console.log(`Prix: ${Math.min(...prices).toLocaleString()} - ${Math.max(...prices).toLocaleString()} FCFA (moyenne: ${Math.round(prices.reduce((a,b) => a+b) / prices.length).toLocaleString()})`);
    console.log(`Surface: ${Math.min(...surfaces)} - ${Math.max(...surfaces)}m² (moyenne: ${Math.round(surfaces.reduce((a,b) => a+b) / surfaces.length)})`);
    console.log(`Capacité: ${Math.min(...capacities)} - ${Math.max(...capacities)} personnes (total: ${capacities.reduce((a,b) => a+b)})`);
    
    const totalReviews = rooms.reduce((sum, room) => sum + room.stats.totalReviews, 0);
    const avgRating = rooms.length > 0 ? rooms.reduce((sum, room) => sum + room.stats.averageRating, 0) / rooms.length : 0;
    
    console.log(`\nAvis: ${totalReviews} total, note moyenne: ${avgRating.toFixed(1)}/5`);
    
    return { success: true, totalRooms: rooms.length };
    
  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
    return { success: false, error: error.message };
  }
}

// Menu interactif
async function runTerroubiRoomsMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise(resolve => rl.question(question, resolve));
  };
  
  try {
    console.log('\n🏨 === GESTIONNAIRE CHAMBRES TERROUBI ===');
    console.log('1. Créer les chambres du Terroubi');
    console.log('2. Ajouter des avis de démonstration');
    console.log('3. Générer un rapport des chambres');
    console.log('4. Tout exécuter (1+2+3)');
    console.log('5. Supprimer toutes les chambres du Terroubi');
    console.log('0. Quitter');
    
    const choice = await askQuestion('\nVotre choix: ');
    
    switch (choice.trim()) {
      case '1':
        const result1 = await seedTerroubiRooms();
        console.log(result1.message);
        break;
        
      case '2':
        const result2 = await addSampleRoomReviews();
        console.log(result2.success ? `${result2.reviewsAdded} avis ajoutés` : result2.message);
        break;
        
      case '3':
        await generateRoomsReport();
        break;
        
      case '4':
        console.log('🔄 Exécution complète...\n');
        const createResult = await seedTerroubiRooms();
        console.log(`✅ ${createResult.message}\n`);
        
        const reviewsResult = await addSampleRoomReviews();
        console.log(`✅ ${reviewsResult.reviewsAdded || 0} avis ajoutés\n`);
        
        await generateRoomsReport();
        console.log('\n🎉 Processus complet terminé !');
        break;
        
      case '5':
        const confirm = await askQuestion('⚠️  Êtes-vous sûr de vouloir supprimer TOUTES les chambres du Terroubi ? (tapez "OUI"): ');
        if (confirm === 'OUI') {
          const deleteResult = await Room.deleteMany({ hotelId: TERROUBI_HOTEL_ID });
          await HotelDetails.findByIdAndUpdate(TERROUBI_HOTEL_ID, { $unset: { rooms: 1 } });
          console.log(`🗑️  ${deleteResult.deletedCount} chambres supprimées`);
        } else {
          console.log('❌ Suppression annulée');
        }
        break;
        
      case '0':
        console.log('👋 Au revoir !');
        break;
        
      default:
        console.log('❌ Choix invalide');
    }
    
  } catch (error) {
    console.error('❌ Erreur menu:', error);
  } finally {
    rl.close();
  }
}

// Export du script
module.exports = {
  seedTerroubiRooms,
  addSampleRoomReviews,
  generateRoomsReport,
  runTerroubiRoomsMenu,
  terroubiRooms,
  TERROUBI_HOTEL_ID
};

// Exécution directe du script
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';
  
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('📡 Connecté à MongoDB');
      
      const args = process.argv.slice(2);
      
      if (args.includes('--interactive') || args.includes('-i')) {
        await runTerroubiRoomsMenu();
      } else if (args.includes('--reviews') || args.includes('-r')) {
        const result = await addSampleRoomReviews();
        console.log(result);
      } else if (args.includes('--report') || args.includes('-rep')) {
        await generateRoomsReport();
      } else {
        // Exécution par défaut
        const result = await seedTerroubiRooms();
        console.log('Résultat:', result.message);
        
        if (result.success) {
          await addSampleRoomReviews();
          await generateRoomsReport();
        }
      }
      
      console.log('🎉 Script terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur connexion MongoDB:', error);
      process.exit(1);
    });
}
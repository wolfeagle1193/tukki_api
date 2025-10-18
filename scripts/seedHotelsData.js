// scripts/seedHotelsData.js - SCRIPT DE DONNÉES HÔTELS SÉNÉGAL
const mongoose = require('mongoose');
const HotelDetails = require('../models/HotelDetails');

// Données des hôtels de Dakar
const hotelsData = [
  {
    // HÔTEL TERROU-BI - DAKAR
    title: "Terroubi",
    location: "Route de la Corniche Ouest, Dakar",
    region_Name: "Dakar",
    description: "L'Hôtel Terrou-Bi est une oasis de confort et de luxe située sur la magnifique côte atlantique de Dakar, au Sénégal. Offrant une vue imprenable sur l'océan, cet établissement combine le charme traditionnel africain avec des commodités modernes, créant une atmosphère accueillante pour les voyageurs d'affaires et de loisirs. Les chambres de l'hôtel sont spacieuses et élégamment décorées, équipées de toutes les installations nécessaires pour garantir un séjour agréable. Les clients peuvent profiter de la piscine extérieure, du centre de remise en forme, et d'un accès direct à la plage, parfait pour se détendre après une journée d'exploration. Le restaurant de l'Hôtel Terrou-Bi propose une cuisine locale et internationale, mettant en avant des ingrédients frais et de saison. Les clients peuvent savourer leurs repas tout en admirant la vue panoramique sur l'océan. L'hôtel est également idéalement situé à proximité des attractions majeures de Dakar, telles que l'île de Gorée et le Monument de la Renaissance Africaine, ce qui en fait un point de départ idéal pour découvrir la richesse culturelle et historique de la région.",
    coordinates: {
      latitude: 14.6869,
      longitude: -17.4441
    },
    price: {
      minPrice: 100000,
      maxPrice: 180000
    },
    availability: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    },
    placeImage: "/assets/images/hotels/dakar/terroubi.jpg",
    gallery: [
      "/assets/images/hotels/dakar/terroubi.jpg",
      "/assets/images/hotels/dakar/terroubi-pool.jpg",
      "/assets/images/hotels/dakar/terroubi-restaurant.jpg",
      "/assets/images/hotels/dakar/terroubi-beach.jpg",
      "/assets/images/hotels/dakar/terroubi-room.jpg"
    ],
    rating: 4.8,
    review: "2312 avis",
    facilities: [
      {
        wifi: true,
        parking: true,
        restaurant: true,
        piscine: true,
        spa: true,
        salleDeSport: true,
        plagePrivee: true,
        serviceDeChambre: true,
        sallesDeReunion: true
      }
    ],
    services: [
      { icon: 'wifi', label: 'Wi-Fi Gratuit', available: true },
      { icon: 'pool', label: 'Piscine Extérieure', available: true },
      { icon: 'restaurant', label: 'Restaurant Gastronomique', available: true },
      { icon: 'spa', label: 'Spa & Wellness', available: true },
      { icon: 'fitness-center', label: 'Centre de Fitness', available: true },
      { icon: 'beach-access', label: 'Accès Plage Privée', available: true },
      { icon: 'room-service', label: 'Service de Chambre 24h/24', available: true },
      { icon: 'local-parking', label: 'Parking Privé', available: true },
      { icon: 'meeting-room', label: 'Salles de Conférence', available: true }
    ],
    totalReviews: 2312,
    averageRating: 4.8,
    viewsCount: 1250,
    favoritesCount: 89,
    hasFullDetails: true,
    isActive: true
  },

  {
    // ARCHOTEL - DAKAR
    title: "Archotel",
    location: "Avenue Cheikh Anta Diop, Dakar",
    region_Name: "Dakar",
    description: "L'Archotel est un établissement moderne 4 étoiles situé au cœur de Dakar, offrant un parfait équilibre entre confort contemporain et hospitalité sénégalaise. Cet hôtel se distingue par son architecture élégante et ses services de qualité supérieure. Les chambres sont spacieuses et décorées avec goût, équipées des dernières technologies pour assurer le confort des clients. L'hôtel dispose d'un restaurant réputé servant une cuisine internationale et locale, d'un bar lounge moderne, et d'installations de bien-être. Son emplacement stratégique permet un accès facile aux centres d'affaires, aux attractions touristiques et aux zones commerciales de Dakar. L'Archotel est particulièrement apprécié des voyageurs d'affaires et des touristes exigeants recherchant un service personnalisé et des prestations haut de gamme.",
    coordinates: {
      latitude: 14.6937,
      longitude: -17.4441
    },
    price: {
      minPrice: 75000,
      maxPrice: 150000
    },
    availability: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    },
    placeImage: "/assets/images/hotels/dakar/archotel.jpg",
    gallery: [
      "/assets/images/hotels/dakar/archotel.jpg",
      "/assets/images/hotels/dakar/archotel-lobby.jpg",
      "/assets/images/hotels/dakar/archotel-room.jpg",
      "/assets/images/hotels/dakar/archotel-restaurant.jpg"
    ],
    rating: 4.3,
    review: "278 avis",
    facilities: [
      {
        wifi: true,
        parking: true,
        restaurant: true,
        piscine: false,
        spa: true,
        salleDeSport: true,
        plagePrivee: false,
        serviceDeChambre: true,
        sallesDeReunion: true
      }
    ],
    services: [
      { icon: 'wifi', label: 'Wi-Fi Haut Débit', available: true },
      { icon: 'restaurant', label: 'Restaurant International', available: true },
      { icon: 'spa', label: 'Centre de Bien-être', available: true },
      { icon: 'fitness-center', label: 'Salle de Sport', available: true },
      { icon: 'room-service', label: 'Service de Chambre', available: true },
      { icon: 'local-parking', label: 'Parking Sécurisé', available: true },
      { icon: 'meeting-room', label: 'Salles de Conférence', available: true }
    ],
    totalReviews: 278,
    averageRating: 4.3,
    viewsCount: 680,
    favoritesCount: 45,
    hasFullDetails: true,
    isActive: true
  },

  {
    // AZALAI - DAKAR
    title: "Hotel Azalai",
    location: "11 Rue de Thiong, Dakar",
    region_Name: "Dakar",
    description: "L'Azalai Hotel Dakar est un établissement 4 étoiles moderne qui allie confort international et charme africain authentique. Situé dans un quartier calme de Dakar, cet hôtel offre une atmosphère paisible tout en restant proche des principales attractions de la ville. Les chambres sont élégamment aménagées avec des équipements modernes et une décoration qui reflète l'art et la culture sénégalaise. L'hôtel propose un restaurant servant une cuisine raffinée mêlant saveurs locales et internationales, une piscine extérieure entourée d'un jardin tropical, et un spa proposant des soins relaxants. L'Azalai Hotel est reconnu pour son service attentionné et personnalisé, faisant de chaque séjour une expérience mémorable. Sa localisation permet d'explorer facilement les marchés colorés, les monuments historiques et les plages de Dakar.",
    coordinates: {
      latitude: 14.6928,
      longitude: -17.4467
    },
    price: {
      minPrice: 85000,
      maxPrice: 165000
    },
    availability: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    },
    placeImage: "/assets/images/hotels/dakar/azalai.jpg",
    gallery: [
      "/assets/images/hotels/dakar/azalai.jpg",
      "/assets/images/hotels/dakar/azalai-pool.jpg",
      "/assets/images/hotels/dakar/azalai-room.jpg",
      "/assets/images/hotels/dakar/azalai-restaurant.jpg",
      "/assets/images/hotels/dakar/azalai-spa.jpg"
    ],
    rating: 4.5,
    review: "189 avis",
    facilities: [
      {
        wifi: true,
        parking: true,
        restaurant: true,
        piscine: true,
        spa: true,
        salleDeSport: true,
        plagePrivee: false,
        serviceDeChambre: true,
        sallesDeReunion: true
      }
    ],
    services: [
      { icon: 'wifi', label: 'Wi-Fi Gratuit', available: true },
      { icon: 'pool', label: 'Piscine Tropicale', available: true },
      { icon: 'restaurant', label: 'Restaurant Fusion', available: true },
      { icon: 'spa', label: 'Spa Relaxant', available: true },
      { icon: 'fitness-center', label: 'Salle de Sport', available: true },
      { icon: 'room-service', label: 'Service de Chambre', available: true },
      { icon: 'local-parking', label: 'Parking', available: true },
      { icon: 'meeting-room', label: 'Salles de Réunion', available: true }
    ],
    totalReviews: 189,
    averageRating: 4.5,
    viewsCount: 520,
    favoritesCount: 32,
    hasFullDetails: true,
    isActive: true
  },

  {
    // FLEUR DE LYS HOTEL - DAKAR
    title: "Hotel Fleur de Lys",
    location: "Rue de la République, Plateau, Dakar",
    region_Name: "Dakar",
    description: "Le Fleur de Lys Hotel est un charmant établissement 3 étoiles situé au cœur du Plateau, le centre historique et administratif de Dakar. Cet hôtel boutique allie élégance française et hospitalité sénégalaise, offrant une expérience authentique dans un cadre raffiné. Les chambres sont décorées avec goût, mêlant mobilier colonial et touches contemporaines, toutes équipées du confort moderne. L'hôtel dispose d'un restaurant réputé servant une cuisine française et sénégalaise de qualité, d'un bar cosy et d'une terrasse avec vue sur la ville. Sa situation privilégiée au Plateau permet un accès facile aux ministères, banques, et sites culturels comme le Musée Théodore Monod. Le Fleur de Lys est particulièrement apprécié des voyageurs d'affaires et des amateurs de patrimoine architectural colonial, offrant un service personnalisé dans une atmosphère intimiste et raffinée.",
    coordinates: {
      latitude: 14.6725,
      longitude: -17.4414
    },
    price: {
      minPrice: 55000,
      maxPrice: 110000
    },
    availability: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    },
    placeImage: "/assets/images/hotels/dakar/fleurdeLyshotel.jpg",
    gallery: [
      "/assets/images/hotels/dakar/fleurdeLyshotel.jpg",
      "/assets/images/hotels/dakar/fleurdeLyshotel-terrace.jpg",
      "/assets/images/hotels/dakar/fleurdeLyshotel-room.jpg",
      "/assets/images/hotels/dakar/fleurdeLyshotel-restaurant.jpg"
    ],
    rating: 4.1,
    review: "156 avis",
    facilities: [
      {
        wifi: true,
        parking: true,
        restaurant: true,
        piscine: false,
        spa: false,
        salleDeSport: false,
        plagePrivee: false,
        serviceDeChambre: true,
        sallesDeReunion: true
      }
    ],
    services: [
      { icon: 'wifi', label: 'Wi-Fi', available: true },
      { icon: 'restaurant', label: 'Restaurant Franco-Sénégalais', available: true },
      { icon: 'room-service', label: 'Service de Chambre', available: true },
      { icon: 'local-parking', label: 'Parking', available: true },
      { icon: 'meeting-room', label: 'Salle de Réunion', available: true },
      { icon: 'concierge', label: 'Conciergerie', available: true }
    ],
    totalReviews: 156,
    averageRating: 4.1,
    viewsCount: 380,
    favoritesCount: 22,
    hasFullDetails: true,
    isActive: true
  },

  {
    // NOVOTEL DAKAR
    title: "Hotel Novotel",
    location: "Avenue Abdoulaye Fadiga, Dakar",
    region_Name: "Dakar",
    description: "Le Novotel Dakar est un hôtel moderne 4 étoiles situé dans le quartier des affaires de Dakar, offrant un parfait équilibre entre confort international et touches locales. Cet établissement contemporain se distingue par ses installations modernes et son service efficace, répondant aux besoins des voyageurs d'affaires comme des touristes. Les chambres spacieuses sont équipées de technologies récentes et d'un mobilier ergonomique, garantissant confort et productivité. L'hôtel propose un restaurant international, un bar moderne, une piscine extérieure et un centre de fitness bien équipé. Le Novotel dispose également d'espaces de conférence modulables et d'un centre d'affaires. Sa localisation centrale permet un accès rapide aux institutions financières, aux centres commerciaux et aux attractions touristiques de Dakar. L'établissement est reconnu pour son excellent rapport qualité-prix et son service professionnel constant.",
    coordinates: {
      latitude: 14.6892,
      longitude: -17.4356
    },
    price: {
      minPrice: 70000,
      maxPrice: 140000
    },
    availability: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    },
    placeImage: "/assets/images/hotels/dakar/novotel.jpg",
    gallery: [
      "/assets/images/hotels/dakar/novotel.jpg",
      "/assets/images/hotels/dakar/novotel-business.jpg",
      "/assets/images/hotels/dakar/novotel-pool.jpg",
      "/assets/images/hotels/dakar/novotel-room.jpg",
      "/assets/images/hotels/dakar/novotel-restaurant.jpg"
    ],
    rating: 4.3,
    review: "234 avis",
    facilities: [
      {
        wifi: true,
        parking: true,
        restaurant: true,
        piscine: true,
        spa: false,
        salleDeSport: true,
        plagePrivee: false,
        serviceDeChambre: true,
        sallesDeReunion: true
      }
    ],
    services: [
      { icon: 'wifi', label: 'Wi-Fi Haut Débit', available: true },
      { icon: 'pool', label: 'Piscine Extérieure', available: true },
      { icon: 'restaurant', label: 'Restaurant International', available: true },
      { icon: 'fitness-center', label: 'Centre de Fitness', available: true },
      { icon: 'room-service', label: 'Service de Chambre', available: true },
      { icon: 'local-parking', label: 'Parking Sécurisé', available: true },
      { icon: 'meeting-room', label: 'Centre de Conférences', available: true },
      { icon: 'business-center', label: 'Centre d\'Affaires', available: true }
    ],
    totalReviews: 234,
    averageRating: 4.3,
    viewsCount: 720,
    favoritesCount: 38,
    hasFullDetails: true,
    isActive: true
  },

  {
    // MIRAMAR HOTEL (King Fahd Palace)
    title: "Hotel Miramar",
    location: "Route de la Corniche Ouest, Dakar",
    region_Name: "Dakar",
    description: "L'Hotel Miramar Dakar est un établissement de charme situé sur la prestigieuse Corniche Ouest, offrant une vue panoramique exceptionnelle sur l'océan Atlantique. Cet hôtel 4 étoiles se distingue par son atmosphère élégante et son service personnalisé de qualité supérieure. Les chambres et suites sont décorées dans un style contemporain avec des touches d'art africain, toutes équipées d'équipements modernes et offrant pour la plupart une vue mer spectaculaire. L'hôtel dispose d'un restaurant gastronomique réputé, d'un bar lounge avec terrasse face à l'océan, d'une piscine à débordement et d'un spa proposant des soins relaxants. Le Miramar est également équipé de salles de réception pour événements privés et professionnels. Sa position privilégiée sur la Corniche permet de profiter des couchers de soleil magnifiques tout en étant proche des attractions majeures de Dakar.",
    coordinates: {
      latitude: 14.6844,
      longitude: -17.4612
    },
    price: {
      minPrice: 90000,
      maxPrice: 175000
    },
    availability: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    },
    placeImage: "/assets/images/hotels/dakar/mirammar.jpg",
    gallery: [
      "/assets/images/hotels/dakar/mirammar.jpg",
      "/assets/images/hotels/dakar/mirammar-ocean-view.jpg",
      "/assets/images/hotels/dakar/mirammar-pool.jpg",
      "/assets/images/hotels/dakar/mirammar-suite.jpg",
      "/assets/images/hotels/dakar/mirammar-restaurant.jpg"
    ],
    rating: 4.4,
    review: "167 avis",
    facilities: [
      {
        wifi: true,
        parking: true,
        restaurant: true,
        piscine: true,
        spa: true,
        salleDeSport: true,
        plagePrivee: false,
        serviceDeChambre: true,
        sallesDeReunion: true
      }
    ],
    services: [
      { icon: 'wifi', label: 'Wi-Fi Premium', available: true },
      { icon: 'pool', label: 'Piscine à Débordement', available: true },
      { icon: 'restaurant', label: 'Restaurant Gastronomique', available: true },
      { icon: 'spa', label: 'Spa & Soins', available: true },
      { icon: 'fitness-center', label: 'Salle de Sport', available: true },
      { icon: 'room-service', label: 'Service de Chambre', available: true },
      { icon: 'local-parking', label: 'Parking Privé', available: true },
      { icon: 'meeting-room', label: 'Salles d\'Événements', available: true }
    ],
    totalReviews: 167,
    averageRating: 4.4,
    viewsCount: 580,
    favoritesCount: 42,
    hasFullDetails: true,
    isActive: true
  },

  {
    // HOTEL NINA - DAKAR
    title: "Hotel Nina",
    location: "Avenue Cheikh Anta Diop, Fann, Dakar",
    region_Name: "Dakar",
    description: "L'Hotel Nina est un établissement moderne 3 étoiles situé dans le quartier résidentiel de Fann, offrant un cadre calme et confortable aux voyageurs. Cet hôtel se distingue par son ambiance chaleureuse et familiale, proposant un service attentionné dans un environnement paisible. Les chambres sont confortables et bien équipées, décorées dans un style contemporain avec des touches de couleurs vives. L'hôtel dispose d'un restaurant servant une cuisine variée alliant spécialités locales et plats internationaux, d'un bar convivial et d'espaces communs agréables. Le Nina propose également des services de blanchisserie, un parking sécurisé et une réception 24h/24. Sa situation dans le quartier de Fann permet un accès facile à l'université Cheikh Anta Diop, aux plages de la Corniche et au centre-ville, tout en bénéficiant d'un environnement plus tranquille que les hôtels du centre.",
    coordinates: {
      latitude: 14.6903,
      longitude: -17.4698
    },
    price: {
      minPrice: 45000,
      maxPrice: 85000
    },
    availability: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    },
    placeImage: "/assets/images/hotels/dakar/hotel_nina.jpg",
    gallery: [
      "/assets/images/hotels/dakar/hotel_nina.jpg",
      "/assets/images/hotels/dakar/hotel_nina-room.jpg",
      "/assets/images/hotels/dakar/hotel_nina-restaurant.jpg",
      "/assets/images/hotels/dakar/hotel_nina-lobby.jpg"
    ],
    rating: 3.9,
    review: "98 avis",
    facilities: [
      {
        wifi: true,
        parking: true,
        restaurant: true,
        piscine: false,
        spa: false,
        salleDeSport: false,
        plagePrivee: false,
        serviceDeChambre: true,
        sallesDeReunion: false
      }
    ],
    services: [
      { icon: 'wifi', label: 'Wi-Fi', available: true },
      { icon: 'restaurant', label: 'Restaurant', available: true },
      { icon: 'room-service', label: 'Service de Chambre', available: true },
      { icon: 'local-parking', label: 'Parking Sécurisé', available: true },
      { icon: 'laundry', label: 'Blanchisserie', available: true },
      { icon: 'reception', label: 'Réception 24h/24', available: true }
    ],
    totalReviews: 98,
    averageRating: 3.9,
    viewsCount: 280,
    favoritesCount: 15,
    hasFullDetails: true,
    isActive: true
  },

  {
    // RADISSON BLU - DAKAR
    title: "Radisson Blu ",
    location: "Route de la Corniche Ouest, Dakar",
    region_Name: "Dakar",
    description: "Le Radisson Blu Dakar est un hôtel 5 étoiles moderne situé sur la célèbre Corniche Ouest, offrant une expérience de luxe avec vue panoramique sur l'océan Atlantique. Cet établissement d'exception allie design contemporain et service de classe mondiale, créant une atmosphère sophistiquée pour une clientèle exigeante. Les chambres et suites spacieuses sont élégamment aménagées avec des équipements haut de gamme et des technologies de pointe, la plupart offrant une vue spectaculaire sur l'océan. L'hôtel abrite plusieurs restaurants de renommée, dont un restaurant gastronomique sur le toit, un bar lounge moderne, une piscine infinity avec vue mer, et un spa de luxe proposant des soins exclusifs. Le Radisson Blu dispose également d'un centre de conférences ultramoderne et d'espaces événementiels prestigieux. Sa localisation prime sur la Corniche en fait le choix privilégié pour découvrir Dakar dans un cadre d'exception.",
    coordinates: {
      latitude: 14.6856,
      longitude: -17.4534
    },
    price: {
      minPrice: 125000,
      maxPrice: 240000
    },
    availability: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    },
    placeImage: "/assets/images/hotels/dakar/radisson_blue_blue.jpg",
    gallery: [
      "/assets/images/hotels/dakar/radisson_blue_blue.jpg",
      "/assets/images/hotels/dakar/radisson_blue_blue-suite.jpg",
      "/assets/images/hotels/dakar/radisson_blue_blue-rooftop.jpg",
      "/assets/images/hotels/dakar/radisson_blue_blue-infinity-pool.jpg",
      "/assets/images/hotels/dakar/radisson_blue_blue-spa.jpg"
    ],
    rating: 4.7,
    review: "312 avis",
    facilities: [
      {
        wifi: true,
        parking: true,
        restaurant: true,
        piscine: true,
        spa: true,
        salleDeSport: true,
        plagePrivee: false,
        serviceDeChambre: true,
        sallesDeReunion: true
      }
    ],
    services: [
      { icon: 'wifi', label: 'Wi-Fi Haute Vitesse', available: true },
      { icon: 'pool', label: 'Piscine Infinity', available: true },
      { icon: 'restaurant', label: 'Restaurants Gastronomiques', available: true },
      { icon: 'spa', label: 'Spa de Luxe', available: true },
      { icon: 'fitness-center', label: 'Centre de Fitness', available: true },
      { icon: 'room-service', label: 'Service de Chambre 24h', available: true },
      { icon: 'local-parking', label: 'Parking Valet', available: true },
      { icon: 'meeting-room', label: 'Centre de Conférences', available: true },
      { icon: 'concierge', label: 'Conciergerie Premium', available: true }
    ],
    totalReviews: 312,
    averageRating: 4.7,
    viewsCount: 920,
    favoritesCount: 78,
    hasFullDetails: true,
    isActive: true
  },

  {
    // CAFE DE ROME - DAKAR
    title: "Cafe de Rome ",
    location: "Place de l'Indépendance, Dakar",
    region_Name: "Dakar",
    description: "Le Cafe de Rome Hotel est un établissement historique 3 étoiles situé sur l'emblématique Place de l'Indépendance, au cœur du centre administratif et commercial de Dakar. Cet hôtel de charme, témoin de l'histoire de la capitale sénégalaise, allie patrimoine architectural et confort moderne. Les chambres, rénovées dans le respect du caractère historique du bâtiment, offrent un confort contemporain avec une décoration élégante mélangeant style colonial et touches africaines. L'établissement dispose d'un restaurant réputé servant une cuisine française et sénégalaise de qualité, ainsi qu'un café-bar historique très fréquenté par les locaux et visiteurs. Sa situation exceptionnelle sur la Place de l'Indépendance permet un accès immédiat aux institutions gouvernementales, banques, centres commerciaux et sites culturels du Plateau. Le Cafe de Rome est particulièrement apprécié pour son ambiance authentique et son riche patrimoine historique.",
    coordinates: {
      latitude: 14.6729,
      longitude: -17.4421
    },
    price: {
      minPrice: 40000,
      maxPrice: 80000
    },
    availability: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    },
    placeImage: "/assets/images/hotels/dakar/cafe_de_rome.jpg",
    gallery: [
      "/assets/images/hotels/dakar/cafe_de_rome.jpg",
      "/assets/images/hotels/dakar/cafe_de_rome-historic.jpg",
      "/assets/images/hotels/dakar/cafe_de_rome-restaurant.jpg",
      "/assets/images/hotels/dakar/cafe_de_rome-room.jpg"
    ],
    rating: 3.8,
    review: "145 avis",
    facilities: [
      {
        wifi: true,
        parking: false,
        restaurant: true,
        piscine: false,
        spa: false,
        salleDeSport: false,
        plagePrivee: false,
        serviceDeChambre: true,
        sallesDeReunion: true
      }
    ],
    services: [
      { icon: 'wifi', label: 'Wi-Fi', available: true },
      { icon: 'restaurant', label: 'Restaurant Historique', available: true },
      { icon: 'room-service', label: 'Service de Chambre', available: true },
      { icon: 'meeting-room', label: 'Salle de Réunion', available: true },
      { icon: 'cafe', label: 'Café Historique', available: true },
      { icon: 'concierge', label: 'Conciergerie', available: true }
    ],
    totalReviews: 145,
    averageRating: 3.8,
    viewsCount: 340,
    favoritesCount: 20,
    hasFullDetails: true,
    isActive: true
  },

  {
    // HOTEL LE SOKHAMON - DAKAR
    title: "Le Sokhamon",
    location: "Rue El Hadji Mbaye Gueye, Dakar",
    region_Name: "Dakar",
    description: "L'Hotel Le Sokhamon est un établissement accueillant 2 étoiles situé dans un quartier calme de Dakar, offrant un excellent rapport qualité-prix pour les voyageurs soucieux de leur budget. Cet hôtel familial se distingue par son atmosphère chaleureuse et son service personnalisé, créant une ambiance conviviale pour tous les visiteurs. Les chambres sont simples mais confortables, propres et bien entretenues, équipées des commodités essentielles pour un séjour agréable. L'hôtel dispose d'un restaurant servant une cuisine locale authentique et des plats internationaux à des prix abordables, ainsi qu'un espace de détente pour les clients. Le Sokhamon propose également des services pratiques comme la réception 24h/24, l'assistance pour les excursions touristiques et les transferts. Sa localisation permet un accès facile aux transports en commun et aux principales attractions de Dakar, tout en offrant un hébergement économique dans un environnement sûr et accueillant.",
    coordinates: {
      latitude: 14.6934,
      longitude: -17.4289
    },
    price: {
      minPrice: 25000,
      maxPrice: 50000
    },
    availability: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    },
    placeImage: "/assets/images/hotels/dakar/sokhamon.jpg",
    gallery: [
      "/assets/images/hotels/dakar/sokhamon.jpg",
      "/assets/images/hotels/dakar/sokhamon-room.jpg",
      "/assets/images/hotels/dakar/sokhamon-restaurant.jpg"
    ],
    rating: 3.5,
    review: "87 avis",
    facilities: [
      {
        wifi: true,
        parking: true,
        restaurant: true,
        piscine: false,
        spa: false,
        salleDeSport: false,
        plagePrivee: false,
        serviceDeChambre: true,
        sallesDeReunion: false
      }
    ],
    services: [
      { icon: 'wifi', label: 'Wi-Fi', available: true },
      { icon: 'restaurant', label: 'Restaurant Local', available: true },
      { icon: 'room-service', label: 'Service de Chambre', available: true },
      { icon: 'local-parking', label: 'Parking', available: true },
      { icon: 'reception', label: 'Réception 24h/24', available: true },
      { icon: 'tour', label: 'Assistance Touristique', available: true }
    ],
    totalReviews: 87,
    averageRating: 3.5,
    viewsCount: 200,
    favoritesCount: 12,
    hasFullDetails: true,
    isActive: true
  }
];

// Script pour insérer les données
async function seedHotelsData() {
  try {
    console.log('🏨 Début de l\'insertion des données hôtels...');
    
    // Supprimer les données existantes si nécessaire
    // await HotelDetails.deleteMany({});
    // console.log('🗑️ Données existantes supprimées');
    
    const insertedHotels = [];
    
    for (const hotelData of hotelsData) {
      try {
        // Vérifier si l'hôtel existe déjà
        const existingHotel = await HotelDetails.findOne({ 
          title: hotelData.title,
          location: hotelData.location 
        });
        
        if (existingHotel) {
          console.log(`⚠️ Hôtel déjà existant: ${hotelData.title}`);
          continue;
        }
        
        // Créer les données administrateur par défaut
        const adminInfo = {
          userId: new mongoose.Types.ObjectId(), // Générer un ID admin fictif
          role: 'superAdmin',
          username: 'admin_system'
        };
        
        // Préparer les données complètes
        const completeHotelData = {
          ...hotelData,
          createdBy: adminInfo,
          lastEditedBy: {
            ...adminInfo,
            editedAt: new Date()
          },
          favoritedBy: [], // Initialiser tableau vide
          reviews: [], // Initialiser sans avis pour commencer
          version: 1
        };
        
        // Créer et sauvegarder l'hôtel
        const hotel = new HotelDetails(completeHotelData);
        await hotel.save();
        
        insertedHotels.push({
          id: hotel._id,
          title: hotel.title,
          location: hotel.location,
          region: hotel.region_Name,
          rating: hotel.averageRating,
          priceRange: `${hotel.price.minPrice} - ${hotel.price.maxPrice} FCFA`
        });
        
        console.log(`✅ Hôtel créé: ${hotel.title} (${hotel.region_Name})`);
        
      } catch (hotelError) {
        console.error(`❌ Erreur création hôtel ${hotelData.title}:`, hotelError.message);
      }
    }
    
    console.log('\n🎉 === RÉSUMÉ DE L\'INSERTION ===');
    console.log(`Total hôtels insérés: ${insertedHotels.length}`);
    console.log('Hôtels créés:');
    insertedHotels.forEach(hotel => {
      console.log(`- ${hotel.title} (${hotel.region}) - ${hotel.priceRange}`);
    });
    
    return {
      success: true,
      message: `${insertedHotels.length} hôtels insérés avec succès`,
      data: insertedHotels
    };
    
  } catch (error) {
    console.error('❌ Erreur générale lors de l\'insertion:', error);
    return {
      success: false,
      message: 'Erreur lors de l\'insertion des données',
      error: error.message
    };
  }
}

// Fonction pour ajouter des avis de démonstration
async function addSampleReviews() {
  try {
    console.log('⭐ Ajout d\'avis de démonstration...');
    
    const sampleReviews = [
      {
        hotelTitle: "Hôtel Terrou-Bi",
        reviews: [
          {
            userId: new mongoose.Types.ObjectId(),
            userInfo: { username: "Aminata Diallo", profile: "/assets/images/users/user1.jpg" },
            rating: 5,
            reviewText: "Séjour exceptionnel au Terrou-Bi ! La vue sur l'océan est magnifique, le service impeccable et les chambres très confortables. Le restaurant offre une cuisine délicieuse avec des produits frais. Je recommande vivement cet hôtel à tous ceux qui visitent Dakar."
          },
          {
            userId: new mongoose.Types.ObjectId(),
            userInfo: { username: "Jean-Baptiste Martin", profile: "/assets/images/users/user2.jpg" },
            rating: 5,
            reviewText: "Un hôtel de standing international au cœur de Dakar. L'accueil était chaleureux, la piscine magnifique et l'accès direct à la plage un vrai plus. Le spa propose des soins relaxants après une journée de visite. Parfait pour un voyage d'affaires ou de loisirs."
          }
        ]
      },
      {
        hotelTitle: "Pullman Dakar Teranga",
        reviews: [
          {
            userId: new mongoose.Types.ObjectId(),
            userInfo: { username: "Fatou Seck", profile: "/assets/images/users/user3.jpg" },
            rating: 4,
            reviewText: "Excellent séjour au Pullman. L'hôtel est très bien situé au centre de Dakar, les chambres sont modernes et confortables. La piscine sur le toit offre une vue panoramique sur la ville. Le petit-déjeuner était varié et délicieux."
          }
        ]
      }
    ];
    
    for (const hotelReviews of sampleReviews) {
      const hotel = await HotelDetails.findOne({ title: hotelReviews.hotelTitle });
      
      if (hotel) {
        for (const reviewData of hotelReviews.reviews) {
          try {
            await hotel.addReview(
              reviewData.userId,
              reviewData.userInfo,
              reviewData.rating,
              reviewData.reviewText
            );
            console.log(`✅ Avis ajouté pour ${hotelReviews.hotelTitle}`);
          } catch (reviewError) {
            console.log(`⚠️ Avis déjà existant pour ${hotelReviews.hotelTitle}`);
          }
        }
      }
    }
    
    console.log('✅ Avis de démonstration ajoutés');
    
  } catch (error) {
    console.error('❌ Erreur ajout avis:', error.message);
  }
}

// Fonction pour mettre à jour un hôtel existant
async function updateHotelData(hotelTitle, updateData) {
  try {
    const hotel = await HotelDetails.findOne({ title: hotelTitle, isActive: true });
    
    if (!hotel) {
      console.log(`⚠️ Hôtel non trouvé: ${hotelTitle}`);
      return { success: false, message: 'Hôtel non trouvé' };
    }
    
    // Mettre à jour les champs fournis
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        hotel[key] = updateData[key];
      }
    });
    
    // Mettre à jour les informations d'édition
    hotel.lastEditedBy = {
      userId: new mongoose.Types.ObjectId(),
      role: 'superAdmin',
      username: 'admin_system',
      editedAt: new Date()
    };
    
    await hotel.save();
    
    console.log(`✅ Hôtel mis à jour: ${hotelTitle}`);
    return { success: true, message: 'Hôtel mis à jour avec succès', data: hotel };
    
  } catch (error) {
    console.error(`❌ Erreur mise à jour ${hotelTitle}:`, error.message);
    return { success: false, message: error.message };
  }
}

// Fonction pour ajouter des hôtels supplémentaires
async function addMoreHotels() {
  const additionalHotels = [
    {
      title: "Hôtel Novotel Dakar",
      location: "Route de la Corniche Ouest, Dakar",
      region_Name: "Dakar",
      description: "Le Novotel Dakar est un hôtel moderne 4 étoiles situé sur la prestigieuse Corniche Ouest. Offrant une vue panoramique sur l'océan Atlantique, cet établissement allie confort contemporain et service de qualité. Les chambres spacieuses sont équipées de toutes les commodités modernes et disposent d'une décoration élégante. L'hôtel propose un restaurant gastronomique, un bar avec terrasse, une piscine extérieure et un centre de fitness. Son emplacement privilégié permet un accès facile aux attractions touristiques de Dakar et aux quartiers d'affaires.",
      coordinates: { latitude: 14.6801, longitude: -17.4612 },
      price: { minPrice: 80000, maxPrice: 160000 },
      availability: { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
      placeImage: "/assets/images/hotels/novotel/main.jpg",
      gallery: ["/assets/images/hotels/novotel/main.jpg", "/assets/images/hotels/novotel/room.jpg"],
      rating: 4.3,
      review: "142 avis",
      facilities: [{ wifi: true, parking: true, restaurant: true, piscine: true, spa: false, salleDeSport: true, plagePrivee: false, serviceDeChambre: true, sallesDeReunion: true }],
      services: [
        { icon: 'wifi', label: 'Wi-Fi Gratuit', available: true },
        { icon: 'pool', label: 'Piscine', available: true },
        { icon: 'restaurant', label: 'Restaurant', available: true },
        { icon: 'fitness-center', label: 'Centre de Fitness', available: true }
      ],
      totalReviews: 142, averageRating: 4.3, viewsCount: 420, favoritesCount: 25,
      hasFullDetails: true, isActive: true
    },
    {
      title: "Hôtel des Almadies",
      location: "Pointe des Almadies, Ngor, Dakar",
      region_Name: "Dakar",
      description: "L'Hôtel des Almadies est un charmant établissement 3 étoiles situé à la pointe ouest de l'Afrique, sur la presqu'île des Almadies. Cet hôtel boutique offre une atmosphère intime et relaxante avec vue sur l'océan. Les chambres sont décorées dans un style contemporain africain, alliant authenticité et confort moderne. L'établissement dispose d'un restaurant servant une cuisine fusion afro-européenne, d'une terrasse avec vue mer et d'un jardin tropical. Sa situation exceptionnelle près des plages de Ngor en fait un lieu privilégié pour découvrir les beautés naturelles de la région dakaroise.",
      coordinates: { latitude: 14.7344, longitude: -17.5167 },
      price: { minPrice: 45000, maxPrice: 90000 },
      availability: { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
      placeImage: "/assets/images/hotels/almadies/main.jpg",
      gallery: ["/assets/images/hotels/almadies/main.jpg", "/assets/images/hotels/almadies/terrace.jpg"],
      rating: 4.1,
      review: "98 avis",
      facilities: [{ wifi: true, parking: true, restaurant: true, piscine: false, spa: false, salleDeSport: false, plagePrivee: false, serviceDeChambre: true, sallesDeReunion: false }],
      services: [
        { icon: 'wifi', label: 'Wi-Fi', available: true },
        { icon: 'restaurant', label: 'Restaurant Fusion', available: true },
        { icon: 'room-service', label: 'Service de Chambre', available: true },
        { icon: 'local-parking', label: 'Parking', available: true }
      ],
      totalReviews: 98, averageRating: 4.1, viewsCount: 315, favoritesCount: 18,
      hasFullDetails: true, isActive: true
    }
  ];
  
  const insertedHotels = [];
  
  for (const hotelData of additionalHotels) {
    try {
      const existingHotel = await HotelDetails.findOne({ 
        title: hotelData.title,
        location: hotelData.location 
      });
      
      if (existingHotel) {
        console.log(`⚠️ Hôtel déjà existant: ${hotelData.title}`);
        continue;
      }
      
      const adminInfo = {
        userId: new mongoose.Types.ObjectId(),
        role: 'superAdmin',
        username: 'admin_system'
      };
      
      const completeHotelData = {
        ...hotelData,
        createdBy: adminInfo,
        lastEditedBy: { ...adminInfo, editedAt: new Date() },
        favoritedBy: [],
        reviews: [],
        version: 1
      };
      
      const hotel = new HotelDetails(completeHotelData);
      await hotel.save();
      
      insertedHotels.push(hotel);
      console.log(`✅ Hôtel supplémentaire créé: ${hotel.title}`);
      
    } catch (error) {
      console.error(`❌ Erreur création ${hotelData.title}:`, error.message);
    }
  }
  
  return insertedHotels;
}

// Fonction pour générer un rapport des hôtels
async function generateHotelsReport() {
  try {
    console.log('\n📊 === RAPPORT DES HÔTELS ===');
    
    const totalHotels = await HotelDetails.countDocuments({ isActive: true });
    const hotelsWithFullDetails = await HotelDetails.countDocuments({ isActive: true, hasFullDetails: true });
    
    const regionStats = await HotelDetails.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$region_Name', 
        count: { $sum: 1 },
        avgRating: { $avg: '$averageRating' },
        avgMinPrice: { $avg: '$price.minPrice' },
        avgMaxPrice: { $avg: '$price.maxPrice' }
      }},
      { $sort: { count: -1 } }
    ]);
    
    const priceStats = await HotelDetails.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: null,
        minPrice: { $min: '$price.minPrice' },
        maxPrice: { $max: '$price.maxPrice' },
        avgMinPrice: { $avg: '$price.minPrice' },
        avgMaxPrice: { $avg: '$price.maxPrice' }
      }}
    ]);
    
    console.log(`Total hôtels actifs: ${totalHotels}`);
    console.log(`Hôtels avec détails complets: ${hotelsWithFullDetails} (${Math.round(hotelsWithFullDetails/totalHotels*100)}%)`);
    
    console.log('\n📍 Répartition par région:');
    regionStats.forEach(region => {
      console.log(`- ${region._id}: ${region.count} hôtel(s) | Note moyenne: ${region.avgRating?.toFixed(1) || 'N/A'} | Prix moyen: ${Math.round(region.avgMinPrice || 0)} - ${Math.round(region.avgMaxPrice || 0)} FCFA`);
    });
    
    if (priceStats[0]) {
      console.log(`\n💰 Gamme de prix globale: ${priceStats[0].minPrice} - ${priceStats[0].maxPrice} FCFA`);
      console.log(`Prix moyens: ${Math.round(priceStats[0].avgMinPrice)} - ${Math.round(priceStats[0].avgMaxPrice)} FCFA`);
    }
    
    // Top 5 des hôtels les mieux notés
    const topRatedHotels = await HotelDetails.find({ isActive: true })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(5)
      .select('title region_Name averageRating totalReviews price');
    
    console.log('\n⭐ Top 5 des hôtels les mieux notés:');
    topRatedHotels.forEach((hotel, index) => {
      console.log(`${index + 1}. ${hotel.title} (${hotel.region_Name}) - ${hotel.averageRating}/5 (${hotel.totalReviews} avis) - ${hotel.price?.minPrice || 0} FCFA+`);
    });
    
    return {
      totalHotels,
      hotelsWithFullDetails,
      regionStats,
      priceStats: priceStats[0],
      topRatedHotels
    };
    
  } catch (error) {
    console.error('❌ Erreur génération rapport:', error.message);
    return null;
  }
}

// Fonction de nettoyage et validation des données
async function cleanAndValidateHotels() {
  try {
    console.log('\n🧹 Nettoyage et validation des données...');
    
    const hotels = await HotelDetails.find({ isActive: true });
    let updated = 0;
    let errors = 0;
    
    for (const hotel of hotels) {
      try {
        let hasChanges = false;
        
        // Recalculer les statistiques d'avis
        if (hotel.reviews && hotel.reviews.length > 0) {
          hotel.calculateAverageRating();
          hasChanges = true;
        }
        
        // Corriger le compteur de favoris
        const actualFavoritesCount = hotel.favoritedBy ? hotel.favoritedBy.length : 0;
        if (hotel.favoritesCount !== actualFavoritesCount) {
          hotel.favoritesCount = actualFavoritesCount;
          hasChanges = true;
        }
        
        // Valider la cohérence des prix
        if (hotel.price && hotel.price.minPrice && hotel.price.maxPrice) {
          if (hotel.price.minPrice > hotel.price.maxPrice) {
            const temp = hotel.price.minPrice;
            hotel.price.minPrice = hotel.price.maxPrice;
            hotel.price.maxPrice = temp;
            hasChanges = true;
            console.log(`🔧 Prix corrigés pour ${hotel.title}`);
          }
        }
        
        // Mettre à jour hasFullDetails
        const requiredFields = ['description', 'coordinates.latitude', 'coordinates.longitude', 'price.minPrice', 'price.maxPrice'];
        const hasAllRequiredFields = requiredFields.every(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], hotel);
          return value !== undefined && value !== null && value !== '';
        });
        
        const shouldHaveFullDetails = hasAllRequiredFields && hotel.gallery && hotel.gallery.length > 0;
        if (hotel.hasFullDetails !== shouldHaveFullDetails) {
          hotel.hasFullDetails = shouldHaveFullDetails;
          hasChanges = true;
        }
        
        if (hasChanges) {
          await hotel.save();
          updated++;
        }
        
      } catch (hotelError) {
        console.error(`❌ Erreur validation ${hotel.title}:`, hotelError.message);
        errors++;
      }
    }
    
    console.log(`✅ Validation terminée: ${updated} hôtels mis à jour, ${errors} erreurs`);
    return { updated, errors, total: hotels.length };
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error.message);
    return null;
  }
}

// Menu interactif pour l'exécution
// Menu interactif amélioré avec toutes les nouvelles fonctionnalités
async function runEnhancedInteractiveMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise(resolve => rl.question(question, resolve));
  };
  
  try {
    console.log('\n🏨 === GESTIONNAIRE DE DONNÉES HÔTELS (VERSION AMÉLIORÉE) ===');
    console.log('');
    console.log('📊 DONNÉES & RAPPORTS:');
    console.log('1.  Insérer les données hôtels principales');
    console.log('2.  Ajouter des avis de démonstration');
    console.log('3.  Ajouter des hôtels supplémentaires');
    console.log('4.  Générer un rapport des hôtels');
    console.log('5.  Nettoyer et valider les données');
    console.log('6.  Tout exécuter (1+2+3+4)');
    console.log('');
    console.log('🔍 CONSULTATION:');
    console.log('7.  Lister tous les hôtels avec leurs IDs MongoDB');
    console.log('8.  Rechercher un hôtel par ID');
    console.log('');
    console.log('🧹 MAINTENANCE:');
    console.log('9.  Nettoyer les doublons uniquement');
    console.log('10. Supprimer tous les hôtels (avec confirmation)');
    console.log('11. Recréer tous les hôtels (suppression + réinsertion propre)');
    console.log('');
    console.log('0.  Quitter');
    console.log('');
    console.log('⚠️  ATTENTION: Les options 10 et 11 suppriment définitivement les données existantes');
    
    const choice = await askQuestion('Votre choix: ');
    
    switch (choice.trim()) {
      case '1':
        console.log('\n🔄 Insertion des données hôtels principales...');
        try {
          const result = await seedHotelsData();
          if (result.success) {
            console.log(`✅ Succès: ${result.message}`);
          } else {
            console.log(`❌ Erreur: ${result.message}`);
          }
        } catch (error) {
          console.error('❌ Erreur lors de l\'insertion:', error.message);
        }
        break;
        
      case '2':
        console.log('\n⭐ Ajout des avis de démonstration...');
        try {
          await addSampleReviews();
          console.log('✅ Avis de démonstration ajoutés avec succès');
        } catch (error) {
          console.error('❌ Erreur lors de l\'ajout des avis:', error.message);
        }
        break;
        
      case '3':
        console.log('\n🏨 Ajout des hôtels supplémentaires...');
        try {
          const hotels = await addMoreHotels();
          console.log(`✅ ${hotels.length} hôtel(s) supplémentaire(s) ajouté(s)`);
        } catch (error) {
          console.error('❌ Erreur lors de l\'ajout des hôtels supplémentaires:', error.message);
        }
        break;
        
      case '4':
        console.log('\n📊 Génération du rapport des hôtels...');
        try {
          const report = await generateHotelsReport();
          if (report) {
            console.log('✅ Rapport généré avec succès');
          } else {
            console.log('❌ Erreur lors de la génération du rapport');
          }
        } catch (error) {
          console.error('❌ Erreur lors de la génération du rapport:', error.message);
        }
        break;
        
      case '5':
        console.log('\n🧹 Nettoyage et validation des données...');
        try {
          const result = await cleanAndValidateHotels();
          if (result) {
            console.log(`✅ Validation terminée: ${result.updated} hôtels mis à jour, ${result.errors} erreurs`);
          } else {
            console.log('❌ Erreur lors de la validation');
          }
        } catch (error) {
          console.error('❌ Erreur lors de la validation:', error.message);
        }
        break;
        
      case '6':
        console.log('\n🔄 Exécution complète (insertion + avis + supplémentaires + rapport)...');
        try {
          console.log('🔄 Étape 1/4: Insertion des données principales...');
          const insertResult = await seedHotelsData();
          console.log(`✅ Données principales: ${insertResult.message}`);
          
          console.log('🔄 Étape 2/4: Ajout des avis...');
          await addSampleReviews();
          console.log('✅ Avis ajoutés');
          
          console.log('🔄 Étape 3/4: Hôtels supplémentaires...');
          const moreHotels = await addMoreHotels();
          console.log(`✅ ${moreHotels.length} hôtels supplémentaires ajoutés`);
          
          console.log('🔄 Étape 4/4: Génération du rapport...');
          await generateHotelsReport();
          console.log('✅ Rapport généré');
          
          console.log('\n🎉 Exécution complète terminée avec succès!');
        } catch (error) {
          console.error('❌ Erreur lors de l\'exécution complète:', error.message);
        }
        break;
        
      case '7':
        console.log('\n📋 Liste de tous les hôtels avec IDs...');
        try {
          const result = await listAllHotelsWithIds();
          if (result.success) {
            console.log(`✅ ${result.count} hôtel(s) listé(s) (${result.activeCount} actifs, ${result.inactiveCount} inactifs)`);
          } else {
            console.log(`❌ Erreur: ${result.message}`);
          }
        } catch (error) {
          console.error('❌ Erreur lors de la liste:', error.message);
        }
        break;
        
      case '8':
        console.log('\n🔍 Recherche d\'hôtel par ID...');
        const hotelId = await askQuestion('Entrez l\'ID MongoDB de l\'hôtel à rechercher: ');
        try {
          const result = await getHotelById(hotelId.trim());
          if (result.success) {
            console.log('✅ Hôtel trouvé et affiché ci-dessus');
          } else {
            console.log(`❌ ${result.message}`);
          }
        } catch (error) {
          console.error('❌ Erreur lors de la recherche:', error.message);
        }
        break;
        
      case '9':
        console.log('\n🧹 Nettoyage des doublons...');
        try {
          const result = await removeDuplicateHotels();
          if (result.success) {
            console.log(`✅ Nettoyage terminé: ${result.duplicatesRemoved} doublons supprimés sur ${result.duplicatesFound} groupes détectés`);
          } else {
            console.log(`❌ Erreur: ${result.message}`);
          }
        } catch (error) {
          console.error('❌ Erreur lors du nettoyage des doublons:', error.message);
        }
        break;
        
      case '10':
        console.log('\n🗑️ Suppression de tous les hôtels...');
        try {
          const result = await deleteAllHotels();
          if (result.success) {
            console.log(`✅ ${result.message}`);
          } else {
            console.log(`❌ ${result.message}`);
          }
        } catch (error) {
          console.error('❌ Erreur lors de la suppression:', error.message);
        }
        break;
        
      case '11':
        console.log('\n🔄 Recréation complète des hôtels...');
        try {
          const result = await recreateAllHotels();
          if (result.success) {
            console.log(`✅ Recréation réussie: ${result.before} hôtels supprimés, ${result.after} hôtels recréés`);
          } else {
            console.log(`❌ ${result.message}`);
          }
        } catch (error) {
          console.error('❌ Erreur lors de la recréation:', error.message);
        }
        break;
        
      case '0':
        console.log('\n👋 Au revoir! Merci d\'avoir utilisé le gestionnaire d\'hôtels.');
        break;
        
      default:
        console.log('\n❌ Choix invalide. Veuillez entrer un numéro entre 0 et 11.');
        
        // Demander si l'utilisateur veut réessayer
        const retry = await askQuestion('Voulez-vous réessayer ? (o/n): ');
        if (retry.toLowerCase() === 'o' || retry.toLowerCase() === 'oui') {
          rl.close();
          return runEnhancedInteractiveMenu(); // Relancer le menu
        }
        break;
    }
    
  } catch (error) {
    console.error('❌ Erreur dans le menu interactif:', error.message);
  } finally {
    rl.close();
  }
  
  // Demander si l'utilisateur veut continuer (sauf pour quitter)
  if (choice.trim() !== '0') {
    const rl2 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    try {
      console.log('\n' + '='.repeat(60));
      const continueChoice = await new Promise(resolve => {
        rl2.question('Voulez-vous effectuer une autre action ? (o/n): ', resolve);
      });
      
      if (continueChoice.toLowerCase() === 'o' || continueChoice.toLowerCase() === 'oui') {
        rl2.close();
        return runEnhancedInteractiveMenu(); // Relancer le menu
      } else {
        console.log('\n👋 Au revoir!');
      }
    } catch (error) {
      console.error('❌ Erreur:', error.message);
    } finally {
      rl2.close();
    }
  }
}
// Nouvelles fonctions à ajouter à votre script existant

// Fonction pour supprimer tous les hôtels
async function deleteAllHotels() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise(resolve => rl.question(question, resolve));
  };
  
  try {
    console.log('🔍 Diagnostic avant suppression...');
    
    // Vérifier la connexion
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB non connecté');
      rl.close();
      return { success: false, message: 'Base de données non connectée' };
    }
    
    console.log('✅ MongoDB connecté à:', mongoose.connection.db.databaseName);
    console.log('📋 Collection ciblée:', HotelDetails.collection.name);
    
    // Compter avec différentes méthodes
    const countMethod1 = await HotelDetails.countDocuments();
    const countMethod2 = await HotelDetails.estimatedDocumentCount();
    const actualDocs = await HotelDetails.find({}).limit(5);
    
    console.log(`📊 Comptage countDocuments(): ${countMethod1}`);
    console.log(`📊 Comptage estimatedDocumentCount(): ${countMethod2}`);
    console.log(`📋 Échantillon de documents trouvés: ${actualDocs.length}`);
    
    if (actualDocs.length > 0) {
      console.log('Premier document trouvé:', {
        id: actualDocs[0]._id,
        title: actualDocs[0].title,
        createdAt: actualDocs[0].createdAt
      });
    }
    
    if (countMethod1 === 0) {
      console.log('ℹ️  Aucun hôtel trouvé dans la collection');
      rl.close();
      return { success: true, message: 'Aucun hôtel à supprimer', deletedCount: 0 };
    }
    
    console.log('\n⚠️  === SUPPRESSION DE TOUS LES HÔTELS ===');
    console.log(`Vous allez supprimer ${countMethod1} hôtel(s) de la base ${mongoose.connection.db.databaseName}`);
    
    const confirm1 = await askQuestion('Tapez "SUPPRIMER" pour confirmer: ');
    if (confirm1 !== 'SUPPRIMER') {
      console.log('❌ Suppression annulée');
      rl.close();
      return { success: false, message: 'Suppression annulée' };
    }
    
    const confirm2 = await askQuestion('Dernière chance. Tapez "OUI DEFINITIF": ');
    if (confirm2 !== 'OUI DEFINITIF') {
      console.log('❌ Suppression annulée');
      rl.close();
      return { success: false, message: 'Suppression annulée' };
    }
    
    rl.close();
    
    console.log('\n🗑️  Suppression en cours...');
    
    // Méthode 1: deleteMany
    console.log('Tentative 1: deleteMany()');
    const result1 = await HotelDetails.deleteMany({});
    console.log('Résultat deleteMany:', result1);
    
    // Vérifier si la suppression a fonctionné
    const remainingCount = await HotelDetails.countDocuments();
    console.log(`Documents restants après deleteMany: ${remainingCount}`);
    
    if (remainingCount > 0) {
      console.log('⚠️  deleteMany n\'a pas tout supprimé, tentative alternative...');
      
      // Méthode 2: Suppression directe via la collection MongoDB native
      console.log('Tentative 2: collection.deleteMany()');
      const result2 = await HotelDetails.collection.deleteMany({});
      console.log('Résultat collection.deleteMany:', result2);
      
      // Vérification finale
      const finalCount = await HotelDetails.countDocuments();
      console.log(`Documents restants après collection.deleteMany: ${finalCount}`);
      
      if (finalCount > 0) {
        console.log('⚠️  Suppression partielle. Tentative de drop de la collection...');
        
        // Méthode 3: Drop de la collection entière
        try {
          await HotelDetails.collection.drop();
          console.log('✅ Collection supprimée complètement');
          
          // Recréer la collection avec les index
          await HotelDetails.createCollection();
          console.log('✅ Collection recréée');
          
        } catch (dropError) {
          console.log('❌ Erreur lors du drop:', dropError.message);
        }
      }
    }
    
    const finalFinalCount = await HotelDetails.countDocuments();
    const totalDeleted = countMethod1 - finalFinalCount;
    
    console.log(`\n✅ Suppression terminée:`);
    console.log(`   - Documents initiaux: ${countMethod1}`);
    console.log(`   - Documents supprimés: ${totalDeleted}`);
    console.log(`   - Documents restants: ${finalFinalCount}`);
    
    return {
      success: finalFinalCount === 0,
      message: `${totalDeleted} hôtels supprimés, ${finalFinalCount} restants`,
      deletedCount: totalDeleted,
      remainingCount: finalFinalCount
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    rl.close();
    return {
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    };
  }
}

// Fonction pour afficher tous les hôtels avec leurs IDs
async function listAllHotelsWithIds() {
  try {
    console.log('📋 === LISTE DES HÔTELS AVEC IDS ===\n');
    
    const hotels = await HotelDetails.find({})
      .select('_id title location region_Name averageRating price.minPrice price.maxPrice isActive createdAt')
      .sort({ region_Name: 1, title: 1 });
    
    if (hotels.length === 0) {
      console.log('ℹ️  Aucun hôtel trouvé dans la base de données');
      return { success: true, count: 0, hotels: [] };
    }
    
    console.log(`Total: ${hotels.length} hôtel(s) trouvé(s)\n`);
    
    // Grouper par région
    const hotelsByRegion = hotels.reduce((acc, hotel) => {
      const region = hotel.region_Name || 'Non définie';
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(hotel);
      return acc;
    }, {});
    
    // Afficher par région
    Object.keys(hotelsByRegion).forEach(region => {
      console.log(`📍 === ${region.toUpperCase()} ===`);
      
      hotelsByRegion[region].forEach(hotel => {
        const status = hotel.isActive ? '🟢' : '🔴';
        const priceRange = hotel.price?.minPrice && hotel.price?.maxPrice 
          ? `${hotel.price.minPrice.toLocaleString()} - ${hotel.price.maxPrice.toLocaleString()} FCFA`
          : 'Prix non défini';
        const rating = hotel.averageRating ? `⭐ ${hotel.averageRating}/5` : '📊 Non noté';
        const createdDate = hotel.createdAt ? hotel.createdAt.toLocaleDateString('fr-FR') : 'Date inconnue';
        
        console.log(`${status} ${hotel.title}`);
        console.log(`   ID MongoDB: ${hotel._id}`);
        console.log(`   Localisation: ${hotel.location || 'Non définie'}`);
        console.log(`   Prix: ${priceRange}`);
        console.log(`   ${rating}`);
        console.log(`   Créé le: ${createdDate}`);
        console.log('   ' + '-'.repeat(50));
      });
      
      console.log('');
    });
    
    // Statistiques rapides
    const activeCount = hotels.filter(h => h.isActive).length;
    const inactiveCount = hotels.length - activeCount;
    
    console.log('📊 === STATISTIQUES ===');
    console.log(`🟢 Hôtels actifs: ${activeCount}`);
    console.log(`🔴 Hôtels inactifs: ${inactiveCount}`);
    console.log(`📍 Régions représentées: ${Object.keys(hotelsByRegion).length}`);
    
    // Sauvegarder dans un fichier JSON pour référence
    const fs = require('fs');
    const exportData = hotels.map(hotel => ({
      id: hotel._id.toString(),
      title: hotel.title,
      location: hotel.location,
      region: hotel.region_Name,
      isActive: hotel.isActive,
      createdAt: hotel.createdAt
    }));
    
    fs.writeFileSync('hotels_ids_export.json', JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Liste exportée dans: hotels_ids_export.json`);
    
    return {
      success: true,
      count: hotels.length,
      activeCount,
      inactiveCount,
      hotels: exportData
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération:', error.message);
    return {
      success: false,
      message: 'Erreur lors de la récupération des hôtels',
      error: error.message
    };
  }
}

// Fonction pour nettoyer les doublons
async function removeDuplicateHotels() {
  try {
    console.log('🔍 === RECHERCHE DE DOUBLONS ===\n');
    
    // Trouver les doublons basés sur title et location
    const duplicates = await HotelDetails.aggregate([
      {
        $group: {
          _id: { title: "$title", location: "$location" },
          count: { $sum: 1 },
          docs: { $push: { _id: "$_id", createdAt: "$createdAt", title: "$title", location: "$location" } }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);
    
    if (duplicates.length === 0) {
      console.log('✅ Aucun doublon détecté');
      return { success: true, duplicatesFound: 0, duplicatesRemoved: 0 };
    }
    
    console.log(`⚠️  ${duplicates.length} groupe(s) de doublons détecté(s):\n`);
    
    let totalDuplicatesRemoved = 0;
    
    for (const duplicate of duplicates) {
      const { title, location } = duplicate._id;
      const docs = duplicate.docs;
      
      console.log(`🔁 Doublon détecté: "${title}" à "${location}"`);
      console.log(`   Nombre d'exemplaires: ${docs.length}`);
      
      // Trier par date de création (garder le plus ancien)
      docs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      const keepDoc = docs[0]; // Garder le plus ancien
      const deleteIds = docs.slice(1).map(doc => doc._id); // Supprimer les autres
      
      console.log(`   📌 Gardé: ${keepDoc._id} (créé le ${new Date(keepDoc.createdAt).toLocaleString()})`);
      
      for (let i = 1; i < docs.length; i++) {
        console.log(`   🗑️  Supprimé: ${docs[i]._id} (créé le ${new Date(docs[i].createdAt).toLocaleString()})`);
      }
      
      // Supprimer les doublons
      const deleteResult = await HotelDetails.deleteMany({ _id: { $in: deleteIds } });
      totalDuplicatesRemoved += deleteResult.deletedCount;
      
      console.log(`   ✅ ${deleteResult.deletedCount} doublon(s) supprimé(s)\n`);
    }
    
    console.log(`🎉 Nettoyage terminé: ${totalDuplicatesRemoved} doublons supprimés`);
    
    return {
      success: true,
      duplicatesFound: duplicates.length,
      duplicatesRemoved: totalDuplicatesRemoved
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des doublons:', error.message);
    return {
      success: false,
      message: 'Erreur lors du nettoyage des doublons',
      error: error.message
    };
  }
}

// Fonction pour recréer les hôtels (nettoyage complet + réinsertion)
async function recreateAllHotels() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise(resolve => rl.question(question, resolve));
  };
  
  try {
    console.log('🔄 === RÉCRÉATION COMPLÈTE DES HÔTELS ===');
    console.log('Cette action va:');
    console.log('1. Supprimer tous les hôtels existants');
    console.log('2. Recréer les hôtels depuis les données du script');
    console.log('3. Ajouter les avis de démonstration');
    
    const confirm = await askQuestion('\nConfirmer la récréation complète ? Tapez "RECREER" pour continuer: ');
    
    if (confirm !== 'RECREER') {
      console.log('❌ Récréation annulée');
      rl.close();
      return { success: false, message: 'Récréation annulée' };
    }
    
    rl.close();
    
    console.log('\n🔄 Début de la récréation...\n');
    
    // Étape 1: Supprimer tous les hôtels
    console.log('📋 Étape 1/4: Suppression de tous les hôtels...');
    const countBefore = await HotelDetails.countDocuments();
    console.log(`   📊 ${countBefore} hôtels trouvés`);
    
    const deleteResult = await HotelDetails.deleteMany({});
    console.log(`   🗑️  ${deleteResult.deletedCount} hôtels supprimés\n`);
    
    // Étape 2: Nettoyer les doublons dans les données source
    console.log('📋 Étape 2/4: Validation des données source...');
    const uniqueTitles = new Set();
    const cleanedData = [];
    
    for (const hotel of hotelsData) {
      const identifier = `${hotel.title}_${hotel.location}`;
      
      if (uniqueTitles.has(identifier)) {
        console.log(`   ⚠️  Doublon détecté dans les données: ${hotel.title}`);
        continue;
      }
      
      uniqueTitles.add(identifier);
      cleanedData.push(hotel);
    }
    
    console.log(`   ✅ ${cleanedData.length} hôtels uniques validés\n`);
    
    // Étape 3: Recréer les hôtels
    console.log('📋 Étape 3/4: Insertion des nouveaux hôtels...');
    const insertResult = await seedHotelsDataClean(cleanedData);
    
    if (!insertResult.success) {
      throw new Error(`Erreur insertion: ${insertResult.message}`);
    }
    
    console.log(`   ✅ ${insertResult.data.length} hôtels créés\n`);
    
    // Étape 4: Ajouter les avis
    console.log('📋 Étape 4/4: Ajout des avis de démonstration...');
    await addSampleReviews();
    console.log('   ✅ Avis ajoutés\n');
    
    // Rapport final
    console.log('🎉 === RÉCRÉATION TERMINÉE ===');
    const finalReport = await generateHotelsReport();
    
    return {
      success: true,
      message: 'Récréation complète réussie',
      before: countBefore,
      after: insertResult.data.length,
      report: finalReport
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de la récréation:', error.message);
    return {
      success: false,
      message: 'Erreur lors de la récréation',
      error: error.message
    };
  }
}

// Version nettoyée de seedHotelsData (sans les doublons)
async function seedHotelsDataClean(dataToInsert = hotelsData) {
  try {
    const insertedHotels = [];
    
    for (const hotelData of dataToInsert) {
      try {
        const adminInfo = {
          userId: new mongoose.Types.ObjectId(),
          role: 'superAdmin',
          username: 'admin_system'
        };
        
        const completeHotelData = {
          ...hotelData,
          createdBy: adminInfo,
          lastEditedBy: {
            ...adminInfo,
            editedAt: new Date()
          },
          favoritedBy: [],
          reviews: [],
          version: 1
        };
        
        const hotel = new HotelDetails(completeHotelData);
        await hotel.save();
        
        insertedHotels.push({
          id: hotel._id,
          title: hotel.title,
          location: hotel.location,
          region: hotel.region_Name,
          rating: hotel.averageRating,
          priceRange: `${hotel.price.minPrice} - ${hotel.price.maxPrice} FCFA`
        });
        
        console.log(`   ✅ Créé: ${hotel.title} (${hotel.region_Name})`);
        
      } catch (hotelError) {
        console.error(`   ❌ Erreur création ${hotelData.title}:`, hotelError.message);
      }
    }
    
    return {
      success: true,
      message: `${insertedHotels.length} hôtels insérés avec succès`,
      data: insertedHotels
    };
    
  } catch (error) {
    console.error('❌ Erreur générale lors de l\'insertion:', error);
    return {
      success: false,
      message: 'Erreur lors de l\'insertion des données',
      error: error.message
    };
  }
}

// Fonction pour obtenir un hôtel spécifique par ID
async function getHotelById(hotelId) {
  try {
    console.log(`🔍 Recherche de l'hôtel ID: ${hotelId}`);
    
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      console.log('❌ ID MongoDB invalide');
      return { success: false, message: 'ID invalide' };
    }
    
    const hotel = await HotelDetails.findById(hotelId);
    
    if (!hotel) {
      console.log('❌ Hôtel non trouvé');
      return { success: false, message: 'Hôtel non trouvé' };
    }
    
    console.log(`✅ Hôtel trouvé: ${hotel.title}`);
    console.log(`   Région: ${hotel.region_Name}`);
    console.log(`   Localisation: ${hotel.location}`);
    console.log(`   Prix: ${hotel.price?.minPrice || 0} - ${hotel.price?.maxPrice || 0} FCFA`);
    console.log(`   Note: ${hotel.averageRating || 'Non noté'}/5`);
    console.log(`   Statut: ${hotel.isActive ? 'Actif' : 'Inactif'}`);
    console.log(`   Créé le: ${hotel.createdAt ? hotel.createdAt.toLocaleString() : 'Date inconnue'}`);
    
    return {
      success: true,
      data: hotel
    };
    
  } catch (error) {
    console.error('❌ Erreur recherche hôtel:', error.message);
    return {
      success: false,
      message: 'Erreur lors de la recherche',
      error: error.message
    };
  }
}

// Menu interactif mis à jour
async function runEnhancedInteractiveMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise(resolve => rl.question(question, resolve));
  };
  
  console.log('\n🏨 === GESTIONNAIRE DE DONNÉES HÔTELS (VERSION AMÉLIORÉE) ===');
  console.log('1.  Insérer les données hôtels principales');
  console.log('2.  Ajouter des avis de démonstration');
  console.log('3.  Ajouter des hôtels supplémentaires');
  console.log('4.  Générer un rapport des hôtels');
  console.log('5.  Nettoyer et valider les données');
  console.log('6.  Tout exécuter (1+2+3)');
  console.log('7.  📋 NOUVEAU: Lister tous les hôtels avec leurs IDs');
  console.log('8.  🧹 NOUVEAU: Nettoyer les doublons');
  console.log('9.  🗑️  NOUVEAU: Supprimer tous les hôtels');
  console.log('10. 🔄 NOUVEAU: Recréer tous les hôtels (nettoyage complet)');
  console.log('11. 🔍 NOUVEAU: Rechercher un hôtel par ID');
  console.log('0.  Quitter');
  
  const choice = await askQuestion('\nVotre choix: ');
  
  switch (choice) {
    case '1':
      await seedHotelsData();
      break;
    case '2':
      await addSampleReviews();
      break;
    case '3':
      await addMoreHotels();
      break;
    case '4':
      await generateHotelsReport();
      break;
    case '5':
      await cleanAndValidateHotels();
      break;
    case '6':
      await seedHotelsData();
      await addSampleReviews();
      await addMoreHotels();
      await generateHotelsReport();
      break;
    case '7':
      await listAllHotelsWithIds();
      break;
    case '8':
      await removeDuplicateHotels();
      break;
    case '9':
      await deleteAllHotels();
      break;
    case '10':
      await recreateAllHotels();
      break;
    case '11':
      const hotelId = await askQuestion('Entrez l\'ID de l\'hôtel à rechercher: ');
      await getHotelById(hotelId.trim());
      break;
    case '0':
      console.log('👋 Au revoir!');
      break;
    default:
      console.log('❌ Choix invalide');
  }
  
  rl.close();
}

// Export des nouvelles fonctions
module.exports = {
  // Fonctions existantes...
  seedHotelsData,
  addSampleReviews,
  addMoreHotels,
  updateHotelData,
  generateHotelsReport,
  cleanAndValidateHotels,
  hotelsData,
  
  // Nouvelles fonctions
  deleteAllHotels,
  listAllHotelsWithIds,
  removeDuplicateHotels,
  recreateAllHotels,
  seedHotelsDataClean,
  getHotelById,
  runEnhancedInteractiveMenu
};






// Exécution directe du script si appelé directement
// Dans la section "if (require.main === module)" de votre script, ajoutez:

if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';
  
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('📡 Connecté à MongoDB');
      
      const args = process.argv.slice(2);
      
      // AJOUTEZ CES NOUVELLES CONDITIONS EN PREMIER :
      if (args.includes('--delete-all') || args.includes('-da')) {
        await deleteAllHotels();
      } else if (args.includes('--list-ids') || args.includes('-l')) {
        await listAllHotelsWithIds();
      } else if (args.includes('--clean-duplicates') || args.includes('-cd')) {
        await removeDuplicateHotels();
      } else if (args.includes('--recreate') || args.includes('-rc')) {
        await recreateAllHotels();
      } else if (args.includes('--find-hotel')) {
        const hotelId = args[args.indexOf('--find-hotel') + 1];
        if (hotelId) {
          await getHotelById(hotelId);
        } else {
          console.log('❌ Veuillez fournir un ID d\'hôtel');
        }
      } else if (args.includes('--diagnostic') || args.includes('-d')) {
        await diagnoseMongoDB();
      } else if (args.includes('--interactive') || args.includes('-i')) {
        await runEnhancedInteractiveMenu();
      } else if (args.includes('--report') || args.includes('-r')) {
        await generateHotelsReport();
      } else if (args.includes('--clean') || args.includes('-c')) {
        await cleanAndValidateHotels();
      } else {
        // Comportement par défaut (ce qui s'est exécuté)
        const result = await seedHotelsData();
        console.log('Résultat insertion:', result);
        await addSampleReviews();
        await generateHotelsReport();
      }
      
      console.log('🎉 Script terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur connexion MongoDB:', error);
      process.exit(1);
    });
}
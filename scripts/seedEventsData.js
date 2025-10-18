// scripts/seedEventsData.js - VERSION FINALE AVEC 8 CATÉGORIES (2 ÉVÉNEMENTS CHACUNE)
const mongoose = require('mongoose');
const EventDetails = require('../models/EventDetails');

// Données des événements - 2 par catégorie (16 événements au total)
const eventsData = [
  // ===== CATÉGORIE: FESTIVAL (2 événements) =====
  {
    title: "Festival de Jazz de Saint-Louis",
    location: "Place Faidherbe, Saint-Louis",
    region_Name: "Saint-Louis",
    category: "festival",
    description: "Le Festival de Jazz de Saint-Louis est l'un des événements culturels les plus prestigieux du Sénégal et de l'Afrique de l'Ouest. Chaque année, cet événement exceptionnel transforme la ville historique de Saint-Louis en capitale mondiale du jazz, attirant des milliers de mélomanes et des artistes de renommée internationale.",
    longDescription: "Depuis sa création, le Festival de Jazz de Saint-Louis s'est imposé comme un rendez-vous incontournable pour les amateurs de musique du monde entier. L'événement se déroule dans plusieurs lieux emblématiques de la ville.",
    coordinates: { latitude: 16.0186, longitude: -16.4897 },
    date: "15-18 mai 2025",
    time: "18h00 - 02h00",
    eventDates: {
      startDate: new Date('2025-05-15T18:00:00'),
      endDate: new Date('2025-05-18T02:00:00')
    },
    organisateur: "Association Saint-Louis Jazz",
    contact: { phone: "+221 33 961 19 02", email: "info@saintlouisjazz.org" },
    price: { solo: "25.000 Fcfa", couple: "45.000 Fcfa", group: "20.000 Fcfa/personne" },
    priceRange: { min: 20000, max: 45000 },
    highlights: ["Artistes internationaux de jazz", "Concerts en plein air", "Sessions jam spontanées"],
    inclusions: ["Accès à tous les concerts", "Programme officiel", "Transport depuis Dakar"],
    exclusions: ["Hébergement", "Repas", "Boissons"],
    capacity: { total: 5000, remaining: 5000 },
    eventImage: "/assets/images/events/saint-louis/jazz-festival.jpg",
    images: ["/assets/images/events/saint-louis/jazz-festival.jpg"],
    isAvailable: true,
    isFeatured: true
  },
  {
    title: "Festival des Arts de Rue de Dakar",
    location: "Place de l'Indépendance, Dakar",
    region_Name: "Dakar",
    category: "festival",
    description: "Un festival vibrant célébrant les arts de rue sénégalais avec des performances de hip-hop, breakdance, graffiti et théâtre de rue. Trois jours d'expression artistique urbaine dans le cœur de Dakar.",
    longDescription: "Ce festival met en lumière la créativité urbaine sénégalaise avec des battles de danse, des concours de graffiti, des concerts de rap et des spectacles de rue.",
    coordinates: { latitude: 14.6928, longitude: -17.4467 },
    date: "8-10 juin 2025",
    time: "16h00 - 23h00",
    eventDates: {
      startDate: new Date('2025-06-08T16:00:00'),
      endDate: new Date('2025-06-10T23:00:00')
    },
    organisateur: "Collectif Hip-Hop Dakar",
    contact: { phone: "+221 77 123 45 67", email: "contact@festivalartsrue.sn" },
    price: { solo: "10.000 Fcfa", couple: "18.000 Fcfa", group: "8.000 Fcfa/personne" },
    priceRange: { min: 8000, max: 18000 },
    highlights: ["Battles de breakdance", "Concours de graffiti", "Concerts hip-hop"],
    inclusions: ["Accès à tous les spectacles", "Ateliers participatifs", "Restauration locale"],
    exclusions: ["Transport", "Hébergement"],
    capacity: { total: 3000, remaining: 3000 },
    eventImage: "/assets/images/events/dakar/arts-rue-festival.jpg",
    images: ["/assets/images/events/dakar/arts-rue-festival.jpg"],
    isAvailable: true
  },

  // ===== CATÉGORIE: EXCURSION (2 événements) =====
  {
    title: "Excursion aux Îles de la Madeleine",
    location: "Départ Port de Dakar vers Îles de la Madeleine",
    region_Name: "Dakar",
    category: "excursion",
    description: "Découverte des magnifiques Îles de la Madeleine, le plus petit parc national du Sénégal. Une journée d'évasion entre plages paradisiaques, baobabs centenaires et observation d'oiseaux marins dans un cadre naturel préservé.",
    longDescription: "Cette excursion d'une journée combine transport en pirogue, visite guidée du parc national, baignade dans des eaux cristallines et déjeuner traditionnel sur la plage. Les îles abritent une flore unique et des espèces d'oiseaux rares.",
    coordinates: { latitude: 14.6667, longitude: -17.5167 },
    date: "Tous les samedis",
    time: "08h00 - 17h00",
    eventDates: {
      startDate: new Date('2025-03-01T08:00:00'),
      endDate: new Date('2025-11-30T17:00:00')
    },
    organisateur: "Sénégal Excursions Nature",
    contact: { phone: "+221 77 456 78 90", email: "iles@senegal-excursions.sn" },
    price: { solo: "35.000 Fcfa", couple: "65.000 Fcfa", group: "30.000 Fcfa/personne" },
    priceRange: { min: 30000, max: 65000 },
    highlights: ["Transport en pirogue", "Parc national protégé", "Plages vierges", "Observation oiseaux"],
    inclusions: ["Transport maritime", "Guide naturaliste", "Déjeuner plage", "Équipement snorkeling"],
    exclusions: ["Transport vers le port", "Boissons", "Pourboires"],
    capacity: { total: 25, remaining: 25 },
    eventImage: "/assets/images/events/dakar/iles-madeleine.jpg",
    images: ["/assets/images/events/dakar/iles-madeleine.jpg"],
    isAvailable: true
  },
  {
    title: "Safari Photo dans le Delta du Saloum",
    location: "Départ Kaolack vers Delta du Saloum",
    region_Name: "Kaolack",
    category: "excursion",
    description: "Safari photo de 2 jours dans le Delta du Saloum, site classé au patrimoine mondial de l'UNESCO. Découverte de la mangrove, des bolongs, de la faune sauvage et des villages traditionnels sérères.",
    longDescription: "Cette excursion combine navigation dans les bolongs, observation de la faune (lamantins, oiseaux, singes), visite de villages traditionnels et nuit en campement écologique au cœur du delta.",
    coordinates: { latitude: 13.8333, longitude: -16.1167 },
    date: "Week-ends (sam-dim)",
    time: "07h00 (J1) - 18h00 (J2)",
    eventDates: {
      startDate: new Date('2025-02-15T07:00:00'),
      endDate: new Date('2025-06-30T18:00:00')
    },
    organisateur: "Delta Aventures Eco-Tours",
    contact: { phone: "+221 33 941 55 66", email: "safari@delta-aventures.sn" },
    price: { solo: "85.000 Fcfa", couple: "150.000 Fcfa", group: "75.000 Fcfa/personne" },
    priceRange: { min: 75000, max: 150000 },
    highlights: ["Navigation en pirogue", "Observation faune sauvage", "Villages traditionnels", "Campement écologique"],
    inclusions: ["Transport 4x4", "Pirogue + guide", "Hébergement campement", "Tous les repas", "Matériel photo"],
    exclusions: ["Équipement personnel", "Boissons alcoolisées", "Assurance voyage"],
    capacity: { total: 12, remaining: 12 },
    eventImage: "/assets/images/events/kaolack/safari-saloum.jpg",
    images: ["/assets/images/events/kaolack/safari-saloum.jpg"],
    isAvailable: true
  },

  // ===== CATÉGORIE: NIGHTLIFE (2 événements) =====
  {
    title: "Soirée Afrobeat au King Fahd Palace",
    location: "King Fahd Palace Hotel, Dakar",
    region_Name: "Dakar",
    category: "nightlife",
    description: "La plus grande soirée afrobeat de Dakar dans le cadre luxueux du King Fahd Palace. DJs internationaux, cocktails signature et ambiance électrisante jusqu'au petit matin sur la terrasse avec vue sur l'océan.",
    longDescription: "Cette soirée mensuelle rassemble les amateurs de musiques africaines modernes dans un setting premium. Afrobeat, amapiano, coupé-décalé et derniers hits africains.",
    coordinates: { latitude: 14.7167, longitude: -17.4761 },
    date: "Premier samedi du mois",
    time: "22h00 - 05h00",
    eventDates: {
      startDate: new Date('2025-03-01T22:00:00'),
      endDate: new Date('2025-12-31T05:00:00')
    },
    organisateur: "Afro Night Productions",
    contact: { phone: "+221 77 999 88 77", email: "afronight@kingfahd.sn" },
    price: { solo: "30.000 Fcfa", couple: "50.000 Fcfa", group: "25.000 Fcfa/personne" },
    priceRange: { min: 25000, max: 50000 },
    highlights: ["DJs internationaux", "Cocktails signature", "Vue océan", "Ambiance premium"],
    inclusions: ["Entrée VIP", "Premier cocktail", "Accès terrasse", "Vestiaire"],
    exclusions: ["Consommations supplémentaires", "Transport", "Service voiturier"],
    capacity: { total: 800, remaining: 800 },
    eventImage: "/assets/images/events/dakar/afrobeat-night.jpg",
    images: ["/assets/images/events/dakar/afrobeat-night.jpg"],
    isAvailable: true
  },
  {
    title: "Nuit Salsa Bachata à Almadies",
    location: "Club Karamel, Almadies",
    region_Name: "Dakar",
    category: "nightlife",
    description: "Soirée dansante dédiée aux rythmes latins dans l'un des clubs les plus populaires d'Almadies. Cours de salsa, bachata et kizomba avec instructeurs professionnels, puis soirée dansante jusqu'à l'aube.",
    longDescription: "Cette soirée hebdomadaire propose une initiation aux danses latines suivie d'une soirée libre avec orchestre live et DJs spécialisés dans les rythmes caribéens et latino-américains.",
    coordinates: { latitude: 14.7500, longitude: -17.4833 },
    date: "Tous les vendredis",
    time: "20h00 - 04h00",
    eventDates: {
      startDate: new Date('2025-02-01T20:00:00'),
      endDate: new Date('2025-12-31T04:00:00')
    },
    organisateur: "Salsa Dakar Academy",
    contact: { phone: "+221 77 555 66 77", email: "salsa@karamel-club.sn" },
    price: { solo: "20.000 Fcfa", couple: "35.000 Fcfa", group: "18.000 Fcfa/personne" },
    priceRange: { min: 18000, max: 35000 },
    highlights: ["Cours de danse inclus", "Orchestres live", "Ambiance latino", "Piste de danse géante"],
    inclusions: ["Cours débutants", "Première consommation", "Accès toute la soirée"],
    exclusions: ["Consommations supplémentaires", "Cours privés", "Transport"],
    capacity: { total: 400, remaining: 400 },
    eventImage: "/assets/images/events/dakar/salsa-night.jpg",
    images: ["/assets/images/events/dakar/salsa-night.jpg"],
    isAvailable: true
  },

  // ===== CATÉGORIE: CONFERENCE (2 événements) =====
  {
    title: "Forum Économique Africa Rising",
    location: "Centre International de Conférences Abdou Diouf, Dakar",
    region_Name: "Dakar",
    category: "conference",
    description: "Africa Rising est le principal forum économique dédié à l'émergence africaine et aux opportunités d'investissement sur le continent. Trois jours de conférences avec les décideurs économiques africains et internationaux.",
    longDescription: "Le forum aborde les grands enjeux de développement : transformation digitale, infrastructure, agrobusiness, énergies renouvelables et finance inclusive.",
    coordinates: { latitude: 14.7167, longitude: -17.4761 },
    date: "15-17 septembre 2025",
    time: "08h00 - 18h00",
    eventDates: {
      startDate: new Date('2025-09-15T08:00:00'),
      endDate: new Date('2025-09-17T18:00:00')
    },
    organisateur: "Africa Business Network",
    contact: { phone: "+221 33 869 47 20", email: "registration@africarising.org" },
    price: { solo: "150.000 Fcfa", couple: "270.000 Fcfa", group: "120.000 Fcfa/personne" },
    priceRange: { min: 120000, max: 270000 },
    highlights: ["Intervenants internationaux", "Networking privilégié", "Exposition commerciale"],
    inclusions: ["Accès sessions plénières", "Déjeuners d'affaires", "Kit participant"],
    exclusions: ["Hébergement", "Transport international", "Dîners de gala"],
    capacity: { total: 1200, remaining: 1200 },
    eventImage: "/assets/images/events/dakar/africa-rising-forum.jpg",
    images: ["/assets/images/events/dakar/africa-rising-forum.jpg"],
    isAvailable: true
  },
  {
    title: "Sommet de la Santé Digitale en Afrique",
    location: "Hôtel Radisson Blu, Dakar",
    region_Name: "Dakar",
    category: "conference",
    description: "Le premier sommet dédié à la transformation digitale du secteur de la santé en Afrique. Experts, innovateurs et décideurs politiques explorent l'avenir de la e-santé sur le continent.",
    longDescription: "Ce sommet explore la télémédecine, l'intelligence artificielle médicale, les applications de santé mobile et les politiques publiques de digitalisation sanitaire.",
    coordinates: { latitude: 14.6937, longitude: -17.4441 },
    date: "5-6 novembre 2025",
    time: "09h00 - 17h00",
    eventDates: {
      startDate: new Date('2025-11-05T09:00:00'),
      endDate: new Date('2025-11-06T17:00:00')
    },
    organisateur: "Health Tech Africa",
    contact: { phone: "+221 33 889 12 34", email: "summit@healthtech-africa.org" },
    price: { solo: "85.000 Fcfa", couple: "150.000 Fcfa", group: "70.000 Fcfa/personne" },
    priceRange: { min: 70000, max: 150000 },
    highlights: ["Innovations e-santé", "Démonstrations tech", "Études de cas africains"],
    inclusions: ["Conférences et ateliers", "Déjeuner networking", "Accès expo tech"],
    exclusions: ["Hébergement", "Transport", "Formations certifiantes"],
    capacity: { total: 600, remaining: 600 },
    eventImage: "/assets/images/events/dakar/health-tech-summit.jpg",
    images: ["/assets/images/events/dakar/health-tech-summit.jpg"],
    isAvailable: true
  },

  // ===== CATÉGORIE: CULTURE (2 événements) =====
  {
    title: "Biennale de l'Art Africain Contemporain Dak'Art",
    location: "Divers lieux culturels, Dakar",
    region_Name: "Dakar",
    category: "culture",
    description: "La Biennale de Dakar est le plus important événement artistique contemporain d'Afrique. Cette manifestation culturelle d'envergure internationale présente les œuvres des meilleurs artistes contemporains africains et de la diaspora.",
    longDescription: "Créée en 1992, Dak'Art s'est imposée comme la référence en matière d'art contemporain africain. La biennale investit toute la ville avec des expositions dans les galeries, musées et espaces alternatifs.",
    coordinates: { latitude: 14.6928, longitude: -17.4467 },
    date: "3-31 mai 2025",
    time: "10h00 - 19h00",
    eventDates: {
      startDate: new Date('2025-05-03T10:00:00'),
      endDate: new Date('2025-05-31T19:00:00')
    },
    organisateur: "Consortium Dak'Art",
    contact: { phone: "+221 33 823 03 18", email: "info@dakart.org" },
    fixedPrice: 15000,
    priceRange: { min: 15000, max: 15000 },
    highlights: ["Plus de 200 artistes exposés", "Visite guidée", "Rencontre avec artistes"],
    inclusions: ["Pass expositions", "Catalogue officiel", "Visite guidée"],
    exclusions: ["Transport", "Repas", "Achats d'œuvres"],
    capacity: { total: 2000, remaining: 2000 },
    eventImage: "/assets/images/events/dakar/dakart-biennale.jpg",
    images: ["/assets/images/events/dakar/dakart-biennale.jpg"],
    isAvailable: true,
    isFeatured: true
  },
  {
    title: "Semaine du Patrimoine de Gorée",
    location: "Île de Gorée, Dakar",
    region_Name: "Dakar",
    category: "culture",
    description: "Une semaine dédiée à la découverte et à la préservation du patrimoine historique de l'île de Gorée, site classé au patrimoine mondial de l'UNESCO. Visites guidées, conférences historiques et spectacles traditionnels.",
    longDescription: "Cet événement met en valeur l'importance historique de Gorée avec des reconstitutions historiques, des témoignages d'anciens, et des initiatives de préservation culturelle.",
    coordinates: { latitude: 14.6671, longitude: -17.3989 },
    date: "21-27 avril 2025",
    time: "09h00 - 18h00",
    eventDates: {
      startDate: new Date('2025-04-21T09:00:00'),
      endDate: new Date('2025-04-27T18:00:00')
    },
    organisateur: "Conservatoire de Gorée",
    contact: { phone: "+221 33 842 56 78", email: "patrimoine@goree.sn" },
    price: { solo: "20.000 Fcfa", couple: "35.000 Fcfa", group: "15.000 Fcfa/personne" },
    priceRange: { min: 15000, max: 35000 },
    highlights: ["Visites guidées historiques", "Reconstitutions", "Témoignages d'anciens"],
    inclusions: ["Transport en chaloupe", "Visite Maison des Esclaves", "Déjeuner traditionnel"],
    exclusions: ["Hébergement", "Achats souvenirs"],
    capacity: { total: 500, remaining: 500 },
    eventImage: "/assets/images/events/dakar/goree-patrimoine.jpg",
    images: ["/assets/images/events/dakar/goree-patrimoine.jpg"],
    isAvailable: true
  },

  // ===== CATÉGORIE: SPORT (2 événements) =====
  {
    title: "Marathon International de Dakar",
    location: "Départ: Monument de la Renaissance, Dakar",
    region_Name: "Dakar",
    category: "sport",
    description: "Le Marathon International de Dakar est l'événement sportif majeur du Sénégal, réunissant coureurs amateurs et professionnels du monde entier sur un parcours spectaculaire traversant les plus beaux quartiers de Dakar.",
    longDescription: "Créé pour promouvoir le sport et le tourisme au Sénégal, ce marathon attire chaque année près de 3000 participants de plus de 40 nationalités sur un parcours certifié.",
    coordinates: { latitude: 14.6953, longitude: -17.4439 },
    date: "2 février 2025",
    time: "06h00 - 14h00",
    eventDates: {
      startDate: new Date('2025-02-02T06:00:00'),
      endDate: new Date('2025-02-02T14:00:00')
    },
    organisateur: "Fédération Sénégalaise d'Athlétisme",
    contact: { phone: "+221 33 849 03 45", email: "marathon@athletisme.sn" },
    price: { solo: "30.000 Fcfa", couple: "55.000 Fcfa", group: "25.000 Fcfa/personne" },
    priceRange: { min: 25000, max: 55000 },
    highlights: ["Parcours certifié 42km", "Vue océan Atlantique", "Animation musicale"],
    inclusions: ["Dossard officiel", "T-shirt technique", "Médaille finisher", "Ravitaillement"],
    exclusions: ["Hébergement", "Repas", "Équipement course"],
    capacity: { total: 3000, remaining: 3000 },
    eventImage: "/assets/images/events/dakar/marathon-dakar.jpg",
    images: ["/assets/images/events/dakar/marathon-dakar.jpg"],
    isAvailable: true
  },
  {
    title: "Tournoi de Surf de Ngor",
    location: "Plage de Ngor Island, Dakar",
    region_Name: "Dakar",
    category: "sport",
    description: "Le championnat national de surf se déroule sur les vagues légendaires de Ngor Island. Trois jours de compétition avec les meilleurs surfeurs sénégalais et ouest-africains dans un cadre paradisiaque.",
    longDescription: "Ngor Island offre des conditions de surf exceptionnelles. Le tournoi comprend plusieurs catégories : juniors, seniors, longboard et stand-up paddle, avec finale retransmise en direct.",
    coordinates: { latitude: 14.7500, longitude: -17.5167 },
    date: "15-17 mars 2025",
    time: "07h00 - 18h00",
    eventDates: {
      startDate: new Date('2025-03-15T07:00:00'),
      endDate: new Date('2025-03-17T18:00:00')
    },
    organisateur: "Fédération Sénégalaise de Surf",
    contact: { phone: "+221 77 888 99 00", email: "tournoi@surf-senegal.sn" },
    price: { solo: "15.000 Fcfa", couple: "25.000 Fcfa", group: "12.000 Fcfa/personne" },
    priceRange: { min: 12000, max: 25000 },
    highlights: ["Compétition internationale", "Vagues de classe mondiale", "Beach party", "Initiation surf"],
    inclusions: ["Accès compétition", "Transport pirogue", "Déjeuner plage", "Cours d'initiation"],
    exclusions: ["Matériel surf", "Hébergement", "Boissons"],
    capacity: { total: 500, remaining: 500 },
    eventImage: "/assets/images/events/dakar/surf-ngor.jpg",
    images: ["/assets/images/events/dakar/surf-ngor.jpg"],
    isAvailable: true
  },

  // ===== CATÉGORIE: ATELIER (2 événements) =====
  {
    title: "Atelier de Poterie Traditionnelle à Thiès",
    location: "Centre Artisanal de Thiès",
    region_Name: "Thiès",
    category: "atelier",
    description: "Initiez-vous à l'art ancestral de la poterie sénégalaise avec des maîtres artisans. Apprenez les techniques traditionnelles du modelage, de la décoration et de la cuisson dans les fours en terre.",
    longDescription: "Cet atelier de 2 jours vous plonge dans l'univers de la céramique traditionnelle sénégalaise. Vous repartirez avec vos créations : bols, vases, sculptures selon la tradition locale.",
    coordinates: { latitude: 14.7886, longitude: -16.9317 },
    date: "Week-ends (sam-dim)",
    time: "09h00 - 17h00",
    eventDates: {
      startDate: new Date('2025-03-15T09:00:00'),
      endDate: new Date('2025-07-31T17:00:00')
    },
    organisateur: "Coopérative des Potiers de Thiès",
    contact: { phone: "+221 33 951 67 89", email: "poterie@artisans-thies.sn" },
    price: { solo: "30.000 Fcfa", couple: "50.000 Fcfa", group: "25.000 Fcfa/personne" },
    priceRange: { min: 25000, max: 50000 },
    highlights: ["Maîtres artisans", "Techniques ancestrales", "Créations personnelles", "Cuisson traditionnelle"],
    inclusions: ["Matériel complet", "Argile et outils", "Cuisson des œuvres", "Déjeuner traditionnel"],
    exclusions: ["Transport", "Hébergement", "Matériel supplémentaire"],
    capacity: { total: 15, remaining: 15 },
    eventImage: "/assets/images/events/thies/atelier-poterie.jpg",
    images: ["/assets/images/events/thies/atelier-poterie.jpg"],
    isAvailable: true
  },
  {
    title: "Atelier de Cuisine Sénégalaise chez l'Habitant",
    location: "Maison familiale, Médina - Dakar",
    region_Name: "Dakar",
    category: "atelier",
    description: "Immersion culinaire authentique dans une famille dakaroise. Apprenez à préparer les plats emblématiques du Sénégal : thiéboudienne, yassa, mafé, dans une ambiance conviviale et traditionnelle.",
    longDescription: "Cet atelier se déroule dans une vraie maison familiale de la Médina. Vous participez à tous les aspects : choix des ingrédients au marché, préparation, cuisson et dégustation en famille.",
    coordinates: { latitude: 14.6937, longitude: -17.4441 },
    date: "Mardis et jeudis",
    time: "10h00 - 15h00",
    eventDates: {
      startDate: new Date('2025-02-15T10:00:00'),
      endDate: new Date('2025-12-31T15:00:00')
    },
    organisateur: "Famille Diallo - Cuisine Authentique",
    contact: { phone: "+221 77 123 45 67", email: "cuisine@famille-diallo.sn" },
    price: { solo: "25.000 Fcfa", couple: "40.000 Fcfa", group: "20.000 Fcfa/personne" },
    priceRange: { min: 20000, max: 40000 },
    highlights: ["Famille authentique", "Marché traditionnel", "Recettes secrètes", "Dégustation conviviale"],
    inclusions: ["Visite du marché", "Tous les ingrédients", "Cours de cuisine", "Repas familial"],
    exclusions: ["Transport", "Boissons", "Ingrédients à emporter"],
    capacity: { total: 8, remaining: 8 },
    eventImage: "/assets/images/events/dakar/atelier-cuisine.jpg",
    images: ["/assets/images/events/dakar/atelier-cuisine.jpg"],
    isAvailable: true
  },

  // ===== CATÉGORIE: PLAGE (2 événements) =====
  {
    title: "Beach Party Sunset à Saly",
    location: "Plage de Saly Portudal",
    region_Name: "Thiès",
    category: "plage",
    description: "La plus grande beach party du Sénégal avec DJ internationaux, cocktails sur la plage et ambiance tropicale au coucher du soleil. Une soirée inoubliable les pieds dans le sable face à l'océan Atlantique.",
    longDescription: "Cette soirée combine musique électronique, afrobeat, cocktails exotiques et restauration grillée sur la plage. L'événement commence au coucher du soleil et se prolonge tard dans la nuit.",
    coordinates: { latitude: 14.4521, longitude: -16.7611 },
    date: "Tous les vendredis",
    time: "18h00 - 03h00",
    eventDates: {
      startDate: new Date('2025-03-01T18:00:00'),
      endDate: new Date('2025-10-31T03:00:00')
    },
    organisateur: "Saly Beach Events",
    contact: { phone: "+221 77 888 99 00", email: "party@salybeach.sn" },
    price: { solo: "25.000 Fcfa", couple: "45.000 Fcfa", group: "20.000 Fcfa/personne" },
    priceRange: { min: 20000, max: 45000 },
    highlights: ["DJ internationaux", "Cocktails sur plage", "Coucher de soleil", "Ambiance tropicale"],
    inclusions: ["Accès à la soirée", "Premier cocktail", "Animations plage", "Parking gratuit"],
    exclusions: ["Consommations supplémentaires", "Restauration", "Transport"],
    capacity: { total: 800, remaining: 800 },
    eventImage: "/assets/images/events/saly/beach-party.jpg",
    images: ["/assets/images/events/saly/beach-party.jpg"],
    isAvailable: true
  },
  {
    title: "Journée Détente à la Plage de Popenguine",
    location: "Plage de Popenguine, Réserve Naturelle",
    region_Name: "Thiès",
    category: "plage",
    description: "Une journée de détente totale dans l'une des plus belles plages du Sénégal. Activités nautiques, massage sur plage, déjeuner les pieds dans l'eau et découverte de la réserve naturelle de Popenguine.",
    longDescription: "Popenguine offre un cadre idyllique avec sa plage de sable blanc, ses falaises et sa réserve naturelle. Programme : baignade, kayak, observation d'oiseaux, massage relaxant et déjeuner créole.",
    coordinates: { latitude: 14.5500, longitude: -17.1167 },
    date: "Tous les dimanches",
    time: "09h00 - 18h00",
    eventDates: {
      startDate: new Date('2025-02-01T09:00:00'),
      endDate: new Date('2025-11-30T18:00:00')
    },
    organisateur: "Popenguine Éco-Tourisme",
    contact: { phone: "+221 33 954 12 34", email: "detente@popenguine-eco.sn" },
    price: { solo: "40.000 Fcfa", couple: "70.000 Fcfa", group: "35.000 Fcfa/personne" },
    priceRange: { min: 35000, max: 70000 },
    highlights: ["Plage paradisiaque", "Activités nautiques", "Massage plage", "Réserve naturelle"],
    inclusions: ["Transport depuis Dakar", "Déjeuner créole", "Activités nautiques", "Massage 30min"],
    exclusions: ["Boissons alcoolisées", "Achats souvenirs", "Activités optionnelles"],
    capacity: { total: 50, remaining: 50 },
    eventImage: "/assets/images/events/popenguine/plage-detente.jpg",
    images: ["/assets/images/events/popenguine/plage-detente.jpg"],
    isAvailable: true
  }
];

// Script pour insérer les données
async function seedEventsData() {
  try {
    console.log('🎪 Début de l\'insertion des événements (2 par catégorie - 16 total)...');
    
    const insertedEvents = [];
    
    for (const eventData of eventsData) {
      try {
        // Vérifier si l'événement existe déjà
        const existingEvent = await EventDetails.findOne({ 
          title: eventData.title,
          location: eventData.location 
        });
        
        if (existingEvent) {
          console.log(`⚠️ Événement déjà existant: ${eventData.title}`);
          continue;
        }
        
        // Créer les données administrateur par défaut
        const adminInfo = {
          userId: new mongoose.Types.ObjectId(),
          role: 'superAdmin',
          username: 'admin_system'
        };
        
        // Préparer les données complètes
        const completeEventData = {
          ...eventData,
          createdBy: adminInfo,
          lastEditedBy: {
            ...adminInfo,
            editedAt: new Date()
          },
          favoritedBy: [],
          reviews: [],
          bookings: [],
          version: 1,
          rating: 0,
          review: "0 avis",
          totalReviews: 0,
          averageRating: 0,
          viewsCount: 0,
          favoritesCount: 0,
          bookingsCount: 0,
          hasFullDetails: true,
          isActive: true
        };
        
        // Créer et sauvegarder l'événement
        const event = new EventDetails(completeEventData);
        await event.save();
        
        insertedEvents.push({
          id: event._id,
          title: event.title,
          location: event.location,
          region: event.region_Name,
          category: event.category
        });
        
        console.log(`✅ Événement créé: ${event.title} (${event.region_Name}) - ${event.category}`);
        
      } catch (eventError) {
        console.error(`❌ Erreur création événement ${eventData.title}:`, eventError.message);
      }
    }
    
    console.log('\n🎉 === RÉSUMÉ DE L\'INSERTION ===');
    console.log(`Total événements insérés: ${insertedEvents.length}`);
    console.log('Répartition par catégorie:');
    
    const categoryCounts = insertedEvents.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});
    
    Object.keys(categoryCounts).forEach(category => {
      const status = categoryCounts[category] === 2 ? '✅' : categoryCounts[category] > 2 ? '⚠️' : '❌';
      console.log(`${status} ${category}: ${categoryCounts[category]} événement(s)`);
    });
    
    console.log('\nÉvénements créés:');
    insertedEvents.forEach(event => {
      console.log(`- ${event.title} (${event.region}) - ${event.category}`);
    });
    
    return {
      success: true,
      message: `${insertedEvents.length} événements insérés avec succès`,
      data: insertedEvents
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
async function addSampleEventReviews() {
  try {
    console.log('⭐ Ajout d\'avis de démonstration pour événements...');
    
    const sampleReviews = [
      {
        eventTitle: "Festival de Jazz de Saint-Louis",
        reviews: [
          {
            userId: new mongoose.Types.ObjectId(),
            userInfo: { username: "Moussa Diop", avatar: "/assets/images/users/user1.jpg" },
            rating: 5,
            reviewText: "Festival exceptionnel ! L'ambiance magique de Saint-Louis combinée à des artistes de jazz de classe mondiale. Organisation parfaite."
          },
          {
            userId: new mongoose.Types.ObjectId(),
            userInfo: { username: "Aïssatou Ndiaye", avatar: "/assets/images/users/user2.jpg" },
            rating: 5,
            reviewText: "Une expérience musicale inoubliable ! Saint-Louis devient vraiment la capitale du jazz pendant ces jours."
          }
        ]
      },
      {
        eventTitle: "Marathon International de Dakar",
        reviews: [
          {
            userId: new mongoose.Types.ObjectId(),
            userInfo: { username: "Pierre Leblanc", avatar: "/assets/images/users/user3.jpg" },
            rating: 4,
            reviewText: "Parcours magnifique avec des vues spectaculaires sur l'océan ! L'organisation était au top."
          }
        ]
      },
      {
        eventTitle: "Biennale de l'Art Africain Contemporain Dak'Art",
        reviews: [
          {
            userId: new mongoose.Types.ObjectId(),
            userInfo: { username: "Fatou Sall", avatar: "/assets/images/users/user4.jpg" },
            rating: 5,
            reviewText: "Dak'Art continue d'être la référence de l'art contemporain africain. Expositions de qualité exceptionnelle."
          }
        ]
      },
      {
        eventTitle: "Beach Party Sunset à Saly",
        reviews: [
          {
            userId: new mongoose.Types.ObjectId(),
            userInfo: { username: "Mamadou Ba", avatar: "/assets/images/users/user5.jpg" },
            rating: 4,
            reviewText: "Ambiance incroyable ! Coucher de soleil magique et musique au top. À refaire absolument."
          }
        ]
      }
    ];
    
    for (const eventReviews of sampleReviews) {
      const event = await EventDetails.findOne({ title: eventReviews.eventTitle });
      
      if (event) {
        for (const reviewData of eventReviews.reviews) {
          try {
            await event.addReview(
              reviewData.userId,
              reviewData.userInfo,
              reviewData.rating,
              reviewData.reviewText
            );
            console.log(`✅ Avis ajouté pour ${eventReviews.eventTitle}`);
          } catch (reviewError) {
            console.log(`⚠️ Avis déjà existant pour ${eventReviews.eventTitle}`);
          }
        }
      }
    }
    
    console.log('✅ Avis de démonstration ajoutés');
    
  } catch (error) {
    console.error('❌ Erreur ajout avis:', error.message);
  }
}

// Fonction pour générer un rapport des événements
async function generateEventsReport() {
  try {
    console.log('\n📊 === RAPPORT DES ÉVÉNEMENTS (8 CATÉGORIES x 2) ===');
    
    const totalEvents = await EventDetails.countDocuments({ isActive: true });
    const eventsWithFullDetails = await EventDetails.countDocuments({ isActive: true, hasFullDetails: true });
    
    const categoryStats = await EventDetails.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 },
        avgRating: { $avg: '$averageRating' },
        avgMinPrice: { $avg: '$priceRange.min' },
        avgMaxPrice: { $avg: '$priceRange.max' }
      }},
      { $sort: { count: -1 } }
    ]);
    
    const regionStats = await EventDetails.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$region_Name', 
        count: { $sum: 1 },
        avgRating: { $avg: '$averageRating' }
      }},
      { $sort: { count: -1 } }
    ]);
    
    console.log(`Total événements actifs: ${totalEvents}`);
    console.log(`Événements avec détails complets: ${eventsWithFullDetails} (${Math.round(eventsWithFullDetails/totalEvents*100)}%)`);
    
    console.log('\n📂 Répartition par catégorie (objectif: 2 par catégorie):');
    const expectedCategories = ['festival', 'excursion', 'nightlife', 'conference', 'culture', 'sport', 'atelier', 'plage'];
    
    expectedCategories.forEach(expectedCat => {
      const found = categoryStats.find(cat => cat._id === expectedCat);
      if (found) {
        const status = found.count === 2 ? '✅' : found.count > 2 ? '⚠️' : '❌';
        console.log(`${status} ${found._id}: ${found.count} événement(s) | Note moyenne: ${found.avgRating?.toFixed(1) || 'N/A'}`);
      } else {
        console.log(`❌ ${expectedCat}: 0 événement(s)`);
      }
    });
    
    console.log('\n📍 Répartition par région:');
    regionStats.forEach(region => {
      console.log(`- ${region._id}: ${region.count} événement(s) | Note moyenne: ${region.avgRating?.toFixed(1) || 'N/A'}`);
    });
    
    // Événements les mieux notés
    const topRatedEvents = await EventDetails.find({ isActive: true })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(8)
      .select('title region_Name category averageRating totalReviews');
    
    console.log('\n⭐ Top événements les mieux notés:');
    topRatedEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (${event.region_Name}) - ${event.category} - ${event.averageRating}/5 (${event.totalReviews} avis)`);
    });
    
    return { totalEvents, categoryStats, regionStats, topRatedEvents };
    
  } catch (error) {
    console.error('❌ Erreur génération rapport:', error.message);
    return null;
  }
}

// Fonction pour nettoyer et valider les événements
async function cleanAndValidateEvents() {
  try {
    console.log('\n🧹 Nettoyage et validation des données événements...');
    
    const events = await EventDetails.find({ isActive: true });
    let updated = 0;
    
    for (const event of events) {
      let hasChanges = false;
      
      // Recalculer les statistiques d'avis
      if (event.reviews && event.reviews.length > 0) {
        event.calculateAverageRating();
        hasChanges = true;
      }
      
      // S'assurer que hasFullDetails est true
      if (!event.hasFullDetails) {
        event.hasFullDetails = true;
        hasChanges = true;
      }
      
      // S'assurer que isAvailable est true pour les événements à venir
      if (event.eventDates && event.eventDates.startDate && new Date(event.eventDates.startDate) > new Date()) {
        if (!event.isAvailable) {
          event.isAvailable = true;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        await event.save();
        updated++;
      }
    }
    
    console.log(`✅ Validation terminée: ${updated} événements mis à jour`);
    return { updated, total: events.length };
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error.message);
    return null;
  }
}

// Menu interactif
async function runEventsInteractiveMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise(resolve => rl.question(question, resolve));
  };
  
  try {
    console.log('\n🎪 === GESTIONNAIRE ÉVÉNEMENTS (8 CATÉGORIES x 2) ===');
    console.log('📋 Catégories: festival, excursion, nightlife, conference, culture, sport, atelier, plage');
    console.log('');
    console.log('1. Insérer les 16 événements (2 par catégorie)');
    console.log('2. Ajouter des avis de démonstration');
    console.log('3. Générer un rapport des événements');
    console.log('4. Nettoyer et valider les données');
    console.log('5. Supprimer tous les événements');
    console.log('6. Tout exécuter (1+2+3+4)');
    console.log('0. Quitter');
    
    const choice = await askQuestion('\nVotre choix: ');
    
    switch (choice.trim()) {
      case '1':
        console.log('\n🔄 Insertion des 16 événements...');
        const result1 = await seedEventsData();
        console.log(result1.success ? `✅ ${result1.message}` : `❌ ${result1.message}`);
        break;
        
      case '2':
        console.log('\n⭐ Ajout des avis de démonstration...');
        await addSampleEventReviews();
        break;
        
      case '3':
        console.log('\n📊 Génération du rapport...');
        await generateEventsReport();
        break;
        
      case '4':
        console.log('\n🧹 Nettoyage et validation...');
        const cleanResult = await cleanAndValidateEvents();
        if (cleanResult) {
          console.log(`✅ ${cleanResult.updated} événements mis à jour`);
        }
        break;
        
      case '5':
        console.log('\n🗑️ Suppression des événements...');
        const confirm = await askQuestion('Tapez "SUPPRIMER" pour confirmer: ');
        if (confirm === 'SUPPRIMER') {
          const result = await EventDetails.deleteMany({});
          console.log(`✅ ${result.deletedCount} événements supprimés`);
        } else {
          console.log('❌ Suppression annulée');
        }
        break;
        
      case '6':
        console.log('\n🔄 Exécution complète...');
        const insertResult = await seedEventsData();
        console.log(`✅ Insertion: ${insertResult.message}`);
        
        await addSampleEventReviews();
        console.log('✅ Avis ajoutés');
        
        await generateEventsReport();
        console.log('✅ Rapport généré');
        
        const cleanRes = await cleanAndValidateEvents();
        console.log(`✅ ${cleanRes?.updated || 0} événements nettoyés`);
        break;
        
      case '0':
        console.log('\n👋 Au revoir!');
        break;
        
      default:
        console.log('\n❌ Choix invalide');
        break;
    }
    
  } catch (error) {
    console.error('❌ Erreur dans le menu:', error.message);
  } finally {
    rl.close();
  }
}

// Exports
module.exports = {
  seedEventsData,
  addSampleEventReviews,
  generateEventsReport,
  cleanAndValidateEvents,
  runEventsInteractiveMenu,
  eventsData
};

// Exécution directe du script
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';
  
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('📡 Connecté à MongoDB pour événements');
      
      const args = process.argv.slice(2);
      
      if (args.includes('--interactive') || args.includes('-i')) {
        await runEventsInteractiveMenu();
      } else if (args.includes('--report') || args.includes('-r')) {
        await generateEventsReport();
      } else {
        // Comportement par défaut : insertion + avis + rapport
        const result = await seedEventsData();
        console.log('Résultat insertion:', result);
        await addSampleEventReviews();
        await generateEventsReport();
        await cleanAndValidateEvents();
      }
      
      console.log('🎉 Script événements terminé');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur connexion MongoDB:', error);
      process.exit(1);
    });
}
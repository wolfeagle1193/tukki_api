// scripts/validateHotelsData.js - SCRIPT DE VALIDATION DES DONNÉES HÔTELS
const mongoose = require('mongoose');
const HotelDetails = require('../models/HotelDetails');

// Fonction de validation de la structure des données
function validateHotelData(hotel, index) {
  const errors = [];
  const warnings = [];
  
  // Validation des champs obligatoires
  const requiredFields = [
    'title', 'location', 'region_Name', 'description', 
    'coordinates', 'price', 'availability', 'placeImage'
  ];
  
  requiredFields.forEach(field => {
    if (!hotel[field]) {
      errors.push(`Hôtel ${index + 1}: Champ obligatoire manquant - ${field}`);
    }
  });
  
  // Validation spécifique des coordonnées
  if (hotel.coordinates) {
    if (typeof hotel.coordinates.latitude !== 'number' || 
        typeof hotel.coordinates.longitude !== 'number') {
      errors.push(`Hôtel ${index + 1}: Coordonnées invalides`);
    }
    
    if (hotel.coordinates.latitude < -90 || hotel.coordinates.latitude > 90) {
      errors.push(`Hôtel ${index + 1}: Latitude invalide (${hotel.coordinates.latitude})`);
    }
    
    if (hotel.coordinates.longitude < -180 || hotel.coordinates.longitude > 180) {
      errors.push(`Hôtel ${index + 1}: Longitude invalide (${hotel.coordinates.longitude})`);
    }
  }
  
  // Validation des prix
  if (hotel.price) {
    if (typeof hotel.price.minPrice !== 'number' || 
        typeof hotel.price.maxPrice !== 'number') {
      errors.push(`Hôtel ${index + 1}: Prix invalides`);
    }
    
    if (hotel.price.minPrice < 0 || hotel.price.maxPrice < 0) {
      errors.push(`Hôtel ${index + 1}: Prix négatifs`);
    }
    
    if (hotel.price.minPrice > hotel.price.maxPrice) {
      errors.push(`Hôtel ${index + 1}: Prix minimum supérieur au prix maximum`);
    }
  }
  
  // Validation de la disponibilité
  if (hotel.availability) {
    const startDate = new Date(hotel.availability.start);
    const endDate = new Date(hotel.availability.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      errors.push(`Hôtel ${index + 1}: Dates de disponibilité invalides`);
    }
    
    if (startDate >= endDate) {
      errors.push(`Hôtel ${index + 1}: Date de début >= date de fin`);
    }
  }
  
  // Validation du rating
  if (hotel.rating !== undefined) {
    if (typeof hotel.rating !== 'number' || hotel.rating < 0 || hotel.rating > 5) {
      errors.push(`Hôtel ${index + 1}: Rating invalide (${hotel.rating})`);
    }
  }
  
  // Validation des facilities
  if (hotel.facilities && Array.isArray(hotel.facilities)) {
    hotel.facilities.forEach((facility, facIndex) => {
      if (typeof facility !== 'object') {
        errors.push(`Hôtel ${index + 1}: Facility ${facIndex} invalide`);
      }
    });
  }
  
  // Validation des services
  if (hotel.services && Array.isArray(hotel.services)) {
    hotel.services.forEach((service, servIndex) => {
      if (!service.icon || !service.label) {
        errors.push(`Hôtel ${index + 1}: Service ${servIndex} manque icon ou label`);
      }
    });
  }
  
  // Validation des galeries d'images
  if (hotel.gallery && Array.isArray(hotel.gallery)) {
    hotel.gallery.forEach((imagePath, imgIndex) => {
      if (typeof imagePath !== 'string' || !imagePath.startsWith('/assets/')) {
        warnings.push(`Hôtel ${index + 1}: Image galerie ${imgIndex} - chemin suspect`);
      }
    });
  }
  
  // Validation de la description
  if (hotel.description && hotel.description.length < 50) {
    warnings.push(`Hôtel ${index + 1}: Description trop courte (${hotel.description.length} caractères)`);
  }
  
  if (hotel.description && hotel.description.length > 2000) {
    warnings.push(`Hôtel ${index + 1}: Description très longue (${hotel.description.length} caractères)`);
  }
  
  return { errors, warnings };
}

// Fonction de test de la syntaxe JSON
function testJSONSyntax() {
  try {
    console.log('🔍 Test de la syntaxe des données...');
    
    // Import du fichier de données
    const { hotelsData } = require('./seedHotelsData');
    
    console.log(`✅ Syntaxe JSON valide - ${hotelsData.length} hôtels détectés`);
    return { success: true, count: hotelsData.length, data: hotelsData };
    
  } catch (syntaxError) {
    console.error('❌ Erreur de syntaxe JSON:', syntaxError.message);
    return { success: false, error: syntaxError.message };
  }
}

// Fonction de validation complète des données
function validateAllHotels() {
  console.log('\n🏨 === VALIDATION DES DONNÉES HÔTELS ===');
  
  const syntaxTest = testJSONSyntax();
  if (!syntaxTest.success) {
    return { success: false, error: syntaxTest.error };
  }
  
  const hotelsData = syntaxTest.data;
  let totalErrors = 0;
  let totalWarnings = 0;
  const validationResults = [];
  
  hotelsData.forEach((hotel, index) => {
    console.log(`\n📋 Validation Hôtel ${index + 1}: ${hotel.title || 'TITRE MANQUANT'}`);
    
    const validation = validateHotelData(hotel, index);
    
    if (validation.errors.length > 0) {
      console.error('  ❌ ERREURS:');
      validation.errors.forEach(error => console.error(`    - ${error}`));
      totalErrors += validation.errors.length;
    }
    
    if (validation.warnings.length > 0) {
      console.warn('  ⚠️ AVERTISSEMENTS:');
      validation.warnings.forEach(warning => console.warn(`    - ${warning}`));
      totalWarnings += validation.warnings.length;
    }
    
    if (validation.errors.length === 0 && validation.warnings.length === 0) {
      console.log('  ✅ Validation OK');
    }
    
    validationResults.push({
      hotelIndex: index,
      hotelTitle: hotel.title,
      errors: validation.errors,
      warnings: validation.warnings,
      isValid: validation.errors.length === 0
    });
  });
  
  // Rapport final
  console.log('\n📊 === RAPPORT DE VALIDATION ===');
  console.log(`Total hôtels: ${hotelsData.length}`);
  console.log(`Hôtels valides: ${validationResults.filter(r => r.isValid).length}`);
  console.log(`Hôtels avec erreurs: ${validationResults.filter(r => !r.isValid).length}`);
  console.log(`Total erreurs: ${totalErrors}`);
  console.log(`Total avertissements: ${totalWarnings}`);
  
  if (totalErrors === 0) {
    console.log('🎉 Toutes les données sont valides !');
  } else {
    console.log('❌ Des erreurs doivent être corrigées avant l\'insertion');
  }
  
  return {
    success: totalErrors === 0,
    totalHotels: hotelsData.length,
    validHotels: validationResults.filter(r => r.isValid).length,
    totalErrors,
    totalWarnings,
    results: validationResults
  };
}

// Fonction de génération de rapport détaillé
function generateDetailedReport() {
  const syntaxTest = testJSONSyntax();
  if (!syntaxTest.success) return;
  
  const hotelsData = syntaxTest.data;
  
  console.log('\n📋 === RAPPORT DÉTAILLÉ DES HÔTELS ===');
  
  // Statistiques générales
  const totalHotels = hotelsData.length;
  const avgRating = hotelsData.reduce((sum, hotel) => sum + (hotel.averageRating || 0), 0) / totalHotels;
  const totalReviews = hotelsData.reduce((sum, hotel) => sum + (hotel.totalReviews || 0), 0);
  const priceRanges = hotelsData.map(hotel => ({
    min: hotel.price?.minPrice || 0,
    max: hotel.price?.maxPrice || 0
  }));
  const minPrice = Math.min(...priceRanges.map(p => p.min));
  const maxPrice = Math.max(...priceRanges.map(p => p.max));
  
  console.log(`Total hôtels: ${totalHotels}`);
  console.log(`Note moyenne: ${avgRating.toFixed(1)}/5`);
  console.log(`Total avis: ${totalReviews}`);
  console.log(`Gamme de prix: ${minPrice} - ${maxPrice} FCFA`);
  
  // Répartition par région
  const regionStats = {};
  hotelsData.forEach(hotel => {
    const region = hotel.region_Name || 'Non spécifiée';
    regionStats[region] = (regionStats[region] || 0) + 1;
  });
  
  console.log('\n📍 Répartition par région:');
  Object.entries(regionStats).forEach(([region, count]) => {
    console.log(`  - ${region}: ${count} hôtel(s)`);
  });
  
  // Top 5 des hôtels les mieux notés
  const topRated = [...hotelsData]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 5);
  
  console.log('\n⭐ Top 5 des hôtels les mieux notés:');
  topRated.forEach((hotel, index) => {
    console.log(`  ${index + 1}. ${hotel.title} - ${hotel.averageRating}/5 (${hotel.totalReviews} avis)`);
  });
  
  // Services les plus fréquents
  const serviceStats = {};
  hotelsData.forEach(hotel => {
    if (hotel.services && Array.isArray(hotel.services)) {
      hotel.services.forEach(service => {
        if (service.available) {
          serviceStats[service.label] = (serviceStats[service.label] || 0) + 1;
        }
      });
    }
  });
  
  console.log('\n🛎️ Services les plus fréquents:');
  Object.entries(serviceStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([service, count]) => {
      console.log(`  - ${service}: ${count} hôtels (${Math.round(count/totalHotels*100)}%)`);
    });
}

// Fonction de test de connexion à MongoDB
async function testMongoConnection() {
  try {
    console.log('\n🔗 Test de connexion MongoDB...');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teranga_travel';
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ Connexion MongoDB réussie');
    
    // Test de création d'un hôtel fictif
    const testHotel = new HotelDetails({
      title: 'Test Hotel',
      location: 'Test Location',
      region_Name: 'Test',
      description: 'Hotel de test pour validation du modèle de données. Cette description est suffisamment longue pour passer la validation.',
      coordinates: { latitude: 14.6937, longitude: -17.4441 },
      price: { minPrice: 50000, maxPrice: 100000 },
      availability: { start: new Date(), end: new Date(Date.now() + 365*24*60*60*1000) },
      placeImage: '/test/image.jpg',
      createdBy: {
        userId: new mongoose.Types.ObjectId(),
        role: 'superAdmin',
        username: 'test_admin'
      }
    });
    
    // Validation sans sauvegarde
    const validationError = testHotel.validateSync();
    if (validationError) {
      console.error('❌ Erreur de validation du modèle:', validationError.message);
    } else {
      console.log('✅ Modèle de données valide');
    }
    
    await mongoose.disconnect();
    return true;
    
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error.message);
    return false;
  }
}

// Menu interactif de validation
async function runValidationMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise(resolve => rl.question(question, resolve));
  };
  
  console.log('\n🔍 === MENU DE VALIDATION HÔTELS ===');
  console.log('1. Tester la syntaxe JSON');
  console.log('2. Valider toutes les données');
  console.log('3. Générer un rapport détaillé');
  console.log('4. Tester la connexion MongoDB');
  console.log('5. Validation complète (1+2+3+4)');
  console.log('0. Quitter');
  
  const choice = await askQuestion('\nVotre choix: ');
  
  switch (choice) {
    case '1':
      testJSONSyntax();
      break;
    case '2':
      validateAllHotels();
      break;
    case '3':
      generateDetailedReport();
      break;
    case '4':
      await testMongoConnection();
      break;
    case '5':
      const syntaxOk = testJSONSyntax().success;
      if (syntaxOk) {
        const validation = validateAllHotels();
        generateDetailedReport();
        await testMongoConnection();
        
        if (validation.success) {
          console.log('\n🎉 Validation complète RÉUSSIE - Prêt pour l\'insertion !');
        } else {
          console.log('\n❌ Validation ÉCHOUÉE - Corriger les erreurs avant insertion');
        }
      }
      break;
    case '0':
      console.log('👋 Au revoir!');
      break;
    default:
      console.log('❌ Choix invalide');
  }
  
  rl.close();
}

// Export du module
module.exports = {
  validateHotelData,
  testJSONSyntax,
  validateAllHotels,
  generateDetailedReport,
  testMongoConnection,
  runValidationMenu
};

// Exécution directe
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--menu') || args.includes('-m')) {
    runValidationMenu();
  } else if (args.includes('--syntax') || args.includes('-s')) {
    testJSONSyntax();
  } else if (args.includes('--report') || args.includes('-r')) {
    generateDetailedReport();
  } else if (args.includes('--mongo') || args.includes('-db')) {
    testMongoConnection();
  } else {
    // Validation par défaut
    validateAllHotels();
  }
}
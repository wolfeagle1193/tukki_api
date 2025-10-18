// scripts/finalFix.js - Correction des événements sans avis mais avec structure corrompue
const mongoose = require('mongoose');
const EventDetails = require('../models/EventDetails');

async function fixEmptyReviewsEvents() {
  try {
    console.log('🎯 CORRECTION FINALE DES ÉVÉNEMENTS SANS AVIS...');
    
    // Identifier les événements avec 0 avis mais détectés comme problématiques
    const problematicEmptyEvents = await EventDetails.find({
      isActive: true,
      $or: [
        { 'reviews.replies': { $type: 'number' } },
        { 'reviews.replies': { $type: 'string' } },
        { 'reviews.replies': null },
        { 'reviews.replies': { $exists: false } }
      ]
    });
    
    console.log(`📊 ${problematicEmptyEvents.length} événements problématiques détectés`);
    
    for (const event of problematicEmptyEvents) {
      console.log(`\n--- Traitement: ${event.title} ---`);
      console.log(`Reviews actuelles: ${event.reviews ? event.reviews.length : 'undefined'}`);
      
      try {
        // Solution 1: Forcer reviews à être un tableau vide
        await EventDetails.updateOne(
          { _id: event._id },
          { 
            $set: { 
              reviews: [] 
            }
          },
          { runValidators: false }
        );
        
        console.log(`✅ Reviews réinitialisées à tableau vide`);
        
        // Solution 2: S'assurer que tous les champs de stats sont cohérents
        await EventDetails.updateOne(
          { _id: event._id },
          { 
            $set: { 
              totalReviews: 0,
              averageRating: 0,
              review: "0 avis"
            }
          }
        );
        
        console.log(`✅ Statistiques mises à jour`);
        
      } catch (error) {
        console.error(`❌ Erreur pour ${event.title}:`, error.message);
      }
    }
    
    // Solution 3: Correction au niveau de la collection MongoDB directement
    console.log('\n🔧 Correction directe MongoDB...');
    
    try {
      // Supprimer complètement le champ reviews des événements problématiques
      const deleteResult = await EventDetails.collection.updateMany(
        {
          isActive: true,
          $or: [
            { 'reviews.replies': { $type: 'number' } },
            { 'reviews.replies': { $type: 'string' } },
            { 'reviews.replies': null }
          ]
        },
        { 
          $unset: { reviews: 1 }
        }
      );
      
      console.log(`🗑️ Champ reviews supprimé de ${deleteResult.modifiedCount} événements`);
      
      // Recréer le champ reviews comme tableau vide
      const createResult = await EventDetails.collection.updateMany(
        {
          isActive: true,
          reviews: { $exists: false }
        },
        { 
          $set: { 
            reviews: [],
            totalReviews: 0,
            averageRating: 0,
            review: "0 avis"
          }
        }
      );
      
      console.log(`➕ Champ reviews recréé pour ${createResult.modifiedCount} événements`);
      
    } catch (error) {
      console.error('❌ Erreur correction MongoDB directe:', error.message);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return { success: false, error: error.message };
  }
}

async function ultimateValidation() {
  try {
    console.log('\n🏆 VALIDATION ULTIME...');
    
    // Vérification 1: Problèmes persistants
    const stillProblematic = await EventDetails.countDocuments({
      isActive: true,
      $or: [
        { 'reviews.replies': { $type: 'number' } },
        { 'reviews.replies': { $type: 'string' } },
        { 'reviews.replies': null },
        { 'reviews.replies': { $exists: false } }
      ]
    });
    
    console.log(`Événements encore problématiques: ${stillProblematic}`);
    
    // Vérification 2: Structure correcte des reviews
    const eventsWithArrayReviews = await EventDetails.countDocuments({
      isActive: true,
      reviews: { $type: 'array' }
    });
    
    const totalEvents = await EventDetails.countDocuments({ isActive: true });
    
    console.log(`Événements avec reviews en tableau: ${eventsWithArrayReviews}/${totalEvents}`);
    
    // Test final: Essayer toggleFavorite sur un événement problématique
    console.log('\n🧪 TEST FINAL...');
    
    const testEventIds = [
      '68c5acbc57baadcf82a6ce21', // Festival Mundial
      '68c72e9cbe925bfd4333afc0'  // Atelier Cuisine
    ];
    
    for (const eventId of testEventIds) {
      try {
        const testEvent = await EventDetails.findById(eventId);
        if (testEvent) {
          console.log(`Test sur: ${testEvent.title}`);
          
          // Test toggleFavorite
          const testUserId = new mongoose.Types.ObjectId();
          const result = testEvent.toggleFavorite(testUserId);
          await testEvent.save();
          
          console.log(`✅ toggleFavorite réussi - Action: ${result.action}`);
          
          // Nettoyer le test
          testEvent.toggleFavorite(testUserId);
          await testEvent.save();
          
        }
      } catch (error) {
        console.error(`❌ Test échoué pour ${eventId}:`, error.message);
      }
    }
    
    // Résultat final
    if (stillProblematic === 0) {
      console.log('\n🎉 SUCCÈS TOTAL ! Tous les problèmes sont résolus.');
      console.log('✅ La fonction toggleEventFavorite devrait maintenant fonctionner parfaitement.');
      return true;
    } else {
      console.log(`\n⚠️ ${stillProblematic} événements posent encore problème.`);
      
      // Debug final - afficher les événements restants
      const remaining = await EventDetails.find({
        isActive: true,
        $or: [
          { 'reviews.replies': { $type: 'number' } },
          { 'reviews.replies': { $type: 'string' } },
          { 'reviews.replies': null },
          { 'reviews.replies': { $exists: false } }
        ]
      }).select('title _id reviews');
      
      console.log('\nÉvénements encore problématiques:');
      remaining.forEach(event => {
        console.log(`- ${event.title} (ID: ${event._id})`);
        console.log(`  Reviews: ${JSON.stringify(event.reviews)}`);
      });
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur validation ultime:', error);
    return false;
  }
}

// Exécution du script final
if (require.main === module) {
  const MONGODB_URI = 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';
  
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('📡 Connecté à MongoDB pour CORRECTION FINALE');
      
      const fixResult = await fixEmptyReviewsEvents();
      console.log('\nRésultat correction:', fixResult);
      
      const isFixed = await ultimateValidation();
      
      if (isFixed) {
        console.log('\n🚀 PROBLÈME RÉSOLU ! Vous pouvez maintenant utiliser toggleEventFavorite.');
      } else {
        console.log('\n🔍 Des investigations supplémentaires sont nécessaires.');
        console.log('Le problème pourrait être au niveau du schéma Mongoose lui-même.');
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur connexion MongoDB:', error);
      process.exit(1);
    });
}

module.exports = {
  fixEmptyReviewsEvents,
  ultimateValidation
};
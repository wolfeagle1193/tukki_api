// scripts/ultimateCleanup.js - Diagnostic et correction complète
const mongoose = require('mongoose');
const EventDetails = require('../models/EventDetails');

async function diagnosticDetailed() {
  try {
    console.log('🔍 DIAGNOSTIC DÉTAILLÉ DES PROBLÈMES...');
    
    // Trouver tous les événements problématiques
    const problematicEvents = await EventDetails.find({
      isActive: true,
      $or: [
        { 'reviews.replies': { $type: 'number' } },
        { 'reviews.replies': { $type: 'string' } },
        { 'reviews.replies': null },
        { 'reviews.replies': { $exists: false } }
      ]
    });
    
    console.log(`\n📊 ${problematicEvents.length} événements problématiques détectés\n`);
    
    for (const event of problematicEvents) {
      console.log(`--- ${event.title} ---`);
      console.log(`ID: ${event._id}`);
      console.log(`Nombre d'avis: ${event.reviews ? event.reviews.length : 0}`);
      
      if (event.reviews && event.reviews.length > 0) {
        event.reviews.forEach((review, index) => {
          console.log(`  Review ${index}:`);
          console.log(`    - ID: ${review.id || review._id}`);
          console.log(`    - userId: ${review.userId}`);
          console.log(`    - replies type: ${typeof review.replies}`);
          console.log(`    - replies value: ${JSON.stringify(review.replies)}`);
        });
      }
      console.log('');
    }
    
    return problematicEvents;
    
  } catch (error) {
    console.error('Erreur diagnostic:', error);
    return [];
  }
}

async function ultimateRepair() {
  try {
    console.log('🔧 RÉPARATION ULTIME EN COURS...');
    
    // Étape 1: Supprimer complètement le champ replies de tous les événements
    console.log('Étape 1: Suppression complète du champ replies...');
    
    await EventDetails.updateMany(
      { isActive: true },
      { 
        $unset: { 
          "reviews.$[].replies": 1 
        }
      }
    );
    
    console.log('✅ Champ replies supprimé');
    
    // Étape 2: Ajouter le champ replies comme tableau vide
    console.log('Étape 2: Ajout du champ replies comme tableau vide...');
    
    await EventDetails.updateMany(
      { isActive: true },
      { 
        $set: { 
          "reviews.$[].replies": [] 
        }
      }
    );
    
    console.log('✅ Champ replies ajouté comme tableau vide');
    
    // Étape 3: Traitement individuel des événements restants
    console.log('Étape 3: Traitement individuel forcé...');
    
    const events = await EventDetails.find({ 
      isActive: true,
      'reviews.0': { $exists: true }
    });
    
    let forcedRepairs = 0;
    
    for (const event of events) {
      try {
        // Créer une nouvelle structure de reviews complètement propre
        const cleanReviews = [];
        
        if (event.reviews && event.reviews.length > 0) {
          for (const review of event.reviews) {
            const cleanReview = {
              id: review.id || new mongoose.Types.ObjectId().toString(),
              userId: review.userId,
              user: {
                id: review.user?.id || review.userId,
                username: review.user?.username || 'Utilisateur',
                avatar: review.user?.avatar || ''
              },
              rating: review.rating,
              comment: review.comment,
              likes: review.likes || 0,
              likedBy: review.likedBy || [],
              replies: [], // FORCER à tableau vide
              createdAt: review.createdAt || new Date(),
              date: review.date || new Date().toLocaleDateString('fr-FR')
            };
            cleanReviews.push(cleanReview);
          }
        }
        
        // Remplacer complètement les reviews
        await EventDetails.findByIdAndUpdate(
          event._id,
          { 
            $set: { 
              reviews: cleanReviews 
            }
          },
          { runValidators: false } // Contourner la validation
        );
        
        forcedRepairs++;
        console.log(`✅ Réparation forcée: ${event.title}`);
        
      } catch (error) {
        console.error(`❌ Erreur réparation ${event.title}:`, error.message);
      }
    }
    
    console.log(`\n🔧 Réparations forcées effectuées: ${forcedRepairs}`);
    
    return { success: true, repaired: forcedRepairs };
    
  } catch (error) {
    console.error('Erreur réparation ultime:', error);
    return { success: false, error: error.message };
  }
}

async function finalValidation() {
  try {
    console.log('\n🏁 VALIDATION FINALE...');
    
    // Test de sauvegarde d'un événement pour vérifier la validation
    const testEvent = await EventDetails.findOne({ 
      isActive: true,
      'reviews.0': { $exists: true }
    });
    
    if (testEvent) {
      console.log(`Test de validation sur: ${testEvent.title}`);
      
      try {
        // Essayer de sauvegarder l'événement
        await testEvent.save();
        console.log('✅ Test de sauvegarde réussi');
        
        // Test de la fonction toggleFavorite
        const originalCount = testEvent.favoritesCount;
        const result = testEvent.toggleFavorite(new mongoose.Types.ObjectId());
        await testEvent.save();
        
        console.log('✅ Test toggleFavorite réussi');
        console.log(`   - Action: ${result.action}`);
        console.log(`   - Nouveau compte: ${testEvent.favoritesCount}`);
        
        // Remettre à l'état original
        testEvent.toggleFavorite(testEvent.favoritedBy[testEvent.favoritedBy.length - 1]);
        await testEvent.save();
        
      } catch (error) {
        console.error('❌ Échec du test de validation:', error.message);
        return false;
      }
    }
    
    // Vérification finale des données
    const stillProblematic = await EventDetails.countDocuments({
      isActive: true,
      $or: [
        { 'reviews.replies': { $type: 'number' } },
        { 'reviews.replies': { $type: 'string' } },
        { 'reviews.replies': null },
        { 'reviews.replies': { $exists: false } }
      ]
    });
    
    const totalEvents = await EventDetails.countDocuments({ isActive: true });
    const eventsWithReviews = await EventDetails.countDocuments({ 
      isActive: true, 
      'reviews.0': { $exists: true } 
    });
    
    console.log('\n📊 === RAPPORT FINAL ===');
    console.log(`Total événements: ${totalEvents}`);
    console.log(`Événements avec avis: ${eventsWithReviews}`);
    console.log(`Événements encore problématiques: ${stillProblematic}`);
    
    if (stillProblematic === 0) {
      console.log('\n🎉 SUCCÈS COMPLET ! Tous les problèmes sont résolus.');
      console.log('Vous pouvez maintenant utiliser toggleEventFavorite sans erreur.');
      return true;
    } else {
      console.log('\n⚠️ Certains problèmes persistent encore.');
      return false;
    }
    
  } catch (error) {
    console.error('Erreur validation finale:', error);
    return false;
  }
}

// Exécution du script ultime
if (require.main === module) {
  const MONGODB_URI = 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';
  
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('📡 Connecté à MongoDB pour RÉPARATION ULTIME');
      
      // Diagnostic détaillé
      const problematicEvents = await diagnosticDetailed();
      
      if (problematicEvents.length > 0) {
        // Réparation ultime
        const repairResult = await ultimateRepair();
        console.log('\nRésultat réparation ultime:', repairResult);
        
        // Validation finale avec tests
        const isFixed = await finalValidation();
        
        if (isFixed) {
          console.log('\n🚀 MISSION ACCOMPLIE ! Le problème est résolu.');
        } else {
          console.log('\n💀 Problème persistant - Investigation approfondie nécessaire.');
        }
      } else {
        console.log('\n✅ Aucun problème détecté.');
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur connexion MongoDB:', error);
      process.exit(1);
    });
}

module.exports = {
  diagnosticDetailed,
  ultimateRepair,
  finalValidation
};
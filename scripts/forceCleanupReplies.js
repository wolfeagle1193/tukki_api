// scripts/forceCleanupReplies.js - Nettoyage agressif des replies
const mongoose = require('mongoose');
const EventDetails = require('../models/EventDetails');

async function forceCleanupAllReplies() {
  try {
    console.log('Début du nettoyage forcé de TOUS les replies...');
    
    // Méthode 1: Mise à jour MongoDB directe pour tous les événements
    console.log('Étape 1: Réinitialisation forcée de tous les replies...');
    
    const updateResult = await EventDetails.updateMany(
      { isActive: true },
      { 
        $set: { 
          "reviews.$[].replies": [] 
        }
      }
    );
    
    console.log(`Mise à jour directe appliquée à ${updateResult.modifiedCount} événements`);
    
    // Méthode 2: Nettoyage manuel pour les cas persistants
    console.log('Étape 2: Vérification et nettoyage manuel...');
    
    const events = await EventDetails.find({ 
      isActive: true,
      'reviews.0': { $exists: true }
    });
    
    let manuallyFixed = 0;
    
    for (const event of events) {
      let needsManualFix = false;
      
      if (event.reviews && event.reviews.length > 0) {
        for (let i = 0; i < event.reviews.length; i++) {
          const review = event.reviews[i];
          
          // Forcer la réinitialisation si replies n'est pas un tableau vide
          if (!Array.isArray(review.replies) || review.replies.length > 0) {
            console.log(`Nettoyage manuel review ${i} dans ${event.title}`);
            review.replies = [];
            needsManualFix = true;
          }
        }
      }
      
      if (needsManualFix) {
        try {
          // Forcer la sauvegarde sans validation
          await EventDetails.updateOne(
            { _id: event._id },
            { 
              $set: { 
                reviews: event.reviews.map(review => ({
                  ...review.toObject(),
                  replies: []
                }))
              }
            }
          );
          manuallyFixed++;
          console.log(`Correction manuelle appliquée: ${event.title}`);
        } catch (error) {
          console.error(`Erreur correction manuelle ${event.title}:`, error.message);
        }
      }
    }
    
    console.log(`Corrections manuelles appliquées: ${manuallyFixed}`);
    
    // Méthode 3: Nettoyage agressif avec suppression/recréation
    console.log('Étape 3: Nettoyage agressif des cas extrêmes...');
    
    const problematicEvents = await EventDetails.find({
      isActive: true,
      $or: [
        { 'reviews.replies': { $type: 'number' } },
        { 'reviews.replies': { $type: 'string' } },
        { 'reviews.replies': null },
        { 'reviews.replies': { $exists: false } }
      ]
    });
    
    console.log(`Événements encore problématiques: ${problematicEvents.length}`);
    
    for (const event of problematicEvents) {
      try {
        // Récupérer les reviews sans les replies
        const cleanReviews = event.reviews.map(review => {
          const cleanReview = {
            id: review.id,
            userId: review.userId,
            user: review.user,
            rating: review.rating,
            comment: review.comment,
            likes: review.likes || 0,
            likedBy: review.likedBy || [],
            replies: [], // Force à tableau vide
            createdAt: review.createdAt,
            date: review.date
          };
          return cleanReview;
        });
        
        // Remplacement complet des reviews
        await EventDetails.updateOne(
          { _id: event._id },
          { 
            $set: { 
              reviews: cleanReviews
            }
          }
        );
        
        console.log(`Reconstruction complète des reviews: ${event.title}`);
        
      } catch (error) {
        console.error(`Erreur reconstruction ${event.title}:`, error.message);
      }
    }
    
    return {
      success: true,
      directUpdate: updateResult.modifiedCount,
      manualFixes: manuallyFixed,
      reconstructed: problematicEvents.length
    };
    
  } catch (error) {
    console.error('Erreur pendant le nettoyage forcé:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Vérification finale
async function finalVerification() {
  try {
    console.log('Vérification finale...');
    
    const totalEvents = await EventDetails.countDocuments({ isActive: true });
    const eventsWithReviews = await EventDetails.countDocuments({ 
      isActive: true, 
      'reviews.0': { $exists: true } 
    });
    
    const stillProblematic = await EventDetails.countDocuments({
      isActive: true,
      $or: [
        { 'reviews.replies': { $type: 'number' } },
        { 'reviews.replies': { $type: 'string' } },
        { 'reviews.replies': null },
        { 'reviews.replies': { $exists: false } }
      ]
    });
    
    // Vérifier que tous les replies sont des tableaux
    const eventsWithArrayReplies = await EventDetails.countDocuments({
      isActive: true,
      'reviews.replies': { $type: 'array' }
    });
    
    console.log('\n=== VÉRIFICATION FINALE ===');
    console.log(`Total événements: ${totalEvents}`);
    console.log(`Événements avec avis: ${eventsWithReviews}`);
    console.log(`Événements encore problématiques: ${stillProblematic}`);
    console.log(`Événements avec replies en tableau: ${eventsWithArrayReplies}`);
    
    if (stillProblematic === 0) {
      console.log('✅ SUCCÈS: Tous les replies sont maintenant corrects !');
      return true;
    } else {
      console.log(`❌ ${stillProblematic} événements ont encore des problèmes`);
      return false;
    }
    
  } catch (error) {
    console.error('Erreur vérification finale:', error);
    return false;
  }
}

// Exécution du script
if (require.main === module) {
  const MONGODB_URI = 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';
  
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('Connecté à MongoDB pour nettoyage FORCÉ');
      
      const result = await forceCleanupAllReplies();
      console.log('\nRésultat du nettoyage forcé:', result);
      
      const isClean = await finalVerification();
      
      if (isClean) {
        console.log('\n🎉 Nettoyage terminé avec succès ! Vous pouvez maintenant tester toggleEventFavorite.');
      } else {
        console.log('\n⚠️ Certains problèmes persistent. Contactez le développeur.');
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur connexion MongoDB:', error);
      process.exit(1);
    });
}

module.exports = {
  forceCleanupAllReplies,
  finalVerification
};
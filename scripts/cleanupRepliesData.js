// scripts/cleanupRepliesData.js - Nettoyage des données replies corrompues
const mongoose = require('mongoose');
const EventDetails = require('../models/EventDetails');

async function cleanupCorruptedReplies() {
  try {
    console.log('Début du nettoyage des replies corrompues...');
    
    // Récupérer tous les événements avec des avis
    const events = await EventDetails.find({ 
      isActive: true,
      'reviews.0': { $exists: true }
    });
    
    console.log(`${events.length} événements avec des avis trouvés`);
    
    let fixedEvents = 0;
    let fixedReviews = 0;
    
    for (const event of events) {
      let eventNeedsUpdate = false;
      
      if (event.reviews && event.reviews.length > 0) {
        for (let i = 0; i < event.reviews.length; i++) {
          const review = event.reviews[i];
          
          // Vérifier si replies existe et est correct selon votre nouveau schéma
          if (review.replies === undefined || review.replies === null) {
            console.log(`Événement ${event.title} - Review ${i}: replies manquant, initialisation...`);
            review.replies = [];
            fixedReviews++;
            eventNeedsUpdate = true;
          } else if (!Array.isArray(review.replies)) {
            console.log(`Événement ${event.title} - Review ${i}: replies=${review.replies} (type: ${typeof review.replies})`);
            review.replies = [];
            fixedReviews++;
            eventNeedsUpdate = true;
          } else if (Array.isArray(review.replies)) {
            // Nettoyer les replies invalides selon votre nouveau schéma
            const originalLength = review.replies.length;
            review.replies = review.replies.filter(reply => {
              // Garder seulement les objets valides selon votre nouveau schéma
              return reply && 
                     typeof reply === 'object' && 
                     reply !== null && 
                     (reply._id || reply.user) && 
                     reply.username && 
                     reply.comment &&
                     typeof reply.likes === 'number' &&
                     Array.isArray(reply.likedBy);
            });
            
            if (review.replies.length !== originalLength) {
              console.log(`Nettoyé ${originalLength - review.replies.length} replies invalides dans review ${i}`);
              eventNeedsUpdate = true;
            }
          }
        }
      }
      
      // Sauvegarder si des modifications ont été faites
      if (eventNeedsUpdate) {
        try {
          event.markModified('reviews');
          await event.save();
          fixedEvents++;
          console.log(`Événement corrigé: ${event.title}`);
        } catch (saveError) {
          console.error(`Erreur sauvegarde ${event.title}:`, saveError.message);
          
          // Si la sauvegarde échoue, forcer avec une mise à jour MongoDB directe
          try {
            await EventDetails.updateOne(
              { _id: event._id },
              { 
                $set: { 
                  "reviews.$[].replies": [] 
                }
              }
            );
            console.log(`Correction forcée appliquée pour: ${event.title}`);
            fixedEvents++;
          } catch (forceError) {
            console.error(`Erreur correction forcée ${event.title}:`, forceError.message);
          }
        }
      }
    }
    
    console.log('\n=== RÉSUMÉ DU NETTOYAGE ===');
    console.log(`Événements traités: ${events.length}`);
    console.log(`Événements corrigés: ${fixedEvents}`);
    console.log(`Reviews corrigées: ${fixedReviews}`);
    
    return {
      success: true,
      fixed: fixedEvents,
      total: events.length
    };
    
  } catch (error) {
    console.error('Erreur pendant le nettoyage:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Fonction pour vérifier l'intégrité des données
async function verifyRepliesIntegrity() {
  try {
    console.log('Vérification de l\'intégrité des replies...');
    
    const totalEvents = await EventDetails.countDocuments({ isActive: true });
    const eventsWithReviews = await EventDetails.countDocuments({ 
      isActive: true, 
      'reviews.0': { $exists: true } 
    });
    
    // Chercher les problèmes spécifiques
    const problematicEvents = await EventDetails.aggregate([
      { $match: { isActive: true } },
      { $unwind: { path: '$reviews', preserveNullAndEmptyArrays: true } },
      { 
        $match: { 
          $or: [
            { 'reviews.replies': { $type: 'number' } },
            { 'reviews.replies': { $type: 'string' } },
            { 'reviews.replies': null }
          ]
        } 
      },
      { 
        $group: { 
          _id: '$_id', 
          title: { $first: '$title' },
          problemCount: { $sum: 1 }
        } 
      }
    ]);
    
    console.log('\n=== RAPPORT D\'INTÉGRITÉ ===');
    console.log(`Total événements: ${totalEvents}`);
    console.log(`Événements avec avis: ${eventsWithReviews}`);
    console.log(`Événements avec problèmes de replies: ${problematicEvents.length}`);
    
    if (problematicEvents.length > 0) {
      console.log('\nÉvénements problématiques:');
      problematicEvents.forEach(event => {
        console.log(`- ${event.title} (${event.problemCount} reviews problématiques)`);
      });
      return false;
    } else {
      console.log('Tous les replies sont au bon format');
      return true;
    }
    
  } catch (error) {
    console.error('Erreur vérification:', error);
    return false;
  }
}

// Exécution directe du script
if (require.main === module) {
  const MONGODB_URI = 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';
  
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('Connecté à MongoDB pour nettoyage replies');
      
      // Vérifier d'abord
      const isClean = await verifyRepliesIntegrity();
      
      if (!isClean) {
        console.log('\nLancement du nettoyage...');
        const result = await cleanupCorruptedReplies();
        console.log('Résultat:', result);
        
        // Vérifier à nouveau
        await verifyRepliesIntegrity();
      }
      
      console.log('Script de nettoyage terminé');
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur connexion MongoDB:', error);
      process.exit(1);
    });
}

module.exports = {
  cleanupCorruptedReplies,
  verifyRepliesIntegrity
};
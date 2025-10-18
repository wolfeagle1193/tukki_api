// scripts/deleteAllEvents.js - Suppression complète de tous les événements
const mongoose = require('mongoose');
const EventDetails = require('../models/EventDetails');

async function deleteAllEvents() {
  try {
    console.log('Suppression de TOUS les événements en cours...');
    
    // Compter d'abord
    const totalEvents = await EventDetails.countDocuments();
    console.log(`Total d'événements à supprimer: ${totalEvents}`);
    
    if (totalEvents === 0) {
      console.log('Aucun événement à supprimer.');
      return { success: true, deleted: 0 };
    }
    
    // Suppression complète
    const deleteResult = await EventDetails.deleteMany({});
    
    console.log(`${deleteResult.deletedCount} événements supprimés avec succès.`);
    
    // Vérification
    const remainingEvents = await EventDetails.countDocuments();
    
    if (remainingEvents === 0) {
      console.log('Suppression complète confirmée.');
      return { 
        success: true, 
        deleted: deleteResult.deletedCount,
        remaining: remainingEvents 
      };
    } else {
      console.log(`Attention: ${remainingEvents} événements restants.`);
      return { 
        success: false, 
        deleted: deleteResult.deletedCount,
        remaining: remainingEvents 
      };
    }
    
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Exécution du script
if (require.main === module) {
  const MONGODB_URI = 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';
  
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log('Connecté à MongoDB pour suppression complète');
      
      const result = await deleteAllEvents();
      
      if (result.success) {
        console.log('\nSuppression terminée avec succès !');
        console.log('Vous pouvez maintenant exécuter votre script seedEventsData.js');
        console.log('Commande: node scripts/seedEventsData.js');
      } else {
        console.log('\nProblème lors de la suppression:', result);
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur connexion MongoDB:', error);
      process.exit(1);
    });
}

module.exports = {
  deleteAllEvents
};
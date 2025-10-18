// migration-favoritedBy.js
// Run this script ONCE to add favoritedBy field to all existing RegionDetails documents

require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const RegionDetails = require('../models/RegionDetails'); // Since you're in scripts/ folder, go up one level

async function migrateFavoritedByField() {
  try {
    console.log('🔄 Démarrage de la migration favoritedBy...');
    
    // Find all documents that don't have the favoritedBy field
    const documentsToUpdate = await RegionDetails.find({ 
      favoritedBy: { $exists: false } 
    });
    
    console.log(`📊 ${documentsToUpdate.length} documents trouvés sans le champ favoritedBy`);
    
    if (documentsToUpdate.length === 0) {
      console.log('✅ Aucune migration nécessaire - tous les documents ont déjà le champ favoritedBy');
      return;
    }
    
    // Update all documents without the favoritedBy field
    const result = await RegionDetails.updateMany(
      { favoritedBy: { $exists: false } },
      { $set: { favoritedBy: [] } }
    );
    
    console.log(`✅ Migration terminée: ${result.modifiedCount} documents mis à jour`);
    
    // Verify the migration
    const remainingDocuments = await RegionDetails.find({ 
      favoritedBy: { $exists: false } 
    });
    
    if (remainingDocuments.length === 0) {
      console.log('🎉 Migration réussie - tous les documents ont maintenant le champ favoritedBy');
    } else {
      console.log(`⚠️ ${remainingDocuments.length} documents n'ont toujours pas le champ favoritedBy`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

// If running this script directly
if (require.main === module) {
  mongoose.connect(process.env.MongoDB_URI || 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki')
    .then(() => {
      console.log('🔗 Connecté à MongoDB');
      return migrateFavoritedByField();
    })
    .then(() => {
      console.log('🔚 Migration terminée, fermeture de la connexion...');
      return mongoose.disconnect();
    })
    .catch((error) => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = migrateFavoritedByField;
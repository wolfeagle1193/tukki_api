// scripts/clearTestPhotos.js - VERSION CORRIGÉE POUR MONGODB ATLAS
const mongoose = require('mongoose');
const TreasureDetails = require('../models/TreasureDetails');

// ✅ Configuration avec votre vraie URI MongoDB Atlas
const DB_URI = process.env.MongoDB_URI || 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';

async function clearAllTestPhotos() {
  try {
    console.log('🔄 Connexion à MongoDB Atlas...');
    
    // ✅ Configuration spécifique pour MongoDB Atlas
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Timeout 10 secondes
      socketTimeoutMS: 45000, // Timeout socket 45 secondes
    });
    
    console.log('✅ Connecté à MongoDB Atlas (tukki.iudqchg.mongodb.net)');

    // Compter les photos avant suppression
    console.log('🔍 Recherche des photos existantes...');
    
    const treasureDetailsList = await TreasureDetails.find({
      'photos.0': { $exists: true }
    });
    
    let totalPhotos = 0;
    treasureDetailsList.forEach(td => {
      totalPhotos += td.photos.length;
    });
    
    console.log(`📊 ${totalPhotos} photos trouvées dans ${treasureDetailsList.length} documents`);

    if (totalPhotos === 0) {
      console.log('ℹ️ Aucune photo à supprimer.');
      return;
    }

    // Afficher les détails des documents avec photos
    console.log('\n📋 Documents avec photos :');
    treasureDetailsList.forEach((td, index) => {
      console.log(`  ${index + 1}. TreasureID: ${td.treasure_id} - ${td.photos.length} photos`);
    });

    console.log('\n⚠️ ATTENTION: Cette action va supprimer TOUTES les photos de test.');
    console.log('🗑️ Suppression en cours...');

    // Supprimer toutes les photos de tous les TreasureDetails
    const result = await TreasureDetails.updateMany(
      {}, // Tous les documents
      { 
        $set: { photos: [] } // Vider le tableau photos
      }
    );

    console.log(`\n✅ ${result.modifiedCount} documents mis à jour`);
    console.log(`🗑️ ${totalPhotos} photos supprimées avec succès`);

    // Vérification finale
    const verification = await TreasureDetails.find({
      'photos.0': { $exists: true }
    });
    
    if (verification.length === 0) {
      console.log('🎉 Vérification: Toutes les photos ont été supprimées !');
    } else {
      console.log(`⚠️ Vérification: ${verification.length} documents ont encore des photos`);
    }

    console.log('\n🎉 Nettoyage terminé avec succès !');
    console.log('📝 Vous pouvez maintenant :');
    console.log('   1. Remplacer le modèle TreasureDetails.js');
    console.log('   2. Redémarrer le serveur');
    console.log('   3. Tester les nouvelles photos et likes');

  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage:', error.message);
    
    if (error.name === 'MongoServerError' && error.message.includes('authentication')) {
      console.error('🔐 Erreur d\'authentification: Vérifiez vos identifiants MongoDB Atlas');
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('🌐 Erreur de connexion: Vérifiez votre connexion internet et l\'URI MongoDB');
    }
    
  } finally {
    try {
      await mongoose.disconnect();
      console.log('🔌 Déconnecté de MongoDB Atlas');
    } catch (disconnectError) {
      console.error('❌ Erreur lors de la déconnexion:', disconnectError.message);
    }
    process.exit(0);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  console.log('🧹 Script de nettoyage des photos de test');
  console.log('📍 Base de données: MongoDB Atlas (tukki.iudqchg.mongodb.net)\n');
  clearAllTestPhotos();
}

module.exports = clearAllTestPhotos;
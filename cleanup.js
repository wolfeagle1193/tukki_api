// cleanup.js
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_CONNECTION || 'mongodb://localhost:27017/tukki';

async function cleanupDB() {
    try {
        console.log('🔗 Connexion à MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté!');
        
        console.log('\n🔍 État avant nettoyage:');
        
        // Lister les excursions avant suppression
        const excursions = await mongoose.connection.db.collection('excursions').find({}, {title: 1}).toArray();
        console.log('📋 Excursions à supprimer:');
        excursions.forEach((exc, index) => {
            console.log(`   ${index + 1}. ${exc.title}`);
        });
        
        console.log(`\n📊 Total: ${excursions.length} excursions`);
        
        // SUPPRESSION COMPLÈTE
        console.log('\n🗑️ Suppression en cours...');
        const result = await mongoose.connection.db.collection('excursions').deleteMany({});
        
        console.log(`✅ ${result.deletedCount} excursions supprimées`);
        
        // Vérification finale
        const remaining = await mongoose.connection.db.collection('excursions').countDocuments({});
        console.log(`📊 Excursions restantes: ${remaining}`);
        
        if (remaining === 0) {
            console.log('\n🎉 BASE DE DONNÉES NETTOYÉE AVEC SUCCÈS !');
            console.log('✅ Prêt pour des excursions avec le nouveau système');
        } else {
            console.log('\n⚠️ Attention: Des excursions subsistent');
        }
        
        console.log('\n✅ Nettoyage terminé');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

// Confirmation de sécurité
console.log('⚠️  ATTENTION: Ce script va supprimer TOUTES les excursions !');
console.log('🎯 Excursions à supprimer: données de test avec auditLog corrompu');
console.log('⏳ Démarrage dans 3 secondes...\n');

setTimeout(() => {
    cleanupDB();
}, 3000);
// diagnostic.js
const mongoose = require('mongoose');
const path = require('path');

// ✅ Charger votre configuration (adaptez le chemin si nécessaire)
require('dotenv').config();

// ✅ Utiliser votre connection string existante
const MONGODB_URI = process.env.MONGODB_URI || process.env.DB_CONNECTION || 'mongodb://localhost:27017/tukki';

console.log('🔗 Connection string:', MONGODB_URI);

async function diagnosticDB() {
    try {
        console.log('🔗 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB avec succès!');
        
        // ✅ Informations générales
        console.log('\n📊 === DIAGNOSTIC COMPLET ===');
        console.log('Base de données:', mongoose.connection.name);
        
        // ✅ Compter les excursions
        const excursionCount = await mongoose.connection.db.collection('excursions').countDocuments({});
        console.log(`📊 Nombre d'excursions: ${excursionCount}`);
        
        if (excursionCount === 0) {
            console.log('✅ Aucune excursion - base propre!');
            process.exit(0);
        }
        
        // ✅ Analyser les excursions existantes
        const excursions = await mongoose.connection.db.collection('excursions').find({}).toArray();
        
        console.log('\n🔍 === ANALYSE DES EXCURSIONS ===');
        let totalProblematic = 0;
        
        excursions.forEach((excursion, index) => {
            const totalSize = JSON.stringify(excursion).length;
            const auditLogSize = excursion.auditLog ? JSON.stringify(excursion.auditLog).length : 0;
            const auditLogCount = excursion.auditLog ? excursion.auditLog.length : 0;
            
            console.log(`\n📋 Excursion ${index + 1}: "${excursion.title}"`);
            console.log(`   Taille totale: ${Math.round(totalSize / 1024)} KB`);
            console.log(`   AuditLog: ${auditLogCount} entrées, ${Math.round(auditLogSize / 1024)} KB`);
            
            if (auditLogSize > 100000) { // Plus de 100KB
                console.log(`   🚨 PROBLÉMATIQUE: AuditLog trop volumineux!`);
                totalProblematic++;
            }
            
            if (totalSize > 1000000) { // Plus de 1MB
                console.log(`   🚨 EXCURSION ÉNORME: ${Math.round(totalSize / 1024)} KB!`);
            }
        });
        
        console.log(`\n📊 === RÉSUMÉ ===`);
        console.log(`Total excursions: ${excursionCount}`);
        console.log(`Excursions problématiques: ${totalProblematic}`);
        
        if (totalProblematic > 0) {
            console.log('\n💡 RECOMMANDATION: Supprimer toutes les excursions tests');
            console.log('    Ces données sont corrompues par l\'ancien système d\'audit');
            
            // ✅ Proposer la suppression
            console.log('\n🗑️ Pour supprimer TOUTES les excursions tests :');
            console.log('   Créez un fichier cleanup.js et exécutez-le');
        } else {
            console.log('✅ Toutes les excursions semblent saines!');
        }
        
        console.log('\n✅ Diagnostic terminé');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erreur de connexion:', error.message);
        console.log('\n🔧 Vérifiez:');
        console.log('   1. MongoDB est-il démarré?');
        console.log('   2. La connection string est-elle correcte?');
        console.log('   3. Les permissions de connexion?');
        process.exit(1);
    }
}

diagnosticDB();
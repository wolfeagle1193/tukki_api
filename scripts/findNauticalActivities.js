// scripts/fixNauticalDirect.js
// Script direct avec URI MongoDB Atlas

const mongoose = require('mongoose');
const RegionDetails = require('../models/RegionDetails');

// ✅ VOTRE URI MONGODB ATLAS DIRECTEMENT
const MONGODB_URI = 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';

async function diagnosticEtCorrection() {
    try {
        console.log('🔗 Connexion à MongoDB Atlas...');
        console.log('📍 Base de données: tukkisn2025\n');
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB Atlas avec succès!\n');
        
        // === 1. DIAGNOSTIC ===
        console.log('🔍 === DIAGNOSTIC "Activités nautiques" ===');
        
        const countNautical = await RegionDetails.countDocuments({
            'services.type': 'Activités nautiques'
        });
        
        console.log(`📊 Entrées "Activités nautiques" trouvées: ${countNautical}`);
        
        if (countNautical > 0) {
            console.log('\n🚨 PROBLÈME CONFIRMÉ dans votre base Atlas !');
            
            // Afficher les détails
            const regionsWithNautical = await RegionDetails.find({
                'services.type': 'Activités nautiques'
            }).limit(5);
            
            console.log('\n📋 Détails des régions problématiques:');
            regionsWithNautical.forEach((region, index) => {
                const nauticalServices = region.services.filter(s => s.type === 'Activités nautiques');
                console.log(`${index + 1}. Région ID: ${region.region_id}`);
                console.log(`   - ${nauticalServices.length} service(s) "Activités nautiques"`);
                nauticalServices.forEach(service => {
                    console.log(`   - ${service.icon} ${service.description || 'Pas de description'}`);
                });
                console.log('');
            });
            
            // === 2. CORRECTION AUTOMATIQUE ===
            console.log('🔧 === CORRECTION AUTOMATIQUE ===');
            console.log('Correction en cours...\n');
            
            const updateResult = await RegionDetails.updateMany(
                { 'services.type': 'Activités nautiques' },
                { 
                    $set: { 
                        'services.$.type': 'Loisirs',
                        'services.$.icon': '🎯',
                        'services.$.description': 'Activités de loisirs et divertissements'
                    } 
                }
            );
            
            console.log(`✅ CORRECTION TERMINÉE !`);
            console.log(`📈 ${updateResult.modifiedCount} région(s) mise(s) à jour`);
            console.log(`📈 ${updateResult.matchedCount} région(s) correspondante(s)`);
            
            // Vérification finale
            const remainingCount = await RegionDetails.countDocuments({
                'services.type': 'Activités nautiques'
            });
            
            if (remainingCount === 0) {
                console.log('\n🎉 SUCCÈS TOTAL ! Toutes les "Activités nautiques" ont été éliminées');
            } else {
                console.log(`\n⚠️ ${remainingCount} entrée(s) problématique(s) restante(s)`);
            }
            
        } else {
            console.log('\n✅ AUCUNE "Activités nautiques" trouvée dans Atlas !');
            console.log('Le problème vient du FRONTEND (JavaScript/React)');
        }
        
        // === 3. STATISTIQUES COMPLÈTES ===
        console.log('\n📈 === STATISTIQUES DES SERVICES ===');
        await afficherStatistiquesServices();
        
        // === 4. ACTIONS SUIVANTES ===
        console.log('\n🎯 === ACTIONS SUIVANTES ===');
        if (countNautical > 0) {
            console.log('1. ✅ Base de données corrigée');
            console.log('2. 🔄 Redémarrez votre serveur backend');
            console.log('3. 🗑️ Videz le cache navigateur (F12 → Application → Clear Storage)');
            console.log('4. 🔄 Rechargez votre frontend');
            console.log('5. 🧪 Testez la sauvegarde d\'une région');
        } else {
            console.log('1. 🔍 Vérifiez window.REGION_SERVICES dans le navigateur');
            console.log('2. 🔍 Cherchez "nautiques" dans votre code frontend');
            console.log('3. 🗑️ Videz localStorage.clear() dans la console navigateur');
            console.log('4. 🔍 Vérifiez les constantes de services dans RegionDetailsModal.js');
        }
        
    } catch (error) {
        console.error('\n❌ ERREUR:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.log('\n💡 Erreur d\'authentification MongoDB Atlas');
            console.log('✅ Vérifiez vos identifiants : tukkisn2025 / tukkisn2025');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('\n💡 Erreur de réseau - Vérifiez votre connexion internet');
        } else {
            console.log('\n💡 Erreur technique:', error.stack);
        }
    }
}

async function afficherStatistiquesServices() {
    try {
        const totalRegions = await RegionDetails.countDocuments();
        console.log(`📊 Total régions dans la base: ${totalRegions}`);
        
        if (totalRegions === 0) {
            console.log('ℹ️ Aucune région trouvée dans la base de données');
            return;
        }
        
        // Agrégation des services
        const pipeline = [
            { $unwind: '$services' },
            { $group: { _id: '$services.type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ];
        
        const serviceStats = await RegionDetails.aggregate(pipeline);
        
        const validTypes = [
            'Hébergement', 'Restauration', 'Transport', 'Guide touristique', 
            'Loisirs', 'Administration', 'Accessibilité', 
            'Boutique souvenirs', 'Santé', 'Banque'
        ];
        
        console.log('\n📋 Répartition des services:');
        if (serviceStats.length === 0) {
            console.log('ℹ️ Aucun service trouvé');
        } else {
            serviceStats.forEach(stat => {
                const isValid = validTypes.includes(stat._id);
                console.log(`${isValid ? '✅' : '❌'} ${stat._id}: ${stat.count} utilisation(s)`);
            });
            
            // Compter les services invalides
            const invalidServices = serviceStats.filter(stat => !validTypes.includes(stat._id));
            if (invalidServices.length > 0) {
                console.log(`\n⚠️ ${invalidServices.length} type(s) de service invalide(s) détecté(s) !`);
            } else {
                console.log('\n✅ Tous les services sont valides !');
            }
        }
        
    } catch (error) {
        console.log('⚠️ Impossible d\'afficher les statistiques:', error.message);
    }
}

// === FONCTION PRINCIPALE ===
async function main() {
    console.log('🚀 === DIAGNOSTIC ET CORRECTION "Activités nautiques" ===');
    console.log('📅 Date:', new Date().toLocaleString());
    console.log('🔗 Cible: MongoDB Atlas (tukkisn2025)\n');
    
    try {
        await diagnosticEtCorrection();
        
    } finally {
        try {
            await mongoose.disconnect();
            console.log('\n🔌 Déconnexion MongoDB Atlas');
        } catch (e) {
            // Ignorer les erreurs de déconnexion
        }
        
        console.log('\n✨ Script terminé !');
        process.exit(0);
    }
}

// === EXPORT ET EXÉCUTION ===
module.exports = { diagnosticEtCorrection, afficherStatistiquesServices };

if (require.main === module) {
    main().catch(console.error);
}
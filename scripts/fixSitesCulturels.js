// scripts/fixSitesCulturels.js
// Correction simple pour Windows

const mongoose = require('mongoose');
const RegionDetails = require('../models/RegionDetails');

const MONGODB_URI = 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';

async function fixSitesCulturels() {
    try {
        console.log('🔧 Correction "Sites culturels"...');
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à Atlas');
        
        // Corriger "Sites culturels" → "Guide touristique"
        const result = await RegionDetails.updateMany(
            { 'services.type': 'Sites culturels' },
            { 
                $set: { 
                    'services.$.type': 'Guide touristique',
                    'services.$.icon': '👥',
                    'services.$.description': 'Guides et visites culturelles'
                } 
            }
        );
        
        console.log(`✅ ${result.modifiedCount} région(s) corrigée(s)`);
        
        // Vérification finale
        const remaining = await RegionDetails.countDocuments({
            'services.type': 'Sites culturels'
        });
        
        if (remaining === 0) {
            console.log('🎉 "Sites culturels" éliminé avec succès !');
        } else {
            console.log(`⚠️ ${remaining} entrée(s) restante(s)`);
        }
        
        // Statistiques finales
        const validTypes = [
            'Hébergement', 'Restauration', 'Transport', 'Guide touristique', 
            'Loisirs', 'Administration', 'Accessibilité', 
            'Boutique souvenirs', 'Santé', 'Banque'
        ];
        
        const pipeline = [
            { $unwind: '$services' },
            { $group: { _id: '$services.type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ];
        
        const allServices = await RegionDetails.aggregate(pipeline);
        
        console.log('\n📋 État final:');
        let allValid = true;
        
        allServices.forEach(service => {
            const isValid = validTypes.includes(service._id);
            if (!isValid) allValid = false;
            console.log(`${isValid ? '✅' : '❌'} ${service._id}: ${service.count}`);
        });
        
        if (allValid) {
            console.log('\n🎉 PARFAIT ! Tous les services sont valides !');
            console.log('\n📋 Actions suivantes:');
            console.log('1. Redémarrez votre serveur backend');
            console.log('2. Videz le cache navigateur (F12 → Clear Storage)');
            console.log('3. Rechargez votre frontend');
            console.log('4. Testez la sauvegarde d\'une région');
            console.log('\n💡 L\'erreur ne devrait plus apparaître !');
        } else {
            console.log('\n⚠️ Il reste des services invalides');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Déconnexion Atlas');
        process.exit(0);
    }
}

fixSitesCulturels();
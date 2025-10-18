// ===== SCRIPT DE DIAGNOSTIC IMMÉDIAT =====
// Fichier: scripts/diagnosticPopularPlaces.js

const mongoose = require('mongoose');
const RegionDetails = require('../models/RegionDetails');

const DB_URI = process.env.MONGODB_URI || 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';

async function diagnosticDetailed() {
    try {
        console.log('🔍 === DIAGNOSTIC DÉTAILLÉ DES PLACES POPULAIRES ===');
        
        await mongoose.connect(DB_URI);
        console.log('✅ Connexion MongoDB établie');
        
        // Récupérer les régions avec places populaires
        const regionsDetails = await RegionDetails.find({ 
            popularPlaces: { $exists: true, $ne: [] }
        });
        
        console.log(`🔍 ${regionsDetails.length} région(s) trouvée(s)`);
        
        for (const regionDetail of regionsDetails) {
            const regionId = regionDetail.region_id;
            console.log(`\n🌍 === RÉGION ${regionId} ===`);
            
            for (let i = 0; i < regionDetail.popularPlaces.length; i++) {
                const place = regionDetail.popularPlaces[i];
                
                console.log(`\n📍 === PLACE ${i}: "${place.title}" ===`);
                console.log(`🔹 Raw Object:`, JSON.stringify(place, null, 2));
                console.log(`🔹 ID: ${place.id} (type: ${typeof place.id})`);
                console.log(`🔹 hasImage: ${place.hasImage} (type: ${typeof place.hasImage})`);
                console.log(`🔹 imageUrl: "${place.imageUrl}" (type: ${typeof place.imageUrl})`);
                
                // Tests de vérification
                console.log(`\n🧪 === TESTS ===`);
                console.log(`🔸 place.hasImage === true: ${place.hasImage === true}`);
                console.log(`🔸 place.hasImage == true: ${place.hasImage == true}`);
                console.log(`🔸 place.hasImage === 'true': ${place.hasImage === 'true'}`);
                console.log(`🔸 Boolean(place.hasImage): ${Boolean(place.hasImage)}`);
                console.log(`🔸 place.hasImage ? 'truthy' : 'falsy': ${place.hasImage ? 'truthy' : 'falsy'}`);
                
                // Vérifier les propriétés de l'objet
                console.log(`\n🔍 === PROPRIÉTÉS DE L'OBJET ===`);
                console.log(`🔸 Object.keys(place):`, Object.keys(place));
                console.log(`🔸 place.hasOwnProperty('hasImage'):`, place.hasOwnProperty('hasImage'));
                console.log(`🔸 'hasImage' in place:`, 'hasImage' in place);
                
                // Vérifier si c'est un objet Mongoose
                console.log(`\n🔍 === MONGOOSE INFO ===`);
                console.log(`🔸 place.constructor.name:`, place.constructor.name);
                console.log(`🔸 place.toObject ? 'oui' : 'non':`, place.toObject ? 'oui' : 'non');
                
                if (place.toObject) {
                    const plainObject = place.toObject();
                    console.log(`🔸 Plain object hasImage:`, plainObject.hasImage, `(type: ${typeof plainObject.hasImage})`);
                    console.log(`🔸 Plain object === true:`, plainObject.hasImage === true);
                }
            }
        }
        
        // Test de sauvegarde simple
        console.log(`\n🧪 === TEST DE SAUVEGARDE SIMPLE ===`);
        const testRegion = regionsDetails[0];
        if (testRegion && testRegion.popularPlaces.length > 0) {
            const testPlace = testRegion.popularPlaces[0];
            console.log(`🔧 Test sur place: "${testPlace.title}"`);
            console.log(`🔧 Avant: hasImage = ${testPlace.hasImage} (${typeof testPlace.hasImage})`);
            
            // Forcer hasImage à true
            testPlace.hasImage = true;
            console.log(`🔧 Après assignation: hasImage = ${testPlace.hasImage} (${typeof testPlace.hasImage})`);
            
            // Tenter de sauvegarder
            try {
                await testRegion.save();
                console.log(`✅ Sauvegarde réussie`);
                
                // Re-lire depuis la base
                const reloaded = await RegionDetails.findById(testRegion._id);
                const reloadedPlace = reloaded.popularPlaces[0];
                console.log(`🔧 Après rechargement: hasImage = ${reloadedPlace.hasImage} (${typeof reloadedPlace.hasImage})`);
                console.log(`🔧 Après rechargement === true: ${reloadedPlace.hasImage === true}`);
                
            } catch (saveError) {
                console.error(`❌ Erreur de sauvegarde:`, saveError);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Connexion fermée');
        process.exit(0);
    }
}

// Point d'entrée
if (require.main === module) {
    console.log('🚀 Lancement du diagnostic détaillé...');
    diagnosticDetailed();
}

module.exports = { diagnosticDetailed };
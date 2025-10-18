// ===== SCRIPT DE RÉPARATION DIRECT SERVEUR =====
// Fichier: scripts/repairPopularPlaces.js
// À créer dans votre dossier backend

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ✅ IMPORTEZ VOS MODÈLES (ajustez selon votre structure)
const RegionDetails = require('../models/RegionDetails'); // Ajustez le chemin

// ✅ CONFIGURATION DE LA BASE DE DONNÉES
const DB_URI ='mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';

async function repairPopularPlaces() {
    try {
        console.log('🔧 === DÉBUT RÉPARATION PLACES POPULAIRES ===');
        console.log(`🔗 Connexion à la base de données: ${DB_URI}`);
        
        // 1. CONNEXION À LA BASE DE DONNÉES
        await mongoose.connect(DB_URI);
        console.log('✅ Connexion MongoDB établie');
        
        // 2. RÉCUPÉRER TOUTES LES RÉGIONS AVEC DES PLACES POPULAIRES
        const regionsDetails = await RegionDetails.find({ 
            $and: [
                { popularPlaces: { $exists: true } },
                { popularPlaces: { $ne: [] } },
                { "popularPlaces.0": { $exists: true } }
            ]
        });
        
        console.log(`🔍 ${regionsDetails.length} région(s) trouvée(s) avec des places populaires`);
        
        let totalRepaired = 0;
        let totalErrors = 0;
        
        for (const regionDetail of regionsDetails) {
            const regionId = regionDetail.region_id;
            console.log(`\n🌍 === TRAITEMENT RÉGION ${regionId} ===`);
            
            try {
                // 3. SCANNER LE DOSSIER D'IMAGES
                const imageDir = path.join(__dirname, '..', 'assets', 'images', 'popular_places', regionId.toString());
                
                if (!fs.existsSync(imageDir)) {
                    console.log(`📁 Dossier images inexistant pour région ${regionId}`);
                    continue;
                }
                
                const files = fs.readdirSync(imageDir).filter(file => 
                    file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
                );
                
                console.log(`📁 ${files.length} fichier(s) image(s) trouvé(s):`);
                files.slice(0, 5).forEach(file => console.log(`   - ${file}`));
                if (files.length > 5) console.log(`   ... et ${files.length - 5} autres`);
                
                if (files.length === 0) {
                    console.log(`📁 Aucune image à associer pour région ${regionId}`);
                    continue;
                }
                
                // 4. ANALYSER LES FICHIERS ET EXTRAIRE LES IDs
                const imageMap = new Map();
                
                files.forEach(fileName => {
                    let placeId = null;
                    let placeIndex = null;
                    
                    // Pattern 1: place_0_1234567890.webp (index + timestamp)
                    const pattern1 = fileName.match(/place_(\d+)_(\d{13,})/);
                    if (pattern1) {
                        placeIndex = parseInt(pattern1[1]);
                        placeId = parseInt(pattern1[2]);
                    }
                    
                    // Pattern 2: place_1234567890_5678901234.webp (deux timestamps)
                    if (!pattern1) {
                        const pattern2 = fileName.match(/place_(\d{13,})_(\d{10,})/);
                        if (pattern2) {
                            placeId = parseInt(pattern2[1]);
                            placeIndex = 0; // Défaut si pas d'index
                        }
                    }
                    
                    // Pattern 3: place_0_1234567890_nom.webp (index + timestamp + nom)
                    if (!pattern1 && !pattern2) {
                        const pattern3 = fileName.match(/place_(\d+)_(\d{13,})_/);
                        if (pattern3) {
                            placeIndex = parseInt(pattern3[1]);
                            placeId = parseInt(pattern3[2]);
                        }
                    }
                    
                    if (placeId && placeIndex !== null) {
                        if (!imageMap.has(placeIndex)) {
                            imageMap.set(placeIndex, []);
                        }
                        imageMap.get(placeIndex).push({
                            fileName,
                            placeId,
                            placeIndex,
                            fileSize: fs.statSync(path.join(imageDir, fileName)).size
                        });
                    }
                });
                
                console.log(`🗂️ ${imageMap.size} groupe(s) d'images identifié(s)`);
                
                // 5. AFFICHER L'ÉTAT ACTUEL DES PLACES
                console.log('\n📋 État actuel des places populaires:');
                regionDetail.popularPlaces.forEach((place, i) => {
                    console.log(`📍 Place ${i}: "${place.title}"`);
                    console.log(`   - ID: ${place.id || 'undefined'}`);
                    console.log(`   - hasImage: ${place.hasImage || 'undefined'}`);
                    console.log(`   - imageUrl: "${place.imageUrl || ''}"`);
                });
                
                // 6. METTRE À JOUR LES PLACES POPULAIRES
                let placesUpdated = 0;
                
                for (let i = 0; i < regionDetail.popularPlaces.length; i++) {
                    const place = regionDetail.popularPlaces[i];
                    
                    console.log(`\n🔧 Traitement place ${i}: "${place.title}"`);
                    
                    // Chercher une image correspondante
                    let bestMatch = null;
                    
                    // Priorité 1: Match exact par index
                    if (imageMap.has(i)) {
                        const candidates = imageMap.get(i);
                        bestMatch = candidates[0]; // Prendre le premier
                        console.log(`✅ Match exact trouvé par index ${i}: ${bestMatch.fileName}`);
                    }
                    
                    // Priorité 2: Match par ID si la place a déjà un ID
                    if (!bestMatch && place.id) {
                        for (const [index, images] of imageMap.entries()) {
                            const match = images.find(img => img.placeId === place.id);
                            if (match) {
                                bestMatch = match;
                                console.log(`✅ Match trouvé par ID ${place.id}: ${bestMatch.fileName}`);
                                break;
                            }
                        }
                    }
                    
                    // Priorité 3: Première image disponible
                    if (!bestMatch && imageMap.size > 0) {
                        for (const [index, images] of imageMap.entries()) {
                            if (images.length > 0) {
                                bestMatch = images[0];
                                console.log(`⚠️ Match par défaut: ${bestMatch.fileName}`);
                                break;
                            }
                        }
                    }
                    
                    // 7. APPLIQUER LA RÉPARATION
                    if (bestMatch) {
                        const imageUrl = `/assets/images/popular_places/${regionId}/${bestMatch.fileName}`;
                        
                        // Mettre à jour la place
                        regionDetail.popularPlaces[i].id = bestMatch.placeId;
                        regionDetail.popularPlaces[i].hasImage = true;
                        regionDetail.popularPlaces[i].imageUrl = imageUrl;
                        
                        placesUpdated++;
                        
                        console.log(`🔧 Place réparée:`);
                        console.log(`   - Nouveau ID: ${bestMatch.placeId}`);
                        console.log(`   - hasImage: true`);
                        console.log(`   - imageUrl: ${imageUrl}`);
                        
                        // Retirer l'image de la map pour éviter les doublons
                        imageMap.get(bestMatch.placeIndex).splice(
                            imageMap.get(bestMatch.placeIndex).indexOf(bestMatch), 1
                        );
                        if (imageMap.get(bestMatch.placeIndex).length === 0) {
                            imageMap.delete(bestMatch.placeIndex);
                        }
                    } else {
                        console.log(`❌ Aucune image trouvée pour la place "${place.title}"`);
                    }
                }
                
                // 8. SAUVEGARDER LES MODIFICATIONS
                if (placesUpdated > 0) {
                    await regionDetail.save();
                    console.log(`💾 Région ${regionId} sauvegardée avec ${placesUpdated} place(s) réparée(s)`);
                    totalRepaired += placesUpdated;
                } else {
                    console.log(`💾 Aucune modification à sauvegarder pour région ${regionId}`);
                }
                
            } catch (regionError) {
                console.error(`❌ Erreur lors du traitement de la région ${regionId}:`, regionError);
                totalErrors++;
            }
        }
        
        console.log('\n🎉 === RÉPARATION TERMINÉE ===');
        console.log(`✅ ${totalRepaired} place(s) populaire(s) réparée(s)`);
        console.log(`❌ ${totalErrors} erreur(s) rencontrée(s)`);
        
        // 9. VÉRIFICATION FINALE
        console.log('\n🔍 === VÉRIFICATION FINALE ===');
        await verifyRepair();
        
    } catch (error) {
        console.error('❌ Erreur lors de la réparation:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Connexion MongoDB fermée');
        process.exit(0);
    }
}

async function verifyRepair() {
    try {
        const regionsDetails = await RegionDetails.find({ 
            popularPlaces: { $exists: true, $ne: [] }
        });
        
        let totalPlaces = 0;
        let placesWithImages = 0;
        let placesWithValidUrls = 0;
        
        for (const regionDetail of regionsDetails) {
            const regionId = regionDetail.region_id;
            
            for (let i = 0; i < regionDetail.popularPlaces.length; i++) {
                const place = regionDetail.popularPlaces[i];
                totalPlaces++;
                
                if (place.hasImage) {
                    placesWithImages++;
                }
                
                if (place.imageUrl && place.imageUrl !== '') {
                    placesWithValidUrls++;
                    
                    // Vérifier si le fichier existe physiquement
                    const filePath = path.join(__dirname, '..', place.imageUrl.replace('/assets/', 'assets/'));
                    if (fs.existsSync(filePath)) {
                        console.log(`✅ ${regionId} - "${place.title}": Image vérifiée`);
                    } else {
                        console.log(`❌ ${regionId} - "${place.title}": Fichier manquant ${place.imageUrl}`);
                    }
                }
            }
        }
        
        console.log('\n📊 === STATISTIQUES FINALES ===');
        console.log(`📍 Total places: ${totalPlaces}`);
        console.log(`🖼️ Places avec hasImage=true: ${placesWithImages}`);
        console.log(`🔗 Places avec imageUrl valide: ${placesWithValidUrls}`);
        console.log(`✅ Taux de réparation: ${Math.round(placesWithImages/totalPlaces*100)}%`);
        
        if (placesWithImages === totalPlaces) {
            console.log('\n🎉 SUCCÈS TOTAL ! Toutes les places ont des images associées !');
        } else if (placesWithImages > 0) {
            console.log('\n⚠️ SUCCÈS PARTIEL. Certaines places n\'ont pas d\'images.');
        } else {
            console.log('\n❌ ÉCHEC. Aucune place n\'a été réparée.');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    }
}

// ✅ POINT D'ENTRÉE
if (require.main === module) {
    console.log('🚀 Lancement du script de réparation des places populaires...');
    repairPopularPlaces();
}

module.exports = { repairPopularPlaces, verifyRepair };
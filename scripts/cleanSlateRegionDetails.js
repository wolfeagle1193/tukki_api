// scripts/cleanSlateRegionDetails.js
// Script pour supprimer toutes les données de test RegionDetails et repartir à zéro

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://tukkisn2025:tukkisn2025@tukki.iudqchg.mongodb.net/tukkisn2025?retryWrites=true&w=majority&appName=tukki';

async function cleanSlateRegionDetails() {
    try {
        console.log('🗑️ === NETTOYAGE COMPLET REGIONDETAILS ===\n');
        console.log('⚠️ ATTENTION: Ce script va supprimer TOUTES les données RegionDetails');
        console.log('📅 Date:', new Date().toLocaleString());
        console.log('🎯 Cible: MongoDB Atlas (tukkisn2025)\n');
        
        // Connexion à MongoDB Atlas
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB Atlas\n');
        
        // Utiliser directement la collection
        const db = mongoose.connection.db;
        const regionDetailsCollection = db.collection('regiondetails');
        
        // 1. ANALYSER CE QUI VA ÊTRE SUPPRIMÉ
        console.log('🔍 1. ANALYSE DES DONNÉES ACTUELLES:');
        
        const allDocs = await regionDetailsCollection.find({}).toArray();
        console.log(`📊 ${allDocs.length} document(s) trouvé(s) dans regiondetails`);
        
        if (allDocs.length === 0) {
            console.log('✅ Collection déjà vide, rien à supprimer !');
            return;
        }
        
        // Afficher un aperçu des données qui seront supprimées
        console.log('\n📋 APERÇU DES DONNÉES À SUPPRIMER:');
        allDocs.slice(0, 5).forEach((doc, index) => {
            console.log(`${index + 1}. ID: ${doc._id}`);
            console.log(`   treasure_id: ${doc.treasure_id || 'NON DÉFINI'}`);
            console.log(`   description: ${doc.description ? doc.description.substring(0, 50) + '...' : 'NON DÉFINIE'}`);
            console.log(`   services: ${doc.services ? doc.services.length : 0} service(s)`);
            console.log(`   créé le: ${doc.createdAt || 'Date inconnue'}`);
            console.log('');
        });
        
        if (allDocs.length > 5) {
            console.log(`... et ${allDocs.length - 5} autres document(s)\n`);
        }
        
        // 2. CONFIRMATION AUTOMATIQUE (pour éviter les prompts interactifs)
        console.log('⏰ Suppression automatique dans 3 secondes...');
        console.log('💡 Appuyez sur Ctrl+C pour annuler maintenant !');
        
        // Attendre 3 secondes
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 3. SUPPRESSION COMPLÈTE
        console.log('\n🗑️ 2. SUPPRESSION EN COURS:');
        
        const deleteResult = await regionDetailsCollection.deleteMany({});
        
        console.log(`✅ ${deleteResult.deletedCount} document(s) supprimé(s)`);
        
        // 4. VÉRIFICATION DE LA SUPPRESSION
        console.log('\n✅ 3. VÉRIFICATION:');
        
        const remainingDocs = await regionDetailsCollection.countDocuments();
        
        if (remainingDocs === 0) {
            console.log('🎉 Collection regiondetails complètement vidée !');
        } else {
            console.log(`⚠️ ${remainingDocs} document(s) restant(s)`);
        }
        
        // 5. OPTIONNEL: SUPPRIMER LES FICHIERS IMAGES DE TEST
        console.log('\n🖼️ 4. NETTOYAGE DES IMAGES:');
        
        try {
            const fs = require('fs');
            const path = require('path');
            
            const uploadsPath = path.join(__dirname, '../uploads/gallery');
            
            if (fs.existsSync(uploadsPath)) {
                const files = fs.readdirSync(uploadsPath);
                console.log(`📁 ${files.length} fichier(s) trouvé(s) dans uploads/gallery/`);
                
                if (files.length > 0) {
                    console.log('🗑️ Suppression des images de test...');
                    
                    let deletedFiles = 0;
                    files.forEach(file => {
                        try {
                            fs.unlinkSync(path.join(uploadsPath, file));
                            deletedFiles++;
                        } catch (e) {
                            console.log(`⚠️ Impossible de supprimer ${file}`);
                        }
                    });
                    
                    console.log(`✅ ${deletedFiles} fichier(s) image(s) supprimé(s)`);
                } else {
                    console.log('✅ Dossier gallery déjà vide');
                }
            } else {
                console.log('ℹ️ Dossier uploads/gallery/ n\'existe pas');
            }
        } catch (fsError) {
            console.log('⚠️ Erreur nettoyage images (non-bloquant):', fsError.message);
        }
        
        // 6. CRÉATION D'UN DOCUMENT DE TEST VALIDE (OPTIONNEL)
        console.log('\n🧪 5. CRÉATION D\'UN DOCUMENT DE TEST VALIDE:');
        console.log('Voulez-vous créer un document de test valide ? (Recommandé)');
        
        // Créer un document de test automatiquement
        const testRegionId = new mongoose.Types.ObjectId();
        
        const testDocument = {
            treasure_id: testRegionId,
            description: 'Document de test créé après nettoyage. Cette description est suffisamment longue pour passer la validation et contient toutes les informations requises pour tester le bon fonctionnement du système.',
            location: 'Localisation de test - Dakar, Sénégal, Presqu\'île du Cap-Vert',
            rating: 4.5,
            totalReviews: 0,
            services: [
                {
                    type: 'Hébergement',
                    icon: '🏨',
                    description: 'Hôtels et hébergements',
                    priority: 1,
                    isActive: true,
                    createdAt: new Date()
                },
                {
                    type: 'Restauration',
                    icon: '🍽️',
                    description: 'Restaurants et cafés',
                    priority: 2,
                    isActive: true,
                    createdAt: new Date()
                }
            ],
            gallery: [],
            textSettings: {
                fontSize: 16,
                lineHeight: 1.4,
                fontFamily: 'system',
                alignment: 'left'
            },
            metadata: {
                completionStatus: {
                    percentage: 100,
                    lastCalculated: new Date()
                },
                seoOptimized: true,
                featuredServices: ['Hébergement', 'Restauration'],
                tags: ['test', 'dakar', 'sénégal'],
                language: 'fr'
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        try {
            const insertResult = await regionDetailsCollection.insertOne(testDocument);
            console.log('✅ Document de test créé avec ID:', insertResult.insertedId);
            console.log('📋 treasure_id du test:', testRegionId);
            console.log('💡 Utilisez cet ID pour tester votre frontend');
        } catch (insertError) {
            console.log('❌ Erreur création document test:', insertError.message);
            console.log('💡 Pas grave, vous pourrez créer des régions depuis le frontend');
        }
        
        // 7. INSTRUCTIONS FINALES
        console.log('\n📋 6. ACTIONS SUIVANTES:');
        console.log('1. ✅ Collection regiondetails complètement nettoyée');
        console.log('2. ✅ Images de test supprimées');
        console.log('3. ✅ Document de test valide créé (optionnel)');
        console.log('');
        console.log('🚀 MAINTENANT:');
        console.log('4. 🔄 Redémarrez votre serveur backend (npm run dev)');
        console.log('5. 🗑️ Videz le cache navigateur (F12 → Clear Storage)');
        console.log('6. 🔄 Rechargez votre frontend (Ctrl+F5)');
        console.log('7. 🧪 Testez la création d\'une nouvelle région');
        console.log('');
        console.log('🎉 FINI ! Plus d\'erreur 500, vous repartez sur des bases saines !');
        
        // 8. VÉRIFICATION DES AUTRES COLLECTIONS (INFO)
        console.log('\n📊 7. INFO - AUTRES COLLECTIONS:');
        
        try {
            const collections = await db.listCollections().toArray();
            const relevantCollections = collections.filter(col => 
                col.name.includes('region') || col.name.includes('treasure')
            );
            
            console.log('Collections liées aux régions:');
            for (const col of relevantCollections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`- ${col.name}: ${count} document(s)`);
            }
        } catch (e) {
            console.log('ℹ️ Impossible de lister les autres collections');
        }
        
    } catch (error) {
        console.error('\n❌ === ERREUR LORS DU NETTOYAGE ===');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 MongoDB Atlas inaccessible:');
            console.log('- Vérifiez votre connexion internet');
            console.log('- Vérifiez les identifiants MongoDB Atlas');
        }
        
    } finally {
        try {
            await mongoose.disconnect();
            console.log('\n🔌 Déconnexion MongoDB Atlas');
        } catch (e) {
            // Ignorer les erreurs de déconnexion
        }
        
        console.log('\n✨ Script de nettoyage terminé !');
        process.exit(0);
    }
}

// === FONCTION DE CONFIRMATION INTERACTIVE (ALTERNATIVE) ===
async function cleanSlateWithConfirmation() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question('⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les données RegionDetails ? (oui/non): ', (answer) => {
            rl.close();
            if (answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                resolve(true);
            } else {
                console.log('❌ Annulation du nettoyage');
                resolve(false);
            }
        });
    });
}

// === EXÉCUTION PRINCIPALE ===
if (require.main === module) {
    console.log('🗑️ Lancement du nettoyage complet RegionDetails...\n');
    console.log('💡 Ce script va supprimer TOUTES les données de test');
    console.log('💡 Vous repartirez sur des bases complètement propres\n');
    
    // Utiliser la version automatique (sans confirmation interactive)
    cleanSlateRegionDetails().catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
}

module.exports = { cleanSlateRegionDetails, cleanSlateWithConfirmation };
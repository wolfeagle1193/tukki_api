// controllers/servicesController.js - CONTRÔLEUR POUR LA GESTION DES SERVICES
const TreasureDetails = require('../models/TreasureDetails');
const Treasure = require('../models/Treasures');

// ===== LISTE DES SERVICES DISPONIBLES =====
const AVAILABLE_SERVICES = [
    {
        type: 'Hébergement',
        icon: '🏨',
        description: 'Hôtels, auberges, chambres d\'hôtes',
        category: 'logement'
    },
    {
        type: 'Restauration',
        icon: '🍽️',
        description: 'Restaurants, cafés, bars locaux',
        category: 'restauration'
    },
    {
        type: 'Transport',
        icon: '🚗',
        description: 'Location véhicules, taxis, bus',
        category: 'transport'
    },
    {
        type: 'Guide touristique',
        icon: '👥',
        description: 'Guides locaux, visites organisées',
        category: 'tourisme'
    },
    {
        type: 'Loisirs',
        icon: '🎯',
        description: 'Activités, sports, divertissements',
        category: 'loisirs'
    },
    {
        type: 'Administration',
        icon: '🏛️',
        description: 'Services publics, formalités',
        category: 'administration'
    },
    {
        type: 'Accessibilité',
        icon: '♿',
        description: 'Accès PMR, équipements adaptés',
        category: 'accessibilite'
    },
    {
        type: 'Boutique souvenirs',
        icon: '🛍️',
        description: 'Artisanat local, souvenirs',
        category: 'shopping'
    },
    {
        type: 'Santé',
        icon: '🏥',
        description: 'Pharmacies, centres de santé',
        category: 'sante'
    },
    {
        type: 'Banque',
        icon: '🏦',
        description: 'Banques, distributeurs, change',
        category: 'finance'
    }
];

// ✅ OBTENIR TOUS LES SERVICES DISPONIBLES
exports.getAvailableServices = async (req, res) => {
    try {
        console.log('📋 Demande de services disponibles');

        res.status(200).json({
            success: true,
            message: 'Services disponibles récupérés avec succès',
            data: {
                services: AVAILABLE_SERVICES,
                totalServices: AVAILABLE_SERVICES.length,
                categories: [...new Set(AVAILABLE_SERVICES.map(s => s.category))]
            }
        });

    } catch (error) {
        console.error('❌ Erreur getAvailableServices:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des services',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
        });
    }
};

// ✅ OBTENIR LES SERVICES D'UN TRÉSOR SPÉCIFIQUE
exports.getTreasureServices = async (req, res) => {
    try {
        const { treasureId } = req.params;
        console.log(`🔍 Récupération services pour le trésor: ${treasureId}`);

        if (!treasureId) {
            return res.status(400).json({
                success: false,
                message: 'ID du trésor requis'
            });
        }

        // Vérifier si le trésor existe
        const treasureExists = await Treasure.findById(treasureId);
        if (!treasureExists) {
            return res.status(404).json({
                success: false,
                message: 'Trésor non trouvé'
            });
        }

        // Récupérer les détails du trésor
        let treasureDetails = await TreasureDetails.findOne({ treasure_id: treasureId });
        
        if (!treasureDetails) {
            console.log(`⚠️ Pas de détails trouvés pour ${treasureId}`);
            return res.status(200).json({
                success: true,
                message: 'Aucun service configuré pour ce trésor',
                data: {
                    treasureId: treasureId,
                    treasureName: treasureExists.name,
                    services: [],
                    availableServices: AVAILABLE_SERVICES
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Services du trésor récupérés avec succès',
            data: {
                treasureId: treasureId,
                treasureName: treasureExists.name,
                services: treasureDetails.services || [],
                totalConfiguredServices: (treasureDetails.services || []).length,
                availableServices: AVAILABLE_SERVICES
            }
        });

    } catch (error) {
        console.error('❌ Erreur getTreasureServices:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des services du trésor',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
        });
    }
};

// ✅ METTRE À JOUR LES SERVICES D'UN TRÉSOR
exports.updateTreasureServices = async (req, res) => {
    try {
        const { treasureId } = req.params;
        const { services } = req.body;

        console.log(`🔄 Mise à jour services pour le trésor: ${treasureId}`);
        console.log('📋 Services reçus:', services);

        // Validations
        if (!treasureId) {
            return res.status(400).json({
                success: false,
                message: 'ID du trésor requis'
            });
        }

        if (!Array.isArray(services)) {
            return res.status(400).json({
                success: false,
                message: 'Les services doivent être fournis sous forme de tableau'
            });
        }

        // Vérifier si le trésor existe
        const treasureExists = await Treasure.findById(treasureId);
        if (!treasureExists) {
            return res.status(404).json({
                success: false,
                message: 'Trésor non trouvé'
            });
        }

        // Valider les services fournis
        const validatedServices = [];
        for (const service of services) {
            if (!service.type) {
                return res.status(400).json({
                    success: false,
                    message: 'Chaque service doit avoir un type'
                });
            }

            // Vérifier si le service est dans la liste des services disponibles
            const availableService = AVAILABLE_SERVICES.find(s => s.type === service.type);
            if (!availableService) {
                return res.status(400).json({
                    success: false,
                    message: `Service non reconnu: ${service.type}`
                });
            }

            // Utiliser les données du service disponible comme base
            validatedServices.push({
                type: availableService.type,
                icon: service.icon || availableService.icon,
                description: service.description || availableService.description,
                category: availableService.category,
                // Champs personnalisés optionnels
                customDescription: service.customDescription || null,
                isActive: service.isActive !== undefined ? service.isActive : true,
                updatedAt: new Date()
            });
        }

        // Chercher ou créer TreasureDetails
        let treasureDetails = await TreasureDetails.findOne({ treasure_id: treasureId });

        if (!treasureDetails) {
            console.log(`➕ Création de TreasureDetails pour ${treasureId}`);
            treasureDetails = new TreasureDetails({
                treasure_id: treasureId,
                description: treasureExists.description || '',
                location: treasureExists.location || treasureExists.country || '',
                services: validatedServices,
                gallery: [],
                comments: [],
                photos: [],
                popularPlaces: []
            });
        } else {
            treasureDetails.services = validatedServices;
            treasureDetails.updatedAt = new Date();
        }

        // Sauvegarder
        await treasureDetails.save();

        console.log(`✅ Services mis à jour: ${validatedServices.length} service(s)`);

        res.status(200).json({
            success: true,
            message: `Services mis à jour avec succès (${validatedServices.length} service(s))`,
            data: {
                treasureId: treasureId,
                treasureName: treasureExists.name,
                services: validatedServices,
                totalServices: validatedServices.length,
                updatedAt: new Date()
            }
        });

    } catch (error) {
        console.error('❌ Erreur updateTreasureServices:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour des services',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
        });
    }
};

// ✅ AJOUTER UN SERVICE À UN TRÉSOR
exports.addServiceToTreasure = async (req, res) => {
    try {
        const { treasureId } = req.params;
        const { serviceType, customDescription } = req.body;

        console.log(`➕ Ajout service ${serviceType} au trésor ${treasureId}`);

        // Validations
        if (!treasureId || !serviceType) {
            return res.status(400).json({
                success: false,
                message: 'ID du trésor et type de service requis'
            });
        }

        // Vérifier si le service existe dans la liste
        const availableService = AVAILABLE_SERVICES.find(s => s.type === serviceType);
        if (!availableService) {
            return res.status(400).json({
                success: false,
                message: `Service non reconnu: ${serviceType}`
            });
        }

        // Chercher les détails du trésor
        let treasureDetails = await TreasureDetails.findOne({ treasure_id: treasureId });
        if (!treasureDetails) {
            return res.status(404).json({
                success: false,
                message: 'Détails du trésor non trouvés'
            });
        }

        // Vérifier si le service n'existe pas déjà
        const existingService = treasureDetails.services.find(s => s.type === serviceType);
        if (existingService) {
            return res.status(409).json({
                success: false,
                message: `Le service ${serviceType} existe déjà pour ce trésor`
            });
        }

        // Créer le nouveau service
        const newService = {
            type: availableService.type,
            icon: availableService.icon,
            description: availableService.description,
            category: availableService.category,
            customDescription: customDescription || null,
            isActive: true,
            addedAt: new Date()
        };

        // Ajouter le service
        treasureDetails.services.push(newService);
        treasureDetails.updatedAt = new Date();

        await treasureDetails.save();

        console.log(`✅ Service ${serviceType} ajouté avec succès`);

        res.status(201).json({
            success: true,
            message: `Service ${serviceType} ajouté avec succès`,
            data: {
                addedService: newService,
                totalServices: treasureDetails.services.length
            }
        });

    } catch (error) {
        console.error('❌ Erreur addServiceToTreasure:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout du service',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
        });
    }
};

// ✅ SUPPRIMER UN SERVICE D'UN TRÉSOR
exports.removeServiceFromTreasure = async (req, res) => {
    try {
        const { treasureId, serviceType } = req.params;

        console.log(`🗑️ Suppression service ${serviceType} du trésor ${treasureId}`);

        // Validations
        if (!treasureId || !serviceType) {
            return res.status(400).json({
                success: false,
                message: 'ID du trésor et type de service requis'
            });
        }

        // Chercher les détails du trésor
        let treasureDetails = await TreasureDetails.findOne({ treasure_id: treasureId });
        if (!treasureDetails) {
            return res.status(404).json({
                success: false,
                message: 'Détails du trésor non trouvés'
            });
        }

        // Vérifier si le service existe
        const serviceIndex = treasureDetails.services.findIndex(s => s.type === serviceType);
        if (serviceIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Service ${serviceType} non trouvé pour ce trésor`
            });
        }

        // Supprimer le service
        const removedService = treasureDetails.services.splice(serviceIndex, 1)[0];
        treasureDetails.updatedAt = new Date();

        await treasureDetails.save();

        console.log(`✅ Service ${serviceType} supprimé avec succès`);

        res.status(200).json({
            success: true,
            message: `Service ${serviceType} supprimé avec succès`,
            data: {
                removedService: removedService,
                remainingServices: treasureDetails.services.length
            }
        });

    } catch (error) {
        console.error('❌ Erreur removeServiceFromTreasure:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du service',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
        });
    }
};

// ✅ OBTENIR LES STATISTIQUES DES SERVICES
exports.getServicesStats = async (req, res) => {
    try {
        console.log('📊 Calcul des statistiques des services');

        // Récupérer tous les TreasureDetails avec des services
        const allTreasureDetails = await TreasureDetails.find({
            services: { $exists: true, $not: { $size: 0 } }
        });

        // Calculer les statistiques
        const stats = {
            totalTreasuresWithServices: allTreasureDetails.length,
            totalConfiguredServices: 0,
            serviceUsage: {},
            categoryUsage: {},
            avgServicesPerTreasure: 0
        };

        // Calculer l'utilisation par service et catégorie
        allTreasureDetails.forEach(treasureDetail => {
            if (treasureDetail.services) {
                stats.totalConfiguredServices += treasureDetail.services.length;
                
                treasureDetail.services.forEach(service => {
                    // Comptage par type de service
                    if (stats.serviceUsage[service.type]) {
                        stats.serviceUsage[service.type]++;
                    } else {
                        stats.serviceUsage[service.type] = 1;
                    }
                    
                    // Comptage par catégorie
                    const category = service.category || 'non-categorise';
                    if (stats.categoryUsage[category]) {
                        stats.categoryUsage[category]++;
                    } else {
                        stats.categoryUsage[category] = 1;
                    }
                });
            }
        });

        // Calcul de la moyenne
        stats.avgServicesPerTreasure = allTreasureDetails.length > 0 
            ? (stats.totalConfiguredServices / allTreasureDetails.length).toFixed(2)
            : 0;

        // Top 5 des services les plus utilisés
        stats.topServices = Object.entries(stats.serviceUsage)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([service, count]) => ({ service, count }));

        res.status(200).json({
            success: true,
            message: 'Statistiques des services récupérées avec succès',
            data: stats
        });

    } catch (error) {
        console.error('❌ Erreur getServicesStats:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors du calcul des statistiques',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
        });
    }
};

module.exports = {
    getAvailableServices: exports.getAvailableServices,
    getTreasureServices: exports.getTreasureServices,
    updateTreasureServices: exports.updateTreasureServices,
    addServiceToTreasure: exports.addServiceToTreasure,
    removeServiceFromTreasure: exports.removeServiceFromTreasure,
    getServicesStats: exports.getServicesStats
};
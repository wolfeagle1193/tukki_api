// controllers/regionServicesController.js - CONTRÔLEUR POUR LA GESTION DES SERVICES DES RÉGIONS
const RegionDetails = require('../models/RegionDetails');
const Region = require('../models/Region');

// ===== LISTE DES SERVICES DISPONIBLES =====
const AVAILABLE_SERVICES = [
    {
        type: 'Hébergement',
        icon: '🏨',
        description: 'Hôtels, auberges, chambres d\'hôtes',
        priority: 1
    },
    {
        type: 'Restauration',
        icon: '🍽️',
        description: 'Restaurants, cafés, bars locaux',
        priority: 2
    },
    {
        type: 'Transport',
        icon: '🚗',
        description: 'Location véhicules, taxis, bus',
        priority: 3
    },
    {
        type: 'Guide touristique',
        icon: '👥',
        description: 'Guides locaux, visites organisées',
        priority: 4
    },
    {
        type: 'Loisirs',
        icon: '🎯',
        description: 'Activités, sports, divertissements',
        priority: 5
    },
    {
        type: 'Administration',
        icon: '🏛️',
        description: 'Services publics, formalités',
        priority: 6
    },
    {
        type: 'Accessibilité',
        icon: '♿',
        description: 'Accès PMR, équipements adaptés',
        priority: 7
    },
    {
        type: 'Boutique souvenirs',
        icon: '🛍️',
        description: 'Artisanat local, souvenirs',
        priority: 8
    },
    {
        type: 'Santé',
        icon: '🏥',
        description: 'Pharmacies, centres de santé',
        priority: 9
    },
    {
        type: 'Banque',
        icon: '🏦',
        description: 'Banques, distributeurs, change',
        priority: 10
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
                totalServices: AVAILABLE_SERVICES.length
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

// ✅ OBTENIR LES SERVICES D'UNE RÉGION SPÉCIFIQUE
exports.getRegionServices = async (req, res) => {
    try {
        const { regionId } = req.params;
        console.log(`🔍 Récupération services pour la région: ${regionId}`);

        if (!regionId) {
            return res.status(400).json({
                success: false,
                message: 'ID de la région requis'
            });
        }

        // Vérifier si la région existe
        const regionExists = await Region.findById(regionId);
        if (!regionExists) {
            return res.status(404).json({
                success: false,
                message: 'Région non trouvée'
            });
        }

        // Récupérer les détails de la région
        let regionDetails = await RegionDetails.findOne({ region_id: regionId });
        
        if (!regionDetails) {
            console.log(`⚠️ Pas de détails trouvés pour ${regionId}`);
            return res.status(200).json({
                success: true,
                message: 'Aucun service configuré pour cette région',
                data: {
                    regionId: regionId,
                    regionName: regionExists.name,
                    services: [],
                    availableServices: AVAILABLE_SERVICES
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Services de la région récupérés avec succès',
            data: {
                regionId: regionId,
                regionName: regionExists.name,
                services: regionDetails.services || [],
                totalConfiguredServices: (regionDetails.services || []).length,
                availableServices: AVAILABLE_SERVICES
            }
        });

    } catch (error) {
        console.error('❌ Erreur getRegionServices:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des services de la région',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
        });
    }
};

// ✅ METTRE À JOUR LES SERVICES D'UNE RÉGION
exports.updateRegionServices = async (req, res) => {
    try {
        const { regionId } = req.params;
        const { services } = req.body;

        console.log(`🔄 Mise à jour services pour la région: ${regionId}`);
        console.log('📋 Services reçus:', services);

        // Validations
        if (!regionId) {
            return res.status(400).json({
                success: false,
                message: 'ID de la région requis'
            });
        }

        if (!Array.isArray(services)) {
            return res.status(400).json({
                success: false,
                message: 'Les services doivent être fournis sous forme de tableau'
            });
        }

        // Vérifier si la région existe
        const regionExists = await Region.findById(regionId);
        if (!regionExists) {
            return res.status(404).json({
                success: false,
                message: 'Région non trouvée'
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
                priority: service.priority !== undefined ? service.priority : availableService.priority,
                isActive: service.isActive !== undefined ? service.isActive : true
            });
        }

        // Chercher ou créer RegionDetails
        let regionDetails = await RegionDetails.findOne({ region_id: regionId });

        if (!regionDetails) {
            console.log(`➕ Création de RegionDetails pour ${regionId}`);
            regionDetails = new RegionDetails({
                region_id: regionId,
                description: regionExists.description || '',
                location: regionExists.location || regionExists.country || '',
                services: validatedServices,
                gallery: [],
                comments: [],
                photos: [],
                popularPlaces: []
            });
        } else {
            regionDetails.services = validatedServices;
        }

        // Sauvegarder
        await regionDetails.save();

        console.log(`✅ Services mis à jour: ${validatedServices.length} service(s)`);

        res.status(200).json({
            success: true,
            message: `Services mis à jour avec succès (${validatedServices.length} service(s))`,
            data: {
                regionId: regionId,
                regionName: regionExists.name,
                services: validatedServices,
                totalServices: validatedServices.length
            }
        });

    } catch (error) {
        console.error('❌ Erreur updateRegionServices:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour des services',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
        });
    }
};

// ✅ AJOUTER UN SERVICE À UNE RÉGION
exports.addServiceToRegion = async (req, res) => {
    try {
        const { regionId } = req.params;
        const { serviceType, priority } = req.body;

        console.log(`➕ Ajout service ${serviceType} à la région ${regionId}`);

        // Validations
        if (!regionId || !serviceType) {
            return res.status(400).json({
                success: false,
                message: 'ID de la région et type de service requis'
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

        // Chercher les détails de la région
        let regionDetails = await RegionDetails.findOne({ region_id: regionId });
        if (!regionDetails) {
            return res.status(404).json({
                success: false,
                message: 'Détails de la région non trouvés'
            });
        }

        // Vérifier si le service n'existe pas déjà
        const existingService = regionDetails.services.find(s => s.type === serviceType);
        if (existingService) {
            return res.status(409).json({
                success: false,
                message: `Le service ${serviceType} existe déjà pour cette région`
            });
        }

        // Créer le nouveau service
        const newService = {
            type: availableService.type,
            icon: availableService.icon,
            description: availableService.description,
            priority: priority !== undefined ? priority : availableService.priority,
            isActive: true
        };

        // Ajouter le service
        regionDetails.services.push(newService);

        await regionDetails.save();

        console.log(`✅ Service ${serviceType} ajouté avec succès`);

        res.status(201).json({
            success: true,
            message: `Service ${serviceType} ajouté avec succès`,
            data: {
                addedService: newService,
                totalServices: regionDetails.services.length
            }
        });

    } catch (error) {
        console.error('❌ Erreur addServiceToRegion:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout du service',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
        });
    }
};

// ✅ SUPPRIMER UN SERVICE D'UNE RÉGION
exports.removeServiceFromRegion = async (req, res) => {
    try {
        const { regionId, serviceType } = req.params;

        console.log(`🗑️ Suppression service ${serviceType} de la région ${regionId}`);

        // Validations
        if (!regionId || !serviceType) {
            return res.status(400).json({
                success: false,
                message: 'ID de la région et type de service requis'
            });
        }

        // Chercher les détails de la région
        let regionDetails = await RegionDetails.findOne({ region_id: regionId });
        if (!regionDetails) {
            return res.status(404).json({
                success: false,
                message: 'Détails de la région non trouvés'
            });
        }

        // Vérifier si le service existe
        const serviceIndex = regionDetails.services.findIndex(s => s.type === serviceType);
        if (serviceIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `Service ${serviceType} non trouvé pour cette région`
            });
        }

        // Supprimer le service
        const removedService = regionDetails.services.splice(serviceIndex, 1)[0];

        await regionDetails.save();

        console.log(`✅ Service ${serviceType} supprimé avec succès`);

        res.status(200).json({
            success: true,
            message: `Service ${serviceType} supprimé avec succès`,
            data: {
                removedService: removedService,
                remainingServices: regionDetails.services.length
            }
        });

    } catch (error) {
        console.error('❌ Erreur removeServiceFromRegion:', error);
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

        // Récupérer tous les RegionDetails avec des services
        const allRegionDetails = await RegionDetails.find({
            services: { $exists: true, $not: { $size: 0 } }
        });

        // Calculer les statistiques
        const stats = {
            totalRegionsWithServices: allRegionDetails.length,
            totalConfiguredServices: 0,
            serviceUsage: {},
            avgServicesPerRegion: 0
        };

        // Calculer l'utilisation par service
        allRegionDetails.forEach(regionDetail => {
            if (regionDetail.services) {
                stats.totalConfiguredServices += regionDetail.services.length;
                
                regionDetail.services.forEach(service => {
                    // Comptage par type de service
                    if (stats.serviceUsage[service.type]) {
                        stats.serviceUsage[service.type]++;
                    } else {
                        stats.serviceUsage[service.type] = 1;
                    }
                });
            }
        });

        // Calcul de la moyenne
        stats.avgServicesPerRegion = allRegionDetails.length > 0 
            ? (stats.totalConfiguredServices / allRegionDetails.length).toFixed(2)
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
    getRegionServices: exports.getRegionServices,
    updateRegionServices: exports.updateRegionServices,
    addServiceToRegion: exports.addServiceToRegion,
    removeServiceFromRegion: exports.removeServiceFromRegion,
    getServicesStats: exports.getServicesStats
};
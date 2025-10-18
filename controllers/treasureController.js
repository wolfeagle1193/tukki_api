

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const Treasure = require('../models/Treasures');

exports.createTreasure = async (req, res) => {
  try {
    const { _id, name } = req.body;

    // Validate input
    if (!_id || !name) {
      return res.status(400).json({ success: false, message: "ID et nom sont requis." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "L'image est requise." });
    }

    const inputFilePath = req.file.path; // Path of the uploaded file
    const outputDir = path.join(process.cwd(), 'assets', 'images', 'incontournables');
    const outputFilePath = path.join(outputDir, `${_id}.webp`); // Destination path for the converted file

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Convert the image to WebP format
    await sharp(inputFilePath)
      .webp({ quality: 80 })
      .toFile(outputFilePath);

    console.log("Image converted successfully to:", outputFilePath);

    // Attempt to delete the original uploaded file
    try {
      console.log("Attempting to delete original file:", inputFilePath);
      await fs.unlink(inputFilePath);
      console.log("Original file deleted successfully:", inputFilePath);
    } catch (unlinkError) {
      console.error("Failed to delete uploaded file:", unlinkError);
      // Optionally, you can choose to return a warning or message here
    }

    // Save the new treasure to the database
    const newTreasure = new Treasure({
      _id,
      name,
      placeImage: `/assets/images/incontournables/${_id}.webp`
    });

    await newTreasure.save();
    res.status(201).json({ 
      success: true, 
      message: "Trésor créé avec succès", 
      treasure: newTreasure 
    });
  } catch (error) {
    console.error("Erreur lors de la création du trésor:", error);
    return res.status(500).json({ 
      success: false, 
      message: `Erreur lors de la création du trésor: ${error.message}` 
    });
  }
};



// Obtenir tous les trésors
exports.getTreasures = async (req, res) => {
  try {
    const treasures = await Treasure.find();
    res.status(200).json({ success: true, treasures });
  } catch (error) {
    console.error("Erreur lors de la récupération des trésors:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération des trésors." 
    });
  }
};

// Modifier un trésor
exports.updateTreasure = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updateData = {};

    // Vérifier si le nom est fourni
    if (name) {
      updateData.name = name;
    }

    // Si un fichier a été téléchargé, traiter l'image
    if (req.file) {
      // Chemin du fichier téléchargé
      const inputFilePath = req.file.path;
      
      // Chemin où sauvegarder l'image convertie en webp
      const outputDir = path.join(process.cwd(), 'assets', 'images', 'incontournables');
      const outputFilePath = path.join(outputDir, `${id}.webp`);
      
      // URL relative pour stocker dans la base de données
      const dbImagePath = `/assets/images/incontournables/${id}.webp`;

      // Convertir l'image en WebP avec Sharp
      await sharp(inputFilePath)
        .webp({ quality: 80 })
        .toFile(outputFilePath);

      // Supprimer le fichier original
      fs.unlinkSync(inputFilePath);

      // Ajouter le chemin de l'image aux données à mettre à jour
      updateData.image = dbImagePath;
    }

    // Vérifier qu'il y a au moins un champ à mettre à jour
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Aucune donnée fournie pour la mise à jour." 
      });
    }

    const updatedTreasure = await Treasure.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Retourner le document mis à jour
    );

    if (!updatedTreasure) {
      return res.status(404).json({ 
        success: false, 
        message: "Trésor non trouvé." 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Trésor mis à jour avec succès", 
      treasure: updatedTreasure 
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du trésor:", error);
    return res.status(500).json({ 
      success: false, 
      message: `Erreur lors de la mise à jour du trésor: ${error.message}`
    });
  }
};

exports.deleteTreasure = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Début suppression trésor: ${id}`);

    // Trouver le trésor avant de le supprimer
    const treasure = await Treasure.findById(id);
    
    if (!treasure) {
      console.log(`❌ Trésor non trouvé: ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: "Trésor non trouvé." 
      });
    }

    console.log(`📋 Trésor trouvé:`, {
      id: treasure._id,
      name: treasure.name,
      placeImage: treasure.placeImage
    });

    // ✅ SUPPRESSION AMÉLIORÉE - Nettoyer TOUS les fichiers du même nom
    const imageDir = path.join(process.cwd(), 'assets', 'images', 'incontournables');
    const treasureId = treasure._id;
    
    // Extensions possibles à supprimer
    const extensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif'];
    let filesDeleted = 0;

    console.log(`🔍 Recherche fichiers à supprimer pour ID: ${treasureId}`);
    
    for (const ext of extensions) {
      const filePath = path.join(imageDir, `${treasureId}${ext}`);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`✅ Fichier supprimé: ${filePath}`);
        filesDeleted++;
      } catch (fileError) {
        // Fichier n'existe pas, c'est normal
        console.log(`ℹ️ Fichier inexistant (normal): ${filePath}`);
      }
    }

    console.log(`📊 Total fichiers supprimés: ${filesDeleted}`);

    // ✅ AUSSI supprimer le fichier référencé en base (au cas où)
    if (treasure.placeImage) {
      try {
        const dbImagePath = path.join(process.cwd(), treasure.placeImage);
        console.log(`🎯 Suppression fichier DB référencé: ${dbImagePath}`);
        
        await fs.access(dbImagePath);
        await fs.unlink(dbImagePath);
        console.log(`✅ Fichier DB supprimé: ${dbImagePath}`);
      } catch (dbFileError) {
        console.log(`ℹ️ Fichier DB déjà supprimé ou inexistant`);
      }
    }

    // Supprimer le document de la base de données
    console.log(`💾 Suppression en base de données...`);
    await Treasure.findByIdAndDelete(id);
    console.log(`✅ Trésor supprimé de la base`);
    
    res.status(200).json({ 
      success: true, 
      message: "Trésor supprimé avec succès." 
    });
    
    console.log(`🎉 Suppression terminée avec succès`);
    
  } catch (error) {
    console.error(`❌ Erreur suppression:`, {
      treasureId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      success: false, 
      message: `Erreur lors de la suppression du trésor: ${error.message}` 
    });
  }
};
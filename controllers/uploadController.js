const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');



exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Aucune image n'a été fournie." 
      });
    }

    const userId = req.user.id;
    
    // ⭐ NOUVEAU : Récupérer l'utilisateur pour supprimer l'ancienne image
    const user = await User.findById(userId);
    
    // ⭐ Si l'utilisateur a déjà une image, la supprimer
    if (user && user.profile && user.profile.profilePicture) {
      try {
        const oldImageUrl = user.profile.profilePicture;
        const relativePath = oldImageUrl.startsWith('/') ? oldImageUrl.substring(1) : oldImageUrl;
        const oldImagePath = path.join(process.cwd(), relativePath);
        
        await fs.unlink(oldImagePath);
        console.log(`Ancienne image supprimée : ${oldImagePath}`);
      } catch (deleteError) {
        console.error("Erreur suppression ancienne image:", deleteError);
        // Continue même si échec
      }
    }
    
    // Créer le dossier de destination
    const outputDir = path.join(process.cwd(), 'assets', 'images', 'profiles');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Reste de ton code existant...
    const filename = `${userId}-${Date.now()}.webp`;
    const outputFilePath = path.join(outputDir, filename);
    
    await sharp(req.file.path)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(outputFilePath);
    
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error("Erreur suppression fichier temporaire:", unlinkError);
    }
    
    const imageUrl = `/assets/images/profiles/${filename}`;
    
    return res.status(200).json({
      success: true,
      message: "Image uploadée avec succès",
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de l'image:", error);
    return res.status(500).json({ 
      success: false, 
      message: `Erreur lors de l'upload de l'image: ${error.message}` 
    });
  }
};

/*exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Aucune image n'a été fournie." 
      });
    }

    // Récupérer l'ID de l'utilisateur à partir du token JWT
    const userId = req.user.id;
    
    // Créer le dossier de destination s'il n'existe pas
    const outputDir = path.join(process.cwd(), 'assets', 'images', 'profiles');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Générer un nom de fichier unique basé sur l'ID utilisateur et un timestamp
    const filename = `${userId}-${Date.now()}.webp`;
    const outputFilePath = path.join(outputDir, filename);
    
    // Traitement de l'image avec sharp (redimensionnement et conversion en webp)
    await sharp(req.file.path)
      .resize(400, 400, { fit: 'cover' }) // Redimensionner à 400x400 px
      .webp({ quality: 80 }) // Convertir en webp
      .toFile(outputFilePath);
    
    // Supprimer le fichier temporaire
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.error("Erreur lors de la suppression du fichier temporaire:", unlinkError);
    }
    
    // Construire l'URL de l'image pour la stocker dans la base de données
    const imageUrl = `/assets/images/profiles/${filename}`;
    
    // Renvoyer l'URL de l'image
    return res.status(200).json({
      success: true,
      message: "Image uploadée avec succès",
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de l'image:", error);
    return res.status(500).json({ 
      success: false, 
      message: `Erreur lors de l'upload de l'image: ${error.message}` 
    });
  }
};*/
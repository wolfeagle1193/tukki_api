const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const BestHotel = require('../models/Hotel'); // Adjust the path as necessary

// Create a new hotel
exports.createBestHotel = async (req, res) => {
  try {
    const { _id, region_id, title, rating, review, adresse } = req.body;

    if (!_id || !region_id || !title || !rating || !review || !adresse) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required." });
    }

    const inputFilePath = req.file.path;
    const outputDir = path.join(process.cwd(), 'assets', 'images', 'bestHotels');
    const outputFilePath = path.join(outputDir, `${_id}.webp`);

    await fs.mkdir(outputDir, { recursive: true });

    await sharp(inputFilePath)
      .webp({ quality: 80 })
      .toFile(outputFilePath);

    try {
      await fs.unlink(inputFilePath);
    } catch (unlinkError) {
      console.error("Failed to delete uploaded file:", unlinkError);
    }

    const newBestHotel = new BestHotel({
      _id,
      region_id,
      title,
      placeImage: `/assets/images/bestHotels/${_id}.webp`,
      rating,
      review,
      adresse
    });

    await newBestHotel.save();
    res.status(201).json({ success: true, message: "Best Hotel created successfully", hotel: newBestHotel });
  } catch (error) {
    console.error("Error creating Best Hotel:", error);
    return res.status(500).json({ success: false, message: `Error creating Best Hotel: ${error.message}` });
  }
};

// Get all best hotels
exports.getBestHotels = async (req, res) => {
  try {
    const hotels = await BestHotel.find();
    res.status(200).json({ success: true, hotels });
  } catch (error) {
    console.error("Error retrieving Best Hotels:", error);
    return res.status(500).json({ success: false, message: "Error retrieving Best Hotels." });
  }
};

// Get best hotels by region
exports.getHotelsByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    
    if (!regionId) {
      return res.status(400).json({ success: false, message: "Region ID is required." });
    }
    
    const hotels = await BestHotel.find({ region_id: regionId });
    
    res.status(200).json({ 
      success: true, 
      count: hotels.length,
      hotels 
    });
  } catch (error) {
    console.error("Error retrieving hotels by region:", error);
    return res.status(500).json({ 
      success: false, 
      message: `Error retrieving hotels by region: ${error.message}` 
    });
  }
};

// Update a hotel
exports.updateBestHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const { region_id, title, rating, review, adresse } = req.body;
    const updateData = {};

    if (region_id) updateData.region_id = region_id;
    if (title) updateData.title = title;
    if (rating) updateData.rating = rating;
    if (review) updateData.review = review;
    if (adresse) updateData.adresse = adresse;

    if (req.file) {
      const inputFilePath = req.file.path;
      const outputDir = path.join(process.cwd(), 'assets', 'images', 'bestHotels');
      const outputFilePath = path.join(outputDir, `${id}.webp`);

      await sharp(inputFilePath)
        .webp({ quality: 80 })
        .toFile(outputFilePath);

      await fs.unlink(inputFilePath);
      updateData.placeImage = `/assets/images/bestHotels/${id}.webp`;
    }

    const updatedHotel = await BestHotel.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedHotel) {
      return res.status(404).json({ success: false, message: "Best Hotel not found." });
    }

    res.status(200).json({ success: true, message: "Best Hotel updated successfully", hotel: updatedHotel });
  } catch (error) {
    console.error("Error updating Best Hotel:", error);
    return res.status(500).json({ success: false, message: `Error updating Best Hotel: ${error.message}` });
  }
};

// Delete a hotel
exports.deleteBestHotel = async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await BestHotel.findById(id);
    
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Best Hotel not found." });
    }

    if (hotel.placeImage) {
      const imagePath = path.join(process.cwd(), hotel.placeImage);
      try {
        const fileExists = await fs.access(imagePath).then(() => true).catch(() => false);
        if (fileExists) {
          await fs.unlink(imagePath);
        }
      } catch (fileError) {
        console.error("Error checking or deleting image file:", fileError);
      }
    }

    await BestHotel.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Best Hotel deleted successfully." });
  } catch (error) {
    console.error("Error deleting Best Hotel:", error);
    return res.status(500).json({ success: false, message: `Error deleting Best Hotel: ${error.message}` });
  }
};
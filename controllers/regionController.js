


const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const Region = require('../models/Region'); // Ensure this path is correct

// Create a new region
exports.createRegion = async (req, res) => {
  try {
    const { _id, name } = req.body;

    // Validate input
    if (!_id || !name) {
      return res.status(400).json({ success: false, message: "ID and name are required." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required." });
    }

    const inputFilePath = req.file.path; // Path of the uploaded file
    const outputDir = path.join(process.cwd(), 'assets', 'images', 'regions');
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
      await fs.unlink(inputFilePath);
      console.log("Original file deleted successfully:", inputFilePath);
    } catch (unlinkError) {
      console.error("Failed to delete uploaded file:", unlinkError);
    }

    // Save the new region to the database
    const newRegion = new Region({
      _id,
      name,
      placeImage: `/assets/images/regions/${_id}.webp`
    });

    await newRegion.save();
    res.status(201).json({ 
      success: true, 
      message: "Region created successfully", 
      region: newRegion 
    });
  } catch (error) {
    console.error("Error creating region:", error);
    return res.status(500).json({ 
      success: false, 
      message: `Error creating region: ${error.message}` 
    });
  }
};

// Get all regions
exports.getRegions = async (req, res) => {
  try {
    const regions = await Region.find();
    res.status(200).json({ success: true, regions });
  } catch (error) {
    console.error("Error retrieving regions:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error retrieving regions." 
    });
  }
};

// Update a region
exports.updateRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updateData = {};

    // Check if the name is provided
    if (name) {
      updateData.name = name;
    }

    // If a file has been uploaded, process the image
    if (req.file) {
      const inputFilePath = req.file.path;
      const outputDir = path.join(process.cwd(), 'assets', 'images', 'regions');
      const outputFilePath = path.join(outputDir, `${id}.webp`);
      const dbImagePath = `/assets/images/regions/${id}.webp`;

      // Convert the image to WebP format
      await sharp(inputFilePath)
        .webp({ quality: 80 })
        .toFile(outputFilePath);

      // Delete the original file
      await fs.unlink(inputFilePath);

      // Add the image path to the update data
      updateData.placeImage = dbImagePath;
    }

    // Ensure there is at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No data provided for update." 
      });
    }

    const updatedRegion = await Region.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedRegion) {
      return res.status(404).json({ 
        success: false, 
        message: "Region not found." 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Region updated successfully", 
      region: updatedRegion 
    });
  } catch (error) {
    console.error("Error updating region:", error);
    return res.status(500).json({ 
      success: false, 
      message: `Error updating region: ${error.message}`
    });
  }
};

// Delete a region
exports.deleteRegion = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the region before deleting to get the image path
    const region = await Region.findById(id);
    
    if (!region) {
      return res.status(404).json({ 
        success: false, 
        message: "Region not found." 
      });
    }

    // Delete the image if it exists
    if (region.placeImage) {
      const imagePath = path.join(process.cwd(), region.placeImage);
      if (fs.existsSync(imagePath)) {
        await fs.unlink(imagePath);
        console.log(`Image deleted: ${imagePath}`);
      } else {
        console.warn(`Image not found: ${imagePath}`);
      }
    }

    // Delete the document from the database
    await Region.findByIdAndDelete(id);
    res.status(200).json({ 
      success: true, 
      message: "Region deleted successfully." 
    });
  } catch (error) {
    console.error("Error deleting region:", error);
    return res.status(500).json({ 
      success: false, 
      message: `Error deleting region: ${error.message}` 
    });
  }
};
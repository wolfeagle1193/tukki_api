const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // Utilisation d'une chaîne pour l'ID
  name: { type: String, required: true },  // Nom de la région
  placeImage: { type: String, required: true }   // URL ou chemin de l'image
});

// Création du modèle
const Region = mongoose.model('Region', regionSchema);

module.exports = Region;
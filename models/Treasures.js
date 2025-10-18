const mongoose = require('mongoose');

const treasureSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // Utilisation d'une chaîne pour l'ID
  name: { type: String, required: true },  // Nom du trésor
  placeImage: { type: String, required: true }   // URL ou chemin de l'image
});

// Création du modèle
const Treasure = mongoose.model('Treasure', treasureSchema);

module.exports = Treasure;
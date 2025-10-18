const mongoose = require('mongoose');
const hotelSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  region_id: { type: mongoose.Schema.Types.String, ref: 'Region', required: true },
  title: { type: String, required: true },
  placeImage: { type: String, required: true },
  rating: { type: Number, required: true },
  review: { type: String, required: true },
  adresse: { type: String, required: true }
});
const Hotel = mongoose.model('Hotel', hotelSchema);
module.exports = Hotel;
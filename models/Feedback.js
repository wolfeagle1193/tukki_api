const mongoose = require('mongoose');  // ← Ajoute cette ligne !

const feedbackSchema = new mongoose.Schema({
  userId: String,
  email: String,
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['bug', 'feature', 'design', 'performance', 'autre'],
    required: true
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
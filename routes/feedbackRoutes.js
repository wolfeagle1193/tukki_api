const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback'); // Importe le modèle

// Route POST pour recevoir les avis
router.post('/feedback', async (req, res) => {
  try {
    const { rating, category, title, message, email } = req.body;

    if (!rating || !category || !title || !message) {
      return res.status(400).json({
        status: false,
        message: 'Tous les champs sont requis'
      });
    }

    const feedback = new Feedback({
      rating,
      category,
      title,
      message,
      email
    });

    await feedback.save();
    console.log(`✅ Feedback reçu: ${title}`);

    res.json({
      status: true,
      message: 'Merci pour votre avis !'
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      status: false,
      message: 'Erreur lors de la sauvegarde'
    });
  }
});

module.exports = router;
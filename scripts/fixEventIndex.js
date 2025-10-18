const mongoose = require('mongoose');
require('dotenv').config();

async function fixEventIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    const collection = db.collection('eventdetails');
    
    // Supprimer l'ancien index
    try {
      await collection.dropIndex("bookings.bookingReference_1");
      console.log("✅ Ancien index supprimé");
    } catch (error) {
      console.log("ℹ️ Ancien index déjà absent");
    }
    
    // Le nouveau modèle créera automatiquement le bon index
    console.log("🔄 Redémarrez votre serveur pour créer les nouveaux index");
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fixEventIndex();



const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: { 
      type: String, 
      default: null  // Changé de chemin relatif à null pour indiquer "utiliser l'image par défaut"
    },
    role: { 
      type: String, 
      enum: ['user', 'maintenancier', 'admin', 'superAdmin'],
      default: 'user'
    },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);

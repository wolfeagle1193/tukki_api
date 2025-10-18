// routes/authRoutes.js
/*const router = require("express").Router();
const authController = require("../controllers/authController");


// Routes existantes
router.post('/register', authController.createUser);
router.post('/login', authController.loginUser);



module.exports = router;*/


const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/jwt_token');

// Routes publiques
router.post('/register', authController.createUser);
router.post('/login', authController.loginUser);
router.post('/refresh-token', authController.refreshToken);

// Routes protégées
router.post('/logout', verifyToken, authController.logoutUser);

module.exports = router;
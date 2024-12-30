// routes/checkConnection.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Simple route to test MongoDB connection
router.get('/test-connection', async (req, res) => {
  try {
    // Try connecting to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    // If connection is successful
    res.status(200).json({ message: 'MongoDB is connected successfully!' });
  } catch (error) {
    // If connection fails
    res.status(500).json({ message: 'Error connecting to MongoDB', error });
  }
});

module.exports = router;

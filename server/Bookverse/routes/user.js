const express = require('express');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  console.log('Register request received:', req.body);  // Add this log
  const { username, email, password } = req.body;

  // Validate data
  if (!username || !email || !password) {
    console.log('Missing required fields');  // Add this log
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if email or username already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('Email already exists');  // Add this log
      return res.status(400).json({ message: 'Email already in use' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      console.log('Username already exists');  // Add this log
      return res.status(400).json({ message: 'Username already in use' });
    }

    // Create a new user
    const user = new User({
      username,
      email,
      password,
    });

    // Save user to DB
    await user.save();
    console.log('User saved successfully:', user);  // Add this log

//changed this
    const token = jwt.sign(
    {
        userId: user._id,
        username: user.username,
        email: user.email    // Add this
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
);

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
      username: user.username,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);  // Add this log
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
    console.log('Login request received with email:', req.body.email);
    const { email, password } = req.body;

    try {
      // Find user
      const user = await User.findOne({ email });
      console.log('User found in database:', user ? 'Yes' : 'No');

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Log the password comparison
      console.log('Attempting password comparison...');
      console.log('Provided password:', password);
      console.log('Stored hashed password:', user.password);

      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match result:', isMatch);

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
      {
          userId: user._id,
          username: user.username,
          email: user.email    // Add this
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

      res.status(200).json({
        message: 'Login successful',
        userId: user._id,
        username: user.username,
        token,
      });
    } catch (error) {
      console.error('Login error:', error);  // Add this log
      res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;

// app.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const checkConnectionRoute = require('./routes/checkConnection'); // Import the new test route
const genreRoutes = require('./routes/genres');  // Import genre routes
const userRoutes = require('./routes/user');  // Import auth routes
const WishlistRoutes= require('./routes/wishlistRoutes');//import wishlist route


dotenv.config();  // Load environment variables

const app = express();
const cors = require('cors');
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());
//app.use(bodyParser.urlencoded({ extended: true }));

// Use the route to test MongoDB connection
app.use('/api', checkConnectionRoute);  // Prefix with /api
app.use('/api/genres', genreRoutes);
app.use('/api/user', userRoutes);
app.use('/api/wishlist',WishlistRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// Simple home route
app.get('/', (req, res) => {
  res.send('Welcome to Bookverse Backend!');
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

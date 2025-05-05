const mongoose = require('mongoose');

// Genre Schema
const genreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  books: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'  // Reference to the Book collection
    }
  ],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'  // Reference to the User collection
    }
  ]
});

const Genre = mongoose.model('Genre', genreSchema);

module.exports = Genre;

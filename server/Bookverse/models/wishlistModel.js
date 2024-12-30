const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  books: [
    {
      bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
      },
      name: {
        type: String,
        required: true, // Book name for quick access
      },
      genre: {
        type: String,
        required: true, // Genre of the book for quick reference
      },
    },
  ],
});

module.exports = mongoose.model('Wishlist', wishlistSchema);

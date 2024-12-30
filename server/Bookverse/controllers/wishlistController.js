const Wishlist = require('../models/wishlistModel');
const Book = require('../models/bookModel');

// 1. View Wishlist
exports.viewWishlist = async (req, res) => {
  const { userId } = req.params;

  try {
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist || wishlist.books.length === 0) {
      return res.status(200).json({ message: 'Wishlist is empty', books: [] });
    }

    // Return only name, cover image, and genre for each book
    const wishlistBooks = wishlist.books.map(book => ({
      bookId: book.bookId,
      name: book.name,
      genre: book.genre,
    }));

    res.status(200).json({ books: wishlistBooks });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
};

//add to wishlist
exports.addToWishlist = async (req, res) => {
    const { userId, genrename, bookname } = req.params;
  
    try {
      const book = await Book.findOne({ title: bookname });
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
  
      let wishlist = await Wishlist.findOne({ userId });
  
      // If no wishlist exists, create one
      if (!wishlist) {
        wishlist = new Wishlist({ userId, books: [] });
      }
  
      // Check if the book is already in the wishlist
      const isBookInWishlist = wishlist.books.some(b => b.bookId.toString() === book._id.toString());
      if (isBookInWishlist) {
        return res.status(400).json({ message: 'Book is already in wishlist' });
      }
  
      // Add the book to the wishlist
      wishlist.books.push({
        bookId: book._id,
        name: book.title,
        genre: genrename,
        coverImage: book.coverImage, // Add the cover image here
      });
      await wishlist.save();
  
      res.status(201).json({ message: 'Book added to wishlist', wishlist });
    } catch (error) {
      console.error('Error adding book to wishlist:', error);
      res.status(500).json({ message: 'Error adding book to wishlist', error: error.message });
    }
};

//remove form wishlist
exports.removeFromWishlist = async (req, res) => {
    const { userId, bookname } = req.params;
  
    try {
      const book = await Book.findOne({ title: bookname });
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }
  
      const wishlist = await Wishlist.findOne({ userId });
  
      if (!wishlist) {
        return res.status(404).json({ message: 'Wishlist not found' });
      }
  
      // Filter out the book from the wishlist
      const updatedBooks = wishlist.books.filter(b => b.bookId.toString() !== book._id.toString());
  
      if (updatedBooks.length === wishlist.books.length) {
        return res.status(404).json({ message: 'Book not found in wishlist' });
      }
  
      wishlist.books = updatedBooks;
      await wishlist.save();
  
      res.status(200).json({ message: 'Book removed from wishlist', wishlist });
    } catch (error) {
      console.error('Error removing book from wishlist:', error);
      res.status(500).json({ message: 'Error removing book from wishlist', error: error.message });
    }
};
const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

// 1. View Wishlist
router.get('/:userId', wishlistController.viewWishlist);

// 2. Add book to wishlist
router.post('/:genrename/books/:bookname/add-to-wishlist/:userId', wishlistController.addToWishlist);

// 3. Remove book from wishlist
router.delete('/:genrename/books/:bookname/remove-from-wishlist/:userId', wishlistController.removeFromWishlist);


module.exports = router;
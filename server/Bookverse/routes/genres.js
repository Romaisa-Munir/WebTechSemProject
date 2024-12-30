const express = require('express');
const router = express.Router();
const genreController = require('../controllers/genreController');
console.log(genreController); // To check if the controller methods are present

// 1. Get all genres
router.get('/', genreController.getAllGenres);

// 2. Get a specific genre by name with books
router.get('/:genrename', genreController.getGenreByName);

// 3. Join a genre (user-specific)
router.post('/:genrename/join/:userId', genreController.joinGenre);

// 4. Add a book to a genre
router.post('/:genrename/books/:userId', genreController.addBookFromGoogleBooks);

// 5. Rate a book in a genre
router.post('/:genrename/books/:bookid/rate/:userId', genreController.rateBook);

//6. view a book in a certain genre Get Method
router.get('/:genrename/books/:bookname', genreController.viewBook);

module.exports = router;

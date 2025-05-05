const Genre = require('../models/genreModel'); // Genre model
const Book = require('../models/bookModel'); // Book model
const User = require('../models/userModel'); // User model
const axios = require('axios');//for google  books api

// 1. Get all genres
exports.getAllGenres = async (req, res) => {
    try {
        const genres = await Genre.find().select('_id name description'); // Only select _id, name, and description
        res.status(200).json(genres);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching genres', error });
    }
};
// 2. Get a specific genre by name along with its books
exports.getGenreByName = async (req, res) => {
    try {
        console.log('Fetching genre:', req.params.genrename);

        // First find the genre and explicitly select all fields we want
        const genre = await Genre.findOne({ name: req.params.genrename })
            .populate({
                path: 'books',
                select: 'title author coverImage ratings totalRatings ratingCount averageRating description'  // Explicitly select the fields we want
            });

        if (!genre) {
            return res.status(404).json({ message: 'Genre not found' });
        }

        // Log complete book data for debugging
        genre.books.forEach((book, index) => {
            console.log(`Book ${index + 1}:`, {
                _id: book._id,
                title: book.title,
                totalRatings: book.totalRatings,
                ratingCount: book.ratingCount,
                averageRating: book.averageRating
            });
        });

        // Log each book individually
        genre.books.forEach((book, index) => {
            console.log(`Book ${index + 1}:`, {
                _id: book._id,
                title: book.title,
                author: book.author,
                coverImage: book.coverImage
            });
        });

        // Include all book data in the response
        const genreWithBooks = {
            _id: genre._id,
            name: genre.name,
            description: genre.description,
            books: genre.books.map(book => ({
                _id: book._id,
                title: book.title,
                author: book.author,
                coverImage: book.coverImage,
                totalRatings: book.totalRatings,
                ratingCount: book.ratingCount,
                averageRating: book.averageRating,
                ratings: book.ratings
            }))
        };

        console.log('Sending response with book count:', genreWithBooks.books.length);
        res.status(200).json(genreWithBooks);
    } catch (error) {
        console.error('Error in getGenreByName:', error);
        res.status(500).json({ message: 'Error fetching genre details', error: error.toString() });
    }
};


// 3. Join a genre (Become a member)
// 3. Join a genre (Become a member)
exports.joinGenre = async (req, res) => {
    const { genrename, userId } = req.params;

    // Log the received parameters to verify
    console.log(`Genrename: ${genrename}, UserID: ${userId}`);

    try {
        // Find the genre
        const genre = await Genre.findOne({ name: genrename });
        if (!genre) {
            return res.status(404).json({ message: 'Genre not found' });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user is already a member of the genre
        if (genre.members.includes(userId)) {
            return res.status(400).json({ message: 'User is already a member of this genre' });
        }

        // Update the genre's members list
        genre.members.push(userId);
        await genre.save();

        // Update the user's joinedGenres list
        user.joinedGenres.push(genre._id);
        await user.save();

        res.status(200).json({ message: `User successfully joined the genre: ${genrename}` });
    } catch (error) {
        console.error("Error in joinGenre controller:", error);
        res.status(500).json({ message: 'Server error' });
    }
};



// 4. Add a book to a genre (For members only)
exports.addBookFromGoogleBooks = async (req, res) => {
    const { genrename, userId } = req.params;  // Extract genre and user IDs
    const { googleBooksUrl } = req.body;  // Get the Google Books URL

    try {
        // Find the genre by name
        const genre = await Genre.findOne({ name: genrename });
        if (!genre) {
            return res.status(404).json({ message: 'Genre not found' });
        }

        // Verify if the user is a member of the genre (Only members can add books)
        if (!genre.members.includes(userId)) {
            return res.status(403).json({ message: 'Only members of this genre can add books' });
        }

        // Extract the Google Books ID from the URL
        const bookIdMatch = googleBooksUrl.match(/id=([^&]+)/);
        if (!bookIdMatch) {
            return res.status(400).json({ message: 'Invalid Google Books URL' });
        }
        const bookId = bookIdMatch[1];

        // Fetch book details from Google Books API
        const googleBooksApiUrl = `https://www.googleapis.com/books/v1/volumes/${bookId}`;
        const response = await axios.get(googleBooksApiUrl);

        const bookData = response.data.volumeInfo;
        if (!bookData) {
            return res.status(404).json({ message: 'Book not found on Google Books' });
        }

        // Create a new book, including description/blurb
        const newBook = new Book({
            title: bookData.title || 'Unknown Title',
            author: (bookData.authors && bookData.authors.join(', ')) || 'Unknown Author',
            genreId: genre._id,
            addedBy: userId,
            coverImage: bookData.imageLinks ? bookData.imageLinks.thumbnail : '', // Using the thumbnail as cover image
            description: bookData.description || 'No description available', // Add description
            ratings: [],  // Leave ratings empty for now
            totalRatings: 0,  // Initial value
            ratingCount: 0,  // Initial value
            averageRating: 0,  // Initial value
        });

        // Save the book to the database
        await newBook.save();

        // Add the book's ID to the genre's book list
        genre.books.push(newBook._id);
        await genre.save();

        // Respond with success and the created book
        res.status(201).json({ message: 'Book successfully added to the genre', book: newBook });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//5.Rate A Book
exports.rateBook = async (req, res) => {
    try {
        const { genrename, bookid, userId } = req.params;
        const rating = req.body.rating;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const genre = await Genre.findOne({ name: genrename });
        if (!genre) {
            return res.status(404).json({ message: 'Genre not found' });
        }

        const book = await Book.findOne({ _id: bookid, genreId: genre._id });
        if (!book) {
            return res.status(404).json({ message: 'Book not found in this genre' });
        }

        const existingRating = book.ratings.find(r => r.userId.toString() === userId.toString());

        if (existingRating) {
            const ratingDifference = rating - existingRating.rating;
            book.totalRatings += ratingDifference;
            existingRating.rating = rating;
        } else {
            book.ratings.push({ userId, rating });
            book.totalRatings += rating;
            book.ratingCount += 1;
        }

        book.averageRating = book.totalRatings / book.ratingCount;
        await book.save();

        return res.status(200).json({ message: 'Rating added successfully', book });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong' });
    }
};


  //6. View A Book from a Certain Genre
exports.viewBook = async (req, res) => {
    try {
        const { genrename, bookname } = req.params;

        const genre = await Genre.findOne({ name: genrename });
        if (!genre) {
            return res.status(404).json({ message: 'Genre not found' });
        }

        const book = await Book.findOne({ title: bookname, genreId: genre._id });
        if (!book) {
            return res.status(404).json({ message: 'Book not found in this genre' });
        }

        const enhancedRatings = await Promise.all(
            book.ratings.map(async (rating) => {
                const user = await User.findById(rating.userId);
                if (user) {
                    return {
                        username: user.username,
                        rating: rating.rating,
                        _id: rating._id,
                    };
                }
                return null;
            })
        );

        const validRatings = enhancedRatings.filter(rating => rating !== null);

        return res.status(200).json({
            bookId: book._id,
            title: book.title,
            author: book.author,
            genreId: book.genreId,
            totalRatings: book.totalRatings,
            ratingCount: book.ratingCount,
            averageRating: book.averageRating,
            coverImage: book.coverImage,
            ratings: validRatings,
            addedBy: book.addedBy,
            description: book.description,
        });
    } catch (err) {
        console.error('Error in viewBook:', err);
        return res.status(500).json({ message: 'Something went wrong' });
    }
};




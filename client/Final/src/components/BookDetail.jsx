import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const UserRating = ({ username, rating }) => (
    <div className="user-rating-item">
        <span className="username">Rated by: {username}</span>
        <div className="rating-stars">
            {'★'.repeat(rating)}
            {'☆'.repeat(5 - rating)}
            <span className="rating-number"> ({rating}/5)</span>
        </div>
    </div>
);

function BookDetail() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRating, setUserRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);

    useEffect(() => {
        fetchBookDetails();
    }, [bookId]);
//fetch a single book's details
    const fetchBookDetails = async () => {
    try {
        // First, find the genre this book belongs to
        const genresResponse = await fetch('http://localhost:5000/api/genres');
        const genres = await genresResponse.json();

        let foundGenre = null;
        let foundBook = null;

        // Search through each genre's books
        for (const genre of genres) {
            const genreResponse = await fetch(`http://localhost:5000/api/genres/${genre.name}`);
            const genreData = await genreResponse.json();

            const book = genreData.books.find(b => b._id === bookId);
            if (book) {
                foundBook = book;
                foundGenre = genre;
                break;
            }
        }

        if (foundBook && foundGenre) {
            // Get detailed book info using viewBook endpoint
            const bookResponse = await fetch(
                `http://localhost:5000/api/genres/${foundGenre.name}/books/${foundBook.title}`
            );

            if (!bookResponse.ok) {
                throw new Error('Failed to fetch book details');
            }

            const bookData = await bookResponse.json();
            console.log('Fetched book data:', bookData);

            setBook({
                ...bookData,
                genre: foundGenre.name
            });

            // Check if current user has rated the book
            if (bookData.ratings && bookData.ratings.length > 0) {
                const token = localStorage.getItem('token');
                if (token) {
                    const userId = JSON.parse(atob(token.split('.')[1])).userId;
                    const existingRating = bookData.ratings.find(r => r.userId === userId);
                    if (existingRating) {
                        setUserRating(existingRating.rating);
                    }
                }
            }
        } else {
            setError('Book not found');
        }
    } catch (error) {
        console.error('Error fetching book details:', error);
        setError('Failed to load book details');
    } finally {
        setLoading(false);
    }
    };

    const handleRating = async (rating) => {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(atob(token.split('.')[1])).userId;

            const response = await fetch(
                `http://localhost:5000/api/genres/${book.genre}/books/${bookId}/rate/${userId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ rating })
                }
            );

            if (response.ok) {
                setUserRating(rating);
                alert('Rating submitted successfully!');
                fetchBookDetails(); // Refresh book details
            } else {
                throw new Error('Failed to submit rating');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('Failed to submit rating. Please try again.');
        }
    };

    const handleAddToWishlist = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(atob(token.split('.')[1])).userId;

            const response = await fetch(
                `http://localhost:5000/api/wishlist/${book.genre}/books/${book.title}/add-to-wishlist/${userId}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                alert('Book added to wishlist successfully!');
            } else {
                const data = await response.json();
                if (data.message === 'Book is already in wishlist') {
                    alert('This book is already in your wishlist');
                } else {
                    throw new Error('Failed to add to wishlist');
                }
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            alert('Failed to add book to wishlist. Please try again.');
        }
    };


    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!book) return <div className="error">Book not found</div>;

    return (
        <div className="container">
            <div className="book-detail">
                <button
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    ← Back
                </button>

                <div className="book-content">
                    <div className="book-main-info">
                        {book.coverImage && (
                            <img
                                src={book.coverImage}
                                alt={book.title}
                                className="book-cover-large"
                            />
                        )}
                        <div className="book-info">
                            <h2 className="book-title">{book.title}</h2>
                            <p className="book-author">by {book.author}</p>
                            <p className="book-genre">Genre: {book.genre}</p>
                            <div className="book-description">
                                <h3>Description</h3>
                                <p>{book.description}</p>
                            </div>
                            <div className="book-rating">
                                <div className="rating-display">
                                    {book.averageRating ?
                                        '★'.repeat(Math.round(book.averageRating)) +
                                        '☆'.repeat(5 - Math.round(book.averageRating))
                                        : '☆☆☆☆☆'}
                                </div>
                                <p>Average Rating: {book.averageRating ?
                                    book.averageRating.toFixed(1) : 'No ratings'}</p>
                                <p>Total Ratings: {book.ratingCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* User Ratings Section */}
                    {book.ratings && book.ratings.length > 0 && (
                        <div className="user-ratings-section">
                            <h3>Reader Ratings</h3>
                            <div className="user-ratings-list">
                                {book.ratings.map((rating, index) => (
                                    <UserRating
                                        key={index}
                                        username={rating.username}
                                        rating={rating.rating}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="rating-section">
                        <h3>Rate this Book</h3>
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className={`star ${(hoveredRating || userRating) >= star ? 'active' : ''}`}
                                    onClick={() => handleRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        className="add-wishlist-btn"
                        onClick={handleAddToWishlist}
                    >
                        Add to Wishlist
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BookDetail;
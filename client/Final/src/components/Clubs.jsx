import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Clubs() {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [googleBooksUrl, setGoogleBooksUrl] = useState('');
    const [books, setBooks] = useState([]); // Add this line to define the books state
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const genresResponse = await fetch('http://localhost:5000/api/genres');
            if (!genresResponse.ok) {
                throw new Error(`HTTP error! status: ${genresResponse.status}`);
            }
            const genresData = await genresResponse.json();
            setGenres(genresData);
        } catch (error) {
            console.error('Error fetching genres:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchGenreDetails = async (genreName) => {
        try {
            const response = await fetch(`http://localhost:5000/api/genres/${genreName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Genre details:', data);
            setSelectedGenre(data);
            setBooks(data.books || []); // Set the books state when genre details are fetched
        } catch (error) {
            console.error('Error fetching genre details:', error);
            setError(error.message);
        }
    };

    const handleJoinClub = async (genreName) => {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(atob(token.split('.')[1])).userId;

            const response = await fetch(
                `http://localhost:5000/api/genres/${genreName}/join/${userId}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert('Successfully joined the club!');
            await fetchGenreDetails(genreName);
        } catch (error) {
            console.error('Error joining club:', error);
            setError(error.message);
        }
    };

    const handleAddToWishlist = async (genreName, bookName) => {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(atob(token.split('.')[1])).userId;

            const response = await fetch(
                `http://localhost:5000/api/wishlist/${genreName}/books/${bookName}/add-to-wishlist/${userId}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                alert('Book added to wishlist!');
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            alert('Failed to add book to wishlist');
        }
    };

    const handleViewDetails = (book) => {
        navigate(`/books/${book._id}`);
    };

    const handleAddBook = async () => {
        try {
            // Validate inputs
            if (!selectedGenre || !googleBooksUrl) {
                alert('Please select a genre and enter a Google Books URL.');
                return;
            }

            // Retrieve the userId from the token
            const token = localStorage.getItem('token');
            const userId = JSON.parse(atob(token.split('.')[1])).userId; // Extract userId from the token

            // Construct the request URL
            const url = `http://localhost:5000/api/genres/${selectedGenre.name}/books/${userId}`; // Add userId to the URL
            console.log('Request URL:', url);

            // Make the POST request to add a book
            const response = await axios.post(
                url,
                { googleBooksUrl },
                { headers: { 'Content-Type': 'application/json' } }
            );

            // Handle success
            const newBook = response.data.book;
            setBooks((prevBooks) => [...prevBooks, newBook]); // Update the books state
            setGoogleBooksUrl(''); // Clear the input field
            alert('Book successfully added to the genre!');
            await fetchGenreDetails(selectedGenre.name); // Refresh the genre details
        } catch (error) {
            console.error('Error adding book:', error.response?.data || error.message);
            alert(`Failed to add book: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <div className="container">
            {!selectedGenre ? (
                <div className="clubs-list">
                    <h2 className="text-2xl font-bold mb-6">Available Book Clubs</h2>
                    {genres.map(genre => (
                        <div key={genre._id} className="club-card">
                            <h3 className="text-xl font-semibold">{genre.name}</h3>
                            <p className="description">{genre.description}</p>
                            <div className="button-group">
                                <button
                                    className="view-button"
                                    onClick={() => fetchGenreDetails(genre.name)}
                                >
                                    View Club
                                </button>
                                <button
                                    className="join-button"
                                    onClick={() => handleJoinClub(genre.name)}
                                >
                                    Join Club
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="club-detail">
                    <div className="club-header">
                        <h2 className="text-2xl font-bold">{selectedGenre.name}</h2>
                        <button
                            className="back-button"
                            onClick={() => setSelectedGenre(null)}
                        >
                            ← Back to Clubs
                        </button>
                    </div>

                    <div className="books-section mt-6">
                        <h3 className="text-xl font-semibold mb-4">Books in this Club</h3>
                        {books && books.length > 0 ? ( // Use books state here
                            <div className="books-grid">
                                {books.map(book => ( // Use books state here
                                    <div key={book._id} className="book-card">
                                        <h4 className="book-title">{book.title}</h4>
                                        {book.coverImage && (
                                            <img
                                                src={book.coverImage}
                                                alt={book.title}
                                                className="book-cover"
                                            />
                                        )}
                                        <div className="button-group">
                                            <button
                                                className="view-details-button"
                                                onClick={() => handleViewDetails(book)}
                                            >
                                                View Details
                                            </button>
                                            <button
                                                className="wishlist-button"
                                                onClick={() => handleAddToWishlist(selectedGenre.name, book.title)}
                                            >
                                                Add to Wishlist
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-books">No books in this club yet.</p>
                        )}

                        <div className="add-book-section mt-6">
                            <h3 className="text-xl font-semibold mb-4">Add a Book to this Club</h3>
                            <input
                                type="text"
                                value={googleBooksUrl}
                                onChange={(e) => setGoogleBooksUrl(e.target.value)}
                                placeholder="Enter Google Books URL"
                                className="url-input"
                            />
                            <button
                                className="add-book-button"
                                onClick={handleAddBook}
                            >
                                Add Book
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Clubs;

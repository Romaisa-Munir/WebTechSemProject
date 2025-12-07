import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './clubs.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://13.201.96.168:5001';

const Clubs = () => {
    const [genres, setGenres] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const genresResponse = await fetch(`${API_URL}/api/genres`);
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
            setLoading(true);
            const response = await fetch(`${API_URL}/api/genres/${genreName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setBooks(data.books || []);
            setSelectedGenre(genreName);
        } catch (error) {
            console.error('Error fetching genre details:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewClub = (genreName) => {
        fetchGenreDetails(genreName);
    };

    const handleJoinClub = async (genreName) => {
        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            const response = await fetch(`${API_URL}/api/genres/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    genreName
                })
            });

            if (response.ok) {
                alert(`Successfully joined ${genreName} club!`);
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to join club');
            }
        } catch (error) {
            console.error('Error joining club:', error);
            alert('Failed to join club');
        }
    };

    const handleViewBook = (bookId) => {
        navigate(`/books/${bookId}`);
    };

    const handleBack = () => {
        setSelectedGenre(null);
        setBooks([]);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <>
            <Navbar />
            <div className="clubs-container">
                {!selectedGenre ? (
                    <>
                        <h1>Available Book Clubs</h1>
                        <div className="clubs-grid">
                            {genres.map((genre) => (
                                <div key={genre._id} className="club-card">
                                    <h2>{genre.name}</h2>
                                    <p>{genre.description}</p>
                                    <div className="club-actions">
                                        <button
                                            className="view-button"
                                            onClick={() => handleViewClub(genre.name)}
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
                    </>
                ) : (
                    <>
                        <button className="back-button" onClick={handleBack}>
                            ← Back to Clubs
                        </button>
                        <h1>{selectedGenre} Club</h1>
                        <div className="books-grid">
                            {books.map((book) => (
                                <div key={book._id} className="book-card">
                                    {book.coverImage && (
                                        <img src={book.coverImage} alt={book.title} />
                                    )}
                                    <h3>{book.title}</h3>
                                    <p className="author">{book.author}</p>
                                    <p className="rating">
                                        ⭐ {book.averageRating ? book.averageRating.toFixed(1) : 'No ratings'}
                                    </p>
                                    <button
                                        className="view-details-button"
                                        onClick={() => handleViewBook(book._id)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default Clubs;

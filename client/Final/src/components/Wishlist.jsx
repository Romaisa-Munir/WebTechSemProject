import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Wishlist() {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(atob(token.split('.')[1])).userId;

            const response = await fetch(`http://localhost:5000/api/wishlist/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch wishlist');
            }

            const data = await response.json();
            console.log('Wishlist data:', data);
            setWishlist(data.books || []);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            setError('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (genreName, bookName) => {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(atob(token.split('.')[1])).userId;

            const response = await fetch(
                `http://localhost:5000/api/wishlist/${genreName}/books/${bookName}/remove-from-wishlist/${userId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                // Refresh wishlist after removal
                fetchWishlist();
            } else {
                throw new Error('Failed to remove from wishlist');
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            alert('Failed to remove book from wishlist');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="container">
            <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
            {wishlist.length === 0 ? (
                <div className="empty-wishlist">
                    <p>Your wishlist is empty</p>
                </div>
            ) : (
                <div className="books-grid">
                    {wishlist.map(book => (
                        <div key={book.bookId} className="book-card">
                            <h3 className="book-title">{book.name}</h3>
                            <p className="book-genre">Genre: {book.genre}</p>
                            <div className="button-group">
                                <button
                                    className="view-button"
                                    onClick={() => navigate(`/books/${book.bookId}`)}
                                >
                                    View Details
                                </button>
                                <button
                                    className="remove-button"
                                    onClick={() => removeFromWishlist(book.genre, book.name)}
                                >
                                    Remove from Wishlist
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Wishlist;
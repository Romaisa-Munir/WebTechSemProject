import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getUserInfo = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            return null;
        }

        try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            return {
                username: tokenData.username || 'Not available',
                email: tokenData.email || 'Not available'
            };
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    const handleLogout = () => {
        console.log("Logging out...");  // Debug log
        localStorage.removeItem('token');  // Remove only the token
        console.log("Token after removal:", localStorage.getItem('token'));  // Verify token is removed
        navigate('/auth');  // Navigate to auth page
        window.location.reload();  // Force a page reload to clear any remaining state
    };

    const userInfo = getUserInfo();

    return (
        <nav className="navbar">
            <div className="nav-left">
                <h1>BookVerse</h1>
            </div>
            <div className="nav-right">
                <button onClick={() => navigate('/clubs')}>Book Clubs</button>
                <button onClick={() => navigate('/wishlist')}>My Wishlist</button>
                <div className="profile-container" ref={dropdownRef}>
                    <button onClick={() => setShowDropdown(!showDropdown)}>Profile</button>
                    {showDropdown && userInfo && (
                        <div className="profile-dropdown">
                            <div className="profile-info">
                                <p className="info-item"><span>Username:</span> {userInfo.username}</p>
                                <p className="info-item"><span>Email:</span> {userInfo.email}</p>
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={handleLogout}>Log Out</button>
            </div>
        </nav>
    );
}

export default Navbar;
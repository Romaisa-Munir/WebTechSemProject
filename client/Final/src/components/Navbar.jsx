import { useNavigate } from 'react-router-dom';

function Navbar({ setAuth }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        console.log("Logout clicked");
        localStorage.removeItem('token');
        setAuth(false);
        navigate('/auth', { replace: true });
        console.log("Logout completed");
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <h1>BookVerse</h1>
            </div>
            <div className="nav-right">
                <button onClick={() => navigate('/clubs')}>Book Clubs</button>
                <button onClick={() => navigate('/wishlist')}>My Wishlist</button>
                <button>Profile</button>
                <button onClick={handleLogout}>Log Out</button>
            </div>
        </nav>
    );
}

export default Navbar;
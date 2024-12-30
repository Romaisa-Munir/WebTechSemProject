import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Wishlist from './components/Wishlist';
import Clubs from './components/Clubs';
import BookDetail from './components/BookDetail';
import Auth from './components/Auth';
import './index.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check authentication status when component mounts
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    const handleAuth = (status) => {
        console.log('Authentication status changed:', status);
        setIsAuthenticated(status);
    };

    return (
        <BrowserRouter>
            <div className="app">
                {isAuthenticated && <Navbar setAuth={handleAuth} />}
                <main>
                    <Routes>
                        <Route
                            path="/auth"
                            element={
                                !isAuthenticated ?
                                <Auth onLogin={handleAuth} /> :
                                <Navigate to="/clubs" replace />
                            }
                        />
                        <Route
                            path="/"
                            element={
                                <Navigate to={isAuthenticated ? "/clubs" : "/auth"} replace />
                            }
                        />
                        <Route
                            path="/clubs"
                            element={
                                isAuthenticated ?
                                <Clubs /> :
                                <Navigate to="/auth" replace />
                            }
                        />
                        <Route
                            path="/wishlist"
                            element={
                                isAuthenticated ?
                                <Wishlist /> :
                                <Navigate to="/auth" replace />
                            }
                        />
                        <Route
                            path="/books/:bookId"
                            element={
                                isAuthenticated ?
                                <BookDetail /> :
                                <Navigate to="/auth" replace />
                            }
                        />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
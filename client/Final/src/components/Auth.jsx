import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

function Auth({ onLogin }) {  // Add onLogin prop
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin
      ? 'http://localhost:5000/api/user/login'
      : 'http://localhost:5000/api/user/register';

    console.log('Sending request to:', endpoint);
    console.log('With data:', formData);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Response from server:', data);

      if (response.ok) {
        console.log('Login/Register successful');
        console.log('Token received:', data.token);
        localStorage.setItem('token', data.token);
        console.log('Token stored in localStorage:', localStorage.getItem('token'));

        // Call the onLogin callback to update parent state
        onLogin(true);

        console.log('Attempting to navigate to /clubs');
        navigate('/clubs', { replace: true });
        console.log('Navigation attempted');
      } else {
        console.log('Error response:', data.message);
        setError(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      setError('Network error occurred. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Rest of your component remains the same
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-heading">
          {isLogin ? 'Welcome to BookVerse' : 'Create Account'}
        </h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="form-group">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            className="submit-button"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="switch-mode">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({
                email: '',
                password: '',
                username: ''
              });
            }}
            className="switch-button"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
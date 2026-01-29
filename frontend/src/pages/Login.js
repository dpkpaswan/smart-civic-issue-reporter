import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, apiUtils } from '../services/api';
import { storage } from '../utils/helpers';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already logged in
    const user = storage.get('user');
    if (user) {
      navigate('/authority');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.login(credentials);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store user data and token
        storage.set('user', user);
        storage.set('authToken', token);
        
        // Navigate to authority dashboard
        navigate('/authority');
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 -mt-8">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Authority Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access the municipal issue management dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={credentials.username}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter username"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter password"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 text-sm underline"
            >
              ← Back to Home
            </button>
          </div>
        </form>

        {/* Information Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            🏛️ Authority Access
          </h3>
          <div className="text-xs text-blue-700">
            <p className="mb-2">
              This login is for municipal authorities and government officials to manage civic issues.
            </p>
            <ul className="space-y-1">
              <li>• View all reported issues</li>
              <li>• Update issue status</li>
              <li>• Add resolution proof</li>
              <li>• Manage municipal workflows</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            👤 Are you a citizen?
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Citizens don't need to login. You can report issues and track them using your email.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/report')}
              className="btn-primary text-xs"
            >
              Report Issue
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary text-xs"
            >
              Track Issues
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
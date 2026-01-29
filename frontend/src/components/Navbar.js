import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storage } from '../utils/helpers';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for logged in user
    const userData = storage.get('user');
    setUser(userData);
  }, []);

  const handleLogout = () => {
    storage.remove('user');
    storage.remove('authToken');
    setUser(null);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Mobile-optimized logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base">
              SC
            </div>
            <div className="hidden xs:block">
              <h1 className="text-base sm:text-xl font-bold text-gray-800">
                Smart Civic Reporter
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">Hackathon Prototype</p>
            </div>
            <div className="block xs:hidden">
              <h1 className="text-sm font-bold text-gray-800">
                SCR
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
            >
              Home
            </Link>
            <Link 
              to="/report" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
            >
              Report Issue
            </Link>
            <Link 
              to="/dashboard" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
            >
              My Dashboard
            </Link>
            <Link 
              to="/public" 
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
            >
              Public View
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.username}
                </span>
                {user.role === 'authority' && (
                  <Link 
                    to="/authority" 
                    className="btn-primary"
                  >
                    Authority Panel
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="btn-primary"
              >
                Authority Login
              </Link>
            )}
          </div>

          {/* Enhanced Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 focus:outline-none p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation"
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
            >
              <svg className={`w-6 h-6 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white shadow-lg rounded-b-lg">
            <div className="flex flex-col space-y-1">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 px-4 py-3 rounded-lg touch-manipulation"
                onClick={toggleMenu}
              >
                <span className="mr-3">🏠</span>
                Home
              </Link>
              <Link 
                to="/report" 
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 px-4 py-3 rounded-lg touch-manipulation"
                onClick={toggleMenu}
              >
                <span className="mr-3">📝</span>
                Report Issue
              </Link>
              <Link 
                to="/dashboard" 
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 px-4 py-3 rounded-lg touch-manipulation"
                onClick={toggleMenu}
              >
                <span className="mr-3">📊</span>
                My Dashboard
              </Link>
              <Link 
                to="/public" 
                className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 px-4 py-3 rounded-lg touch-manipulation"
                onClick={toggleMenu}
              >
                <span className="mr-3">🌍</span>
                Public View
              </Link>
              
              {user ? (
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">
                    Welcome, {user.username}
                  </span>
                  {user.role === 'authority' && (
                    <Link 
                      to="/authority" 
                      className="btn-primary text-center"
                      onClick={toggleMenu}
                    >
                      Authority Panel
                    </Link>
                  )}
                  <button 
                    onClick={() => { handleLogout(); toggleMenu(); }}
                    className="text-red-600 hover:text-red-700 text-left transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="btn-primary text-center"
                  onClick={toggleMenu}
                >
                  Authority Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
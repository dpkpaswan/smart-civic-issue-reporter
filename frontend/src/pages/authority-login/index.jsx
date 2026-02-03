import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../utils/toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import { LoadingButton } from '../../components/ui/Loading';

const AuthorityLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/authority-dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login({
        username: formData.username,
        password: formData.password
      });

      if (result.success) {
        toast.success('Login successful! Welcome to Authority Dashboard');
        
        // Redirect to the intended page or dashboard
        const from = location.state?.from?.pathname || '/authority-dashboard';
        navigate(from, { replace: true });
      } else {
        toast.error(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Shield" size={32} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authority Dashboard</h1>
            <p className="text-blue-100 text-sm">
              Secure access for government officials
            </p>
          </div>

          {/* Login Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter your government username"
                  error={errors.username}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  error={errors.password}
                  className="w-full"
                  leftIcon="Lock"
                  rightIcon={showPassword ? 'EyeOff' : 'Eye'}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                />
              </div>

              <LoadingButton
                type="submit"
                isLoading={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </LoadingButton>
            </form>

            {/* Demo Credentials Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Icon name="Info" size={16} className="text-blue-600" />
                Demo Credentials
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Username:</strong> roads.admin</p>
                <p><strong>Password:</strong> SecureRoad2026!</p>
                <p className="text-gray-500 mt-2">Other test users: waste.admin, environment.admin, admin.super</p>
              </div>
            </div>

            {/* Back to Home Link */}
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                iconName="ArrowLeft"
                iconPosition="left"
                iconSize={16}
                className="text-gray-600 hover:text-blue-600"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <Icon name="Shield" size={14} className="inline mr-1" />
          This is a secure government portal. Unauthorized access is prohibited.
        </div>
      </div>
    </div>
  );
};

export default AuthorityLogin;
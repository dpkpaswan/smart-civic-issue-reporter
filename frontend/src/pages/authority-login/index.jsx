import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../utils/toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import { LoadingButton } from '../../components/ui/Loading';

const AuthorityLogin = () => {
  const { t } = useTranslation();
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
    document.title = t('authorityLogin.pageTitle');
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/authority-dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = t('authorityLogin.usernameRequired');
    } else if (formData.username.length < 3) {
      newErrors.username = t('authorityLogin.usernameMinLength');
    }

    if (!formData.password) {
      newErrors.password = t('authorityLogin.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('authorityLogin.passwordMinLength');
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
        toast.success(t('authorityLogin.loginSuccess'));
        
        // Redirect to the intended page or dashboard
        const from = location.state?.from?.pathname || '/authority-dashboard';
        navigate(from, { replace: true });
      } else {
        toast.error(result.error || t('authorityLogin.loginFailed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(t('authorityLogin.loginError'));
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
            <h1 className="text-2xl font-bold text-white mb-2">{t('authorityLogin.title')}</h1>
            <p className="text-blue-100 text-sm">
              {t('authorityLogin.subtitle')}
            </p>
          </div>

          {/* Login Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('authorityLogin.username')}
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder={t('authorityLogin.username')}
                  error={errors.username}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('authorityLogin.password')}
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder={t('authorityLogin.password')}
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
                {isLoading ? t('authorityLogin.signingIn') : t('authorityLogin.signIn')}
              </LoadingButton>
            </form>

            {/* Demo Credentials Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Icon name="Info" size={16} className="text-blue-600" />
                {t('authorityLogin.demoCredentials')}
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>{t('authorityLogin.usernameLabel')}:</strong> roads.admin</p>
                <p><strong>{t('authorityLogin.passwordLabel')}:</strong> SecureRoad2026!</p>
                <p className="text-gray-500 mt-2">{t('authorityLogin.otherUsers')}: waste.admin, environment.admin, admin.super</p>
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
          {t('authorityLogin.securePortal')}
        </div>
      </div>
    </div>
  );
};

export default AuthorityLogin;
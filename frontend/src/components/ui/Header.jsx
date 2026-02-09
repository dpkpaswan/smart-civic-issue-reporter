import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../AppIcon';
import Button from './Button';
import LanguageSwitcher from './LanguageSwitcher';

const Header = ({ isAuthenticated = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const publicNavItems = [
    { label: t('navbar.reportIssue'), path: '/report-issue', icon: 'Camera' },
    { label: t('navbar.trackIssues'), path: '/public-transparency', icon: 'Eye' },
  ];

  const isActivePath = (path) => location?.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-card shadow-elevation-2">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => handleNavigation('/home-landing')}
          >
            <div className="header-logo">
              <Icon name="Shield" size={24} className="header-logo-icon" />
            </div>
            <span className="header-logo-text">{t('navbar.title')}</span>
          </div>

          <nav className="hidden lg:flex items-center gap-2">
            {publicNavItems?.map((item) => (
              <Button
                key={item?.path}
                variant={isActivePath(item?.path) ? 'default' : 'ghost'}
                onClick={() => handleNavigation(item?.path)}
                iconName={item?.icon}
                iconPosition="left"
                iconSize={18}
              >
                {item?.label}
              </Button>
            ))}
            
            {!isAuthenticated && (
              <Button
                variant="outline"
                onClick={() => handleNavigation('/authority-login')}
                iconName="LogIn"
                iconPosition="left"
                iconSize={18}
                className="ml-2"
              >
                {t('navbar.authorityLogin')}
              </Button>
            )}
            <LanguageSwitcher />
          </nav>

          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted transition-smooth"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={24} />
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-card border-t border-border">
          <nav className="flex flex-col p-4 gap-2">
            {publicNavItems?.map((item) => (
              <Button
                key={item?.path}
                variant={isActivePath(item?.path) ? 'default' : 'ghost'}
                onClick={() => handleNavigation(item?.path)}
                iconName={item?.icon}
                iconPosition="left"
                iconSize={18}
                fullWidth
                className="justify-start"
              >
                {item?.label}
              </Button>
            ))}
            
            {!isAuthenticated && (
              <Button
                variant="outline"
                onClick={() => handleNavigation('/authority-login')}
                iconName="LogIn"
                iconPosition="left"
                iconSize={18}
                fullWidth
                className="justify-start mt-2"
              >
                {t('navbar.authorityLogin')}
              </Button>
            )}

            <div className="mt-3 pt-3 border-t border-border">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date()?.getFullYear();

  const footerLinks = {
    platform: [
      { label: 'Report Issue', path: '/report-issue' },
      { label: 'Track Issues', path: '/public-transparency' },
      { label: 'Authority Login', path: '/authority-dashboard' }
    ],
    support: [
      { label: 'Help Center', path: '#' },
      { label: 'Privacy Policy', path: '#' },
      { label: 'Terms of Service', path: '#' }
    ],
    connect: [
      { label: 'Contact Us', path: '#' },
      { label: 'Community Forum', path: '#' },
      { label: 'Feedback', path: '#' }
    ]
  };

  const socialLinks = [
    { icon: 'Twitter', label: 'Twitter', url: '#' },
    { icon: 'Facebook', label: 'Facebook', url: '#' },
    { icon: 'Instagram', label: 'Instagram', url: '#' },
    { icon: 'Linkedin', label: 'LinkedIn', url: '#' }
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12 mb-8 md:mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="header-logo">
                <Icon name="Shield" size={24} className="header-logo-icon" />
              </div>
              <span className="header-logo-text">Smart Civic Reporter</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Empowering citizens to create positive change through transparent civic engagement and community-driven issue resolution.
            </p>
            <div className="flex gap-3">
              {socialLinks?.map((social) => (
                <a
                  key={social?.label}
                  href={social?.url}
                  className="w-9 h-9 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-smooth group"
                  aria-label={social?.label}
                >
                  <Icon
                    name={social?.icon}
                    size={18}
                    className="text-muted-foreground group-hover:text-primary transition-smooth"
                  />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Platform</h3>
            <ul className="space-y-3">
              {footerLinks?.platform?.map((link) => (
                <li key={link?.label}>
                  <button
                    onClick={() => navigate(link?.path)}
                    className="text-sm text-muted-foreground hover:text-primary transition-smooth"
                  >
                    {link?.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks?.support?.map((link) => (
                <li key={link?.label}>
                  <a
                    href={link?.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-smooth"
                  >
                    {link?.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Connect</h3>
            <ul className="space-y-3">
              {footerLinks?.connect?.map((link) => (
                <li key={link?.label}>
                  <a
                    href={link?.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-smooth"
                  >
                    {link?.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 md:pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Icon name="Award" size={16} className="text-primary" />
            </div>

            <p className="text-xs md:text-sm text-muted-foreground text-center md:text-left">
              &copy; {currentYear} Smart Civic Reporter. All rights reserved.
            </p>

            <div className="flex items-center gap-2">
              <Icon name="Shield" size={16} className="text-success" />
              <span className="text-xs md:text-sm text-muted-foreground">
                Secured & Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
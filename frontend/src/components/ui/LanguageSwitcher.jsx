// LanguageSwitcher.jsx — Mobile-friendly language selector using react-i18next
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../AppIcon';

const languages = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ta', label: 'தமிழ்', short: 'த' },
  { code: 'hi', label: 'हिंदी', short: 'हि' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <>
      {/* Desktop: inline tab pills — hidden on small screens */}
      <div className="hidden sm:flex items-center gap-1.5">
        <Icon name="Globe" size={16} className="text-muted-foreground" />
        <div className="flex rounded-lg border border-border overflow-hidden">
          {languages.map((lng) => (
            <button
              key={lng.code}
              onClick={() => i18n.changeLanguage(lng.code)}
              className={`px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                i18n.language === lng.code
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-label={`Switch to ${lng.label}`}
            >
              {lng.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: compact dropdown — visible only on small screens */}
      <div className="sm:hidden relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors w-full"
          aria-label="Change language"
        >
          <Icon name="Globe" size={16} className="text-muted-foreground" />
          <span>{current.label}</span>
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={14} className="ml-auto text-muted-foreground" />
        </button>

        {open && (
          <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in">
            {languages.map((lng) => (
              <button
                key={lng.code}
                onClick={() => { i18n.changeLanguage(lng.code); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                  i18n.language === lng.code
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {i18n.language === lng.code && (
                  <Icon name="Check" size={14} className="text-primary" />
                )}
                <span className={i18n.language !== lng.code ? 'ml-[22px]' : ''}>{lng.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default LanguageSwitcher;

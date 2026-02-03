import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

const PageTransition = ({ children, className }) => {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div 
      className={cn(
        'animate-fade-in-up',
        isAnimating && 'animate-fade-in-scale',
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageTransition;
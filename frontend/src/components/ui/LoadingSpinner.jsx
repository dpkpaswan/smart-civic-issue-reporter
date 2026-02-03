import React from 'react';
import { cn } from '../../utils/cn';

const LoadingSpinner = ({ size = 'md', className, variant = 'primary' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-2'
  };

  const variantClasses = {
    primary: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    muted: 'border-muted-foreground border-t-transparent'
  };

  return (
    <div 
      className={cn(
        'animate-spin rounded-full inline-block',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label="Loading"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

const LoadingDots = ({ className }) => (
  <div className={cn("flex items-center space-x-1", className)}>
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
  </div>
);

const LoadingPulse = ({ className }) => (
  <div className={cn("flex items-center space-x-2", className)}>
    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

const SkeletonLoader = ({ className, lines = 3 }) => (
  <div className={cn("animate-pulse", className)}>
    {[...Array(lines)].map((_, i) => (
      <div
        key={i}
        className="h-4 bg-muted rounded mb-2 last:mb-0"
        style={{ 
          width: i === lines - 1 ? '60%' : '100%',
          animationDelay: `${i * 0.1}s`
        }}
      />
    ))}
  </div>
);

export { LoadingSpinner, LoadingDots, LoadingPulse, SkeletonLoader };
export default LoadingSpinner;
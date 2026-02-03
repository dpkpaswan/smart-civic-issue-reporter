import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export const LoadingButton = ({ 
  isLoading, 
  children, 
  className = '', 
  iconName, 
  iconPosition, 
  iconSize, 
  fullWidth,
  ...props 
}) => {
  return (
    <button
      className={`relative flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};

export const LoadingOverlay = ({ isLoading, children }) => {
  if (!isLoading) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" className="text-blue-600" />
          <span className="text-gray-600 text-sm">Loading...</span>
        </div>
      </div>
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
      <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/6"></div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4 p-4 border-b border-gray-200">
          <div className="w-16 h-16 bg-gray-300 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            <div className="flex space-x-2">
              <div className="h-3 bg-gray-300 rounded w-16"></div>
              <div className="h-3 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-300 rounded w-20"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
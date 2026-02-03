import React from 'react';
import Icon from '../AppIcon';

const IssueStatusIndicator = ({ 
  status = 'pending',
  size = 'default',
  showLabel = true,
  className = ''
}) => {
  const statusConfig = {
    pending: {
      label: 'Pending Review',
      icon: 'Clock',
      bgColor: 'bg-warning/10',
      textColor: 'text-warning-foreground',
      iconColor: 'text-warning',
      borderColor: 'border-warning/20'
    },
    'in-progress': {
      label: 'In Progress',
      icon: 'RefreshCw',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary-foreground',
      iconColor: 'text-primary',
      borderColor: 'border-primary/20'
    },
    resolved: {
      label: 'Resolved',
      icon: 'CheckCircle',
      bgColor: 'bg-success/10',
      textColor: 'text-success-foreground',
      iconColor: 'text-success',
      borderColor: 'border-success/20'
    },
    rejected: {
      label: 'Rejected',
      icon: 'XCircle',
      bgColor: 'bg-error/10',
      textColor: 'text-error-foreground',
      iconColor: 'text-error',
      borderColor: 'border-error/20'
    }
  };

  const config = statusConfig?.[status] || statusConfig?.pending;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    default: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  };

  const iconSizes = {
    sm: 14,
    default: 16,
    lg: 18
  };

  return (
    <div 
      className={`
        inline-flex items-center rounded-md border
        ${config?.bgColor} ${config?.borderColor}
        ${sizeClasses?.[size]}
        transition-smooth
        ${className}
      `}
      role="status"
      aria-label={`Issue status: ${config?.label}`}
    >
      <Icon 
        name={config?.icon} 
        size={iconSizes?.[size]} 
        className={config?.iconColor}
      />
      {showLabel && (
        <span className={`font-medium ${config?.textColor}`}>
          {config?.label}
        </span>
      )}
    </div>
  );
};

export default IssueStatusIndicator;
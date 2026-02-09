import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../AppIcon';
import Button from './Button';

const LocationDisplay = ({ 
  address = '',
  coordinates = null,
  variant = 'full',
  onLocationChange = null,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCoordinates = (coords) => {
    if (!coords || !coords?.lat || !coords?.lng) return '';
    return `${coords?.lat?.toFixed(6)}, ${coords?.lng?.toFixed(6)}`;
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation?.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position?.coords?.latitude,
            lng: position?.coords?.longitude
          };
          if (onLocationChange) {
            onLocationChange(coords);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-start gap-2 ${className}`}>
        <Icon name="MapPin" size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">{address || t('location.noAddressProvided')}</p>
          {coordinates && (
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {formatCoordinates(coordinates)}
            </p>
          )}
        </div>
        {onLocationChange && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
            iconPosition="right"
            className="flex-shrink-0"
          >
            {isExpanded ? t('location.hide') : t('location.show')} {t('location.map')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-border overflow-hidden ${className}`}>
      <div className="p-4 lg:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-md flex-shrink-0">
              <Icon name="MapPin" size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground mb-1">{t('location.title')}</h3>
              <p className="text-sm text-muted-foreground break-words">
                {address || t('location.noAddressProvided')}
              </p>
              {coordinates && (
                <p className="text-xs text-muted-foreground font-mono mt-2">
                  {formatCoordinates(coordinates)}
                </p>
              )}
            </div>
          </div>
          {onLocationChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              iconName="Navigation"
              iconPosition="left"
              iconSize={16}
              className="flex-shrink-0"
            >
              {t('location.useCurrent')}
            </Button>
          )}
        </div>

        <div className="w-full h-48 lg:h-64 bg-muted rounded-md overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Icon name="Map" size={48} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('location.mapPreview')}</p>
              {coordinates && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {formatCoordinates(coordinates)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDisplay;
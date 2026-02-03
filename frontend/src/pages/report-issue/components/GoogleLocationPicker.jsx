import React, { useState, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useGoogleHighAccuracyLocation } from '../../../hooks/useGoogleHighAccuracyLocation';

/**
 * Google Maps High-Accuracy LocationPicker Component
 * 
 * Features:
 * - High-accuracy GPS detection with Google Maps geocoding
 * - Real-time accuracy monitoring and validation
 * - Detailed address information (street, area, city, postal code)
 * - Professional UX with comprehensive error handling
 * - Production-ready for civic issue reporting
 */
const GoogleLocationPicker = ({ location, onLocationChange }) => {
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);

  /**
   * Handle successful GPS location detection with Google Maps data
   */
  const handleLocationDetected = useCallback((locationData) => {
    onLocationChange(locationData);
  }, [onLocationChange]);

  /**
   * Handle GPS detection errors
   */
  const handleLocationError = useCallback((errorInfo) => {
    console.error('Location Detection Error:', errorInfo);
  }, []);

  // Google Maps High-accuracy GPS location hook
  const {
    location: gpsLocation,
    accuracy,
    isDetecting,
    isGeocoding,
    error,
    permission,
    addressDetails,
    isAccuracyAcceptable,
    accuracyDisplay,
    locationDescription,
    isGoogleMapsConfigured,
    retryCount,
    maxRetries,
    detectLocation,
    retryDetection,
    getAccuracyStatus
  } = useGoogleHighAccuracyLocation({
    enableAutoDetection: true,
    accuracyThreshold: 50, // Civic reporting accuracy requirement
    maxRetries: 3,
    onLocationDetected: handleLocationDetected,
    onError: handleLocationError
  });

  /**
   * Handle manual address submission
   */
  const handleManualSubmit = () => {
    if (manualAddress?.trim()) {
      const manualLocationData = {
        address: manualAddress.trim(),
        addressSource: 'manual',
        coordinates: null,
        accuracy: null,
        timestamp: new Date().toISOString(),
        source: 'manual'
      };
      
      onLocationChange(manualLocationData);
      setShowManualInput(false);
      setManualAddress('');
    }
  };

  /**
   * Get accuracy status styling classes
   */
  const getAccuracyStyleClass = () => {
    if (!accuracy) return '';
    
    const status = getAccuracyStatus(accuracy);
    switch (status.color) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'destructive': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  /**
   * Get processing status for display
   */
  const getProcessingStatus = () => {
    if (isDetecting) return 'Detecting precise GPS location...';
    if (isGeocoding) return 'Getting address information...';
    return null;
  };

  // Check if Google Maps API is configured
  React.useEffect(() => {
    if (!isGoogleMapsConfigured) {
      setShowApiKeyWarning(true);
    }
  }, [isGoogleMapsConfigured]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base lg:text-lg font-semibold text-foreground">Location</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {getProcessingStatus() || 
             (location ? 'High-accuracy location detected' : 
              error ? 'Location detection failed' :
              'Ready for precise location detection')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={detectLocation}
            loading={isDetecting || isGeocoding}
            disabled={isDetecting || isGeocoding || permission === 'denied'}
            iconName="Navigation"
            iconPosition="left"
            iconSize={16}
          >
            <span className="hidden sm:inline">
              {retryCount > 0 ? 'Retry' : 'Detect'}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowManualInput(!showManualInput)}
            iconName="Edit"
            iconPosition="left"
            iconSize={16}
          >
            <span className="hidden sm:inline">Manual</span>
          </Button>
        </div>
      </div>

      {/* Google Maps API Key Warning */}
      {showApiKeyWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Icon name="AlertTriangle" size={20} className="text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">Google Maps API Key Required</h4>
              <p className="text-xs text-yellow-600 mt-1">
                To enable high-accuracy geocoding, please add REACT_APP_GOOGLE_MAPS_API_KEY to your environment variables.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKeyWarning(false)}
                className="mt-2 border-yellow-200 text-yellow-600 hover:bg-yellow-50"
              >
                Continue with Basic Detection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* GPS Detection Status */}
      {(isDetecting || isGeocoding) && (
        <div className="bg-card rounded-lg border border-border p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-spin">
              <Icon name="Navigation" size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDetecting ? 'High-Accuracy GPS Detection' : 'Google Maps Geocoding'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isDetecting ? 'Using GPS, Wi-Fi, and cellular triangulation...' : 'Converting coordinates to detailed address...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GPS Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Icon name="AlertTriangle" size={20} className="text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">{error.message}</h4>
              <p className="text-xs text-red-600 mt-1">{error.instructions}</p>
              {retryCount < maxRetries && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryDetection}
                  className="mt-2 border-red-200 text-red-600 hover:bg-red-50"
                  iconName="RefreshCw"
                  iconPosition="left"
                  iconSize={14}
                >
                  Retry Detection ({retryCount + 1}/{maxRetries})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accuracy Warning */}
      {accuracy && !isAccuracyAcceptable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Icon name="AlertTriangle" size={20} className="text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800">Accuracy Warning</h4>
              <p className="text-xs text-yellow-600 mt-1">
                Current GPS accuracy: {accuracyDisplay}. For civic reporting, accuracy better than 50 meters is recommended.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryDetection}
                  className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                  iconName="RefreshCw"
                  iconPosition="left"
                  iconSize={14}
                >
                  Try for Better Accuracy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}} // Accept current accuracy
                  className="text-yellow-600"
                >
                  Proceed Anyway
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Address Input */}
      {showManualInput && (
        <div className="bg-card rounded-lg border border-border p-4 lg:p-6 mb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Enter Address Manually
              </label>
              <textarea
                value={manualAddress}
                onChange={(e) => setManualAddress(e?.target?.value)}
                placeholder="Enter the complete address where the civic issue is located..."
                className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Include street address, area, city, state, and postal code for precise issue reporting.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleManualSubmit}
                disabled={!manualAddress?.trim()}
                iconName="Check"
                iconPosition="left"
                iconSize={16}
              >
                Save Address
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowManualInput(false);
                  setManualAddress('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Location Display */}
      {location && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-4 lg:p-6">
            {/* Location Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-2 rounded-md flex-shrink-0 ${
                location.addressSource === 'google_maps' ? 'bg-green-50' : 
                location.addressSource === 'coordinates' ? 'bg-blue-50' : 'bg-gray-50'
              }`}>
                <Icon 
                  name={location.addressSource === 'google_maps' ? 'MapPin' : 
                       location.addressSource === 'coordinates' ? 'Navigation' : 'Edit'} 
                  size={20} 
                  className={
                    location.addressSource === 'google_maps' ? 'text-green-600' : 
                    location.addressSource === 'coordinates' ? 'text-blue-600' : 'text-gray-600'
                  } 
                />
              </div>
              <div className="flex-1 min-w-0">
                {/* Primary Address Display */}
                <p className="text-sm text-foreground break-words font-medium">
                  {locationDescription || location.address}
                </p>
                
                {/* Detailed Address Components */}
                {addressDetails && (
                  <div className="mt-2 space-y-1">
                    {addressDetails.streetAddress && (
                      <p className="text-xs text-muted-foreground">
                        📍 {addressDetails.streetAddress}
                      </p>
                    )}
                    {addressDetails.area && addressDetails.city && (
                      <p className="text-xs text-muted-foreground">
                        🏘️ {addressDetails.area}, {addressDetails.city}
                      </p>
                    )}
                    {addressDetails.postalCode && (
                      <p className="text-xs text-muted-foreground">
                        📮 {addressDetails.postalCode}
                      </p>
                    )}
                  </div>
                )}
                
                {/* GPS Coordinates */}
                {location?.coordinates && (
                  <p className="text-xs text-muted-foreground font-mono mt-2">
                    {location.coordinates.latitude?.toFixed(6)}, {location.coordinates.longitude?.toFixed(6)}
                  </p>
                )}
                
                {/* Accuracy Status */}
                {accuracy && location.addressSource !== 'manual' && (
                  <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-md text-xs border ${getAccuracyStyleClass()}`}>
                    <Icon name="Navigation" size={12} />
                    Accuracy: {accuracyDisplay}
                    {isAccuracyAcceptable && <Icon name="CheckCircle" size={12} />}
                  </div>
                )}
                
                {/* Source Indicator */}
                <div className="flex items-center gap-2 mt-2">
                  {location.addressSource === 'google_maps' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs border border-green-200">
                      <Icon name="CheckCircle" size={12} />
                      Google Maps Verified
                    </span>
                  )}
                  {location.addressSource === 'coordinates' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs border border-blue-200">
                      <Icon name="Navigation" size={12} />
                      GPS Coordinates
                    </span>
                  )}
                  {location.addressSource === 'manual' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 text-gray-700 text-xs border border-gray-200">
                      <Icon name="Edit" size={12} />
                      Manually Entered
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Google Maps Display */}
            {location?.coordinates && (
              <div className="w-full h-48 lg:h-64 bg-muted rounded-md overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  loading="lazy"
                  title="Issue Location - Google Maps"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${location.coordinates.latitude},${location.coordinates.longitude}&z=17&output=embed`}
                  className="border-0"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Location Detected State */}
      {!location && !isDetecting && !error && (
        <div className="bg-card rounded-lg border border-border p-8 lg:p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Icon name="MapPin" size={32} className="text-primary" />
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Precise Location Detection
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get high-accuracy GPS coordinates and detailed address information for your civic issue report
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={detectLocation}
              iconName="Navigation"
              iconPosition="left"
              iconSize={16}
            >
              Detect My Location
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleLocationPicker;
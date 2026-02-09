import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useHighAccuracyLocation } from '../../../hooks/useHighAccuracyLocation';

/**
 * LocationPicker Component for Smart Civic Issue Reporter
 * 
 * Features:
 * - High-accuracy GPS auto-detection on page load
 * - Real-time accuracy monitoring (±meters display)
 * - Accuracy validation (warns if > 50 meters)
 * - Automatic retry for poor accuracy readings
 * - Manual address entry fallback
 * - Production-ready with no mock data
 */
const LocationPicker = ({ location, onLocationChange }) => {
  const { t } = useTranslation();
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [addressFromCoords, setAddressFromCoords] = useState('');
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  /**
   * Handle successful GPS location detection
   */
  const handleGPSLocationDetected = useCallback((locationData) => {
    // First, immediately save the GPS location to avoid endless loading
    const processedLocation = {
      coordinates: {
        lat: locationData.coordinates.latitude,
        lng: locationData.coordinates.longitude
      },
      accuracy: locationData.accuracy,
      accuracyStatus: locationData.accuracyStatus,
      timestamp: locationData.timestamp,
      source: 'gps',
      address: `GPS: ${locationData.coordinates.latitude.toFixed(5)}°, ${locationData.coordinates.longitude.toFixed(5)}°` // Coordinates as address
    };
    
    // Update parent component immediately with coordinates
    onLocationChange(processedLocation);
    
    // Try to get human-readable address in background (completely non-blocking)
    // This won't update the main location to avoid re-renders
    reverseGeocode(locationData.coordinates.latitude, locationData.coordinates.longitude);
  }, [onLocationChange]);

  /**
   * Handle GPS detection errors
   */
  const handleGPSError = useCallback((errorInfo) => {
    console.error('GPS Location Error:', errorInfo);
    // Parent component can access error via the hook
  }, []);

  // High-accuracy GPS location hook
  const {
    location: gpsLocation,
    accuracy,
    isDetecting,
    error,
    permission,
    isAccuracyAcceptable,
    accuracyDisplay,
    retryCount,
    maxRetries,
    detectLocation,
    retryDetection,
    getAccuracyStatus
  } = useHighAccuracyLocation({
    enableAutoDetection: true,
    accuracyThreshold: 50, // Warn if accuracy > 50 meters
    maxRetries: 3,
    onLocationDetected: handleGPSLocationDetected,
    onError: handleGPSError
  });
  const reverseGeocode = useCallback(async (latitude, longitude) => {
    setIsGeocodingAddress(true);
    
    try {
      // Try geocoding with a shorter timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Smart-Civic-Issue-Reporter/1.0',
            'Accept': 'application/json',
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          // Only update the local address state, NOT the main location to avoid re-renders
          setAddressFromCoords(data.display_name);
        } else {
          throw new Error('No address in response');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        // Geocoding aborted or failed — handled gracefully
      } else if (error.name !== 'AbortError') {
        // Geocoding failed — fall through to address display fallback
      }
      
      // Set fallback address in local state only
      setAddressFromCoords(`GPS: ${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°`);
    } finally {
      setIsGeocodingAddress(false);
    }
  }, []);

  /**
   * Handle manual address submission
   */
  const handleManualSubmit = () => {
    if (manualAddress?.trim()) {
      onLocationChange({
        address: manualAddress.trim(),
        source: 'manual',
        timestamp: new Date().toISOString(),
        coordinates: null, // No GPS coordinates for manual entry
        accuracy: null
      });
      setShowManualInput(false);
      setManualAddress('');
    }
  };

  /**
   * Get accuracy status styling
   */
  const getAccuracyStyleClass = () => {
    if (!accuracy) return '';
    
    const status = getAccuracyStatus(accuracy);
    switch (status.color) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'destructive': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base lg:text-lg font-semibold text-foreground">{t('location.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isDetecting ? t('location.detectingPrecise') : 
             location ? t('location.detected') : 
             error ? t('location.detectionFailed') :
             t('location.readyToDetect')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={detectLocation}
            loading={isDetecting}
            disabled={isDetecting || permission === 'denied'}
            iconName="Navigation"
            iconPosition="left"
            iconSize={16}
          >
            <span className="hidden sm:inline">
              {retryCount > 0 ? t('location.tryAgain') : t('location.autoDetect')}
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
            <span className="hidden sm:inline">{t('location.enterManually')}</span>
          </Button>
        </div>
      </div>

      {/* GPS Detection Status */}
      {isDetecting && (
        <div className="bg-card rounded-lg border border-border p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-spin">
              <Icon name="Navigation" size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t('location.detectingGPS')}</p>
              <p className="text-xs text-muted-foreground">
                {t('location.usingGPS')}
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
                  {`Retry (${retryCount + 1}/${maxRetries})`}
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
              <h4 className="text-sm font-medium text-yellow-800">{t('location.lowAccuracy')}</h4>
              <p className="text-xs text-yellow-600 mt-1">
                {t('location.considerRetry')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={retryDetection}
                className="mt-2 border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                iconName="RefreshCw"
                iconPosition="left"
                iconSize={14}
              >
                {t('location.tryAgain')}
              </Button>
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
                {t('location.enterManually')}
              </label>
              <textarea
                value={manualAddress}
                onChange={(e) => setManualAddress(e?.target?.value)}
                placeholder={t('location.enterAddress')}
                className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {t('location.includeDetails')}
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
                {t('location.setLocation')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowManualInput(false);
                  setManualAddress('');
                }}
              >
                {t('location.cancel')}
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
                location.source === 'gps' ? 'bg-green-50' : 'bg-blue-50'
              }`}>
                <Icon 
                  name={location.source === 'gps' ? 'Navigation' : 'MapPin'} 
                  size={20} 
                  className={location.source === 'gps' ? 'text-green-600' : 'text-blue-600'} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground break-words">
                  {addressFromCoords || location?.address || (isGeocodingAddress ? t('location.gettingAddress') : t('location.noAddressProvided'))}
                </p>
                
                {/* GPS Coordinates */}
                {location?.coordinates && (
                  <p className="text-xs text-muted-foreground font-mono mt-2">
                    {location.coordinates.lat?.toFixed(6)}, {location.coordinates.lng?.toFixed(6)}
                  </p>
                )}
                
                {/* Accuracy Display */}
                {accuracy && location.source === 'gps' && (
                  <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-md text-xs border ${getAccuracyStyleClass()}`}>
                    <Icon name="Navigation" size={12} />
                    Accuracy: {accuracyDisplay}
                    {isAccuracyAcceptable && <Icon name="CheckCircle" size={12} />}
                  </div>
                )}
                
                {/* Manual Entry Indicator */}
                {location?.source === 'manual' && (
                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-xs border border-blue-200">
                    <Icon name="Edit" size={12} />
                    {t('location.manuallyEntered')}
                  </span>
                )}
              </div>
            </div>

            {/* Map Display */}
            {location?.coordinates && (
              <div className="w-full h-48 lg:h-64 bg-muted rounded-md overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  loading="lazy"
                  title="Issue Location"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}&z=17&output=embed`}
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
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Icon name="MapPin" size={32} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('location.noLocationDetected')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={detectLocation}
              iconName="Navigation"
              iconPosition="left"
              iconSize={16}
            >
              {t('location.autoDetect')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
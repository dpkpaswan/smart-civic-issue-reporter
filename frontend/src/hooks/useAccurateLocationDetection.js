import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Free High-Accuracy Location Detection Hook
 * Uses Browser Geolocation + OpenStreetMap Nominatim API (100% Free)
 * No API keys required, excellent accuracy for civic reporting
 */
export const useAccurateLocationDetection = ({
  enableAutoDetection = true,
  accuracyThreshold = 50,
  maxRetries = 3
} = {}) => {
  // Core location state
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState(null);
  const [addressDetails, setAddressDetails] = useState(null);
  
  // Retry and tracking state
  const [retryCount, setRetryCount] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState(null);
  const timeoutRef = useRef(null);

  // High-accuracy geolocation configuration
  const geoOptions = useMemo(() => ({
    enableHighAccuracy: true,    // Use GPS/Wi-Fi/network triangulation
    timeout: 15000,              // 15 second timeout
    maximumAge: 0                // Always get fresh reading
  }), []);

  // Calculate accuracy status for civic reporting
  // Desktop browsers use IP/WiFi (100-5000m), mobile has real GPS (5-50m)
  const getAccuracyStatus = (accuracyMeters) => {
    if (accuracyMeters <= 10) {
      return { quality: 'excellent', color: 'success', icon: 'CheckCircle' };
    } else if (accuracyMeters <= 50) {
      return { quality: 'good', color: 'success', icon: 'CheckCircle' };
    } else if (accuracyMeters <= 200) {
      return { quality: 'fair', color: 'warning', icon: 'AlertTriangle' };
    } else if (accuracyMeters <= 1000) {
      return { quality: 'approximate', color: 'warning', icon: 'AlertTriangle' };
    } else {
      return { quality: 'rough', color: 'destructive', icon: 'AlertCircle' };
    }
  };

  // Check if accuracy is acceptable for civic reporting
  // Desktop browsers rarely get <50m, so we accept up to the configured threshold
  const isAccuracyAcceptable = accuracy && accuracy <= accuracyThreshold;

  // OpenStreetMap Nominatim reverse geocoding (100% Free)
  const reverseGeocode = useCallback(async (latitude, longitude) => {
    setIsGeocoding(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${latitude}&lon=${longitude}&format=json&` +
        `addressdetails=1&zoom=18&extratags=1`,
        {
          headers: {
            'User-Agent': 'Smart-Civic-Reporter/1.0 (Civic Issue Reporting App)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.address) {
        throw new Error('No address data received from geocoding service');
      }

      // Parse detailed address components
      const address = data.address;
      const addressDetails = {
        formattedAddress: data.display_name,
        streetAddress: [
          address.house_number,
          address.road || address.street
        ].filter(Boolean).join(' '),
        area: address.neighbourhood || address.suburb || address.village || address.town,
        city: address.city || address.municipality || address.county,
        state: address.state || address.province || address.region,
        postalCode: address.postcode,
        country: address.country,
        placeId: data.place_id
      };

      // Create clean street address
      const streetAddress = addressDetails.streetAddress || 
        addressDetails.area || 
        `${addressDetails.city}, ${addressDetails.state}`;

      setAddressDetails(addressDetails);
      return streetAddress;

    } catch (error) {
      console.warn('🗺️ Free geocoding failed, using coordinates:', error.message);
      
      // Fallback: Return coordinate string
      const coordString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      setAddressDetails({
        formattedAddress: coordString,
        streetAddress: coordString,
        coordinatesOnly: true
      });
      
      return coordString;
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Main GPS detection function
  const detectLocation = useCallback(async () => {
    if (isDetecting) return;

    setIsDetecting(true);
    setError(null);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('GPS detection timeout after 15 seconds'));
        }, geoOptions.timeout);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutId);
            reject(err);
          },
          geoOptions
        );
      });

      const { latitude, longitude, accuracy: gpsAccuracy } = position.coords;
      
      setAccuracy(gpsAccuracy);
      
      // Get address using free OpenStreetMap geocoding
      const address = await reverseGeocode(latitude, longitude);
      
      // Create complete location object
      const locationData = {
        coordinates: { latitude, longitude },
        accuracy: gpsAccuracy,
        accuracyStatus: getAccuracyStatus(gpsAccuracy),
        address,
        addressSource: 'openstreetmap',
        timestamp: new Date().toISOString(),
        source: 'gps'
      };

      setLocation(locationData);
      setLastDetectionTime(Date.now());
      setRetryCount(0);

    } catch (err) {
      console.error('❌ Free location detection failed:', err);
      
      let errorMessage = 'Unable to detect location';
      let errorType = 'UNKNOWN_ERROR';
      let instructions = 'Please try again or enter your address manually';

      // Handle specific error types
      if (err.code === 1) {
        errorType = 'PERMISSION_DENIED';
        errorMessage = 'Location access denied';
        instructions = 'Please enable location permissions in your browser settings and refresh the page';
      } else if (err.code === 2) {
        errorType = 'POSITION_UNAVAILABLE';
        errorMessage = 'Location unavailable';
        instructions = 'Please check your device\'s location services and try again';
      } else if (err.code === 3 || err.message.includes('timeout')) {
        errorType = 'TIMEOUT';
        errorMessage = 'Location detection timeout';
        instructions = 'GPS signal weak. Please move to an area with better reception and try again';
      }

      setError({
        type: errorType,
        message: errorMessage,
        instructions,
        originalError: err.message
      });

    } finally {
      setIsDetecting(false);
    }
  }, [isDetecting, reverseGeocode, geoOptions]);

  // Retry detection with better accuracy
  const retryDetection = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setError({
        type: 'MAX_RETRIES_EXCEEDED',
        message: `Maximum retries (${maxRetries}) exceeded`,
        instructions: 'Please enter your address manually or try again later'
      });
      return;
    }

    setRetryCount(prev => prev + 1);
    
    // Exponential backoff: wait 2^retryCount seconds
    const delay = Math.pow(2, retryCount) * 1000;
    
    timeoutRef.current = setTimeout(() => {
      detectLocation();
    }, delay);
  }, [retryCount, maxRetries, detectLocation]);

  // Auto-detection on mount
  useEffect(() => {
    if (enableAutoDetection && !location && !isDetecting) {
      detectLocation();
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enableAutoDetection, location, isDetecting, detectLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    // Location data
    location,
    accuracy,
    isDetecting,
    isGeocoding,
    error,
    addressDetails,
    
    // Status indicators
    isAccuracyAcceptable,
    accuracyStatus: accuracy ? getAccuracyStatus(accuracy) : null,
    
    // Control functions
    detectLocation,
    retryDetection,
    
    // Metadata
    retryCount,
    maxRetries,
    lastDetectionTime
  };
};

export default useAccurateLocationDetection;
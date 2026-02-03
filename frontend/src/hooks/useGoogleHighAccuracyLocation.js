import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Google Maps High-Accuracy Location Detection Hook
 * 
 * Combines Browser Geolocation API with Google Maps Geocoding API
 * for precise GPS coordinates and human-readable address conversion.
 * 
 * Features:
 * - High-accuracy GPS detection with validation
 * - Google Maps reverse geocoding for detailed address information
 * - Comprehensive error handling and retry logic
 * - Production-ready with environment variable API key management
 */
export const useGoogleHighAccuracyLocation = (options = {}) => {
  const {
    enableAutoDetection = true,
    accuracyThreshold = 50, // meters - warn if accuracy > 50m
    maxRetries = 3,
    onLocationDetected = null,
    onError = null
  } = options;

  // Core location state
  const [location, setLocation] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  
  // Geocoding state
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressDetails, setAddressDetails] = useState(null);
  
  // Retry and tracking state
  const [retryCount, setRetryCount] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState(null);
  const timeoutRef = useRef(null);

  // Google Maps API configuration
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // High-accuracy geolocation configuration
  const geoOptions = {
    enableHighAccuracy: true,    // Use GPS/Wi-Fi/network triangulation
    timeout: 15000,              // 15 second timeout
    maximumAge: 0                // No cached positions - always get fresh reading
  };

  /**
   * Check if Google Maps API key is configured
   */
  const isGoogleMapsConfigured = useCallback(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found in environment variables');
      return false;
    }
    return true;
  }, [GOOGLE_MAPS_API_KEY]);

  /**
   * Check if geolocation is supported and get current permission status
   */
  const checkPermissionStatus = useCallback(async () => {
    if (!navigator.geolocation) {
      setError({
        type: 'NOT_SUPPORTED',
        message: 'Geolocation is not supported by this browser',
        instructions: 'Please use a modern browser with location services support'
      });
      return false;
    }

    // Check permission status if available
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(permission.state);
        
        // Listen for permission changes
        permission.onchange = () => {
          setPermission(permission.state);
        };
      } catch (err) {
        // Permission API not available, will handle during location request
      }
    }

    return true;
  }, []);

  /**
   * Calculate accuracy quality and return status
   */
  const getAccuracyStatus = useCallback((accuracyMeters) => {
    if (accuracyMeters <= 10) return { quality: 'excellent', color: 'success', icon: 'CheckCircle' };
    if (accuracyMeters <= 25) return { quality: 'good', color: 'success', icon: 'CheckCircle' };
    if (accuracyMeters <= 50) return { quality: 'fair', color: 'warning', icon: 'AlertTriangle' };
    return { quality: 'poor', color: 'destructive', icon: 'XCircle' };
  }, []);

  /**
   * Google Maps Reverse Geocoding
   * Converts GPS coordinates to detailed address information
   */
  const reverseGeocodeWithGoogle = useCallback(async (latitude, longitude) => {
    if (!isGoogleMapsConfigured()) {
      throw new Error('Google Maps API key not configured');
    }

    setIsGeocoding(true);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&result_type=street_address|route|neighborhood|locality|administrative_area_level_1|country`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        
        // Parse address components
        const addressComponents = {};
        result.address_components.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) {
            addressComponents.streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            addressComponents.street = component.long_name;
          }
          if (types.includes('neighborhood') || types.includes('sublocality')) {
            addressComponents.area = component.long_name;
          }
          if (types.includes('locality')) {
            addressComponents.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            addressComponents.state = component.long_name;
          }
          if (types.includes('postal_code')) {
            addressComponents.postalCode = component.long_name;
          }
          if (types.includes('country')) {
            addressComponents.country = component.long_name;
          }
        });

        const addressInfo = {
          formattedAddress: result.formatted_address,
          streetAddress: [addressComponents.streetNumber, addressComponents.street].filter(Boolean).join(' '),
          area: addressComponents.area || addressComponents.city,
          city: addressComponents.city,
          state: addressComponents.state,
          postalCode: addressComponents.postalCode,
          country: addressComponents.country,
          placeId: result.place_id,
          addressComponents: addressComponents
        };

        setAddressDetails(addressInfo);
        return addressInfo;

      } else if (data.status === 'ZERO_RESULTS') {
        throw new Error('No address found for these coordinates');
      } else {
        throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Google Maps geocoding failed:', error);
      throw error;
    } finally {
      setIsGeocoding(false);
    }
  }, [GOOGLE_MAPS_API_KEY, isGoogleMapsConfigured]);

  /**
   * Process successful location detection
   */
  const handleLocationSuccess = useCallback(async (position) => {
    const coords = position.coords;
    const timestamp = new Date().toISOString();
    const accuracyMeters = Math.round(coords.accuracy);
    const accuracyStatus = getAccuracyStatus(accuracyMeters);

    const gpsData = {
      coordinates: {
        latitude: coords.latitude,
        longitude: coords.longitude
      },
      accuracy: accuracyMeters,
      accuracyStatus,
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
      timestamp,
      detectionTime: new Date()
    };

    setAccuracy(accuracyMeters);
    setError(null);
    setRetryCount(0);
    setLastDetectionTime(timestamp);

    // Immediately save GPS data with coordinate fallback address
    const coordinateAddress = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
    const initialLocation = {
      ...gpsData,
      address: coordinateAddress,
      addressSource: 'coordinates'
    };

    setLocation(initialLocation);
    setIsDetecting(false);

    // Attempt Google Maps reverse geocoding
    try {
      const addressInfo = await reverseGeocodeWithGoogle(coords.latitude, coords.longitude);
      
      // Update location with detailed address information
      const enhancedLocation = {
        ...gpsData,
        address: addressInfo.formattedAddress,
        addressDetails: addressInfo,
        addressSource: 'google_maps'
      };

      setLocation(enhancedLocation);

      // Callback for parent component with enhanced data
      if (onLocationDetected) {
        onLocationDetected(enhancedLocation);
      }

    } catch (geocodingError) {
      console.warn('Google Maps geocoding failed, using coordinates:', geocodingError.message);
      
      // Fallback: use coordinates as address
      const fallbackLocation = {
        ...gpsData,
        address: `GPS Location: ${coords.latitude.toFixed(5)}°, ${coords.longitude.toFixed(5)}°`,
        addressDetails: null,
        addressSource: 'coordinates',
        geocodingError: geocodingError.message
      };

      setLocation(fallbackLocation);

      // Callback with coordinate-based location
      if (onLocationDetected) {
        onLocationDetected(fallbackLocation);
      }
    }

  }, [getAccuracyStatus, reverseGeocodeWithGoogle, onLocationDetected]);

  /**
   * Handle location detection errors with detailed error types
   */
  const handleLocationError = useCallback((error) => {
    let errorInfo = {
      code: error.code,
      timestamp: new Date().toISOString()
    };

    switch (error.code) {
      case error.PERMISSION_DENIED:
        setPermission('denied');
        errorInfo = {
          ...errorInfo,
          type: 'PERMISSION_DENIED',
          message: 'Location access denied',
          instructions: 'Please enable location permissions in your browser settings and refresh the page'
        };
        break;
      
      case error.POSITION_UNAVAILABLE:
        errorInfo = {
          ...errorInfo,
          type: 'POSITION_UNAVAILABLE',
          message: 'Location information unavailable',
          instructions: 'Please check your GPS settings, ensure location services are enabled, and try moving to an area with better signal'
        };
        break;
      
      case error.TIMEOUT:
        errorInfo = {
          ...errorInfo,
          type: 'TIMEOUT',
          message: 'Location detection timed out',
          instructions: 'Location detection took too long. Please ensure GPS is enabled and you have good signal reception'
        };
        break;
      
      default:
        errorInfo = {
          ...errorInfo,
          type: 'UNKNOWN_ERROR',
          message: 'Unknown location error occurred',
          instructions: 'Please try again or enter your location manually'
        };
    }

    setError(errorInfo);
    setIsDetecting(false);
    
    if (onError) {
      onError(errorInfo);
    }

  }, [onError]);

  /**
   * Start high-accuracy location detection
   */
  const detectLocation = useCallback(async () => {
    const isSupported = await checkPermissionStatus();
    if (!isSupported) return;

    setIsDetecting(true);
    setError(null);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        geoOptions
      );

      // Additional safety timeout
      timeoutRef.current = setTimeout(() => {
        if (isDetecting) {
          handleLocationError({
            code: 3, // TIMEOUT
            message: 'Location detection timeout'
          });
        }
      }, geoOptions.timeout + 2000);

    } catch (err) {
      handleLocationError({
        code: 0,
        message: err.message || 'Failed to start location detection'
      });
    }
  }, [checkPermissionStatus, handleLocationSuccess, handleLocationError, isDetecting]);

  /**
   * Retry location detection with exponential backoff
   */
  const retryDetection = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      
      const delay = Math.pow(2, retryCount) * 1000;
      
      setTimeout(() => {
        detectLocation();
      }, delay);
    } else {
      setError(prev => ({
        ...prev,
        type: 'MAX_RETRIES_EXCEEDED',
        message: 'Maximum retry attempts exceeded',
        instructions: 'Location detection failed after multiple attempts. Please check your location settings or enter your address manually.'
      }));
    }
  }, [retryCount, maxRetries, detectLocation]);

  /**
   * Check if current accuracy is acceptable for civic reporting
   */
  const isAccuracyAcceptable = useCallback(() => {
    return accuracy !== null && accuracy <= accuracyThreshold;
  }, [accuracy, accuracyThreshold]);

  /**
   * Get formatted accuracy display string
   */
  const getAccuracyDisplay = useCallback(() => {
    if (accuracy === null) return null;
    return `±${accuracy} meters`;
  }, [accuracy]);

  /**
   * Get user-friendly location description
   */
  const getLocationDescription = useCallback(() => {
    if (!location) return null;
    
    if (location.addressDetails) {
      const { area, city, street } = location.addressDetails;
      if (street && area) return `${street}, ${area}`;
      if (area && city) return `Near ${area}, ${city}`;
      if (city) return `${city}`;
    }
    
    return location.address || 'Location detected';
  }, [location]);

  // Auto-detection on mount (only once)
  useEffect(() => {
    if (enableAutoDetection && !location) {
      detectLocation();
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Location data
    location,
    accuracy,
    isDetecting,
    isGeocoding,
    error,
    permission,
    addressDetails,
    
    // Status checks
    isAccuracyAcceptable: isAccuracyAcceptable(),
    accuracyDisplay: getAccuracyDisplay(),
    locationDescription: getLocationDescription(),
    isGoogleMapsConfigured: isGoogleMapsConfigured(),
    retryCount,
    maxRetries,
    lastDetectionTime,
    
    // Actions
    detectLocation,
    retryDetection,
    
    // Utilities
    checkPermissionStatus,
    getAccuracyStatus: (acc) => getAccuracyStatus(acc || accuracy)
  };
};

export default useGoogleHighAccuracyLocation;
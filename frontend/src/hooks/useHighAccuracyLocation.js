import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * High-accuracy GPS location detection hook for civic issue reporting
 * 
 * Uses Browser Geolocation API with maximum accuracy settings:
 * - GPS/Wi-Fi/network triangulation enabled
 * - High accuracy mode with timeout and cache control
 * - Real-time accuracy monitoring and validation
 * - Automatic retry logic for poor accuracy readings
 */
export const useHighAccuracyLocation = (options = {}) => {
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
  
  // Retry and tracking state
  const [retryCount, setRetryCount] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState(null);
  const watchIdRef = useRef(null);
  const timeoutRef = useRef(null);

  // High-accuracy geolocation configuration
  const geoOptions = {
    enableHighAccuracy: true,    // Use GPS/Wi-Fi/network triangulation
    timeout: 15000,              // 15 second timeout
    maximumAge: 0                // No cached positions - always get fresh reading
  };

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
    if (accuracyMeters <= 10) return { quality: 'excellent', color: 'success' };
    if (accuracyMeters <= 25) return { quality: 'good', color: 'success' };
    if (accuracyMeters <= 50) return { quality: 'fair', color: 'warning' };
    return { quality: 'poor', color: 'destructive' };
  }, []);

  /**
   * Process successful location detection
   */
  const handleLocationSuccess = useCallback((position) => {
    const coords = position.coords;
    const timestamp = new Date().toISOString();
    const accuracyMeters = Math.round(coords.accuracy);
    const accuracyStatus = getAccuracyStatus(accuracyMeters);

    const locationData = {
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

    setLocation(locationData);
    setAccuracy(accuracyMeters);
    setError(null);
    setIsDetecting(false);
    setLastDetectionTime(timestamp);
    setRetryCount(0);

    // Callback for parent component
    if (onLocationDetected) {
      onLocationDetected(locationData);
    }

  }, [getAccuracyStatus, onLocationDetected]);

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
          instructions: 'Please enable location permissions in your browser settings and reload the page'
        };
        break;
      
      case error.POSITION_UNAVAILABLE:
        errorInfo = {
          ...errorInfo,
          type: 'POSITION_UNAVAILABLE',
          message: 'Location information unavailable',
          instructions: 'Please check your device\'s location settings, ensure GPS is enabled, and try moving to an area with better signal reception'
        };
        break;
      
      case error.TIMEOUT:
        errorInfo = {
          ...errorInfo,
          type: 'TIMEOUT',
          message: 'Location detection timed out',
          instructions: 'Location detection took too long. Please ensure GPS is enabled and you\'re in an area with good signal reception'
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
    
    // Callback for parent component
    if (onError) {
      onError(errorInfo);
    }

  }, [onError]);

  /**
   * Start high-accuracy location detection
   */
  const detectLocation = useCallback(async () => {
    // Check browser support first
    const isSupported = await checkPermissionStatus();
    if (!isSupported) return;

    setIsDetecting(true);
    setError(null);

    // Clear any existing watch/timeout
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start location detection with high accuracy settings
    try {
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        geoOptions
      );

      // Set additional safety timeout
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
      
      // Exponential backoff: 1s, 2s, 4s delays
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
   * Check if current accuracy is acceptable
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
   * Start watching position for continuous updates (optional)
   */
  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      geoOptions
    );
  }, [handleLocationSuccess, handleLocationError]);

  /**
   * Stop watching position updates
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Auto-detection on mount
  useEffect(() => {
    if (enableAutoDetection && !location) { // Only run if no location exists yet
      checkPermissionStatus().then(() => {
        if (permission !== 'denied') {
          detectLocation();
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array to run only once on mount

  return {
    // Location data
    location,
    accuracy,
    isDetecting,
    error,
    permission,
    
    // Status checks
    isAccuracyAcceptable: isAccuracyAcceptable(),
    accuracyDisplay: getAccuracyDisplay(),
    retryCount,
    maxRetries,
    lastDetectionTime,
    
    // Actions
    detectLocation,
    retryDetection,
    startWatching,
    stopWatching,
    
    // Utilities
    checkPermissionStatus,
    getAccuracyStatus: (acc) => getAccuracyStatus(acc || accuracy)
  };
};

export default useHighAccuracyLocation;
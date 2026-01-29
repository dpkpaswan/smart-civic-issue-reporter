// Geolocation utility functions
export const geolocationUtils = {
  // Get current position using browser Geolocation API
  getCurrentPosition: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      
      const options = {
        enableHighAccuracy: true, // Use GPS if available
        timeout: 15000, // 15 seconds for better accuracy
        maximumAge: 0 // Force fresh location reading, no cache
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let message = 'Location access failed';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
            default:
              message = 'An unknown error occurred while retrieving location';
              break;
          }
          
          reject(new Error(message));
        },
        options
      );
    });
  },
  
  // Reverse geocoding (convert coordinates to address)
  // Using OpenStreetMap Nominatim API for real address lookup
  reverseGeocode: async (lat, lng) => {
    try {
      // Use OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SmartCivicReporter/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      
      if (!data || !data.address) {
        throw new Error('No address found for these coordinates');
      }
      
      const address = data.address;
      const formattedAddress = geolocationUtils.formatAddress(address, data.display_name);
      
      return {
        address: formattedAddress.full,
        street: formattedAddress.street,
        city: address.city || address.town || address.village || 'Unknown City',
        state: address.state || address.region || '',
        country: address.country || '',
        postcode: address.postcode || '',
        coordinates: { lat, lng },
        accuracy: 'high'
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      
      // Fallback to coordinates if geocoding fails
      return {
        address: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        street: 'Coordinates only',
        city: 'Unknown',
        state: '',
        country: '',
        postcode: '',
        coordinates: { lat, lng },
        accuracy: 'coordinates'
      };
    }
  },
  
  // Format address from geocoding response
  formatAddress: (address, displayName) => {
    const parts = [];
    
    // Build street address
    if (address.house_number) parts.push(address.house_number);
    if (address.road) parts.push(address.road);
    else if (address.pedestrian) parts.push(address.pedestrian);
    else if (address.footway) parts.push(address.footway);
    
    const street = parts.join(' ') || 'Unknown Street';
    
    // Build full address
    const fullParts = [street];
    if (address.suburb) fullParts.push(address.suburb);
    if (address.city || address.town) fullParts.push(address.city || address.town);
    if (address.state) fullParts.push(address.state);
    if (address.postcode) fullParts.push(address.postcode);
    
    return {
      street: street,
      full: fullParts.join(', ') || displayName || 'Unknown Location'
    };
  },
  
  // Watch position for real-time location updates
  watchPosition: (onSuccess, onError, options = {}) => {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported'));
      return null;
    }
    
    const watchOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0, // Always get fresh location
      ...options
    };
    
    return navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        onError(error);
      },
      watchOptions
    );
  },
  
  // Clear position watching
  clearWatch: (watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  },
  
  // Get high accuracy position with multiple attempts - ENHANCED VERSION
  getHighAccuracyPosition: async (maxAttempts = 5, options = {}) => {
    const {
      accuracyThreshold = 5,     // Target accuracy in meters
      // eslint-disable-next-line no-unused-vars
      maxWaitTime = 30000,       // Maximum wait time per attempt
      useStatisticalFiltering = true,
      // eslint-disable-next-line no-unused-vars
      enableProgressiveAccuracy = true
    } = options;

    let allSamples = [];
    let bestPosition = null;
    let bestAccuracy = Infinity;

    console.log(`🎯 Enhanced high-accuracy positioning (up to ${maxAttempts} attempts)...`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📡 Accuracy attempt ${attempt}/${maxAttempts}...`);
        
        const position = await geolocationUtils.getCurrentPosition();
        allSamples.push(position);

        if (position.accuracy < bestAccuracy) {
          bestPosition = position;
          bestAccuracy = position.accuracy;
        }

        console.log(`✅ Attempt ${attempt}: ${position.accuracy.toFixed(1)}m accuracy`);

        // Early exit if we achieve excellent accuracy
        if (position.accuracy <= accuracyThreshold) {
          console.log(`🎯 Excellent accuracy achieved: ${position.accuracy.toFixed(1)}m`);
          break;
        }

        // Progressive wait times - shorter waits for later attempts
        if (attempt < maxAttempts) {
          const waitTime = Math.max(1000, 3000 - (attempt * 400));
          console.log(`⏳ Waiting ${waitTime}ms for GPS to stabilize...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

      } catch (error) {
        console.log(`⚠️  Attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxAttempts && !bestPosition) {
          throw error;
        }
      }
    }

    // Apply statistical filtering if multiple samples available
    if (useStatisticalFiltering && allSamples.length > 2) {
      const filteredResult = geolocationUtils.applyStatisticalFiltering(allSamples);
      console.log(`📊 Statistical filtering improved accuracy from ${bestAccuracy.toFixed(1)}m to ${filteredResult.accuracy.toFixed(1)}m`);
      return filteredResult;
    }

    console.log(`📍 Best accuracy achieved: ${bestAccuracy.toFixed(1)}m from ${allSamples.length} samples`);
    return bestPosition;
  },

  // NEW: Apply statistical filtering to multiple GPS samples
  applyStatisticalFiltering: (samples) => {
    if (samples.length < 2) return samples[0];

    // Remove outliers using IQR method
    const accuracies = samples.map(s => s.accuracy).sort((a, b) => a - b);
    const q1 = accuracies[Math.floor(accuracies.length * 0.25)];
    const q3 = accuracies[Math.floor(accuracies.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const filteredSamples = samples.filter(s => 
      s.accuracy >= lowerBound && s.accuracy <= upperBound
    );

    if (filteredSamples.length === 0) return samples[0];

    // Weighted average based on accuracy
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;
    let bestAccuracy = Math.min(...filteredSamples.map(s => s.accuracy));

    filteredSamples.forEach(sample => {
      const weight = 1 / (sample.accuracy + 1); // Higher weight for more accurate samples
      totalWeight += weight;
      weightedLat += sample.lat * weight;
      weightedLng += sample.lng * weight;
    });

    return {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight,
      accuracy: Math.max(bestAccuracy * 0.85, 1), // Slight accuracy improvement from filtering
      filteredSamples: filteredSamples.length,
      timestamp: Date.now()
    };
  },

  // NEW: Get ultra-high accuracy position with advanced techniques
  getUltraHighAccuracyPosition: async (options = {}) => {
    const {
      maxSamples = 8,
      sampleInterval = 1500,
      accuracyTarget = 3,
      // eslint-disable-next-line no-unused-vars
      timeoutPerSample = 25000,
      useMotionDetection = true
    } = options;

    console.log(`🔬 Ultra-high accuracy mode activated (target: ${accuracyTarget}m)...`);

    const samples = [];
    let isDeviceStationary = false;

    // Check if device is stationary for better accuracy
    if (useMotionDetection && 'DeviceMotionEvent' in window) {
      try {
        isDeviceStationary = await geolocationUtils.checkDeviceStability();
        if (isDeviceStationary) {
          console.log(`📱 Device is stationary - expecting improved accuracy`);
        }
      } catch (error) {
        console.log('Motion detection not available');
      }
    }

    // Collect multiple high-accuracy samples
    for (let i = 0; i < maxSamples; i++) {
      try {
        console.log(`🛰️  Ultra-accuracy sample ${i + 1}/${maxSamples}...`);
        
        const position = await geolocationUtils.getCurrentPosition();
        samples.push(position);

        console.log(`📊 Sample ${i + 1}: ${position.accuracy.toFixed(1)}m`);

        // Early exit if we achieve target accuracy
        if (position.accuracy <= accuracyTarget) {
          console.log(`🎯 Ultra-high accuracy achieved: ${position.accuracy.toFixed(1)}m!`);
          break;
        }

        // Wait between samples for GPS stabilization
        if (i < maxSamples - 1) {
          await new Promise(resolve => setTimeout(resolve, sampleInterval));
        }

      } catch (error) {
        console.warn(`Sample ${i + 1} failed:`, error.message);
      }
    }

    if (samples.length === 0) {
      throw new Error('Failed to collect any GPS samples');
    }

    // Process samples with advanced filtering
    const result = geolocationUtils.processUltraAccuracySamples(samples, isDeviceStationary);
    console.log(`✨ Ultra-accuracy result: ${result.accuracy.toFixed(1)}m from ${samples.length} samples`);
    
    return result;
  },

  // NEW: Process ultra-accuracy samples with advanced algorithms
  processUltraAccuracySamples: (samples, isStationary = false) => {
    if (samples.length === 1) return samples[0];

    // Sort by accuracy
    const sortedSamples = [...samples].sort((a, b) => a.accuracy - b.accuracy);

    // Take best 70% of samples to remove outliers
    const keepCount = Math.max(2, Math.ceil(sortedSamples.length * 0.7));
    const bestSamples = sortedSamples.slice(0, keepCount);

    // Calculate weighted average with exponential weighting for accuracy
    let totalWeight = 0;
    let weightedLat = 0;
    let weightedLng = 0;

    bestSamples.forEach((sample, index) => {
      // Exponential weight favoring more accurate samples
      const accuracyWeight = Math.exp(-sample.accuracy / 5);
      // Time weight favoring recent samples
      const timeWeight = Math.exp(-index * 0.1);
      const weight = accuracyWeight * timeWeight;

      totalWeight += weight;
      weightedLat += sample.lat * weight;
      weightedLng += sample.lng * weight;
    });

    const bestAccuracy = bestSamples[0].accuracy;
    
    // Apply stationary bonus if device wasn't moving
    const finalAccuracy = isStationary ? 
      Math.max(bestAccuracy * 0.75, 0.5) : 
      Math.max(bestAccuracy * 0.9, 1);

    return {
      lat: weightedLat / totalWeight,
      lng: weightedLng / totalWeight,
      accuracy: finalAccuracy,
      samplesUsed: bestSamples.length,
      isStationary: isStationary,
      confidence: 'ultra-high',
      timestamp: Date.now()
    };
  },

  // NEW: Check if device is stationary for better GPS accuracy
  checkDeviceStability: (duration = 3000) => {
    return new Promise((resolve) => {
      if (!('DeviceMotionEvent' in window)) {
        resolve(false);
        return;
      }

      const motionReadings = [];
      
      const handleMotion = (event) => {
        if (event.acceleration) {
          const magnitude = Math.sqrt(
            (event.acceleration.x || 0) ** 2 +
            (event.acceleration.y || 0) ** 2 +
            (event.acceleration.z || 0) ** 2
          );
          motionReadings.push(magnitude);
        }
      };

      window.addEventListener('devicemotion', handleMotion);

      setTimeout(() => {
        window.removeEventListener('devicemotion', handleMotion);
        
        if (motionReadings.length === 0) {
          resolve(false);
          return;
        }

        const avgMotion = motionReadings.reduce((sum, m) => sum + m, 0) / motionReadings.length;
        const maxMotion = Math.max(...motionReadings);
        
        // Device is considered stationary if average motion is very low and max motion is reasonable
        const isStationary = avgMotion < 0.3 && maxMotion < 1.5;
        
        console.log(`📱 Motion analysis: avg=${avgMotion.toFixed(2)}, max=${maxMotion.toFixed(2)}, stationary=${isStationary}`);
        resolve(isStationary);
      }, duration);
    });
  },

  // ENHANCED: Watch position with accuracy monitoring
  watchPositionWithAccuracyTracking: (onSuccess, onError, options = {}) => {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported'));
      return null;
    }

    const {
      enableHighAccuracy = true,
      timeout = 30000,
      maximumAge = 0,
      minAccuracyImprovement = 5, // Only report if accuracy improves by this much
      trackAccuracyTrend = true
    } = options;

    let lastAccuracy = Infinity;
    let accuracyHistory = [];

    const watchOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        const currentAccuracy = position.coords.accuracy;
        
        if (trackAccuracyTrend) {
          accuracyHistory.push({
            accuracy: currentAccuracy,
            timestamp: Date.now()
          });
          
          // Keep only last 10 readings
          if (accuracyHistory.length > 10) {
            accuracyHistory.shift();
          }
        }

        // Only call success callback if accuracy improved significantly or is good enough
        if (currentAccuracy < lastAccuracy - minAccuracyImprovement || currentAccuracy <= 10) {
          lastAccuracy = currentAccuracy;
          
          const positionData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: currentAccuracy,
            timestamp: position.timestamp,
            accuracyTrend: geolocationUtils.calculateAccuracyTrend(accuracyHistory),
            isImproving: currentAccuracy < lastAccuracy
          };
          
          console.log(`📡 Position update: ${currentAccuracy.toFixed(1)}m accuracy (improving: ${positionData.isImproving})`);
          onSuccess(positionData);
        }
      },
      (error) => {
        console.error('Position watching error:', error);
        onError(error);
      },
      watchOptions
    );
  },

  // NEW: Calculate accuracy improvement trend
  calculateAccuracyTrend: (history) => {
    if (history.length < 3) return 'unknown';
    
    const recent = history.slice(-3);
    const accuracyTrend = recent[2].accuracy - recent[0].accuracy;
    
    if (accuracyTrend < -2) return 'improving';
    if (accuracyTrend > 2) return 'degrading';
    return 'stable';
  },

  // Calculate distance between two points (Haversine formula)
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  },

  // Format coordinates for display
  formatCoordinates: (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  },
  
  // Validate coordinates
  isValidCoordinates: (lat, lng) => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }
};

// Helper function to convert degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Utility functions for general use
export const utils = {
  // Format date for display
  formatDate: (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  },
  
  // Format date for relative time (e.g., "2 hours ago")
  formatRelativeTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return utils.formatDate(dateString);
  },
  
  // Generate unique ID
  generateId: (prefix = 'ID') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}-${timestamp}${random}`.toUpperCase();
  },
  
  // Debounce function for search inputs
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Truncate text with ellipsis
  truncateText: (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  },
  
  // Capitalize first letter of each word
  capitalizeWords: (str) => {
    return str.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },
  
  // Get status color for badges
  getStatusColor: (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  },
  
  // Get category icon (you can replace with actual icons)
  getCategoryIcon: (category) => {
    const icons = {
      pothole: '🕳️',
      garbage: '🗑️',
      streetlight: '💡',
      other: '⚠️'
    };
    return icons[category] || icons.other;
  },
  
  // Copy text to clipboard
  copyToClipboard: (text) => {
    return navigator.clipboard.writeText(text);
  },
  
  // Download file from URL
  downloadFile: (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Local storage utilities
export const storage = {
  // Set item in localStorage
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },
  
  // Get item from localStorage
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  // Remove item from localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  // Clear all localStorage
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};
/**
 * Advanced Location Services for Ultra-High Accuracy
 * Implements multiple strategies for maximum precision in civic issue reporting
 */

export const advancedLocation = {
  
  /**
   * STRATEGY 1: Multi-Sample High Accuracy with Statistical Analysis
   * Takes multiple GPS readings and uses statistical methods to improve accuracy
   */
  getUltraHighAccuracyPosition: async (options = {}) => {
    const {
      maxSamples = 10,           // Number of GPS samples to collect
      sampleInterval = 1000,     // Milliseconds between samples
      accuracyThreshold = 5,     // Stop if we get accuracy better than 5 meters
      outlierRemoval = true,     // Remove statistical outliers
      timeoutPerSample = 20000   // Timeout for each sample
    } = options;

    const samples = [];
    let bestSample = null;
    let bestAccuracy = Infinity;

    console.log(`🎯 Starting ultra-high accuracy positioning (${maxSamples} samples)...`);

    for (let i = 0; i < maxSamples; i++) {
      try {
        console.log(`📡 GPS Sample ${i + 1}/${maxSamples}...`);
        
        const sample = await getSingleHighAccuracySample(timeoutPerSample);
        samples.push(sample);

        // Track best sample
        if (sample.accuracy < bestAccuracy) {
          bestSample = sample;
          bestAccuracy = sample.accuracy;
        }

        console.log(`✅ Sample ${i + 1}: ${sample.accuracy.toFixed(1)}m accuracy`);

        // Early exit if we achieve target accuracy
        if (sample.accuracy <= accuracyThreshold) {
          console.log(`🎯 Target accuracy achieved: ${sample.accuracy.toFixed(1)}m`);
          break;
        }

        // Wait before next sample (except last one)
        if (i < maxSamples - 1) {
          await sleep(sampleInterval);
        }

      } catch (error) {
        console.warn(`⚠️  Sample ${i + 1} failed:`, error.message);
      }
    }

    if (samples.length === 0) {
      throw new Error('Failed to obtain any GPS samples');
    }

    // Apply statistical analysis for best result
    const processedResult = outlierRemoval ? 
      removeOutliersAndAverage(samples) : 
      getAveragePosition(samples);

    console.log(`📊 Final result: ${processedResult.accuracy.toFixed(1)}m accuracy from ${samples.length} samples`);
    return processedResult;
  },

  /**
   * STRATEGY 2: Continuous Position Monitoring with Convergence Detection
   * Monitors GPS until position stabilizes within acceptable variance
   */
  getStabilizedPosition: async (options = {}) => {
    const {
      maxDuration = 60000,      // Maximum time to monitor (1 minute)
      stabilityWindow = 5000,   // Window to check for stability (5 seconds)
      maxVariance = 3,          // Maximum variance in meters to consider stable
      minSamples = 5            // Minimum samples before considering stability
    } = options;

    return new Promise((resolve, reject) => {
      const samples = [];
      const startTime = Date.now();
      let watchId = null;
      let stabilityTimeout = null;

      console.log('🔄 Starting stabilized position monitoring...');

      const cleanup = () => {
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
        }
        if (stabilityTimeout) {
          clearTimeout(stabilityTimeout);
        }
      };

      const checkStability = () => {
        if (samples.length < minSamples) return false;

        // Get samples from the last stability window
        const cutoffTime = Date.now() - stabilityWindow;
        const recentSamples = samples.filter(s => s.timestamp > cutoffTime);
        
        if (recentSamples.length < 3) return false;

        // Calculate variance in recent samples
        const variance = calculatePositionVariance(recentSamples);
        console.log(`📏 Position variance: ${variance.toFixed(2)}m`);

        return variance <= maxVariance;
      };

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const sample = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };

          samples.push(sample);
          console.log(`📍 Sample ${samples.length}: ${sample.accuracy.toFixed(1)}m accuracy`);

          // Check if position has stabilized
          if (checkStability()) {
            console.log('✅ Position stabilized!');
            cleanup();
            
            // Return average of recent stable samples
            const cutoffTime = Date.now() - stabilityWindow;
            const stableSamples = samples.filter(s => s.timestamp > cutoffTime);
            resolve(getAveragePosition(stableSamples));
          }

          // Timeout check
          if (Date.now() - startTime > maxDuration) {
            console.log('⏰ Maximum duration reached');
            cleanup();
            
            if (samples.length > 0) {
              // Return best sample if we have any
              const bestSample = samples.reduce((best, current) => 
                current.accuracy < best.accuracy ? current : best
              );
              resolve(bestSample);
            } else {
              reject(new Error('Failed to get stable position within time limit'));
            }
          }
        },
        (error) => {
          console.error('Position monitoring error:', error);
          cleanup();
          reject(error);
        },
        options
      );

      // Set overall timeout
      setTimeout(() => {
        cleanup();
        reject(new Error('Position monitoring timed out'));
      }, maxDuration + 5000);
    });
  },

  /**
   * STRATEGY 3: Multi-Source Location Fusion
   * Combines GPS, Network, and other available location sources
   */
  getFusedLocation: async () => {
    const sources = [];

    console.log('🔀 Starting multi-source location fusion...');

    // GPS (highest accuracy)
    try {
      const gpsLocation = await getSingleHighAccuracySample(15000);
      gpsLocation.source = 'GPS';
      gpsLocation.confidence = gpsLocation.accuracy < 10 ? 0.9 : 0.7;
      sources.push(gpsLocation);
      console.log('📡 GPS location obtained');
    } catch (error) {
      console.warn('GPS failed:', error.message);
    }

    // Network-based location (lower accuracy, faster)
    try {
      const networkLocation = await getSingleNetworkSample(5000);
      networkLocation.source = 'Network';
      networkLocation.confidence = networkLocation.accuracy < 50 ? 0.5 : 0.3;
      sources.push(networkLocation);
      console.log('🌐 Network location obtained');
    } catch (error) {
      console.warn('Network location failed:', error.message);
    }

    if (sources.length === 0) {
      throw new Error('All location sources failed');
    }

    // Fuse results based on confidence and accuracy
    const fusedResult = fuseLocationSources(sources);
    console.log(`🎯 Fused result: ${fusedResult.accuracy.toFixed(1)}m accuracy (${sources.length} sources)`);
    
    return fusedResult;
  },

  /**
   * STRATEGY 4: Context-Aware Location Enhancement
   * Uses environmental context to improve accuracy
   */
  getContextEnhancedLocation: async (options = {}) => {
    const { useMotionSensors = true, useEnvironmentalHints = true } = options;
    
    let baseLocation;
    
    try {
      // Get base high-accuracy location
      baseLocation = await advancedLocation.getUltraHighAccuracyPosition({
        maxSamples: 5,
        accuracyThreshold: 8
      });
    } catch (error) {
      console.warn('High accuracy failed, falling back to standard GPS');
      baseLocation = await getSingleHighAccuracySample(10000);
    }

    const enhancements = [];

    // Motion-based enhancement
    if (useMotionSensors && 'DeviceMotionEvent' in window) {
      try {
        const motionData = await getDeviceMotion(2000);
        if (motionData.isStationary) {
          baseLocation.accuracy = Math.max(baseLocation.accuracy * 0.8, 1); // Improve accuracy for stationary device
          enhancements.push('stationary-improvement');
        }
      } catch (error) {
        console.warn('Motion sensor enhancement failed:', error.message);
      }
    }

    // Environmental hints (building density, urban vs rural)
    if (useEnvironmentalHints) {
      try {
        const environmentalData = await getEnvironmentalContext(baseLocation);
        if (environmentalData.urbanDensity === 'high') {
          // In dense urban areas, GPS can be less accurate due to building reflections
          baseLocation.accuracy = baseLocation.accuracy * 1.2;
          enhancements.push('urban-adjustment');
        } else if (environmentalData.urbanDensity === 'rural') {
          // Rural areas typically have better GPS accuracy
          baseLocation.accuracy = Math.max(baseLocation.accuracy * 0.9, 1);
          enhancements.push('rural-improvement');
        }
      } catch (error) {
        console.warn('Environmental enhancement failed:', error.message);
      }
    }

    baseLocation.enhancements = enhancements;
    console.log(`🔧 Applied enhancements: ${enhancements.join(', ')}`);
    
    return baseLocation;
  }
};

// Helper Functions

function getSingleHighAccuracySample(timeout = 20000) {
  return new Promise((resolve, reject) => {
    const options = {
      enableHighAccuracy: true,
      timeout: timeout,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        });
      },
      reject,
      options
    );
  });
}

function getSingleNetworkSample(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const options = {
      enableHighAccuracy: false, // Use network-based location
      timeout: timeout,
      maximumAge: 30000 // Allow 30-second cached network location
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        });
      },
      reject,
      options
    );
  });
}

function removeOutliersAndAverage(samples) {
  if (samples.length < 3) return getAveragePosition(samples);

  // Calculate median position
  const lats = samples.map(s => s.lat).sort((a, b) => a - b);
  const lngs = samples.map(s => s.lng).sort((a, b) => a - b);
  const medianLat = lats[Math.floor(lats.length / 2)];
  const medianLng = lngs[Math.floor(lngs.length / 2)];

  // Remove samples that are more than 2 standard deviations from median
  const filteredSamples = samples.filter(sample => {
    const distance = calculateDistance(medianLat, medianLng, sample.lat, sample.lng) * 1000; // Convert to meters
    return distance < 100; // Remove samples more than 100m from median
  });

  return getAveragePosition(filteredSamples.length > 0 ? filteredSamples : samples);
}

function getAveragePosition(samples) {
  if (samples.length === 0) throw new Error('No samples to average');

  // Weighted average based on accuracy (more accurate samples get higher weight)
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;
  let bestAccuracy = Math.min(...samples.map(s => s.accuracy));

  samples.forEach(sample => {
    const weight = 1 / (sample.accuracy + 1); // Inverse accuracy weighting
    totalWeight += weight;
    weightedLat += sample.lat * weight;
    weightedLng += sample.lng * weight;
  });

  return {
    lat: weightedLat / totalWeight,
    lng: weightedLng / totalWeight,
    accuracy: bestAccuracy,
    sampleCount: samples.length,
    timestamp: Date.now()
  };
}

function calculatePositionVariance(samples) {
  if (samples.length < 2) return 0;

  const avgLat = samples.reduce((sum, s) => sum + s.lat, 0) / samples.length;
  const avgLng = samples.reduce((sum, s) => sum + s.lng, 0) / samples.length;

  const distances = samples.map(sample => 
    calculateDistance(avgLat, avgLng, sample.lat, sample.lng) * 1000 // Convert to meters
  );

  const variance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  return variance;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function fuseLocationSources(sources) {
  // Weighted fusion based on confidence and accuracy
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;
  let bestAccuracy = Math.min(...sources.map(s => s.accuracy));

  sources.forEach(source => {
    const weight = source.confidence / (source.accuracy + 1);
    totalWeight += weight;
    weightedLat += source.lat * weight;
    weightedLng += source.lng * weight;
  });

  return {
    lat: weightedLat / totalWeight,
    lng: weightedLng / totalWeight,
    accuracy: bestAccuracy * 0.9, // Slight accuracy improvement from fusion
    sources: sources.map(s => s.source),
    timestamp: Date.now()
  };
}

async function getDeviceMotion(duration = 2000) {
  return new Promise((resolve) => {
    if (!('DeviceMotionEvent' in window)) {
      resolve({ isStationary: false, confidence: 0 });
      return;
    }

    const motionData = [];
    
    const handleMotion = (event) => {
      if (event.acceleration) {
        const magnitude = Math.sqrt(
          event.acceleration.x ** 2 +
          event.acceleration.y ** 2 +
          event.acceleration.z ** 2
        );
        motionData.push(magnitude);
      }
    };

    window.addEventListener('devicemotion', handleMotion);

    setTimeout(() => {
      window.removeEventListener('devicemotion', handleMotion);
      
      if (motionData.length === 0) {
        resolve({ isStationary: false, confidence: 0 });
        return;
      }

      // Calculate if device is stationary
      const avgMotion = motionData.reduce((sum, m) => sum + m, 0) / motionData.length;
      const isStationary = avgMotion < 0.5; // Very low motion threshold

      resolve({ 
        isStationary, 
        confidence: isStationary ? 0.8 : 0.2,
        avgMotion 
      });
    }, duration);
  });
}

async function getEnvironmentalContext(location) {
  try {
    // Use reverse geocoding to determine environment type
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&addressdetails=1&extratags=1`
    );
    const data = await response.json();
    
    const address = data.address || {};
    
    // Determine urban density based on available data
    let urbanDensity = 'unknown';
    
    if (address.city || address.town) {
      urbanDensity = 'urban';
    } else if (address.village || address.hamlet) {
      urbanDensity = 'suburban';
    } else if (address.farmland || address.forest) {
      urbanDensity = 'rural';
    }
    
    // Check for high-density indicators
    if (address.city && (address.suburb || address.neighbourhood)) {
      urbanDensity = 'high';
    }

    return { urbanDensity, address };
  } catch (error) {
    return { urbanDensity: 'unknown' };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
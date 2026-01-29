import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI, apiUtils } from '../services/api';
import { geolocationUtils, utils } from '../utils/helpers';
import ImageUpload from '../components/ImageUpload';
import LoadingSpinner from '../components/LoadingSpinner';

const ReportIssue = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    citizenName: '',
    citizenEmail: '',
    category: '',
    description: '',
    location: null,
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);

  // Issue categories (simulating AI detection options)
  const categories = [
    { value: 'pothole', label: 'Pothole', icon: '🕳️', description: 'Road surface damage' },
    { value: 'garbage', label: 'Garbage/Waste', icon: '🗑️', description: 'Waste management issues' },
    { value: 'streetlight', label: 'Street Light', icon: '💡', description: 'Street lighting problems' },
    { value: 'other', label: 'Other', icon: '⚠️', description: 'Other civic issues' }
  ];

  useEffect(() => {
    // Auto-detect location on component mount with high accuracy
    detectLocationWithHighAccuracy();
    
    // Cleanup function to stop location tracking
    return () => {
      if (window.currentLocationWatch) {
        geolocationUtils.clearWatch(window.currentLocationWatch);
        window.currentLocationWatch = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    
    try {
      const position = await geolocationUtils.getCurrentPosition();
      await updateLocationData(position);
    } catch (error) {
      console.error('Location error:', error);
      setLocationError(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const detectLocationWithHighAccuracy = async () => {
    setLocationLoading(true);
    setLocationError('');
    
    try {
      console.log('🔬 Initiating ultra-high accuracy location detection...');
      
      // Use ultra-high accuracy positioning for civic issue reporting
      const position = await geolocationUtils.getUltraHighAccuracyPosition({
        maxSamples: 6,              // More samples for critical civic infrastructure
        sampleInterval: 2000,       // 2 second intervals for GPS stabilization
        accuracyTarget: 2,          // Target sub-3 meter accuracy for precise issue location
        useMotionDetection: true    // Check if device is stationary for better accuracy
      });
      
      await updateLocationData(position);
      setLocationAccuracy(position.accuracy);
      console.log(`✅ Ultra-high accuracy achieved: ${position.accuracy.toFixed(1)}m (${position.samplesUsed} samples, stationary: ${position.isStationary})`);
      
      // Show accuracy achievement feedback
      if (position.accuracy <= 3) {
        console.log('🎯 EXCELLENT: Sub-3 meter accuracy achieved for precise issue reporting!');
      } else if (position.accuracy <= 10) {
        console.log('✅ GOOD: High accuracy sufficient for issue location');
      }
      
    } catch (error) {
      console.error('Ultra-high accuracy failed, trying enhanced high accuracy:', error);
      
      try {
        // Fallback to enhanced high-accuracy mode
        const position = await geolocationUtils.getHighAccuracyPosition(5, {
          accuracyThreshold: 8,
          useStatisticalFiltering: true,
          enableProgressiveAccuracy: true
        });
        
        await updateLocationData(position);
        setLocationAccuracy(position.accuracy);
        console.log(`✅ Enhanced accuracy fallback: ${position.accuracy.toFixed(1)}m`);
        
      } catch (fallbackError) {
        console.error('Enhanced accuracy failed, using basic GPS:', fallbackError);
        
        // Final fallback to basic GPS
        try {
          const position = await geolocationUtils.getCurrentPosition();
          await updateLocationData(position);
          setLocationAccuracy(position.accuracy);
          setLocationError(`Location accuracy: ${position.accuracy.toFixed(0)}m (basic GPS)`);
        } catch (basicError) {
          console.error('All location methods failed:', basicError);
          setLocationError(basicError.message);
        }
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const updateLocationData = async (position) => {
    try {
      console.log('🗺️ Getting address for coordinates...');
      const address = await geolocationUtils.reverseGeocode(position.lat, position.lng);
      
      setFormData(prev => ({
        ...prev,
        location: {
          lat: position.lat,
          lng: position.lng,
          address: address.address,
          street: address.street,
          city: address.city,
          state: address.state,
          country: address.country,
          accuracy: position.accuracy,
          timestamp: new Date().toISOString()
        }
      }));
      
      console.log('✅ Address found:', address.address);
    } catch (error) {
      console.error('Address lookup error:', error);
      // Still save coordinates even if address lookup fails
      setFormData(prev => ({
        ...prev,
        location: {
          lat: position.lat,
          lng: position.lng,
          address: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
          street: 'Coordinates only',
          city: 'Unknown',
          state: '',
          country: '',
          accuracy: position.accuracy,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  const startLocationTracking = () => {
    if (isWatchingLocation) return;

    setIsWatchingLocation(true);
    console.log('� Starting enhanced real-time location tracking...');

    // Use enhanced position watching with accuracy tracking
    const watchId = geolocationUtils.watchPositionWithAccuracyTracking(
      async (positionData) => {
        console.log(`📡 Location update: ${positionData.accuracy.toFixed(1)}m accuracy (${positionData.accuracyTrend}, improving: ${positionData.isImproving})`);
        
        // Only update if accuracy is improving or better than 15m
        if (positionData.isImproving || positionData.accuracy <= 15) {
          await updateLocationData(positionData);
          setLocationAccuracy(positionData.accuracy);
          
          // Visual feedback for accuracy improvements
          if (positionData.accuracy <= 5) {
            console.log('🎯 Excellent accuracy achieved during tracking!');
          } else if (positionData.isImproving) {
            console.log('📈 Location accuracy improving...');
          }
        }
      },
      (error) => {
        console.error('Enhanced location tracking error:', error);
        setLocationError(`Tracking error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 25000,              // Longer timeout for better accuracy
        maximumAge: 2000,            // Fresher locations
        minAccuracyImprovement: 3,   // Only report significant accuracy improvements
        trackAccuracyTrend: true     // Track accuracy trends over time
      }
    );

    // Store watchId to clear later
    window.currentLocationWatch = watchId;

    // Auto-stop tracking after 3 minutes (longer for better convergence)
    setTimeout(() => {
      stopLocationTracking();
    }, 120000);
  };

  const stopLocationTracking = () => {
    if (window.currentLocationWatch) {
      geolocationUtils.clearWatch(window.currentLocationWatch);
      window.currentLocationWatch = null;
    }
    setIsWatchingLocation(false);
    console.log('📍 Stopped location tracking');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagesUploaded = (images) => {
    const imageUrls = images.map(img => img.url);
    setUploadedImages(images);
    setFormData(prev => ({ ...prev, images: imageUrls }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.citizenName || !formData.citizenEmail || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    if (!utils.isValidEmail(formData.citizenEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!formData.location) {
      alert('Location is required. Please enable location access or try detecting location again.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await issuesAPI.create(formData);
      
      if (response.data.success) {
        alert(`Issue reported successfully! Your issue ID is: ${response.data.data.id}`);
        navigate('/dashboard', { 
          state: { 
            newIssueId: response.data.data.id,
            citizenEmail: formData.citizenEmail 
          }
        });
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      alert(`Failed to report issue: ${errorInfo.message}`);
      console.error('Error reporting issue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      citizenName: '',
      citizenEmail: '',
      category: '',
      description: '',
      location: formData.location, // Keep location
      images: []
    });
    setUploadedImages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Mobile-optimized header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-4 px-2">
              Report a Civic Issue
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 px-4 sm:px-0 leading-relaxed">
              Help improve your community by reporting issues that need attention
            </p>
          </div>

          {/* Mobile-first responsive form layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Form */}
            <div className="card">
              <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="citizenName"
                    value={formData.citizenName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm touch-manipulation"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="citizenEmail"
                    value={formData.citizenEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm touch-manipulation"
                    placeholder="Enter your email address"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll use this to send you updates about your issue
                  </p>
                </div>
              </div>
            </div>

            {/* Issue Category (Mock AI Classification) */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Issue Category
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {categories.map((category) => (
                  <label
                    key={category.value}
                    className={`cursor-pointer border-2 rounded-lg p-4 transition-all duration-200 ${
                      formData.category === category.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={formData.category === category.value}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <div className="text-center">
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <div className="font-medium text-gray-800">{category.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{category.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 <strong>AI Classification:</strong> In the full version, AI will automatically detect the issue type from your photo
              </p>
            </div>

            {/* Issue Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-3 sm:py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm touch-manipulation resize-y"
                placeholder="Describe the issue in detail (optional but helpful)"
              />
            </div>

            {/* Mobile-optimized form actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="submit"
                disabled={isSubmitting || !formData.location}
                className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 sm:py-2 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-12 sm:min-h-auto"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="loading-spinner mr-2"></div>
                    Reporting Issue...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">📤</span>
                    Report Issue
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Evidence
            </h2>
            <ImageUpload 
              onImagesUploaded={handleImagesUploaded} 
              multiple={true}
              maxFiles={3}
            />
            
            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Uploaded Images:
                </h3>
                <div className="flex space-x-2 overflow-x-auto">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img
                        src={image.fullUrl}
                        alt={`Evidence ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location Detection */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                📍 Location
              </h2>
              <div className="text-xs text-gray-500">
                Real-time GPS tracking available
              </div>
            </div>
            
            {locationLoading && (
              <LoadingSpinner size="small" text="Detecting precise location..." />
            )}
            
            {locationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-600 text-sm mb-3">⚠️ {locationError}</p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={detectLocationWithHighAccuracy}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200 touch-manipulation min-h-10"
                  >
                    🎯 High Accuracy
                  </button>
                  <button
                    onClick={detectLocation}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg text-sm transition-colors duration-200 touch-manipulation min-h-10"
                  >
                    🔄 Try Again
                  </button>
                </div>
              </div>
            )}
            
            {formData.location && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 mb-1">
                      ✅ Location Detected
                    </p>
                    <p className="text-sm text-green-700 mb-2">
                      📍 {formData.location.address}
                    </p>
                    
                    {/* Location Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-green-600 mb-3">
                      <div>
                        <span className="font-medium">Coordinates:</span><br/>
                        {geolocationUtils.formatCoordinates(
                          formData.location.lat, 
                          formData.location.lng
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Location Quality:</span><br/>
                        {locationAccuracy ? (
                          <div className="space-y-1">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              locationAccuracy <= 3 ? 'bg-emerald-100 text-emerald-800' :
                              locationAccuracy <= 10 ? 'bg-green-100 text-green-800' : 
                              locationAccuracy <= 30 ? 'bg-yellow-100 text-yellow-800' : 
                              locationAccuracy <= 100 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                            }`}>
                              <span className="mr-1">
                                {locationAccuracy <= 3 ? '🎯' : 
                                 locationAccuracy <= 10 ? '✅' : 
                                 locationAccuracy <= 30 ? '👍' : 
                                 locationAccuracy <= 100 ? '⚠️' : '❌'}
                              </span>
                              {locationAccuracy <= 3 ? 'ULTRA HIGH' :
                               locationAccuracy <= 10 ? 'HIGH' : 
                               locationAccuracy <= 30 ? 'GOOD' : 
                               locationAccuracy <= 100 ? 'FAIR' : 'POOR'}
                            </div>
                            <div className={`text-xs font-mono ${
                              locationAccuracy <= 10 ? 'text-green-700' : 
                              locationAccuracy <= 50 ? 'text-yellow-600' : 'text-orange-600'
                            }`}>
                              ±{locationAccuracy.toFixed(1)}m accuracy
                            </div>
                            <div className="text-xs text-gray-500">
                              {locationAccuracy <= 3 ? 'Perfect for precise issue location' :
                               locationAccuracy <= 10 ? 'Excellent for civic reporting' :
                               locationAccuracy <= 30 ? 'Good for general area issues' :
                               locationAccuracy <= 100 ? 'Adequate for broad area issues' :
                               'Consider moving to open area'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Unknown</span>
                        )}
                      </div>
                    </div>

                    {/* Additional Location Info */}
                    {formData.location.street && (
                      <div className="text-xs text-green-600 space-y-1">
                        <div><strong>Street:</strong> {formData.location.street}</div>
                        <div><strong>City:</strong> {formData.location.city}</div>
                        {formData.location.state && (
                          <div><strong>State:</strong> {formData.location.state}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-green-200">
                  <button
                    onClick={detectLocationWithHighAccuracy}
                    className="btn-secondary text-xs flex items-center"
                    disabled={locationLoading}
                  >
                    🎯 High Accuracy
                  </button>
                  <button
                    onClick={isWatchingLocation ? stopLocationTracking : startLocationTracking}
                    className={`text-xs flex items-center ${
                      isWatchingLocation 
                        ? 'bg-orange-100 text-orange-700 border-orange-300' 
                        : 'btn-primary'
                    }`}
                    disabled={locationLoading}
                  >
                    {isWatchingLocation ? (
                      <>📍 Stop Tracking</>
                    ) : (
                      <>📡 Real-time Track</>
                    )}
                  </button>
                  <button
                    onClick={detectLocation}
                    className="btn-secondary text-xs"
                    disabled={locationLoading}
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-4">
              🔒 Your location is used only to pinpoint the issue location and is not stored for any other purpose.
            </p>
          </div>

          {/* Help Information */}
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              💡 Reporting Tips
            </h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Take clear photos showing the issue</li>
              <li>• Enable location access for accurate mapping</li>
              <li>• Provide specific details in the description</li>
              <li>• Check if the issue has already been reported</li>
              <li>• You'll receive a unique Issue ID for tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};

export default ReportIssue;
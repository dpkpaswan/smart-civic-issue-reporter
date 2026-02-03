import React, { useState } from 'react';
import { MapPin, Navigation, RefreshCw, AlertTriangle, CheckCircle, AlertCircle, Wifi, Zap, Smartphone } from 'lucide-react';
import useAccurateLocationDetection from '../../../hooks/useAccurateLocationDetection';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { toast } from '../../../utils/toast';

const FreeLocationPicker = ({ 
  location, 
  onLocationChange, 
  className = "",
  required = true 
}) => {
  const [manualAddress, setManualAddress] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Enhanced mobile detection
  const isMobile = typeof window !== 'undefined' && 
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
     window.innerWidth <= 768);

  // Use free location detection hook with mobile optimizations
  const {
    location: detectedLocation,
    accuracy,
    isDetecting,
    isGeocoding,
    error,
    addressDetails,
    isAccuracyAcceptable,
    accuracyStatus,
    detectLocation,
    retryDetection
  } = useAccurateLocationDetection({
    enableAutoDetection: true,
    accuracyThreshold: isMobile ? 75 : 50, // More lenient for mobile
    maxRetries: 5 // More retries for mobile
  });

  // Update parent component when location changes
  React.useEffect(() => {
    if (detectedLocation && onLocationChange) {
      onLocationChange(detectedLocation);
    }
  }, [detectedLocation, onLocationChange]);

  // Handle manual address submission
  const handleManualSubmit = () => {
    if (!manualAddress.trim()) {
      toast.error('Please enter a valid address');
      return;
    }

    const manualLocation = {
      coordinates: null,
      accuracy: null,
      address: manualAddress.trim(),
      addressSource: 'manual',
      timestamp: new Date().toISOString(),
      source: 'manual',
      addressDetails: {
        formattedAddress: manualAddress.trim(),
        streetAddress: manualAddress.trim(),
        manualEntry: true
      }
    };

    console.log('📝 Manual address entered:', manualLocation);
    onLocationChange?.(manualLocation);
    setShowManualEntry(false);
    setManualAddress('');
    toast.success('Address added successfully!');
  };

  // Get accuracy display info
  const getAccuracyDisplay = () => {
    if (!accuracy || !accuracyStatus) return null;

    const { quality, color, icon } = accuracyStatus;
    const IconComponent = icon === 'CheckCircle' ? CheckCircle : 
                         icon === 'AlertTriangle' ? AlertTriangle : AlertCircle;

    return {
      icon: IconComponent,
      text: `±${Math.round(accuracy)} meters`,
      quality: quality.charAt(0).toUpperCase() + quality.slice(1),
      color: color === 'success' ? 'text-green-600' : 
             color === 'warning' ? 'text-yellow-600' : 'text-red-600'
    };
  };

  const accuracyDisplay = getAccuracyDisplay();

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      {/* Mobile-optimized Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold">📍 Location Detection</h3>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>100% Free</span>
          </div>
          {isMobile && (
            <div className="flex items-center gap-1 text-blue-600">
              <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Mobile Optimized</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-friendly Detection Status */}
      {isDetecting && (
        <div className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <RefreshCw className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm sm:text-base text-blue-800 font-medium">📱 Detecting your location...</p>
            <p className="text-xs sm:text-sm text-blue-600 mt-1">
              {isMobile ? 'Using mobile GPS for high accuracy' : 'Using high-accuracy GPS detection'}
            </p>
            {isMobile && (
              <p className="text-xs text-blue-500 mt-1">
                💡 For best results, ensure location services are enabled
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mobile-optimized Geocoding Status */}
      {isGeocoding && (
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <RefreshCw className="h-4 w-4 text-green-600 animate-spin flex-shrink-0" />
          <p className="text-xs sm:text-sm text-green-700">Getting address information...</p>
        </div>
      )}

      {/* Mobile-optimized Error Display */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base text-red-800 font-medium break-words">
                {error.message}
              </h4>
              <p className="text-xs sm:text-sm text-red-700 mt-1 break-words">
                {error.instructions}
              </p>
              
              {/* Mobile-specific location help */}
              {isMobile && error.type === 'PERMISSION_DENIED' && (
                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-600">
                  <p className="font-medium">📱 Mobile Help:</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Check browser settings → Location permissions</li>
                    <li>Enable device location services</li>
                    <li>Try refreshing the page after enabling</li>
                  </ul>
                </div>
              )}
              
              {error.type !== 'PERMISSION_DENIED' && (
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Button
                    onClick={retryDetection}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 flex-1 sm:flex-none touch-manipulation"
                    disabled={isDetecting}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => setShowManualEntry(true)}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm px-3 sm:px-4 py-2 flex-1 sm:flex-none touch-manipulation"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Enter Manually
                  </Button>
                </div>
              )}
              
              {error.type === 'PERMISSION_DENIED' && (
                <Button
                  onClick={() => setShowManualEntry(true)}
                  variant="outline"
                  className="mt-3 border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm px-3 sm:px-4 py-2 w-full sm:w-auto touch-manipulation"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Enter Address Manually
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Address Confirmation */}
      {location && location.addressSource === 'manual' && (
        <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <span className="text-sm sm:text-base text-blue-800 font-medium">📝 Manual Address Entered</span>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full text-xs w-fit">
                  <MapPin className="h-3 w-3" />
                  <span>Manual Entry</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-blue-700 leading-relaxed break-words">
                {location.address}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={() => setShowManualEntry(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 text-xs px-3 py-2 touch-manipulation"
            >
              Edit Address
            </Button>
          </div>
        </div>
      )}

      {/* Mobile-optimized Location Information */}
      {detectedLocation && (
        <div className="space-y-3">
          {/* Main Address Display */}
          <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <span className="text-sm sm:text-base text-green-800 font-medium">✅ Location Detected</span>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full text-xs w-fit">
                    <Wifi className="h-3 w-3" />
                    <span>OpenStreetMap</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-green-700 leading-relaxed break-words">
                  {detectedLocation.address}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile-optimized Accuracy Information */}
          {accuracyDisplay && (
            <div className={`p-3 rounded-lg ${
              accuracyDisplay.color.includes('green') ? 'bg-green-50 border-green-200' :
              accuracyDisplay.color.includes('yellow') ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            } border`}>
              <div className="flex items-center gap-2 flex-wrap">
                <accuracyDisplay.icon className={`h-4 w-4 ${accuracyDisplay.color} flex-shrink-0`} />
                <span className={`text-xs sm:text-sm font-medium ${accuracyDisplay.color}`}>
                  {accuracyDisplay.quality} Accuracy: {accuracyDisplay.text}
                </span>
              </div>
              {!isAccuracyAcceptable && (
                <p className="text-xs text-gray-600 mt-2">
                  For civic reporting, accuracy better than {isMobile ? '75' : '50'} meters is recommended.
                </p>
              )}
            </div>
          )}

          {/* Mobile-optimized Address Components */}
          {addressDetails && !addressDetails.coordinatesOnly && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-xs sm:text-sm text-gray-800 font-medium mb-2">📍 Address Details:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                {addressDetails.streetAddress && (
                  <div className="break-words">
                    <span className="text-gray-600">Street:</span>
                    <p className="text-gray-800">{addressDetails.streetAddress}</p>
                  </div>
                )}
                {addressDetails.area && (
                  <div className="break-words">
                    <span className="text-gray-600">Area:</span>
                    <p className="text-gray-800">{addressDetails.area}</p>
                  </div>
                )}
                {addressDetails.city && (
                  <div className="break-words">
                    <span className="text-gray-600">City:</span>
                    <p className="text-gray-800">{addressDetails.city}</p>
                  </div>
                )}
                {addressDetails.state && (
                  <div className="break-words">
                    <span className="text-gray-600">State:</span>
                    <p className="text-gray-800">{addressDetails.state}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile-optimized Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            {!isAccuracyAcceptable && accuracy > (isMobile ? 75 : 50) && (
              <Button
                onClick={retryDetection}
                className="bg-orange-600 hover:bg-orange-700 text-white flex-1 text-sm py-3 sm:py-2 touch-manipulation"
                disabled={isDetecting}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isDetecting ? 'animate-spin' : ''}`} />
                Try for Better Accuracy
              </Button>
            )}
            <Button
              onClick={detectLocation}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 text-sm py-3 sm:py-2 touch-manipulation"
              disabled={isDetecting}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Re-detect Location
            </Button>
          </div>
        </div>
      )}

      {/* Mobile-optimized Manual Entry Section */}
      <div className="border-t pt-3 sm:pt-4">
        {!showManualEntry ? (
          <div className="space-y-2">
            <Button
              onClick={() => setShowManualEntry(true)}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 text-sm py-3 sm:py-2 touch-manipulation"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Enter Address Manually
            </Button>
            {!location && !isDetecting && (
              <p className="text-xs text-gray-500 text-center">
                Can't detect your location? Enter your address manually to continue
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">Manual Address Entry</span>
            </div>
            <Input
              placeholder={isMobile ? "Enter your address..." : "Enter your address (e.g., 123 Main St, City, State)"}
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              className="text-sm w-full"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleManualSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 text-sm py-3 sm:py-2 touch-manipulation"
                disabled={!manualAddress.trim()}
              >
                Use This Address
              </Button>
              <Button
                onClick={() => {
                  setShowManualEntry(false);
                  setManualAddress('');
                }}
                variant="outline"
                className="border-gray-300 text-gray-700 text-sm py-3 sm:py-2 touch-manipulation"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile help tip */}
      {isMobile && !detectedLocation && !isDetecting && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-700">
          <div className="flex items-start gap-2">
            <Smartphone className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">📱 Mobile Tips:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Move outdoors for better GPS accuracy</li>
                <li>Ensure location services are enabled</li>
                <li>Grant location permission when prompted</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeLocationPicker;
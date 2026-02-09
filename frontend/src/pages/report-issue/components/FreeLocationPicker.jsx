import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, RefreshCw, AlertCircle, CheckCircle, Search, X, Loader2 } from 'lucide-react';
import useAccurateLocationDetection from '../../../hooks/useAccurateLocationDetection';
import Button from '../../../components/ui/Button';
import LocationMap from '../../../components/LocationMap';
import { toast } from '../../../utils/toast';

/**
 * Geocode an address string using OpenStreetMap Nominatim (free, no key).
 * Returns { lat, lng, displayName } or null.
 */
async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(item => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    displayName: item.display_name,
    details: item.address || {}
  }));
}

const FreeLocationPicker = ({
  location,
  onLocationChange,
  className = "",
  required = true
}) => {
  const { t } = useTranslation();
  const [manualAddress, setManualAddress] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isGeocoding, setIsGeocodingLocal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMode, setActiveMode] = useState('auto'); // 'auto' | 'manual'
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const isMobile = typeof window !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768);

  const {
    location: detectedLocation,
    accuracy,
    isDetecting,
    error,
    addressDetails,
    isAccuracyAcceptable,
    accuracyStatus,
    detectLocation,
    retryDetection
  } = useAccurateLocationDetection({
    enableAutoDetection: true,
    accuracyThreshold: isMobile ? 75 : 50000,
    maxRetries: 5
  });

  // Push detected location to parent
  useEffect(() => {
    if (detectedLocation && onLocationChange) {
      onLocationChange(detectedLocation);
    }
  }, [detectedLocation, onLocationChange]);

  // Auto-switch to manual entry when detection fails
  useEffect(() => {
    if (error && !detectedLocation) {
      setShowManualEntry(true);
      setActiveMode('manual');
    }
  }, [error, detectedLocation]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced geocoding as user types
  const handleAddressInput = useCallback((value) => {
    setManualAddress(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsGeocodingLocal(true);
      try {
        const results = await geocodeAddress(value.trim());
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsGeocodingLocal(false);
      }
    }, 400);
  }, []);

  // User picks a suggestion
  const handleSelectSuggestion = (item) => {
    const manualLocation = {
      coordinates: { latitude: item.lat, longitude: item.lng },
      accuracy: null,
      address: item.displayName,
      addressSource: 'manual',
      timestamp: new Date().toISOString(),
      source: 'manual_geocoded',
      addressDetails: {
        formattedAddress: item.displayName,
        streetAddress: [item.details.road, item.details.house_number].filter(Boolean).join(' ') || '',
        area: item.details.suburb || item.details.neighbourhood || '',
        city: item.details.city || item.details.town || item.details.village || '',
        state: item.details.state || '',
        manualEntry: true,
        geocoded: true
      }
    };
    onLocationChange?.(manualLocation);
    setManualAddress(item.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    toast.success(t('location.locationSetFromAddress'));
  };

  // Switch to manual mode
  const switchToManual = () => {
    setShowManualEntry(true);
    setActiveMode('manual');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Switch back to auto
  const switchToAuto = () => {
    setShowManualEntry(false);
    setActiveMode('auto');
    setManualAddress('');
    setSuggestions([]);
    detectLocation();
  };

  // Accuracy badge
  const accuracyBadge = (() => {
    if (!accuracy || !accuracyStatus) return null;
    const { quality, color } = accuracyStatus;
    const colorMap = { success: 'bg-green-100 text-green-700', warning: 'bg-amber-100 text-amber-700', error: 'bg-red-100 text-red-700' };
    return { label: `${quality} · ±${Math.round(accuracy)}m`, cls: colorMap[color] || colorMap.warning };
  })();

  const hasCoords = location?.coordinates?.latitude && location?.coordinates?.longitude;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('location.title')}</h3>
            <p className="text-xs text-gray-500">
              {activeMode === 'auto' ? t('location.autoDetecting') : t('location.searchAddress')}
            </p>
          </div>
        </div>

        {/* Mode toggle pills */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          <button
            type="button"
            onClick={switchToAuto}
            className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${activeMode === 'auto' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <Navigation className="h-3 w-3" /> {t('location.auto')}
          </button>
          <button
            type="button"
            onClick={switchToManual}
            className={`px-3 py-1.5 flex items-center gap-1 transition-colors ${activeMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <Search className="h-3 w-3" /> {t('location.manual')}
          </button>
        </div>
      </div>

      {/* ── AUTO DETECTION MODE ── */}
      {activeMode === 'auto' && (
        <div className="space-y-3 animate-fade-in">
          {/* Detecting spinner */}
          {isDetecting && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-700">{t('location.detecting')}</span>
            </div>
          )}

          {/* Error */}
          {error && !isDetecting && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="text-red-700 font-medium">{error.message}</p>
                  <p className="text-red-500 text-xs mt-0.5">{error.instructions}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={retryDetection} disabled={isDetecting} className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5">
                  <RefreshCw className="h-3 w-3 mr-1" /> {t('location.retry')}
                </Button>
                <Button onClick={switchToManual} variant="outline" className="border-gray-300 text-gray-700 text-xs px-3 py-1.5">
                  <Search className="h-3 w-3 mr-1" /> {t('location.searchBtn')}
                </Button>
              </div>
            </div>
          )}

          {/* Detected location card */}
          {detectedLocation && !isDetecting && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-green-800">{t('location.detected')}</span>
                    {accuracyBadge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${accuracyBadge.cls}`}>
                        {accuracyBadge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-green-700 mt-1 break-words leading-relaxed">
                    {detectedLocation.address}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={retryDetection} disabled={isDetecting} className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1">
                  <RefreshCw className={`h-3 w-3 ${isDetecting ? 'animate-spin' : ''}`} /> {t('location.reDetect')}
                </button>
                <button type="button" onClick={switchToManual} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Search className="h-3 w-3" /> {t('location.editAddress')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL / SEARCH MODE ── */}
      {activeMode === 'manual' && (
        <div className="space-y-2 animate-fade-in" ref={wrapperRef}>
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder={t('location.typeAddress')}
              value={manualAddress}
              onChange={(e) => handleAddressInput(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-gray-400"
            />
            {isGeocoding && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
            )}
            {!isGeocoding && manualAddress && (
              <button
                type="button"
                onClick={() => { setManualAddress(''); setSuggestions([]); setShowSuggestions(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto divide-y divide-gray-100 animate-fade-in">
              {suggestions.map((item, i) => (
                <li
                  key={i}
                  onClick={() => handleSelectSuggestion(item)}
                  className="flex items-start gap-2 px-3 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 leading-snug line-clamp-2">{item.displayName}</span>
                </li>
              ))}
            </ul>
          )}

          {/* No results */}
          {showSuggestions && suggestions.length === 0 && manualAddress.trim().length >= 3 && !isGeocoding && (
            <p className="text-xs text-gray-500 px-1">{t('location.noResults')}</p>
          )}

          {/* Currently selected manual location */}
          {location && location.source === 'manual_geocoded' && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 leading-snug break-words">
                <span className="font-medium">{t('location.selected')}</span>
                {location.address}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MAP (shown whenever we have coordinates) ── */}
      {hasCoords && (
        <div className="animate-fade-in">
          <LocationMap
            latitude={location.coordinates.latitude}
            longitude={location.coordinates.longitude}
            accuracy={location.source === 'manual_geocoded' ? null : accuracy}
            address={location.address}
          />
        </div>
      )}

      {/* Address details grid */}
      {(addressDetails && !addressDetails.coordinatesOnly) || (location?.addressDetails?.geocoded) ? (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-1.5">{t('location.addressDetails')}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {(addressDetails?.streetAddress || location?.addressDetails?.streetAddress) && (
              <div><span className="text-gray-500">{t('location.street')}</span> <span className="text-gray-800">{addressDetails?.streetAddress || location?.addressDetails?.streetAddress}</span></div>
            )}
            {(addressDetails?.area || location?.addressDetails?.area) && (
              <div><span className="text-gray-500">{t('location.area')}</span> <span className="text-gray-800">{addressDetails?.area || location?.addressDetails?.area}</span></div>
            )}
            {(addressDetails?.city || location?.addressDetails?.city) && (
              <div><span className="text-gray-500">{t('location.city')}</span> <span className="text-gray-800">{addressDetails?.city || location?.addressDetails?.city}</span></div>
            )}
            {(addressDetails?.state || location?.addressDetails?.state) && (
              <div><span className="text-gray-500">{t('location.state')}</span> <span className="text-gray-800">{addressDetails?.state || location?.addressDetails?.state}</span></div>
            )}
          </div>
        </div>
      ) : null}

      {/* Empty state — no location yet */}
      {!location && !isDetecting && !error && activeMode === 'auto' && (
        <div className="text-center py-6 text-gray-400">
          <Navigation className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('location.waitingForLocation')}</p>
        </div>
      )}
    </div>
  );
};

export default FreeLocationPicker;
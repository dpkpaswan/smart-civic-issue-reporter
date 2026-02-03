# Google Maps High-Accuracy Location Integration

## Overview

The Smart Civic Issue Reporter now features production-grade location detection using:
- **Browser Geolocation API** for high-accuracy GPS coordinates
- **Google Maps Geocoding API** for detailed address information
- **Advanced accuracy validation** for civic reporting requirements

## Features

### ✅ High-Accuracy GPS Detection
- `enableHighAccuracy: true` - Uses GPS, Wi-Fi, and cellular triangulation
- `timeout: 15000ms` - 15-second detection timeout
- `maximumAge: 0` - Always fresh GPS readings (no cached positions)

### ✅ Google Maps Geocoding
- Converts GPS coordinates to human-readable addresses
- Provides detailed address components:
  - Street number and name
  - Area/neighborhood
  - City, state, postal code
  - Country information

### ✅ Accuracy Validation
- **Excellent:** ≤10 meters
- **Good:** ≤25 meters  
- **Fair:** ≤50 meters (with warning)
- **Poor:** >50 meters (requires retry for civic reporting)

### ✅ Professional UX
- Auto-detection on page load
- Real-time accuracy monitoring
- Retry logic with exponential backoff
- Comprehensive error handling
- Manual address entry fallback

## Setup Instructions

### 1. Google Maps API Configuration

1. **Get Google Cloud API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new project or select existing one
   - Enable required APIs:
     - **Geocoding API** (for coordinate → address conversion)
     - **Maps JavaScript API** (for embedded maps display)

2. **Create API Key:**
   ```bash
   # In Google Cloud Console:
   # APIs & Services → Credentials → Create Credentials → API Key
   # Restrict the key to your domain in production
   ```

3. **Environment Configuration:**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   
   # Add your Google Maps API key (Vite automatically loads REACT_APP_ prefixed variables)
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyC4R6AN7SmxxxxxxxxxxxxxxxxxxXXXX
   ```

### 2. API Key Security

#### Development Environment:
```javascript
// .env (development)
REACT_APP_GOOGLE_MAPS_API_KEY=your_development_api_key
```

#### Production Environment:
- **Never commit API keys to version control**
- Use environment variables in production deployment
- Restrict API key usage by:
  - HTTP referrers (for web apps)
  - IP addresses (for servers)
  - Specific APIs only

#### Example API Key Restrictions:
```
HTTP referrers: 
- https://yourdomain.com/*
- https://*.yourdomain.com/*

API restrictions:
- Geocoding API
- Maps JavaScript API
```

## Code Implementation

### Location Hook Usage

```javascript
import { useGoogleHighAccuracyLocation } from '../hooks/useGoogleHighAccuracyLocation';

const MyComponent = () => {
  const {
    location,           // Complete location data
    accuracy,           // GPS accuracy in meters
    isDetecting,        // Loading state
    isGeocoding,        // Address resolution state
    error,              // Error information
    addressDetails,     // Detailed address components
    isAccuracyAcceptable, // Boolean: accuracy ≤ 50m
    detectLocation,     // Manual detection function
    retryDetection      // Retry with better accuracy
  } = useGoogleHighAccuracyLocation({
    enableAutoDetection: true,
    accuracyThreshold: 50,
    maxRetries: 3
  });

  return (
    <div>
      {location && (
        <div>
          <p>Address: {location.address}</p>
          <p>Accuracy: ±{accuracy} meters</p>
          {addressDetails && (
            <div>
              <p>Street: {addressDetails.streetAddress}</p>
              <p>Area: {addressDetails.area}</p>
              <p>City: {addressDetails.city}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Component Integration

```javascript
import GoogleLocationPicker from './components/GoogleLocationPicker';

const ReportIssuePage = () => {
  const [location, setLocation] = useState(null);

  return (
    <GoogleLocationPicker
      location={location}
      onLocationChange={setLocation}
    />
  );
};
```

## Data Structure

### Location Object
```javascript
{
  // GPS Coordinates
  coordinates: {
    latitude: 40.7128,
    longitude: -74.0060
  },
  
  // Accuracy Information
  accuracy: 12,                    // meters
  accuracyStatus: {
    quality: 'good',               // excellent|good|fair|poor
    color: 'success',              // success|warning|destructive
    icon: 'CheckCircle'
  },
  
  // Address Information
  address: "123 Main St, New York, NY 10001",
  addressSource: 'google_maps',    // google_maps|coordinates|manual
  
  // Detailed Address Components (from Google Maps)
  addressDetails: {
    formattedAddress: "123 Main St, New York, NY 10001, USA",
    streetAddress: "123 Main St",
    area: "Manhattan",
    city: "New York", 
    state: "New York",
    postalCode: "10001",
    country: "United States",
    placeId: "ChIJ....."         // Google Places ID
  },
  
  // Metadata
  timestamp: "2026-02-03T10:30:00.000Z",
  source: 'gps'                   // gps|manual
}
```

## Error Handling

### Permission Errors
```javascript
{
  type: 'PERMISSION_DENIED',
  message: 'Location access denied',
  instructions: 'Please enable location permissions and refresh'
}
```

### Accuracy Issues
```javascript
{
  type: 'ACCURACY_WARNING', 
  message: 'GPS accuracy is 75 meters',
  instructions: 'Move to an area with better GPS reception'
}
```

### API Configuration Errors
```javascript
{
  type: 'API_KEY_MISSING',
  message: 'Google Maps API key not configured',
  instructions: 'Add REACT_APP_GOOGLE_MAPS_API_KEY to environment'
}
```

## Performance Considerations

### Caching Strategy
- **GPS Detection:** No caching (always fresh for accuracy)
- **Geocoding:** Results cached in component state
- **API Calls:** Automatic retry with exponential backoff

### Timeout Configuration
- **GPS Detection:** 15 seconds
- **Geocoding:** 5 seconds with AbortController
- **Total Process:** ~20 seconds maximum

### Fallback Strategy
1. **Primary:** GPS + Google Maps geocoding
2. **Fallback 1:** GPS coordinates only (if geocoding fails)
3. **Fallback 2:** Manual address entry
4. **Last Resort:** Block submission with clear instructions

## Testing

### Development Testing
```bash
# Test with different accuracy scenarios
# Move indoors (low accuracy) vs outdoors (high accuracy)
# Test with/without API key
# Test permission denied scenarios
```

### Production Validation
```bash
# Verify API key restrictions work
# Test with real civic issue locations
# Validate address accuracy in target regions
# Monitor API usage and costs
```

## Cost Management

### Google Maps API Pricing
- **Geocoding API:** $5 per 1,000 requests (after free tier)
- **Free Tier:** 40,000 requests per month
- **Optimization:** Cache results, minimize redundant calls

### Usage Monitoring
```javascript
// Track API usage in production
console.log('Geocoding API call:', location.addressDetails?.placeId);
```

## Civic Reporting Requirements

### Location Accuracy Standards
- **Ideal:** ≤25 meters (for precise infrastructure issues)
- **Acceptable:** ≤50 meters (most civic issues)
- **Warning:** >50 meters (user can proceed with caution)
- **Blocked:** >100 meters (too inaccurate for civic reporting)

### Address Validation
- Street-level accuracy preferred for road issues
- Neighborhood-level acceptable for area-wide issues
- City-level sufficient for general civic concerns

This implementation ensures your Smart Civic Issue Reporter has production-grade location detection suitable for government and municipal use cases. 🎯
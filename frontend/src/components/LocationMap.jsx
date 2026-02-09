import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon issue with webpack/vite bundlers
// Leaflet's default icon URLs break when bundled
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

// Component to recenter map when coordinates change
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
};

/**
 * LocationMap - Shows detected/manual location on an OpenStreetMap
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {number} accuracy - Accuracy in meters (shown as circle radius)
 * @param {string} address - Address text for popup
 * @param {string} className - Additional CSS classes
 * @param {boolean} draggable - Whether the marker can be dragged (for future pin-drop)
 * @param {function} onMarkerDrag - Callback when marker is dragged to new position
 */
const LocationMap = ({ 
  latitude, 
  longitude, 
  accuracy, 
  address = '', 
  className = '',
  draggable = false,
  onMarkerDrag = null
}) => {
  const markerRef = useRef(null);

  if (!latitude || !longitude) return null;

  // Calculate zoom level based on accuracy
  const getZoomLevel = () => {
    if (!accuracy) return 16;
    if (accuracy <= 10) return 18;
    if (accuracy <= 50) return 17;
    if (accuracy <= 200) return 16;
    if (accuracy <= 500) return 15;
    if (accuracy <= 1000) return 14;
    if (accuracy <= 5000) return 12;
    return 11;
  };

  const handleDragEnd = () => {
    if (markerRef.current && onMarkerDrag) {
      const marker = markerRef.current;
      const { lat, lng } = marker.getLatLng();
      onMarkerDrag(lat, lng);
    }
  };

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={getZoomLevel()}
        style={{ height: '220px', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker 
          position={[latitude, longitude]}
          draggable={draggable}
          ref={markerRef}
          eventHandlers={draggable ? { dragend: handleDragEnd } : {}}
        >
          <Popup>
            <div className="text-xs max-w-[200px]">
              <p className="font-semibold text-gray-800 mb-1">📍 Detected Location</p>
              {address && <p className="text-gray-600 break-words">{address}</p>}
              {accuracy && (
                <p className="text-gray-500 mt-1">Accuracy: ±{Math.round(accuracy)}m</p>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Accuracy radius circle */}
        {accuracy && accuracy > 10 && (
          <Circle
            center={[latitude, longitude]}
            radius={Math.min(accuracy, 2000)} // Cap visual radius at 2km
            pathOptions={{
              color: accuracy <= 50 ? '#22c55e' : accuracy <= 200 ? '#eab308' : '#ef4444',
              fillColor: accuracy <= 50 ? '#22c55e' : accuracy <= 200 ? '#eab308' : '#ef4444',
              fillOpacity: 0.1,
              weight: 1.5
            }}
          />
        )}

        <RecenterMap lat={latitude} lng={longitude} />
      </MapContainer>
    </div>
  );
};

export default LocationMap;

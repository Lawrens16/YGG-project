import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin, X, Search } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface VenuePickerProps {
  onSelect: (address: string, lat: number, lng: number) => void;
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function VenuePicker({ onSelect, initialAddress = '', initialLat, initialLng }: VenuePickerProps) {
  const [address, setAddress] = useState(initialAddress);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLat && initialLng 
      ? [initialLat, initialLng]
      : [37.7749, -122.4194] // Default to San Francisco
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (initialLat && initialLng) {
      setMapCenter([initialLat, initialLng]);
      setSelectedLocation({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setMapCenter([lat, lng]);
    
    // Reverse geocode using Nominatim (OpenStreetMap's geocoding service)
    setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        const fullAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setAddress(fullAddress);
        onSelect(fullAddress, lat, lng);
        setSearching(false);
      })
      .catch(() => {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        onSelect(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng);
        setSearching(false);
      });
  }, [onSelect]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const fullAddress = result.display_name;
        
        setAddress(fullAddress);
        setSelectedLocation({ lat, lng });
        setMapCenter([lat, lng]);
        onSelect(fullAddress, lat, lng);
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('Error searching for location');
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setAddress('');
    setSearchQuery('');
    setSelectedLocation(null);
    onSelect('', 0, 0);
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search for a venue or address"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          className="pr-20"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <Search className="h-4 w-4" />
        </Button>
        {address && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-12 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {address && (
        <div className="flex items-center gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded">
          <MapPin className="h-4 w-4" />
          <span className="flex-1">{address}</span>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={selectedLocation ? 15 : 10}
          style={mapContainerStyle}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
          )}
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      {selectedLocation && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>
            {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
}

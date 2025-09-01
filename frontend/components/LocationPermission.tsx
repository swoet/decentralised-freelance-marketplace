import { useState } from 'react';
import { useLocation } from '../hooks/useLocation';

interface LocationPermissionProps {
  onLocationGranted?: (location: { latitude: number; longitude: number }) => void;
  showCompact?: boolean;
}

export default function LocationPermission({ onLocationGranted, showCompact = false }: LocationPermissionProps) {
  const { location, loading, error, hasPermission, requestLocation } = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const handleRequestLocation = async () => {
    await requestLocation();
    if (location && onLocationGranted) {
      onLocationGranted(location);
    }
  };

  if (dismissed || (hasPermission && location)) {
    return null;
  }

  if (showCompact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">📍 Enable location for nearby events</span>
        <button
          onClick={handleRequestLocation}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
        >
          {loading ? 'Getting location...' : 'Enable'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 text-xl">📍</div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Get personalized events near you
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Allow location access to see IT and business events happening in your area.
              We'll automatically update events when you're online.
            </p>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-400 hover:text-blue-600"
        >
          ✕
        </button>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleRequestLocation}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Getting location...' : 'Enable Location'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-100"
        >
          Maybe later
        </button>
      </div>
      
      {location && (
        <div className="mt-3 text-sm text-green-700">
          ✓ Location detected: {location.city}, {location.country}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timezone_name?: string;
}

interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    hasPermission: false
  });
  const { token } = useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported by browser' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Get city/country from reverse geocoding
      const locationData = await enrichLocationData(latitude, longitude);
      
      // Update backend with user location
      if (token) {
        await updateUserLocation(locationData);
      }

      setState(prev => ({
        ...prev,
        location: locationData,
        loading: false,
        hasPermission: true
      }));

    } catch (error: any) {
      let errorMessage = 'Failed to get location';
      
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location services.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please try again.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timeout. Please try again.';
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        hasPermission: error.code !== 1
      }));
    }
  };

  const enrichLocationData = async (lat: number, lon: number): Promise<LocationData> => {
    try {
      // Use a free geocoding service to get city/country
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          latitude: lat,
          longitude: lon,
          city: data.city || data.locality || 'Unknown',
          country: data.countryName || 'Unknown',
          timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
      }
    } catch (error) {
      console.warn('Failed to enrich location data:', error);
    }

    // Fallback to basic location data
    return {
      latitude: lat,
      longitude: lon,
      timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  };

  const updateUserLocation = async (locationData: LocationData) => {
    try {
      const response = await fetch(`${API_BASE}/events/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(locationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to update user location:', error);
    }
  };

  // Check if location is already stored
  useEffect(() => {
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        setState(prev => ({
          ...prev,
          location: parsed,
          hasPermission: true
        }));
      } catch (error) {
        localStorage.removeItem('userLocation');
      }
    }
  }, []);

  // Store location in localStorage when it changes
  useEffect(() => {
    if (state.location) {
      localStorage.setItem('userLocation', JSON.stringify(state.location));
    }
  }, [state.location]);

  return {
    ...state,
    requestLocation,
    clearLocation: () => {
      setState(prev => ({ ...prev, location: null }));
      localStorage.removeItem('userLocation');
    }
  };
}

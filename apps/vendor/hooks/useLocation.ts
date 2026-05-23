import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface VendorLocation {
  latitude: number;
  longitude: number;
  cityName: string;
}

const BANGALORE_DEFAULT: VendorLocation = {
  latitude: 12.9716,
  longitude: 77.5946,
  cityName: 'Bangalore',
};

export function useLocation() {
  const [location, setLocation] = useState<VendorLocation>(BANGALORE_DEFAULT);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      setPermissionGranted(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      
      // Reverse geocode to get city name
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const cityName = place?.city || place?.district || place?.region || 'Your Location';
      
      setLocation({ latitude, longitude, cityName });
    } catch (e) {
      console.warn('Location error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Haversine for distance calculation if needed
  const distanceTo = (targetLat: number, targetLng: number): number => {
    const R = 6371;
    const dLat = ((targetLat - location.latitude) * Math.PI) / 180;
    const dLon = ((targetLng - location.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((location.latitude * Math.PI) / 180) *
      Math.cos((targetLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  };

  return { location, permissionGranted, loading, requestLocation, distanceTo };
}

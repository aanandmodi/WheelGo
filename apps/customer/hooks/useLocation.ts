import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  cityName: string;
}

const AHMEDABAD_DEFAULT: UserLocation = {
  latitude: 23.0225,
  longitude: 72.5714,
  cityName: 'Ahmedabad',
};

export function useLocation() {
  const [location, setLocation] = useState<UserLocation>(AHMEDABAD_DEFAULT);
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

  // Haversine for client-side distance calculation
  const distanceTo = (vendorLat: number, vendorLng: number): number => {
    const R = 6371;
    const dLat = ((vendorLat - location.latitude) * Math.PI) / 180;
    const dLon = ((vendorLng - location.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((location.latitude * Math.PI) / 180) *
      Math.cos((vendorLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  };

  return { location, permissionGranted, loading, requestLocation, distanceTo };
}

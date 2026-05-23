import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { VendorApiService } from '@/constants/ApiService';
import { useAuth } from '@/context/AuthContext';

export default function ShopLocationScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [profile, setProfile] = useState<any>(null);
    const [region, setRegion] = useState({
        latitude: 12.9716, // Default Bangalore
        longitude: 77.5946,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [markerCoord, setMarkerCoord] = useState({
        latitude: 12.9716,
        longitude: 77.5946,
    });
    const [address, setAddress] = useState('');

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const data = await VendorApiService.getProfile();
                setProfile(data);
                if (data.latitude && data.longitude) {
                    const lat = parseFloat(data.latitude);
                    const lng = parseFloat(data.longitude);
                    setMarkerCoord({ latitude: lat, longitude: lng });
                    setRegion({
                        latitude: lat,
                        longitude: lng,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    });
                }
                if (data.address) {
                    setAddress(data.address);
                }
            } catch (error) {
                console.error("Failed to load profile", error);
                Alert.alert("Error", "Failed to load shop profile details.");
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchLocation();
    }, [token]);

    const handleMapPress = async (e: MapPressEvent) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkerCoord({ latitude, longitude });
        geocodeCoords(latitude, longitude);
    };

    const handleMarkerDragEnd = async (e: any) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkerCoord({ latitude, longitude });
        geocodeCoords(latitude, longitude);
    };

    const geocodeCoords = async (latitude: number, longitude: number) => {
        try {
            const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (place) {
                const formattedAddress = [
                    place.name,
                    place.street,
                    place.district,
                    place.city,
                    place.region,
                    place.postalCode,
                    place.country
                ].filter(Boolean).join(', ');
                setAddress(formattedAddress);
            }
        } catch (e) {
            console.warn("Reverse geocode failed", e);
        }
    };

    const useCurrentGPS = async () => {
        try {
            setLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Please enable location permission to fetch your GPS coordinates.");
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = loc.coords;
            
            setMarkerCoord({ latitude, longitude });
            setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
            geocodeCoords(latitude, longitude);
        } catch (error) {
            Alert.alert("Error", "Could not get current location.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!address.trim()) {
            Alert.alert("Missing Fields", "Please specify a shop address.");
            return;
        }

        setSaving(true);
        try {
            await VendorApiService.saveProfile({
                address: address,
                latitude: markerCoord.latitude,
                longitude: markerCoord.longitude,
            });
            Alert.alert("Success", "Shop location updated successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update shop location.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white dark:bg-[#121212] justify-center items-center">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-gray-500 mt-2">Loading Map...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]">
            <Stack.Screen options={{ title: 'Edit Shop Location', headerShown: true }} />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                className="flex-1"
            >
                <View className="flex-1 relative">
                    {/* Map Area */}
                    <View className="flex-1">
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={{ flex: 1 }}
                            region={region}
                            onRegionChangeComplete={(r) => setRegion(r)}
                            onPress={handleMapPress}
                        >
                            <Marker
                                coordinate={markerCoord}
                                draggable
                                onDragEnd={handleMarkerDragEnd}
                                title={profile?.shop_name || 'My Shop'}
                                description="Drag to adjust position"
                            />
                        </MapView>

                        {/* GPS Button */}
                        <TouchableOpacity
                            onPress={useCurrentGPS}
                            style={{ elevation: 5 }}
                            className="absolute bottom-6 right-6 bg-white dark:bg-[#1E1E1E] h-12 w-12 rounded-full items-center justify-center shadow-lg shadow-black/30"
                        >
                            <MaterialIcons name="my-location" size={24} color="#2563EB" />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Details Panel */}
                    <View className="bg-white dark:bg-[#1E1E1E] p-5 rounded-t-3xl border-t border-gray-100 dark:border-gray-800 shadow-2xl">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">Shop Location Details</Text>
                        <Text className="text-gray-400 text-xs mb-4">
                            Tapping the map or dragging the pin updates your latitude & longitude coordinates.
                        </Text>

                        <Text className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Shop Address</Text>
                        <TextInput
                            className="bg-gray-50 dark:bg-[#121212] p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white h-20 text-sm mb-4"
                            placeholder="Enter full address of your shop"
                            placeholderTextColor="gray"
                            multiline
                            textAlignVertical="top"
                            value={address}
                            onChangeText={setAddress}
                        />

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1 bg-gray-50 dark:bg-[#121212] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                <Text className="text-gray-400 text-[10px] uppercase font-bold">Latitude</Text>
                                <Text className="text-gray-700 dark:text-gray-300 font-bold text-xs mt-0.5">{markerCoord.latitude.toFixed(6)}</Text>
                            </View>
                            <View className="flex-1 bg-gray-50 dark:bg-[#121212] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                <Text className="text-gray-400 text-[10px] uppercase font-bold">Longitude</Text>
                                <Text className="text-gray-700 dark:text-gray-300 font-bold text-xs mt-0.5">{markerCoord.longitude.toFixed(6)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={saving}
                            className={`bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-500/20 ${saving ? 'opacity-70' : ''}`}
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-base">Save Shop Location</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

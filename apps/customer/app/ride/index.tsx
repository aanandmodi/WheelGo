import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ActiveRideScreen() {
    const router = useRouter();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Mock Destination (e.g., a popular spot in Bangalore)
    const DESTINATION = {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-[#F5F5F5] dark:bg-[#121212]">
            <View className="relative w-full h-full">
                {/* Map Background */}
                {!location ? (
                    <View className="absolute inset-0 items-center justify-center bg-gray-100">
                        <ActivityIndicator size="large" color="#00897B" />
                        <Text className="text-gray-500 mt-2">Locating you...</Text>
                    </View>
                ) : (
                    <MapView
                        className="absolute inset-0 w-full h-full"
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            latitudeDelta: 0.04,
                            longitudeDelta: 0.04,
                        }}
                        showsUserLocation={true}
                        showsMyLocationButton={false} // Custom button below
                    >
                        {/* Markers */}
                        <Marker
                            coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                            title="My Location"
                        />
                        <Marker
                            coordinate={{ latitude: DESTINATION.latitude, longitude: DESTINATION.longitude }}
                            title="Destination"
                            pinColor="orange"
                        />

                        {/* Route Line */}
                        <Polyline
                            coordinates={[
                                { latitude: location.coords.latitude, longitude: location.coords.longitude },
                                { latitude: DESTINATION.latitude, longitude: DESTINATION.longitude }
                            ]}
                            strokeColor="#00897B"
                            strokeWidth={4}
                        />
                    </MapView>
                )}

                {/* Floating UI */}
                <View className="flex-1 justify-between p-4 pb-6 pointer-events-box-none">

                    {/* Top Search */}
                    <View className="w-full">
                        <View className="flex-row items-center h-14 bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg">
                            <View className="h-full px-4 items-center justify-center border-r border-gray-100 dark:border-gray-700">
                                <MaterialIcons name="search" size={24} color="#757575" />
                            </View>
                            <TextInput
                                className="flex-1 h-full px-4 text-base font-medium text-[#212121] dark:text-white"
                                placeholder="Search destination"
                                defaultValue="Chhatrapati Shivaji Terminus"
                                placeholderTextColor="#757575"
                            />
                        </View>
                    </View>

                    {/* Bottom Controls & Info */}
                    <View className="items-center gap-4">

                        {/* Map Controls */}
                        <View className="w-full items-end">
                            <View className="gap-2">
                                <View className="rounded-lg overflow-hidden shadow-md">
                                    <TouchableOpacity className="h-12 w-12 bg-white dark:bg-[#1E1E1E] items-center justify-center border-b border-gray-100 dark:border-gray-700">
                                        <MaterialIcons name="add" size={24} color="#212121" />
                                    </TouchableOpacity>
                                    <TouchableOpacity className="h-12 w-12 bg-white dark:bg-[#1E1E1E] items-center justify-center">
                                        <MaterialIcons name="remove" size={24} color="#212121" />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity className="h-12 w-12 bg-white dark:bg-[#1E1E1E] items-center justify-center rounded-lg shadow-md">
                                    <MaterialIcons name="my-location" size={24} color="#00897B" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Ride Info Card */}
                        <View className="w-full bg-white dark:bg-[#1E1E1E] p-4 rounded-lg shadow-xl gap-4">
                            <View>
                                <Text className="text-xl font-bold text-[#212121] dark:text-white">Bajaj Chetak</Text>
                                <Text className="text-base font-medium text-[#757575] dark:text-[#BDBDBD]">MH 12 AB 1234</Text>
                            </View>

                            <View className="flex-row items-end justify-between">
                                <View>
                                    <Text className="text-base font-semibold text-[#00897B] mb-1">00:24:15</Text>
                                    <Text className="text-sm text-[#757575] dark:text-[#BDBDBD]">Distance: 5.2 km | Est. Cost: ₹45.50</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => router.push('/booking/confirmation')} // Mock end ride
                                className="w-full h-14 bg-[#F9A825] rounded-full items-center justify-center shadow-md"
                            >
                                <Text className="text-[#212121] text-base font-bold">End Ride</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

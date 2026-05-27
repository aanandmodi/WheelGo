import FilterModal, { FilterOptions } from '@/components/FilterModal';
import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { FlatList, Image, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { getBikes, addFavorite, removeFavorite, getRecommendations } from '@/constants/ApiService';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = ['All', 'Electric', 'Sports', 'Cruiser', 'Scooter'];

interface Bike {
  id: number;
  brand: string;
  model: string;
  image: string | null;
  price_per_hour: string;
  average_rating: string;
  review_count: number;
  vendor_name: string;
  vendor_latitude?: number;
  vendor_longitude?: number;
  is_favorited: boolean;
  distance_km?: number;
}

const CITIES = [
  { name: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867 },
];

export default function HomeScreen() {
  const { isLoggedIn } = useAuth();
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [isMapView, setIsMapView] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [recommendations, setRecommendations] = useState<Bike[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { location: gpsLocation, loading: locationLoading, distanceTo } = useLocation();

  const [selectedLocation, setSelectedLocation] = useState<any>({
    latitude: 23.0225,
    longitude: 72.5714,
    cityName: 'Ahmedabad',
    isGps: true
  });

  React.useEffect(() => {
    if (!locationLoading && gpsLocation && selectedLocation.isGps) {
      setSelectedLocation({
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        cityName: gpsLocation.cityName,
        isGps: true
      });
    }
  }, [gpsLocation, locationLoading]);

  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'newest',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    radius: '15',
  });

  const fetchBikes = async (showLoading = true) => {
    if (!isLoggedIn) return;
    try {
      if (showLoading) setLoading(true);
      
      const params: any = {
        sort_by: filters.sortBy,
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
        radius: filters.radius,
      };

      if (activeCategory !== 'All') {
        params.category_name = activeCategory;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      if (filters.minPrice) {
        params.min_price = parseFloat(filters.minPrice);
      }

      if (filters.maxPrice) {
        params.max_price = parseFloat(filters.maxPrice);
      }

      if (filters.minRating) {
        params.min_rating = parseFloat(filters.minRating);
      }

      // Fetch normal bikes and recommendations in parallel
      const [bikesData, recsData] = await Promise.all([
        getBikes(params),
        getRecommendations(selectedLocation.latitude, selectedLocation.longitude).catch(err => {
          console.error("Recommendations failed:", err);
          return [];
        }),
      ]);

      setBikes(bikesData);
      setRecommendations(recsData);

      // Compute smart trade-off suggestions (cheaper vs closest)
      if (bikesData.length > 0 && recsData.length > 0) {
        // Find nearest bike
        const nearestBike = [...bikesData]
          .filter(b => b.distance_km !== undefined && b.distance_km !== null)
          .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))[0];

        // Best recommendation item
        const bestValueBike = recsData[0];

        if (nearestBike && bestValueBike && nearestBike.id !== bestValueBike.id) {
          const nearestPrice = parseFloat(nearestBike.price_per_hour);
          const bestValuePrice = parseFloat(bestValueBike.price_per_hour);
          const nearestDist = nearestBike.distance_km || 0;
          const bestValueDist = bestValueBike.distance_km || 0;

          if (bestValuePrice < nearestPrice && bestValueDist > nearestDist) {
            const savings = Math.round(((nearestPrice - bestValuePrice) / nearestPrice) * 100);
            const extraDist = (bestValueDist - nearestDist).toFixed(1);
            if (savings > 15 && parseFloat(extraDist) < 8.0) {
              setSuggestion(`🛵 ${extraDist} km farther but ${savings}% cheaper than closest bike`);
            } else {
              setSuggestion(null);
            }
          } else {
            setSuggestion(null);
          }
        } else {
          setSuggestion(null);
        }
      } else {
        setSuggestion(null);
      }

    } catch (error) {
      console.error("Failed to fetch bikes:", error);
      setBikes([]);
      setRecommendations([]);
      setSuggestion(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when activeCategory or filters update, or when location resolves
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn && !locationLoading) {
        fetchBikes();
      }
    }, [isLoggedIn, activeCategory, filters, locationLoading, selectedLocation.latitude, selectedLocation.longitude])
  );

  const handleSearch = () => {
    fetchBikes();
  };

  const toggleFavorite = async (bike: Bike) => {
    try {
      if (bike.is_favorited) {
        await removeFavorite(bike.id);
      } else {
        await addFavorite(bike.id);
      }
      // Update local state
      setBikes(prev => prev.map(b =>
        b.id === bike.id ? { ...b, is_favorited: !b.is_favorited } : b
      ));
      setRecommendations(prev => prev.map(b =>
        b.id === bike.id ? { ...b, is_favorited: !b.is_favorited } : b
      ));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setModalVisible(false);
  };

  const renderBike = ({ item, index }: { item: Bike, index: number }) => {
    const imageUrl = item.image ? { uri: item.image } : require('../../assets/images/placeholder_bike.png');

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={{ width: '48%', marginBottom: 16 }}
      >
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/details', params: { id: item.id } })}
          className="bg-surface rounded-2xl p-2.5 shadow-sm border border-border"
          activeOpacity={0.9}
        >
          <View className="relative">
            <View className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-3 relative">
              <Image
                source={imageUrl}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md flex-row items-center">
                <MaterialIcons name="star" size={10} color="#FFC72C" />
                <Text className="text-text-primary text-[10px] font-bold ml-0.5">
                  {item.average_rating || 'New'}
                </Text>
              </View>

              {/* Distance Badge */}
              {item.distance_km !== undefined && item.distance_km !== null && (
                <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md flex-row items-center">
                  <MaterialIcons name="place" size={10} color="white" />
                  <Text className="text-white text-[10px] font-bold ml-0.5">
                    {item.distance_km < 1 
                      ? `${Math.round(item.distance_km * 1000)}m` 
                      : `${item.distance_km} km`}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => toggleFavorite(item)}
              className="absolute top-2 right-2 h-8 w-8 bg-white/90 rounded-full items-center justify-center shadow-sm"
            >
              <MaterialIcons
                name={item.is_favorited ? "favorite" : "favorite-border"}
                size={18}
                color={item.is_favorited ? "#EF4444" : "#0F172A"}
              />
            </TouchableOpacity>
          </View>

          <View className="px-1">
            <Text className="text-text-primary text-sm font-bold leading-tight mb-1.5" numberOfLines={1}>
              {item.brand} {item.model}
            </Text>
            <View className="flex-row items-end justify-between">
              <Text className="text-primary text-base font-bold">
                ₹{item.price_per_hour}
                <Text className="text-text-secondary text-xs font-normal">/hr</Text>
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center bg-surface px-6 pt-2 pb-4 justify-between sticky top-0 z-50">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 justify-center">
              <Image
                source={require('@/assets/images/logo.png')}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity onPress={() => setCityModalVisible(true)} activeOpacity={0.7}>
              <Text className="text-text-secondary text-xs font-medium uppercase tracking-wide">Location</Text>
              <View className="flex-row items-center">
                <Text className="text-text-primary text-base font-bold mr-1">
                  {locationLoading && selectedLocation.isGps ? 'Locating...' : selectedLocation.cityName}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#0F172A" />
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} className="h-10 w-10 bg-surface rounded-full items-center justify-center border border-border shadow-sm">
            <Feather name="bell" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
 
        {/* Search Bar */}
        <View className="px-6 py-4 bg-surface z-10">
          <View className="flex-row w-full h-12 bg-gray-50 rounded-xl items-center px-4 border border-border">
            <Feather name="search" size={20} color="#94A3B8" />
            <TextInput
              placeholder="Search for bikes..."
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-3 text-text-primary text-base font-medium"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={() => setIsMapView(!isMapView)} className="px-3 border-l border-gray-200">
              <Feather name={isMapView ? "list" : "map"} size={18} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(true)} className="pl-3 border-l border-gray-200">
              <Feather name="sliders" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Smart Travel Suggestion Banner */}
        {suggestion && (
          <Animated.View entering={FadeInDown} className="bg-yellow-50 px-6 py-2 border-b border-yellow-100 flex-row items-center">
            <Text className="text-yellow-800 text-xs font-bold flex-1">{suggestion}</Text>
          </Animated.View>
        )}

        <View className="flex-1">
          {loading && !refreshing ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#0F1115" />
              <Text className="text-gray-500 mt-2">Loading Bikes...</Text>
            </View>
          ) : isMapView ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              region={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
            >
              {bikes
                .filter(b => b.vendor_latitude && b.vendor_longitude)
                .map(bike => {
                  return (
                    <Marker
                      key={bike.id}
                      coordinate={{
                        latitude: Number(bike.vendor_latitude),
                        longitude: Number(bike.vendor_longitude),
                      }}
                      title={`${bike.brand} ${bike.model}`}
                      description={`₹${bike.price_per_hour}/hr • Rating: ${bike.average_rating || 'New'}`}
                    >
                      <Callout
                        onPress={() => router.push({ pathname: '/details', params: { id: bike.id } })}
                        style={{ width: 180, backgroundColor: 'white', padding: 8, borderRadius: 8 }}
                      >
                        <View className="items-center">
                          <Text className="font-bold text-sm text-[#0F172A]">{bike.brand} {bike.model}</Text>
                          <Text className="text-primary font-bold text-xs mt-1">₹{bike.price_per_hour}/hr</Text>
                          <Text className="text-gray-400 text-[10px] mt-1">Tap to View Details</Text>
                        </View>
                      </Callout>
                    </Marker>
                  );
                })}
            </MapView>
          ) : (
            <FlatList
              data={bikes}
              renderItem={renderBike}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 24 }}
              contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); fetchBikes(false); }}
                  colors={['#0F1115']}
                />
              }
              ListHeaderComponent={
                <View className="mb-4">
                  {/* Category Filter Chips */}
                  <View className="pl-6 mb-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 24 }}>
                      {CATEGORIES.map((cat, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => setActiveCategory(cat)}
                          className={`h-9 justify-center px-5 rounded-full border ${activeCategory === cat ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
                        >
                          <Text className={`text-sm font-semibold ${activeCategory === cat ? 'text-white' : 'text-text-secondary'}`}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Horizontal Recommendations Section */}
                  {recommendations.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-xl font-bold text-text-primary px-6 mb-3">
                        ✨ Recommended for You
                      </Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                      >
                        {recommendations.map((bike) => (
                          <TouchableOpacity
                            key={bike.id}
                            onPress={() => router.push({ pathname: '/details', params: { id: bike.id } })}
                            className="w-52 bg-surface rounded-2xl p-3 border border-border shadow-sm"
                          >
                            <View className="w-full h-32 rounded-xl overflow-hidden bg-gray-100 mb-2 relative">
                              <Image source={bike.image ? { uri: bike.image } : require('../../assets/images/placeholder_bike.png')} className="w-full h-full" resizeMode="cover" />
                              <View className="absolute top-2 left-2 bg-primary/90 px-2 py-0.5 rounded-md">
                                <Text className="text-white text-[9px] font-bold">{(bike as any).recommendation_label || 'Special'}</Text>
                              </View>
                            </View>
                            <Text className="text-text-primary text-sm font-bold" numberOfLines={1}>
                              {bike.brand} {bike.model}
                            </Text>
                            <View className="flex-row justify-between items-center mt-1">
                              <Text className="text-primary font-bold">₹{bike.price_per_hour}/hr</Text>
                              {bike.distance_km != null && (
                                <Text className="text-text-secondary text-xs">{bike.distance_km} km</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <Text className="text-xl font-bold text-text-primary px-6 mt-2">Available Bikes</Text>
                </View>
              }
              ListEmptyComponent={
                <View className="items-center mt-10">
                  <MaterialIcons name="two-wheeler" size={60} color="#E2E8F0" />
                  <Text className="text-gray-500 mt-4">No bikes found.</Text>
                  <Text className="text-gray-400 text-sm mt-1">Try changing your filters</Text>
                </View>
              }
            />
          )}
        </View>

        <FilterModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onApply={handleApplyFilters}
          currentFilters={filters}
        />

        {/* City Selection Modal */}
        <Modal
          visible={cityModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setCityModalVisible(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white dark:bg-[#1E1E1E] p-6 rounded-t-3xl border-t border-gray-100 dark:border-gray-800">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">Select Location</Text>
                <TouchableOpacity onPress={() => setCityModalVisible(false)} className="h-8 w-8 items-center justify-center bg-gray-100 dark:bg-gray-850 rounded-full">
                  <MaterialIcons name="close" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Use GPS option */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedLocation({
                    latitude: gpsLocation?.latitude || 23.0225,
                    longitude: gpsLocation?.longitude || 72.5714,
                    cityName: gpsLocation?.cityName || 'Ahmedabad',
                    isGps: true
                  });
                  setCityModalVisible(false);
                }}
                className="flex-row items-center p-4 bg-teal-50 dark:bg-teal-900/10 rounded-2xl mb-4 border border-teal-100 dark:border-teal-900/30"
              >
                <View className="h-10 w-10 bg-teal-100 dark:bg-teal-900/20 rounded-full items-center justify-center mr-4">
                  <MaterialIcons name="my-location" size={20} color="#0F766E" />
                </View>
                <View className="flex-1">
                  <Text className="text-teal-950 dark:text-teal-200 font-bold text-sm">Current GPS Location</Text>
                  <Text className="text-teal-700 dark:text-teal-400 text-xs mt-0.5">
                    {locationLoading ? 'Detecting coordinates...' : gpsLocation?.cityName || 'Use current coordinates'}
                  </Text>
                </View>
              </TouchableOpacity>

              <Text className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 ml-1">Popular Cities</Text>
              
              <ScrollView style={{ maxHeight: 250 }}>
                {CITIES.map((city) => (
                  <TouchableOpacity
                    key={city.name}
                    onPress={() => {
                      setSelectedLocation({
                        latitude: city.latitude,
                        longitude: city.longitude,
                        cityName: city.name,
                        isGps: false
                      });
                      setCityModalVisible(false);
                    }}
                    className="flex-row items-center py-3.5 px-4 border-b border-gray-100 dark:border-gray-800"
                  >
                    <FontAwesome name="map-marker" size={16} color="#94A3B8" />
                    <Text className="text-gray-900 dark:text-white font-medium ml-3">{city.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

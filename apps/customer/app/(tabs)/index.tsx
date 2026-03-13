import FilterModal from '@/components/FilterModal';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { FlatList, Image, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBikes, addFavorite, removeFavorite } from '@/constants/ApiService';

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
  is_favorited: boolean;
}

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');

  const fetchBikes = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params: any = { sort_by: sortBy };

      if (activeCategory !== 'All') {
        params.category_name = activeCategory;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const data = await getBikes(params);
      setBikes(data);
    } catch (error) {
      console.error("Failed to fetch bikes:", error);
      setBikes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBikes();
    }, [activeCategory, sortBy])
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
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleSortChange = (option: string) => {
    const sortMap: Record<string, string> = {
      'Price: Low to High': 'price_low',
      'Price: High to Low': 'price_high',
      'Rating': 'rating',
      'Newest': 'newest',
    };
    setSortBy(sortMap[option] || 'newest');
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
              <View className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md">
                <View className="flex-row items-center">
                  <MaterialIcons name="star" size={10} color="#F59E0B" />
                  <Text className="text-text-primary text-[10px] font-bold ml-0.5">
                    {item.average_rating || 'New'}
                  </Text>
                </View>
              </View>
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
    )
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
            <View>
              <Text className="text-text-secondary text-xs font-medium uppercase tracking-wide">Location</Text>
              <View className="flex-row items-center">
                <Text className="text-text-primary text-base font-bold mr-1">Bangalore, IND</Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#0F172A" />
              </View>
            </View>
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
            <TouchableOpacity onPress={() => setModalVisible(true)} className="pl-3 border-l border-gray-200">
              <Feather name="sliders" size={18} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1">
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#008a7c" />
              <Text className="text-gray-500 mt-2">Loading Bikes...</Text>
            </View>
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
                  colors={['#0F766E']}
                />
              }
              ListHeaderComponent={
                <View className="mb-6">
                  <View className="pl-6 mb-2">
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
                  <Text className="text-xl font-bold text-text-primary px-6 mt-6">Popular Bikes</Text>
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
          onApply={handleSortChange}
        />
      </View>
    </SafeAreaView>
  );
}

import React, { useState, useEffect } from 'react';
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View, TextInput, ScrollView } from 'react-native';

export interface FilterOptions {
  sortBy: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  radius: string; // km
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const SORT_OPTIONS = [
  { key: 'distance', label: '📍 Distance (Nearest First)' },
  { key: 'price_low', label: '💰 Price: Low to High' },
  { key: 'price_high', label: '💸 Price: High to Low' },
  { key: 'rating', label: '⭐ Highest Rated' },
  { key: 'newest', label: '🆕 Newest First' },
];

const RADIUS_OPTIONS = [
  { value: '2', label: '2 km' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '20', label: '20 km' },
  { value: '50', label: 'City-wide' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '4.5', label: '4.5+' },
];

export default function FilterModal({ visible, onClose, onApply, currentFilters }: FilterModalProps) {
  const [sortBy, setSortBy] = useState(currentFilters.sortBy || 'newest');
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || '');
  const [minRating, setMinRating] = useState(currentFilters.minRating || '');
  const [radius, setRadius] = useState(currentFilters.radius || '15');

  // Sync state with currentFilters when visible changes
  useEffect(() => {
    if (visible) {
      setSortBy(currentFilters.sortBy || 'newest');
      setMinPrice(currentFilters.minPrice || '');
      setMaxPrice(currentFilters.maxPrice || '');
      setMinRating(currentFilters.minRating || '');
      setRadius(currentFilters.radius || '15');
    }
  }, [visible, currentFilters]);

  const handleApply = () => {
    onApply({ sortBy, minPrice, maxPrice, minRating, radius });
    onClose();
  };

  const handleReset = () => {
    setSortBy('newest');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setRadius('15');
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/40">
          <TouchableWithoutFeedback>
            <View className="bg-surface rounded-t-3xl p-4 pb-8 max-h-[85%] border-t border-border">
              {/* Handle Bar */}
              <View className="items-center mb-4">
                <View className="h-1 w-9 rounded-full bg-border" />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="flex-row justify-between items-center px-4 mb-4">
                  <Text className="text-text-primary text-2xl font-bold">Filter & Sort</Text>
                  <TouchableOpacity onPress={handleReset}>
                    <Text className="text-primary font-semibold">Reset All</Text>
                  </TouchableOpacity>
                </View>

                {/* Sort By */}
                <View className="px-4 mb-6">
                  <Text className="text-text-primary text-base font-bold mb-3">Sort By</Text>
                  <View className="gap-2">
                    {SORT_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => setSortBy(opt.key)}
                        className={`flex-row items-center justify-between p-3 rounded-xl border ${sortBy === opt.key ? 'bg-primary/5 border-primary' : 'bg-gray-50 border-gray-100'}`}
                      >
                        <Text className={`font-medium ${sortBy === opt.key ? 'text-primary' : 'text-text-primary'}`}>
                          {opt.label}
                        </Text>
                        <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${sortBy === opt.key ? 'border-primary' : 'border-gray-300'}`}>
                          {sortBy === opt.key && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Search Radius */}
                <View className="px-4 mb-6">
                  <Text className="text-text-primary text-base font-bold mb-3">Search Radius</Text>
                  <View className="flex-row gap-2 flex-wrap">
                    {RADIUS_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setRadius(opt.value)}
                        className={`px-4 py-2 rounded-full border ${radius === opt.value ? 'bg-primary border-primary' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <Text className={`font-semibold text-sm ${radius === opt.value ? 'text-white' : 'text-text-secondary'}`}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Price Range */}
                <View className="px-4 mb-6">
                  <Text className="text-text-primary text-base font-bold mb-3">Price Range (₹/hr)</Text>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-xs text-text-secondary mb-1">Min Price</Text>
                      <TextInput
                        className="bg-gray-50 border border-border rounded-xl p-3 text-text-primary font-medium"
                        placeholder="Min"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={minPrice}
                        onChangeText={setMinPrice}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-text-secondary mb-1">Max Price</Text>
                      <TextInput
                        className="bg-gray-50 border border-border rounded-xl p-3 text-text-primary font-medium"
                        placeholder="Max"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={maxPrice}
                        onChangeText={setMaxPrice}
                      />
                    </View>
                  </View>
                </View>

                {/* Rating */}
                <View className="px-4 mb-6">
                  <Text className="text-text-primary text-base font-bold mb-3">Minimum Rating</Text>
                  <View className="flex-row gap-2 flex-wrap">
                    {RATING_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setMinRating(opt.value)}
                        className={`px-4 py-2 rounded-full border ${minRating === opt.value ? 'bg-amber-400 border-amber-400' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <Text className={`font-semibold text-sm ${minRating === opt.value ? 'text-white' : 'text-text-secondary'}`}>
                          {opt.value ? `${opt.label} ⭐` : opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View className="flex px-4 py-3 border-t border-border mt-2">
                <TouchableOpacity
                  onPress={handleApply}
                  className="flex items-center justify-center overflow-hidden rounded-xl h-12 bg-primary"
                >
                  <Text className="text-white text-base font-bold">
                    Apply Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

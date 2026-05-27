import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, Image } from 'react-native';
import { VendorApiService } from '@/constants/ApiService';
import { useAuth } from '@/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function AddVehicleScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [plate, setPlate] = useState('');
    const [rate, setRate] = useState('');
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [image, setImage] = useState<string | null>(null);

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await VendorApiService.getCategories();
                setCategories(data);
            } catch (e) {
                console.error("Failed to load categories:", e);
            }
        };
        fetchCategories();
    }, []);

    const pickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleAddVehicle = async () => {
        if (!brand || !model || !plate || !rate) {
            Alert.alert("Missing Fields", "Please fill all details.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('brand', brand);
            formData.append('model', model);
            formData.append('number_plate', plate);
            formData.append('price_per_hour', rate);
            formData.append('status', 'available');

            if (selectedCategoryId !== null) {
                formData.append('category', selectedCategoryId.toString());
            }

            if (image) {
                const filename = image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                // @ts-ignore
                formData.append('image', { uri: image, name: filename, type });
            }

            await VendorApiService.addVehicle(formData);

            Alert.alert("Success", "Vehicle Added Successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);

        } catch (error: any) {
            console.error(error);
            Alert.alert("Error", error.message || "Failed to add vehicle.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center p-4 border-b border-gray-150 bg-white">
                    <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
                        <FontAwesome name="close" size={20} color="gray" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold flex-1 text-center pr-10 text-gray-900">Add New Vehicle</Text>
                </View>

                <ScrollView className="flex-1 p-6">
                    <View className="space-y-6">

                        {/* Image Upload */}
                        <TouchableOpacity
                            onPress={pickImage}
                            className="h-40 bg-white rounded-2xl border-2 border-dashed border-gray-300 items-center justify-center overflow-hidden"
                        >
                            {image ? (
                                <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                <>
                                    <FontAwesome name="camera" size={32} color="gray" />
                                    <Text className="text-gray-500 mt-2">Upload Vehicle Photo (Optional)</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Text Fields */}
                        <View className="space-y-4">
                            <View>
                                <Text className="text-sm font-medium text-gray-750 mb-2">Brand</Text>
                                <TextInput
                                    className="bg-white p-4 rounded-xl border border-gray-200 text-gray-900"
                                    placeholder="e.g. Honda, Royal Enfield"
                                    placeholderTextColor="gray"
                                    value={brand}
                                    onChangeText={setBrand}
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-750 mb-2">Model</Text>
                                <TextInput
                                    className="bg-white p-4 rounded-xl border border-gray-200 text-gray-900"
                                    placeholder="e.g. Activa 6G, Classic 350"
                                    placeholderTextColor="gray"
                                    value={model}
                                    onChangeText={setModel}
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-750 mb-2">Registration Number</Text>
                                <TextInput
                                    className="bg-white p-4 rounded-xl border border-gray-200 text-gray-900"
                                    placeholder="e.g. KA-01-AB-1234"
                                    placeholderTextColor="gray"
                                    value={plate}
                                    onChangeText={setPlate}
                                    autoCapitalize="characters"
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-750 mb-2">Price / Hour (₹)</Text>
                                <TextInput
                                    className="bg-white p-4 rounded-xl border border-gray-200 text-gray-900"
                                    placeholder="e.g. 50"
                                    placeholderTextColor="gray"
                                    keyboardType="numeric"
                                    value={rate}
                                    onChangeText={setRate}
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-medium text-gray-750 mb-3">Category</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            onPress={() => setSelectedCategoryId(cat.id)}
                                            className={`px-4 py-2.5 rounded-full border ${selectedCategoryId === cat.id ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                                        >
                                            <Text className={`font-semibold text-sm ${selectedCategoryId === cat.id ? 'text-white' : 'text-gray-700'}`}>
                                                {cat.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                    </View>
                </ScrollView>

                <View className="p-4 border-t border-gray-150 bg-white">
                    <TouchableOpacity
                        className={`bg-primary py-4 rounded-full shadow-lg shadow-gray-950/15 ${loading ? 'opacity-70' : ''}`}
                        onPress={handleAddVehicle}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-center font-bold text-lg">Add Vehicle</Text>
                        )}
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}

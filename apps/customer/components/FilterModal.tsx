import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (sortOption: string) => void;
}

export default function FilterModal({ visible, onClose, onApply }: FilterModalProps) {
    const [selectedOption, setSelectedOption] = useState('Price (Low to High)');

    const options = [
        'Price (Low to High)',
        'Price (High to Low)',
        'Distance (Nearest First)',
        'Rating',
    ];

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 justify-end bg-black/40">
                    <TouchableWithoutFeedback>
                        <View className="bg-white rounded-t-3xl p-4 pb-8">
                            {/* Handle Bar */}
                            <View className="items-center mb-4">
                                <View className="h-1 w-9 rounded-full bg-[#dbe6e5]" />
                            </View>

                            <Text className="text-[#111817] text-[22px] font-bold leading-tight px-4 pb-3 pt-2">Sort</Text>

                            <View className="flex-col gap-3 p-4">
                                {options.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        activeOpacity={0.7}
                                        onPress={() => setSelectedOption(option)}
                                        className="flex-row-reverse items-center justify-between gap-4 rounded-lg border border-solid border-[#dbe6e5] p-[15px]"
                                    >
                                        <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${selectedOption === option ? 'border-[#111817]' : 'border-[#dbe6e5]'}`}>
                                            {selectedOption === option && <View className="h-2.5 w-2.5 rounded-full bg-[#111817]" />}
                                        </View>
                                        <View className="flex grow flex-col">
                                            <Text className="text-[#111817] text-sm font-medium leading-normal">{option}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View className="flex px-4 py-3">
                                <TouchableOpacity
                                    onPress={() => {
                                        onApply(selectedOption);
                                        onClose();
                                    }}
                                    className="flex items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#0df2db]"
                                >
                                    <Text className="text-[#111817] text-base font-bold leading-normal truncate">
                                        Apply Filters
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View className="h-5 bg-white" />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

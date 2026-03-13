import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

            {/* Top Border Gradient Placeholder - using a simple View for now, could be a gradient */}
            <View className="h-[1px] w-full bg-white/30 absolute top-0" />

            <View style={styles.content}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            // The `merge: true` option makes sure that the params inside the tab screen are preserved
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };


                    // Icon Mapping (Helper)
                    let iconName: React.ComponentProps<typeof FontAwesome>['name'] = 'circle';
                    if (route.name === 'index') iconName = 'search';
                    if (route.name === 'history') iconName = 'history';
                    if (route.name === 'wallet') iconName = 'google-wallet';
                    if (route.name === 'account') iconName = 'user';


                    return (
                        <TabItem
                            key={index}
                            isFocused={isFocused}
                            label={label as string}
                            iconName={iconName}
                            onPress={onPress}
                            onLongPress={onLongPress}
                        />
                    );
                })}
            </View>
        </View>
    );
}

function TabItem({ isFocused, label, iconName, onPress, onLongPress }: {
    isFocused: boolean;
    label: string;
    iconName: React.ComponentProps<typeof FontAwesome>['name'];
    onPress: () => void;
    onLongPress: () => void;
}) {

    // Animations for scale and color
    const scale = useSharedValue(1);

    React.useEffect(() => {
        if (isFocused) {
            scale.value = withSpring(1.2, { damping: 10, stiffness: 100 });
        } else {
            scale.value = withSpring(1);
        }
    }, [isFocused]);

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                {/* Active Background Indicator (Optional subtle glow) */}
                {isFocused && (
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        style={styles.activeIndicator}
                    />
                )}

                <Animated.View style={animatedIconStyle}>
                    <FontAwesome
                        name={iconName}
                        size={24}
                        color={isFocused ? '#0F766E' : '#94A3B8'} // Primary (Teal) vs Slate-400
                    />
                </Animated.View>
            </View>

            <Text style={[
                styles.label,
                { color: isFocused ? '#0F766E' : '#94A3B8', fontWeight: isFocused ? '600' : '400' }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.85)', // Fallback / Base
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        // Shadow (Elevation)
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        marginBottom: 2,
    },
    activeIndicator: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#CCFBF1', // Teal-50
        zIndex: -1,
    },
    label: {
        fontSize: 10,
        marginTop: 2,
    }
});

import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function CustomSplashScreen() {
    return (
        <View style={styles.container}>
            <Animated.View entering={FadeIn.duration(1000)} style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.slogan}>Eco-friendly rides at your fingertips</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 200,
        height: 200,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    slogan: {
        fontSize: 16,
        color: '#64748B', // Slate 500
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 20,
    },
});

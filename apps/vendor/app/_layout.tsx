import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import '../global.css';

import VendorSplashScreen from '@/components/VendorSplashScreen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

export default function Layout() {
    const [appReady, setAppReady] = useState(false);

    useEffect(() => {
        const prepare = async () => {
            // Keep splash screen visible for a moment
            await new Promise(resolve => setTimeout(resolve, 2500));
            setAppReady(true);
            await SplashScreen.hideAsync();
        };

        prepare();
    }, []);

    if (!appReady) {
        return <VendorSplashScreen />;
    }

    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

function AppContent() {
    const { isLoggedIn } = useAuth();
    useNotifications(isLoggedIn);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
        </Stack>
    );
}


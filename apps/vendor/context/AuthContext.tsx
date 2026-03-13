import { router } from 'expo-router';
import React, { createContext, useContext, useState } from 'react';

import * as SecureStore from 'expo-secure-store';

type UserRole = 'consumer' | 'vendor' | null;

interface AuthContextType {
    userRole: UserRole;
    isLoggedIn: boolean;
    login: (role?: UserRole, token?: string, refresh?: string) => void;
    logout: () => void;
    switchRole: () => void;
    token: string | null;
}

const AuthContext = createContext<AuthContextType>({
    userRole: null,
    isLoggedIn: false,
    login: () => { },
    logout: () => { },
    switchRole: () => { },
    token: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    // Load Token on mount
    React.useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync('userToken');
                const storedRole = await SecureStore.getItemAsync('userRole');
                if (storedToken) {
                    setToken(storedToken);
                    setIsLoggedIn(true);
                    if (storedRole) setUserRole(storedRole as UserRole);
                    console.log("Restored token from storage");
                }
            } catch (e) {
                console.error("Failed to load token", e);
            }
        };
        loadToken();
    }, []);

    const login = (role: UserRole = 'consumer', accessToken?: string, refreshToken?: string) => {
        setIsLoggedIn(true);
        setUserRole(role);
        if (accessToken) {
            setToken(accessToken);
            SecureStore.setItemAsync('userToken', accessToken);
            SecureStore.setItemAsync('userRole', role || 'consumer');
            console.log("Logged in with token:", accessToken);
        }
    };

    const logout = async () => {
        setIsLoggedIn(false);
        setUserRole(null);
        setToken(null);
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userRole');
        router.replace('/(auth)/login');
    };

    const switchRole = () => {
        // Feature disabled for now
        alert("Switch role not implemented in single app mode");
    };

    return (
        <AuthContext.Provider value={{ userRole, isLoggedIn, login, logout, switchRole, token }}>
            {children}
        </AuthContext.Provider>
    );
};

import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS Simulator
// If using a physical device, replace this with your PC's LAN IP (e.g. http://192.168.1.5:8000)
// Detected IP: 192.168.2.102
const DOMAIN = 'http://192.168.2.102:8000';

export const API_URL = `${DOMAIN}/api`;

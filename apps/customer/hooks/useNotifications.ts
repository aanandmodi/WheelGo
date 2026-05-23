import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updateFCMToken } from '@/constants/ApiService';

// Configure notification behavior for when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications(isLoggedIn: boolean) {
  useEffect(() => {
    if (isLoggedIn) {
      registerForPushNotificationsAsync();
    }
  }, [isLoggedIn]);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notifications!');
        return;
      }
      
      // Get the native FCM push token
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      const token = deviceToken.data;
      
      if (token) {
        console.log('FCM Device Token retrieved:', token);
        await updateFCMToken(token);
      }
      
      // Setup Android specific channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (e) {
      console.error('Error setting up push notifications:', e);
    }
  };

  useEffect(() => {
    // Listener for when a notification is received while the app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Listener for when a user interacts with a notification (taps it)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);
}

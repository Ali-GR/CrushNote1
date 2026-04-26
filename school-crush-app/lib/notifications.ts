import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Konfiguration für Benachrichtigungen (Wie sie angezeigt werden, wenn die App im Vordergrund ist)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Apple verlangt, dass wir nur fragen, wenn wir noch keine finale Antwort haben
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Holen des eigentlichen Push-Tokens von Expo
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
         console.warn("EAS Project ID not found. Expo Push might not work.");
      }
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      console.log("EXPO PUSH TOKEN:", token);
    } catch (e: any) {
      if (e.message?.includes('FirebaseApp is not initialized')) {
        console.warn("🔔 Push-Benachrichtigungen: Firebase noch nicht initialisiert. Das ist normal, bis der neue EAS-Build installiert ist.");
      } else {
        console.error("Error getting push token", e);
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

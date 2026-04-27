//src/hooks/useNotifications.ts
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { db } from '../services/firebase';
import { useUser } from './useUser';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const registerForPushNotifications = async () => {
      if (!Device.isDevice) return; // won't work on simulator

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#f61cc7',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'a4e8edce-5c2a-4f7b-9a36-a27aae2b82b8',
      })).data;

      await updateDoc(doc(db, 'users', user.uid), {
        expoPushToken: token,
      });
    };

    registerForPushNotifications();
  }, [user]);
}

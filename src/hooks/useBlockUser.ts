// src/hooks/useBlockUser.ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Alert } from 'react-native';
import { db } from '../services/firebase';

export function useBlockUser(currentUserId: string) {
  const blockUser = (blockedId: string, blockedName: string) => {
    Alert.alert(
      `Block ${blockedName}?`,
      'They will be removed from your feed and chats. Dormify will also be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await addDoc(collection(db, 'blocks'), {
                blockerId: currentUserId,
                blockedId,
                blockedName,
                createdAt: serverTimestamp(),
              });
              Alert.alert('User Blocked', `${blockedName} has been blocked and reported to Dormify.`);
            } catch (e) {
              Alert.alert('Error', 'Could not block user. Please try again.');
            }
          },
        },
      ]
    );
  };

  return { blockUser };
}
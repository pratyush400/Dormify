import { auth, db } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const backgroundImage = require('@/assets/images/boarding.jpg');
const backgroundImage2 = require('@/assets/images/bg2.jpg');

export default function App() {
  const router = useRouter();

  const completeOnboardAndGo = async (schoolPath: string) => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid), { onboardingComplete: true, school: schoolPath }, { merge: true });
      router.replace('/(tabs)/home');
    } catch (e) {
      console.warn('Failed to finish onboarding', e);
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome! Chose your school 🏫 </Text>

      <TouchableOpacity style={styles.card} onPress={() => completeOnboardAndGo('lewis_and_clark')}>
        <Image style={styles.img} source={backgroundImage}/>
        <Text style={styles.cardText}>Lewis & Clark College </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => completeOnboardAndGo('portland_state')}>
        <Image style={styles.img2} source={backgroundImage2}/>
        <Text style={styles.cardText}>Portland State </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#5ccbcb',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#010103',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  img: {
    width: 140,
    height: 140,
    borderRadius: 16,
  },
  img2: {
    width: 140,
    height: 140,
    borderRadius: 16,
  }
});
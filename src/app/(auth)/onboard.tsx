import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DEFAULT_HALLS, SCHOOL_CONFIGS } from '../../constants/schools';
import { useUser } from '../../hooks/useUser';
import { db, storage } from '../../services/firebase';

export default function OnboardScreen() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [hall, setHall] = useState(user?.hall || '');
  const [avatar, setAvatar] = useState(user?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  const schoolConfig = useMemo(() => {
    return SCHOOL_CONFIGS.find(
      (school) => school.key === (user as any)?.schoolKey || school.name === user?.college
    ) ?? null;
  }, [user]);

  const availableHalls = schoolConfig?.halls?.length ? schoolConfig.halls : DEFAULT_HALLS;
  const schoolName = schoolConfig?.name || user?.college || 'your school';
  const welcomeLabel = schoolConfig?.welcomeLabel || `${schoolName}'s`;

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const completeOnboarding = async () => {
    if (!user?.uid) {
      router.replace('/(auth)/signup');
      return;
    }

    setIsLoading(true);
    try {
      let avatarUrl = user.avatarUrl || '';

      if (avatar && avatar !== user.avatarUrl) {
        const response = await fetch(avatar);
        const blob = await response.blob();
        const avatarRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
        await uploadBytes(avatarRef, blob);
        avatarUrl = await getDownloadURL(avatarRef);
      }

      await setDoc(doc(db, 'users', user.uid), {
        hall: hall || '',
        avatarUrl,
        college: schoolConfig?.name || user.college || '',
        schoolKey: schoolConfig?.key || (user as any)?.schoolKey || '',
        onboardingComplete: true,
      }, { merge: true });

      router.replace('/(tabs)/home');
    } catch (error) {
      console.warn('Failed to finish onboarding', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f2d4d" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Welcome to Obo</Text>
          <Text style={styles.title}>Hey, welcome to {schoolName}</Text>
          <Text style={styles.subtitle}>You’re entering {welcomeLabel} Obo.</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.avatarCard} onPress={pickAvatar} activeOpacity={0.9}>
            <Image
              source={avatar ? { uri: avatar } : require('@/assets/images/davatar.jpg')}
              style={styles.avatar}
            />
            <View style={styles.avatarMeta}>
              <Text style={styles.sectionTitle}>Profile photo</Text>
              <Text style={styles.helperText}>Add a face so people know who they’re buying from.</Text>
            </View>
            <View style={styles.avatarAction}>
              <Ionicons name="camera-outline" size={20} color="#1f2d4d" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where are you living?</Text>
          <Text style={styles.helperText}>Pick the hall or area that fits you best.</Text>
          <View style={styles.chipRow}>
            {availableHalls.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, hall === item && styles.chipActive]}
                onPress={() => setHall(item)}
              >
                <Text style={[styles.chipText, hall === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.continueBtn} onPress={completeOnboarding} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.continueText}>Finish setup</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' },
  content: { padding: 20, paddingBottom: 32, gap: 20 },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    gap: 8,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f61cc7',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: '#4b5563',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#e5e7eb',
  },
  avatarMeta: { flex: 1, gap: 4 },
  avatarAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#1f2d4d',
    borderColor: '#1f2d4d',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  chipTextActive: {
    color: '#fff',
  },
  continueBtn: {
    marginTop: 4,
    backgroundColor: '#1f2d4d',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

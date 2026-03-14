// src/app/modal/edit-profile.tsx
import { doc, updateDoc, getDocs, query, collection, where } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useUser } from '../../hooks/useUser';

const HALLS = ['All Halls', 'Copeland Hall', 'Akin Hall', 'Forest Hall', 'Odell Hall', 'Stewart Hall', 'Holmes Hall', 'Hartzfeld Hall', 'Apartments'];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [fname, setFname] = useState(user?.fname || '');
  const [lname, setLname] = useState(user?.lname || '');
  const [username, setUsername] = useState(user?.username || '');
  const [hall, setHall] = useState(user?.hall || '');
  const [avatar, setAvatar] = useState(user?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

const handleSave = async () => {
  if (!user) return;
  setIsLoading(true);
  try {
    let avatarUrl = user.avatarUrl;

    if (avatar && avatar !== user.avatarUrl) {
      const response = await fetch(avatar);
      const blob = await response.blob();
      const avatarRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
      await uploadBytes(avatarRef, blob);
      avatarUrl = await getDownloadURL(avatarRef);
    }

    await updateDoc(doc(db, 'users', user.uid), {
      fname, lname, username, hall, avatarUrl,
    });

    // Update all seller's listings with new avatar
    const sellerListings = await getDocs(query(
      collection(db, 'listings'),
      where('sellerId', '==', user.uid)
    ));
    await Promise.all(sellerListings.docs.map(d =>
      updateDoc(doc(db, 'listings', d.id), { sellerAvatar: avatarUrl })
    ));

    Alert.alert('Saved!', 'Your profile has been updated.');
    router.back();
  } catch (e) {
    Alert.alert('Error', 'Could not save profile.');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading
            ? <ActivityIndicator size="small" color="#6366f1" />
            : <Text style={styles.saveBtn}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickAvatar}>
          <Image
            source={avatar ? { uri: avatar } : require('@/assets/images/davatar.jpg')}
            style={styles.avatar}
          />
          <View style={styles.avatarOverlay}>
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.avatarOverlayText}>Change Photo</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={fname} onChangeText={setFname} />

        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lname} onChangeText={setLname} />

        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />

        <Text style={styles.label}>Hall / Location</Text>
        <View style={styles.chipRow}>
          {HALLS.map(h => (
            <TouchableOpacity
              key={h}
              style={[styles.chip, hall === h && styles.chipActive]}
              onPress={() => setHall(h)}
            >
              <Text style={[styles.chipText, hall === h && styles.chipTextActive]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  saveBtn: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  body: { padding: 24, gap: 6 },
  avatarContainer: { alignSelf: 'center', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 50,
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  avatarOverlayText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 14 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
});
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, SafeAreaView,
  TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';

const DEFAULT_AVATAR = require('@/assets/images/davatar.jpg');  
const DEFAULT_ITEM = require('@/assets/images/davatar.jpg');  

type Listing = {
  id: string;
  title: string;
  price: number;
  photos: string[];
  condition: string;
  sold: boolean;
};

export default function ViewProfileScreen() {
  const router = useRouter();
  const { uid, name, avatar } = useLocalSearchParams<{
    uid: string;
    name: string;
    avatar: string;
  }>();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'listings'),
      where('sellerId', '==', uid),
      where('sold', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={listings}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.profileCard}>
            <Image
              source={avatar ? { uri: avatar }  : DEFAULT_AVATAR}
              style={styles.avatar}
            />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.listingsLabel}>
              {listings.length} active listing{listings.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
        <TouchableOpacity style={styles.listingCard} activeOpacity={0.85}>
            <Image
            source={item.photos?.[0] ? { uri: item.photos[0] } : DEFAULT_ITEM}
            style={styles.listingImage}
            />
            <View style={styles.listingInfo}>
            <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.listingPrice}>${item.price}</Text>
            </View>
        </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛋️</Text>
              <Text style={styles.emptyText}>No active listings</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#f07249" style={{ marginTop: 40 }} />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  body: { padding: 16, gap: 16 },
  profileCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    alignItems: 'center', gap: 8, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#000000' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  listingsLabel: { fontSize: 13, color: '#9ca3af' },
  row: { gap: 12 },
  listingCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  listingImage: { width: '100%', height: 120 },
  listingInfo: { padding: 10, gap: 4 },
  listingTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
  listingPrice: { fontSize: 15, fontWeight: '700', color: '#05050e' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
});
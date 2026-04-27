//src/app/(tabs)/home.tsx
import { useBlockUser } from '@/hooks/useBlockUser';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  deleteDoc, doc,
  onSnapshot, orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList, Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { useUser } from '../../hooks/useUser';
import { db } from '../../services/firebase';

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  photos: string[];
  seller: { name: string; avatar: string };
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  hall: string;
  college: string;
  category?: string;
  sold: boolean;
  createdAt: any;
};

const CATEGORIES = [
  { key: 'All', icon: 'apps-outline' as const },
  { key: 'Furniture', icon: 'bed-outline' as const },
  { key: 'Electronics', icon: 'laptop-outline' as const },
  { key: 'Books', icon: 'book-outline' as const },
  { key: 'Clothing', icon: 'shirt-outline' as const },
  { key: 'Kitchen', icon: 'restaurant-outline' as const },
  { key: 'Bedding', icon: 'moon-outline' as const },
  { key: 'Sports', icon: 'basketball-outline' as const },
  { key: 'Other', icon: 'ellipsis-horizontal' as const },
];

function ProductCard({ item }: { item: Listing }) {
  const router = useRouter();
  const locationLabel = item.hall || 'Campus';
  const photoUri = item.photos?.[0];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/listing/${item.id}`)}
    >
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImageFallback]}>
          <Ionicons name="image-outline" size={32} color="#9ca3af" />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>${item.price}</Text>
          <View style={styles.locationPill}>
            <Ionicons name="location" size={10} color="#1f2d4d" />
            <Text style={styles.locationPillText} numberOfLines={1}>{locationLabel}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchText, setSearchText] = useState('');
    const [blockedIds, setBlockedIds] = useState<string[]>([]);
const { blockUser } = useBlockUser(user?.uid ?? '');
const [savedIds, setSavedIds] = useState<string[]>([]);
const [showSaved, setShowSaved] = useState(false);
useEffect(() => {
  if (!user) return;
  const q = query(collection(db, 'saves'), where('userId', '==', user.uid));
  const unsub = onSnapshot(q, (snap) => {
    setSavedIds(snap.docs.map(d => d.data().listingId));
  });
  return () => unsub();
}, [user]);

const handleToggleSave = async (listingId: string) => {
  if (!user) return;
  const saveId = `${user.uid}_${listingId}`;
  const saveRef = doc(db, 'saves', saveId);
  if (savedIds.includes(listingId)) {
    await deleteDoc(saveRef);
  } else {
    await setDoc(saveRef, { userId: user.uid, listingId, createdAt: serverTimestamp() });
  }
};

const displayedListings = showSaved
  ? listings.filter(item => savedIds.includes(item.id))
  : listings;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  useEffect(() => {
    if (!user) return;

    let unsubReports: () => void;
    let unsubListings: () => void;

    const listingsQuery = query(
      collection(db, 'listings'),
      where('sold', '==', false),
      orderBy('createdAt', 'desc')
    );

    unsubListings = onSnapshot(listingsQuery, (snap) => {
      const allListings = snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as Listing));

      const reportsQuery = query(
        collection(db, 'reports'),
        where('reportedBy', '==', user.uid)
      );

      unsubReports = onSnapshot(reportsQuery, (reportSnap) => {
        const reportedIds = reportSnap.docs.map(doc => doc.data().listingId);
        const filtered = allListings.filter(item => !reportedIds.includes(item.id));
        setListings(filtered);
        setLoading(false);
      });
    }, (error) => {
      console.error('Query failed: ', error);
      setLoading(false);
    });

    return () => {
      if (unsubListings) unsubListings();
      if (unsubReports) unsubReports();
    };
  }, [user]);

  const filteredListings = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return listings.filter(l => {
      if (activeCategory !== 'All' && l.category !== activeCategory) return false;
      if (q && !l.title?.toLowerCase().includes(q) && !l.description?.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [listings, searchText, activeCategory]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
        <ActivityIndicator size="large" color="#1f2d4d" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <ProductCard item={item} />}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.brand}>Dormify</Text>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#9ca3af" />
                <TextInput
                  placeholder="Search Marketplace"
                  placeholderTextColor="#9ca3af"
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options-outline" size={20} color="#1f2d4d" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map(cat => {
                const active = cat.key === activeCategory;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setActiveCategory(cat.key)}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={22}
                      color={active ? '#1f2d4d' : '#6b7280'}
                    />
                    <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                      {cat.key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1f2d4d"
            colors={['#1f2d4d']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIllustration}>{showSaved ? '❤️' : '🏠'}</Text>
            <Text style={styles.emptyTitle}>
        {showSaved ? 'No saved listings yet' : "Your school's Dormify\nseems to be empty..."}
      </Text>
            <Text style={styles.emptySubtext}>Be the first to post a listing{'\n'}and get things moving!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  feed: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  brand: {
    fontSize: 38,
    fontWeight: '700',
    color: '#f61cc7',
    fontFamily: 'Georgia',
    marginTop: 8,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    gap: 10,
    paddingVertical: 4,
    paddingBottom: 16,
  },
  categoryChip: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  categoryChipActive: {
    borderColor: '#1f2d4d',
    borderWidth: 2,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: '#1f2d4d',
    fontWeight: '700',
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
  },
  cardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2d4d',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 100,
  },
  locationPillText: {
    fontSize: 11,
    color: '#1f2d4d',
    fontWeight: '600',
  },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyIllustration: { fontSize: 64, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', textAlign: 'center', lineHeight: 26 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
});

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
import { backfillEntriesIfNeeded } from '../../services/raffle';
import { useAppTheme } from '../../theme';

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

function ProductCard({ item, theme }: { item: Listing; theme: ReturnType<typeof useAppTheme>['theme'] }) {
  const router = useRouter();
  const locationLabel = item.hall || 'Campus';
  const photoUri = item.photos?.[0];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface }]}
      activeOpacity={0.9}
      onPress={() => router.push(`/listing/${item.id}`)}
    >
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImageFallback, { backgroundColor: theme.surfaceMuted }]}>
          <Ionicons name="image-outline" size={32} color={theme.textMuted} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.cardPrice, { color: theme.primary }]}>${item.price}</Text>
          <View style={[styles.locationPill, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="location" size={10} color={theme.primary} />
            <Text style={[styles.locationPillText, { color: theme.primary }]} numberOfLines={1}>{locationLabel}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const router = useRouter();
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
const { theme } = useAppTheme();
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
    if (!user?.uid) return;
    backfillEntriesIfNeeded(user.uid).catch(() => {});
  }, [user?.uid]);

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <ProductCard item={item} theme={theme} />}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={[styles.brand, { color: theme.accent }]}>Obo</Text>

            <TouchableOpacity
              style={styles.raffleBanner}
              activeOpacity={0.9}
              onPress={() => router.push('/modal/raffle')}
            >
              <View style={styles.raffleBannerIcon}>
                <Ionicons name="ticket-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.raffleBannerTitle}>Win a MacBook</Text>
                <Text style={styles.raffleBannerSub}>Sign up + post + invite friends to enter</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.searchRow}>
              <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="search" size={18} color={theme.textMuted} />
                <TextInput
                  placeholder="Search Marketplace"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.searchInput, { color: theme.text }]}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="options-outline" size={20} color={theme.primary} />
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
                    style={[
                      styles.categoryChip,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      active && [styles.categoryChipActive, { borderColor: theme.primary }]
                    ]}
                    onPress={() => setActiveCategory(cat.key)}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={22}
                      color={active ? theme.primary : theme.textMuted}
                    />
                    <Text style={[styles.categoryLabel, { color: theme.textMuted }, active && [styles.categoryLabelActive, { color: theme.primary }]]}>
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
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIllustration}>{showSaved ? '❤️' : '🏠'}</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {showSaved ? 'No saved listings yet' : "Your school's Obo\nseems to be empty..."}
      </Text>
            <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>Be the first to post a listing{'\n'}and get things moving!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  feed: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  raffleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1f2d4d', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
  },
  raffleBannerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  raffleBannerTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  raffleBannerSub: { color: '#cbd5e1', fontSize: 12, marginTop: 1 },
  brand: {
    fontSize: 38,
    fontWeight: '700',
    color: '#e80000',
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

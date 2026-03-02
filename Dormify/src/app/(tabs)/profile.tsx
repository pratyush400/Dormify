// src/app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useUser } from '@/hooks/useUser';

type Listing = {
  id: string;
  title: string;
  price: number;
  photos: string[];
  condition: string;
  sold: boolean;
};

function MyListingCard({ item }: { item: Listing }) {
  return (
    <TouchableOpacity style={styles.listingCard} activeOpacity={0.85}>
      <Image
        source={{ uri: item.photos?.[0] || 'https://picsum.photos/seed/placeholder/300/200' }}
        style={styles.listingImage}
      />
      {item.sold && (
        <View style={styles.soldOverlay}>
          <Text style={styles.soldText}>Sold</Text>
        </View>
      )}
      <View style={styles.listingInfo}>
        <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.listingPrice}>${item.price}</Text>
        <View style={[styles.conditionBadge, item.condition === 'new' ? styles.newBadge : styles.usedBadge]}>
          <Text style={styles.conditionText}>{item.condition === 'new' ? 'New' : 'Used'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'listings'),
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
    });
    return () => unsub();
  }, [user]);

  const activeListings = listings.filter(l => !l.sold);
  const soldListings = listings.filter(l => l.sold);
  const displayed = activeTab === 'active' ? activeListings : soldListings;

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => router.push('/modal/edit-profile')}>
            <Ionicons name="create-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user?.avatarUrl || 'https://i.pravatar.cc/200?img=12' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.avatarEditBtn} onPress={() => router.push('/modal/edit-profile')}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.fullName}>{user?.fname} {user?.lname}</Text>
          <Text style={styles.username}>@{user?.username}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#9ca3af" />
            <Text style={styles.infoText}>{user?.hall || 'No hall set'} · {user?.college}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={14} color="#9ca3af" />
            <Text style={styles.infoText}>{user?.email}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{activeListings.length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{soldListings.length}</Text>
              <Text style={styles.statLabel}>Sold</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{listings.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              Active ({activeListings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sold' && styles.tabActive]}
            onPress={() => setActiveTab('sold')}
          >
            <Text style={[styles.tabText, activeTab === 'sold' && styles.tabTextActive]}>
              Sold ({soldListings.length})
            </Text>
          </TouchableOpacity>
        </View>

        {displayed.length > 0 ? (
          <View style={styles.grid}>
            {displayed.map(item => <MyListingCard key={item.id} item={item} />)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{activeTab === 'active' ? '🛋️' : '🏷️'}</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active' ? 'No active listings' : 'Nothing sold yet'}
            </Text>
            {activeTab === 'active' && (
              <TouchableOpacity style={styles.sellNowBtn} onPress={() => router.push('/(tabs)/sell')}>
                <Text style={styles.sellNowText}>Post a Listing</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  profileCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 24,
    padding: 24, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  avatarContainer: { position: 'relative', marginBottom: 8 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#6366f1' },
  avatarEditBtn: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#6366f1', borderRadius: 12,
    width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  fullName: { fontSize: 22, fontWeight: '700', color: '#111827' },
  username: { fontSize: 14, color: '#6366f1', fontWeight: '600', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13, color: '#6b7280' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f3f4f6', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 24,
    marginTop: 12, width: '100%', justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  statDivider: { width: 1, height: 30, backgroundColor: '#e5e7eb' },
  tabsContainer: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: '#fff', borderRadius: 14, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  listingCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  listingImage: { width: '100%', height: 120 },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', height: 120,
  },
  soldText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  listingInfo: { padding: 10, gap: 4 },
  listingTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
  listingPrice: { fontSize: 15, fontWeight: '700', color: '#6366f1' },
  conditionBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  newBadge: { backgroundColor: '#dcfce7' },
  usedBadge: { backgroundColor: '#fef3c7' },
  conditionText: { fontSize: 10, fontWeight: '700', color: '#374151' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  sellNowBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  sellNowText: { color: '#fff', fontWeight: '600' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 24,
    padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#fecaca', backgroundColor: '#fff',
  },
  signOutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
// src/app/(tabs)/profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from '../../hooks/useUser';
import { auth, db } from '../../services/firebase';
import { sendRebrandNotificationToAllUsers } from '../../services/notifications';
import { useAppTheme } from '../../theme';
type Listing = {
  id: string;
  title: string;
  price: number;
  photos: string[];
  condition: string;
  sold: boolean;
};



function MyListingCard({ item }: { item: Listing }) {
  const router = useRouter();
  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'listings', item.id));
          }
        }
      ]
    );
  };
  return (
    <TouchableOpacity style={styles.listingCard} activeOpacity={0.85} onPress={() => router.push(`/listing/${item.id}`)}>
      <Image
        source={{ uri: item.photos?.[0] || 'error.jpeg' }}
        style={styles.listingImage}
      />
      {item.sold && (
        <View style={styles.soldOverlay}>
          <Text style={styles.soldText}>Sold</Text>
        </View>
      )}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={14} color="#fff" />
      </TouchableOpacity>
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
  const { theme, themeMode, toggleTheme } = useAppTheme();
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [isSendingRebrandPush, setIsSendingRebrandPush] = useState(false);

  const [refreshTick, setRefreshTick] = useState(0);
const [refreshing, setRefreshing] = useState(false);

const onRefresh = () => {
  setRefreshing(true);
  setRefreshTick(t => t + 1);
};

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'listings'),
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
      setRefreshing(false);
    });
    return () => unsub();
  }, [user, refreshTick]);

  const activeListings = listings.filter(l => !l.sold);
  const soldListings = listings.filter(l => l.sold);
  const displayed = activeTab === 'active' ? activeListings : soldListings;
const DEFAULT_AVATAR = require('@/assets/images/davatar.jpg');
  const canBroadcastRebrand = __DEV__ || user?.email === 'pratyushjha@lclark.edu';
  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/(auth)/login');
  };
  const handleDeleteAccount = () => {
  Alert.alert(
    'Delete Account',
    'This will permanently delete your account, listings, and all data. This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => promptReauthAndDelete(),
      },
    ]
  );
};

const handleBroadcastRebrand = async () => {
  setIsSendingRebrandPush(true);
  try {
    const sentCount = await sendRebrandNotificationToAllUsers(user?.uid);
    Alert.alert('Obo push sent', `Sent the rebrand notification to ${sentCount} devices.`);
  } catch {
    Alert.alert('Error', 'Could not send the rebrand push.');
  } finally {
    setIsSendingRebrandPush(false);
  }
};

const promptReauthAndDelete = () => {
  Alert.prompt(
    'Confirm Password',
    'Enter your password to confirm account deletion.',
    async (password) => {
      if (!password || !user) return;
      try {
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(auth.currentUser!, credential);

        // Delete all their listings
        const listingsSnap = await getDocs(
          query(collection(db, 'listings'), where('sellerId', '==', user.uid))
        );
        await Promise.all(listingsSnap.docs.map(d => deleteDoc(d.ref)));

        // Delete their chats
        const chatsSnap = await getDocs(
          query(collection(db, 'chats'), where('participants', 'array-contains', user.uid))
        );
        await Promise.all(chatsSnap.docs.map(d => deleteDoc(d.ref)));

        // Delete their Firestore user document
        await deleteDoc(doc(db, 'users', user.uid));

        // Delete the Firebase Auth account — must be last
        await deleteUser(auth.currentUser!);

        router.replace('/(auth)/login');
      } catch (e: any) {
        if (e.code === 'auth/wrong-password') {
          Alert.alert('Wrong Password', 'The password you entered is incorrect.');
        } else {
          Alert.alert('Error', e.message);
        }
      }
    },
    'secure-text'
  );
};

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }
  

return (
  <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/modal/edit-profile')}>
          <Ionicons name="create-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.avatarUrl || DEFAULT_AVATAR }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.avatarEditBtn} onPress={() => router.push('/modal/edit-profile')}>
            <Ionicons name="camera" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.fullName, { color: theme.text }]}>{user?.fname} {user?.lname}</Text>
        <Text style={[styles.username, { color: theme.accent }]}>@{user?.username}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color={theme.textMuted} />
          <Text style={[styles.infoText, { color: theme.textMuted }]}>{user?.hall || 'No hall set'} · {user?.college}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={14} color={theme.textMuted} />
          <Text style={[styles.infoText, { color: theme.textMuted }]}>{user?.email}</Text>
        </View>
        <View style={[styles.statsRow, { backgroundColor: theme.surfaceMuted }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{activeListings.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Active</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{soldListings.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Sold</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: theme.text }]}>{listings.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total</Text>
          </View>
        </View>
      </View>

      <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
        <View>
          <Text style={[styles.settingsTitle, { color: theme.text }]}>Appearance</Text>
          <Text style={[styles.settingsSubtext, { color: theme.textMuted }]}>
            Dark mode is currently {themeMode === 'system' ? `following system (${theme.mode})` : themeMode}.
          </Text>
        </View>
        <TouchableOpacity style={[styles.themeToggleBtn, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]} onPress={toggleTheme}>
          <Ionicons name={themeMode === 'dark' ? 'moon' : 'sunny'} size={18} color={theme.primary} />
          <Text style={[styles.themeToggleText, { color: theme.text }]}>
            Switch to {themeMode === 'dark' ? 'light' : 'dark'}
          </Text>
        </TouchableOpacity>
      </View>

      {canBroadcastRebrand ? (
        <TouchableOpacity
          style={[styles.broadcastBtn, { backgroundColor: theme.primary }]}
          onPress={handleBroadcastRebrand}
          disabled={isSendingRebrandPush}
        >
          {isSendingRebrandPush ? <ActivityIndicator color="#fff" /> : <Text style={styles.broadcastText}>Send Obo update push</Text>}
        </TouchableOpacity>
      ) : null}

      <View style={[styles.tabsContainer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: theme.surface }, activeTab === 'active' && [styles.tabActive, { backgroundColor: theme.primary }]]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, { color: theme.textMuted }, activeTab === 'active' && styles.tabTextActive]}>
            Active ({activeListings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: theme.surface }, activeTab === 'sold' && [styles.tabActive, { backgroundColor: theme.primary }]]}
          onPress={() => setActiveTab('sold')}
        >
          <Text style={[styles.tabText, { color: theme.textMuted }, activeTab === 'sold' && styles.tabTextActive]}>
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
          <Text style={[styles.emptyText, { color: theme.text }]}>
            {activeTab === 'active' ? 'No active listings' : 'Nothing sold yet'}
          </Text>
          {activeTab === 'active' && (
            <TouchableOpacity style={[styles.sellNowBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/(tabs)/sell')}>
              <Text style={styles.sellNowText}>Post a Listing</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Delete Account */}
      <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
        <Ionicons name="trash-outline" size={18} color="#d02942" />
        <Text style={styles.deleteAccountText}>Delete Account</Text>
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
  settingsCard: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  settingsTitle: { fontSize: 16, fontWeight: '700' },
  settingsSubtext: { fontSize: 13, lineHeight: 18 },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  themeToggleText: { fontSize: 14, fontWeight: '600' },
  broadcastBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  broadcastText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
  deleteBtn: {
  position: 'absolute', top: 6, right: 6,
  backgroundColor: 'rgba(239,68,68,0.85)',
  borderRadius: 8, padding: 5,
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
  deleteAccountBtn: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  gap: 8, marginHorizontal: 16, marginTop: 12,
  padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
},
deleteAccountText: {
  color: '#de2841', fontWeight: '600', fontSize: 15,
},
});

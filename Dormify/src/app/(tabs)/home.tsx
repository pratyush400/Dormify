import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/services/firebase';
import { collection, onSnapshot, orderBy, query, where, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useUser } from '@/hooks/useUser';

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
  sold: boolean;
};

function ListingCard({ item, currentUserId }: { item: Listing; currentUserId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

const handleMessageSeller = async () => {
  if (!currentUserId) return Alert.alert('Login Required', 'Please log in to message sellers.');
  if (currentUserId === item.sellerId) return Alert.alert('Note', 'This is your own listing!');

  try {
    const existing = await getDocs(query(
      collection(db, 'chats'),
      where('listingId', '==', item.id),
      where('participants', 'array-contains', currentUserId)
    ));

    let chatId: string;

    if (!existing.empty) {
      chatId = existing.docs[0].id;
    } else {
      const chatDoc = await addDoc(collection(db, 'chats'), {
        buyerId: currentUserId,
        sellerId: item.sellerId,
        participants: [currentUserId, item.sellerId],
        listingId: item.id,
        listingTitle: item.title,
        listingImage: item.photos?.[0] || '',
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unreadCount: { [currentUserId]: 0, [item.sellerId]: 0 },
        sellerName: item.sellerName,
        sellerAvatar: item.sellerAvatar,
        createdAt: serverTimestamp(),
      });
      chatId = chatDoc.id;
    }

    router.push({
      pathname: '/modal/chat',
      params: {
        chatId,
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        sellerAvatar: item.sellerAvatar,
        listingTitle: item.title,
        listingImage: item.photos?.[0] || '',
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    Alert.alert('Error', 'Could not open chat.');
  }
};

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.photos?.[0] || 'https://picsum.photos/seed/placeholder/600/400' }}
          style={styles.image}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={() => setSaved(!saved)}>
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={20}
            color={saved ? '#ef4444' : '#fff'}
          />
        </TouchableOpacity>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>${item.price}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.sellerRow}>
          <Image
    source={item.sellerAvatar ? { uri: item.sellerAvatar } : require('@/assets/images/davatar.jpg')}
    style={styles.avatar}
  />
          <View>
            <Text style={styles.sellerName}>{item.sellerName}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={11} color="#9ca3af" />
              <Text style={styles.locationText}>{item.hall} · {item.college}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        <TouchableOpacity style={styles.messageBtn} onPress={handleMessageSeller}>
          <Ionicons name="chatbubble-outline" size={14} color="#6366f1" />
          <Text style={styles.messageBtnText}>Message Seller</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      where('sold', '==', false),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
      setLoading(false);
    }, (error) => {
      console.error('Query failed: ', error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dormify</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCard item={item} currentUserId={user?.uid ?? ''} />}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIllustration}>🏠</Text>
            <Text style={styles.emptyTitle}>Your school's Dormify{'\n'}seems to be empty...</Text>
            <Text style={styles.emptySubtext}>Be the first to post a listing{'\n'}and get things moving!</Text>
          </View>
        }
      />
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#15c5e8' },
  feed: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 200 },
  saveBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, padding: 6,
  },
  priceBadge: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: '#73de2d', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  priceText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardBody: { padding: 16, gap: 8 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  sellerName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  locationText: { fontSize: 11, color: '#9ca3af' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  description: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: '#f58b28',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4,
  },
  messageBtnText: { color: '#f1449d', fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 12, paddingHorizontal: 40 },
  emptyIllustration: { fontSize: 64, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', textAlign: 'center', lineHeight: 26 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
});
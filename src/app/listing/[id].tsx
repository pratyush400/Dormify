import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useUser } from '../../hooks/useUser';

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  photos: string[];
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  hall: string;
  college: string;
  condition: string;
  category: string;
  sold: boolean;
};

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'listings', id), (snap) => {
      if (snap.exists()) {
        setListing({ id: snap.id, ...snap.data() } as Listing);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id]);

  const handleMessageSeller = async () => {
    if (!user) return Alert.alert('Login Required', 'Please log in to message sellers.');
    if (user.uid === listing?.sellerId) return Alert.alert('Note', 'This is your own listing!');

    try {
      const existing = await getDocs(query(
        collection(db, 'chats'),
        where('listingId', '==', id),
        where('participants', 'array-contains', user.uid)
      ));

      let chatId: string;

      if (!existing.empty) {
        chatId = existing.docs[0].id;
      } else {
        const chatDoc = await addDoc(collection(db, 'chats'), {
          buyerId: user.uid,
          sellerId: listing?.sellerId,
          participants: [user.uid, listing?.sellerId],
          listingId: id,
          listingTitle: listing?.title,
          listingImage: listing?.photos?.[0] || '',
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          unreadCount: { [user.uid]: 0, [listing?.sellerId ?? '']: 0 },
          sellerName: listing?.sellerName,
          sellerAvatar: listing?.sellerAvatar,
          createdAt: serverTimestamp(),
        });
        chatId = chatDoc.id;
      }

      router.push({
        pathname: '/modal/chat',
        params: {
          chatId,
          sellerId: listing?.sellerId ?? '',
          sellerName: listing?.sellerName ?? '',
          sellerAvatar: listing?.sellerAvatar ?? '',
          listingTitle: listing?.title ?? '',
          listingImage: listing?.photos?.[0] ?? '',
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Could not open chat.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Listing not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{listing.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photos */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: listing.photos?.[currentPhoto] }}
            style={styles.mainPhoto}
          />
          {listing.photos?.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
              {listing.photos.map((photo, i) => (
                <TouchableOpacity key={i} onPress={() => setCurrentPhoto(i)}>
                  <Image
                    source={{ uri: photo }}
                    style={[styles.thumbnail, currentPhoto === i && styles.thumbnailActive]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.body}>
          {/* Price + condition */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>${listing.price}</Text>
            <View style={[styles.conditionBadge, listing.condition === 'New' ? styles.newBadge : styles.usedBadge]}>
              <Text style={styles.conditionText}>{listing.condition}</Text>
            </View>
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.category}>{listing.category}</Text>

          {/* Seller */}
          <View style={styles.sellerCard}>
            <Image
              source={listing.sellerAvatar ? { uri: listing.sellerAvatar } : undefined}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{listing.sellerName}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#9ca3af" />
                <Text style={styles.locationText}>{listing.hall} · {listing.college}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {listing.description ? (
            <View style={styles.descSection}>
              <Text style={styles.descLabel}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {user?.uid !== listing.sellerId && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.messageBtn} onPress={handleMessageSeller}>
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            <Text style={styles.messageBtnText}>Message Seller</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  photoContainer: { backgroundColor: '#fff' },
  mainPhoto: { width: '100%', height: 300 },
  thumbnailRow: { paddingHorizontal: 16, paddingVertical: 12 },
  thumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 8, opacity: 0.6 },
  thumbnailActive: { opacity: 1, borderWidth: 2, borderColor: '#6366f1' },
  body: { padding: 20, gap: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 28, fontWeight: '700', color: '#111827' },
  conditionBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  newBadge: { backgroundColor: '#dcfce7' },
  usedBadge: { backgroundColor: '#fef3c7' },
  conditionText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  category: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  sellerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6' },
  sellerName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 12, color: '#9ca3af' },
  descSection: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  descLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  description: { fontSize: 15, color: '#6b7280', lineHeight: 22 },
  footer: {
    padding: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6366f1', borderRadius: 14, padding: 16,
  },
  messageBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
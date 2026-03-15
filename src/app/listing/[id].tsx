import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { useUser } from '../../hooks/useUser';
import { Modal } from 'react-native';
import { collection, onSnapshot, orderBy, query, where, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
const [photoVisible, setPhotoVisible] = useState(false);
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
    console.log('user.uid:', user.uid);
    console.log('listing.sellerId:', listing?.sellerId);
    console.log('listing.id:', id);

const chatId = `${user.uid}_${listing?.sellerId}`;
    console.log('chatId:', chatId);

    const chatRef = doc(db, 'chats', chatId);
    console.log('chatRef created');

    const chatSnap = await getDoc(chatRef);
    console.log('chatSnap exists:', chatSnap.exists());

    if (!chatSnap.exists()) {
      console.log('CREATING CHAT WITH ID:', chatId);
      await setDoc(chatRef, {
        buyerId: user.uid,
        buyerName: `${user.fname} ${user.lname}`,
        buyerAvatar: user.avatarUrl || '',
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
      console.log('chat created successfully');
    }

    console.log('navigating to chat...');
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

  } catch (error: any) {
    console.error('FULL ERROR:', JSON.stringify(error));
    console.error('code:', error.code);
    console.error('message:', error.message);
    Alert.alert('Error', `${error.code}: ${error.message}`);
  }
};

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0ce9f5" />
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{listing.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.photoContainer}>
          <TouchableOpacity onPress={() => setPhotoVisible(true)} activeOpacity={0.95}>
          <Image
            source={{ uri: listing.photos?.[currentPhoto] }}
            style={styles.mainPhoto}
          />
          </TouchableOpacity>
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
          <View style={styles.priceRow}>
            <Text style={styles.price}>${listing.price}</Text>
            <View style={[styles.conditionBadge, listing.condition === 'New' ? styles.newBadge : styles.usedBadge]}>
              <Text style={styles.conditionText}>{listing.condition}</Text>
            </View>
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.category}>{listing.category}</Text>

        <TouchableOpacity
            onPress={() => router.push({
            pathname: '/modal/view-profile',
            params: {
            uid: listing.sellerId,       
            name: listing.sellerName,     // ← missing
            avatar: listing.sellerAvatar, // ← missing
            }
            })}
            >
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
          </TouchableOpacity>

          {listing.description ? (
            <View style={styles.descSection}>
              <Text style={styles.descLabel}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {user?.uid !== listing.sellerId && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.messageBtn} onPress={handleMessageSeller}>
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            <Text style={styles.messageBtnText}>Message Seller</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal visible={photoVisible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <TouchableOpacity
      style={styles.modalClose}
      onPress={() => setPhotoVisible(false)}
    >
      <Ionicons name="close" size={28} color="#fff" />
    </TouchableOpacity>

    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      contentOffset={{ x: currentPhoto * 400, y: 0 }}
    >
      {listing.photos.map((photo, i) => (
        <Image
          key={i}
          source={{ uri: photo }}
          style={styles.fullPhoto}
          resizeMode="contain"
        />
      ))}
    </ScrollView>
  </View>
</Modal>
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
  thumbnailActive: { opacity: 1, borderWidth: 2, borderColor: '#07c9ff' },
  body: { padding: 20, gap: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 28, fontWeight: '700', color: '#111827' },
  conditionBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  newBadge: { backgroundColor: '#dcfce7' },
  usedBadge: { backgroundColor: '#fef3c7' },
  conditionText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  category: { fontSize: 13, color: '#ed9714', fontWeight: '600' },
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
    backgroundColor: '#25a8fa', borderRadius: 14, padding: 16,
  },
  messageBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.95)',
  justifyContent: 'center',
},
modalClose: {
  position: 'absolute',
  top: 60,
  right: 20,
  zIndex: 10,
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderRadius: 20,
  padding: 8,
},
fullPhoto: {
  width: 450,
  height: '100%',
},
});
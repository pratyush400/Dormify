import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
const router = useRouter();
const MOCK_LISTINGS = [
  {
    id: '1',
    title: 'IKEA Desk Lamp',
    description: 'White, barely used. Perfect for dorm studying.',
    price: 12,
    image: 'https://picsum.photos/seed/lamp/600/400',
    seller: { name: 'Maya R.', avatar: 'https://i.pravatar.cc/100?img=1' },
    hall: 'Copeland Hall',
    college: 'Lewis & Clark College',
  },
  {
    id: '2',
    title: 'Twin XL Mattress Topper',
    description: 'Memory foam, used one semester. Clean and fresh.',
    price: 35,
    image: 'https://picsum.photos/seed/mattress/600/400',
    seller: { name: 'Jake T.', avatar: 'https://i.pravatar.cc/100?img=2' },
    hall: 'Akin Hall',
    college: 'Lewis & Clark College',
  },
  {
    id: '3',
    title: 'Calculus Textbook',
    description: 'Stewart Calculus 8th edition. Some highlights.',
    price: 20,
    image: 'https://picsum.photos/seed/book/600/400',
    seller: { name: 'Priya K.', avatar: 'https://i.pravatar.cc/100?img=3' },
    hall: 'Forest Hall',
    college: 'Lewis & Clark College',
  },
  {
    id: '4',
    title: 'Mini Fridge',
    description: 'Black, 1.7 cu ft. Works perfectly, moving out sale.',
    price: 55,
    image: 'https://picsum.photos/seed/fridge/600/400',
    seller: { name: 'Carlos M.', avatar: 'https://i.pravatar.cc/100?img=4' },
    hall: 'Odell Hall',
    college: 'Lewis & Clark College',
  },
  {
    id: '5',
    title: 'Desk Chair',
    description: 'Adjustable height, comfy for long study sessions.',
    price: 40,
    image: 'https://picsum.photos/seed/chair/600/400',
    seller: { name: 'Sophie L.', avatar: 'https://i.pravatar.cc/100?img=5' },
    hall: 'Stewart Hall',
    college: 'Lewis & Clark College',
  },
];

type Listing = typeof MOCK_LISTINGS[0];

function ListingCard({ item }: { item: Listing }) {
  const [saved, setSaved] = useState(false);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
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
          <Image source={{ uri: item.seller.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.sellerName}>{item.seller.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={11} color="#9ca3af" />
              <Text style={styles.locationText}>{item.hall} · {item.college}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>


<TouchableOpacity
  style={styles.messageBtn}
  onPress={() => router.push({
    pathname: '/modal/chat',
    params: {
      chatId: item.id,
      sellerName: item.seller.name,
      sellerAvatar: item.seller.avatar,
      listingTitle: item.title,
      listingImage: item.image,
    }
  })}
>
  <Ionicons name="chatbubble-outline" size={14} color="#6366f1" />
  <Text style={styles.messageBtnText}>Message Seller</Text>
</TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dormify</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_LISTINGS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCard item={item} />}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6366f1',
  },
  feed: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  saveBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 6,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priceText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  sellerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  messageBtnText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
  },
});
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  Image, TouchableOpacity, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useUser } from '@/hooks/useUser';

type Chat = {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  lastMessage: string;
  lastMessageTime: any;
  participants: string[];
  unreadCount: Record<string, number>;
  sellerName?: string;
  sellerAvatar?: string;
  buyerName?: string;
  buyerAvatar?: string;
};

function timeAgo(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat)));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount?.[user?.uid ?? ''] ?? 0), 0);

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
        <Text style={styles.headerTitle}>Chats</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>
      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isSellerMe = item.sellerId === user?.uid;
          const otherName = isSellerMe ? (item.buyerName ?? 'Buyer') : (item.sellerName ?? 'Seller');
          const otherAvatar = isSellerMe ? (item.buyerAvatar ?? '') : (item.sellerAvatar ?? '');
          const unread = item.unreadCount?.[user?.uid ?? ''] ?? 0;

          return (
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => router.push({
                pathname: '/modal/chat',
                params: {
                  chatId: item.id,
                  sellerId: item.sellerId,
                  sellerName: item.sellerName ?? '',
                  sellerAvatar: item.sellerAvatar ?? '',
                  listingTitle: item.listingTitle,
                  listingImage: item.listingImage,
                }
              })}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: otherAvatar || 'https://i.pravatar.cc/100' }}
                style={styles.avatar}
              />
              <View style={styles.chatContent}>
                <View style={styles.chatTop}>
                  <Text style={styles.sellerName}>{otherName}</Text>
                  <Text style={styles.timestamp}>{timeAgo(item.lastMessageTime)}</Text>
                </View>
                <Text style={styles.listingTitle} numberOfLines={1}>re: {item.listingTitle}</Text>
                <Text
                  style={[styles.lastMessage, unread > 0 && styles.lastMessageUnread]}
                  numberOfLines={1}
                >
                  {item.lastMessage || 'No messages yet'}
                </Text>
              </View>
              <View style={styles.chatRight}>
                {item.listingImage ? (
                  <Image source={{ uri: item.listingImage }} style={styles.listingThumb} />
                ) : null}
                {unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unread}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>Message a seller from a listing</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerBadge: {
    backgroundColor: '#6366f1', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  headerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  chatRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 12,
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  chatContent: { flex: 1, gap: 2 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sellerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  timestamp: { fontSize: 12, color: '#9ca3af' },
  listingTitle: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  lastMessage: { fontSize: 13, color: '#6b7280' },
  lastMessageUnread: { color: '#111827', fontWeight: '600' },
  chatRight: { alignItems: 'flex-end', gap: 6 },
  listingThumb: { width: 44, height: 44, borderRadius: 10 },
  unreadBadge: {
    backgroundColor: '#6366f1', borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 82 },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 13, color: '#9ca3af' },
});
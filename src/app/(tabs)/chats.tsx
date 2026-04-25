// src/app/(tabs)/chats.tsx
import { useRouter } from 'expo-router';
import {
  collection, deleteDoc, doc, getDoc,
  onSnapshot, query, where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from '../../hooks/useUser';
import { db } from '../../services/firebase';

type Chat = {
  id: string;
  participants: string[];
  participantInfo?: Record<string, { name: string; avatar: string }>;
  lastListingId?: string;
  lastListingTitle?: string;
  lastListingImage?: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: Record<string, number>;
  // legacy fields (older chats)
  buyerId?: string;
  sellerId?: string;
  listingTitle?: string;
  listingImage?: string;
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
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0); // ← triggers re-subscribe
  const DEFAULT_AVATAR = require('@/assets/images/davatar.jpg');

  useEffect(() => {
    if (!user) return;

    setLoading(prev => refreshTick === 0 ? true : prev); // only show full loader on first mount

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      const all = snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as Chat));

      const validityChecks = await Promise.all(
        all.map(async (chat) => {
          const otherId = chat.participants?.find(p => p !== user.uid);
          if (!otherId) return false;
          try {
            const userSnap = await getDoc(doc(db, 'users', otherId));
            return userSnap.exists();
          } catch {
            return false;
          }
        })
      );

      const valid = all.filter((_, i) => validityChecks[i]);

      // Dedupe by other participant — collapse legacy directional chats into one row
      const seen = new Map<string, Chat>();
      for (const chat of valid) {
        const otherId = chat.participants?.find(p => p !== user.uid) ?? chat.id;
        const existing = seen.get(otherId);
        if (!existing) {
          seen.set(otherId, chat);
        } else {
          const timeA = existing.lastMessageTime?.toDate?.() ?? new Date(0);
          const timeB = chat.lastMessageTime?.toDate?.() ?? new Date(0);
          if (timeB > timeA) seen.set(otherId, chat);
        }
      }

      const data = Array.from(seen.values()).sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() ?? new Date(0);
        const timeB = b.lastMessageTime?.toDate?.() ?? new Date(0);
        return timeB.getTime() - timeA.getTime();
      });

      setChats(data);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.log('Chats error:', error);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsub();
  }, [user, refreshTick]); // ← re-subscribe on refresh

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshTick(t => t + 1); // forces useEffect to re-run
  };

  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      'Delete Chat',
      'This will remove the conversation from your chats. The other person may still see it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'chats', chatId));
            } catch (e) {
              Alert.alert('Error', 'Could not delete chat.');
            }
          },
        },
      ]
    );
  };

  const totalUnread = chats.reduce(
    (sum, c) => sum + (c.unreadCount?.[user?.uid ?? ''] ?? 0), 0
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000000" />
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
          const otherId = item.participants?.find(p => p !== user?.uid)
            ?? (item.sellerId === user?.uid ? item.buyerId : item.sellerId)
            ?? '';
          const info = item.participantInfo?.[otherId];
          const isSellerMe = item.sellerId === user?.uid;
          const otherName =
            info?.name
            ?? (isSellerMe ? item.buyerName : item.sellerName)
            ?? 'Unknown';
          const otherAvatar =
            info?.avatar
            ?? (isSellerMe ? item.buyerAvatar : item.sellerAvatar)
            ?? '';
          const lastListingTitle = item.lastListingTitle ?? item.listingTitle ?? '';
          const lastListingImage = item.lastListingImage ?? item.listingImage ?? '';
          const lastListingId = item.lastListingId ?? '';
          const unread = item.unreadCount?.[user?.uid ?? ''] ?? 0;

          return (
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => router.push({
                pathname: '/modal/chat',
                params: {
                  chatId: item.id,
                  otherId,
                  otherName,
                  otherAvatar,
                  listingId: lastListingId,
                  listingTitle: lastListingTitle,
                  listingImage: lastListingImage,
                }
              })}
              onLongPress={() => handleDeleteChat(item.id)}
              activeOpacity={0.7}
            >
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/modal/view-profile',
                  params: {
                    uid: otherId,
                    name: otherName,
                    avatar: otherAvatar,
                  }
                })}
              >
                <Image
                  source={otherAvatar ? { uri: otherAvatar } : DEFAULT_AVATAR}
                  style={styles.avatar}
                />
              </TouchableOpacity>

              <View style={styles.chatContent}>
                <View style={styles.chatTop}>
                  <Text style={styles.sellerName}>{otherName}</Text>
                  <Text style={styles.timestamp}>{timeAgo(item.lastMessageTime)}</Text>
                </View>
                <Text
                  style={[styles.lastMessage, unread > 0 && styles.lastMessageUnread]}
                  numberOfLines={1}
                >
                  {item.lastMessage || 'No messages yet'}
                </Text>
              </View>

              <View style={styles.chatRight}>
                {lastListingImage ? (
                  <Image source={{ uri: lastListingImage }} style={styles.listingThumb} />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
          />
        }
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
    backgroundColor: '#16161d', borderRadius: 12,
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
  listingTitle: { fontSize: 12, color: '#10a5ea', fontWeight: '600' },
  lastMessage: { fontSize: 13, color: '#6b7280' },
  lastMessageUnread: { color: '#111827', fontWeight: '600' },
  chatRight: { alignItems: 'flex-end', gap: 6 },
  listingThumb: { width: 44, height: 44, borderRadius: 10 },
  unreadBadge: {
    backgroundColor: '#13dff6', borderRadius: 10,
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
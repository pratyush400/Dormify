import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  Image, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export const MOCK_CHATS = [
  {
    id: '1',
    sellerId: 'user_maya',
    sellerName: 'Maya R.',
    sellerAvatar: 'https://i.pravatar.cc/100?img=1',
    listingTitle: 'IKEA Desk Lamp',
    listingImage: 'https://picsum.photos/seed/lamp/600/400',
    lastMessage: 'Is this still available?',
    timestamp: '2m ago',
    unread: 2,
  },
  {
    id: '2',
    sellerId: 'user_jake',
    sellerName: 'Jake T.',
    sellerAvatar: 'https://i.pravatar.cc/100?img=2',
    listingTitle: 'Twin XL Mattress Topper',
    listingImage: 'https://picsum.photos/seed/mattress/600/400',
    lastMessage: 'Can you do $30?',
    timestamp: '1h ago',
    unread: 0,
  },
  {
    id: '3',
    sellerId: 'user_priya',
    sellerName: 'Priya K.',
    sellerAvatar: 'https://i.pravatar.cc/100?img=3',
    listingTitle: 'Calculus Textbook',
    listingImage: 'https://picsum.photos/seed/book/600/400',
    lastMessage: 'Sure, meet at Copeland?',
    timestamp: 'Yesterday',
    unread: 1,
  },
];

export default function ChatsScreen() {
  const router = useRouter();
  const totalUnread = MOCK_CHATS.reduce((sum, c) => sum + c.unread, 0);

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
        data={MOCK_CHATS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatRow}
            onPress={() => router.push({ pathname: '/modal/chat', params: { chatId: item.id, sellerName: item.sellerName, sellerAvatar: item.sellerAvatar, listingTitle: item.listingTitle, listingImage: item.listingImage } })}
            activeOpacity={0.7}
          >
            {/* Avatar */}
            <View>
              <Image source={{ uri: item.sellerAvatar }} style={styles.avatar} />
            </View>

            {/* Content */}
            <View style={styles.chatContent}>
              <View style={styles.chatTop}>
                <Text style={styles.sellerName}>{item.sellerName}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
              <Text style={styles.listingTitle} numberOfLines={1}>
                re: {item.listingTitle}
              </Text>
              <Text
                style={[styles.lastMessage, item.unread > 0 && styles.lastMessageUnread]}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
            </View>

            {/* Listing thumbnail + unread badge */}
            <View style={styles.chatRight}>
              <Image source={{ uri: item.listingImage }} style={styles.listingThumb} />
              {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
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
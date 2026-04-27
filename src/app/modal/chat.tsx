import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot, orderBy,
  query, serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView, Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUser } from '../../hooks/useUser';
import { db } from '../../services/firebase';

type ListingContext = {
  id: string;
  title: string;
  image: string;
};

type Message = {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  listing?: ListingContext;
};

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useUser();
  const {
    chatId,
    otherId,
    otherName,
    otherAvatar,
    listingId,
    listingTitle,
    listingImage,
  } = useLocalSearchParams<{
    chatId: string;
    otherId: string;
    otherName: string;
    otherAvatar: string;
    listingId?: string;
    listingTitle?: string;
    listingImage?: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);
  const DEFAULT_AVATAR = require('@/assets/images/davatar.jpg');
  const [input, setInput] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<any>(null);
  const [pendingListing, setPendingListing] = useState<ListingContext | null>(
    listingId ? { id: listingId, title: listingTitle ?? '', image: listingImage ?? '' } : null
  );

  const sendPushNotification = async (receiverId: string, senderName: string, message: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', receiverId));
      const token = userDoc.data()?.expoPushToken;
      if (!token) return;
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: token,
          title: senderName,
          body: message,
          sound: 'default',
          badge: 1,
        }),
      });
    } catch (e) {
      console.log('Push notification error:', e);
    }
  };

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ ...(d.data() as any), id: d.id } as Message)));
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    });

    if (user?.uid && chatId) {
      updateDoc(doc(db, 'chats', chatId), {
        [`unreadCount.${user.uid}`]: 0,
      });
    }

    return () => unsub();
  }, [chatId, user]);

  useEffect(() => {
    if (!otherId) return;
    const unsub = onSnapshot(doc(db, 'users', otherId), (snap) => {
      if (snap.exists()) {
        setIsOnline(snap.data().isOnline ?? false);
        setLastSeen(snap.data().lastSeen ?? null);
      }
    });
    return () => unsub();
  }, [otherId]);

  const getLastSeen = () => {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'Offline';
    const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !chatId) return;
    const text = input.trim();
    setInput('');

    const otherUserId = otherId ?? '';

    const messageDoc: any = {
      text,
      senderId: user.uid,
      createdAt: serverTimestamp(),
    };
    if (pendingListing && pendingListing.id) {
      messageDoc.listing = {
        id: pendingListing.id,
        title: pendingListing.title || '',
        image: pendingListing.image || '',
      };
    }

    await addDoc(collection(db, 'chats', chatId, 'messages'), messageDoc);

    const chatUpdate: any = {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
    };
    if (otherUserId) chatUpdate[`unreadCount.${otherUserId}`] = increment(1);
    if (pendingListing?.id) {
      chatUpdate.lastListingId = pendingListing.id;
      chatUpdate.lastListingTitle = pendingListing.title || '';
      chatUpdate.lastListingImage = pendingListing.image || '';
    }
    await updateDoc(doc(db, 'chats', chatId), chatUpdate);

    if (otherUserId) {
      await sendPushNotification(
        otherUserId,
        `${user.fname} ${user.lname}`,
        text
      );
    }

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Decide where to show the pending-listing banner above the composer:
  // only if the most recent message doesn't already reference it.
  const showPendingBanner = useMemo(() => {
    if (!pendingListing) return false;
    const lastWithListing = [...messages].reverse().find(m => m.listing?.id);
    return lastWithListing?.listing?.id !== pendingListing.id;
  }, [pendingListing, messages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Image
          source={otherAvatar ? { uri: otherAvatar } : DEFAULT_AVATAR}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherName}</Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#22c55e' : '#9ca3af' }]} />
            <Text style={styles.headerSub}>{getLastSeen()}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#04040d" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation!</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const mine = item.senderId === user?.uid;
              const prev = index > 0 ? messages[index - 1] : undefined;
              const showListingCard =
                !!item.listing?.id && item.listing.id !== prev?.listing?.id;
              return (
                <View>
                  {showListingCard && item.listing ? (
                    <TouchableOpacity
                      style={styles.listingPreview}
                      onPress={() => router.push(`/listing/${item.listing!.id}`)}
                      activeOpacity={0.85}
                    >
                      {item.listing.image ? (
                        <Image source={{ uri: item.listing.image }} style={styles.listingPreviewImage} />
                      ) : (
                        <View style={[styles.listingPreviewImage, styles.listingPreviewFallback]}>
                          <Ionicons name="image-outline" size={18} color="#9ca3af" />
                        </View>
                      )}
                      <View style={styles.listingPreviewInfo}>
                        <Text style={styles.listingPreviewLabel}>RE: LISTING</Text>
                        <Text style={styles.listingPreviewTitle} numberOfLines={1}>
                          {item.listing.title || 'Listing'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  ) : null}
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {showPendingBanner && pendingListing ? (
          <View style={styles.pendingBanner}>
            {pendingListing.image ? (
              <Image source={{ uri: pendingListing.image }} style={styles.pendingThumb} />
            ) : (
              <View style={[styles.pendingThumb, { backgroundColor: '#e5e7eb' }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingLabel}>Replying about</Text>
              <Text style={styles.pendingTitle} numberOfLines={1}>{pendingListing.title}</Text>
            </View>
            <TouchableOpacity onPress={() => setPendingListing(null)}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  messagesList: { padding: 16, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: '75%', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10, gap: 4,
  },
  bubbleMine: { backgroundColor: '#10112f', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#f3f4f6', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: '#111827' },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: '#9ca3af', alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  listingPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f3f4f6', borderRadius: 14,
    padding: 10, marginTop: 12, marginBottom: 4,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  listingPreviewImage: { width: 44, height: 44, borderRadius: 10 },
  listingPreviewFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb' },
  listingPreviewInfo: { flex: 1 },
  listingPreviewLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '700', letterSpacing: 0.5 },
  listingPreviewTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#eef2ff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  pendingThumb: { width: 36, height: 36, borderRadius: 8 },
  pendingLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  pendingTitle: { fontSize: 13, fontWeight: '700', color: '#1f2d4d' },
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#111827', maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#1fbded', justifyContent: 'center', alignItems: 'center',
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  headerSub: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  sendBtnDisabled: { backgroundColor: '#c7d2fe' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 13, color: '#9ca3af' },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, SafeAreaView, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, addDoc, onSnapshot, orderBy,
  query, serverTimestamp, doc, updateDoc, increment,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useUser } from '../../hooks/useUser';

type Message = {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
};

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { chatId, sellerId, sellerName, sellerAvatar, listingTitle, listingImage } =
    useLocalSearchParams<{
      chatId: string;
      sellerId: string;
      sellerName: string;
      sellerAvatar: string;
      listingTitle: string;
      listingImage: string;
    }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    });

    // Reset unread count for current user when opening chat
    if (user?.uid && chatId) {
      updateDoc(doc(db, 'chats', chatId), {
        [`unreadCount.${user.uid}`]: 0,
      });
    }

    return () => unsub();
  }, [chatId, user]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !chatId) return;
    const text = input.trim();
    setInput('');

    const otherUserId = user.uid === sellerId ? '' : sellerId;

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text,
      senderId: user.uid,
      createdAt: serverTimestamp(),
      id: '',
    });

    // Update chat metadata
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${otherUserId}`]: increment(1),
    });

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Image
          source={{ uri: sellerAvatar || 'https://i.pravatar.cc/100' }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{sellerName}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>re: {listingTitle}</Text>
        </View>
        {listingImage ? (
          <Image source={{ uri: listingImage }} style={styles.listingThumb} />
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6366f1" />
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
            renderItem={({ item }) => {
              const mine = item.senderId === user?.uid;
              return (
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              );
            }}
          />
        )}

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
  headerSub: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  listingThumb: { width: 40, height: 40, borderRadius: 10 },
  messagesList: { padding: 16, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: '75%', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10, gap: 4,
  },
  bubbleMine: { backgroundColor: '#6366f1', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
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
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#111827', maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#c7d2fe' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 13, color: '#9ca3af' },
});
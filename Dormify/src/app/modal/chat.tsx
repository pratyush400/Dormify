import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, SafeAreaView, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const MOCK_MESSAGES = [
  { id: '1', text: 'Hey, is this still available?', mine: true, time: '2:30 PM' },
  { id: '2', text: 'Yes it is! Are you interested?', mine: false, time: '2:31 PM' },
  { id: '3', text: 'Definitely, can you do $10?', mine: true, time: '2:32 PM' },
  { id: '4', text: 'I can do $11, final offer 😄', mine: false, time: '2:33 PM' },
];

export default function ChatScreen() {
  const router = useRouter();
  const { sellerName, sellerAvatar, listingTitle, listingImage } = useLocalSearchParams<{
    sellerName: string;
    sellerAvatar: string;
    listingTitle: string;
    listingImage: string;
  }>();

  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now().toString(), text: input.trim(), mine: true, time }]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Image source={{ uri: sellerAvatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{sellerName}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>re: {listingTitle}</Text>
        </View>
        <Image source={{ uri: listingImage }} style={styles.listingThumb} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, item.mine && styles.bubbleTextMine]}>
                {item.text}
              </Text>
              <Text style={[styles.bubbleTime, item.mine && styles.bubbleTimeMine]}>
                {item.time}
              </Text>
            </View>
          )}
        />

        {/* Input */}
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
  messagesList: { padding: 16, gap: 8 },
  bubble: {
    maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 4,
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
});
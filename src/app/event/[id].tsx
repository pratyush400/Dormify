import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUser } from '../../hooks/useUser';
import { db } from '../../services/firebase';

type Event = {
  id: string;
  title: string;
  description: string;
  eventDate: any;
  eventLocation: string;
  eventImage?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  college: string;
  interested: string[];
  createdAt: any;
};

function formatEventDate(timestamp: any) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPostedDate(timestamp: any) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'events', id), (snapshot) => {
      if (snapshot.exists()) {
        setEvent({ id: snapshot.id, ...(snapshot.data() as any) } as Event);
      } else {
        setEvent(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleToggleInterested = async () => {
    if (!user?.uid || !event) return;

    const eventRef = doc(db, 'events', event.id);
    const isInterested = event.interested?.includes(user.uid);

    await updateDoc(eventRef, {
      interested: isInterested ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  };

  const handleDelete = () => {
    if (!event) return;

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'events', event.id));
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f2d4d" />
      </View>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isInterested = !!user?.uid && event.interested?.includes(user.uid);
  const isOwner = user?.uid === event.authorId;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Campus Event</Text>
        {isOwner ? (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {event.eventImage ? (
          <Image source={{ uri: event.eventImage }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderText}>📅</Text>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.postedText}>Posted {formatPostedDate(event.createdAt)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.interestedBtn, isInterested && styles.interestedBtnActive]}
              onPress={handleToggleInterested}
            >
              <Ionicons
                name={isInterested ? 'star' : 'star-outline'}
                size={16}
                color={isInterested ? '#fff' : '#1f2d4d'}
              />
              <Text style={[styles.interestedText, isInterested && styles.interestedTextActive]}>
                {event.interested?.length ?? 0}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color="#1f2d4d" />
              <Text style={styles.infoText}>{formatEventDate(event.eventDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color="#1f2d4d" />
              <Text style={styles.infoText}>{event.eventLocation || 'Campus'}</Text>
            </View>
          </View>

          <View style={styles.hostRow}>
            <Image
              source={event.authorAvatar ? { uri: event.authorAvatar } : require('@/assets/images/davatar.jpg')}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{event.authorName}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>
              {event.description?.trim() || 'No extra details were added for this event.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111827' },
  heroImage: { width: '100%', height: 280, backgroundColor: '#e5e7eb' },
  heroPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: { fontSize: 56 },
  body: { padding: 20, gap: 18 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: { flex: 1, gap: 4 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  postedText: { fontSize: 13, color: '#6b7280' },
  interestedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#1f2d4d',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  interestedBtnActive: { backgroundColor: '#1f2d4d' },
  interestedText: { color: '#1f2d4d', fontSize: 14, fontWeight: '700' },
  interestedTextActive: { color: '#fff' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { flex: 1, fontSize: 15, color: '#111827', lineHeight: 22 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  hostLabel: { fontSize: 12, color: '#6b7280' },
  hostName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  description: { fontSize: 15, color: '#374151', lineHeight: 22 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
});

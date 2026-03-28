// src/app/(tabs)/campus.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    arrayRemove, arrayUnion, collection,
    deleteDoc,
    doc,
    onSnapshot, orderBy, query, updateDoc
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList, Image,
    RefreshControl, SafeAreaView, StyleSheet,
    Text, TouchableOpacity, View
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

function EventCard({ item, currentUserId }: { item: Event; currentUserId: string }) {
  const isInterested = item.interested?.includes(currentUserId);

    const handleDelete = () => {
      Alert.alert(
        'Delete Event',
        'Are you sure you want to delete this Event? Looks cool imo',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteDoc(doc(db, 'events', item.id));
            }
          }
        ]
      );
    };

  const handleToggleInterested = async () => {
    if (!currentUserId) return;
    const ref = doc(db, 'events', item.id);
    await updateDoc(ref, {
      interested: isInterested
        ? arrayRemove(currentUserId)
        : arrayUnion(currentUserId),
    });
  };

  const formatEventDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const isPast = () => {
    if (!item.eventDate) return false;
    const date = item.eventDate.toDate ? item.eventDate.toDate() : new Date(item.eventDate);
    return date < new Date();
  };

  return (
    <View style={[styles.card, isPast() && styles.cardPast]}>
      {item.eventImage ? (
        <Image source={{ uri: item.eventImage }} style={styles.eventImage} />
      ) : (
        <View style={styles.eventImagePlaceholder}>
          <Text style={styles.eventImagePlaceholderText}>📅</Text>
        </View>
      )}{currentUserId === item.authorId && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={14} color="#fff" />
            </TouchableOpacity>
      )}
      {isPast() && (
        <View style={styles.pastBadge}>
          <Text style={styles.pastBadgeText}>Past Event</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color="#6b7280" />
          <Text style={styles.metaText}>{formatEventDate(item.eventDate)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color="#6b7280" />
          <Text style={styles.metaText}>{item.eventLocation}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.authorRow}>
            <Image
              source={item.authorAvatar
                ? { uri: item.authorAvatar }
                : require('@/assets/images/davatar.jpg')}
              style={styles.avatar}
            />
            <Text style={styles.authorName}>{item.authorName}</Text>
          </View>

          <View style={styles.interestedSection}>
            {(item.interested?.length ?? 0) > 0 && (
              <View style={styles.interestedAvatars}>
                {item.interested.slice(0, 3).map((uid, i) => (
                  <View key={uid} style={[styles.interestedAvatarWrapper, { zIndex: 3 - i, marginLeft: i > 0 ? -8 : 0 }]}>
                    <View style={styles.interestedAvatarPlaceholder}>
                      <Ionicons name="person" size={10} color="#fff" />
                    </View>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[styles.interestedBtn, isInterested && styles.interestedBtnActive]}
              onPress={handleToggleInterested}
            >
              <Ionicons
                name={isInterested ? 'star' : 'star-outline'}
                size={14}
                color={isInterested ? '#fff' : '#ef63f1'}
              />
              <Text style={[styles.interestedBtnText, isInterested && styles.interestedBtnTextActive]}>
                {item.interested?.length ?? 0} Interested
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function CampusScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [showUpcoming, setShowUpcoming] = useState(true);

  useEffect(() => {
  if (!user) return;

  const q = query(
    collection(db, 'events'),
    orderBy('eventDate', 'asc')
  );
  const unsub = onSnapshot(q, (snap) => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Event));
    setEvents(all);
    setLoading(false);
    setRefreshing(false);
  }, (err) => {
    console.error('Events error:', err);
    setLoading(false);
    setRefreshing(false);
  });
  return () => unsub();
}, [user, refreshTick]);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshTick(t => t + 1);
  };

  const now = new Date();
  const displayed = showUpcoming
    ? events.filter(e => {
        const d = e.eventDate?.toDate ? e.eventDate.toDate() : new Date(e.eventDate);
        return d >= now;
      })
    : events;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ef63f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campus</Text>
        <TouchableOpacity
          style={[styles.filterBtn, showUpcoming && styles.filterBtnActive]}
          onPress={() => setShowUpcoming(s => !s)}
        >
          <Text style={[styles.filterBtnText, showUpcoming && styles.filterBtnTextActive]}>
            {showUpcoming ? 'Upcoming' : 'All Events'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={displayed}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <EventCard item={item} currentUserId={user?.uid ?? ''} />
        )}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" colors={['#6366f1']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptySubtext}>Be the first to post a campus event!</Text>
          </View>
        }
      />
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#6366f1',
  },
  filterBtnActive: { backgroundColor: '#6366f1' },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: '#6366f1' },
  filterBtnTextActive: { color: '#fff' },
  feed: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  cardPast: { opacity: 0.6 },
  eventImage: { width: '100%', height: 180 },
  eventImagePlaceholder: {
    width: '100%', height: 100,
    backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
  },
  eventImagePlaceholderText: { fontSize: 40 },
  pastBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pastBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardBody: { padding: 16, gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#6b7280' },
  description: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 4,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  authorName: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  interestedSection: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  interestedAvatars: { flexDirection: 'row' },
  interestedAvatarWrapper: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#fff' },
  interestedAvatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 11,
    backgroundColor: '#a5b4fc', justifyContent: 'center', alignItems: 'center',
  },
  interestedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: '#6366f1', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  interestedBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  interestedBtnText: { fontSize: 12, fontWeight: '600', color: '#6366f1' },
  interestedBtnTextActive: { color: '#fff' },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtext: { fontSize: 14, color: '#9ca3af' },

   deleteBtn: {
  position: 'absolute', top: 6, right: 6,
  backgroundColor: 'rgba(239,68,68,0.85)',
  borderRadius: 8, padding: 5,
},
});
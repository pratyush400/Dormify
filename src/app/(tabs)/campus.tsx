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
  RefreshControl, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
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

const EVENT_FILTERS = [
  { key: 'Upcoming', icon: 'calendar-outline' as const },
  { key: 'All Events', icon: 'apps-outline' as const },
];

function EventCard({ item, currentUserId }: { item: Event; currentUserId: string }) {
  const router = useRouter();
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
    <TouchableOpacity
      style={[styles.card, isPast() && styles.cardPast]}
      activeOpacity={0.92}
      onPress={() => router.push(`/event/${item.id}`)}
    >
      {item.eventImage ? (
        <Image source={{ uri: item.eventImage }} style={styles.eventImage} />
      ) : (
        <View style={styles.eventImagePlaceholder}>
          <Text style={styles.eventImagePlaceholderText}>📅</Text>
        </View>
      )}
      {currentUserId === item.authorId && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={(event) => {
                event.stopPropagation();
                handleDelete();
              }}
            >
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
              onPress={(event) => {
                event.stopPropagation();
                handleToggleInterested();
              }}
            >
              <Ionicons
                name={isInterested ? 'star' : 'star-outline'}
                size={14}
                color={isInterested ? '#fff' : '#1f2d4d'}
              />
              <Text style={[styles.interestedBtnText, isInterested && styles.interestedBtnTextActive]}>
                {item.interested?.length ?? 0} Interested
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CampusScreen() {
  const { user } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [searchText, setSearchText] = useState('');

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
  const displayed = events.filter((event) => {
    const eventDate = event.eventDate?.toDate ? event.eventDate.toDate() : new Date(event.eventDate);
    if (showUpcoming && eventDate < now) return false;

    const queryText = searchText.trim().toLowerCase();
    if (!queryText) return true;

    return (
      event.title?.toLowerCase().includes(queryText) ||
      event.description?.toLowerCase().includes(queryText) ||
      event.eventLocation?.toLowerCase().includes(queryText) ||
      event.authorName?.toLowerCase().includes(queryText)
    );
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f2d4d" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayed}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <EventCard item={item} currentUserId={user?.uid ?? ''} />
        )}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.brand}>Obo</Text>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#9ca3af" />
                <TextInput
                  placeholder="Search Campus"
                  placeholderTextColor="#9ca3af"
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setShowUpcoming((current) => !current)}
              >
                <Ionicons name={showUpcoming ? 'calendar' : 'options-outline'} size={20} color="#1f2d4d" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {EVENT_FILTERS.map((filter) => {
                const active = showUpcoming
                  ? filter.key === 'Upcoming'
                  : filter.key === 'All Events';

                return (
                  <TouchableOpacity
                    key={filter.key}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setShowUpcoming(filter.key === 'Upcoming')}
                  >
                    <Ionicons
                      name={filter.icon}
                      size={22}
                      color={active ? '#1f2d4d' : '#6b7280'}
                    />
                    <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                      {filter.key}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1f2d4d" colors={['#1f2d4d']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIllustration}>🎉</Text>
            <Text style={styles.emptyTitle}>
              {showUpcoming ? 'No upcoming events yet' : 'No campus events found'}
            </Text>
            <Text style={styles.emptySubtext}>
              {showUpcoming
                ? 'Be the first to post a campus event and get people out of their rooms.'
                : 'Try a different search or switch back to upcoming events.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  feed: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  brand: {
    fontSize: 38,
    fontWeight: '700',
    color: '#e80000',
    fontFamily: 'Georgia',
    marginTop: 8,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    gap: 10,
    paddingVertical: 4,
    paddingBottom: 16,
  },
  categoryChip: {
    width: 92,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  categoryChipActive: {
    borderColor: '#1f2d4d',
    borderWidth: 2,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: '#1f2d4d',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  cardPast: { opacity: 0.6 },
  eventImage: { width: '100%', height: 180, backgroundColor: '#f3f4f6' },
  eventImagePlaceholder: {
    width: '100%', height: 180,
    backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
  },
  eventImagePlaceholderText: { fontSize: 40 },
  pastBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(31,45,77,0.82)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pastBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardBody: { padding: 12, gap: 8 },
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
    borderWidth: 1.5, borderColor: '#1f2d4d', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  interestedBtnActive: { backgroundColor: '#1f2d4d', borderColor: '#1f2d4d' },
  interestedBtnText: { fontSize: 12, fontWeight: '600', color: '#1f2d4d' },
  interestedBtnTextActive: { color: '#fff' },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyIllustration: { fontSize: 64, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', textAlign: 'center', lineHeight: 26 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },

  deleteBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(239,68,68,0.85)',
    borderRadius: 10, padding: 6,
  },
});

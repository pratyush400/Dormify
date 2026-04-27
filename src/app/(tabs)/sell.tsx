// src/app/(tabs)/sell.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image,
  KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native';
import { useUser } from '../../hooks/useUser';
import { auth, db, storage } from '../../services/firebase';
import { sendNewEventNotification, sendNewListingNotification } from '../../services/notifications';
import { grantOneTimeEntry } from '../../services/raffle';

const CATEGORIES = ['Furniture', 'Books', 'Electronics', 'Clothing', 'Kitchen', 'Bedding', 'Sports', 'Other'];
const HALLS = ['All Halls', 'Copeland Hall', 'Akin Hall', 'Forest Hall', 'Odell Hall', 'Stewart Hall', 'Holmes Hall', 'Hartzfeld Hall', 'Apartments', 'Off-campus'];
const CONDITIONS = ['New', 'Used'];

type PostType = 'listing' | 'event';

function parseFlexibleEventTime(input: string): { hours: number; minutes: number } | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  const compact = raw.replace(/\s+/g, '');
  const meridiemMatch = compact.match(/(am|pm)$/);
  const meridiem = meridiemMatch?.[1] ?? null;
  const timePart = compact.replace(/(am|pm)$/, '');

  let hours: number;
  let minutes = 0;

  if (timePart.includes(':')) {
    const [hourPart, minutePart = '0'] = timePart.split(':');
    hours = Number(hourPart);
    minutes = Number(minutePart);
  } else if (/^\d{3,4}$/.test(timePart)) {
    const hourPart = timePart.slice(0, timePart.length - 2);
    const minutePart = timePart.slice(-2);
    hours = Number(hourPart);
    minutes = Number(minutePart);
  } else if (/^\d{1,2}$/.test(timePart)) {
    hours = Number(timePart);
  } else {
    return null;
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === 'pm' && hours !== 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;
  } else if (hours > 23) {
    return null;
  }

  return { hours, minutes };
}

function parseFlexibleEventDate(input: string): { month: number; day: number; year: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/[\/\-.\s]+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return null;

  const month = Number(parts[0]);
  const day = Number(parts[1]);
  const now = new Date();
  let year = parts[2] ? Number(parts[2]) : now.getFullYear();

  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) return null;
  if (year < 100) year += 2000;

  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  if (parts.length === 2 && candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    candidate.setFullYear(year + 1);
  }

  return {
    month: candidate.getMonth() + 1,
    day: candidate.getDate(),
    year: candidate.getFullYear(),
  };
}

function formatTimeHint(input: string): string | null {
  const parsed = parseFlexibleEventTime(input);
  if (!parsed) return null;

  return new Date(2000, 0, 1, parsed.hours, parsed.minutes).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function SellScreen() {
  const { user } = useUser();
  const [postType, setPostType] = useState<PostType>('listing');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [hall, setHall] = useState('');
  const [condition, setCondition] = useState('');

  const [eventImage, setEventImage] = useState<string | null>(null);
const [eventDateStr, setEventDateStr] = useState(''); // "MM/DD/YYYY"
const [eventTimeStr, setEventTimeStr] = useState(''); // "HH:MM AM/PM"
  const [eventLocation, setEventLocation] = useState('');

  const parseEventDate = (dateStr: string, timeStr: string): Date | null => {
    const parsedDate = parseFlexibleEventDate(dateStr);
    const parsedTime = parseFlexibleEventTime(timeStr);
    if (!parsedDate || !parsedTime) return null;

    const combined = new Date(
      parsedDate.year,
      parsedDate.month - 1,
      parsedDate.day,
      parsedTime.hours,
      parsedTime.minutes
    );

    return combined > new Date() ? combined : null;
  };

  const isListingValid = !!(title.trim() && price.trim());
  const isEventValid = !!(
    title.trim() &&
    eventDateStr.trim() &&
    eventTimeStr.trim() &&
    parseEventDate(eventDateStr, eventTimeStr) !== null
  );
  const isFormValid = postType === 'listing' ? isListingValid : isEventValid;
  const parsedEventPreview = parseEventDate(eventDateStr, eventTimeStr);
  const normalizedTimeHint = formatTimeHint(eventTimeStr);

  const resetForm = () => {
    setTitle(''); setDescription('');
    setPhotos([]); setPrice(''); setCategory(''); setHall(''); setCondition('');
    setEventImage(null); setEventDateStr(''); setEventTimeStr(''); setEventLocation('');
  };

  const pickFromGallery = async (forEvent = false) => {
    if (!forEvent && photos.length >= 5) return Alert.alert('Max 5 photos');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: !forEvent,
      quality: 0.8,
    });
    if (!result.canceled) {
      if (forEvent) {
        setEventImage(result.assets[0].uri);
      } else {
        setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
      }
    }
  };

  const takePhoto = async (forEvent = false) => {
    if (!forEvent && photos.length >= 5) return Alert.alert('Max 5 photos');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Needed', 'We need camera access.');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      if (forEvent) {
        setEventImage(result.assets[0].uri);
      } else {
        setPhotos(prev => [...prev, result.assets[0].uri].slice(0, 5));
      }
    }
  };

  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const formatEventDate = (date: Date) =>
    date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const formatEventTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSubmit = async () => {
    if (!isFormValid) return;
    const authUser = auth.currentUser;
    if (!authUser) return Alert.alert('Error', 'You must be logged in.');
    setIsLoading(true);

    try {
      if (postType === 'listing') {
        const uploadedUrls = await Promise.all(
          photos.map(async (uri, i) => {
            const blob = await (await fetch(uri)).blob();
            const storageRef = ref(storage, `listings/${authUser.uid}/${Date.now()}-${i}.jpg`);
            await uploadBytes(storageRef, blob);
            return getDownloadURL(storageRef);
          })
        );
        const listingRef = await addDoc(collection(db, 'listings'), {
          title, description,
          price: parseFloat(price),
          category: category || 'Other',
          hall: hall || 'Campus',
          condition: (condition || 'Used').toLowerCase(),
          photos: uploadedUrls,
          sold: false,
          createdAt: serverTimestamp(),
          sellerId: authUser.uid,
          sellerName: `${user?.fname ?? ''} ${user?.lname ?? ''}`.trim() || 'Anonymous',
          sellerAvatar: user?.avatarUrl || '',
          college: user?.college || '',
        });
        await sendNewListingNotification({
          actorId: authUser.uid,
          actorName: `${user?.fname ?? ''} ${user?.lname ?? ''}`.trim() || 'Someone',
          college: user?.college || '',
          title,
          price: parseFloat(price),
          hall: hall || 'Campus',
          listingId: listingRef.id,
        });
        const granted = await grantOneTimeEntry(authUser.uid, 'postedListing');
        Alert.alert(
          'Posted!',
          granted ? 'Your listing is live — +1 raffle entry 🎟️' : 'Your listing is now live.'
        );
      } else {
        let eventImageUrl = '';
        if (eventImage) {
          const blob = await (await fetch(eventImage)).blob();
          const storageRef = ref(storage, `events/${authUser.uid}/${Date.now()}.jpg`);
          await uploadBytes(storageRef, blob);
          eventImageUrl = await getDownloadURL(storageRef);
        }

        const combinedDate = parseEventDate(eventDateStr, eventTimeStr);
if (!combinedDate) return Alert.alert('Invalid date or time', 'Please check your date and time.');
        const eventRef = await addDoc(collection(db, 'events'), {
          title, description,
          eventDate: combinedDate,
          eventLocation: eventLocation.trim() || 'Campus',
          eventImage: eventImageUrl,
          authorId: authUser.uid,
          authorName: `${user?.fname ?? ''} ${user?.lname ?? ''}`.trim() || 'Anonymous',
          authorAvatar: user?.avatarUrl || '',
          college: user?.college || '',
          interested: [],
          createdAt: serverTimestamp(),
        });
        await sendNewEventNotification({
          actorId: authUser.uid,
          actorName: `${user?.fname ?? ''} ${user?.lname ?? ''}`.trim() || 'Someone',
          college: user?.college || '',
          title,
          location: eventLocation.trim() || 'Campus',
          when: combinedDate,
          eventId: eventRef.id,
        });
        Alert.alert('Posted!', 'Your event is now live on Campus.');
      }
      resetForm();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {postType === 'listing' ? 'New Listing' : 'New Event'}
        </Text>
      </View>

      {/* Type toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, postType === 'listing' && styles.toggleBtnActive]}
          onPress={() => setPostType('listing')}
        >
          <Ionicons name="storefront-outline" size={16} color={postType === 'listing' ? '#fff' : '#6b7280'} />
          <Text style={[styles.toggleText, postType === 'listing' && styles.toggleTextActive]}>Listing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, postType === 'event' && styles.toggleBtnActive]}
          onPress={() => setPostType('event')}
        >
          <Ionicons name="calendar-outline" size={16} color={postType === 'event' ? '#fff' : '#6b7280'} />
          <Text style={[styles.toggleText, postType === 'event' && styles.toggleTextActive]}>Campus Event</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >

        {postType === 'listing' && (
          <>
            <Text style={styles.label}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
              <TouchableOpacity style={styles.photoAdd} onPress={() => takePhoto(false)}>
                <Ionicons name="camera-outline" size={24} color="#000000" />
                <Text style={styles.photoAddText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoAdd} onPress={() => pickFromGallery(false)}>
                <Ionicons name="image-outline" size={24} color="#040406" />
                <Text style={styles.photoAddText}>Gallery</Text>
              </TouchableOpacity>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoPreview}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  {i === 0 && <View style={styles.coverBadge}><Text style={styles.coverText}>Cover</Text></View>}
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(i)}>
                    <Ionicons name="close-circle" size={20} color="#090808" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.hint}>{photos.length}/5 photos · First photo is the cover</Text>

            <Text style={styles.label}>Price <Text style={styles.required}>*</Text></Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceDollar}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.label}>Condition</Text>
            <View style={styles.chipRow}>
              {CONDITIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, condition === c && styles.chipActive]}
                  onPress={() => setCondition(c)}
                >
                  <Text style={[styles.chipText, condition === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Hall / Location</Text>
            <View style={styles.chipRow}>
              {HALLS.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[styles.chip, hall === h && styles.chipActive]}
                  onPress={() => setHall(h)}
                >
                  <Text style={[styles.chipText, hall === h && styles.chipTextActive]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {postType === 'event' && (
          <>
            <Text style={styles.label}>Event Image</Text>
            {eventImage ? (
              <View style={styles.eventImagePreview}>
                <Image source={{ uri: eventImage }} style={styles.eventImageImg} />
                <TouchableOpacity style={styles.removeEventImage} onPress={() => setEventImage(null)}>
                  <Ionicons name="close-circle" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.eventImagePicker}>
                <TouchableOpacity style={styles.photoAdd} onPress={() => takePhoto(true)}>
                  <Ionicons name="camera-outline" size={24} color="#000000" />
                  <Text style={styles.photoAddText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoAdd} onPress={() => pickFromGallery(true)}>
                  <Ionicons name="image-outline" size={24} color="#000000" />
                  <Text style={styles.photoAddText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

           

            <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5/2 or 05/02/2026"
                  placeholderTextColor="#9ca3af"
                  value={eventDateStr}
                  onChangeText={setEventDateStr}
                  keyboardType="numbers-and-punctuation"
                  maxLength={14}
                />

                <Text style={styles.label}>Time <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 7, 7pm, 7:30, 19:30"
                  placeholderTextColor="#9ca3af"
                  value={eventTimeStr}
                  onChangeText={setEventTimeStr}
                  autoCapitalize="characters"
                  maxLength={12}
                />
                <Text style={styles.hint}>
                  {normalizedTimeHint
                    ? `We'll post this as ${normalizedTimeHint}`
                    : 'Works with 7, 7pm, 730, 7:30, or 19:30'}
                </Text>

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fowler, Room 102 or leave blank"
              placeholderTextColor="#9ca3af"
              value={eventLocation}
              onChangeText={setEventLocation}
            />
            {parsedEventPreview && (
              <Text style={styles.hint}>
                Posting for {formatEventDate(parsedEventPreview)} at {formatEventTime(parsedEventPreview)}
              </Text>
            )}
          </>
        )}
        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder={postType === 'listing' ? 'e.g. IKEA Desk Lamp' : 'e.g. End of Year BBQ'}
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
          maxLength={60}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={postType === 'listing'
            ? 'Describe your item — condition, size, brand...'
            : 'What\'s happening? Food, activities, who should come...'}
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={300}
        />
        <Text style={styles.hint}>{description.length}/300</Text>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons
                  name={postType === 'listing' ? 'storefront-outline' : 'calendar-outline'}
                  size={18} color="#fff"
                />
                <Text style={styles.submitText}>
                  {postType === 'listing' ? 'Post Listing' : 'Post Event'}
                </Text>
              </>
          }
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  keyboardArea: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  toggleRow: {
    flexDirection: 'row', margin: 16, gap: 10,
    backgroundColor: '#fff', borderRadius: 14, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  toggleBtnActive: { backgroundColor: '#f615d4' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  toggleTextActive: { color: '#fff' },
  body: { paddingHorizontal: 20, paddingBottom: 20, gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 6 },
  required: { color: '#f627db' },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  photosRow: { flexDirection: 'row', marginBottom: 4 },
  photoAdd: {
    width: 90, height: 90, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#000000', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', marginRight: 10, gap: 4,
  },
  photoAddText: { fontSize: 11, color: '#000000', fontWeight: '600' },
  photoPreview: { width: 90, height: 90, borderRadius: 14, marginRight: 10, position: 'relative' },
  photoImg: { width: 90, height: 90, borderRadius: 14 },
  coverBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: '#f95b63', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  coverText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  removePhoto: { position: 'absolute', top: -6, right: -6 },
  eventImagePicker: { flexDirection: 'row', gap: 10 },
  eventImagePreview: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  eventImageImg: { width: '100%', height: 180, borderRadius: 14 },
  removeEventImage: { position: 'absolute', top: 8, right: 8 },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  dateBtnText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#111827',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  priceContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },

  pickerContainer: {
  backgroundColor: '#fff', borderRadius: 14,
  overflow: 'hidden', marginTop: 4,
  shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
},
pickerConfirm: {
  backgroundColor: '#000', padding: 14, alignItems: 'center',
},
pickerConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  priceDollar: { fontSize: 18, fontWeight: '700', color: '#9ee62a', marginRight: 4 },
  priceInput: { flex: 1, fontSize: 15, color: '#111827', padding: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#ec63f1', borderColor: '#6366f1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#000000', borderRadius: 14, padding: 16, marginTop: 24,
  },
  submitBtnDisabled: { backgroundColor: '#c7d2fe' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});



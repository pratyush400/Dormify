// src/app/(tabs)/sell.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image,
  SafeAreaView, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View
} from 'react-native';
import { useUser } from '../../hooks/useUser';
import { auth, db, storage } from '../../services/firebase';

const CATEGORIES = ['Furniture', 'Books', 'Electronics', 'Clothing', 'Kitchen', 'Bedding', 'Sports', 'Other'];
const HALLS = ['All Halls', 'Copeland Hall', 'Akin Hall', 'Forest Hall', 'Odell Hall', 'Stewart Hall', 'Holmes Hall', 'Hartzfeld Hall', 'Apartments', 'Off-campus'];
const CONDITIONS = ['New', 'Used'];

type PostType = 'listing' | 'event';

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
  try {
    const [month, day, year] = dateStr.split('/');
    // Convert "7:00 PM" to 24h
    const [time, meridiem] = timeStr.trim().split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (meridiem?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (meridiem?.toUpperCase() === 'AM' && hours === 12) hours = 0;
    const d = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes || 0);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};


  const isValidDate = (str: string) => {
  const parts = str.split('/');
  if (parts.length !== 3) return false;
  const d = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
  return !isNaN(d.getTime()) && d > new Date();
};

  const isListingValid = photos.length > 0 && title && price && category && hall && condition;
const isEventValid = !!(
  title &&
  eventLocation &&
  eventDateStr.length === 10 &&
  eventTimeStr.length >= 4 &&
  parseEventDate(eventDateStr, eventTimeStr) !== null
);
  const isFormValid = postType === 'listing' ? isListingValid : isEventValid;

  const resetForm = () => {
    setTitle(''); setDescription('');
    setPhotos([]); setPrice(''); setCategory(''); setHall(''); setCondition('');
    setEventImage(null); setEventLocation('');
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
        await addDoc(collection(db, 'listings'), {
          title, description,
          price: parseFloat(price),
          category, hall,
          condition: condition.toLowerCase(),
          photos: uploadedUrls,
          sold: false,
          createdAt: serverTimestamp(),
          sellerId: authUser.uid,
          sellerName: `${user?.fname ?? ''} ${user?.lname ?? ''}`.trim() || 'Anonymous',
          sellerAvatar: user?.avatarUrl || '',
          college: user?.college || '',
        });
        Alert.alert('Posted!', 'Your listing is now live.');
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
        await addDoc(collection(db, 'events'), {
          title, description,
          eventDate: combinedDate,
          eventLocation,
          eventImage: eventImageUrl,
          authorId: authUser.uid,
          authorName: `${user?.fname ?? ''} ${user?.lname ?? ''}`.trim() || 'Anonymous',
          authorAvatar: user?.avatarUrl || '',
          college: user?.college || '',
          interested: [],
          createdAt: serverTimestamp(),
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

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {postType === 'listing' && (
          <>
            <Text style={styles.label}>Photos <Text style={styles.required}>*</Text></Text>
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

            <Text style={styles.label}>Condition <Text style={styles.required}>*</Text></Text>
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

            <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
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

            <Text style={styles.label}>Hall / Location <Text style={styles.required}>*</Text></Text>
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
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#9ca3af"
                  value={eventDateStr}
                  onChangeText={setEventDateStr}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />

                <Text style={styles.label}>Time <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 7:00 PM"
                  placeholderTextColor="#9ca3af"
                  value={eventTimeStr}
                  onChangeText={setEventTimeStr}
                  maxLength={10}
                />

            <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fowler, Room 102"
              placeholderTextColor="#9ca3af"
              value={eventLocation}
              onChangeText={setEventLocation}
            />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
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
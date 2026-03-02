import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIES = ['Furniture', 'Books', 'Electronics', 'Clothing', 'Kitchen', 'Bedding', 'Sports', 'Other'];
const HALLS = ['Copeland Hall', 'Akin Hall', 'Forest Hall', 'Odell Hall', 'Stewart Hall'];
const CONDITIONS = ['New', 'Used'];

export default function SellScreen() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [hall, setHall] = useState('');
  const [condition, setCondition] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = photos.length > 0 && title && price && category && hall && condition;

  const pickFromGallery = async () => {
    if (photos.length >= 5) return Alert.alert('Max 5 photos');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const picked = result.assets.map(a => a.uri);
      setPhotos(prev => [...prev, ...picked].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    if (photos.length >= 5) return Alert.alert('Max 5 photos');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotos(prev => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      // TODO: upload to Firestore
      await new Promise(res => setTimeout(res, 1500)); // mock delay
      Alert.alert('Listed!', 'Your item has been posted.');
      setPhotos([]); setTitle(''); setDescription('');
      setPrice(''); setCategory(''); setHall(''); setCondition('');
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Listing</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Photos */}
        <Text style={styles.label}>Photos <Text style={styles.required}>*</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
          {/* Add buttons */}
          <TouchableOpacity style={styles.photoAdd} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={24} color="#6366f1" />
            <Text style={styles.photoAddText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoAdd} onPress={pickFromGallery}>
            <Ionicons name="image-outline" size={24} color="#6366f1" />
            <Text style={styles.photoAddText}>Gallery</Text>
          </TouchableOpacity>

          {/* Photo previews */}
          {photos.map((uri, i) => (
            <View key={i} style={styles.photoPreview}>
              <Image source={{ uri }} style={styles.photoImg} />
              {i === 0 && <View style={styles.coverBadge}><Text style={styles.coverText}>Cover</Text></View>}
              <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(i)}>
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.hint}>{photos.length}/5 photos · First photo is the cover</Text>

        {/* Title */}
        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. IKEA Desk Lamp"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
          maxLength={60}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your item — condition, size, brand..."
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={300}
        />
        <Text style={styles.hint}>{description.length}/300</Text>

        {/* Price */}
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

        {/* Condition */}
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

        {/* Category */}
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

        {/* Hall */}
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

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="storefront-outline" size={18} color="#fff" />
                <Text style={styles.submitText}>Post Listing</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  body: { padding: 20, gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 6 },
  required: { color: '#ef4444' },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },

  // Photos
  photosRow: { flexDirection: 'row', marginBottom: 4 },
  photoAdd: {
    width: 90,
    height: 90,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    gap: 4,
    backgroundColor: '#ede9fe22',
  },
  photoAddText: { fontSize: 11, color: '#6366f1', fontWeight: '600' },
  photoPreview: { width: 90, height: 90, borderRadius: 14, marginRight: 10, position: 'relative' },
  photoImg: { width: 90, height: 90, borderRadius: 14 },
  coverBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: '#6366f1', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  coverText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  removePhoto: { position: 'absolute', top: -6, right: -6 },

  // Inputs
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  priceDollar: { fontSize: 18, fontWeight: '700', color: '#6366f1', marginRight: 4 },
  priceInput: { flex: 1, fontSize: 15, color: '#111827', padding: 14 },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#fff' },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },
  submitBtnDisabled: { backgroundColor: '#c7d2fe' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

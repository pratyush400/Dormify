
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { id: '1', label: 'Furniture', icon: '🛋️' },
  { id: '2', label: 'Books', icon: '📚' },
  { id: '3', label: 'Electronics', icon: '💻' },
  { id: '4', label: 'Clothing', icon: '👕' },
  { id: '5', label: 'Kitchen', icon: '🍳' },
  { id: '6', label: 'Bedding', icon: '🛏️' },
  { id: '7', label: 'Sports', icon: '⚽' },
  { id: '8', label: 'Other', icon: '📦' },
];

const HALLS = ['All Halls', 'Copeland Hall', 'Akin Hall', 'Forest Hall', 'Odell Hall', 'Stewart Hall'];

const MOCK_LISTINGS = [
  { id: '1', title: 'IKEA Desk Lamp', description: 'White, barely used.', price: 12, condition: 'used', category: 'Furniture', image: 'https://picsum.photos/seed/lamp/600/400', seller: { name: 'Maya R.', avatar: 'https://i.pravatar.cc/100?img=1' }, hall: 'Copeland Hall', college: 'Lewis & Clark College' },
  { id: '2', title: 'Twin XL Mattress Topper', description: 'Memory foam, one semester.', price: 35, condition: 'used', category: 'Bedding', image: 'https://picsum.photos/seed/mattress/600/400', seller: { name: 'Jake T.', avatar: 'https://i.pravatar.cc/100?img=2' }, hall: 'Akin Hall', college: 'Lewis & Clark College' },
  { id: '3', title: 'Calculus Textbook', description: 'Stewart 8th edition.', price: 20, condition: 'used', category: 'Books', image: 'https://picsum.photos/seed/book/600/400', seller: { name: 'Priya K.', avatar: 'https://i.pravatar.cc/100?img=3' }, hall: 'Forest Hall', college: 'Lewis & Clark College' },
  { id: '4', title: 'Mini Fridge', description: 'Black, 1.7 cu ft.', price: 55, condition: 'new', category: 'Electronics', image: 'https://picsum.photos/seed/fridge/600/400', seller: { name: 'Carlos M.', avatar: 'https://i.pravatar.cc/100?img=4' }, hall: 'Odell Hall', college: 'Lewis & Clark College' },
  { id: '5', title: 'Desk Chair', description: 'Adjustable height.', price: 40, condition: 'used', category: 'Furniture', image: 'https://picsum.photos/seed/chair/600/400', seller: { name: 'Sophie L.', avatar: 'https://i.pravatar.cc/100?img=5' }, hall: 'Stewart Hall', college: 'Lewis & Clark College' },
  { id: '6', title: 'Brand New Kettle', description: 'Never opened, still in box.', price: 18, condition: 'new', category: 'Kitchen', image: 'https://picsum.photos/seed/kettle/600/400', seller: { name: 'Amir J.', avatar: 'https://i.pravatar.cc/100?img=6' }, hall: 'Copeland Hall', college: 'Lewis & Clark College' },
];

type Listing = typeof MOCK_LISTINGS[0];

function ListingCard({ item }: { item: Listing }) {
  const [saved, setSaved] = useState(false);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <TouchableOpacity style={styles.saveBtn} onPress={() => setSaved(!saved)}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={18} color={saved ? '#ef4444' : '#fff'} />
        </TouchableOpacity>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>${item.price}</Text>
        </View>
        <View style={[styles.conditionBadge, item.condition === 'new' ? styles.newBadge : styles.usedBadge]}>
          <Text style={styles.conditionText}>{item.condition === 'new' ? 'New' : 'Used'}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.sellerRow}>
          <Image source={{ uri: item.seller.avatar }} style={styles.avatar} />
          <View>
            <Text style={styles.sellerName}>{item.seller.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={11} color="#9ca3af" />
              <Text style={styles.locationText}>{item.hall} · {item.college}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedHall, setSelectedHall] = useState('All Halls');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const filtered = MOCK_LISTINGS.filter(l => {
    const matchQuery = l.title.toLowerCase().includes(query.toLowerCase());
    const matchCat = !selectedCategory || l.category === selectedCategory;
    const matchHall = selectedHall === 'All Halls' || l.hall === selectedHall;
    const matchCondition = !selectedCondition || l.condition === selectedCondition;
    const matchMin = !minPrice || l.price >= Number(minPrice);
    const matchMax = !maxPrice || l.price <= Number(maxPrice);
    return matchQuery && matchCat && matchHall && matchCondition && matchMin && matchMax;
  });

  const activeFilterCount = [
    selectedCategory,
    selectedHall !== 'All Halls' ? selectedHall : '',
    selectedCondition,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={(v) => { setQuery(v); setHasSearched(v.length > 0); }}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setHasSearched(false); }}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? '#fff' : '#6366f1'} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Tiles or Results */}
      {!hasSearched && !selectedCategory ? (
        <ScrollView contentContainerStyle={styles.categoriesGrid} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Browse by Category</Text>
          <View style={styles.grid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryTile}
                onPress={() => { setSelectedCategory(cat.label); setHasSearched(true); }}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ListingCard item={item} />}
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            selectedCategory ? (
              <TouchableOpacity style={styles.activeCategoryChip} onPress={() => { setSelectedCategory(''); setHasSearched(false); }}>
                <Text style={styles.activeCategoryChipText}>{selectedCategory}</Text>
                <Ionicons name="close" size={14} color="#6366f1" />
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No listings found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {/* Condition */}
            <Text style={styles.filterLabel}>Condition</Text>
            <View style={styles.chipRow}>
              {['', 'new', 'used'].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, selectedCondition === c && styles.chipActive]}
                  onPress={() => setSelectedCondition(c)}
                >
                  <Text style={[styles.chipText, selectedCondition === c && styles.chipTextActive]}>
                    {c === '' ? 'Any' : c === 'new' ? 'New' : 'Used'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Range */}
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min $"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />
              <Text style={styles.priceDash}>—</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max $"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
              />
            </View>

            {/* Hall */}
            <Text style={styles.filterLabel}>Hall / Location</Text>
            <View style={styles.chipRow}>
              {HALLS.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[styles.chip, selectedHall === h && styles.chipActive]}
                  onPress={() => setSelectedHall(h)}
                >
                  <Text style={[styles.chipText, selectedHall === h && styles.chipTextActive]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.chipRow}>
              {['', ...CATEGORIES.map(c => c.label)].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, selectedCategory === c && styles.chipActive]}
                  onPress={() => setSelectedCategory(c)}
                >
                  <Text style={[styles.chipText, selectedCategory === c && styles.chipTextActive]}>
                    {c === '' ? 'All' : c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Apply */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setSelectedCondition('');
                setMinPrice('');
                setMaxPrice('');
                setSelectedHall('All Halls');
                setSelectedCategory('');
              }}
            >
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => { setShowFilters(false); setHasSearched(true); }}
            >
              <Text style={styles.applyBtnText}>Show Results</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, backgroundColor: '#fff' },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  filterBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  categoriesGrid: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryTile: { width: '46%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  categoryIcon: { fontSize: 32 },
  categoryLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  activeCategoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 },
  activeCategoryChipText: { color: '#6366f1', fontWeight: '600', fontSize: 13 },
  feed: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 180 },
  saveBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, padding: 6 },
  priceBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  priceText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  conditionBadge: { position: 'absolute', bottom: 12, right: 12, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  newBadge: { backgroundColor: '#22c55e' },
  usedBadge: { backgroundColor: '#f59e0b' },
  conditionText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 14, gap: 6 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  sellerName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  locationText: { fontSize: 11, color: '#9ca3af' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  description: { fontSize: 13, color: '#6b7280' },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 13, color: '#9ca3af' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalBody: { padding: 20, gap: 8 },
  filterLabel: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827' },
  priceDash: { fontSize: 18, color: '#9ca3af' },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  clearBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  clearBtnText: { fontWeight: '600', color: '#6b7280' },
  applyBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#6366f1', alignItems: 'center' },
  applyBtnText: { fontWeight: '600', color: '#fff', fontSize: 15 },
});
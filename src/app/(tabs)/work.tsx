import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Working() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(auth)/onboard')}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coming Soon</Text>
        <View style={{ width: 24 }} />
      </View>
<View style={styles.emptyContainer}>
            <Text style={styles.emptyIllustration}>🏠</Text>
            <Text style={styles.emptyTitle}>Your school&apos;s Obo{'\n'}seems to be empty...</Text>
            <Text style={styles.emptySubtext}>Be the first to post a listing{'\n'}and get things moving!</Text>
          </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#15c5e8' },
  feed: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 200 },
  saveBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, padding: 6,
  },
  priceBadge: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: '#73de2d', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  emptyContainer: { alignItems: 'center', marginTop: 100, gap: 12, paddingHorizontal: 40 },
  emptyIllustration: { fontSize: 64, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', textAlign: 'center', lineHeight: 26 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
});

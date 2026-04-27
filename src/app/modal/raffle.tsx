import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '../../hooks/useUser';
import { db, storage } from '../../services/firebase';
import {
  EntriesMap,
  totalEntries,
  ZERO_ENTRIES,
  referralShareMessage,
  backfillEntriesIfNeeded,
} from '../../services/raffle';

export default function RaffleScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [entries, setEntries] = useState<EntriesMap>(ZERO_ENTRIES);
  const [igStatus, setIgStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [igHandle, setIgHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    backfillEntriesIfNeeded(user.uid).catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setEntries({ ...ZERO_ENTRIES, ...(data.entries ?? {}) });
        setIgStatus(data.igEntryStatus ?? 'none');
        setIgHandle(data.igHandle ?? '');
      }
    });
    return () => unsub();
  }, [user?.uid]);

  const username = user?.username ?? '';
  const total = totalEntries(entries);

  const onShare = async () => {
    if (!username) return;
    try {
      await Share.share({ message: referralShareMessage(username) });
    } catch {}
  };

  const onSubmitIg = async () => {
    if (!user?.uid) return;
    if (igStatus === 'pending' || igStatus === 'approved') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setSubmitting(true);
    try {
      const asset = result.assets[0];
      const handle = (igHandle || '').trim() ||
        (await new Promise<string>((resolve) => {
          Alert.prompt?.(
            'Instagram handle',
            "What's your Instagram handle? (e.g. maxmay)",
            (text) => resolve((text || '').trim()),
            'plain-text'
          );
        }));

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const path = `igEntries/${user.uid}/${Date.now()}.jpg`;
      const sref = storageRef(storage, path);
      await uploadBytes(sref, blob);
      const url = await getDownloadURL(sref);

      await addDoc(collection(db, 'igEntries'), {
        uid: user.uid,
        username,
        igHandle: handle || null,
        screenshotUrl: url,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Mark on user doc so we can gate the button
      await import('firebase/firestore').then(({ updateDoc }) =>
        updateDoc(doc(db, 'users', user.uid), {
          igEntryStatus: 'pending',
          igHandle: handle || null,
        })
      );

      Alert.alert('Submitted', "We'll review and grant your entry shortly.");
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not submit.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Win a MacBook</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>YOUR ENTRIES</Text>
          <Text style={styles.heroNumber}>{total}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="ticket-outline" size={14} color="#cbd5e1" />
            <Text style={styles.heroSub}>Each entry is a shot at the MacBook</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.code}>@{username || '...'}</Text>
            <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>
            Each friend who signs up with your code gets you both +1 entry. No cap.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to earn</Text>

          <Row label="Sign up" granted={!!entries.signup} value="+1" />
          <Row
            label="Post your first listing"
            granted={!!entries.postedListing}
            value="+1"
          />
          <Row
            label="Tag @obo in an Instagram story"
            granted={!!entries.igShare}
            value="+1"
            extra={
              igStatus === 'pending' ? 'Pending review' :
              igStatus === 'rejected' ? 'Rejected — try again' :
              entries.igShare ? 'Approved' : ''
            }
            action={
              entries.igShare || igStatus === 'pending' || igStatus === 'approved' ? null : (
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={onSubmitIg}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#fff" size="small" /> :
                    <Text style={styles.smallBtnText}>Submit</Text>}
                </TouchableOpacity>
              )
            }
          />
          <Row
            label="Refer friends"
            granted={!!entries.referralsGiven}
            value={`+${entries.referralsGiven}`}
            extra={`${entries.referralsGiven} given · ${entries.referralsReceived} received · uncapped`}
          />
        </View>

        <Text style={styles.fineprint}>
          Winner picked at random, weighted by entries. One Instagram entry per user. Self-referrals not counted.
        </Text>

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Official rules</Text>
          <Text style={styles.ruleLine}>Sponsor: Obo, the developer of this app.</Text>
          <Text style={styles.ruleLine}>No purchase is required to enter or win.</Text>
          <Text style={styles.ruleLine}>How to enter: create an account for +1 entry, post your first listing for +1, submit one Instagram story tag for +1 after approval, and earn +1 per successful referral for both the referrer and new user.</Text>
          <Text style={styles.ruleLine}>Entry limits: one sign-up entry, one first-listing entry, one Instagram story entry, and unlimited referral entries. Self-referrals are not eligible.</Text>
          <Text style={styles.ruleLine}>Prize: one MacBook awarded to one winner selected at random, with odds based on the total number of eligible entries received.</Text>
          <Text style={styles.ruleLine}>Apple is not a sponsor of this sweepstakes and is not involved in it in any manner.</Text>
          <Text style={styles.ruleLine}>Void where prohibited. Before release, add your exact eligibility rules, promotion dates, and winner-contact process here.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label, granted, value, extra, action,
}: {
  label: string;
  granted: boolean;
  value: string;
  extra?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, granted && styles.dotOn]}>
        {granted ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {extra ? <Text style={styles.rowExtra}>{extra}</Text> : null}
      </View>
      {action ? action : <Text style={styles.rowValue}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  body: { padding: 16, gap: 16 },
  heroCard: {
    backgroundColor: '#1f2d4d', borderRadius: 18, padding: 24, alignItems: 'center', gap: 4,
  },
  heroLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  heroNumber: { color: '#fff', fontSize: 56, fontWeight: '800' },
  heroSub: { color: '#cbd5e1', fontSize: 13, marginTop: 4 },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  code: { fontSize: 22, fontWeight: '700', color: '#1f2d4d' },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, height: 38, borderRadius: 10, backgroundColor: '#1f2d4d',
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  helpText: { fontSize: 12, color: '#6b7280' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  dot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center',
  },
  dotOn: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  rowLabel: { fontSize: 14, color: '#111827', fontWeight: '600' },
  rowExtra: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  rowValue: { fontSize: 14, fontWeight: '700', color: '#1f2d4d' },
  smallBtn: {
    paddingHorizontal: 14, height: 32, borderRadius: 8,
    backgroundColor: '#1f2d4d', alignItems: 'center', justifyContent: 'center',
  },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  fineprint: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
  rulesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  rulesTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  ruleLine: { fontSize: 12, lineHeight: 18, color: '#4b5563' },
});

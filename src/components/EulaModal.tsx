// src/components/EulaModal.tsx
import React from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView, StyleSheet,
    Text, TouchableOpacity,
    View
} from 'react-native';
import { useAppTheme } from '../theme';

type Props = {
  visible: boolean;
  onAccept: () => void;
};

export default function EulaModal({ visible, onAccept}: Props) {
  const { theme } = useAppTheme();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Terms of Use</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Please read and agree before continuing</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            By using Obo, you agree to these Terms of Use. If you do not agree, you may not use the app.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>2. User-Generated Content</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            Obo allows users to post listings and communicate with others. You are solely responsible for
            content you post. We have zero tolerance for objectionable content or abusive behavior.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Prohibited Content</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            You may not post content that is illegal, harmful, threatening, abusive, harassing, defamatory,
            obscene, hateful, or otherwise objectionable. Violations may result in immediate removal and
            permanent account termination.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Reporting & Moderation</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            Users can report objectionable listings and block abusive users at any time. All reports are
            reviewed by Obo within 24 hours. Offending content will be removed and offending users
            will be ejected from the platform.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Blocking Users</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            You may block any user at any time. Blocked users will not appear in your feed or chats.
            Blocking a user also notifies Obo of potential abuse for review.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Privacy</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            Your .edu email is used solely for verification. We do not sell your personal data to third parties.
          </Text>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Changes to Terms</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            We may update these terms at any time. Continued use of the app after changes constitutes
            acceptance of the new terms.
          </Text>
        </ScrollView>

<View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
  <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: theme.accent }]} onPress={onAccept}>
    <Text style={styles.acceptText}>I Agree & Continue</Text>
  </TouchableOpacity>
</View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 16 },
  body: { fontSize: 14, color: '#4b5563', lineHeight: 22 },
  footer: {
    flexDirection: 'row', gap: 12, padding: 20,
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  declineBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center',
  },
  declineText: { color: '#6b7280', fontWeight: '600', fontSize: 15 },
  acceptBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#8ef163', alignItems: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

import { useRouter } from 'expo-router';
import { reload, sendEmailVerification, signOut } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from '../../services/firebase';
import { useAppTheme } from '../../theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const currentUser = auth.currentUser;
  const email = currentUser?.email || 'your school email';
  const backgroundImage = require('@/assets/images/bg.jpeg');

  const handleContinue = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/(auth)/signup');
      return;
    }

    setIsChecking(true);
    try {
      await reload(user);
      if (auth.currentUser?.emailVerified) {
        router.replace('/(auth)/onboard');
      } else {
        Alert.alert('Still waiting', 'Open the link in your email first, then come back here.');
      }
    } catch {
      Alert.alert('Error', 'Could not refresh your account right now.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsResending(true);
    try {
      await sendEmailVerification(user);
      Alert.alert('Verification sent', `We sent a fresh link to ${email}.`);
    } catch (error: any) {
      Alert.alert('Could not resend', error?.message || 'Try again in a minute.');
    } finally {
      setIsResending(false);
    }
  };

  const handleUseDifferentEmail = async () => {
    await signOut(auth);
    router.replace('/(auth)/signup');
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>Check your email</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            We sent a verification link to{'\n'}
            <Text style={[styles.emailText, { color: theme.primary }]}>{email}</Text>
          </Text>
          <Text style={[styles.bodyText, { color: theme.textMuted }]}>
            If you can&apos;t find the email in your inbox, try checking your spam folder. Tap the link so we know that email is actually yours. Once that’s done, come back and continue.
          </Text>

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={handleContinue} disabled={isChecking}>
            {isChecking ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>I verified my email</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]} onPress={handleResend} disabled={isResending}>
            {isResending ? <ActivityIndicator color={theme.primary} /> : <Text style={[styles.secondaryText, { color: theme.primary }]}>Resend link</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleUseDifferentEmail}>
            <Text style={[styles.linkText, { color: theme.accent }]}>Use a different email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    opacity: 0.42,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  emailText: {
    fontWeight: '700',
    color: '#1f2d4d',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6b7280',
  },
  primaryButton: {
    backgroundColor: '#1f2d4d',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  secondaryText: {
    color: '#1f2d4d',
    fontSize: 15,
    fontWeight: '700',
  },
  linkText: {
    textAlign: 'center',
    color: '#6366f1',
    fontWeight: '600',
  },
});

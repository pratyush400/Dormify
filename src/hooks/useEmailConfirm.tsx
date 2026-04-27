/**
 * EmailConfirmationScreen.tsx
 *
 * A 4-digit OTP email confirmation screen for React Native Expo + Firebase.
 *
 * SETUP:
 *   1. npm install @react-native-firebase/app @react-native-firebase/auth
 *      OR if using Expo managed workflow: npx expo install expo-firebase-recaptcha firebase
 *
 *   2. This component uses Firebase's ActionCodeSettings pattern.
 *      Swap the `verifyCode` function body with your actual Firebase verification logic
 *      (see comments inside the function).
 *
 *   3. Navigation: uses React Navigation. Pass `email` as a route param:
 *        navigation.navigate('EmailConfirmation', { email: 'user@example.com' });
 *
 * PROPS (via React Navigation route params):
 *   email        – the address the OTP was sent to
 *   onConfirmed  – optional callback fired after successful verification
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';

// ─── Firebase ────────────────────────────────────────────────────────────────
// Uncomment the import that matches your Firebase setup:
//
// Option A – Expo managed workflow (firebase JS SDK)
// import { getAuth, applyActionCode, sendEmailVerification } from 'firebase/auth';
//
// Option B – React Native Firebase (@react-native-firebase)
// import auth from '@react-native-firebase/auth';

// ─── Navigation (React Navigation) ───────────────────────────────────────────
// import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// type RouteParams = { email: string; onConfirmed?: () => void };

// ─── Constants ────────────────────────────────────────────────────────────────
const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 60;

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  /** Email address the OTP was sent to */
  email: string;
  /** Called when the user successfully verifies their code */
  onConfirmed?: () => void;
  /** Called when the user presses "Go back" */
  onBack?: () => void;
}

export default function EmailConfirmationScreen({
  email = 'user@example.com',
  onConfirmed,
  onBack,
}: Props) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // ── Cooldown timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ── Shake animation on error ────────────────────────────────────────────────
  const triggerShake = useCallback(() => {
    Vibration.vibrate(300);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // ── Success animation ───────────────────────────────────────────────────────
  const triggerSuccess = useCallback(() => {
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 6,
    }).start();
  }, [successAnim]);

  // ── Handle digit input ──────────────────────────────────────────────────────
  const handleChange = (text: string, index: number) => {
    // Accept only digits
    const cleaned = text.replace(/\D/g, '');
    if (!cleaned) return;

    const lastChar = cleaned[cleaned.length - 1];
    const newDigits = [...digits];
    newDigits[index] = lastChar;
    setDigits(newDigits);
    setError('');

    // Auto-advance
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else {
      inputRefs.current[index]?.blur();
      // Auto-submit when last digit is filled
      handleVerify(newDigits);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newDigits = [...digits];
      if (newDigits[index]) {
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // ── Handle paste (all 4 digits at once) ────────────────────────────────────
  const handlePaste = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (cleaned.length === OTP_LENGTH) {
      const newDigits = cleaned.split('');
      setDigits(newDigits);
      inputRefs.current[OTP_LENGTH - 1]?.blur();
      handleVerify(newDigits);
    }
  };

  // ── Firebase verification ───────────────────────────────────────────────────
  const handleVerify = async (currentDigits: string[] = digits) => {
    const code = currentDigits.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter all 4 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ── Replace this block with your real Firebase logic ──────────────────
      //
      // Option A: Custom backend that issued the OTP
      //   const res = await fetch('https://your-api.com/verify-otp', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ email, code }),
      //   });
      //   if (!res.ok) throw new Error('Invalid code');
      //
      // Option B: Firebase Phone Auth (if you're using phone+email combo)
      //   const credential = PhoneAuthProvider.credential(verificationId, code);
      //   await signInWithCredential(auth, credential);
      //
      // Option C: Firebase Email Link (applyActionCode)
      //   await applyActionCode(auth, actionCode);   // actionCode from deep link
      //
      // ── Simulated delay (REMOVE in production) ────────────────────────────
      await new Promise((r) => setTimeout(r, 1200));
      const simulatedSuccess = code !== '0000'; // treat 0000 as wrong for demo
      if (!simulatedSuccess) throw new Error('The code you entered is incorrect.');
      // ── End of simulated block ────────────────────────────────────────────

      setSuccess(true);
      triggerSuccess();
      setTimeout(() => onConfirmed?.(), 1500);
    } catch (err: any) {
      setError(err?.message ?? 'Verification failed. Please try again.');
      triggerShake();
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend code ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(''));
    setError('');

    try {
      // ── Replace with your actual resend logic ─────────────────────────────
      // await sendEmailVerification(auth.currentUser!);
      // OR: await fetch('https://your-api.com/resend-otp', { ... });
      await new Promise((r) => setTimeout(r, 500)); // simulated
    } catch {
      setError('Failed to resend code. Please try again.');
    }
  };

  // ── Masked email display ────────────────────────────────────────────────────
  const maskedEmail = (() => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.slice(0, 2);
    const masked = '*'.repeat(Math.max(local.length - 2, 3));
    return `${visible}${masked}@${domain}`;
  })();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        {/* Back button */}
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✉️</Text>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a 4-digit code to{'\n'}
          <Text style={styles.emailText}>{maskedEmail}</Text>
        </Text>

        {/* OTP inputs */}
        <Animated.View
          style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                success ? styles.otpBoxSuccess : null,
                error ? styles.otpBoxError : null,
              ]}
              value={digit}
              onChangeText={(text) => {
                // Handle paste of full code
                if (text.length > 1) { handlePaste(text); return; }
                handleChange(text, i);
              }}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH} // allows paste
              textContentType="oneTimeCode" // iOS autofill from SMS/email
              autoComplete="one-time-code"
              selectTextOnFocus
              editable={!loading && !success}
              caretHidden
            />
          ))}
        </Animated.View>

        {/* Error message */}
        {!!error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Success message */}
        {success && (
          <Animated.View style={{ opacity: successAnim, transform: [{ scale: successAnim }] }}>
            <Text style={styles.successText}>✓ Email verified!</Text>
          </Animated.View>
        )}

        {/* Verify button */}
        {!success && (
          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={() => handleVerify()}
            activeOpacity={0.85}
            disabled={loading || digits.join('').length < OTP_LENGTH}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn't receive it? </Text>
          <TouchableOpacity onPress={handleResend} disabled={!canResend} activeOpacity={0.7}>
            <Text style={[styles.resendLink, !canResend && styles.resendLinkDisabled]}>
              {canResend ? 'Resend code' : `Resend in ${cooldown}s`}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ACCENT = '#4F6EF7';
const ACCENT_LIGHT = '#EEF1FE';
const SUCCESS = '#22C55E';
const ERROR = '#EF4444';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER = '#E5E7EB';
const BOX_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backArrow: {
    fontSize: 20,
    color: ACCENT,
  },
  backText: {
    fontSize: 15,
    color: ACCENT,
    fontWeight: '500',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  emailText: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },

  // OTP boxes
  otpRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  otpBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: ACCENT,
    backgroundColor: ACCENT_LIGHT,
  },
  otpBoxSuccess: {
    borderColor: SUCCESS,
    backgroundColor: '#F0FDF4',
  },
  otpBoxError: {
    borderColor: ERROR,
    backgroundColor: '#FEF2F2',
  },

  // Messages
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  successText: {
    color: SUCCESS,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Button
  verifyButton: {
    width: '100%',
    height: 52,
    backgroundColor: ACCENT,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Resend
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendLabel: {
    color: TEXT_SECONDARY,
    fontSize: 14,
  },
  resendLink: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: TEXT_SECONDARY,
    fontWeight: '400',
  },
});
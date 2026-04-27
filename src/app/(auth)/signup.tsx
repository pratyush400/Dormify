import { useAppTheme } from '@/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getSchoolFromEmail } from '../../constants/schools';
import { auth, db } from '../../services/firebase';
import {
  applyReferral,
  findUserByUsername,
  normalizeUsername,
  ZERO_ENTRIES,
} from '../../services/raffle';

const PENDING_REFERRAL_KEY = '@obo/pendingReferral';

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ref?: string }>();
  const backgroundImage = require("@/assets/images/signup_bg.jpg");

  const [fname, setFName] = useState('');
  const [lname, setLName] = useState('');
  const [username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isValidEduEmail = email.toLowerCase().endsWith('.edu');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralError, setReferralError] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const detectedSchool = getSchoolFromEmail(email);
  const { theme } = useAppTheme();

  useEffect(() => {
    (async () => {
      const fromParam = (params?.ref ?? '').toString();
      const stored = await AsyncStorage.getItem(PENDING_REFERRAL_KEY);
      const code = fromParam || stored || '';
      if (code) {
        setReferralCode(code);
        checkReferral(code);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkReferral = async (value: string) => {
    const code = normalizeUsername(value);
    if (!code) {
      setReferralError('');
      setReferralValid(false);
      return;
    }
    if (code === normalizeUsername(username)) {
      setReferralError("You can't refer yourself.");
      setReferralValid(false);
      return;
    }
    const found = await findUserByUsername(code);
    if (!found) {
      setReferralError('Code not found.');
      setReferralValid(false);
    } else {
      setReferralError('');
      setReferralValid(true);
    }
  };

const checkUsername = async (value: string) => {
  if (!value) return;
  const snapshot = await getDocs(query(collection(db, "users"), where("username", "==", value)));
  if (!snapshot.empty) {
    setUsernameError("This username is taken.");
  } else {
    setUsernameError('');
  }
};

const checkEmail = async (value: string) => {
  if (!value.toLowerCase().endsWith('.edu')) return;
  const snapshot = await getDocs(query(collection(db, "users"), where("email", "==", value)));
  if (!snapshot.empty) {
    setEmailError("This email is already registered.");
  } else {
    setEmailError('');
  }
};

const signUp = async () => {
  if (!fname) return setErrorMessage("Enter your First name");
  if (!lname) return setErrorMessage("Enter your Last name");
  if (!username) return setErrorMessage("Enter a username");
  if (!isValidEduEmail) return setErrorMessage("Use your .edu email");
  if (password.length < 6) return setErrorMessage("Password must be 6+ characters");
  if (password !== confirmPassword) return setErrorMessage("Passwords don't match");
  if (usernameError || emailError) return;

  setErrorMessage('');
  setIsLoading(true);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const usernameLower = normalizeUsername(username);

    // single setDoc with all fields
    await setDoc(doc(db, "users", uid), {
      uid,
      username,
      usernameLower,
      fname,
      lname,
      email,
      hall: '',
      college: detectedSchool?.name || '',
      schoolKey: detectedSchool?.key || '',
      avatarUrl: '',
      createdAt: serverTimestamp(),
      onboardingComplete: false,
      entries: { ...ZERO_ENTRIES, signup: 1 },
      referredBy: null,
    });

    // Apply referral if a valid code was entered
    const enteredCode = normalizeUsername(referralCode);
    if (enteredCode) {
      const referrer = await findUserByUsername(enteredCode);
      if (referrer && referrer.uid !== uid) {
        try {
          await applyReferral({ newUserUid: uid, referrerUid: referrer.uid });
        } catch (e) {
          console.warn('Referral apply failed', e);
        }
      }
    }

    await AsyncStorage.removeItem(PENDING_REFERRAL_KEY);
    await sendEmailVerification(userCredential.user);
    router.replace('/(auth)/verify-email');

  } catch (error: any) {
    setErrorMessage(error.message);
  } finally {
    setIsLoading(false);
  }
};
return (

<ImageBackground

source={backgroundImage}

style={styles.container}

resizeMode="cover"

>

<View style={styles.overlay} />

<KeyboardAvoidingView

behavior={Platform.OS === 'ios' ? 'padding' : 'height'}

style={{ flex: 1 }}

>

<ScrollView

contentContainerStyle={styles.scroll}

keyboardShouldPersistTaps="handled"

>


<View style={styles.header}>

<Text style={styles.title}>

Create Account

</Text>

<Text style={styles.subtitle}>

Use your school email to join Obo

</Text>

</View>


<View style={[styles.card, { backgroundColor: theme.surface }]}>

<TextInput
  placeholder="Username"
  placeholderTextColor="#9ca3af"
  style={styles.input}
  value={username}
  onChangeText={(v) => { setUserName(v); setUsernameError(''); }}
  onBlur={() => checkUsername(username)}
/>
{usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

<TextInput
  placeholder="Referral code (optional)"
  placeholderTextColor="#9ca3af"
  style={styles.input}
  autoCapitalize="none"
  value={referralCode}
  onChangeText={(v) => { setReferralCode(v); setReferralError(''); setReferralValid(false); }}
  onBlur={() => checkReferral(referralCode)}
/>
{referralError ? <Text style={styles.errorText}>{referralError}</Text> : null}
{referralValid ? <Text style={styles.referralHint}>+1 raffle entry for both of you 🎟️</Text> : null}

<TextInput
  placeholder="your@email.edu"
  placeholderTextColor="#9ca3af"
  style={styles.input}
  value={email}
  onChangeText={(v) => { setEmail(v); setEmailError(''); }}
  onBlur={() => checkEmail(email)}
/>
{emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
{detectedSchool ? <Text style={styles.schoolHint}>This looks like {detectedSchool.name}</Text> : null}

<TextInput

placeholder="First Name"
placeholderTextColor="#9ca3af"
style={styles.input}

value={fname}

onChangeText={setFName}

/>
<TextInput

placeholder="Last Name"
placeholderTextColor="#9ca3af"
style={styles.input}

value={lname}

onChangeText={setLName}

/>



<TextInput

placeholder="Password"
placeholderTextColor="#9ca3af"
secureTextEntry

style={styles.input}

value={password}

onChangeText={setPassword}

/>


<TextInput

placeholder="Confirm Password"
placeholderTextColor="#9ca3af"
secureTextEntry

style={styles.input}

value={confirmPassword}

onChangeText={setConfirmPassword}

/>


{errorMessage !== '' && (

<Text style={styles.errorText}>

{errorMessage}

</Text>

)}


<TouchableOpacity

style={[styles.submitBtn, { backgroundColor: theme.primary }]}

onPress={signUp}

>

{isLoading ? <ActivityIndicator color="white" /> :
<Text style={styles.submitText}>

Create Account
</Text>
}

</TouchableOpacity>


<TouchableOpacity

onPress={() => router.push('/(auth)/login')}

>

<Text style={[styles.toggleText, { color: theme.accent }]}>

Already have account? Login

</Text>

</TouchableOpacity>


</View>


</ScrollView>

</KeyboardAvoidingView>

</ImageBackground>

);

}



const styles = StyleSheet.create({

container: {

flex: 1,

},

overlay: {

position: "absolute",

width: "100%",

height: "100%",

backgroundColor: "#000",

opacity: 0.35,

},

scroll: {

flexGrow: 1,

justifyContent: 'center',

},

header: {

alignItems: 'center',

marginBottom: 30,

},

title: {

fontSize: 40,

color: 'white',

fontWeight: '700',

},

subtitle: {

color: 'white',

fontWeight: '600',

},

card: {

backgroundColor: 'white',

marginHorizontal: 20,

padding: 20,

borderRadius: 20,

gap: 15,

elevation: 10,

},

input: {

backgroundColor: '#f3f4f6',
color: '#111827',
padding: 14,

borderRadius: 10,

},

submitBtn: {

backgroundColor: '#6366f1',

padding: 15,

borderRadius: 12,

alignItems: 'center',

},

submitText: {

color: 'white',

fontWeight: '600',

},

toggleText: {

textAlign: 'center',

color: '#6366f1',

},

errorText: {

color: 'red',

},
schoolHint: {
  color: '#4b5563',
  fontSize: 13,
  fontWeight: '600',
  marginTop: -6,
},
referralHint: {
  color: '#16a34a',
  fontSize: 13,
  fontWeight: '600',
  marginTop: -6,
},

});

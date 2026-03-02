import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useRef } from 'react';
import { db } from '@/services/firebase';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

export default function SignupScreen() {
  const router = useRouter();
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


const isSigningUp = useRef(false);

// remove addDoc from imports since we don't need it anymore

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

    // single setDoc with all fields
    await setDoc(doc(db, "users", uid), {
      uid,
      username,
      fname,
      lname,
      email,
      hall: '',
      college: '',
      avatarUrl: '',
      createdAt: serverTimestamp(),
    });

    router.replace('/(auth)/onboard');

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

Use your LC or college email

</Text>

</View>


<View style={styles.card}>

<TextInput
  placeholder="Username"
  style={styles.input}
  value={username}
  onChangeText={(v) => { setUserName(v); setUsernameError(''); }}
  onBlur={() => checkUsername(username)}
/>
{usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

<TextInput
  placeholder="your@email.edu"
  style={styles.input}
  value={email}
  onChangeText={(v) => { setEmail(v); setEmailError(''); }}
  onBlur={() => checkEmail(email)}
/>
{emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

<TextInput

placeholder="First Name"

style={styles.input}

value={fname}

onChangeText={setFName}

/>
<TextInput

placeholder="Last Name"

style={styles.input}

value={lname}

onChangeText={setLName}

/>



<TextInput

placeholder="Password"

secureTextEntry

style={styles.input}

value={password}

onChangeText={setPassword}

/>


<TextInput

placeholder="Confirm Password"

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

style={styles.submitBtn}

onPress={signUp}

>

{isLoading ? <ActivityIndicator color="white" /> :
<Text style={styles.submitText}>

Create Account
</Text>
}

</TouchableOpacity>


<TouchableOpacity

onPress={() => router.back()}

>

<Text style={styles.toggleText}>

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

});
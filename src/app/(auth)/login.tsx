///Users/pc/Dormify/Dormify/src/app/(auth)/login.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

import {
  reload,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from 'firebase/auth';

import { auth } from '../../services/firebase';
import { useAppTheme } from '../../theme';

export default function LoginScreen() {

  const router = useRouter();
  const { theme } = useAppTheme();

  const backgroundImage = require("@/assets/images/bg.jpeg");

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValidEduEmail = email.toLowerCase().endsWith('.edu');
  const isFormValid = isValidEduEmail && password.length >= 6;


  const signIn = async () => {

    if (!isFormValid) return;

    setIsLoading(true);

    try {

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await reload(userCredential.user);

      if (!auth.currentUser?.emailVerified) {
        router.replace('/(auth)/verify-email');
        return;
      }

      router.replace('/(tabs)/home');

    }

    catch (error: any) {

      setErrorMessage(error.message);

    }

    finally {

      setIsLoading(false);

    }

  };


  const goToSignup = () => {

    router.push('/(auth)/signup');

  };


  const resetPassword = async () => {

    if (!isValidEduEmail) {

      setErrorMessage('Enter valid .edu email');

      return;

    }

    try {

      await sendPasswordResetEmail(auth, email);

      setErrorMessage('Reset email sent');

    }

    catch (error: any) {

      setErrorMessage(error.message);

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

<Text style={styles.title}>Obo</Text>

<Text style={styles.subtitle}>

Login with your school email

</Text>

</View>



<View style={[styles.card, { backgroundColor: theme.surface }]}>


<TextInput

placeholder="lcxx-xxxx@lclark.edu"
placeholderTextColor="#9ca3af"
style={styles.input}

value={email}

onChangeText={setEmail}

/>


<TextInput

placeholder="Password"
placeholderTextColor="#9ca3af"
secureTextEntry

style={styles.input}

value={password}

onChangeText={setPassword}

/>


{errorMessage !== '' && (

<Text style={styles.errorText}>

{errorMessage}

</Text>

)}



<TouchableOpacity

style={[styles.submitBtn, { backgroundColor: theme.primary }]}

onPress={signIn}

>

{isLoading

?

<ActivityIndicator color="white" />

:

<Text style={styles.submitText}>

Login

</Text>

}

</TouchableOpacity>



<TouchableOpacity onPress={goToSignup}>

<Text style={[styles.toggleText, { color: theme.accent }]}>

Create account

</Text>

</TouchableOpacity>



<TouchableOpacity onPress={resetPassword}>

<Text style={[styles.resetText, { color: theme.textMuted }]}>

Forgot password

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

justifyContent: 'center',

},

overlay: {

position: 'absolute',

width: '100%',

height: '100%',

backgroundColor: '#000',

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

fontWeight: '700',

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

resetText: {

textAlign: 'center',

color: '#9333ea',

},

errorText: {

color: 'red',

},

});

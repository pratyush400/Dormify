import React, { useState } from 'react';
import { useRouter } from 'expo-router';
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

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';

import { auth } from '@/services/firebase';

export default function LoginScreen() {

  const router = useRouter();

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

      await signInWithEmailAndPassword(auth, email, password);

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

<Text style={styles.title}>Dormify</Text>

<Text style={styles.subtitle}>

Login with your LC or college email

</Text>

</View>



<View style={styles.card}>


<TextInput

placeholder="lcxx-xxxx@lclark.edu"

style={styles.input}

value={email}

onChangeText={setEmail}

/>


<TextInput

placeholder="Password"

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

style={styles.submitBtn}

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

<Text style={styles.toggleText}>

Create account

</Text>

</TouchableOpacity>



<TouchableOpacity onPress={resetPassword}>

<Text style={styles.resetText}>

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
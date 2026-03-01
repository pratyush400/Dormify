import React from 'react';
import { useRouter } from 'expo-router';
import { View, Image, StyleSheet, Text , TouchableOpacity} from 'react-native';

  const backgroundImage = require("@/assets/images/boarding.jpg");
export default function App() {
const router = useRouter()
  return (
    <View style={styles.container}>
        <Text style={styles.text}>Welcome! Chose your school 🏫 </Text>

        <TouchableOpacity style={styles.card} onPress={()=>router.replace('/(tabs)/home')}>
          <Image style={styles.img} source={backgroundImage}/>
  <Text style={styles.cardText}>Lewis & Clark College </Text>
</TouchableOpacity>
    </View>

  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#5ccbcb',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#010103',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  img: {
    width: 140,
    height: 140,
    borderRadius: 16,
  },
});
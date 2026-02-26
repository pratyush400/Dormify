import { Text, View, StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import {Link} from "expo-router"

export default function Home() {
  return (
    <View style={styles.container}>
      <Text>This is Dormify screen.</Text>
      <Image 
  source={{ uri: 'https://www.lclark.edu/live/image/gid/185/width/600/height/600/crop/1/111492_CAM-L-0719-0001.jpg' }} 
  style={{ width: 400, height: 500 }} 
/>
    <TextInput placeholder="Email " />
    <ActivityIndicator size={"large"}/>
    <Link href={"/profile"}> Go to the about page</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

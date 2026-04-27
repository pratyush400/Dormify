import { Tabs } from "expo-router";
import { Image } from "react-native";

export default function TabsLayout() {

  return (

    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1f2d4d",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          backgroundColor: "#fff",
          borderTopColor: "#e5e7eb",
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >

      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/home.png')}
              style={{
                width: size,
                height: size,
                tintColor: color,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/search.png')}
              style={{
                width: size,
                height: size,
                tintColor: color,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="campus"
        options={{
          title: "Campus",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/img.png')}
              style={{
                width: size,
                height: size,
                tintColor: color,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="sell"
        options={{
          title: "Post",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/sell.png')}
              style={{
                width: size,
                height: size,
                tintColor: color,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/chats.png')}
              style={{
                width: size,
                height: size,
                tintColor: color,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/profile.png')}
              style={{
                width: size,
                height: size,
                tintColor: color,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          href: null,
        }}
      />

    </Tabs>

  );

}
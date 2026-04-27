import { useUser } from '@/hooks/useUser';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Tabs } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { db } from '../../services/firebase';

type ChatTabRecord = {
  id: string;
  participants?: string[];
  unreadCount?: Record<string, number>;
  lastMessageTime?: {
    toDate?: () => Date;
  } | Date | null;
};

function ChatsTabIcon({
  color,
  size,
  unreadChatsCount,
}: {
  color: string;
  size: number;
  unreadChatsCount: number;
}) {
  const badgeLabel = unreadChatsCount > 3 ? '3+' : String(unreadChatsCount);

  return (
    <View style={styles.iconWrapper}>
      <Image
        source={require('@/assets/images/chats.png')}
        style={{
          width: size,
          height: size,
          tintColor: color,
        }}
      />
      {unreadChatsCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useUser();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadChatsCount(0);
      return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chats = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) } as ChatTabRecord));
      const latestByOtherParticipant = new Map<string, ChatTabRecord>();

      for (const chat of chats) {
        const otherId = chat.participants?.find((participantId) => participantId !== user.uid) ?? chat.id;
        const existing = latestByOtherParticipant.get(otherId);

        if (!existing) {
          latestByOtherParticipant.set(otherId, chat);
          continue;
        }

        const existingTime = existing.lastMessageTime && 'toDate' in existing.lastMessageTime && existing.lastMessageTime.toDate
          ? existing.lastMessageTime.toDate()
          : existing.lastMessageTime instanceof Date
            ? existing.lastMessageTime
            : new Date(0);

        const currentTime = chat.lastMessageTime && 'toDate' in chat.lastMessageTime && chat.lastMessageTime.toDate
          ? chat.lastMessageTime.toDate()
          : chat.lastMessageTime instanceof Date
            ? chat.lastMessageTime
            : new Date(0);

        if (currentTime > existingTime) {
          latestByOtherParticipant.set(otherId, chat);
        }
      }

      const unreadThreads = Array.from(latestByOtherParticipant.values()).filter(
        (chat) => (chat.unreadCount?.[user.uid] ?? 0) > 0
      ).length;

      setUnreadChatsCount(unreadThreads);
    });

    return () => unsubscribe();
  }, [user?.uid]);

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
      {/* <Tabs.Screen
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
      /> */}

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
            <ChatsTabIcon
              color={color}
              size={size}
              unreadChatsCount={unreadChatsCount}
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

const styles = StyleSheet.create({
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

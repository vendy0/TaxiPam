import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { useProfile } from '../../lib/useProfile';
import { supabase } from '../../lib/supabase';

// Icônes simples en emoji — remplace par react-native-vector-icons si tu veux
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

export default function TabsLayout() {
  const { profile, loading } = useProfile();

  // Garde d'authentification
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/(auth)/');
    });
  }, []);

  // Chauffeur/Livreur non encore approuvé → pending
  useEffect(() => {
    if (!loading && profile) {
      const needsVerif = profile.role === 'chauffeur' || profile.role === 'livreur';
      if (needsVerif && profile.verification_status !== 'approved') {
        router.replace('/(auth)/pending');
      }
    }
  }, [profile, loading]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  const role = profile?.role ?? 'client';

  // Quels onglets cacher selon le rôle
  // href: null = onglet invisible dans la tab bar
  const hide = (tab: string): { href: null } | undefined => {
    const hidden: Record<string, string[]> = {
      client:   ['deliveries', 'history'],
      chauffeur:['deliveries', 'orders'],
      livreur:  ['map', 'history'],
    };
    return hidden[role]?.includes(tab) ? { href: null } : undefined;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1B3E',
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#F5A623',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: -2 },
      }}
    >
      {/* ── MAP (client + chauffeur) ── */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Karte',
          href: hide('map'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
        }}
      />

      {/* ── DELIVERIES (livreur uniquement) ── */}
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'Livrezon',
          href: hide('deliveries'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
        }}
      />

      {/* ── ORDERS (client + livreur actif) ── */}
      <Tabs.Screen
        name="orders"
        options={{
          title: role === 'livreur' ? 'An Kou' : 'Kòmand',
          href: hide('orders'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚀" focused={focused} />,
        }}
      />

      {/* ── CHATS (tous) ── */}
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Mesaj',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />

      {/* ── HISTORY (chauffeur uniquement) ── */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'Istwa',
          href: hide('history'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />

      {/* ── PROFILE (tous) ── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Pwofil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1, backgroundColor: '#0D1B3E',
    alignItems: 'center', justifyContent: 'center',
  },
});

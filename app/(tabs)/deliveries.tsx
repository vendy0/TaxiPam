/**
 * deliveries.tsx — Livraisons disponibles (livreur uniquement)
 * Liste les commandes de restaurants/boutiques à aller chercher.
 */
import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Platform, Alert
} from 'react-native';

type Delivery = {
  id: string;
  store: string;
  storeEmoji: string;
  storeAddress: string;
  clientAddress: string;
  distance: string;
  reward: number;
  items: number;
  timeLimit: string;
};

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: 'D1', store: 'Pizza Palace', storeEmoji: '🍕',
    storeAddress: 'Pétion-Ville, Ri Lamarre',
    clientAddress: 'Delmas 60, Ri 15',
    distance: '3.2 km', reward: 250, items: 2, timeLimit: '30 min',
  },
  {
    id: 'D2', store: 'Burger King Delmas', storeEmoji: '🍔',
    storeAddress: 'Delmas 75',
    clientAddress: 'Delmas 33, Apk. B3',
    distance: '1.8 km', reward: 180, items: 1, timeLimit: '20 min',
  },
  {
    id: 'D3', store: 'Pharmaci Populè', storeEmoji: '💊',
    storeAddress: 'Taba, Ri Principale',
    clientAddress: 'Kafou, Zone 3',
    distance: '5.0 km', reward: 350, items: 3, timeLimit: '45 min',
  },
];

export default function DeliveriesScreen() {
  const [accepted, setAccepted] = useState<string | null>(null);

  function handleAccept(delivery: Delivery) {
    Alert.alert(
      `✅ Aksepte Livrezon`,
      `Ou aksepte livrezon ${delivery.store}.\n\nAle nan boutik la pran kòmand nan, epi livre kliyan an.`,
      [
        { text: 'Anile', style: 'cancel' },
        {
          text: 'Konfime',
          onPress: () => {
            setAccepted(delivery.id);
            // TODO: Update Supabase, navigate to orders (active)
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Livrezon Disponib</Text>
        <Text style={styles.headerSub}>{MOCK_DELIVERIES.length} kòmand pre ou</Text>
      </View>

      {/* Filtre rapide */}
      <View style={styles.filters}>
        <FilterChip label="Tout" active />
        <FilterChip label="< 2 km" />
        <FilterChip label="Manje" />
        <FilterChip label="Famasi" />
      </View>

      {/* Liste */}
      <FlatList
        data={MOCK_DELIVERIES}
        keyExtractor={i => i.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, accepted === item.id && styles.cardAccepted]}>
            {/* Store info */}
            <View style={styles.cardHeader}>
              <Text style={styles.storeEmoji}>{item.storeEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeName}>{item.store}</Text>
                <Text style={styles.storeAddr}>📍 {item.storeAddress}</Text>
              </View>
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>{item.reward} HTG</Text>
              </View>
            </View>

            {/* Route */}
            <View style={styles.route}>
              <View style={styles.routeRow}>
                <Text style={styles.routeDot}>🟡</Text>
                <Text style={styles.routeText}>{item.storeAddress}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <Text style={styles.routeDot}>🔴</Text>
                <Text style={styles.routeText}>{item.clientAddress}</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatChip icon="📍" label={item.distance} />
              <StatChip icon="⏱️" label={item.timeLimit} />
              <StatChip icon="📦" label={`${item.items} atik`} />
            </View>

            {/* Bouton */}
            {accepted === item.id ? (
              <View style={styles.acceptedBanner}>
                <Text style={styles.acceptedText}>✅ Ou aksepte livrezon sa</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.acceptBtnText}>🚀 Pran Livrezon</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>Pa gen livrezon disponib pou kounye a</Text>
          </View>
        }
      />
    </View>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <TouchableOpacity style={[filterSt.chip, active && filterSt.chipActive]}>
      <Text style={[filterSt.label, active && filterSt.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={statSt.wrap}>
      <Text style={statSt.icon}>{icon}</Text>
      <Text style={statSt.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3E9' },
  header: {
    backgroundColor: '#0D1B3E',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FEFAE0' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },

  filters: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
  },

  list: { padding: 16, gap: 14 },

  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1.5, borderColor: '#E8E0D0',
  },
  cardAccepted: { borderColor: '#28A745', backgroundColor: '#F0FFF4' },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  storeEmoji: { fontSize: 30, marginTop: 2 },
  storeName: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  storeAddr: { fontSize: 12, color: '#888', marginTop: 2 },
  rewardBadge: {
    backgroundColor: '#FFF3CD', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center',
  },
  rewardText: { fontWeight: '900', fontSize: 14, color: '#7A5D00' },

  route: { gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeDot: { fontSize: 12 },
  routeText: { fontSize: 13, color: '#444', flex: 1 },
  routeLine: { height: 1, backgroundColor: '#EEE', marginLeft: 22 },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderTopWidth: 1, borderTopColor: '#F0EBE0', paddingTop: 12,
  },

  acceptBtn: {
    backgroundColor: '#F5A623', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  acceptBtnText: { fontWeight: '900', fontSize: 14, color: '#0D1B3E' },

  acceptedBanner: {
    backgroundColor: '#D4EDDA', borderRadius: 10, padding: 12, alignItems: 'center',
  },
  acceptedText: { color: '#155724', fontWeight: '700', fontSize: 13 },

  empty: { alignItems: 'center', padding: 48, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#AAA', textAlign: 'center' },
});

const filterSt = StyleSheet.create({
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E0D8C8',
  },
  chipActive: { backgroundColor: '#0D1B3E', borderColor: '#0D1B3E' },
  label: { fontSize: 12, fontWeight: '700', color: '#888' },
  labelActive: { color: '#F5A623' },
});

const statSt = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 3 },
  icon: { fontSize: 16 },
  label: { fontSize: 11, fontWeight: '700', color: '#555' },
});

/**
 * orders.tsx — Écran des commandes
 * Client : voit sa commande active + historique
 * Chauffeur : voit les demandes de course disponibles
 * Livreur : voit sa livraison active
 */
import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Platform, Alert
} from 'react-native';
import { useProfile } from '../../lib/useProfile';

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_ACTIVE_ORDER = {
  id: 'ORD-001',
  status: 'en_route',
  driver: 'Jean-Marc',
  driverRating: 4.8,
  from: 'Delmas 33',
  to: 'Pétion-Ville',
  price: 150,
  eta: '5 min',
};

const MOCK_RIDE_REQUESTS = [
  { id: 'R1', from: 'Delmas 19', to: 'Delmas 60', price: 100, distance: '2.3 km', time: '8 min' },
  { id: 'R2', from: 'Taba', to: 'Pétion-Ville', price: 200, distance: '4.1 km', time: '14 min' },
  { id: 'R3', from: 'Kafou', to: 'Delmas 33', price: 180, distance: '3.8 km', time: '12 min' },
];

const MOCK_HISTORY = [
  { id: 'H1', date: '20 Me 2026', from: 'Delmas 19', to: 'Delmas 60', price: 100, status: 'done' },
  { id: 'H2', date: '18 Me 2026', from: 'Taba', to: 'Centre-Ville', price: 250, status: 'done' },
];

// ── STATUS helpers ─────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  en_route: { label: '🏍️ Chofè an wout', color: '#155724', bg: '#D4EDDA' },
  waiting:  { label: '⏳ Ap tann chofè', color: '#7A5D00', bg: '#FFF3CD' },
  done:     { label: '✅ Fini',           color: '#555',    bg: '#EEE' },
};

// ── Composant principal ────────────────────────────────────────────────────
export default function OrdersScreen() {
  const { profile } = useProfile();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const role = profile?.role ?? 'client';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {role === 'chauffeur' ? '🏍️ Demann Kous' :
           role === 'livreur'   ? '📦 An Kou'       :
                                  '🚀 Kòmand Ou'}
        </Text>
      </View>

      {/* Tabs (client uniquement) */}
      {role === 'client' && (
        <View style={styles.tabs}>
          {(['active', 'history'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                {t === 'active' ? '🔴 Aktif' : '📋 Istwa'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Contenu selon rôle */}
      <View style={styles.body}>
        {role === 'client' && tab === 'active' && <ClientActiveOrder />}
        {role === 'client' && tab === 'history' && <HistoryList />}
        {role === 'chauffeur' && <RideRequestList />}
        {role === 'livreur' && <ClientActiveOrder />}
      </View>
    </View>
  );
}

// ── Client: commande active ────────────────────────────────────────────────
function ClientActiveOrder() {
  const o = MOCK_ACTIVE_ORDER;
  const statusInfo = STATUS_MAP[o.status];

  return (
    <View style={card.container}>
      <Text style={card.title}>Kòmand {o.id}</Text>

      <View style={[card.statusBadge, { backgroundColor: statusInfo.bg }]}>
        <Text style={[card.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
      </View>

      <View style={card.route}>
        <View style={card.routeRow}>
          <Text style={card.dot}>🟢</Text>
          <Text style={card.routeText}>{o.from}</Text>
        </View>
        <View style={card.routeLine} />
        <View style={card.routeRow}>
          <Text style={card.dot}>🔴</Text>
          <Text style={card.routeText}>{o.to}</Text>
        </View>
      </View>

      <View style={card.info}>
        <InfoRow label="Chofè" value={`${o.driver} ⭐${o.driverRating}`} />
        <InfoRow label="Pri" value={`${o.price} HTG`} />
        <InfoRow label="ETA" value={o.eta} />
      </View>

      <TouchableOpacity style={card.contactBtn}>
        <Text style={card.contactBtnText}>💬 Kontakte Chofè</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Chauffeur: liste de demandes ───────────────────────────────────────────
function RideRequestList() {
  function accept(id: string) {
    Alert.alert('Aksepte Kous', 'Ou aksepte kous sa. Ale pran pasaje a!', [
      { text: 'OK' }
    ]);
  }

  return (
    <FlatList
      data={MOCK_RIDE_REQUESTS}
      keyExtractor={i => i.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, padding: 16 }}
      renderItem={({ item }) => (
        <View style={request.card}>
          <View style={request.route}>
            <View style={request.routeRow}>
              <Text>🟢</Text>
              <Text style={request.routeText}>{item.from}</Text>
            </View>
            <View style={request.routeRow}>
              <Text>🔴</Text>
              <Text style={request.routeText}>{item.to}</Text>
            </View>
          </View>
          <View style={request.stats}>
            <Stat icon="💰" value={`${item.price} HTG`} />
            <Stat icon="📍" value={item.distance} />
            <Stat icon="⏱️" value={item.time} />
          </View>
          <TouchableOpacity style={request.acceptBtn} onPress={() => accept(item.id)}>
            <Text style={request.acceptBtnText}>✅ Aksepte</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={<EmptyState emoji="🏍️" text="Pa gen demann kous pou kounye a" />}
    />
  );
}

// ── Client: historique ─────────────────────────────────────────────────────
function HistoryList() {
  return (
    <FlatList
      data={MOCK_HISTORY}
      keyExtractor={i => i.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, padding: 16 }}
      renderItem={({ item }) => (
        <View style={hist.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={hist.date}>{item.date}</Text>
            <Text style={hist.price}>{item.price} HTG</Text>
          </View>
          <Text style={hist.route}>{item.from} → {item.to}</Text>
        </View>
      )}
      ListEmptyComponent={<EmptyState emoji="📋" text="Ou pa gen kous nan istwa ou" />}
    />
  );
}

// ── Sous-composants ────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: '#888', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: '#1A1A1A', fontSize: 13, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

function Stat({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#555' }}>{value}</Text>
    </View>
  );
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={{ alignItems: 'center', padding: 40, gap: 12 }}>
      <Text style={{ fontSize: 48 }}>{emoji}</Text>
      <Text style={{ fontSize: 14, color: '#AAA', textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3E9' },
  header: {
    backgroundColor: '#0D1B3E',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FEFAE0' },
  tabs: {
    flexDirection: 'row', margin: 12, gap: 8,
  },
  tabBtn: {
    flex: 1, padding: 10, borderRadius: 10,
    alignItems: 'center', backgroundColor: '#FFF',
    borderWidth: 1.5, borderColor: '#E0D8C8',
  },
  tabBtnActive: { backgroundColor: '#0D1B3E', borderColor: '#0D1B3E' },
  tabBtnText: { fontSize: 13, fontWeight: '700', color: '#888' },
  tabBtnTextActive: { color: '#F5A623' },
  body: { flex: 1 },
});

const card = StyleSheet.create({
  container: { margin: 16, backgroundColor: '#FFF', borderRadius: 18, padding: 20, gap: 14 },
  title: { fontSize: 13, color: '#AAA', fontWeight: '600' },
  statusBadge: { borderRadius: 8, padding: 10, alignItems: 'center' },
  statusText: { fontWeight: '800', fontSize: 14 },
  route: { gap: 6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { fontSize: 14 },
  routeText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  routeLine: { height: 1, backgroundColor: '#EEE', marginLeft: 24 },
  info: { borderTopWidth: 1, borderTopColor: '#F0EBE0', paddingTop: 12, gap: 4 },
  contactBtn: {
    backgroundColor: '#0D1B3E', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  contactBtnText: { color: '#F5A623', fontWeight: '800', fontSize: 14 },
});

const request = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, gap: 12 },
  route: { gap: 6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F0EBE0' },
  acceptBtn: { backgroundColor: '#F5A623', borderRadius: 12, padding: 14, alignItems: 'center' },
  acceptBtnText: { fontWeight: '900', fontSize: 14, color: '#0D1B3E' },
});

const hist = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, gap: 6 },
  date: { fontSize: 12, color: '#AAA' },
  price: { fontSize: 13, fontWeight: '800', color: '#0D1B3E' },
  route: { fontSize: 14, color: '#333', fontWeight: '600' },
});

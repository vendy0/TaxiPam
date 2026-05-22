import { View, Text, FlatList, StyleSheet, Platform } from 'react-native';

const MOCK_HISTORY = [
  { id: 'H1', date: '20 Me 2026', from: 'Delmas 19', to: 'Delmas 60', price: 100, rating: 5 },
  { id: 'H2', date: '19 Me 2026', from: 'Taba', to: 'Pétion-Ville', price: 200, rating: 4 },
  { id: 'H3', date: '18 Me 2026', from: 'Kafou', to: 'Centre-Ville', price: 180, rating: 5 },
  { id: 'H4', date: '17 Me 2026', from: 'Delmas 33', to: 'Delmas 75', price: 120, rating: 3 },
];

const TOTAL = MOCK_HISTORY.reduce((sum, h) => sum + h.price, 0);
const AVG_RATING = (MOCK_HISTORY.reduce((s, h) => s + h.rating, 0) / MOCK_HISTORY.length).toFixed(1);

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Istwa Kous</Text>
      </View>

      {/* Résumé */}
      <View style={styles.summary}>
        <SummaryCard emoji="💰" label="Total semèn" value={`${TOTAL} HTG`} />
        <SummaryCard emoji="🏍️" label="Kous fè" value={`${MOCK_HISTORY.length}`} />
        <SummaryCard emoji="⭐" label="Nòt mwayen" value={AVG_RATING} />
      </View>

      <FlatList
        data={MOCK_HISTORY}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.price}>+{item.price} HTG</Text>
            </View>
            <Text style={styles.route}>{item.from} → {item.to}</Text>
            <Text style={styles.stars}>{'⭐'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Text>
          </View>
        )}
      />
    </View>
  );
}

function SummaryCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={sumSt.card}>
      <Text style={sumSt.emoji}>{emoji}</Text>
      <Text style={sumSt.value}>{value}</Text>
      <Text style={sumSt.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3E9' },
  header: {
    backgroundColor: '#0D1B3E',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16, paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FEFAE0' },
  summary: { flexDirection: 'row', gap: 10, padding: 16 },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 14, gap: 6,
    borderWidth: 1.5, borderColor: '#E8E0D0',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontSize: 12, color: '#AAA' },
  price: { fontSize: 14, fontWeight: '900', color: '#28A745' },
  route: { fontSize: 14, fontWeight: '600', color: '#333' },
  stars: { fontSize: 13 },
});

const sumSt = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#0D1B3E', borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 4,
  },
  emoji: { fontSize: 22 },
  value: { fontSize: 16, fontWeight: '900', color: '#F5A623' },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
});

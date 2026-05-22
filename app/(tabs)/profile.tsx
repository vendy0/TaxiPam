import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useProfile } from '../../lib/useProfile';

const ROLE_LABEL: Record<string, string> = {
  client: '📍 Kliyan',
  chauffeur: '🏍️ Chofè Moto-Taxi',
  livreur: '📦 Livrè',
};

export default function ProfileScreen() {
  const { profile, loading } = useProfile();

  async function logout() {
    Alert.alert('Dekonekte', 'Ou sèten ou vle dekonekte?', [
      { text: 'Anile', style: 'cancel' },
      {
        text: 'Wi, dekonekte',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/');
        },
      },
    ]);
  }

  if (loading || !profile) return null;

  const fullName = `${profile.prenom} ${profile.nom}`;
  const initials = `${profile.prenom[0]}${profile.nom[0]}`.toUpperCase();

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Header bleu */}
      <View style={styles.header}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{ROLE_LABEL[profile.role]}</Text>
        </View>
        <Text style={styles.ville}>📍 {profile.ville}</Text>
      </View>

      {/* Stats (chauffeur/livreur) */}
      {profile.role !== 'client' && (
        <View style={styles.stats}>
          <Stat emoji="⭐" value={profile.rating?.toFixed(1) ?? '—'} label="Nòt" />
          <Stat emoji="🏍️" value={String(profile.total_rides ?? 0)} label="Kous" />
          <Stat
            emoji="🔵"
            value={profile.is_online ? 'Anliy' : 'Òfliy'}
            label="Estati"
          />
        </View>
      )}

      {/* Sections de paramètres */}
      <View style={styles.section}>
        <SectionTitle>👤 Kont</SectionTitle>
        <MenuItem icon="✏️" label="Modifye Pwofil" onPress={() => {}} />
        <MenuItem icon="🔒" label="Chanje Modpas" onPress={() => {}} />
        <MenuItem icon="📱" label={`Telefòn : ${profile.telephone}`} onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <SectionTitle>⚙️ Preferans</SectionTitle>
        <MenuItem icon="🔔" label="Notifikasyon" onPress={() => {}} />
        <MenuItem icon="🌐" label="Lang : Kreyòl" onPress={() => {}} />
        <MenuItem icon="🎨" label="Tèm" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <SectionTitle>📋 Lòt</SectionTitle>
        <MenuItem icon="❓" label="Èd ak Sipò" onPress={() => {}} />
        <MenuItem icon="📜" label="Kondisyon Itilizasyon" onPress={() => {}} />
        <MenuItem icon="🔐" label="Politik Konfidansyalite" onPress={() => {}} />
        <MenuItem icon="ℹ️" label="Vèsyon 1.0.0" onPress={() => {}} />
      </View>

      {/* Déconnexion */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>🚪 Dekonekte</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Stat({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={statSt.wrap}>
      <Text style={statSt.emoji}>{emoji}</Text>
      <Text style={statSt.value}>{value}</Text>
      <Text style={statSt.label}>{label}</Text>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={secSt.title}>{children}</Text>;
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={menuSt.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={menuSt.icon}>{icon}</Text>
      <Text style={menuSt.label}>{label}</Text>
      <Text style={menuSt.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F7F3E9' },
  header: {
    backgroundColor: '#0D1B3E',
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F5A623',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#0D1B3E' },
  name: { fontSize: 22, fontWeight: '900', color: '#FEFAE0' },
  roleBadge: {
    backgroundColor: 'rgba(245,166,35,0.2)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(245,166,35,0.4)',
  },
  roleText: { color: '#F5A623', fontSize: 13, fontWeight: '700' },
  ville: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },

  stats: {
    flexDirection: 'row', backgroundColor: '#FFF',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16, gap: 8,
  },

  section: { margin: 16, marginBottom: 0, gap: 2 },

  logoutBtn: {
    margin: 16, marginTop: 24,
    backgroundColor: '#FFF',
    borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFCCCC',
  },
  logoutText: { color: '#DC3545', fontWeight: '800', fontSize: 15 },
});

const statSt = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 4 },
  emoji: { fontSize: 20 },
  value: { fontSize: 18, fontWeight: '900', color: '#0D1B3E' },
  label: { fontSize: 11, color: '#AAA' },
});

const secSt = StyleSheet.create({
  title: {
    fontSize: 11, fontWeight: '800', color: '#AAA',
    letterSpacing: 1, textTransform: 'uppercase',
    paddingLeft: 4, paddingBottom: 4,
  },
});

const menuSt = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 12,
    padding: 14, gap: 12,
    borderWidth: 1, borderColor: '#F0EBE0',
  },
  icon: { fontSize: 18, width: 24, textAlign: 'center' },
  label: { flex: 1, fontSize: 14, color: '#333', fontWeight: '600' },
  arrow: { fontSize: 20, color: '#CCC', fontWeight: '300' },
});

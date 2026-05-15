import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

const ROLES = [
  { id: 'client', label: 'Client', icon: '📍' },
  { id: 'chauffeur', label: 'Chauffeur', icon: '🏍️' },
  { id: 'livreur', label: 'Livreur', icon: '📦' },
];

export default function ChoisirRole() {
  const [role, setRole] = useState('');

  async function sauvegarder() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .insert({ id: user.id, role });

    if (error) Alert.alert('Erè', error.message);
    else router.replace('/accueil');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Ki rò ou?</Text>

      {ROLES.map(r => (
        <TouchableOpacity
          key={r.id}
          style={[styles.carte, role === r.id && styles.carteActive]}
          onPress={() => setRole(r.id)}
        >
          <Text style={styles.icone}>{r.icon}</Text>
          <Text style={[styles.label, role === r.id && styles.labelActive]}>
            {r.label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.btn, !role && styles.btnDisabled]}
        onPress={sauvegarder}
        disabled={!role}
      >
        <Text style={styles.btnText}>Kontinye →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, backgroundColor: '#FEFAE0', justifyContent: 'center', gap: 12 },
  titre: { fontSize: 28, fontWeight: '900', color: '#0D1B3E', marginBottom: 12 },
  carte: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, backgroundColor: 'white', borderRadius: 16, borderWidth: 2, borderColor: '#E0D8C8' },
  carteActive: { borderColor: '#F5A623', backgroundColor: '#0D1B3E' },
  icone: { fontSize: 28 },
  label: { fontSize: 16, fontWeight: '700', color: '#333' },
  labelActive: { color: '#F5A623' },
  btn: { backgroundColor: '#F5A623', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { backgroundColor: '#ccc' },
  btnText: { fontWeight: '800', fontSize: 15, color: '#0D1B3E' },
});
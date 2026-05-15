import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function sInscrire() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) Alert.alert('Erè', error.message);
    else router.push('/choisir-role');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Kreye Kont</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Modpas"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={sInscrire} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Chajman...' : 'Kreye Kont'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: 'center', backgroundColor: '#FEFAE0' },
  titre: { fontSize: 28, fontWeight: '900', color: '#0D1B3E', marginBottom: 24 },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#E0D8C8', fontSize: 15 },
  btn: { backgroundColor: '#F5A623', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { fontWeight: '800', fontSize: 15, color: '#0D1B3E' },
});
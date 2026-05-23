import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, Linking,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

type Role = "client" | "chauffeur" | "livreur" | "";

const ROLES: { id: Role; label: string; icon: string; description: string }[] = [
  { id: "client",    label: "Kliyan",          icon: "📍", description: "Mande moto-taxi oswa livrezon" },
  { id: "chauffeur", label: "Chofè Moto-Taxi",  icon: "🏍️", description: "Pran pasaje, touche lajan" },
  { id: "livreur",   label: "Livrè",            icon: "📦", description: "Livre komann bay kliyan" },
];

const ROLE_INFO: Record<string, { color: string; bg: string; message: string }> = {
  client:    { color: "#1A5C3A", bg: "#D6F5E3", message: "🗺️ Ou pral gen aksè a yon map pou jwenn chofè pre ou, suivi kòmand an tan reyèl, ak pèman fasil via MonCash oswa NatCash." },
  chauffeur: { color: "#7A3D00", bg: "#FFF0D6", message: "🏍️ Ou pral wè demann pasaje alantou ou, jere kous ou yo, ak yon tablo de bò dedye." },
  livreur:   { color: "#1A3C5C", bg: "#D6EAF8", message: "📦 Ou pral wè kòmand disponib alantou ou, chwazi sa ou vle livre, pran li nan boutik epi livre kliyan an." },
};

const VILLES = [
  "Port-au-Prince", "Delmas", "Pétion-Ville",
  "Kafou", "Taba", "Leyogàn", "Jakmèl",
];

export default function Register() {
  const [nom,             setNom]             = useState("");
  const [prenom,          setPrenom]          = useState("");
  const [email,           setEmail]           = useState("");
  const [telephone,       setTelephone]       = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ville,           setVille]           = useState("");
  const [role,            setRole]            = useState<Role>("");
  const [acceptConditions,setAcceptConditions]= useState(false);
  const [acceptPrivacy,   setAcceptPrivacy]   = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [loading,         setLoading]         = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────
  function validate() {
    if (!prenom.trim() || !nom.trim()) {
      Alert.alert("Erè", "Tanpri antre prenon ak non ou."); return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Erè", "Adrès email pa valid."); return false;
    }
    if (!telephone || telephone.length !== 8) {
      Alert.alert("Erè", "Nimewo telefòn dwe gen 8 chif."); return false;
    }
    if (!['3','4','5'].includes(telephone[0])) {
      Alert.alert("Erè", "Rantre yon nimewo telefòn valid (3x, 4x, 5x)!"); return false;
    }
    if (!ville) {
      Alert.alert("Erè", "Tanpri chwazi yon vil."); return false;
    }
    if (password.length < 8) {
      Alert.alert("Erè", "Modpas dwe gen omwen 8 karaktè."); return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erè", "Modpas yo pa matche."); return false;
    }
    if (!role) {
      Alert.alert("Erè", "Tanpri chwazi yon wòl."); return false;
    }
    if (!acceptConditions || !acceptPrivacy) {
      Alert.alert("Erè", "Ou dwe aksepte kondisyon itilizasyon ak politik konfidansyalite yo."); return false;
    }
    return true;
  }

  // ── Inscription ─────────────────────────────────────────────────────────
  async function sInscrire() {
    if (!validate()) return;
    setLoading(true);

    // 1. Créer le compte auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { nom, prenom, telephone, ville, role },
      },
    });

    if (error) {
      setLoading(false);
      Alert.alert("Erè enskripsyon", error.message);
      return;
    }

    // 2. Créer le profil dans la table profiles
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id:                  data.user.id,
        nom,
        prenom,
        telephone,
        ville,
        role,
        is_online:           false,
        rating:              null,
        total_rides:         0,
        avatar_url:          null,
        verification_status: role === 'client' ? 'approved' : 'pending',
      });

      if (profileError) {
        console.warn("Profil insert error:", profileError.message);
      }
    }

    setLoading(false);

    // 3. Redirection selon le rôle
    if (role === 'client') {
      // Client → directement dans l'app (pas de SMS pour l'instant)
      router.replace("/(tabs)/map");
    } else {
      // Chauffeur / Livreur → upload documents
      router.push("/(auth)/verification");
    }
  }

  const roleInfo = role ? ROLE_INFO[role] : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.logo}>TAXIPAM 🏍️</Text>
          <Text style={styles.headerTitle}>Kreye Kont</Text>
          <Text style={styles.headerSub}>Ranpli enfòmasyon yo pou kòmanse</Text>
        </View>

        <View style={styles.form}>
          {/* Identité */}
          <SectionLabel>👤 Idantite</SectionLabel>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.inputHalf]} placeholder="Prenon" placeholderTextColor="#AAA"
              value={prenom} onChangeText={setPrenom} autoCapitalize="words" />
            <TextInput style={[styles.input, styles.inputHalf]} placeholder="Siyati (non)" placeholderTextColor="#AAA"
              value={nom} onChangeText={setNom} autoCapitalize="words" />
          </View>

          {/* Contact */}
          <SectionLabel>📬 Kontakt</SectionLabel>
          <TextInput style={styles.input} placeholder="Adrès Email" placeholderTextColor="#AAA"
            value={email} onChangeText={setEmail} keyboardType="email-address"
            autoCapitalize="none" autoCorrect={false} />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={styles.phonePrefix}>
              <Text style={{ fontSize: 16 }}>🇭🇹</Text>
              <Text style={{ fontWeight: '700', color: '#444' }}>+509</Text>
            </View>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="3700 0000"
              keyboardType="phone-pad" value={telephone} onChangeText={setTelephone} maxLength={8} />
          </View>

          <View style={[styles.input, { padding: 0, overflow: 'hidden' }]}>
            <Picker selectedValue={ville} onValueChange={setVille} style={{ height: 50, color: '#1A1A1A' }}>
              <Picker.Item label="Chwazi yon vil..." value="" enabled={false} />
              {VILLES.map(v => <Picker.Item key={v} label={v} value={v} />)}
            </Picker>
          </View>

          {/* Sécurité */}
          <SectionLabel>🔒 Sekirite</SectionLabel>
          <View style={styles.passwordWrapper}>
            <TextInput style={[styles.input, styles.passwordInput]} placeholder="Modpas (min. 8 karaktè)"
              placeholderTextColor="#AAA" value={password} onChangeText={setPassword}
              secureTextEntry={!showPassword} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={styles.input} placeholder="Konfime Modpas" placeholderTextColor="#AAA"
            value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
          {password.length > 0 && <PasswordStrength password={password} />}

          {/* Rôle */}
          <SectionLabel>🎭 Chwazi Wòl Ou</SectionLabel>
          <View style={styles.roleNote}>
            <Text style={styles.roleNoteText}>
              ⚠️ <Text style={{ fontWeight: "700" }}>Enpòtan :</Text> Wòl ou chanje tout entèfas aplikasyon an. Chwazi avèk atansyon.
            </Text>
          </View>

          {ROLES.map(r => (
            <TouchableOpacity key={r.id} style={[styles.roleCarte, role === r.id && styles.roleCarteActive]}
              onPress={() => setRole(r.id)} activeOpacity={0.8}>
              <View style={styles.roleLeft}>
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <View>
                  <Text style={[styles.roleLabel, role === r.id && styles.roleLabelActive]}>{r.label}</Text>
                  <Text style={[styles.roleDesc,  role === r.id && styles.roleDescActive]}>{r.description}</Text>
                </View>
              </View>
              <View style={[styles.radioOuter, role === r.id && styles.radioOuterActive]}>
                {role === r.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}

          {roleInfo && (
            <View style={[styles.roleBanner, { backgroundColor: roleInfo.bg, borderColor: roleInfo.color }]}>
              <Text style={[styles.roleBannerText, { color: roleInfo.color }]}>{roleInfo.message}</Text>
            </View>
          )}

          {/* Conditions */}
          <SectionLabel>📋 Kondisyon</SectionLabel>
          <CheckRow checked={acceptConditions} onToggle={() => setAcceptConditions(v => !v)}>
            <Text style={styles.checkText}>
              Mwen aksepte <Text style={styles.link} onPress={() => Linking.openURL("https://taxipam.app/conditions")}>Kondisyon Itilizasyon</Text> yo
            </Text>
          </CheckRow>
          <CheckRow checked={acceptPrivacy} onToggle={() => setAcceptPrivacy(v => !v)}>
            <Text style={styles.checkText}>
              Mwen aksepte <Text style={styles.link} onPress={() => Linking.openURL("https://taxipam.app/privacy")}>Politik Konfidansyalite</Text> a
            </Text>
          </CheckRow>

          {/* Submit */}
          <TouchableOpacity style={[styles.btnSubmit, loading && styles.btnDisabled]}
            onPress={sInscrire} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#0D1B3E" />
              : <Text style={styles.btnSubmitText}>Kontinye ➡️</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              Ou deja gen yon kont? <Text style={styles.link}>Konekte isit</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <View style={sectionSt.wrapper}>
      <Text style={sectionSt.label}>{children}</Text>
      <View style={sectionSt.line} />
    </View>
  );
}

function CheckRow({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity style={checkSt.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={[checkSt.box, checked && checkSt.boxChecked]}>
        {checked && <Text style={checkSt.tick}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableOpacity>
  );
}

function PasswordStrength({ password }: { password: string }) {
  let score = 0;
  if (password.length >= 8)         score++;
  if (/[A-Z]/.test(password))       score++;
  if (/[0-9]/.test(password))       score++;
  if (/[^A-Za-z0-9]/.test(password))score++;
  const labels = ["Fèb 🔴", "Mwayen 🟠", "Bon 🟡", "Solid 🟢", "Trè solid 💪"];
  const colors = ["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1B5E20"];
  return (
    <View style={pwSt.wrapper}>
      <View style={pwSt.bars}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[pwSt.bar, { backgroundColor: i < score ? colors[score-1] : "#E0D8C8" }]} />
        ))}
      </View>
      <Text style={[pwSt.label, { color: colors[score > 0 ? score-1 : 0] }]}>{labels[score]}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#0D1B3E" },
  scrollContent: { paddingBottom: 48 },
  header: { alignItems: "center", paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24 },
  logo: { fontSize: 22, fontWeight: "900", color: "#F5A623", letterSpacing: 3, marginBottom: 16 },
  headerTitle: { fontSize: 30, fontWeight: "900", color: "#FEFAE0", marginBottom: 4 },
  headerSub: { fontSize: 14, color: "rgba(255,255,255,0.45)", letterSpacing: 0.5 },
  form: { backgroundColor: "#FEFAE0", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 12 },
  row: { flexDirection: "row", gap: 10 },
  input: {
    backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: "#1A1A1A", borderWidth: 1.5, borderColor: "#E0D8C8",
  },
  inputHalf: { flex: 1 },
  phonePrefix: {
    backgroundColor: '#F0EBE0', borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1.5, borderColor: '#E0D8C8', alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  passwordWrapper: { position: "relative" },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  eyeIcon: { fontSize: 18 },
  roleNote: { backgroundColor: "#FFF3CD", borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: "#F5A623" },
  roleNoteText: { fontSize: 13, color: "#6B4400", lineHeight: 19 },
  roleCarte: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 16, borderWidth: 2, borderColor: "#E0D8C8",
  },
  roleCarteActive: { borderColor: "#F5A623", backgroundColor: "#0D1B3E" },
  roleLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  roleIcon: { fontSize: 26 },
  roleLabel: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  roleLabelActive: { color: "#F5A623" },
  roleDesc: { fontSize: 12, color: "#888", marginTop: 2 },
  roleDescActive: { color: "rgba(255,255,255,0.6)" },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#CCC", alignItems: "center", justifyContent: "center" },
  radioOuterActive: { borderColor: "#F5A623" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#F5A623" },
  roleBanner: { borderRadius: 12, padding: 14, borderWidth: 1.5, marginTop: 4 },
  roleBannerText: { fontSize: 13, lineHeight: 20, fontWeight: "500" },
  checkText: { fontSize: 13, color: "#444", lineHeight: 19 },
  link: { color: "#0D6EFD", textDecorationLine: "underline" },
  btnSubmit: {
    backgroundColor: "#F5A623", borderRadius: 16, padding: 18, alignItems: "center", marginTop: 8,
    shadowColor: "#F5A623", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  btnDisabled: { backgroundColor: "#CCC", shadowOpacity: 0 },
  btnSubmitText: { fontWeight: "900", fontSize: 16, color: "#0D1B3E", letterSpacing: 0.5 },
  loginLink: { alignItems: "center", paddingVertical: 8 },
  loginLinkText: { fontSize: 13, color: "#666" },
});

const sectionSt = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8, marginBottom: 2 },
  label: { fontSize: 12, fontWeight: "700", color: "#888", letterSpacing: 1, textTransform: "uppercase" },
  line: { flex: 1, height: 1, backgroundColor: "#E0D8C8" },
});
const checkSt = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 4 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#CCC", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF", marginTop: 1 },
  boxChecked: { backgroundColor: "#0D1B3E", borderColor: "#0D1B3E" },
  tick: { color: "#F5A623", fontSize: 13, fontWeight: "900" },
});
const pwSt = StyleSheet.create({
  wrapper: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: -4, marginBottom: 4 },
  bars: { flexDirection: "row", gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: "700", minWidth: 70 },
});

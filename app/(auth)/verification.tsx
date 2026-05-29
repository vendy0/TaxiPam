/**
 * verification.tsx — Étape 2 d'inscription pour chauffeurs et livreurs
 *
 * CORRECTIONS APPORTÉES :
 *  1. ImagePicker.MediaTypeOptions → ImagePicker.MediaType  (API dépréciée)
 *  2. fetch().blob()              → fetch().arrayBuffer()   (bug Android)
 *  3. Extraction d'extension robuste (URI avec query strings)
 *  4. Suppression de verification_submitted_at (colonne absente du schéma)
 *  5. Messages d'erreur réseau distincts des erreurs Supabase
 *  6. Vérification de l'upload avant soumission finale
 */

import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Données statiques : définition des documents attendus
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `as const` indique à TypeScript que ce tableau est immuable.
 * Chaque objet est un "tuple" dont les valeurs ne changeront jamais.
 * Cela permet d'inférer le type `DocId` automatiquement (voir ci-dessous).
 */
const DOCUMENTS = [
  {
    id: "selfie",
    label: "Selfie (Foto Vizaj)",
    icon: "🤳",
    description:
      "Pran yon foto vizaj ou klèman. Pa mete chapèo, linèt nwa, oswa okenn mas.",
    required: true,
  },
  {
    id: "license",
    label: "Pèmi Kondui",
    icon: "📋",
    description: "Foto pèmi kondui valid ou. Pèmi a dwe an règ ak aktyèl.",
    required: true,
  },
  {
    id: "plate",
    label: "Plak Immatrikilasyon",
    icon: "🏷️",
    description:
      "Foto klè plak moto ou. Nimewo dwe lisib nètman — pa gen flou.",
    required: true,
  },
  {
    id: "id_card",
    label: "Kat Nasyonal (CIN)",
    icon: "🪪",
    description:
      "Foto recto ak verso kat idantite nasyonal ou. Tèks yo dwe lizib klèman.",
    required: false,
  },
  {
    id: "moto",
    label: "Foto Moto (fas konplè)",
    icon: "🏍️",
    description:
      "Foto konplè moto ou devan. Pou konfime eta jeneral li.",
    required: false,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Définitions TypeScript
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `DocId` est un type "union" qui ne peut valoir que l'une des chaînes :
 * "selfie" | "license" | "plate" | "id_card" | "moto"
 * TypeScript l'infère automatiquement depuis DOCUMENTS grâce à `as const`.
 */
type DocId = (typeof DOCUMENTS)[number]["id"];

/**
 * `DocState` décrit l'état d'UN document dans notre state React.
 * - uri       : chemin local de la photo choisie (null = aucune photo)
 * - uploading : true pendant l'envoi vers Supabase Storage
 * - uploaded  : true une fois l'envoi confirmé
 * - error     : message d'erreur si l'envoi a échoué
 */
type DocState = {
  uri: string | null;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function Verification() {
  // ── Initialisation du state ──────────────────────────────────────────────
  /**
   * On construit l'objet initial du state :
   *   { selfie: { uri:null, uploading:false, uploaded:false, error:null },
   *     license: { ... }, plate: { ... }, ... }
   *
   * `Record<DocId, DocState>` = un objet dont les clés sont des DocId
   * et les valeurs sont des DocState.
   *
   * Le cast `as Record<DocId, DocState>` est nécessaire car on commence
   * avec un objet vide `{}` qu'on remplit ensuite dans la boucle.
   */
  const initial: Record<DocId, DocState> = {} as Record<DocId, DocState>;
  DOCUMENTS.forEach((d) => {
    initial[d.id] = { uri: null, uploading: false, uploaded: false, error: null };
  });

  const [docs, setDocs] = useState<Record<DocId, DocState>>(initial);
  const [submitting, setSubmitting] = useState(false); // bloque le bouton "Soumettre"
  const [submitted, setSubmitted] = useState(false);   // affiche l'écran de succès

  // ── Mise à jour partielle du state d'un document ─────────────────────────
  /**
   * Cette fonction évite de réécrire tout l'objet `docs` à chaque modification.
   * `patch` est un objet partiel : { uploading: true } par exemple.
   *
   * Le spread `{ ...prev[id], ...patch }` fusionne l'ancien état avec le nouveau.
   * Exemple :
   *   ancien : { uri: "file://...", uploading: false, uploaded: false, error: null }
   *   patch  : { uploading: true }
   *   résultat : { uri: "file://...", uploading: true, uploaded: false, error: null }
   */
  function updateDoc(id: DocId, patch: Partial<DocState>) {
    setDocs((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 4 — Sélection d'image
  // ─────────────────────────────────────────────────────────────────────────

  async function pickImage(docId: DocId, useCamera: boolean) {
    /**
     * On demande les permissions AVANT d'ouvrir l'appareil photo / la galerie.
     * Sur iOS, le système affiche une boîte de dialogue la 1ère fois.
     * Sur Android, le manifeste doit déclarer les permissions (fait par Expo).
     */
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert(
        "Pèmisyon refize",
        useCamera
          ? "Ou dwe aksepte pèmisyon kamera nan paramèt telefòn ou."
          : "Ou dwe aksepte pèmisyon galri foto nan paramèt telefòn ou."
      );
      return;
    }

    /**
     * FIX BUG #2 : `ImagePicker.MediaType.Images` remplace l'API dépréciée
     * `ImagePicker.MediaTypeOptions.Images`.
     *
     * `quality: 0.85` compresse l'image à 85% (bon compromis taille / qualité).
     * `allowsEditing: true` permet à l'utilisateur de recadrer la photo.
     * `aspect` force un ratio : carré pour le selfie, 4:3 pour les documents.
     */
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaType.Images, // ✅ CORRIGÉ
          quality: 0.85,
          allowsEditing: true,
          aspect: docId === "selfie" ? [1, 1] : [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaType.Images, // ✅ CORRIGÉ
          quality: 0.85,
          allowsEditing: true,
          aspect: docId === "selfie" ? [1, 1] : [4, 3],
        });

    /**
     * `result.canceled` est true si l'utilisateur a appuyé sur "Retour".
     * `result.assets` est un tableau de photos sélectionnées (toujours 1 ici).
     * On stocke l'URI locale de la photo dans notre state.
     */
    if (!result.canceled && result.assets[0]) {
      updateDoc(docId, {
        uri: result.assets[0].uri,
        uploaded: false, // La photo a changé, il faut la re-uploader
        error: null,     // Effacer l'erreur précédente si elle existait
      });
    }
  }

  /**
   * Affiche un menu avec 2 options : appareil photo ou galerie.
   * Alert.alert(titre, message, [boutons]) est la boîte de dialogue native.
   */
  function showSourceChoice(docId: DocId) {
    Alert.alert("Chwazi sous foto", "", [
      { text: "📷 Pran foto kounye a", onPress: () => pickImage(docId, true) },
      { text: "🖼️  Chwazi nan galri",  onPress: () => pickImage(docId, false) },
      { text: "Anile", style: "cancel" },
    ]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 5 — Upload vers Supabase Storage
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Cette fonction envoie UN document vers Supabase Storage.
   * Elle retourne `true` si l'upload a réussi, `false` sinon.
   */
  async function uploadDoc(docId: DocId, uri: string): Promise<boolean> {
    updateDoc(docId, { uploading: true, error: null });

    try {
      // Vérifie que l'utilisateur est toujours connecté
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesyon ekspire. Konekte ankò.");

      // ── FIX BUG #1 : arrayBuffer() au lieu de blob() ──────────────────
      /**
       * POURQUOI blob() échoue sur Android :
       * Les URI du image picker sur Android peuvent être du type `content://...`
       * (URI de contenu Android), pas `file://...` (URI de fichier).
       * La méthode `.blob()` de fetch ne gère pas correctement ces URI
       * avec le moteur Hermes de React Native → "Network request failed".
       *
       * POURQUOI arrayBuffer() fonctionne :
       * `arrayBuffer()` lit les données brutes du fichier en mémoire sous forme
       * de tampon binaire (ArrayBuffer). Hermes le supporte nativement.
       * Supabase Storage accepte un ArrayBuffer comme données à uploader.
       */
      const response = await fetch(uri);

      if (!response.ok) {
        throw new Error(`Pa kapab li foto a (HTTP ${response.status})`);
      }

      const arrayBuffer = await response.arrayBuffer(); // ✅ CORRIGÉ

      // ── FIX BUG #3 : Extraction d'extension robuste ────────────────────
      /**
       * Un URI peut ressembler à :
       *   "file:///storage/emulated/0/DCIM/selfie.jpg?ts=1234567890"
       *
       * Problème avec `uri.split('.').pop()` :
       *   → retourne "jpg?ts=1234567890" → INVALIDE comme extension
       *
       * Solution en 3 étapes :
       *   1. Supprimer tout après "?" : "file://.../selfie.jpg"
       *   2. Découper par "." : ["file:///storage/.../selfie", "jpg"]
       *   3. Prendre le dernier élément : "jpg"
       */
      const uriWithoutQuery = uri.split("?")[0];
      const parts = uriWithoutQuery.split(".");
      const rawExt = parts[parts.length - 1].toLowerCase();

      // Valider l'extension (sécurité : on n'accepte que des images)
      const validExts = ["jpg", "jpeg", "png", "webp"];
      const ext = validExts.includes(rawExt) ? rawExt : "jpg";

      // Normaliser l'extension et le type MIME
      const cleanExt = ext === "jpeg" ? "jpg" : ext;
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";

      /**
       * Construction du chemin de stockage unique :
       *   "verifications/uuid-utilisateur/selfie_1716800000000.jpg"
       *
       * `Date.now()` retourne le timestamp Unix en millisecondes.
       * Cela garantit un nom de fichier unique même si l'utilisateur
       * uploade plusieurs fois le même type de document.
       */
      const fileName = `${docId}_${Date.now()}.${cleanExt}`;
      const path = `verifications/${user.id}/${fileName}`;

      // ── Upload vers Supabase Storage ────────────────────────────────────
      /**
       * `supabase.storage.from("driver-documents")` → bucket privé
       * IMPORTANT : Ce bucket doit être créé dans le dashboard Supabase :
       *   Storage → New bucket → Name: "driver-documents" → Private ✓
       *
       * `upsert: true` : si un fichier avec le même chemin existe,
       * il sera remplacé. Utile si l'utilisateur re-soumet un document.
       */
      const { error: uploadError } = await supabase.storage
        .from("driver-documents")
        .upload(path, arrayBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Upload réussi !
      updateDoc(docId, { uploading: false, uploaded: true });
      return true;

    } catch (err: any) {
      /**
       * Distingue les erreurs réseau des erreurs Supabase pour
       * afficher un message plus précis à l'utilisateur.
       */
      const isNetworkError =
        err?.message?.includes("Network") ||
        err?.message?.includes("network") ||
        err?.message?.includes("fetch");

      const errorMessage = isNetworkError
        ? "Pa gen koneksyon entènèt oswa sèvè an pa disponib."
        : err?.message ?? "Erè enkoni. Eseye ankò.";

      console.error(`[uploadDoc] Erreur pour ${docId}:`, err);
      updateDoc(docId, { uploading: false, error: errorMessage });
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 6 — Soumission finale
  // ─────────────────────────────────────────────────────────────────────────

  async function soumetreDociman() {
    // Vérifier que tous les documents obligatoires ont une photo sélectionnée
    const missing = DOCUMENTS.filter((d) => d.required && !docs[d.id].uri);
    if (missing.length > 0) {
      Alert.alert(
        "Dokiman mankan",
        `Tanpri ajoute:\n• ${missing.map((d) => d.label).join("\n• ")}`
      );
      return;
    }

    setSubmitting(true);
    let allOk = true;

    /**
     * Boucle séquentielle (pas parallèle) pour uploader les documents.
     * On utilise `for...of` avec `await` pour attendre chaque upload
     * avant de passer au suivant. Si on utilisait `forEach`, les `await`
     * seraient ignorés (forEach ne supporte pas async/await correctement).
     */
    for (const doc of DOCUMENTS) {
      const uri = docs[doc.id].uri;
      // Uploader seulement si une photo existe et n'a pas encore été envoyée
      if (uri && !docs[doc.id].uploaded) {
        const ok = await uploadDoc(doc.id, uri);
        // Si un document OBLIGATOIRE échoue, on marque l'échec global
        if (!ok && doc.required) {
          allOk = false;
          // On ne `break` pas : on continue pour afficher toutes les erreurs
        }
      }
    }

    if (!allOk) {
      setSubmitting(false);
      Alert.alert(
        "Erè Upload",
        "Kèk dokiman pa t ka voye.\n\n" +
        "• Verifye koneksyon entènèt ou\n" +
        "• Asire ou ke bucket 'driver-documents' egziste nan Supabase\n" +
        "• Eseye ankò"
      );
      return;
    }

    // ── FIX BUG #4 : Suppression de verification_submitted_at ─────────────
    /**
     * On ne met à jour QUE `verification_status` car c'est la seule colonne
     * qu'on est sûr d'avoir dans la table `profiles`.
     * Ajouter `verification_submitted_at` nécessiterait d'ajouter cette
     * colonne dans Supabase Dashboard d'abord.
     */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ verification_status: "pending" })
        .eq("id", user.id);

      if (updateError) {
        // Log pour le débogage sans bloquer l'expérience utilisateur
        console.error("[soumetreDociman] Erreur mise à jour profil:", updateError.message);
      }
    }

    setSubmitting(false);
    setSubmitted(true); // → affiche l'écran de succès
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 7 — Écran de succès (affiché après soumission réussie)
  // ─────────────────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <View style={successSt.container}>
        <Text style={successSt.emoji}>⏳</Text>
        <Text style={successSt.title}>Dokiman Voye!</Text>
        <Text style={successSt.body}>
          Yon manm ekip TaxiPam pral verifye dokiman ou yo nan{" "}
          <Text style={{ fontWeight: "700", color: "#F5A623" }}>24 – 48 èdtan</Text>.
          {"\n\n"}
          Ou pral resevwa yon{" "}
          <Text style={{ fontWeight: "700" }}>SMS ak yon email</Text> lè kont ou konfime
          oswa refize.
        </Text>
        <View style={successSt.infoCard}>
          <Text style={successSt.infoText}>
            💡 Verifye spam / junk mail ou si ou pa wè email nou an. Nimewo telefòn
            ou dwe aktif pou resevwa SMS la.
          </Text>
        </View>
        <TouchableOpacity style={successSt.btn} onPress={() => router.replace("/")}>
          <Text style={successSt.btnText}>Retounen nan Akèy</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 8 — Calculs de progression
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Compte les documents obligatoires et ceux déjà sélectionnés.
   * Utilisé pour la barre de progression et l'état du bouton "Soumettre".
   */
  const reqTotal = DOCUMENTS.filter((d) => d.required).length; // 3
  const reqDone  = DOCUMENTS.filter((d) => d.required && docs[d.id].uri).length;
  const progress = reqTotal > 0 ? reqDone / reqTotal : 0; // de 0.0 à 1.0

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 9 — Rendu principal (JSX)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={st.scroll}
      contentContainerStyle={st.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── En-tête bleu ── */}
      <View style={st.header}>
        <Text style={st.logo}>TAXIPAM 🏍️</Text>
        <Text style={st.title}>Verifikasyon Idantite</Text>
        <Text style={st.subtitle}>
          Sekirite tout moun enpòtan pou nou. Tout dokiman yo pwoteje ak kriptaj ak
          sèlman ekip verifikasyon nou an ki ka wè yo.
        </Text>
      </View>

      {/* ── Barre de progression ── */}
      <View style={st.progressCard}>
        <View style={st.progressRow}>
          <Text style={st.progressLabel}>Pwogresyon</Text>
          <Text style={st.progressCount}>{reqDone}/{reqTotal} obligatwa</Text>
        </View>
        {/*
          La largeur de `progressFill` est un pourcentage (ex: "66%").
          React Native accepte les strings de pourcentage pour `width`.
          On multiplie `progress` (0→1) par 100 pour obtenir 0%→100%.
        */}
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* ── Note de confidentialité ── */}
      <View style={st.privNote}>
        <Text style={st.privText}>
          🔒{" "}
          <Text style={{ fontWeight: "700" }}>Konfidansyalite :</Text> Dokiman ou yo
          estoke nan yon sèvè pwoteje. Yo pa janm pataje ak tyes pati. Apre
          verifikasyon, sèlman estati konfirmasyon ou a rete vizib nan sistèm nan.
        </Text>
      </View>

      {/* ── Corps : liste des cartes de document ── */}
      <View style={st.body}>
        {/*
          `DOCUMENTS.map(doc => ...)` itère sur chaque document et retourne
          un composant React par document. La `key` unique est requise par
          React pour optimiser les re-rendus.
        */}
        {DOCUMENTS.map((doc) => {
          const state = docs[doc.id]; // État actuel de ce document
          const isOk  = state.uploaded; // L'upload a réussi
          const hasImg = !!state.uri;   // !! convertit string|null en boolean

          return (
            <View
              key={doc.id}
              style={[
                st.card,
                isOk && st.cardDone, // Bordure verte si uploadé
              ]}
            >
              {/* ── En-tête de la carte ── */}
              <View style={st.cardHeader}>
                <Text style={st.cardIcon}>{doc.icon}</Text>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={st.cardTitleRow}>
                    <Text style={st.cardLabel}>{doc.label}</Text>
                    {/* Badge "Opsyonèl" si le document n'est pas obligatoire */}
                    {!doc.required && <Tag color="#888" bg="#EEE" label="Opsyonèl" />}
                    {/* Badge vert "✓ Voye" si l'upload a réussi */}
                    {isOk && <Tag color="#155724" bg="#D4EDDA" label="✓ Voye" />}
                  </View>
                  <Text style={st.cardDesc}>{doc.description}</Text>
                </View>
              </View>

              {/* ── Aperçu de la photo (visible après sélection) ── */}
              {hasImg && (
                <View style={st.previewWrap}>
                  {/*
                    `source={{ uri: state.uri! }}` :
                    Le `!` est une assertion TypeScript qui dit "je garantis
                    que cette valeur n'est pas null" (on l'a vérifié avec `hasImg`).
                    `resizeMode="cover"` : l'image remplit le cadre en découpant
                    les bords si nécessaire (comme `object-fit: cover` en CSS).
                  */}
                  <Image
                    source={{ uri: state.uri! }}
                    style={st.preview}
                    resizeMode="cover"
                  />
                  {/* Coche verte en haut à droite de l'image si uploadé */}
                  {isOk && (
                    <View style={st.checkOverlay}>
                      <Text style={st.checkOverlayText}>✓</Text>
                    </View>
                  )}
                </View>
              )}

              {/* ── Message d'erreur (visible si l'upload a échoué) ── */}
              {state.error && (
                <View style={st.errorBox}>
                  <Text style={st.errorText}>⚠️ {state.error}</Text>
                </View>
              )}

              {/* ── Bouton : Ajouter / Changer la photo ── */}
              <TouchableOpacity
                style={[
                  st.cardBtn,
                  hasImg && st.cardBtnSecondary, // Style différent si photo déjà choisie
                ]}
                onPress={() => showSourceChoice(doc.id)}
                disabled={state.uploading} // Désactivé pendant l'upload
                activeOpacity={0.8}
              >
                {state.uploading ? (
                  // Spinner pendant l'upload
                  <ActivityIndicator
                    color={hasImg ? "#555" : "#FFF"}
                    size="small"
                  />
                ) : (
                  <Text
                    style={[
                      st.cardBtnText,
                      hasImg && st.cardBtnTextSecondary,
                    ]}
                  >
                    {hasImg ? "🔄 Chanje foto" : "📷 Ajoute foto"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* ── Mention légale ── */}
        <View style={st.legalBox}>
          <Text style={st.legalText}>
            En soumettant ces documents, vous certifiez qu'ils sont authentiques et
            vous appartiennent. La soumission de faux documents entraîne la suppression
            définitive du compte et peut constituer une infraction légale.
          </Text>
        </View>

        {/* ── Bouton de soumission finale ── */}
        <TouchableOpacity
          style={[
            st.btnSubmit,
            (submitting || reqDone < reqTotal) && st.btnDisabled,
          ]}
          onPress={soumetreDociman}
          disabled={submitting || reqDone < reqTotal}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#0D1B3E" />
          ) : (
            <Text style={st.btnSubmitText}>
              {reqDone < reqTotal
                ? `📋 ${reqTotal - reqDone} dokiman ankò...`
                : "✅ Soumèt pou Verifikasyon"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — Composant Tag (badge coloré réutilisable)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Petit composant fonctionnel pour les badges colorés.
 * `color` = couleur du texte
 * `bg`    = couleur de fond du badge
 * `label` = texte à afficher
 *
 * Utilisation : <Tag color="#155724" bg="#D4EDDA" label="✓ Voye" />
 */
function Tag({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[tagSt.wrap, { backgroundColor: bg }]}>
      <Text style={[tagSt.text, { color }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 11 — Styles
// ─────────────────────────────────────────────────────────────────────────────

/**
 * StyleSheet.create() optimise les styles en les enregistrant côté natif.
 * C'est équivalent à un objet JS normal mais plus performant.
 *
 * Convention de nommage :
 *   `st`        = styles du composant principal
 *   `successSt` = styles de l'écran de succès
 *   `tagSt`     = styles du composant Tag
 */
const tagSt = StyleSheet.create({
  wrap: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontSize: 10, fontWeight: "700" },
});

const st = StyleSheet.create({
  // Conteneur principal de la ScrollView
  scroll: { flex: 1, backgroundColor: "#0D1B3E" },
  scrollContent: { paddingBottom: 48 },

  // En-tête bleu foncé
  header: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 10,
  },
  logo: { fontSize: 20, fontWeight: "900", color: "#F5A623", letterSpacing: 3 },
  title: { fontSize: 26, fontWeight: "900", color: "#FEFAE0", textAlign: "center" },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    lineHeight: 19,
  },

  // Carte de progression
  progressCard: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 10,
  },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 13, fontWeight: "700", color: "#FEFAE0" },
  progressCount: { fontSize: 13, fontWeight: "700", color: "#F5A623" },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
  },
  // `width` sera défini dynamiquement via le spread style
  progressFill: { height: 6, backgroundColor: "#F5A623", borderRadius: 3 },

  // Note de confidentialité bleue
  privNote: {
    marginHorizontal: 16,
    backgroundColor: "rgba(13,110,253,0.12)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(13,110,253,0.25)",
  },
  privText: { fontSize: 12, color: "#90C8FF", lineHeight: 18 },

  // Corps crème (liste des cartes)
  body: {
    backgroundColor: "#FEFAE0",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    gap: 16,
  },

  // Carte d'un document
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#E8E0D0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // Variante : bordure verte quand le document est uploadé
  cardDone: { borderColor: "#28A745" },

  cardHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  cardIcon: { fontSize: 28, marginTop: 2 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardLabel: { fontSize: 14, fontWeight: "800", color: "#1A1A1A" },
  cardDesc: { fontSize: 12, color: "#777", lineHeight: 17 },

  // Aperçu de l'image
  previewWrap: { borderRadius: 10, overflow: "hidden", position: "relative" },
  preview: { width: "100%", height: 160 },

  // Coche verte sur l'image
  checkOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#28A745",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOverlayText: { color: "#FFF", fontWeight: "900", fontSize: 14 },

  // Boîte d'erreur jaune
  errorBox: { backgroundColor: "#FFF3CD", borderRadius: 8, padding: 10 },
  errorText: { fontSize: 12, color: "#856404" },

  // Bouton ajouter/changer photo
  cardBtn: { backgroundColor: "#0D1B3E", borderRadius: 10, padding: 13, alignItems: "center" },
  cardBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#CCC",
  },
  cardBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  cardBtnTextSecondary: { color: "#555" },

  // Mention légale jaune pâle
  legalBox: {
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFEAA7",
  },
  legalText: { fontSize: 11, color: "#7A5D00", lineHeight: 17 },

  // Bouton de soumission final
  btnSubmit: {
    backgroundColor: "#F5A623",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: "#F5A623",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDisabled: { backgroundColor: "#CCC", shadowOpacity: 0 },
  btnSubmitText: { fontWeight: "900", fontSize: 15, color: "#0D1B3E" },
});

// Styles de l'écran de succès (affiché quand `submitted === true`)
const successSt = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1B3E",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  emoji: { fontSize: 64, marginBottom: 8 },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#F5A623",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: "rgba(245,166,35,0.12)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.3)",
    width: "100%",
  },
  infoText: { fontSize: 13, color: "#F5A623", lineHeight: 19, textAlign: "center" },
  btn: {
    backgroundColor: "#F5A623",
    borderRadius: 14,
    padding: 16,
    paddingHorizontal: 36,
    marginTop: 8,
  },
  btnText: { fontWeight: "900", fontSize: 15, color: "#0D1B3E" },
});

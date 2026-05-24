/**
 * map.tsx — Carte principale
 * - Client : voit les motos disponibles autour de lui
 * - Chauffeur : toggle En ligne / Hors ligne, voit les demandes
 *
 * ⚠️ Pour Android avec Google Maps, ajoute ta clé API dans app.json :
 *    "android": { "config": { "googleMaps": { "apiKey": "..." } } }
 * iOS utilise Apple Maps par défaut (aucune clé requise).
 */
import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Animated, Alert
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useProfile } from '../../lib/useProfile';
import { supabase } from '../../lib/supabase';

// Port-au-Prince center
const PAP_REGION = {
  latitude: 18.5425,
  longitude: -72.3386,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Données mock de chauffeurs — remplace avec Supabase Realtime
const MOCK_DRIVERS = [
  { id: '1', lat: 18.5440, lng: -72.3360, name: 'Jean-Marc', rating: 4.8 },
  { id: '2', lat: 18.5410, lng: -72.3410, name: 'Pierre', rating: 4.5 },
  { id: '3', lat: 18.5460, lng: -72.3340, name: 'Micheline', rating: 4.9 },
];

export default function MapScreen() {
  const { profile } = useProfile();
  const mapRef = useRef<MapView>(null);
  const [isOnline, setIsOnline] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const role = profile?.role ?? 'client';

  // Animation pulsante pour le statut En ligne
  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }

  async function toggleOnline() {
    const next = !isOnline;
    setIsOnline(next);

    if (next) startPulse();
    else pulseAnim.stopAnimation();

    // Mise à jour Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ is_online: next })
        .eq('id', user.id);
    }
  }

  function handleDriverPress(driver: (typeof MOCK_DRIVERS)[0]) {
    Alert.alert(
      `🏍️ ${driver.name}`,
      `⭐ ${driver.rating} · Disponib\n\nVle kontakte chofè sa?`,
      [
        { text: 'Anile', style: 'cancel' },
        { text: '💬 Kontakte', onPress: () => {} },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Carte */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={PAP_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Marqueurs chauffeurs (client uniquement) */}
        {role === 'client' && MOCK_DRIVERS.map(driver => (
          <Marker
            key={driver.id}
            coordinate={{ latitude: driver.lat, longitude: driver.lng }}
            onPress={() => handleDriverPress(driver)}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverMarkerEmoji}>🏍️</Text>
            </View>
          </Marker>
        ))}

        {/* Zone de rayon client */}
        {role === 'client' && (
          <Circle
            center={{ latitude: PAP_REGION.latitude, longitude: PAP_REGION.longitude }}
            radius={800}
            fillColor="rgba(245,166,35,0.08)"
            strokeColor="rgba(245,166,35,0.3)"
            strokeWidth={1.5}
          />
        )}
      </MapView>

      {/* Header overlay */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {role === 'chauffeur' ? '🏍️ Mode Chofè' :
           role === 'livreur'   ? '📦 Mode Livrè' :
                                  '📍 Pòtoprens'}
        </Text>

        {/* Statut chauffeur/livreur */}
        {(role === 'chauffeur' || role === 'livreur') && (
          <Animated.View style={{ transform: [{ scale: isOnline ? pulseAnim : 1 }] }}>
            <View style={[styles.statusBadge, isOnline ? styles.statusOnline : styles.statusOffline]}>
              <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
              <Text style={styles.statusText}>{isOnline ? 'Anliy' : ' Òfliy'}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Légende client */}
      {role === 'client' && (
        <View style={styles.legend}>
          <Text style={styles.legendText}>🏍️ {MOCK_DRIVERS.length} chofè disponib</Text>
        </View>
      )}

      {/* Bouton demander une course (client) */}
      {role === 'client' && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.rideBtn} activeOpacity={0.9}>
            <Text style={styles.rideBtnText}>🏍️ Mande yon Kous</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bouton toggle En ligne (chauffeur/livreur) */}
      {(role === 'chauffeur' || role === 'livreur') && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.toggleBtn, isOnline ? styles.toggleBtnOnline : styles.toggleBtnOffline]}
            onPress={toggleOnline}
            activeOpacity={0.85}
          >
            <Text style={styles.toggleBtnText}>
              {isOnline ? '🟢 Anliy — Touche kous' : '⚫ Pase Anliy'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(13,27,62,0.85)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: '#FEFAE0', fontWeight: '800', fontSize: 15 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  statusOnline: { backgroundColor: 'rgba(40,167,69,0.25)' },
  statusOffline: { backgroundColor: 'rgba(255,255,255,0.1)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: '#28A745' },
  dotOffline: { backgroundColor: '#888' },
  statusText: { color: '#FEFAE0', fontSize: 12, fontWeight: '700' },

  legend: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 114 : 94,
    left: 16,
    backgroundColor: 'rgba(13,27,62,0.75)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  legendText: { color: '#FEFAE0', fontSize: 12, fontWeight: '600' },

  driverMarker: {
    backgroundColor: '#0D1B3E',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#F5A623',
  },
  driverMarkerEmoji: { fontSize: 18 },

  actionBar: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
  },
  rideBtn: {
    backgroundColor: '#F5A623',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  rideBtnText: { fontWeight: '900', fontSize: 16, color: '#0D1B3E' },

  toggleBtn: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  toggleBtnOnline: { backgroundColor: '#28A745' },
  toggleBtnOffline: { backgroundColor: '#F5A623' },
  toggleBtnText: { fontWeight: '900', fontSize: 16, color: '#0D1B3E' },
});

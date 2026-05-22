/**
 * chats.tsx — Liste des conversations
 * Structure prête pour Supabase Realtime.
 * Pour l'instant affiche des données mock.
 */
import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Platform
} from 'react-native';
import { useProfile } from '../../lib/useProfile';

type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  online: boolean;
};

// Données mock — remplace avec requête Supabase
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1', name: 'Jean-Marc', avatar: '🏍️',
    lastMessage: 'OK m ap rive nan 3 minit!',
    time: '10:42', unread: 2, online: true,
  },
  {
    id: '2', name: 'Micheline', avatar: '👩',
    lastMessage: 'Kòmand ou an prè pou livrezon',
    time: '09:15', unread: 0, online: false,
  },
  {
    id: '3', name: 'Pierre (Chofè)', avatar: '🏍️',
    lastMessage: 'Mèsi anpil!',
    time: 'Yè', unread: 0, online: false,
  },
];

export default function ChatsScreen() {
  const { profile } = useProfile();
  const [search, setSearch] = useState('');

  const filtered = MOCK_CONVERSATIONS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function renderItem({ item }: { item: Conversation }) {
    return (
      <TouchableOpacity style={styles.row} activeOpacity={0.7}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarEmoji}>{item.avatar}</Text>
          {item.online && <View style={styles.onlineDot} />}
        </View>

        {/* Contenu */}
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <View style={styles.rowBottom}>
            <Text style={styles.lastMsg} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Mesaj</Text>
        <TouchableOpacity style={styles.newBtn}>
          <Text style={styles.newBtnText}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Chèche yon konvèsasyon..."
          placeholderTextColor="#AAA"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Liste */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>Pa gen konvèsasyon ankò</Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FEFAE0' },
  newBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  newBtnText: { fontSize: 18 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E0D8C8',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#1A1A1A' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  avatarWrap: { position: 'relative' },
  avatarEmoji: {
    fontSize: 32,
    width: 50, height: 50,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#F0EBE0',
    borderRadius: 25,
    overflow: 'hidden',
    lineHeight: 50,
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#28A745', borderWidth: 2, borderColor: '#FFF',
  },
  rowContent: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  time: { fontSize: 11, color: '#AAA' },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMsg: { fontSize: 13, color: '#777', flex: 1, marginRight: 8 },
  badge: {
    backgroundColor: '#F5A623',
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#0D1B3E' },

  separator: { height: 1, backgroundColor: '#F0EBE0', marginLeft: 80 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, color: '#AAA', textAlign: 'center' },
});

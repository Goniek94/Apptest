import React from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONVERSATION, grosze } from '@modamarket/shared';
import { C } from '@/shared/theme';
import { Icon } from '@/shared/ui/Icon';
import { Avatar } from '@/shared/ui';

/** Widok czatu — header rozmówcy, karta produktu, bąbelki, pole wpisywania (wg MessagesPage.Chat). */
export function ChatView({ onBack }: { onBack: () => void }) {
  const c = CONVERSATION;
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 56}
    >
      {/* Header rozmówcy */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <Icon name="arrowLeft" size={20} color={C.ink} />
        </TouchableOpacity>
        <Avatar name={c.peer.displayName} src={c.peer.avatarUrl} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={s.peerName}>{c.peer.displayName}</Text>
          <Text style={s.peerStatus}>{c.onlineLabel}</Text>
        </View>
        <Icon name="settings" size={18} color={C.muted} />
      </View>

      {/* Karta produktu */}
      {c.listing && (
        <View style={s.prodCard}>
          <Image source={{ uri: c.listing.imageUrl }} style={s.prodImg} />
          <View style={{ flex: 1 }}>
            <Text style={s.prodTitle} numberOfLines={1}>{c.listing.title}</Text>
            <Text style={s.prodPrice}>{grosze(c.listing.price)}</Text>
            <Text style={s.prodAvail}>Dostępny</Text>
          </View>
          <Icon name="chevronRight" size={16} color={C.muted} />
        </View>
      )}

      {/* Wiadomości */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.daySep}>Dzisiaj</Text>
        {c.messages.map((m) => (
          <View key={m.id} style={{ alignItems: m.fromMe ? 'flex-end' : 'flex-start' }}>
            {m.images ? (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {m.images.map((img, i) => (
                  <Image key={i} source={{ uri: img }} style={s.msgImg} />
                ))}
              </View>
            ) : (
              <View style={[s.bubble, m.fromMe ? s.bubbleMe : s.bubbleThem]}>
                <Text style={s.bubbleText}>{m.body}</Text>
              </View>
            )}
            <View style={s.metaRow}>
              <Text style={s.metaTime}>{m.timeLabel}</Text>
              {m.fromMe && <Icon name="check" size={11} color={m.read ? C.gold : C.muted} />}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pole wpisywania */}
      <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Icon name="paperclip" size={20} color={C.muted} />
        <TextInput
          style={s.input}
          placeholder="Napisz wiadomość..."
          placeholderTextColor={C.muted}
        />
        <TouchableOpacity style={s.sendBtn} activeOpacity={0.85}>
          <Icon name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.bg },
  peerName: { fontSize: 15, fontWeight: '700', color: C.ink },
  peerStatus: { fontSize: 11, color: C.muted, marginTop: 1 },

  prodCard: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 12, padding: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14 },
  prodImg: { width: 52, height: 52, borderRadius: 10, backgroundColor: C.goldSoft },
  prodTitle: { fontSize: 13, fontWeight: '700', color: C.ink },
  prodPrice: { fontSize: 14, fontWeight: '700', color: C.ink, marginTop: 2 },
  prodAvail: { fontSize: 11, color: '#2A7A4A', fontWeight: '600', marginTop: 1 },

  daySep: { textAlign: 'center', fontSize: 11, color: C.muted, marginVertical: 6 },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: C.goldSoft, borderBottomRightRadius: 6 },
  bubbleThem: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 14, color: C.ink, lineHeight: 19 },
  msgImg: { width: 96, height: 112, borderRadius: 10, backgroundColor: C.goldSoft },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, paddingHorizontal: 4 },
  metaTime: { fontSize: 10, color: C.muted },

  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg },
  input: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: C.ink },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
});

import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';
import { getSender, highlightSearchText } from '../../utils/chatHelpers';

export function ChatSearchModal({ visible, query, onChangeQuery, results, onClose, onSelect }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <TextInput
            autoFocus
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Search messages…"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? colors.card : '#fff',
                fontFamily: chatTypography.fontFamilyRegular,
              },
            ]}
          />
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>
              {query ? 'No messages found' : 'Type to search this chat'}
            </Text>
          }
          renderItem={({ item }) => {
            const text = item.text ?? '';
            const parts = highlightSearchText(text, query);
            const sender = getSender(item).fullName;
            return (
              <Pressable
                onPress={() => onSelect?.(item)}
                style={[styles.result, { backgroundColor: isDark ? colors.card : '#fff', borderColor: colors.border }]}
              >
                <Text style={{ color: colors.primary, fontFamily: chatTypography.fontFamilySemi, marginBottom: 4 }}>
                  {sender}
                </Text>
                <Text style={{ color: colors.text, lineHeight: 20 }}>
                  {parts.map((p, i) => (
                    <Text key={i} style={p.highlight ? { backgroundColor: 'rgba(250,204,21,0.5)' } : undefined}>
                      {p.text}
                    </Text>
                  ))}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  result: {
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
});

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageHeader, Screen, SearchBar } from '../../design-system';
import { useChatModule } from '../../contexts/ChatModuleContext';
import { SearchResultCard } from '../../components/chat/SearchResultCard';
import { searchChatMessages } from '../../services/chatService';
import { SEARCH_FILTERS, buildSearchParams, mergeSearchResults } from '../../utils/chatModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function ChatSearchScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { colors, layout } = useTheme();
  const { messages, prefs, members, scrollToBottom } = useChatModule();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('text');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!query.trim() && filter === 'text') {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const params = buildSearchParams({ query, filter });
        const server = await searchChatMessages(params).catch(() => []);
        if (!cancelled) {
          setResults(mergeSearchResults(messages, server, query, prefs.editedTexts));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, filter, messages, prefs.editedTexts]);

  const onSelect = useCallback(
    (message) => {
      navigation.navigate('Conversation');
      scrollToBottom();
    },
    [navigation, scrollToBottom],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader title="Search" subtitle="Text, media, links & more" onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search messages…" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
          {SEARCH_FILTERS.map((f) => (
            <FilterChip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
          ))}
        </View>
        {filter === 'member' ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
            Members: {(members ?? []).map((m) => m.fullName).join(', ')}
          </Text>
        ) : null}
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => String(item._id)}
        renderItem={({ item }) => <SearchResultCard message={item} query={query} onPress={onSelect} />}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 24 }}
        initialNumToRender={12}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: colors.textTertiary, textAlign: 'center', marginTop: 24, fontSize: 14 * layout.fontScale }}>
              {query ? 'No messages found' : 'Type to search your family chat'}
            </Text>
          ) : null
        }
      />
    </Screen>
  );
}

function FilterChip({ label, active, onPress }) {
  const { colors, radii } = useTheme();
  return (
    <Text
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radii.full,
        backgroundColor: active ? colors.primarySubtle : colors.surfaceSecondary,
        color: active ? colors.primary : colors.text,
        fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
        overflow: 'hidden',
      }}
    >
      {label}
    </Text>
  );
}

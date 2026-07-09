import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, PageHeader, SearchBar, Loader } from '../../design-system';
import { MemberCard, EmptyFamilyState } from '../../components/family';
import { useFamilyModuleData } from '../../hooks/useFamilyModuleData';
import { useResponsive } from '../../design-system';
import { Linking } from 'react-native';

export default function FamilyMembersScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const [query, setQuery] = useState('');
  const { members, familyLoading, loading, refreshing, refresh, noFamily } = useFamilyModuleData();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.fullName?.toLowerCase().includes(q) ||
        m.relationshipLabel?.toLowerCase().includes(q) ||
        m.displayRole?.toLowerCase().includes(q),
    );
  }, [members, query]);

  const handleMessage = useCallback(
    (member) => {
      navigation.getParent()?.navigate('Chat');
    },
    [navigation],
  );

  const handleCall = useCallback((member) => {
    if (member.phone) Linking.openURL(`tel:${member.phone}`);
  }, []);

  const handleProfile = useCallback(
    (member) => navigation.navigate('MemberProfile', { memberId: String(member._id) }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <MemberCard
        member={item}
        onPress={handleProfile}
        onCall={handleCall}
        onMessage={handleMessage}
        onViewProfile={handleProfile}
      />
    ),
    [handleCall, handleMessage, handleProfile],
  );

  const keyExtractor = useCallback((item) => String(item._id), []);

  if (noFamily && !familyLoading) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Members" showBack onBack={() => navigation.goBack()} />
        <EmptyFamilyState
          onCreate={() => navigation.navigate('CreateFamily')}
          onJoin={() => navigation.navigate('JoinFamily')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <PageHeader
        title="Members"
        subtitle={`${members.length} in your family`}
        onBack={() => navigation.goBack()}
      />
      <View style={{ paddingHorizontal: horizontalPadding, marginBottom: 12 }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search members" accessibilityLabel="Search family members" />
      </View>

      {loading && !refreshing ? (
        <Loader />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingHorizontal: horizontalPadding }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 32 },
});

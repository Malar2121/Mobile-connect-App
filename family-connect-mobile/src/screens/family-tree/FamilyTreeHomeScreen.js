import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FAB, PageHeader, Screen, SearchBar, SectionTitle } from '../../design-system';
import { useFamilyTreeModuleData } from '../../hooks/useFamilyTreeModuleData';
import {
  EmptyTreeState,
  PersonCard,
  TreeAnalyticsCard,
  TreePreview,
  TreeQuickActions,
  TreeSkeleton,
  LegacyProfileCard,
} from '../../components/family-tree';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function FamilyTreeHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();
  const { colors, layout, radii, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const searchFilters = useMemo(() => ({ query: searchQuery }), [searchQuery]);

  const {
    enrichedNodes,
    legacyProfiles,
    members,
    milestones,
    analytics,
    loading,
    refreshing,
    refresh,
    error,
    canManage,
    isMinor,
    searchResults,
  } = useFamilyTreeModuleData(searchFilters);

  const navigate = useCallback((screen, params) => navigation.navigate(screen, params), [navigation]);
  const openPerson = useCallback((person) => navigate('PersonProfile', { memberId: String(person.id ?? person._id) }), [navigate]);

  if (loading && !refreshing) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Family Tree" subtitle="Heritage & connections" large />
        <TreeSkeleton />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader title="Family Tree" subtitle="Interactive heritage system" large />
        {error ? <Text style={{ color: colors.error ?? '#EF4444', marginBottom: 8 }}>{error}</Text> : null}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, relationship, generation…"
          accessibilityLabel="Search family tree"
        />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={isDark ? ['#1A1528', '#2D2640'] : ['#EEF2FF', '#FDF4FF', '#FFFFFF']}
          style={{ borderRadius: radii['2xl'], padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 22 * layout.fontScale }}>Family overview</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 6, lineHeight: 22 }}>
            Visualize relationships, preserve stories, and explore your lineage across generations.
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 14, gap: 16 }}>
            <View>
              <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 24 }}>{analytics.memberCount}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Members</Text>
            </View>
            <View>
              <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 24 }}>{analytics.generationCount}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Generations</Text>
            </View>
            <View>
              <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 24 }}>{analytics.legacyProfileCount}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Legacy</Text>
            </View>
          </View>
        </LinearGradient>

        <TreePreview nodes={enrichedNodes} onPress={() => navigate('InteractiveTree')} />
        <TreeQuickActions onNavigate={navigate} isMinor={isMinor} />
        <TreeAnalyticsCard analytics={analytics} />

        {searchQuery ? (
          <>
            <SectionTitle title="Search results" subtitle={`${searchResults.length} matches`} />
            {searchResults.map((p) => (
              <PersonCard key={p.id} person={p} onPress={openPerson} compact />
            ))}
          </>
        ) : null}

        <SectionTitle title="Members" subtitle="Tap to view profile" />
        {enrichedNodes.length ? (
          enrichedNodes.slice(0, 8).map((p) => <PersonCard key={p.id} person={p} onPress={openPerson} compact />)
        ) : (
          <EmptyTreeState onAction={() => navigate('RelationshipEditor')} canManage={canManage} />
        )}

        {milestones.length ? (
          <>
            <SectionTitle title="Family milestones" />
            {milestones.map((m) => (
              <View
                key={m.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  backgroundColor: colors.surface,
                  borderRadius: radii.xl,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 10,
                }}
              >
                <Ionicons name={m.icon} size={22} color={colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold' }}>{m.title}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{m.body}</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

        {legacyProfiles.length ? (
          <>
            <SectionTitle title="Legacy profiles" subtitle="From remembrance mode" />
            {legacyProfiles.slice(0, 2).map((profile) => {
              const member = members.find((m) => String(m._id) === String(profile.memberId));
              return (
                <LegacyProfileCard
                  key={profile.memberId}
                  profile={profile}
                  member={member}
                  memoryCount={0}
                  onPress={() => navigate('LegacyProfiles', { memberId: profile.memberId })}
                />
              );
            })}
          </>
        ) : null}
      </ScrollView>

      <FAB
        icon={<Ionicons name="git-network" size={26} color="#FFFFFF" />}
        onPress={() => navigate('InteractiveTree')}
        accessibilityLabel="Open interactive family tree"
        style={{ bottom: insets.bottom + 100 }}
      />
    </Screen>
  );
}

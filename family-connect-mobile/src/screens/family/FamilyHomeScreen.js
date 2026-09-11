import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, PageHeader, Loader, SectionTitle } from '../../design-system';
import { useFamilyModuleData } from '../../hooks/useFamilyModuleData';
import {
  EmptyFamilyState,
  FamilyHeroCard,
  FamilyQuickActions,
  FamilyTimeline,
  AnalyticsCard,
  FamilyStatCard,
} from '../../components/family';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

export default function FamilyHomeScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();

  const { t } = useI18n();
  const {
    family,
    members,
    motto,
    inviteCode,
    memberCount,
    onlineCount,
    pendingJoinRequests,
    familyLoading,
    loading,
    refreshing,
    refresh,
    noFamily,
    timeline,
    analytics,
    canManage,
  } = useFamilyModuleData();

  const navigate = useCallback(
    (target) => {
      if (target?.parent) {
        navigation.getParent()?.navigate(target.screen, { screen: 'FamilyTreeHome' });
        return;
      }
      navigation.navigate(typeof target === 'string' ? target : target?.screen);
    },
    [navigation],
  );

  if (familyLoading && !family) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('family.title')} subtitle={t('family.homeSubtitle')} large onBack={() => navigation.goBack()} />
        <Loader />
      </Screen>
    );
  }

  if (noFamily) {
    return (
      <Screen edges={['top']}>
        <PageHeader title={t('family.title')} subtitle={t('family.getStarted')} large showBack onBack={() => navigation.goBack()} />
        <EmptyFamilyState
          onCreate={() => navigation.navigate('CreateFamily')}
          onJoin={() => navigation.navigate('JoinFamily')}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} noPadding>
      <View style={{ paddingHorizontal: horizontalPadding }}>
        <PageHeader
          title={t('family.title')}
          subtitle={family.name}
          large
          onBack={() => navigation.goBack()}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <FamilyHeroCard
          familyName={family.name}
          motto={motto}
          createdAt={family.createdAt}
          inviteCode={inviteCode}
          members={members}
          memberCount={memberCount}
          onlineCount={onlineCount}
          pendingRequests={pendingJoinRequests}
          onInvite={() => navigate('InviteMembers')}
          onSettings={() => navigate('FamilySettings')}
        />

        <View style={[styles.statsRow, { paddingHorizontal: horizontalPadding }]}>
          <FamilyStatCard label={t('tabs.memories')} value={analytics.totalMemories} icon="images-outline" onPress={() => navigation.getParent()?.navigate(t('tabs.memories'))} />
          <FamilyStatCard label={t('tabs.events')} value={analytics.totalEvents} icon="calendar-outline" onPress={() => navigation.getParent()?.navigate(t('tabs.events'))} />
          <FamilyStatCard label={t('family.thisWeek')} value={analytics.activityThisWeek} icon="pulse-outline" accent="#10B981" />
        </View>

        <FamilyQuickActions onNavigate={navigate} canManage={canManage} />

        {loading && !refreshing ? (
          <Loader />
        ) : (
          <>
            <View style={{ paddingHorizontal: horizontalPadding }}>
              <SectionTitle title={t('family.participation')} subtitle={t('family.realActivity')} />
              <AnalyticsCard
                title={t('family.analytics')}
                highlightMember={analytics.mostActiveMember}
                highlightAvatar={analytics.mostActiveAvatar}
                metrics={[
                  { label: t('family.members'), value: analytics.memberCount },
                  { label: t('elder.messages'), value: analytics.totalMessages },
                  { label: t('memories.albums'), value: analytics.totalMemories },
                  { label: t('family.relationships'), value: analytics.relationshipsMapped },
                ]}
              />
            </View>
            <FamilyTimeline items={timeline} subtitle={t('family.timelineSubtitle')} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
});

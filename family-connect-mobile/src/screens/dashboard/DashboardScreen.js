import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { GlassCard, useToast } from '../../design-system';
import { useDashboardData } from '../../hooks/useDashboardData';
import { createInviteCode } from '../../services/familyService';
import { GreetingSection } from '../../components/dashboard/GreetingSection';
import { FamilyHeroCard } from '../../components/dashboard/FamilyHeroCard';
import { TodaysSummary } from '../../components/dashboard/TodaysSummary';
import { ReminderCard } from '../../components/dashboard/ReminderCard';
import { UpcomingEventsSection } from '../../components/dashboard/UpcomingEventsSection';
import { MemoryCarousel } from '../../components/dashboard/MemoryCarousel';
import { ActivityTimeline } from '../../components/dashboard/ActivityTimeline';
import { QuickActionsGrid } from '../../components/dashboard/QuickActionsGrid';
import { InsightsSection } from '../../components/dashboard/InsightsSection';
import { SkeletonDashboard } from '../../components/dashboard/SkeletonDashboard';
import { EmptyDashboard } from '../../components/dashboard/EmptyDashboard';
import { useTheme } from '../../hooks/useTheme';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { colors } = useTheme();
  const [inviting, setInviting] = useState(false);

  const {
    familyLoading,
    sectionLoading,
    refreshing,
    sectionError,
    refresh,
    user,
    uiMode,
    noFamily,
    familyName,
    inviteCode,
    members,
    memberCount,
    liveCount,
    upcomingEvents,
    recentMemories,
    reminders,
    activityFeed,
    insights,
    weeklyActivity,
    todaySummary,
    unreadNotificationCount,
  } = useDashboardData();

  const isMinor = uiMode === 'minor';

  const handleInvite = useCallback(async () => {
    setInviting(true);
    try {
      let code = inviteCode;
      if (!code) {
        const data = await createInviteCode();
        code = data.inviteCode;
      }
      await Clipboard.setStringAsync(code);
      toast.success('Invite code copied to clipboard');
    } catch (e) {
      toast.error(e.message || 'Invite failed');
    } finally {
      setInviting(false);
    }
  }, [inviteCode, toast]);

  const navigateTab = useCallback(
    (route, screen, nestedScreen, params) => {
      if (nestedScreen) {
        navigation.navigate(route, { screen, params: { screen: nestedScreen, params } });
      } else if (screen) {
        navigation.navigate(route, { screen, params });
      } else {
        navigation.navigate(route);
      }
    },
    [navigation],
  );

  const handleStatPress = useCallback(
    (key) => {
      if (key === 'todayEvents' || key === 'events') navigateTab('Events', 'EventsHome');
      else if (key === 'newMemories' || key === 'memories' || key === 'photos') navigateTab('Memories', 'MemoriesHome');
      else if (key === 'unreadMessages' || key === 'messages') navigateTab('Chat', 'Conversation');
      else if (key === 'unreadNotifications') navigation.navigate('Profile', { screen: 'Notifications' });
      else if (key === 'activeMembers') navigateTab('Map');
    },
    [navigateTab, navigation],
  );

  const handleQuickAction = useCallback(
    (item) => {
      if (item.action === 'invite') {
        handleInvite();
        return;
      }
      navigateTab(item.route, item.screen, item.nestedScreen);
    },
    [handleInvite, navigateTab],
  );

  const handleEventPress = useCallback(
    (event) => {
      navigation.navigate('Events', {
        screen: 'EventDetails',
        params: { id: String(event._id) },
      });
    },
    [navigation],
  );

  if (familyLoading && !refreshing) {
    return <SkeletonDashboard />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <GreetingSection
          userName={user?.fullName}
          familyName={noFamily ? 'Family Connect' : familyName}
          unreadCount={unreadNotificationCount}
          onNotifications={() => navigation.navigate('Profile', { screen: 'Notifications' })}
          onSettings={() => navigation.navigate('Profile', { screen: 'ProfileMain' })}
        />

        {sectionError ? (
          <View style={styles.errorWrap}>
            <GlassCard>
              <Text style={{ color: colors.error, fontSize: 14 }}>{sectionError}</Text>
            </GlassCard>
          </View>
        ) : null}

        {noFamily ? (
          <EmptyDashboard
            onCreateFamily={() => navigation.navigate('Profile', { screen: 'CreateFamily' })}
            onJoinFamily={() => navigation.navigate('Profile', { screen: 'JoinFamily' })}
          />
        ) : (
          <>
            <FamilyHeroCard
              familyName={familyName}
              members={members}
              memberCount={memberCount}
              onlineCount={liveCount}
              inviteCode={inviteCode}
              inviting={inviting}
              onInvite={handleInvite}
              onManage={() => navigation.navigate('Profile', { screen: 'FamilyModule', params: { screen: 'FamilyHome' } })}
            />

            {sectionLoading && !refreshing ? (
              <SkeletonDashboard embedded />
            ) : (
              <>
                <TodaysSummary summary={todaySummary} onStatPress={handleStatPress} />

                <ReminderCard
                  reminders={reminders}
                  onPressReminder={handleEventPress}
                  onViewAll={() => navigateTab('Events', 'EventsHome')}
                />

                <UpcomingEventsSection
                  events={upcomingEvents}
                  onEventPress={handleEventPress}
                  onViewAll={() => navigateTab('Events', 'EventsHome')}
                  onAddEvent={() => navigateTab('Events', 'CreateEvent')}
                />

                <MemoryCarousel
                  memories={recentMemories}
                  onMemoryPress={() => navigateTab('Memories', 'MemoriesHome')}
                  onViewAll={() => navigateTab('Memories', 'MemoriesHome')}
                />

                <ActivityTimeline items={activityFeed} />

                <QuickActionsGrid isMinor={isMinor} onAction={handleQuickAction} />

                <InsightsSection insights={insights} weeklyActivity={weeklyActivity} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  errorWrap: { paddingHorizontal: 20, marginBottom: 12 },
});

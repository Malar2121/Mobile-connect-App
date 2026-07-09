import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, EmptyState } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

function EmptyDashboardComponent({ onCreateFamily, onJoinFamily }) {
  const { layout } = useTheme();
  const { horizontalPadding } = useResponsive();

  return (
    <Animated.View
      entering={FadeInDown.duration(520).springify()}
      style={[styles.wrap, { paddingHorizontal: horizontalPadding, marginTop: layout.sectionGap }]}
    >
      <EmptyState
        icon="home-outline"
        title="Welcome to your family home"
        description="Create or join a family space to unlock events, memories, chat, live map, and a shared activity feed — all in one place."
      />
      <View style={styles.actions}>
        <Button title="Create family" onPress={onCreateFamily} size="lg" />
        <Button title="Join with invite code" variant="secondary" onPress={onJoinFamily} style={{ marginTop: 12 }} />
      </View>
    </Animated.View>
  );
}

export const EmptyDashboard = memo(EmptyDashboardComponent);

const styles = StyleSheet.create({
  wrap: { alignItems: 'stretch' },
  actions: { marginTop: 8, paddingHorizontal: 8 },
});

import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, EmptyState } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';
import { useI18n } from '../../i18n';

function EmptyDashboardComponent({ onCreateFamily, onJoinFamily }) {
  const { layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const { t } = useI18n();

  return (
    <Animated.View
      entering={FadeInDown.duration(520).springify()}
      style={[styles.wrap, { paddingHorizontal: horizontalPadding, marginTop: layout.sectionGap }]}
    >
      <EmptyState
        icon="home-outline"
        title={t('dashboard.emptyTitle')}
        description={t('dashboard.emptyDescription')}
      />
      <View style={styles.actions}>
        <Button title={t('profile.createFamily')} onPress={onCreateFamily} size="lg" />
        <Button title={t('dashboard.joinWithCode')} variant="secondary" onPress={onJoinFamily} style={{ marginTop: 12 }} />
      </View>
    </Animated.View>
  );
}

export const EmptyDashboard = memo(EmptyDashboardComponent);

const styles = StyleSheet.create({
  wrap: { alignItems: 'stretch' },
  actions: { marginTop: 8, paddingHorizontal: 8 },
});

import React from 'react';

import { StyleSheet, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, EmptyState } from '../../design-system';

import { dashboardSpacing } from '../../constants/dashboardTheme';
import { useI18n } from '../../i18n';



export function DashboardNoFamilyView({ onCreateFamily, onJoinFamily }) {
  const { t } = useI18n();

  return (

    <Animated.View entering={FadeInDown.duration(520).springify()} style={styles.wrap}>

      <EmptyState

        icon="people-outline"

        title={t('dash.startCircle')}

        description={t('dash.noFamilyBody')}

      />

      <View style={styles.actions}>

        <Button title={t('profile.createFamily')} onPress={onCreateFamily} size="lg" />

        <Button title={t('dash.joinWithCode')} variant="secondary" onPress={onJoinFamily} style={{ marginTop: 12 }} />

      </View>

    </Animated.View>

  );

}



const styles = StyleSheet.create({

  wrap: {

    paddingHorizontal: dashboardSpacing.screen,

    paddingTop: dashboardSpacing.md,

  },

  actions: {

    marginTop: dashboardSpacing.sm,

    paddingHorizontal: dashboardSpacing.sm,

  },

});


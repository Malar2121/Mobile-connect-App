import React from 'react';

import { StyleSheet, View } from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, EmptyState } from '../../design-system';

import { dashboardSpacing } from '../../constants/dashboardTheme';



export function DashboardNoFamilyView({ onCreateFamily, onJoinFamily }) {

  return (

    <Animated.View entering={FadeInDown.duration(520).springify()} style={styles.wrap}>

      <EmptyState

        icon="people-outline"

        title="Start your family circle"

        description="Create a private space for events, memories, chat, and live locations — all in one beautiful home."

      />

      <View style={styles.actions}>

        <Button title="Create family" onPress={onCreateFamily} size="lg" />

        <Button title="Join with code" variant="secondary" onPress={onJoinFamily} style={{ marginTop: 12 }} />

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


import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CategoryChip } from './CategoryChip';
import { CountdownCard } from './CountdownCard';
import { useTheme } from '../../hooks/useTheme';
import { formatEventDateLong } from '../../utils/eventFormat';
import { getEventCategory } from '../../utils/eventModuleHelpers';

function EventHeroCardComponent({ event, countdown, onPress }) {
  const { colors, layout, radii, isDark } = useTheme();
  const category = getEventCategory(event);
  const timeLine = [event?.startTime, event?.endTime].filter(Boolean).join(' – ');

  return (
    <View style={[styles.wrap, { borderRadius: radii['2xl'], overflow: 'hidden' }]}>
      {event?.image ? (
        <Image source={{ uri: event.image }} style={styles.image} accessibilityLabel="Event cover" />
      ) : (
        <LinearGradient
          colors={isDark ? ['#1A1D3D', '#4F56D9'] : ['#EEF0FF', '#C7D2FE']}
          style={styles.image}
        />
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.overlay}>
        <CategoryChip label={category.label} color={category.color} />
        <Text
          style={{
            color: '#fff',
            fontFamily: 'Inter_700Bold',
            fontSize: 26 * layout.fontScale,
            marginTop: 10,
          }}
          numberOfLines={2}
        >
          {event?.title}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 * layout.fontScale, marginTop: 6 }}>
          {formatEventDateLong(event?.date)}
          {timeLine ? ` · ${timeLine}` : ''}
        </Text>
        {countdown ? (
          <View style={{ marginTop: 12 }}>
            <CountdownCard label="Starts in" value={countdown} compact light />
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

export const EventHeroCard = memo(EventHeroCardComponent);

const styles = StyleSheet.create({
  wrap: { minHeight: 220 },
  image: { ...StyleSheet.absoluteFillObject, height: 220 },
  overlay: { flex: 1, justifyContent: 'flex-end', padding: 20, minHeight: 220 },
});

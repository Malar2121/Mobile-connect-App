import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Avatar } from '../../design-system';
import { isLocationOnline } from '../../utils/mapModuleHelpers';

const AnimatedView = Animated.createAnimatedComponent(View);

// Children and elders get a distinct badge so guardians can spot
// tracked members at a glance.
const TYPE_BADGE = {
  child: { emoji: '🧒', color: '#F59E0B' },
  elder: { emoji: '👴', color: '#8B5CF6' },
};

function MemberMarkerComponent({ location, onPress, isElder, isDark, colors, selected }) {
  const name = location.user?.fullName ?? 'Member';
  const size = isElder ? 48 : 40;
  const online = isLocationOnline(location.updatedAt);
  const badge = TYPE_BADGE[location.memberType ?? location.user?.memberType];
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (online) {
      pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 900 }), withTiming(1, { duration: 900 })), -1, false);
    }
  }, [online, pulse]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Marker
      coordinate={{ latitude: location.latitude, longitude: location.longitude }}
      onPress={() => onPress(location)}
      tracksViewChanges={false}
      zIndex={selected ? 10 : 1}
    >
      <AnimatedView style={[styles.wrap, animStyle]}>
        <View style={[styles.ring, { borderColor: badge ? badge.color : online ? colors.success : colors.primary, backgroundColor: isDark ? colors.card : '#fff', borderWidth: selected ? 4 : 3 }]}>
          <Avatar uri={location.user?.avatar} name={name} size={size} />
          {online ? <View style={[styles.dot, { backgroundColor: colors.success, borderColor: isDark ? colors.card : '#fff' }]} /> : null}
          {badge ? (
            <View style={[styles.typeBadge, { backgroundColor: badge.color, borderColor: isDark ? colors.card : '#fff' }]}>
              <Text style={styles.typeBadgeText}>{badge.emoji}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.tail, { borderTopColor: online ? colors.success : colors.primary }]} />
      </AnimatedView>
    </Marker>
  );
}

export const MemberMarker = memo(MemberMarkerComponent);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  ring: { borderRadius: 999, padding: 2, elevation: 4 },
  dot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  typeBadge: { position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  typeBadgeText: { fontSize: 11 },
  tail: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
});

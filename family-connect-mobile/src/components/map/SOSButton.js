import React, { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

function SOSButtonComponent({ onPress, countdown, onCancel, disabled }) {
  const { colors, layout, radii } = useTheme();

  const { t } = useI18n();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.06, { duration: 600 }), -1, true);
  }, [pulse]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (countdown > 0) {
    return (
      <View style={styles.countdownWrap}>
        <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 48 * layout.fontScale }}>{countdown}</Text>
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{t('map.sendingSos')}</Text>
        <Pressable onPress={onCancel} style={[styles.cancel, { borderColor: colors.border, borderRadius: radii.lg }]}>
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>{t('common.cancel')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View style={[animStyle, disabled && { opacity: 0.6 }]}>
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={t('map.emergencySos')}>
        <LinearGradient colors={['#DC2626', '#EF4444', '#F87171']} style={[styles.btn, { borderRadius: radii.full }]}>
          <Text style={styles.label}>SOS</Text>
          <Text style={styles.sub}>{t('map.emergency')}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export const SOSButton = memo(SOSButtonComponent);

const styles = StyleSheet.create({
  btn: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  label: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 32 },
  sub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  countdownWrap: { alignItems: 'center', paddingVertical: 24 },
  cancel: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1 },
});

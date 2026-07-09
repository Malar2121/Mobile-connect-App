import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../contexts/NetworkContext';
import { useI18n } from '../i18n';
import { useTheme } from '../hooks/useTheme';

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (isOnline) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${t('common.offline')}. ${t('common.offlineHint')}`}
      style={[styles.banner, { paddingTop: insets.top + 4, backgroundColor: theme.colors.error }]}
    >
      <Text style={[styles.text, { color: theme.colors.textInverse }]}>{t('common.offline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 8,
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});

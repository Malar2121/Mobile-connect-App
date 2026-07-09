import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';

export function ChatDateChip({ label }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.chip,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.92)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: colors.textSecondary, fontFamily: chatTypography.fontFamilySemi },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
});

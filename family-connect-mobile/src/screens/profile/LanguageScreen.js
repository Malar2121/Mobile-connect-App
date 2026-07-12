import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader, Screen, SectionTitle, useToast } from '../../design-system';
import { SUPPORTED_LOCALES, useI18n } from '../../i18n';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

function LanguageOption({ option, selected, onSelect, colors, layout, t }) {
  const label = t(option.labelKey) || option.nativeLabel;
  return (
    <Pressable
      onPress={() => onSelect(option.id)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint={selected ? t('accessibility.selected') : t('accessibility.notSelected')}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primarySubtle : colors.surface,
          minHeight: layout.minTouch,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text style={{ color: colors.text, fontSize: 17 * layout.fontScale, fontFamily: 'Inter_600SemiBold', flex: 1 }}>
        {option.nativeLabel}
      </Text>
      {selected ? <Ionicons name="checkmark-circle" size={24} color={colors.primary} /> : null}
    </Pressable>
  );
}

export default function LanguageScreen({ navigation }) {
  const { colors, layout } = useTheme();
  const { horizontalPadding } = useResponsive();
  const toast = useToast();
  const { locale, setLocale, t } = useI18n();

  const handleSelect = useCallback(
    async (id) => {
      await setLocale(id);
      toast.success(t('language.changed'));
    },
    [setLocale, t, toast],
  );

  return (
    <Screen edges={['top']}>
      <PageHeader
        title={t('language.title')}
        subtitle={t('language.subtitle')}
        onBack={() => navigation.goBack()}
      />
      <View style={{ paddingTop: 8 }}>
        <SectionTitle title={t('profile.language')} />
        {SUPPORTED_LOCALES.map((option) => (
          <LanguageOption
            key={option.id}
            option={option}
            selected={locale === option.id}
            onSelect={handleSelect}
            colors={colors}
            layout={layout}
            t={t}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
});

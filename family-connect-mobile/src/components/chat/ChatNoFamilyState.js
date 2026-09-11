import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../Card';
import { chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

export function ChatNoFamilyState() {
  const { t } = useI18n();
  const { colors, layout } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: chatTypography.fontFamilyBold }]}>
        {t('chat.familyChat2')}
      </Text>
      <View style={{ padding: layout.sectionGap, flex: 1, justifyContent: 'center' }}>
        <Card>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
            {t('chat.joinAFamilyToStartChatting')}
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 22 }}>
            {t('chat.createOrJoinAFamilyFrom')}
          </Text>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  title: {
    fontSize: 28,
    paddingHorizontal: 20,
    letterSpacing: -0.5,
  },
});

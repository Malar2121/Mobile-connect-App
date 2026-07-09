import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { chatGradients, chatTypography } from '../../constants/chatTheme';
import { useTheme } from '../../hooks/useTheme';

export function ChatEmptyState() {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={isDark ? chatGradients.sentDark : chatGradients.sent}
        style={styles.iconWrap}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="chatbubbles" size={32} color="#fff" />
      </LinearGradient>
      <Text style={[styles.title, { color: colors.text, fontFamily: chatTypography.fontFamilyBold }]}>
        Start the conversation
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: chatTypography.fontFamilyRegular }]}>
        Say hello to your family. Share photos, voice notes, and memories together.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});

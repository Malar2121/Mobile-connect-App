import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../design-system';

export default function ChildDashboardScreen() {
  const { colors, radii, spacing, typography, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Fun Greeting */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }]}>
          <Text style={[typography.h1, { color: colors.text }]}>
            Hi, {user?.fullName?.split(' ')[0] || 'Buddy'}! 👋
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            Your family is online and safe.
          </Text>
        </View>

        {/* Big Quick Actions */}
        <View style={[styles.grid, { paddingHorizontal: spacing.lg }]}>
          <Pressable 
            style={[styles.bigButton, shadows.sm, { backgroundColor: '#4ade80', borderRadius: radii['3xl'] }]}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="map" size={32} color="#166534" />
            </View>
            <Text style={styles.buttonText}>Find Family</Text>
          </Pressable>

          <Pressable 
            style={[styles.bigButton, shadows.sm, { backgroundColor: '#60a5fa', borderRadius: radii['3xl'] }]}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="chatbubbles" size={32} color="#1e3a8a" />
            </View>
            <Text style={styles.buttonText}>Messages</Text>
          </Pressable>
        </View>

        {/* Emergency/SOS Button */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Pressable 
            style={[styles.sosButton, shadows.md, { backgroundColor: '#f87171', borderRadius: radii['3xl'], padding: spacing.xl }]}
            onPress={() => alert('SOS Alert Sent to Parents!')}
          >
            <Ionicons name="alert-circle" size={40} color="#fff" />
            <Text style={styles.sosText}>I Need Help</Text>
          </Pressable>
        </View>

        {/* Simple Family Status */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <GlassCard style={{ padding: spacing.lg, borderRadius: radii['2xl'] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.statusDot, { backgroundColor: '#4ade80' }]} />
              <Text style={[typography.h3, { color: colors.text, marginLeft: spacing.sm }]}>
                Mom & Dad are Home
              </Text>
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs, marginLeft: spacing.xl }]}>
              Last updated 5 mins ago
            </Text>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: { alignItems: 'center' },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  bigButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  iconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  sosText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { GlassCard } from '../../design-system';

export default function ChildDashboardScreen() {
  const { colors, radii, spacing, typography, shadows, setUiMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation();
  const { liveCount, members } = useDashboardData();
  const [showModeSwitch, setShowModeSwitch] = useState(false);

  const MODES = [
    { id: 'standard', label: 'Standard Mode', icon: 'phone-portrait-outline', desc: 'Full app access' },
    { id: 'elder', label: 'Elder Mode', icon: 'accessibility-outline', desc: 'Larger text & simpler layout' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Fun Greeting */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }]}>
          <View style={styles.headerRow}>
            <Text style={[typography.h1, { color: colors.text, flex: 1 }]}>
              Hi, {user?.fullName?.split(' ')[0] || 'Buddy'}! 👋
            </Text>
            <Pressable
              onPress={() => setShowModeSwitch(true)}
              style={[styles.settingsBtn, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.full || 999 }]}
              accessibilityLabel="Switch mode"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
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
            onPress={() => navigation.navigate('Map', { screen: 'SOSScreen' })}
            accessibilityRole="button"
            accessibilityLabel="I need help — open SOS"
          >
            <Ionicons name="alert-circle" size={40} color="#fff" />
            <Text style={styles.sosText}>I Need Help</Text>
          </Pressable>
        </View>

        {/* Simple Family Status */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <GlassCard style={{ padding: spacing.lg, borderRadius: radii['2xl'] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.statusDot, { backgroundColor: liveCount > 0 ? '#4ade80' : colors.border }]} />
              <Text style={[typography.h3, { color: colors.text, marginLeft: spacing.sm }]}>
                {liveCount > 0
                  ? `${liveCount} family ${liveCount === 1 ? 'member is' : 'members are'} sharing location`
                  : 'No one is sharing location right now'}
              </Text>
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs, marginLeft: spacing.xl }]}>
              {members?.length ? `${members.length} people in your family` : 'Ask a parent to add you to a family'}
            </Text>
          </GlassCard>
        </View>
      </ScrollView>

      {/* Mode Switch Modal */}
      <Modal
        visible={showModeSwitch}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModeSwitch(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowModeSwitch(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderRadius: radii['2xl'], paddingBottom: insets.bottom + 24 }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[typography.h2, { color: colors.text, paddingHorizontal: spacing.lg, marginBottom: 8 }]}>
              Switch Mode
            </Text>
            <Text style={{ color: colors.textSecondary, paddingHorizontal: spacing.lg, marginBottom: spacing.lg, fontSize: 14 }}>
              Choose how you want to use Family Connect
            </Text>
            {MODES.map((mode) => (
              <Pressable
                key={mode.id}
                style={[styles.modeRow, { borderColor: colors.border, marginHorizontal: spacing.lg }]}
                onPress={() => { setUiMode(mode.id); setShowModeSwitch(false); }}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${mode.label}`}
              >
                <View style={[styles.modeIcon, { backgroundColor: colors.primarySubtle, borderRadius: radii.xl }]}>
                  <Ionicons name={mode.icon} size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 }}>{mode.label}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{mode.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>
            ))}
            <Pressable
              style={[styles.cancelBtn, { borderColor: colors.border, marginHorizontal: spacing.lg, borderRadius: radii.lg }]}
              onPress={() => setShowModeSwitch(false)}
            >
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: {},
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  settingsBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
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
  // Mode switch modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modeIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});

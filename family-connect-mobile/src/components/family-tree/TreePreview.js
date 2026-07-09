import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function TreePreviewComponent({ nodes, onPress }) {
  const { colors, layout, radii, isDark } = useTheme();
  const preview = (nodes ?? []).slice(0, 5);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1, marginBottom: 16 }]}>
      <LinearGradient
        colors={isDark ? ['#14141C', '#1F2937'] : ['#F8FAFC', '#EEF2FF']}
        style={[styles.wrap, { borderRadius: radii['2xl'], borderColor: colors.border }]}
      >
        <View style={styles.header}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 16 * layout.fontScale }}>Tree preview</Text>
          <View style={styles.link}>
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Open tree</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
          </View>
        </View>
        <View style={styles.nodes}>
          {preview.map((n, i) => (
            <View key={n.id} style={[styles.nodeCol, { marginLeft: i > 0 ? -8 : 0 }]}>
              <Avatar uri={n.avatar} name={n.name} size={40} />
              {i < preview.length - 1 ? (
                <View style={[styles.connector, { backgroundColor: colors.border }]} />
              ) : null}
            </View>
          ))}
        </View>
        <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 12 }}>
          {(nodes ?? []).length} members · Pinch to zoom in full tree
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

export const TreePreview = memo(TreePreviewComponent);

const styles = StyleSheet.create({
  wrap: { padding: 18, borderWidth: StyleSheet.hairlineWidth },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  link: { flexDirection: 'row', alignItems: 'center' },
  nodes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  nodeCol: { alignItems: 'center' },
  connector: { position: 'absolute', right: -14, top: 20, width: 20, height: 2 },
});

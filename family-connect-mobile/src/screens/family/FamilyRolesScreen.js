import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, PageHeader, Card } from '../../design-system';
import { RoleBadge } from '../../components/family';
import { ROLE_DEFINITIONS } from '../../utils/familyModuleHelpers';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function FamilyRolesScreen() {
  const navigation = useNavigation();
  const { colors, layout, radii } = useTheme();
  const { horizontalPadding } = useResponsive();

  const renderRole = ({ item }) => (
    <Card style={{ marginBottom: 12 }}>
      <View style={styles.header}>
        <RoleBadge role={item.id} />
        {item.readOnly ? (
          <View style={[styles.readOnly, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.full }]}>
            <Text style={{ color: colors.textTertiary, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>READ-ONLY</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 10, lineHeight: 22 }}>
        {item.description}
      </Text>
      <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 * layout.fontScale, marginTop: 14 }}>
        Permissions
      </Text>
      {item.permissions.map((p) => (
        <View key={p} style={styles.permRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={{ color: colors.text, fontSize: 13 * layout.fontScale, marginLeft: 8 }}>{p}</Text>
        </View>
      ))}
    </Card>
  );

  return (
    <Screen edges={['top']}>
      <PageHeader
        title="Family roles"
        subtitle="Understand permissions at a glance"
        onBack={() => navigation.goBack()}
      />
      <View style={{ paddingBottom: 12 }}>
        {/* This screen is the reference list of what each role can do. Roles
            are changed on a member's own profile, which is where the update
            actually happens. */}
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 12 }}>
          What each role can do in your family. The family owner is whoever created it and always has admin
          rights.
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: 12 * layout.fontScale, marginBottom: 8 }}>
          To change someone&apos;s role, open Members, choose the person, and pick a role on their profile.
        </Text>
      </View>
      <FlatList
        data={ROLE_DEFINITIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderRole}
        contentContainerStyle={{ paddingBottom: 32 }}
        initialNumToRender={5}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readOnly: { paddingHorizontal: 8, paddingVertical: 3 },
  permRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});

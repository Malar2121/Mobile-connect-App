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
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginBottom: 12 }}>
          Role assignment requires a backend API. Roles are displayed based on each member&apos;s account role. Family
          owners are identified as the family creator with admin privileges.
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: 11, marginBottom: 8 }}>
          TODO: PUT /api/family/members/:id/role for role management.
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

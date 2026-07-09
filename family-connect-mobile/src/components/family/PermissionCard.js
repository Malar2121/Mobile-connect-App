import React, { memo } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';

function PermissionCardComponent({
  title,
  description,
  icon,
  value,
  onValueChange,
  options,
  selectedOption,
  onSelectOption,
  readOnly,
  todoNote,
}) {
  const { colors, layout, radii } = useTheme();

  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={styles.header}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySubtle, borderRadius: radii.md }]}>
            <Ionicons name={icon} size={20} color={colors.primary} />
          </View>
        ) : null}
        <View style={{ flex: 1, marginLeft: icon ? 12 : 0 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 * layout.fontScale }}>
            {title}
          </Text>
          {description ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 * layout.fontScale, marginTop: 4 }}>
              {description}
            </Text>
          ) : null}
        </View>
        {typeof value === 'boolean' && onValueChange && !readOnly ? (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            accessibilityLabel={title}
          />
        ) : null}
      </View>

      {options?.length ? (
        <View style={[styles.options, { borderTopColor: colors.border }]}>
          {options.map((opt) => {
            const selected = selectedOption === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => !readOnly && onSelectOption?.(opt.id)}
                disabled={readOnly}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected ? colors.primarySubtle : colors.surfaceSecondary,
                    borderColor: selected ? colors.primary : colors.border,
                    borderRadius: radii.lg,
                    minHeight: layout.minTouch,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: readOnly }}
              >
                <Text
                  style={{
                    color: selected ? colors.primary : colors.text,
                    fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    fontSize: 14 * layout.fontScale,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {todoNote ? (
        <Text style={{ color: colors.textTertiary, fontSize: 11 * layout.fontScale, marginTop: 10 }}>
          {todoNote}
        </Text>
      ) : null}
    </Card>
  );
}

export const PermissionCard = memo(PermissionCardComponent);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  options: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  option: { padding: 14, borderWidth: StyleSheet.hairlineWidth },
});

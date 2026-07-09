import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

/**
 * Premium text field — floating label, error state, multiline support.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  error,
  hint,
  multiline,
  numberOfLines = 4,
  containerStyle,
  leftIcon,
  rightIcon,
  editable = true,
  accessibilityLabel,
}) {
  const { colors, layout, isDark, radii } = useTheme();
  const multi = Boolean(multiline);
  const inputMinHeight = multi
    ? Math.max(layout.minTouch, (numberOfLines || 4) * (22 * layout.fontScale))
    : layout.minTouch;

  return (
    <View style={[{ marginBottom: layout.sectionGap }, containerStyle]}>
      {label ? (
        <Text
          accessibilityRole="text"
          style={[
            styles.label,
            {
              color: colors.textSecondary,
              fontSize: 13 * layout.fontScale,
              marginBottom: layout.sectionGap * 0.4,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          {
            borderColor: error ? colors.error : colors.borderStrong,
            backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
            borderRadius: radii.md,
            minHeight: inputMinHeight,
          },
          !editable && { opacity: 0.6 },
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multi}
          editable={editable}
          textAlignVertical={multi ? 'top' : 'center'}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: 16 * layout.fontScale,
              paddingTop: multi ? 12 : undefined,
              paddingLeft: leftIcon ? 4 : 14,
              paddingRight: rightIcon ? 4 : 14,
            },
          ]}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text
          accessibilityRole="alert"
          style={[styles.error, { color: colors.error, fontSize: 13 * layout.fontScale }]}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textTertiary, fontSize: 12 * layout.fontScale }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
  },
  leftIcon: { paddingLeft: 12 },
  rightIcon: { paddingRight: 12 },
  error: { marginTop: 6, fontFamily: 'Inter_400Regular' },
  hint: { marginTop: 6, fontFamily: 'Inter_400Regular' },
});

export { TextField as DSTextField };

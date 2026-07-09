import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useMotion } from '../../hooks/useMotion';
import { Button } from './Button';

const DialogContext = createContext(undefined);

/**
 * Global confirmation dialog provider — replaces Alert.alert for common flows.
 */
export function DialogProvider({ children }) {
  const [state, setState] = useState(null);

  const hide = useCallback(() => setState(null), []);

  const confirm = useCallback(
    ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive }) =>
      new Promise((resolve) => {
        setState({
          title,
          message,
          confirmLabel,
          cancelLabel,
          destructive,
          resolve,
        });
      }),
    [],
  );

  const handleConfirm = useCallback(() => {
    state?.resolve?.(true);
    hide();
  }, [state, hide]);

  const handleCancel = useCallback(() => {
    state?.resolve?.(false);
    hide();
  }, [state, hide]);

  const value = useMemo(() => ({ confirm, hide }), [confirm, hide]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {state ? (
        <ConfirmDialog
          title={state.title}
          message={state.message}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          destructive={state.destructive}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ) : null}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}) {
  const { colors, isDark, radii, layout } = useTheme();
  const { reduceMotion } = useMotion();

  const CardWrapper = reduceMotion ? View : Animated.View;
  const cardProps = reduceMotion
    ? {}
    : { entering: ZoomIn.duration(220).springify() };

  return (
    <Modal
      transparent
      visible
      animationType="none"
      accessibilityViewIsModal
      onRequestClose={onCancel}
    >
      <View style={styles.root}>
        <BlurView
          intensity={isDark ? 48 : 72}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        />
        <CardWrapper
          {...cardProps}
          accessibilityRole="alert"
          accessibilityLabel={title}
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceElevated,
              borderRadius: radii['2xl'],
              borderColor: colors.border,
              padding: layout.sectionGap,
            },
          ]}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 18 * layout.fontScale,
              fontFamily: 'Inter_700Bold',
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
          {message ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 15 * layout.fontScale,
                lineHeight: 22 * layout.fontScale,
                marginBottom: 20,
              }}
            >
              {message}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              variant="ghost"
              onPress={onCancel}
              fullWidth={false}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          </View>
        </CardWrapper>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export { ConfirmDialog };

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const ToastContext = createContext(undefined);

const ICONS = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
};

/**
 * Toast / snackbar system — top-positioned, auto-dismiss.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, options = {}) => {
      const id = Date.now().toString() + Math.random();
      const duration = options.duration ?? 3200;
      const type = options.type ?? 'info';

      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);

      setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      show,
      success: (msg, opts) => show(msg, { ...opts, type: 'success' }),
      error: (msg, opts) => show(msg, { ...opts, type: 'error' }),
      warning: (msg, opts) => show(msg, { ...opts, type: 'warning' }),
      info: (msg, opts) => show(msg, { ...opts, type: 'info' }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastContainer({ toasts, onDismiss }) {
  const insets = useSafeAreaInsets();

  if (!toasts.length) return null;

  return (
    <View
      style={[styles.container, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </View>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { colors, layout, radii, shadows, isDark } = useTheme();

  const colorMap = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
  };

  return (
    <Animated.View
      entering={FadeInUp.springify()}
      exiting={FadeOutUp.duration(180)}
      style={[
        styles.toast,
        shadows.md,
        {
          backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
          borderRadius: radii.lg,
          borderColor: colors.border,
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginBottom: 8,
        },
      ]}
    >
      <Ionicons
        name={ICONS[toast.type] ?? ICONS.info}
        size={20}
        color={colorMap[toast.type]}
        style={{ marginRight: 10 }}
      />
      <Text
        style={{
          flex: 1,
          color: colors.text,
          fontSize: 14 * layout.fontScale,
          fontFamily: 'Inter_500Medium',
        }}
        onPress={onDismiss}
      >
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

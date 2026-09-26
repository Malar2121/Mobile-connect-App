import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { FamilyProvider } from './src/contexts/FamilyContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import { UIModeProvider, useUIMode } from './src/contexts/UIModeContext';
import { I18nProvider } from './src/i18n';
import { ToastProvider, DialogProvider, Loader } from './src/design-system';
import AppNavigator from './src/navigation/AppNavigator';

function ThemedStatusBar() {
  const { resolvedScheme } = useUIMode();
  return <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />;
}

// Keeps the UI mode in sync with the account's server-side member type:
// child accounts are locked into minor mode, elders default to elder mode.
function MemberTypeSync() {
  const { user, hydrated } = useAuth();
  const { applyAccount, ready } = useUIMode();
  const userId = user?._id ? String(user._id) : null;
  const memberType = user?.memberType ?? 'adult';
  const elderMode = user?.elderMode === true;

  // UIModeProvider sits above AuthProvider, so the signed-in account is handed to it here.
  // Runs on every sign-in, sign-out and account switch (not on unrelated profile edits).
  React.useEffect(() => {
    if (!ready || !hydrated) return;
    applyAccount(userId ? { id: userId, memberType, elderMode } : null);
  }, [ready, hydrated, userId, memberType, elderMode, applyAccount]);

  return null;
}

function AppRoot() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  if (!fontsLoaded && !fontError) {
    return <Loader fullScreen />;
  }

  if (fontError) {
    console.warn('Font load failed, using system fonts:', fontError);
  }

  return (
    <AuthProvider>
      <FamilyProvider>
        <MemberTypeSync />
        <ThemedStatusBar />
        <AppNavigator />
      </FamilyProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UIModeProvider>
          <I18nProvider>
            <ToastProvider>
              <DialogProvider>
                <NetworkProvider>
                  <AppRoot />
                </NetworkProvider>
              </DialogProvider>
            </ToastProvider>
          </I18nProvider>
        </UIModeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

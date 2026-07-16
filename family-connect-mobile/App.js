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
  const { user } = useAuth();
  const { applyMemberType, ready } = useUIMode();

  React.useEffect(() => {
    if (!ready || !user) return;
    applyMemberType(user.memberType ?? 'adult');
  }, [ready, user, applyMemberType]);

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

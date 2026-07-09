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
} from '@expo-google-fonts/inter';
import { AuthProvider } from './src/contexts/AuthContext';
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

function AppRoot() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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

import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useUIMode } from '../contexts/UIModeContext';
import { Loader } from '../components/Loader';
import { OfflineBanner } from '../components/OfflineBanner';
import { NotificationRegistrar } from '../components/NotificationRegistrar';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import ChildTabNavigator from './ChildTabNavigator';
import { navigationRef } from './navigationRef';

export default function AppNavigator() {
  const { hydrated, isAuthenticated } = useAuth();
  const { resolvedScheme, ready: uiReady, uiMode } = useUIMode();

  const navTheme = resolvedScheme === 'dark' ? DarkTheme : DefaultTheme;

  if (!hydrated || !uiReady) {
    return <Loader fullScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <OfflineBanner />
      {isAuthenticated ? (
        <NotificationRegistrar>
          {uiMode === 'minor' ? <ChildTabNavigator /> : <TabNavigator />}
        </NotificationRegistrar>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

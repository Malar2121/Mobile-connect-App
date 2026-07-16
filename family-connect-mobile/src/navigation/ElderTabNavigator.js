import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ElderDashboardScreen from '../screens/dashboard/ElderDashboardScreen';
import ChatNavigator from './ChatNavigator';
import MapNavigator from './MapNavigator';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CreateFamilyScreen from '../screens/profile/CreateFamilyScreen';
import JoinFamilyScreen from '../screens/profile/JoinFamilyScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';
import FamilyNavigator from './FamilyNavigator';
import { FloatingTabBar } from '../components/navigation/FloatingTabBar';
import { useTabConfig } from '../hooks/useTabConfig';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

// Same profile stack as the standard app so elders can still manage
// family, language, security and notifications.
function ElderProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="FamilyModule" component={FamilyNavigator} />
      <ProfileStack.Screen name="CreateFamily" component={CreateFamilyScreen} />
      <ProfileStack.Screen name="JoinFamily" component={JoinFamilyScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="Language" component={LanguageScreen} />
      <ProfileStack.Screen name="Security" component={SecurityScreen} />
    </ProfileStack.Navigator>
  );
}

/**
 * Elder mode navigation: only four large targets — Home, Chat, Map, Profile.
 * Events/Memories/Family-tree remain reachable through the profile hub,
 * keeping the tab bar uncluttered for elder users.
 */
function ElderTabNavigatorInner() {
  const tabConfig = useTabConfig();
  const tabLabels = Object.fromEntries(tabConfig.map((t) => [t.route, t.label]));
  const renderTabBar = useCallback((props) => <FloatingTabBar {...props} />, []);

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { paddingBottom: 88 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 88,
        },
      }}
    >
      <Tab.Screen name="Dashboard" component={ElderDashboardScreen} options={{ title: tabLabels.Dashboard }} />
      <Tab.Screen name="Chat" component={ChatNavigator} options={{ title: tabLabels.Chat }} />
      <Tab.Screen name="Map" component={MapNavigator} options={{ title: tabLabels.Map }} />
      <Tab.Screen name="Profile" component={ElderProfileNavigator} options={{ title: tabLabels.Profile }} />
    </Tab.Navigator>
  );
}

export default function ElderTabNavigator() {
  return <ElderTabNavigatorInner />;
}

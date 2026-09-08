import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChildDashboardScreen from '../screens/dashboard/ChildDashboardScreen';
import ChatNavigator from './ChatNavigator';
import MapNavigator from './MapNavigator';
import ProfileScreen from '../screens/profile/ProfileScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';
import SecurityScreen from '../screens/profile/SecurityScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import JoinFamilyScreen from '../screens/profile/JoinFamilyScreen';
import { FloatingTabBar } from '../components/navigation/FloatingTabBar';
import { useTabConfig } from '../hooks/useTabConfig';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

/**
 * A deliberately reduced profile stack for minors.
 *
 * A child previously had no Profile tab at all, which meant no way to change
 * language — a real problem in a trilingual app — or to see their own consent
 * status. This restores exactly those personal settings and nothing more.
 *
 * Deliberately absent, and not to be added without thought:
 *   FamilyModule      — family administration, invites, role and consent
 *                       management. A minor must never reach these.
 *   FamilyTreeModule  — relationship editing.
 *   CreateFamily      — creating a family makes the creator an admin, which
 *                       would let a minor escape the guardian model entirely.
 *
 * JoinFamily stays, because a minor who is not yet in a family needs a way in;
 * the backend still opens a guardian-approval request on their behalf.
 * Security stays because it only ever acts on the signed-in user's own account.
 */
function ChildProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Language" component={LanguageScreen} />
      <ProfileStack.Screen name="Security" component={SecurityScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="JoinFamily" component={JoinFamilyScreen} />
    </ProfileStack.Navigator>
  );
}

function ChildTabNavigatorInner() {
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
      <Tab.Screen name="Dashboard" component={ChildDashboardScreen} options={{ title: tabLabels.Dashboard }} />
      <Tab.Screen name="Chat" component={ChatNavigator} options={{ title: tabLabels.Chat }} />
      <Tab.Screen name="Map" component={MapNavigator} options={{ title: tabLabels.Map }} />
      <Tab.Screen name="Profile" component={ChildProfileNavigator} options={{ title: tabLabels.Profile }} />
    </Tab.Navigator>
  );
}

export default function ChildTabNavigator() {
  return <ChildTabNavigatorInner />;
}

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
import EventsNavigator from './EventsNavigator';
import MemoriesNavigator from './MemoriesNavigator';
import FamilyTreeNavigator from './FamilyTreeNavigator';
import { FloatingTabBar } from '../components/navigation/FloatingTabBar';
import { useTabConfig } from '../hooks/useTabConfig';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

/**
 * The same profile stack as the standard app, so elders can manage family,
 * language, security and notifications — and can reach Events, Memories and
 * the Family Tree.
 *
 * Those three modules were previously absent here while a comment claimed they
 * were reachable, which meant an elder could not open the celebration calendar
 * or the memory archive at all. The tab bar deliberately stays at four large
 * targets; the modules are reached from the elder dashboard's big action tiles.
 */
function ElderProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="FamilyModule" component={FamilyNavigator} />
      <ProfileStack.Screen name="EventsModule" component={EventsNavigator} />
      <ProfileStack.Screen name="MemoriesModule" component={MemoriesNavigator} />
      <ProfileStack.Screen name="FamilyTreeModule" component={FamilyTreeNavigator} />
      <ProfileStack.Screen name="CreateFamily" component={CreateFamilyScreen} />
      <ProfileStack.Screen name="JoinFamily" component={JoinFamilyScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="Language" component={LanguageScreen} />
      <ProfileStack.Screen name="Security" component={SecurityScreen} />
    </ProfileStack.Navigator>
  );
}

/**
 * Elder mode navigation: four large tab targets — Home, Chat, Map, Profile —
 * so the bar stays uncluttered and every target stays big enough to hit.
 *
 * Events, Celebrations, Memories and the Family Tree are reached from the
 * large action tiles on the elder dashboard, which route into the Profile
 * stack above.
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

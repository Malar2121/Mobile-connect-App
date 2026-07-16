import React, { useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ChildDashboardScreen from '../screens/dashboard/ChildDashboardScreen';
import ChatNavigator from './ChatNavigator';
import MapNavigator from './MapNavigator';
import { FloatingTabBar } from '../components/navigation/FloatingTabBar';
import { useTabConfig } from '../hooks/useTabConfig';

const Tab = createBottomTabNavigator();

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
    </Tab.Navigator>
  );
}

export default function ChildTabNavigator() {
  return <ChildTabNavigatorInner />;
}

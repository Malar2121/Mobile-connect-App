import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FamilyTreeHomeScreen from '../screens/family-tree/FamilyTreeHomeScreen';
import InteractiveTreeScreen from '../screens/family-tree/InteractiveTreeScreen';
import PersonProfileScreen from '../screens/family-tree/PersonProfileScreen';
import RelationshipEditorScreen from '../screens/family-tree/RelationshipEditorScreen';
import AncestorsScreen from '../screens/family-tree/AncestorsScreen';
import DescendantsScreen from '../screens/family-tree/DescendantsScreen';
import HeritageTimelineScreen from '../screens/family-tree/HeritageTimelineScreen';
import LegacyProfilesScreen from '../screens/family-tree/LegacyProfilesScreen';
import FamilyHistoryScreen from '../screens/family-tree/FamilyHistoryScreen';
import TreeSettingsScreen from '../screens/family-tree/TreeSettingsScreen';

const Stack = createNativeStackNavigator();

export default function FamilyTreeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamilyTreeHome" component={FamilyTreeHomeScreen} />
      <Stack.Screen name="InteractiveTree" component={InteractiveTreeScreen} />
      <Stack.Screen name="PersonProfile" component={PersonProfileScreen} />
      <Stack.Screen name="RelationshipEditor" component={RelationshipEditorScreen} />
      <Stack.Screen name="Ancestors" component={AncestorsScreen} />
      <Stack.Screen name="Descendants" component={DescendantsScreen} />
      <Stack.Screen name="HeritageTimeline" component={HeritageTimelineScreen} />
      <Stack.Screen name="LegacyProfiles" component={LegacyProfilesScreen} />
      <Stack.Screen name="FamilyHistory" component={FamilyHistoryScreen} />
      <Stack.Screen name="TreeSettings" component={TreeSettingsScreen} />
    </Stack.Navigator>
  );
}

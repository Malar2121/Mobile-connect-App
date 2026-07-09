import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FamilyHomeScreen from '../screens/family/FamilyHomeScreen';
import FamilyMembersScreen from '../screens/family/FamilyMembersScreen';
import MemberProfileScreen from '../screens/family/MemberProfileScreen';
import InviteMembersScreen from '../screens/family/InviteMembersScreen';
import JoinRequestsScreen from '../screens/family/JoinRequestsScreen';
import FamilyRolesScreen from '../screens/family/FamilyRolesScreen';
import FamilySettingsScreen from '../screens/family/FamilySettingsScreen';
import QRInviteScreen from '../screens/family/QRInviteScreen';
import RelationshipScreen from '../screens/family/RelationshipScreen';
import FamilyPermissionsScreen from '../screens/family/FamilyPermissionsScreen';
import CreateFamilyScreen from '../screens/profile/CreateFamilyScreen';
import JoinFamilyScreen from '../screens/profile/JoinFamilyScreen';

const Stack = createNativeStackNavigator();

export default function FamilyNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamilyHome" component={FamilyHomeScreen} />
      <Stack.Screen name="FamilyMembers" component={FamilyMembersScreen} />
      <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <Stack.Screen name="InviteMembers" component={InviteMembersScreen} />
      <Stack.Screen name="JoinRequests" component={JoinRequestsScreen} />
      <Stack.Screen name="FamilyRoles" component={FamilyRolesScreen} />
      <Stack.Screen name="FamilySettings" component={FamilySettingsScreen} />
      <Stack.Screen name="QRInvite" component={QRInviteScreen} />
      <Stack.Screen name="Relationship" component={RelationshipScreen} />
      <Stack.Screen name="FamilyPermissions" component={FamilyPermissionsScreen} />
      <Stack.Screen name="CreateFamily" component={CreateFamilyScreen} />
      <Stack.Screen name="JoinFamily" component={JoinFamilyScreen} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventsHomeScreen from '../screens/events/EventsHomeScreen';
import CalendarScreen from '../screens/events/CalendarScreen';
import AgendaScreen from '../screens/events/AgendaScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import EditEventScreen from '../screens/events/EditEventScreen';
import EventPollScreen from '../screens/events/EventPollScreen';
import RSVPManagementScreen from '../screens/events/RSVPManagementScreen';
import EventReminderScreen from '../screens/events/EventReminderScreen';
import EventAttachmentsScreen from '../screens/events/EventAttachmentsScreen';
import EventHistoryScreen from '../screens/events/EventHistoryScreen';
import EventsListScreen from '../screens/events/EventsListScreen';

const Stack = createNativeStackNavigator();

export default function EventsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsHome" component={EventsHomeScreen} />
      <Stack.Screen name="EventsList" component={EventsListScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Agenda" component={AgendaScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="EditEvent" component={EditEventScreen} />
      <Stack.Screen name="EventPoll" component={EventPollScreen} />
      <Stack.Screen name="RSVPManagement" component={RSVPManagementScreen} />
      <Stack.Screen name="EventReminders" component={EventReminderScreen} />
      <Stack.Screen name="EventAttachments" component={EventAttachmentsScreen} />
      <Stack.Screen name="EventHistory" component={EventHistoryScreen} />
    </Stack.Navigator>
  );
}

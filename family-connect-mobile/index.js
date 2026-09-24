import 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

import App from './App';

registerRootComponent(App);

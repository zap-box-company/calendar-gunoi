import { registerRootComponent } from 'expo';

import App from './App';
// Definește sarcina din fundal (verificarea de actualizări) – trebuie încărcată la pornire.
import './src/background';
import { registerWidget } from './src/widget';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Widgetul de pe ecranul principal (doar în APK; în Expo Go nu face nimic).
registerWidget();

import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

// Install the network guard before anything else so no module can make a
// remote request during startup. Oppuna is a fully offline application.
import '@/services/networkGuard';

import App from '@/app/App';

registerRootComponent(App);

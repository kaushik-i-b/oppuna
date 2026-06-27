import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppBootstrap } from '@/app/AppBootstrap';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { ToastProvider } from '@/components/feedback/ToastProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              <AppBootstrap>
                <RootNavigator />
              </AppBootstrap>
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

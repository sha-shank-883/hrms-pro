import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { AppConfigProvider } from './context/AppConfigContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppNavigator from './navigation/AppNavigator';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <AppConfigProvider>
              <ThemeProvider>
                <ChatProvider>
                  <AppNavigator />
                </ChatProvider>
              </ThemeProvider>
            </AppConfigProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}


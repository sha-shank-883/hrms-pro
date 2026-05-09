import 'react-native-gesture-handler';
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ChatProvider>
          <AppNavigator />
        </ChatProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { AppNavigator } from './navigation/AppNavigator';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#071224' }}>
        <StatusBar style="light" />
        <ErrorBoundary>
          <AuthProvider>
            <ProjectProvider>
              <AppNavigator />
            </ProjectProvider>
          </AuthProvider>
        </ErrorBoundary>
      </View>
    </SafeAreaProvider>
  );
}

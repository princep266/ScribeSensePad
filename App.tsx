import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <PaperProvider>
      <AppNavigator />
    </PaperProvider>
  </GestureHandlerRootView>
);

export default App;

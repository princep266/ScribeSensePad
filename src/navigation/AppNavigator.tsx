import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ServicesScreen from '../screens/ServicesScreen';
import TextToSpeechScreen from '../screens/TextToSpeechScreen';
import TranslationScreen from '../screens/TranslationScreen';
import SearchScreen from '../screens/SearchScreen';
// TranslationScreen import is commented out until the module is created
// import TranslationScreen from '../screens/TranslationScreen';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Settings: undefined;
  Services: undefined;
  TextToSpeech: { initialText?: string };
  Translation: { textToTranslate?: string };
  Search: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4a90e2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'ScribeSensePad',
          }}
        />
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen}
          options={{
            title: 'Scan Text',
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            title: 'Settings',
          }}
        />
        <Stack.Screen 
          name="Services" 
          component={ServicesScreen}
          options={{
            title: 'Services',
          }}
        />
        <Stack.Screen 
          name="TextToSpeech" 
          component={TextToSpeechScreen}
          options={{
            title: 'Text to Speech',
          }}
        />
        <Stack.Screen 
          name="Translation" 
          component={TranslationScreen}
          options={{
            title: 'Translation',
          }}
        />
        <Stack.Screen 
          name="Search" 
          component={SearchScreen}
          options={{
            title: 'Search',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

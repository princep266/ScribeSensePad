import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '../models/UserPreferences';

const PREFERENCES_KEY = '@user_preferences';

const defaultPreferences: UserPreferences = {
  enableTTS: true,
  textLanguage: 'en',
  textSimplification: true,
  darkMode: false,
  autoSave: true,
  fontSize: 'medium',
  vibrationFeedback: true,
  autoTranslate: false,
};

export const settingsService = {
  getPreferences: async (): Promise<UserPreferences> => {
    try {
      const storedPrefs = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (storedPrefs) {
        return { ...defaultPreferences, ...JSON.parse(storedPrefs) };
      }
      return defaultPreferences;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return defaultPreferences;
    }
  },

  savePreferences: async (preferences: UserPreferences): Promise<void> => {
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  },

  resetPreferences: async (): Promise<UserPreferences> => {
    try {
      await AsyncStorage.removeItem(PREFERENCES_KEY);
      return defaultPreferences;
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  }
};

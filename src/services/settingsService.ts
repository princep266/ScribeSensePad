import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '../models/UserPreferences';

const SETTINGS_KEY = 'user_preferences';

class SettingsService {
  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }

  async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : { 
        enableTTS: true, 
        textLanguage: 'en', 
        textSimplification: true 
      };
    } catch (error) {
      console.error('Error getting preferences:', error);
      return { 
        darkMode: false,
        autoSave: true,
        fontSize: 'medium',
        vibrationFeedback: true,
        autoTranslate: false,
        enableTTS: true, 
        textLanguage: 'en', 
        textSimplification: true 
      };
    }
  }

  async updatePreference(key: keyof UserPreferences, value: any): Promise<void> {
    try {
      const currentPrefs = await this.getPreferences();
      const newPrefs = { ...currentPrefs, [key]: value };
      await this.savePreferences(newPrefs);
    } catch (error) {
      console.error('Error updating preference:', error);
      throw error;
    }
  }

  async resetPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Vibration } from 'react-native';
import { Surface, Switch, Button, Text, useTheme, SegmentedButtons } from 'react-native-paper';
import { settingsService } from '../services/settingsService';
import { UserPreferences } from '../models/UserPreferences';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Tts from 'react-native-tts';
import { EventRegister } from 'react-native-event-listeners';

type SettingType = 'switch' | 'segment' | 'button';

interface SettingItem {
  title: string;
  description: string;
  type: SettingType;
  icon: string;
  color: string;
  key: keyof UserPreferences;
  options?: Array<{ label: string; value: string }>;
}

interface SettingsGroup {
  [key: string]: SettingItem[];
}

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>({
    enableTTS: true,
    textLanguage: 'en',
    textSimplification: true,
    darkMode: false,
    autoSave: true,
    fontSize: 'medium',
    vibrationFeedback: true,
    autoTranslate: false,
  });

  const settingsGroups: SettingsGroup = {
    accessibility: [
      {
        title: 'Text-to-Speech',
        description: 'Enable voice output for recognized text',
        type: 'switch' as const,
        icon: 'text-to-speech',
        color: '#4a90e2',
        key: 'enableTTS',
      },
      {
        title: 'Text Simplification',
        description: 'Simplify complex text for easier reading',
        type: 'switch' as const,
        icon: 'format-text',
        color: '#50c878',
        key: 'textSimplification',
      },
      {
        title: 'Font Size',
        description: 'Adjust text size for better readability',
        type: 'segment' as const,
        icon: 'format-size',
        color: '#f39c12',
        key: 'fontSize',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
    ],
    general: [
      {
        title: 'Dark Mode',
        description: 'Switch between light and dark theme',
        type: 'switch' as const,
        icon: 'theme-light-dark',
        color: '#9c27b0',
        key: 'darkMode',
      },
      {
        title: 'Auto Save',
        description: 'Automatically save scanned text',
        type: 'switch' as const,
        icon: 'content-save-outline',
        color: '#2196f3',
        key: 'autoSave',
      },
      {
        title: 'Vibration Feedback',
        description: 'Enable haptic feedback for actions',
        type: 'switch' as const,
        icon: 'vibrate',
        color: '#ff5722',
        key: 'vibrationFeedback',
      },
    ],
    language: [
      {
        title: 'Text Language',
        description: 'Set default language for text recognition',
        type: 'segment' as const,
        icon: 'translate',
        color: '#4caf50',
        key: 'textLanguage',
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
        ],
      },
      {
        title: 'Auto Translate',
        description: 'Automatically translate detected text',
        type: 'switch' as const,
        icon: 'auto-fix',
        color: '#795548',
        key: 'autoTranslate',
      },
    ],
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const storedPrefs = await settingsService.getPreferences();
      if (storedPrefs) {
        setPreferences(storedPrefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const updatePreferences = async (key: keyof UserPreferences, value: any) => {
    try {
      const newPrefs = { ...preferences, [key]: value };
      setPreferences(newPrefs);
      await settingsService.savePreferences(newPrefs);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const renderSettingItem = (item: SettingItem) => (
    <Surface key={item.key} style={styles.settingCard} elevation={1}>
      <View style={styles.settingContent}>
        <View style={styles.settingHeader}>
          <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
            <Icon name={item.icon} size={24} color="#fff" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingDescription}>{item.description}</Text>
          </View>
        </View>
        <View style={styles.controlContainer}>
          {item.type === 'switch' && (
            <Switch
              value={preferences[item.key] as boolean}
              onValueChange={(value) => updatePreferences(item.key, value)}
            />
          )}
          {item.type === 'segment' && item.options && (
            <SegmentedButtons
              value={preferences[item.key] as string}
              onValueChange={(value) => updatePreferences(item.key, value)}
              buttons={item.options}
              style={styles.segmentedButton}
            />
          )}
        </View>
      </View>
    </Surface>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.headerContainer} elevation={4}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>
      </Surface>

      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Accessibility</Text>
        {settingsGroups.accessibility.map((item) => renderSettingItem(item))}

        <Text style={styles.sectionTitle}>General</Text>
        {settingsGroups.general.map((item) => renderSettingItem(item))}

        <Text style={styles.sectionTitle}>Language</Text>
        {settingsGroups.language.map((item) => renderSettingItem(item))}

        <Button
          mode="contained"
          onPress={loadPreferences}
          style={styles.resetButton}
          icon="refresh"
        >
          Reset to Defaults
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    paddingBottom: 30,
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#000',
    letterSpacing: 0.25,
  },
  settingsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    marginTop: 24,
    letterSpacing: 0.25,
  },
  settingCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  settingContent: {
    padding: 16,
    flexDirection: 'column',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  controlContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  segmentedButton: {
    backgroundColor: '#f5f5f5',
  },
  resetButton: {
    marginTop: 32,
    marginBottom: 24,
    backgroundColor: '#dc3545',
  },
});

export default SettingsScreen;

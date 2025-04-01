import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { TextInput, Button, Text, Surface, useTheme } from 'react-native-paper';
import Tts from 'react-native-tts';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface TextToSpeechScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TextToSpeech'>;
  route: RouteProp<RootStackParamList, 'TextToSpeech'>;
}

const TextToSpeechScreen: React.FC<TextToSpeechScreenProps> = ({ route, navigation }) => {
  const theme = useTheme();
  const [text, setText] = useState(route.params?.initialText || '');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isMounted = useRef(true);
  const ttsEvents = useRef<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const initTts = async () => {
      if (!mounted) return;

      try {
        await Tts.getInitStatus();
        await Tts.setDefaultLanguage('en');
        await Tts.setDefaultRate(0.5);
        if (mounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        console.warn('TTS initialization failed:', err);
      }
    };

    initTts();

    return () => {
      mounted = false;
      if (ttsEvents.current.length > 0) {
        ttsEvents.current.forEach(subscription => {
          if (subscription?.remove) {
            subscription.remove();
          }
        });
        ttsEvents.current = [];
      }
      Tts.stop();
    };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    // Event handler functions
    const startHandler = () => {
      if (isMounted.current) setIsSpeaking(true);
    };
    const finishHandler = () => {
      if (isMounted.current) setIsSpeaking(false);
    };
    const cancelHandler = () => {
      if (isMounted.current) setIsSpeaking(false);
    };
    const errorHandler = (event: any) => {
      if (isMounted.current) {
        console.error('TTS error:', event);
        setIsSpeaking(false);
      }
    };

    // Store event subscriptions
    const subscriptions = [
      Tts.addEventListener('tts-start', startHandler),
      Tts.addEventListener('tts-finish', finishHandler),
      Tts.addEventListener('tts-cancel', cancelHandler),
      Tts.addEventListener('tts-error', errorHandler)
    ];

    ttsEvents.current = subscriptions;

    return () => {
      if (ttsEvents.current.length > 0) {
        ttsEvents.current.forEach(subscription => {
          if (subscription?.remove) {
            subscription.remove();
          }
        });
        ttsEvents.current = [];
      }
    };
  }, [isInitialized]);

  const handleSpeak = async () => {
    if (!text.trim() || !isInitialized) return;
    
    try {
      if (isSpeaking) {
        await Tts.stop();
      } else {
        await Tts.speak(text);
      }
    } catch (error) {
      console.error('Error speaking text:', error);
      if (isMounted.current) setIsSpeaking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Surface style={styles.header} elevation={2}>
        <Text style={styles.headerTitle}>Text to Speech</Text>
        <Text style={styles.headerSubtitle}>Convert your text into spoken words</Text>
      </Surface>

      <ScrollView style={styles.scrollView}>
        <Surface style={styles.contentContainer} elevation={2}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter text to speak</Text>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={6}
              style={styles.input}
              placeholder="Type your text here..."
              placeholderTextColor="#9e9e9e"
              mode="outlined"
              outlineColor="#e0e0e0"
              activeOutlineColor={theme.colors.primary}
              textColor="#000000"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSpeak}
              disabled={!text.trim() || !isInitialized}
              style={[styles.button, isSpeaking && styles.stopButton]}
              contentStyle={styles.buttonContent}
              icon={({ size, color }) => (
                <Icon 
                  name={isSpeaking ? "stop-circle" : "volume-high"} 
                  size={24} 
                  color={color} 
                />
              )}
            >
              {isSpeaking ? 'Stop' : 'Speak'}
            </Button>
          </View>

          {!text.trim() && (
            <Surface style={styles.placeholderContainer} elevation={1}>
              <Icon name="text-to-speech" size={32} color="#9e9e9e" />
              <Text style={styles.placeholderText}>Enter text to begin speaking</Text>
              <Text style={styles.helperText}>Type or paste your text in the input field above</Text>
            </Surface>
          )}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
    backgroundColor: '#4CAF50',
  },
  buttonContent: {
    height: 48,
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  placeholderContainer: {
    backgroundColor: '#f5f5f5',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9e9e9e',
    marginTop: 12,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#bdbdbd',
    textAlign: 'center',
  },
});

export default TextToSpeechScreen; 
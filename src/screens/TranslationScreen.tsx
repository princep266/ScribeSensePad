import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Dimensions, Share, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Surface, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';

interface TranslationScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Translation'>;
  route: RouteProp<RootStackParamList, 'Translation'>;
}

const GEMINI_API_KEY = 'AIzaSyDAOytJN5Kzm8VrKxo5KzITK1Plf2XN9ko';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface SpeechResultsEvent {
  value?: string[];
}

interface SpeechErrorEvent {
  error?: {
    code?: string;
    message?: string;
  };
}

const TranslationScreen: React.FC<TranslationScreenProps> = ({ route, navigation }) => {
  const theme = useTheme();
  const [sourceText, setSourceText] = useState(route.params?.textToTranslate || '');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('hi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [showTtsOptions, setShowTtsOptions] = useState(false);

  const languages = [
    { value: 'hi', label: 'Hindi', icon: 'translate' },
    { value: 'en', label: 'English', icon: 'translate' },
    { value: 'es', label: 'Spanish', icon: 'translate' },
    { value: 'fr', label: 'French', icon: 'translate' },
    { value: 'de', label: 'German', icon: 'translate' },
    { value: 'it', label: 'Italian', icon: 'translate' },
    { value: 'pt', label: 'Portuguese', icon: 'translate' },
    { value: 'ru', label: 'Russian', icon: 'translate' },
    { value: 'ja', label: 'Japanese', icon: 'translate' },
    { value: 'ko', label: 'Korean', icon: 'translate' },
  ];

  useEffect(() => {
    // Initialize TTS
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(ttsSpeed);
    Tts.setDefaultPitch(ttsPitch);
    
    Tts.addEventListener('tts-start', () => setIsSpeaking(true));
    Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
    Tts.addEventListener('tts-cancel', () => setIsSpeaking(false));

    // Initialize Voice
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value) {
        setSourceText(e.value[0]);
      }
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error('Voice error:', e);
      setError('Voice input failed. Please try again.');
    };

    return () => {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [ttsSpeed, ttsPitch]);

  const handleSpeak = async (text: string) => {
    if (isSpeaking) {
      await Tts.stop();
    } else {
      await Tts.setDefaultRate(ttsSpeed);
      await Tts.setDefaultPitch(ttsPitch);
      await Tts.speak(text);
    }
  };

  const startVoiceInput = async () => {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Voice input error:', error);
      setError('Failed to start voice input. Please try again.');
    }
  };

  const stopVoiceInput = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Voice input error:', error);
    }
  };

  const translateText = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    setError('');

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following text to ${languages.find(lang => lang.value === targetLanguage)?.label || targetLanguage}. 
              Provide only the translation without any additional text or explanations:
              
              "${sourceText}"`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Translation failed');
      }

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        setTranslatedText(data.candidates[0].content.parts[0].text.trim());
      } else {
        throw new Error('No translation received');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setError('Translation failed. Please try again.');
      setTranslatedText('');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${sourceText}\n\n${translatedText}`,
        title: 'Translation',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  useEffect(() => {
    if (sourceText && targetLanguage) {
      translateText();
    }
  }, [targetLanguage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Surface style={styles.header} elevation={4}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Icon name="translate" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>AI Translation</Text>
            <Text style={styles.headerSubtitle}>Powered by Gemini AI</Text>
          </View>
        </View>
      </Surface>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Surface style={styles.inputCard} elevation={2}>
            <View style={styles.inputHeader}>
              <Icon name="text-box" size={24} color={theme.colors.primary} />
              <Text style={styles.inputLabel}>Enter text to translate</Text>
              <View style={styles.inputActions}>
                <IconButton
                  icon={isListening ? "microphone-off" : "microphone"}
                  size={24}
                  onPress={isListening ? stopVoiceInput : startVoiceInput}
                  style={styles.actionButton}
                  iconColor={isListening ? theme.colors.primary : '#666'}
                />
              </View>
            </View>
            <TextInput
              value={sourceText}
              onChangeText={setSourceText}
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Type or paste text here..."
              placeholderTextColor="#9e9e9e"
              mode="outlined"
              outlineColor="#e0e0e0"
              activeOutlineColor={theme.colors.primary}
            />
          </Surface>

          <Surface style={styles.languageCard} elevation={2}>
            <View style={styles.languageHeader}>
              <Icon name="earth" size={24} color={theme.colors.primary} />
              <Text style={styles.languageLabel}>Select Language</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.languageScrollView}
              contentContainerStyle={styles.languageScrollContent}
            >
              <SegmentedButtons
                value={targetLanguage}
                onValueChange={setTargetLanguage}
                buttons={languages.map(lang => ({
                  value: lang.value,
                  label: lang.label,
                  style: styles.segmentButton,
                }))}
                style={styles.languageButtons}
              />
            </ScrollView>
          </Surface>

          {isTranslating ? (
            <Surface style={styles.loadingCard} elevation={2}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Translating with Gemini AI...</Text>
              <Text style={styles.loadingSubtext}>This may take a few moments</Text>
            </Surface>
          ) : error ? (
            <Surface style={styles.errorCard} elevation={2}>
              <Icon name="alert-circle" size={48} color="#f44336" />
              <Text style={styles.errorText}>{error}</Text>
              <Button
                mode="contained"
                onPress={translateText}
                style={styles.retryButton}
                icon="refresh"
                contentStyle={styles.retryButtonContent}
              >
                Try Again
              </Button>
            </Surface>
          ) : translatedText ? (
            <Surface style={styles.resultCard} elevation={2}>
              <View style={styles.resultHeader}>
                <View style={styles.resultTitleContainer}>
                  <Icon name="check-circle" size={24} color="#4CAF50" />
                  <Text style={styles.resultLabel}>Translation Result</Text>
                </View>
                <View style={styles.resultActions}>
                  <IconButton
                    icon={isSpeaking ? "volume-high" : "volume-medium"}
                    size={24}
                    onPress={() => handleSpeak(translatedText)}
                    style={styles.actionButton}
                    iconColor={isSpeaking ? theme.colors.primary : '#666'}
                  />
                  <Button
                    mode="contained"
                    onPress={handleShare}
                    icon="share"
                    style={styles.shareButton}
                    contentStyle={styles.shareButtonContent}
                  >
                    Share
                  </Button>
                </View>
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.translatedText}>{translatedText}</Text>
              </View>
              <View style={styles.ttsOptionsContainer}>
                <View style={styles.ttsOptionsHeader}>
                  <Text style={styles.ttsOptionsLabel}>TTS Options</Text>
                  <IconButton
                    icon={showTtsOptions ? "chevron-up" : "chevron-down"}
                    size={24}
                    onPress={() => setShowTtsOptions(!showTtsOptions)}
                    style={styles.toggleButton}
                  />
                </View>
                {showTtsOptions && (
                  <View style={styles.ttsOptionsContent}>
                    <View style={styles.ttsOption}>
                      <Text style={styles.ttsOptionLabel}>Speed</Text>
                      <SegmentedButtons
                        value={ttsSpeed.toString()}
                        onValueChange={value => setTtsSpeed(parseFloat(value))}
                        buttons={[
                          { value: '0.5', label: '0.5x' },
                          { value: '0.75', label: '0.75x' },
                          { value: '1.0', label: 'Normal' },
                          { value: '1.25', label: '1.25x' },
                          { value: '1.5', label: '1.5x' },
                        ]}
                        style={styles.segmentedButtons}
                      />
                    </View>
                    <View style={styles.ttsOption}>
                      <Text style={styles.ttsOptionLabel}>Pitch</Text>
                      <SegmentedButtons
                        value={ttsPitch.toString()}
                        onValueChange={value => setTtsPitch(parseFloat(value))}
                        buttons={[
                          { value: '0.8', label: 'Low' },
                          { value: '1.0', label: 'Normal' },
                          { value: '1.2', label: 'High' },
                        ]}
                        style={styles.segmentedButtons}
                      />
                    </View>
                  </View>
                )}
              </View>
            </Surface>
          ) : (
            <Surface style={styles.placeholderCard} elevation={2}>
              <Icon name="translate" size={64} color={theme.colors.primary} />
              <Text style={styles.placeholderText}>Translation will appear here</Text>
              <Text style={styles.helperText}>Enter text and select a language to translate</Text>
              <View style={styles.placeholderExamples}>
                <Text style={styles.exampleText}>• "Hello, how are you?"</Text>
                <Text style={styles.exampleText}>• "I love learning new languages"</Text>
                <Text style={styles.exampleText}>• "What's the weather like today?"</Text>
              </View>
            </Surface>
          )}
        </View>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
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
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  inputCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#fff',
    fontSize: 16,
  },
  languageCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  languageScrollView: {
    flexGrow: 1,
  },
  languageScrollContent: {
    paddingRight: 16,
  },
  languageButtons: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  segmentButton: {
    borderRadius: 8,
  },
  loadingCard: {
    padding: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  errorCard: {
    padding: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    borderRadius: 12,
    backgroundColor: '#f44336',
  },
  retryButtonContent: {
    height: 48,
  },
  resultCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  resultContent: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  translatedText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  shareButton: {
    borderRadius: 12,
    backgroundColor: '#4CAF50',
  },
  shareButtonContent: {
    height: 40,
  },
  placeholderCard: {
    padding: 40,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 24,
    fontSize: 20,
    color: '#1a1a1a',
    textAlign: 'center',
    fontWeight: '600',
  },
  helperText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  placeholderExamples: {
    marginTop: 24,
    width: '100%',
  },
  exampleText: {
    fontSize: 14,
    color: '#888',
    marginVertical: 4,
    textAlign: 'center',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  actionButton: {
    margin: 0,
  },
  resultActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ttsOptionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  ttsOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ttsOptionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  ttsOptionsContent: {
    padding: 8,
  },
  ttsOption: {
    marginBottom: 12,
  },
  ttsOptionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  toggleButton: {
    margin: 0,
  },
  segmentedButtons: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
});

export default TranslationScreen; 
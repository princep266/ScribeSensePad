import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Image, Share, Dimensions, Pressable } from 'react-native';
import { Searchbar, Text, Surface, Card, useTheme, Button, IconButton, SegmentedButtons, Menu, Provider } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Tts from 'react-native-tts';
import { Picker } from '@react-native-picker/picker';

interface SearchScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Search'>;
}

interface SearchResult {
  title: string;
  snippet: string;
  link?: string;
  imageUrl?: string;
}

const GEMINI_API_KEY = 'AIzaSyDAOytJN5Kzm8VrKxo5KzITK1Plf2XN9ko';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GOOGLE_SEARCH_API_KEY = 'AIzaSyDAOytJN5Kzm8VrKxo5KzITK1Plf2XN9ko';
const GOOGLE_SEARCH_CX = 'f1fb9fdaac03649c7';

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Language Options
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  
  // TTS Options
  const [ttsSpeed, setTtsSpeed] = useState(0.5);
  const [ttsPitch, setTtsPitch] = useState(1.0);
  const [ttsVoice, setTtsVoice] = useState('en-US');
  const [showTtsOptions, setShowTtsOptions] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<string[]>([]);
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  const [ttsSpeedMenuVisible, setTtsSpeedMenuVisible] = useState(false);
  const [ttsPitchMenuVisible, setTtsPitchMenuVisible] = useState(false);

  const languages = [
    { code: 'en', name: 'English', ttsCode: 'en-US', placeholder: 'Ask anything...' },
    { code: 'hi', name: 'हिंदी', ttsCode: 'hi-IN', placeholder: 'कुछ भी पूछें...' },
    { code: 'es', name: 'Español', ttsCode: 'es-ES', placeholder: 'Pregunta algo...' },
    { code: 'fr', name: 'Français', ttsCode: 'fr-FR', placeholder: 'Posez une question...' },
    { code: 'de', name: 'Deutsch', ttsCode: 'de-DE', placeholder: 'Fragen Sie etwas...' },
    { code: 'it', name: 'Italiano', ttsCode: 'it-IT', placeholder: 'Chiedi qualcosa...' },
    { code: 'pt', name: 'Português', ttsCode: 'pt-PT', placeholder: 'Pergunte algo...' },
    { code: 'ru', name: 'Русский', ttsCode: 'ru-RU', placeholder: 'Спросите что-нибудь...' },
    { code: 'ja', name: '日本語', ttsCode: 'ja-JP', placeholder: '何でも聞いてください...' },
    { code: 'ko', name: '한국어', ttsCode: 'ko-KR', placeholder: '무엇이든 물어보세요...' },
    { code: 'zh', name: '中文', ttsCode: 'zh-CN', placeholder: '问任何问题...' },
  ];

  useEffect(() => {
    const initializeTTS = async () => {
      try {
        const currentLanguage = languages.find(lang => lang.code === selectedLanguage);
        await Tts.setDefaultLanguage(currentLanguage?.ttsCode || 'en-US');
        await Tts.setDefaultRate(ttsSpeed);
        await Tts.setDefaultPitch(ttsPitch);
        
        const voices = await Tts.voices();
        const languageVoices = voices
          .filter(voice => voice.language.startsWith(selectedLanguage))
        .map(voice => voice.id);
        setAvailableVoices(languageVoices);

    Tts.addEventListener('tts-start', () => setIsSpeaking(true));
    Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
    Tts.addEventListener('tts-cancel', () => setIsSpeaking(false));
        Tts.addEventListener('tts-error', (error) => {
          console.error('TTS Error:', error);
          setError('Text-to-speech error occurred. Please try again.');
        });
      } catch (error) {
        console.error('TTS initialization error:', error);
        setError('Failed to initialize text-to-speech');
      }
    };

    initializeTTS();

    return () => {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      Tts.removeAllListeners('tts-error');
    };
  }, [selectedLanguage, ttsSpeed, ttsPitch]);

  const fetchImages = async (query: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_CX}&q=${encodeURIComponent(query)}&searchType=image&num=5`
      );
      const data = await response.json();
      return data.items?.map((item: any) => item.link) || [];
    } catch (error) {
      console.error('Image search error:', error);
      return [];
    }
  };

  type SupportedLanguage = 'en' | 'hi' | 'es' | 'fr' | 'de';

  const getPromptInLanguage = (query: string, lang: string): string => {
    const prompts: Record<SupportedLanguage, string> = {
      'en': `Provide comprehensive information about: ${query}

Please structure the response in the following format:
1. Brief Overview (2-3 sentences)
2. Key Details (main points and facts)
3. Additional Information (interesting related facts)
4. Related Topics (if applicable)

Make the response detailed but easy to understand.`,
      'hi': `कृपया इस विषय के बारे में विस्तृत जानकारी प्रदान करें: ${query}

कृपया उत्तर को निम्नलिखित प्रारूप में संरचित करें:
1. संक्षिप्त अवलोकन (2-3 वाक्य)
2. मुख्य विवरण (प्रमुख बिंदु और तथ्य)
3. अतिरिक्त जानकारी (दिलचस्प संबंधित तथ्य)
4. संबंधित विषय (यदि लागू हो)

उत्तर को विस्तृत लेकिन समझने में आसान बनाएं।`,
      'es': `Proporcione información completa sobre: ${query}

Por favor, estructure la respuesta en el siguiente formato:
1. Descripción General (2-3 oraciones)
2. Detalles Clave (puntos principales y hechos)
3. Información Adicional (hechos interesantes relacionados)
4. Temas Relacionados (si aplica)

Haga la respuesta detallada pero fácil de entender.`,
      'fr': `Fournissez des informations complètes sur : ${query}

Veuillez structurer la réponse dans le format suivant :
1. Aperçu Bref (2-3 phrases)
2. Détails Clés (points principaux et faits)
3. Informations Supplémentaires (faits intéressants connexes)
4. Sujets Connexes (si applicable)

Rendez la réponse détaillée mais facile à comprendre.`,
      'de': `Geben Sie umfassende Informationen über: ${query}

Bitte strukturieren Sie die Antwort im folgenden Format:
1. Kurzer Überblick (2-3 Sätze)
2. Wichtige Details (Hauptpunkte und Fakten)
3. Zusätzliche Informationen (interessante verwandte Fakten)
4. Verwandte Themen (falls zutreffend)

Machen Sie die Antwort detailliert, aber leicht verständlich.`,
    };
    return prompts[lang as SupportedLanguage] || prompts['en'];
  };

  const getDefaultTitle = (index: number): string => {
    const titles: Record<SupportedLanguage, [string, string]> = {
      'en': ['Overview', 'Additional Information'],
      'hi': ['अवलोकन', 'अतिरिक्त जानकारी'],
      'es': ['Descripción General', 'Información Adicional'],
      'fr': ['Aperçu', 'Informations Supplémentaires'],
      'de': ['Überblick', 'Zusätzliche Informationen'],
    };
    return (titles[selectedLanguage as SupportedLanguage] || titles['en'])[index === 0 ? 0 : 1];
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const currentLanguage = languages.find(lang => lang.code === selectedLanguage);
      const [textResponse, imageUrls] = await Promise.all([
        fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: getPromptInLanguage(searchQuery, selectedLanguage)
              }]
            }],
            safetySettings: [{
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          })
        }),
        fetchImages(searchQuery)
      ]);

      const data = await textResponse.json();
      
      if (!textResponse.ok) {
        console.error('API Error:', data);
        const errorMessage = selectedLanguage === 'hi' 
          ? 'त्रुटि: कृपया बाद में पुनः प्रयास करें'
          : `Error: ${data.error?.message || 'Failed to fetch results'}`;
        setError(errorMessage);
        return;
      }

      if (data.error) {
        console.error('API Response Error:', data.error);
        const errorMessage = selectedLanguage === 'hi'
          ? 'एक अज्ञात त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : `Error: ${data.error.message || 'Unknown error occurred'}`;
        setError(errorMessage);
        return;
      }

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Unexpected API response format:', data);
        const errorMessage = selectedLanguage === 'hi'
          ? 'अप्रत्याशित प्रतिक्रिया प्रारूप। कृपया पुनः प्रयास करें।'
          : 'Received unexpected response format. Please try again.';
        setError(errorMessage);
        return;
      }

      const content = data.candidates[0].content.parts[0].text;
      
      // Split the content into sections based on language-specific markers
      let sections: string[];
      if (selectedLanguage === 'hi') {
        // Hindi-specific section splitting
        sections = content.split(/(?=१\.|२\.|३\.|४\.|संबंधित विषय:)/).filter(Boolean);
      } else {
        // Other languages section splitting
        sections = content.split(/(?=\d+\.|Related Topics:|Temas Relacionados:|Sujets Connexes:|Verwandte Themen:)/).filter(Boolean);
      }
      
      if (sections.length === 0) {
        const errorMessage = selectedLanguage === 'hi'
          ? 'कोई परिणाम नहीं मिला। कृपया कोई अन्य खोज शब्द आज़माएं।'
          : 'No results found. Please try a different search term.';
        setError(errorMessage);
        return;
      }

      const formattedResults: SearchResult[] = sections.map((section: string, index: number) => {
        let title: string;
        let snippet: string;

        if (selectedLanguage === 'hi') {
          // Hindi-specific title and snippet extraction
          const titleMatch = section.match(/^(१\.|२\.|३\.|४\.|संबंधित विषय:)(.*?)(?=\n|$)/);
          title = titleMatch 
            ? titleMatch[2].trim()
            : getDefaultTitle(index);
          
          snippet = section
            .replace(/^(१\.|२\.|३\.|४\.|संबंधित विषय:)(.*?)(?=\n|$)/, '')
            .trim()
            .replace(/[^\u0900-\u097F\s.,!?।॥]/g, '') // Only allow Hindi characters and basic punctuation
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ');
        } else {
          // Other languages title and snippet extraction
          const titleMatch = section.match(/^(\d+\.|Related Topics:|Temas Relacionados:|Sujets Connexes:|Verwandte Themen:)(.*?)(?=\n|$)/);
          title = titleMatch 
            ? titleMatch[2].trim()
          .replace(/[^\w\s\u0591-\u05F4\u0600-\u06FF\u0750-\u077F]/g, '')
            : getDefaultTitle(index);
          
          snippet = section
            .replace(/^(\d+\.|Related Topics:|Temas Relacionados:|Sujets Connexes:|Verwandte Themen:)(.*?)(?=\n|$)/, '')
          .trim()
            .replace(/[^\w\s.,!?-\u0591-\u05F4\u0600-\u06FF\u0750-\u077F]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ');
        }
        
        return {
          title: title,
          snippet: snippet,
          imageUrl: imageUrls[index] || undefined
        };
      });

      setResults(formattedResults);
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = selectedLanguage === 'hi'
        ? 'नेटवर्क त्रुटि या अमान्य API प्रतिक्रिया। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।'
        : 'Network error or invalid API response. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) {
      await Tts.stop();
    } else {
      await Tts.setDefaultRate(ttsSpeed);
      await Tts.setDefaultPitch(ttsPitch);
      await Tts.speak(text);
    }
  };

  const handleShare = async (result: SearchResult) => {
    try {
      const shareText = `${result.title}\n\n${result.snippet}`;
      await Share.share({
        message: shareText,
        title: result.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareAll = async () => {
    try {
      const shareText = results
        .map(result => `${result.title}\n${result.snippet}\n`)
        .join('\n');
      await Share.share({
        message: shareText,
        title: `Search Results: ${searchQuery}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    header: {
      padding: 24,
      backgroundColor: theme.colors.primary,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      elevation: 8,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      marginRight: 16,
    },
    headerTextContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      letterSpacing: 0.5,
    },
    searchContainer: {
      padding: 20,
      marginTop: -30,
      backgroundColor: 'transparent',
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 20,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    searchBar: {
      flex: 1,
      backgroundColor: 'transparent',
      elevation: 0,
      borderRadius: 20,
      height: 60,
    },
    searchInput: {
      fontSize: 18,
      color: '#1a1a1a',
    },
    controlsContainer: {
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 16,
      elevation: 4,
      gap: 12,
    },
    controlItem: {
      flex: 1,
    },
    controlHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    controlTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: 8,
    },
    controlPicker: {
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderRadius: 12,
      height: 48,
    },
    ttsControls: {
      gap: 8,
    },
    segmentedButtons: {
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderRadius: 12,
      padding: 2,
    },
    resultCard: {
      marginBottom: 16,
      borderRadius: 20,
      backgroundColor: '#fff',
      elevation: 4,
      overflow: 'hidden',
      width: '100%',
    },
    primaryResultCard: {
      backgroundColor: '#f8f9ff',
      borderWidth: 2,
      borderColor: `${theme.colors.primary}20`,
    },
    resultTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 4,
      width: '100%',
    },
    resultTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.primary,
      flex: 1,
      flexWrap: 'wrap',
    },
    resultSnippet: {
      fontSize: 16,
      color: '#333',
      lineHeight: 26,
      letterSpacing: 0.3,
      flexWrap: 'wrap',
      width: '100%',
    },
    imageContainer: {
      marginVertical: 16,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 2,
    },
    resultImage: {
      width: '100%',
      height: 220,
      backgroundColor: '#f5f5f5',
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderRadius: 12,
      padding: 4,
    },
    actionButton: {
      margin: 0,
    },
    scrollView: {
      flex: 1,
      width: '100%',
    },
    content: {
      padding: 20,
      flexGrow: 1,
    },
    loadingContainer: {
      padding: 32,
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
    errorContainer: {
      padding: 32,
      borderRadius: 20,
      alignItems: 'center',
      backgroundColor: '#fff',
      elevation: 4,
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
      marginTop: 8,
      borderRadius: 16,
    },
    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    resultCount: {
      fontSize: 14,
      color: '#666',
      marginBottom: 16,
      textAlign: 'center',
      fontWeight: '500',
    },
    shareAllButton: {
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    titleLeftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      flexWrap: 'wrap',
    },
    resultIcon: {
      marginRight: 12,
    },
    highlightedText: {
      fontWeight: '600',
      color: theme.colors.primary,
    },
    normalText: {
      color: '#333',
    },
    poweredByContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      marginBottom: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: 12,
      borderRadius: 16,
    },
    poweredBy: {
      marginLeft: 8,
      color: '#666',
      fontSize: 14,
      letterSpacing: 0.5,
    },
    placeholderContainer: {
      padding: 40,
      borderRadius: 24,
      alignItems: 'center',
      backgroundColor: '#fff',
      elevation: 4,
      margin: 20,
    },
    placeholderText: {
      marginTop: 24,
      fontSize: 22,
      color: theme.colors.primary,
      textAlign: 'center',
      fontWeight: '600',
    },
    helperText: {
      marginTop: 16,
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
    dropdownButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderRadius: 12,
      padding: 12,
    },
    dropdownContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownText: {
      fontSize: 16,
      color: '#333',
      marginHorizontal: 8,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Surface style={styles.header} elevation={4}>
        <View style={styles.headerContent}>
          <Icon name="translate" size={36} color="#fff" style={styles.headerIcon} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Multilingual AI Search</Text>
            <Text style={styles.headerSubtitle}>Powered by AI</Text>
          </View>
        </View>
      </Surface>

      <View style={styles.searchContainer}>
        <View style={styles.searchBarContainer}>
          <Searchbar
            placeholder={languages.find(lang => lang.code === selectedLanguage)?.placeholder || "Ask anything..."}
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={handleSearch}
            style={styles.searchBar}
            icon="magnify"
            loading={isLoading}
            inputStyle={styles.searchInput}
            placeholderTextColor="#666"
            iconColor={theme.colors.primary}
          />
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <View style={styles.controlItem}>
            <Menu
              visible={languageMenuVisible}
              onDismiss={() => setLanguageMenuVisible(false)}
              anchor={
                <Pressable 
                  style={styles.dropdownButton}
                  onPress={() => setLanguageMenuVisible(true)}
                >
                  <View style={styles.dropdownContent}>
                    <Icon name="translate" size={20} color={theme.colors.primary} />
                    <Text style={styles.dropdownText}>
                      {languages.find(lang => lang.code === selectedLanguage)?.name || 'Select Language'}
                    </Text>
                    <Icon name="chevron-down" size={20} color={theme.colors.primary} />
                  </View>
                </Pressable>
              }
            >
              {languages.map(lang => (
                <Menu.Item
                  key={lang.code}
                  onPress={() => {
                    setSelectedLanguage(lang.code);
                    setLanguageMenuVisible(false);
                  }}
                  title={lang.name}
                  leadingIcon="translate"
                  titleStyle={{ color: selectedLanguage === lang.code ? theme.colors.primary : '#333' }}
                />
              ))}
            </Menu>
        </View>
        
          <View style={styles.controlItem}>
            <View style={styles.ttsControls}>
              <Menu
                visible={ttsSpeedMenuVisible}
                onDismiss={() => setTtsSpeedMenuVisible(false)}
                anchor={
                  <Pressable 
                    style={styles.dropdownButton}
                    onPress={() => setTtsSpeedMenuVisible(true)}
                  >
                    <View style={styles.dropdownContent}>
                      <Icon name="turtle" size={20} color={theme.colors.primary} />
                      <Text style={styles.dropdownText}>
                        Speed: {ttsSpeed === 0.5 ? 'Slow' : ttsSpeed === 0.75 ? 'Normal' : 'Fast'}
                      </Text>
                      <Icon name="chevron-down" size={20} color={theme.colors.primary} />
                    </View>
                  </Pressable>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setTtsSpeed(0.5);
                    setTtsSpeedMenuVisible(false);
                  }}
                  title="Slow"
                  leadingIcon="turtle"
                  titleStyle={{ color: ttsSpeed === 0.5 ? theme.colors.primary : '#333' }}
                />
                <Menu.Item
                  onPress={() => {
                    setTtsSpeed(0.75);
                    setTtsSpeedMenuVisible(false);
                  }}
                  title="Normal"
                  leadingIcon="run"
                  titleStyle={{ color: ttsSpeed === 0.75 ? theme.colors.primary : '#333' }}
                />
                <Menu.Item
                  onPress={() => {
                    setTtsSpeed(1.0);
                    setTtsSpeedMenuVisible(false);
                  }}
                  title="Fast"
                  leadingIcon="lightning-bolt"
                  titleStyle={{ color: ttsSpeed === 1.0 ? theme.colors.primary : '#333' }}
                />
              </Menu>

              <Menu
                visible={ttsPitchMenuVisible}
                onDismiss={() => setTtsPitchMenuVisible(false)}
                anchor={
                  <Pressable 
                    style={styles.dropdownButton}
                    onPress={() => setTtsPitchMenuVisible(true)}
                  >
                    <View style={styles.dropdownContent}>
                      <Icon name="music-note" size={20} color={theme.colors.primary} />
                      <Text style={styles.dropdownText}>
                        Pitch: {ttsPitch === 0.8 ? 'Low' : ttsPitch === 1.0 ? 'Normal' : 'High'}
                      </Text>
                      <Icon name="chevron-down" size={20} color={theme.colors.primary} />
            </View>
                  </Pressable>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setTtsPitch(0.8);
                    setTtsPitchMenuVisible(false);
                  }}
                  title="Low"
                  leadingIcon="music-note"
                  titleStyle={{ color: ttsPitch === 0.8 ? theme.colors.primary : '#333' }}
                />
                <Menu.Item
                  onPress={() => {
                    setTtsPitch(1.0);
                    setTtsPitchMenuVisible(false);
                  }}
                  title="Normal"
                  leadingIcon="music-note"
                  titleStyle={{ color: ttsPitch === 1.0 ? theme.colors.primary : '#333' }}
                />
                <Menu.Item
                  onPress={() => {
                    setTtsPitch(1.2);
                    setTtsPitchMenuVisible(false);
                  }}
                  title="High"
                  leadingIcon="music-note"
                  titleStyle={{ color: ttsPitch === 1.2 ? theme.colors.primary : '#333' }}
                />
              </Menu>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Getting information from AI...</Text>
              <Text style={styles.loadingSubtext}>This may take a few moments</Text>
            </View>
          ) : error ? (
            <Surface style={styles.errorContainer} elevation={2}>
              <Icon name="alert-circle" size={48} color="#f44336" />
              <Text style={styles.errorText}>{error}</Text>
              <Button 
                mode="contained" 
                onPress={handleSearch} 
                style={styles.retryButton}
                icon="refresh"
              >
                Try Again
              </Button>
            </Surface>
          ) : results.length > 0 ? (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultCount}>Found {results.length} relevant sections</Text>
                <Button
                  mode="outlined"
                  onPress={handleShareAll}
                  icon="share"
                  style={styles.shareAllButton}
                >
                  Share All
                </Button>
              </View>
              {results.map((result, index) => (
                <Card key={index} style={[styles.resultCard, index === 0 && styles.primaryResultCard]} mode="elevated">
                  <Card.Content>
                    <View style={styles.resultTitleContainer}>
                      <View style={styles.titleLeftContainer}>
                        <Icon 
                          name={index === 0 ? "information" : index === results.length - 1 ? "link-variant" : "format-list-bulleted"} 
                          size={24} 
                          color={theme.colors.primary} 
                          style={styles.resultIcon}
                        />
                        <Text style={styles.resultTitle}>{result.title}</Text>
                      </View>
                      <View style={styles.actionButtons}>
                        <IconButton
                          icon={isSpeaking ? "volume-high" : "volume-medium"}
                          size={24}
                          onPress={() => handleSpeak(result.snippet)}
                          style={styles.actionButton}
                          iconColor={isSpeaking ? theme.colors.primary : '#666'}
                        />
                        <IconButton
                          icon="share"
                          size={24}
                          onPress={() => handleShare(result)}
                          style={styles.actionButton}
                          iconColor="#666"
                        />
                      </View>
                    </View>
                    {result.imageUrl && (
                      <View style={styles.imageContainer}>
                        <Image 
                          source={{ uri: result.imageUrl }} 
                          style={styles.resultImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    <Text style={styles.resultSnippet}>
                      {result.snippet.split('. ').map((point, idx) => (
                        <Text key={idx} style={idx === 0 ? styles.highlightedText : styles.normalText}>
                          {point.trim()}. 
                        </Text>
                      ))}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
              <View style={styles.poweredByContainer}>
                <Icon name="google" size={16} color="#666" />
                <Text style={styles.poweredBy}>Powered by Google Gemini AI</Text>
              </View>
            </>
          ) : (
            <Surface style={styles.placeholderContainer} elevation={2}>
              <Icon name="text-search" size={64} color={theme.colors.primary} />
              <Text style={styles.placeholderText}>
                {selectedLanguage === 'hi' ? 'आप क्या जानना चाहेंगे?' : 'What would you like to learn about?'}
              </Text>
              <Text style={styles.helperText}>
                {selectedLanguage === 'hi' ? 'कुछ भी पूछें और AI-संचालित जानकारी प्राप्त करें' : 'Ask anything and get AI-powered insights'}
              </Text>
              <View style={styles.placeholderExamples}>
                <Text style={styles.exampleText}>
                  {selectedLanguage === 'hi' ? '• "क्वांटम कंप्यूटिंग के बारे में बताएं"' : '• "Tell me about quantum computing"'}
                </Text>
                <Text style={styles.exampleText}>
                  {selectedLanguage === 'hi' ? '• "आर्टिफिशियल इंटेलिजेंस क्या है?"' : '• "What is artificial intelligence?"'}
                </Text>
                <Text style={styles.exampleText}>
                  {selectedLanguage === 'hi' ? '• "ब्लॉकचेन तकनीक को समझाएं"' : '• "Explain blockchain technology"'}
                </Text>
              </View>
            </Surface>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen; 
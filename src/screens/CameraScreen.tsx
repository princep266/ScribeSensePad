import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Dimensions, Share, Image } from 'react-native';
import { Button, SegmentedButtons, Surface, Text, useTheme, IconButton, Searchbar, Portal, Modal, Chip, ActivityIndicator } from 'react-native-paper';
import OCRScanner from '../components/OCRScanner';
import Tts from 'react-native-tts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface LanguageOption {
  value: string;
  label: string;
  ttsCode: string;
}

const languageOptions: LanguageOption[] = [
  { value: 'en', label: 'English', ttsCode: 'en-US' },
  { value: 'hi', label: 'Hindi', ttsCode: 'hi-IN' },
  { value: 'es', label: 'Spanish', ttsCode: 'es-ES' },
  { value: 'fr', label: 'French', ttsCode: 'fr-FR' },
  { value: 'de', label: 'German', ttsCode: 'de-DE' },
  { value: 'it', label: 'Italian', ttsCode: 'it-IT' },
  { value: 'pt', label: 'Portuguese', ttsCode: 'pt-PT' },
  { value: 'ru', label: 'Russian', ttsCode: 'ru-RU' },
  { value: 'ja', label: 'Japanese', ttsCode: 'ja-JP' },
  { value: 'ko', label: 'Korean', ttsCode: 'ko-KR' },
];

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = 'AIzaSyDAOytJN5Kzm8VrKxo5KzITK1Plf2XN9ko';

const CameraScreen: React.FC = () => {
  const theme = useTheme();
  const [detectedText, setDetectedText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'text' | 'image'>('text');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([]);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const isMounted = useRef(true);
  const ttsInitialized = useRef(false);

  // Initialize TTS once when component mounts
  useEffect(() => {
    const initTTS = async () => {
      try {
        await Tts.getInitStatus();
        ttsInitialized.current = true;

        // Set initial language
        const currentLang = languageOptions.find(lang => lang.value === selectedLanguage);
        if (currentLang) {
          await Tts.setDefaultLanguage(currentLang.ttsCode);
          await Tts.setDefaultRate(0.5);
        }

        // Set up event listeners
        Tts.addEventListener('tts-start', () => {
          if (isMounted.current) setIsSpeaking(true);
        });
        
        Tts.addEventListener('tts-finish', () => {
          if (isMounted.current) setIsSpeaking(false);
        });
        
        Tts.addEventListener('tts-cancel', () => {
          if (isMounted.current) setIsSpeaking(false);
        });
      } catch (err) {
        console.warn('TTS initialization failed:', err);
        setError('Failed to initialize text-to-speech');
      }
    };

    initTTS();

    return () => {
      isMounted.current = false;
      if (ttsInitialized.current) {
        Tts.stop();
      }
    };
  }, []);

  const handleSpeak = async () => {
    if (!translatedText.trim() || !ttsInitialized.current) return;

    try {
      if (isSpeaking) {
        await Tts.stop();
        setIsSpeaking(false);
      } else {
        const currentLang = languageOptions.find(lang => lang.value === selectedLanguage);
        if (currentLang) {
          await Tts.setDefaultLanguage(currentLang.ttsCode);
          await Tts.speak(translatedText);
        }
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      setError('Failed to speak text. Please try again.');
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    if (detectedText) {
      translateText(detectedText, newLanguage);
    }
  };

  const translateText = async (text: string, targetLang: string) => {
    if (!text.trim() || targetLang === 'en') {
      setTranslatedText(text);
      return;
    }

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
              text: `Translate the following text to ${languageOptions.find(lang => lang.value === targetLang)?.label}. Only provide the translation without any additional text or explanations: "${text}"`
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Translation failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Validate the response structure
      if (!data || !data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        throw new Error('Invalid response structure from API');
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
        throw new Error('Invalid candidate structure in API response');
      }

      const translatedText = candidate.content.parts[0].text;
      if (!translatedText || typeof translatedText !== 'string') {
        throw new Error('Invalid translation text in API response');
      }

      // Clean up the translation text
      const cleanTranslation = translatedText
        .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
        .replace(/^Translation:|^Translated text:|^In ${languageOptions.find(lang => lang.value === targetLang)?.label}:/i, '') // Remove common prefixes
        .trim();

      setTranslatedText(cleanTranslation);
    } catch (error) {
      console.error('Translation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to translate text. Please try again.');
      setTranslatedText(text); // Fallback to original text
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSearch = async () => {
    if (!detectedText.trim() || !searchQuery.trim()) return;

    setIsSearching(true);
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
              text: `Search for "${searchQuery}" in the following text and provide relevant excerpts: "${detectedText}"`
            }]
          }]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Search failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        const results = data.candidates[0].content.parts[0].text.split('\n').filter(Boolean);
        setSearchResults(results);
      } else {
        throw new Error('Invalid search response');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Failed to search text. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: translatedText,
        title: 'Shared Text',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleTextDetected = (text: string) => {
    setDetectedText(text);
    translateText(text, selectedLanguage);
  };

  const handleImageSearch = async () => {
    if (!selectedImage) return;

    setIsImageSearching(true);
    setError('');

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Analyze this image and provide detailed information about what you see."
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: selectedImage
                }
              }
            ]
          }]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Image analysis failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        setImageSearchResults([{
          type: 'text',
          content: data.candidates[0].content.parts[0].text
        }]);
      } else {
        throw new Error('Invalid image search response');
      }
    } catch (error) {
      console.error('Image search error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze image. Please try again.');
    } finally {
      setIsImageSearching(false);
    }
  };

  const handleImageCapture = (imageUri: string) => {
    setSelectedImage(imageUri);
    setShowSearch(true);
    setSearchType('image');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Icon name="camera" size={32} color={theme.colors.primary} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Text Scanner</Text>
            <Text style={styles.headerSubtitle}>Point camera at text to scan</Text>
          </View>
        </View>
      </Surface>

      <View style={styles.container}>
        <Surface style={styles.scannerContainer} elevation={4}>
          <OCRScanner 
            onTextDetected={handleTextDetected}
          />
          <View style={styles.scannerOverlay}>
            <Icon name="scan-helper" size={24} color="#fff" />
          </View>
        </Surface>

        <Surface style={styles.contentContainer} elevation={2}>
          <View style={styles.languageSection}>
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
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
                buttons={languageOptions.map(lang => ({
                  value: lang.value,
                  label: lang.label,
                  style: styles.segmentButton,
                }))}
                style={styles.languageButtons}
              />
            </ScrollView>
          </View>

          <Surface style={styles.textContainer} elevation={1}>
            <View style={styles.textHeader}>
              <View style={styles.textHeaderLeft}>
                <Icon name="text-recognition" size={24} color={theme.colors.primary} />
                <Text style={styles.textLabel}>Detected Text</Text>
              </View>
              <View style={styles.textActions}>
                <IconButton
                  icon="magnify"
                  size={24}
                  onPress={() => {
                    setSearchType('text');
                    setShowSearch(true);
                  }}
                  style={styles.actionButton}
                />
                <IconButton
                  icon="share"
                  size={24}
                  onPress={handleShare}
                  style={styles.actionButton}
                />
              </View>
            </View>
            <ScrollView style={styles.scrollView}>
              {translatedText ? (
                <Text style={styles.detectedText}>{translatedText}</Text>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Icon name="text-recognition" size={32} color="#9e9e9e" />
                  <Text style={styles.placeholderText}>No text detected yet</Text>
                  <Text style={styles.helperText}>Position your camera over text to begin scanning</Text>
                </View>
              )}
            </ScrollView>
          </Surface>

          {detectedText ? (
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSpeak}
                disabled={!ttsInitialized.current || isTranslating}
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
                {isSpeaking ? 'Stop' : `Read in ${languageOptions.find(lang => lang.value === selectedLanguage)?.label}`}
              </Button>
            </View>
          ) : null}
        </Surface>
      </View>

      <Portal>
        <Modal
          visible={showSearch}
          onDismiss={() => setShowSearch(false)}
          contentContainerStyle={styles.searchModal}
        >
          <View style={styles.searchHeader}>
            <View style={styles.searchTitleContainer}>
              <Icon name={searchType === 'text' ? "text-search" : "image-search"} size={24} color={theme.colors.primary} />
              <Text style={styles.searchTitle}>
                {searchType === 'text' ? 'Search in Text' : 'Image Analysis'}
              </Text>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowSearch(false)}
            />
          </View>

          {searchType === 'text' ? (
            <>
              <Searchbar
                placeholder="Search in scanned text..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                onSubmitEditing={handleSearch}
                loading={isSearching}
                iconColor={theme.colors.primary}
              />
              <ScrollView style={styles.searchResults}>
                {searchResults.map((result, index) => (
                  <Surface key={index} style={styles.searchResultCard} elevation={1}>
                    <Text style={styles.searchResult}>{result}</Text>
                  </Surface>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.imagePreview}
                  />
                  <Button
                    mode="contained"
                    onPress={handleImageSearch}
                    loading={isImageSearching}
                    disabled={isImageSearching}
                    style={styles.analyzeButton}
                  >
                    Analyze Image
                  </Button>
                </View>
              )}
              <ScrollView style={styles.searchResults}>
                {imageSearchResults.map((result, index) => (
                  <Surface key={index} style={styles.searchResultCard} elevation={1}>
                    <Text style={styles.searchResult}>{result.content}</Text>
                  </Surface>
                ))}
              </ScrollView>
            </>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
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
  container: {
    flex: 1,
    padding: 16,
  },
  scannerContainer: {
    height: width * 0.75,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 12,
  },
  contentContainer: {
    flex: 1,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  languageSection: {
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
  textContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  textHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  textHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  textActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
  },
  scrollView: {
    padding: 16,
  },
  detectedText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    elevation: 2,
  },
  buttonContent: {
    height: 48,
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  searchModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 16,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  searchResults: {
    maxHeight: 400,
  },
  searchResultCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchResult: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: width * 0.8,
    height: width * 0.6,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyzeButton: {
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    elevation: 2,
  },
});

export default CameraScreen;


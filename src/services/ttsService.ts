import Tts from 'react-native-tts';

export const speakText = (text: string) => {
  Tts.speak(text);
};

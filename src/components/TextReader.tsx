import React from 'react';
import { Button } from 'react-native-paper';
import { speakText } from '../services/ttsService';

interface TextReaderProps {
  content: string;
}

const TextReader: React.FC<TextReaderProps> = ({ content }) => {
  return <Button onPress={() => speakText(content)}>🔊 Read Text</Button>;
};

export default TextReader;

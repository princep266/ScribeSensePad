import recognizeText from '@react-native-ml-kit/text-recognition';

export const processImage = async (imagePath: string): Promise<string> => {
  try {
    const result = await recognizeText.recognize(imagePath);
    return result.text;
  } catch (error) {
    console.error('OCR Error:', error);
    return '';
  }
};

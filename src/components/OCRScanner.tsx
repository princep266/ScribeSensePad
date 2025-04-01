import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Alert, Platform, TouchableOpacity } from "react-native";
import { Camera, useCameraDevice, CameraPermissionStatus } from "react-native-vision-camera";
import { Button, Menu, Divider } from "react-native-paper";
import recognizeText from "@react-native-ml-kit/text-recognition";
import i18n from '../localization/i18n';

const OCRScanner: React.FC<{ onTextDetected: (text: string) => void }> = ({ onTextDetected }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' }
  ];

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const changeLanguage = (langCode: string) => {
    i18n.locale = langCode;
    setMenuVisible(false);
  };

  useEffect(() => {
    checkPermissions();
    return () => {
      setIsCameraActive(false);
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const permission = await Camera.requestCameraPermission();
      console.log('Camera permission:', permission);
      
      if (permission === 'granted') {
        setHasPermission(true);
        setError(null);
      } else {
        setHasPermission(false);
        setError(i18n.t(['camera', 'permission', 'required']));
        if (permission === 'denied') {
          Alert.alert(
            i18n.t(['camera', 'permission', 'required']),
            i18n.t(['camera', 'permission', 'message']),
            [{ text: i18n.t(['camera', 'permission', 'retry']) }]
          );
        }
      }
    } catch (err) {
      console.error('Failed to check permissions:', err);
      setError(i18n.t(['camera', 'error', 'processingFailed']));
      setHasPermission(false);
    }
  };

  const toggleCamera = () => {
    if (!hasPermission) {
      Alert.alert(
        i18n.t(['camera', 'permission', 'required']),
        i18n.t(['camera', 'permission', 'message'])
      );
      return;
    }
    setIsCameraActive(!isCameraActive);
  };

  const captureText = async () => {
    if (!cameraRef.current || !isCameraActive) {
      Alert.alert("Error", i18n.t(['camera', 'error', 'notReady']));
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Taking photo...");
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });

      console.log("Photo captured at:", photo.path);
      const imagePath = Platform.OS === "android" ? `file://${photo.path}` : photo.path;
      console.log("Processing image at:", imagePath);

      const result = await recognizeText.recognize(imagePath);
      console.log("OCR Result:", result);

      if (result && result.text) {
        onTextDetected(result.text);
      } else {
        console.log("No text detected in the image");
        onTextDetected(i18n.t(['camera', 'ocr', 'noText']));
      }
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert(
        "Error",
        i18n.t(['camera', 'error', 'processingFailed'])
      );
      onTextDetected(i18n.t(['camera', 'ocr', 'error']));
    } finally {
      setIsProcessing(false);
    }
  };

  const stopScanning = () => {
    setIsCameraActive(false);
    if (isProcessing) {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={checkPermissions}>
          {i18n.t(['camera', 'permission', 'retry'])}
        </Button>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{i18n.t(['camera', 'error', 'notAvailable'])}</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{i18n.t(['camera', 'permission', 'required'])}</Text>
        <Button mode="contained" onPress={checkPermissions}>
          {i18n.t(['camera', 'permission', 'grant'])}
        </Button>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{i18n.t(['camera', 'permission', 'required'])}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera 
        ref={cameraRef} 
        style={styles.camera} 
        device={device}
        isActive={isCameraActive}
        photo
        enableZoomGesture
      />
      <View style={styles.headerContainer}>
        <Menu
          visible={menuVisible}
          onDismiss={toggleMenu}
          anchor={
            <TouchableOpacity 
              style={[styles.iconButton, styles.centerContent]}
              onPress={toggleMenu}
            >
              <Text style={styles.iconText}>
                {languages.find(lang => lang.code === i18n.locale)?.name || 'Language'}
              </Text>
            </TouchableOpacity>
          }
        >
          {languages.map((lang) => (
            <Menu.Item
              key={lang.code}
              onPress={() => changeLanguage(lang.code)}
              title={lang.name}
            />
          ))}
        </Menu>
      </View>
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.iconButton, styles.centerContent]}
            onPress={toggleCamera}
          >
            <Text style={styles.iconText}>
              {i18n.t(['camera', 'buttons', isCameraActive ? 'stop' : 'start'])}
            </Text>
          </TouchableOpacity>
          <Button 
            mode="contained" 
            onPress={captureText}
            loading={isProcessing}
            disabled={isProcessing || !isCameraActive}
            style={styles.scanButton}
          >
            {i18n.t(['camera', 'buttons', isProcessing ? 'processing' : 'scan'])}
          </Button>
          {isProcessing && (
            <TouchableOpacity 
              style={[styles.iconButton, styles.centerContent, styles.stopButton]}
              onPress={stopScanning}
            >
              <Text style={styles.iconText}>
                {i18n.t(['camera', 'buttons', 'stop'])}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
   
    flex: 1,
    backgroundColor: "#000"
  },
  camera: { 
    flex: 1,
    width: "100%"
  },
  headerContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.3)"
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 24,
  },
  stopButton: {
    backgroundColor: "rgba(255,0,0,0.5)",
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    minWidth: 120,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  iconText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  }
});

export default OCRScanner;

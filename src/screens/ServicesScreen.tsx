import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ServicesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const ServicesScreen: React.FC<ServicesScreenProps> = ({ navigation }) => {
  const theme = useTheme();

  const services = [
    {
      title: 'Text Recognition',
      description: 'Scan and recognize text from images',
      icon: 'text-box-outline',
      navigate: () => navigation.navigate('Camera'),
      color: '#4a90e2',
      gradient: ['#4a90e2', '#357abd'],
    },
    {
      title: 'Text to Speech',
      description: 'Convert text to speech',
      icon: 'volume-high',
      navigate: () => navigation.navigate('TextToSpeech', { initialText: '' }),
      color: '#50c878',
      gradient: ['#50c878', '#3da15f'],
    },
    {
      title: 'Translation',
      description: 'Translate text between languages',
      icon: 'translate',
      navigate: () => navigation.navigate('Translation', { textToTranslate: '' }),
      color: '#f39c12',
      gradient: ['#f39c12', '#d68910'],
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Surface style={styles.headerContainer} elevation={4}>
        <View style={styles.header}>
          <Text style={styles.title}>Services</Text>
          <Text style={styles.subtitle}>Choose a service to get started</Text>
        </View>
      </Surface>

      <View style={styles.servicesContainer}>
        {services.map((service, index) => (
          <Surface
            key={index}
            style={[styles.serviceCard]}
            elevation={2}
          >
            <View style={styles.serviceContent}>
              <View style={styles.serviceHeader}>
                <View style={[styles.iconContainer, { backgroundColor: service.color }]}>
                  <Icon name={service.icon} size={24} color="#fff" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                </View>
              </View>
              <Icon 
                name="chevron-right" 
                size={24} 
                color={service.color} 
                style={styles.arrowIcon}
              />
            </View>
            <View 
              style={[styles.touchableOverlay]}
              onTouchEnd={service.navigate}
            />
          </Surface>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Select any service to continue</Text>
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
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    letterSpacing: 0.25,
  },
  servicesContainer: {
    padding: 16,
    paddingTop: 0,
  },
  serviceCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'relative',
  },
  serviceContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    marginRight: 16,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: 0.25,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  arrowIcon: {
    opacity: 0.7,
  },
  touchableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default ServicesScreen; 
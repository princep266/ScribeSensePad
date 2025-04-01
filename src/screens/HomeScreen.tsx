import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native';
import { Button, Text, Card, useTheme, Surface, Searchbar, IconButton } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const scrollY = new Animated.Value(0);

  const menuItems = [
    {
      title: 'Quick Search',
      description: 'Search and get detailed information about any topic',
      icon: 'magnify',
      onPress: () => navigation.navigate('Search'),
      color: '#9c27b0',
      gradient: ['#9c27b0', '#7b1fa2'],
      iconBg: 'rgba(156, 39, 176, 0.1)',
    },
    {
      title: 'Scan Text',
      description: 'Use camera to scan and extract text from images',
      icon: 'camera-outline',
      onPress: () => navigation.navigate('Camera'),
      color: '#4a90e2',
      gradient: ['#4a90e2', '#357abd'],
      iconBg: 'rgba(74, 144, 226, 0.1)',
    },
    {
      title: 'Services',
      description: 'Access all available services and features',
      icon: 'apps',
      onPress: () => navigation.navigate('Services'),
      color: '#50c878',
      gradient: ['#50c878', '#3da15f'],
      iconBg: 'rgba(80, 200, 120, 0.1)',
    },
    {
      title: 'Settings',
      description: 'Configure app preferences and language settings',
      icon: 'cog-outline',
      onPress: () => navigation.navigate('Settings'),
      color: '#f39c12',
      gradient: ['#f39c12', '#d68910'],
      iconBg: 'rgba(243, 156, 18, 0.1)',
    },
  ];

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 100],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <LinearGradient
          colors={['#4a90e2', '#357abd']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Icon name="text-box-check" size={48} color="#fff" style={styles.headerIcon} />
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.title}>ScribeSense Pad</Text>
            <Text style={styles.subtitle}>Your AI-powered text assistant</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[styles.headerTitle, { opacity: headerTitleOpacity }]}>
        <Text style={styles.headerTitleText}>ScribeSense Pad</Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Card
              key={index}
              style={[styles.card]}
              onPress={item.onPress}
              mode="elevated"
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                    <Icon name={item.icon} size={24} color={item.color} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDescription}>{item.description}</Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color={item.color} style={styles.arrowIcon} />
              </Card.Content>
            </Card>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerGradient: {
    flex: 1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flex: 1,
    padding: 24,
    paddingTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.25,
  },
  headerTitle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop: 240,
  },
  menuContainer: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: 0.25,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    opacity: 0.7,
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

export default HomeScreen;

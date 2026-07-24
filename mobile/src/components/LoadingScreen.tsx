import React, { useEffect, useState, useRef } from 'react';
import {
  AccessibilityInfo,
  View,
  StyleSheet,
  Animated,
  Image,
  Text,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/constants/theme';

const BG_IMAGES = [
  require('../../assets/images/loading_screen/argos.jpg'),
  require('../../assets/images/loading_screen/manhattan.jpg'),
  require('../../assets/images/loading_screen/nathan.jpg'),
  require('../../assets/images/loading_screen/orfevre.jpg'),
];

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = 'CARGANDO EL REINO...' }: LoadingScreenProps = {}) => {
  const { width, height } = useWindowDimensions();
  const compact = width < 360 || height < 650;
  const [reduceMotion, setReduceMotion] = useState(false);
  // Start with a random image so every app launch feels different
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * BG_IMAGES.length));
  const fadeAnim1 = useRef(new Animated.Value(1)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  
  // Scales for Ken Burns effect
  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(1.1)).current; // starts a bit zoomed

  const progressAnim = useRef(new Animated.Value(0)).current;

  const [useFirstAnim, setUseFirstAnim] = useState(true);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    // Start initial scale for the first image
    Animated.timing(scaleAnim1, {
      toValue: 1.1,
      duration: 5000,
      useNativeDriver: true,
    }).start();

    // Crossfade interval
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % BG_IMAGES.length;
      
      if (useFirstAnim) {
        // Prepare scale 2
        scaleAnim2.setValue(1);
        Animated.timing(scaleAnim2, { toValue: 1.1, duration: 5000, useNativeDriver: true }).start();

        Animated.parallel([
          Animated.timing(fadeAnim1, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(fadeAnim2, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ]).start(() => {
          setCurrentIndex(nextIndex);
          setUseFirstAnim(false);
          scaleAnim1.setValue(1); // reset scale 1
        });
      } else {
        // Prepare scale 1
        scaleAnim1.setValue(1);
        Animated.timing(scaleAnim1, { toValue: 1.1, duration: 5000, useNativeDriver: true }).start();

        Animated.parallel([
          Animated.timing(fadeAnim2, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(fadeAnim1, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ]).start(() => {
          setCurrentIndex(nextIndex);
          setUseFirstAnim(true);
          scaleAnim2.setValue(1); // reset scale 2
        });
      }
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [currentIndex, reduceMotion, useFirstAnim]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const progressLoop = Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );

    progressLoop.start();
    return () => progressLoop.stop();
  }, [progressAnim, reduceMotion]);

  const currentImage = BG_IMAGES[currentIndex];
  const nextImage = BG_IMAGES[(currentIndex + 1) % BG_IMAGES.length];

  const progressTranslate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={styles.container}>
      {/* Background Images Crossfading with Zoom */}
      <Animated.Image
        source={useFirstAnim ? currentImage : nextImage}
        style={[
          styles.bgImage,
          {
            width,
            height,
            opacity: fadeAnim1,
            transform: [{ scale: scaleAnim1 }],
          },
        ]}
        resizeMode="cover"
      />
      <Animated.Image
        source={useFirstAnim ? nextImage : currentImage}
        style={[
          styles.bgImage,
          {
            width,
            height,
            opacity: fadeAnim2,
            transform: [{ scale: scaleAnim2 }],
          },
        ]}
        resizeMode="cover"
      />

      {/* Dark Overlay reduced for better character visibility */}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,10,0.4)', 'rgba(10,10,10,0.9)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Content Center */}
      <View style={styles.content}>
        <Image 
          source={require('../../assets/images/logo.jpg')}
          style={[styles.logo, compact && styles.logoCompact]}
          resizeMode="contain"
        />
        
        <View style={styles.loaderContainer}>
          <Text style={styles.loadingText}>{message}</Text>
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { transform: [{ translateX: progressTranslate }] },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingBottom: 40,
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: Colors.borderGold,
    marginBottom: 40,
  },
  logoCompact: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 28,
  },
  loaderContainer: {
    width: '70%',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 10,
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '38%',
    height: '100%',
    backgroundColor: Colors.primaryGold,
    shadowColor: Colors.glowGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4, // for android glow
  },
});

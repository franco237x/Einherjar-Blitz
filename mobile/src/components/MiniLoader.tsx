import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Easing } from 'react-native';
import { Colors } from '@/constants/theme';

export const MiniLoader = () => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spinClockwise = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinCounterClockwise = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      {/* Outer rotating ring */}
      <Animated.View style={[styles.ring, styles.ringOuter, { transform: [{ rotate: spinClockwise }] }]} />
      {/* Inner counter-rotating ring */}
      <Animated.View style={[styles.ring, styles.ringInner, { transform: [{ rotate: spinCounterClockwise }] }]} />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.bgDark, // Dark border to separate from rings
    backgroundColor: Colors.bgDarker,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  ring: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'transparent', // Make standard borders invisible
  },
  ringOuter: {
    width: 95,
    height: 95,
    borderTopColor: Colors.primaryGold,
    borderBottomColor: Colors.glowGold,
  },
  ringInner: {
    width: 82,
    height: 82,
    borderLeftColor: Colors.primaryGold,
    borderRightColor: Colors.glowGold,
    opacity: 0.6,
  },
});

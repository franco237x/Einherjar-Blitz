/**
 * SyncIndicator — Logo + sync feedback, top-right.
 *
 * Only visible during/after a sync event:
 *   syncing → logo + gold spinner
 *   done    → logo + green checkmark, fades out after 1.2s
 *   offline → logo + red cloud (persistent)
 *   idle    → hidden entirely
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export const SyncIndicator = () => {
  const { status } = useSyncStatus();
  const spin = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Spin loop when syncing
  useEffect(() => {
    if (status === 'connecting') {
      fadeAnim.setValue(1);
      const loop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
    spin.stopAnimation();
    spin.setValue(0);
  }, [status, spin, fadeAnim]);

  // When going online, show checkmark then fade out everything
  useEffect(() => {
    if (status === 'online') {
      fadeAnim.setValue(1);
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 1200);
      return () => clearTimeout(timer);
    }
    if (status === 'offline') {
      fadeAnim.setValue(1);
    }
  }, [status, fadeAnim]);

  const badgeColor =
    status === 'offline' ? '#ef4444' : status === 'online' ? '#22c55e' : Colors.primaryGold;
  const badgeIcon =
    status === 'offline' ? 'cloud-offline' : status === 'online' ? 'checkmark' : 'sync';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} pointerEvents="none">
      {/* Logo */}
      <Image
        source={require('@/assets/images/logo.jpg')}
        style={styles.logo}
        contentFit="cover"
        transition={200}
      />

      {/* Status badge */}
      <View style={styles.badge}>
        {status === 'connecting' ? (
          <Animated.View
            style={{
              transform: [
                {
                  rotate: spin.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons name="sync" size={8} color={badgeColor} />
          </Animated.View>
        ) : (
          <Ionicons name={badgeIcon as any} size={8} color={badgeColor} />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 100,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
});

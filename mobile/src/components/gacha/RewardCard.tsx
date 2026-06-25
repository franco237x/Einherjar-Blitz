/**
 * RewardCard — Reusable card for displaying a single gacha reward.
 *
 * Features:
 * - Local image with fallback icon when image is null or fails to load.
 * - Rarity-colored border and glow.
 * - Star rating based on rarity.
 * - Type badge (Persona / Invocación / Recurso).
 * - Staggered entrance animation (fade + spring scale).
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { RARITIES, type RewardItem } from '@/constants/gachaData';

interface RewardCardProps {
  item: RewardItem;
  index: number; // for staggered animation
}

export const RewardCard = ({ item, index }: RewardCardProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - Spacing.xl * 2 - Spacing.md) / 2; // 2 columns
  const [imageError, setImageError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const rarity = RARITIES[item.rarity];

  const hasImage = item.image != null && !imageError;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const typeLabel =
    item.type === 'persona'
      ? 'Persona'
      : item.type === 'invocacion'
      ? 'Invocación'
      : 'Recurso';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          width: cardWidth,
          borderColor: rarity.color,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Image / Fallback */}
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image
            source={item.image!}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.fallback, { backgroundColor: rarity.glowColor }]}>
            <Ionicons
              name={item.fallbackIcon as any}
              size={44}
              color={rarity.color}
            />
          </View>
        )}

        {/* Rarity gradient overlay at bottom of image */}
        <View style={[styles.imageOverlay, { backgroundColor: rarity.glowColor }]} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        {/* Stars */}
        <View style={styles.stars}>
          {Array.from({ length: rarity.stars }).map((_, i) => (
            <Ionicons key={i} name="star" size={10} color={rarity.color} />
          ))}
        </View>

        {/* Name */}
        <Text style={[styles.name, { color: rarity.color }]} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Type Badge */}
        <View style={[styles.typeBadge, { borderColor: rarity.color }]}>
          <Text style={[styles.typeText, { color: rarity.color }]}>
            {typeLabel}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(10,10,10,0.85)',
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    opacity: 0.5,
  },
  info: {
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  typeText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

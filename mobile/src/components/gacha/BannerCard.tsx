/**
 * BannerCard — Premium visual card for a Gacha banner.
 *
 * Layout: The character art occupies the right/bottom of the card,
 * while the title and buttons stay on the left/top with a strong
 * gradient so they remain readable. This mimics Genshin Impact's
 * wish screen layout.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { type BannerDef } from '@/constants/gachaData';

interface BannerCardProps {
  banner: BannerDef;
  onSummon: (amount: number) => void;
  /** Height of the carousel viewport so the card fills it exactly. */
  cardHeight?: number;
  cardWidth?: number;
  disabled?: boolean;
}

export const BannerCard = ({
  banner,
  onSummon,
  cardHeight,
  cardWidth,
  disabled = false,
}: BannerCardProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const [imageError, setImageError] = useState(false);

  const costIcon = banner.costType === 'keys' ? 'key' : 'planet';
  const accent = banner.accentColor;

  // The wrapper spans the full carousel viewport; the card is capped to a
  // comfortable max height and centered, so it never looks gigantic on tall
  // phones while still filling smaller screens.
  const viewport = cardHeight && cardHeight > 0 ? cardHeight : 360;

  return (
    <View style={[styles.wrapper, { width: cardWidth || screenWidth, height: viewport }]}>
      <View style={[styles.card, { height: viewport }]}>
        {/* ─── Character Art (positioned right, full height) ─── */}
        {!imageError ? (
          <Image
            source={banner.bannerImage}
            style={styles.characterArt}
            contentFit="cover"
            contentPosition="left center"
            cachePolicy="memory-disk"
            transition={180}
            accessibilityLabel={`Ilustración del banner ${banner.title}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.characterArt, styles.fallbackArt]}>
            <Ionicons name={banner.iconName as any} size={100} color={accent} style={{ opacity: 0.15 }} />
          </View>
        )}

        {/* ─── Accent top line ─── */}
        <View style={[styles.accentLine, { backgroundColor: accent, zIndex: 3 }]} />

        {/* ─── Content overlay (renders reliably on top of absolute image) ─── */}
        <View style={styles.contentOverlay} pointerEvents="none">
          <LinearGradient
            colors={['rgba(5,5,8,0.72)', 'rgba(5,5,8,0.04)', 'rgba(5,5,8,0.35)']}
            locations={[0, 0.46, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(5,5,8,0)', 'rgba(5,5,8,0.98)']}
            locations={[0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* ─── Content (left-aligned) ─── */}
        <View style={[styles.content, { zIndex: 2 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.bannerBadge, { borderColor: accent }]}>
              <Ionicons name={banner.iconName as any} size={12} color={accent} />
              <Text style={[styles.badgeText, { color: accent }]}>BANNER</Text>
            </View>

            <Text style={[styles.title, { textShadowColor: accent }]}>
              {banner.title}
            </Text>
            <Text style={styles.subtitle}>{banner.subtitle}</Text>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline, { borderColor: accent }]}
              onPress={() => onSummon(1)}
              disabled={disabled}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Invocar una vez por ${banner.costAmount} ${banner.costType === 'keys' ? 'llaves' : 'esferas'}`}
              accessibilityState={{ disabled, busy: disabled }}
            >
              <Text style={[styles.btnLabel, { color: accent }]}>
                {disabled ? 'Procesando' : 'Invocar ×1'}
              </Text>
              <View style={styles.costRow}>
                <Ionicons name={costIcon} size={12} color={accent} />
                <Text style={[styles.costVal, { color: accent }]}>{banner.costAmount}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnFilled, { backgroundColor: accent }]}
              onPress={() => onSummon(10)}
              disabled={disabled}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Invocar diez veces por ${banner.costAmount * 10} ${banner.costType === 'keys' ? 'llaves' : 'esferas'}`}
              accessibilityState={{ disabled, busy: disabled }}
            >
              <Text style={[styles.btnLabel, { color: '#0a0a14' }]}>
                {disabled ? 'Procesando' : 'Invocar ×10'}
              </Text>
              <View style={styles.costRow}>
                <Ionicons name={costIcon} size={12} color="#0a0a14" />
                <Text style={[styles.costVal, { color: '#0a0a14' }]}>{banner.costAmount * 10}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#0a0a14',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },

  /* Character art — positioned to show the character on the right side */
  characterArt: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  fallbackArt: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a14',
  },

  accentLine: {
    height: 2,
    width: '100%',
    opacity: 0.7,
  },

  /* Content overlay for gradients to ensure they render over the image */
  contentOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    elevation: 2, // Android specific fix
  },

  /* Content */
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: 'space-between',
    elevation: 3, // Android specific fix
  },

  /* Header (left-aligned for visual weight balance against the character art) */
  header: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    maxWidth: '72%',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 28,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
    lineHeight: 34,
    textAlign: 'right',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
    fontSize: 13,
    letterSpacing: 0.3,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },

  /* Actions */
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.xs,
    backgroundColor: 'rgba(5,5,8,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btn: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 2,
  },
  btnOutline: {
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  btnFilled: {},
  btnLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  costVal: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
});

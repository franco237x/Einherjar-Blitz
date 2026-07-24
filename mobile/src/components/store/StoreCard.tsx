/**
 * StoreCard — Product card for the store grid.
 *
 * Mirrors the web design:
 * - Image with category tag overlay
 * - "Exclusive" golden border for premium items (isExclusive)
 * - Sold-out overlay when stock === 0
 * - Title, description, price (spheres), stock count
 * - Buy button
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import type { StoreProduct } from '@/constants/storeData';

interface StoreCardProps {
  product: StoreProduct;
  spheres: number;
  onBuy: (product: StoreProduct) => void;
  buying: boolean;
  style?: StyleProp<ViewStyle>;
  imageHeight?: number;
}

export const StoreCard = ({
  product,
  spheres,
  onBuy,
  buying,
  style,
  imageHeight,
}: StoreCardProps) => {
  const soldOut = product.stock <= 0;
  const canAfford = spheres >= product.price && !soldOut;

  const handlePress = () => {
    if (soldOut) return;
    if (!canAfford) return;
    onBuy(product);
  };

  return (
    <View style={[styles.card, product.isExclusive && styles.cardExclusive, style]}>
      {/* Image */}
      <View style={[styles.imageWrap, imageHeight ? { height: imageHeight } : null]}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
          accessibilityLabel={`Imagen de ${product.name}`}
        />
        {/* Category tag */}
        <View style={styles.tag}>
          <Text style={styles.tagText}>{product.category}</Text>
        </View>
        {/* Exclusive ribbon */}
        {product.isExclusive && (
          <View style={styles.ribbon}>
            <Ionicons name="trophy" size={10} color="#1b1305" />
            <Text style={styles.ribbonText}>EXCLUSIVO</Text>
          </View>
        )}
        {/* Sold out overlay */}
        {soldOut && (
          <View style={styles.soldOut}>
            <Ionicons name="ban" size={20} color="#ffb4b4" />
            <Text style={styles.soldOutText}>AGOTADO</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
        <View style={styles.stockRow}>
          <Ionicons
            name={soldOut ? 'ban-outline' : 'cube-outline'}
            size={11}
            color={soldOut ? '#ffb4b4' : Colors.textMuted}
          />
          <Text style={[styles.stockText, soldOut && styles.stockOutText]}>
            {soldOut ? 'Agotado' : `${product.stock} disponibles`}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.buyBtn,
            !canAfford && styles.buyBtnDisabled,
            product.isExclusive && styles.buyBtnExclusive,
          ]}
          onPress={handlePress}
          disabled={!canAfford || buying}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            soldOut
              ? `${product.name}, agotado`
              : canAfford
                ? `Comprar ${product.name} por ${product.price} esferas`
                : `Saldo insuficiente para comprar ${product.name}`
          }
          accessibilityState={{ disabled: !canAfford || buying, busy: buying }}
        >
          <Ionicons
            name="planet"
            size={14}
            color={canAfford ? '#111' : Colors.textMuted}
          />
          <Text style={[styles.buyPrice, !canAfford && styles.buyBtnTextDisabled]}>
            {product.price.toLocaleString()}
          </Text>
          <Text style={[styles.buyBtnText, !canAfford && styles.buyBtnTextDisabled]}>
            {buying
              ? '...'
              : soldOut
                ? 'AGOTADO'
                : canAfford
                  ? 'COMPRAR'
                  : 'SIN SALDO'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(10,14,16,0.88)',
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.28)',
    marginBottom: Spacing.md,
  },
  cardExclusive: {
    borderColor: 'rgba(255,180,70,0.5)',
    shadowColor: 'rgba(255,180,70,0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  /* Image */
  imageWrap: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  tagText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ribbon: {
    position: 'absolute',
    top: 14,
    right: -30,
    transform: [{ rotate: '40deg' }],
    backgroundColor: 'rgba(255,200,100,0.95)',
    paddingHorizontal: 28,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ribbonText: {
    color: '#1b1305',
    fontFamily: Fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 1,
  },
  soldOut: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(10,0,0,0.55)',
  },
  soldOutText: {
    color: '#ffb4b4',
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 2,
  },

  /* Body */
  body: {
    padding: Spacing.sm,
    gap: 6,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    lineHeight: 16,
    minHeight: 32,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  stockOutText: {
    color: '#ffb4b4',
  },

  /* Buy button */
  buyBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryGold,
    minHeight: 46,
    paddingHorizontal: Spacing.sm,
    borderRadius: 2,
    marginTop: 2,
  },
  buyBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  buyBtnExclusive: {
    backgroundColor: '#d4af37',
  },
  buyBtnText: {
    color: '#111',
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  buyPrice: {
    color: '#111',
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    marginRight: 'auto',
  },
  buyBtnTextDisabled: {
    color: Colors.textMuted,
  },
});

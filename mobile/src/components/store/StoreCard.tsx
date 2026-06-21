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
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import type { StoreProduct } from '@/constants/storeData';

interface StoreCardProps {
  product: StoreProduct;
  spheres: number;
  onBuy: (product: StoreProduct) => void;
  buying: boolean;
}

export const StoreCard = ({ product, spheres, onBuy, buying }: StoreCardProps) => {
  const soldOut = product.stock <= 0;
  const canAfford = spheres >= product.price && !soldOut;

  const handlePress = () => {
    if (soldOut) return;
    if (!canAfford) return;
    onBuy(product);
  };

  return (
    <View style={[styles.card, product.isExclusive && styles.cardExclusive]}>
      {/* Image */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={300}
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
        <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{product.description}</Text>

        {/* Footer: price + stock */}
        <View style={styles.footer}>
          <View style={styles.priceGroup}>
            <Text style={styles.priceLabel}>Precio</Text>
            <View style={styles.priceRow}>
              <Ionicons name="planet" size={12} color={Colors.primaryGold} />
              <Text style={styles.priceValue}>{product.price.toLocaleString()}</Text>
            </View>
          </View>
          <View style={[styles.stockGroup, soldOut && styles.stockOut]}>
            <Ionicons name="cube" size={12} color={soldOut ? '#ffb4b4' : Colors.textMuted} />
            <Text style={[styles.stockText, soldOut && styles.stockOutText]}>
              {product.stock} en stock
            </Text>
          </View>
        </View>

        {/* Buy button */}
        <TouchableOpacity
          style={[
            styles.buyBtn,
            !canAfford && styles.buyBtnDisabled,
            product.isExclusive && styles.buyBtnExclusive,
          ]}
          onPress={handlePress}
          disabled={soldOut || buying}
          activeOpacity={0.8}
        >
          <Text style={styles.buyBtnText}>
            {buying ? 'COMPRANDO...' : 'COMPRAR'}
          </Text>
          <Ionicons name="cart" size={16} color={soldOut ? '#666' : '#111'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(10,10,10,0.65)',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: Spacing.lg,
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
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 16,
    letterSpacing: 1,
  },
  desc: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceGroup: {
    gap: 2,
  },
  priceLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceValue: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 15,
  },
  stockGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  stockOut: {
    opacity: 0.7,
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
    paddingVertical: 12,
    borderRadius: Radius.sm,
    marginTop: 4,
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
    fontSize: 14,
    letterSpacing: 2,
  },
});

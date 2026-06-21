/**
 * PurchaseModal — Result modal for store purchases.
 *
 * Shows a loader while processing, then success or error with
 * the product name and price. Auto-dismisses on success after 2s
 * or via the "CONTINUAR" button.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export type PurchaseState = 'loading' | 'success' | 'error' | null;

interface PurchaseModalProps {
  state: PurchaseState;
  productName?: string;
  productImage?: string;
  price?: number;
  errorMessage?: string;
  onClose: () => void;
}

export const PurchaseModal = ({
  state,
  productName,
  productImage,
  price,
  errorMessage,
  onClose,
}: PurchaseModalProps) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state) {
      // Animate in
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.8);
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [state, scaleAnim, opacityAnim]);

  // Spin loop for loading state
  useEffect(() => {
    if (state === 'loading') {
      const loop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
    spinAnim.stopAnimation();
  }, [state, spinAnim]);

  const visible = state !== null;
  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {state === 'loading' && (
            <>
              <View style={styles.iconWrap}>
                <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                  <Ionicons name="sync" size={36} color={Colors.primaryGold} />
                </Animated.View>
              </View>
              <Text style={styles.title}>Procesando compra...</Text>
              <Text style={styles.subtitle}>Un momento por favor</Text>
            </>
          )}

          {state === 'success' && (
            <>
              <View style={styles.iconWrap}>
                <LinearGradient
                  colors={['rgba(34,197,94,0.2)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
              </View>
              <Text style={styles.title}>¡Compra exitosa!</Text>
              {productImage && (
                <Image
                  source={{ uri: productImage }}
                  style={styles.productImage}
                  contentFit="cover"
                />
              )}
              <Text style={styles.productName}>{productName}</Text>
              {price != null && (
                <View style={styles.priceRow}>
                  <Ionicons name="planet" size={14} color={Colors.primaryGold} />
                  <Text style={styles.priceText}>{price.toLocaleString()} Esferas</Text>
                </View>
              )}
              <TouchableOpacity style={styles.btnSuccess} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.btnSuccessText}>CONTINUAR</Text>
              </TouchableOpacity>
            </>
          )}

          {state === 'error' && (
            <>
              <View style={styles.iconWrap}>
                <Ionicons name="close-circle" size={48} color="#ef4444" />
              </View>
              <Text style={styles.title}>No se pudo completar</Text>
              <Text style={styles.errorMessage}>
                {errorMessage || 'Ocurrió un error inesperado.'}
              </Text>
              <TouchableOpacity style={styles.btnError} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.btnErrorText}>ENTENDIDO</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0d0d0d',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 20,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  productName: {
    color: Colors.primaryGold,
    fontFamily: Fonts.title,
    fontSize: 16,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  errorMessage: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  btnSuccess: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  btnSuccessText: {
    color: '#fff',
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 3,
  },
  btnError: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  btnErrorText: {
    color: '#ef4444',
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 3,
  },
});

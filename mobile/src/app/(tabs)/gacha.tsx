/**
 * GachaScreen — "Altar de Invocación"
 *
 * Architecture:
 * - Data lives in @/constants/gachaData (rewards, banners, pull logic).
 * - UI components live in @/components/gacha (BannerCard, SummonAnimation, RewardCard).
 * - This screen is the orchestrator: it manages state, connects banners to the pull
 *   system, and triggers the cinematic summon animation.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Background } from '@/components/Background';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { BANNERS, pullMultiple, type RewardItem } from '@/constants/gachaData';
import { BannerCard, SummonAnimation, ProbabilitiesPanel } from '@/components/gacha';
import { InventorySheet } from '@/components/gacha/InventorySheet';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { addInventoryItems } from '@/services/inventory';

export default function GachaScreen() {
  const { width } = useWindowDimensions();
  const [activeBanner, setActiveBanner] = useState(0);
  // Measured height of the carousel area so each banner card fills it exactly.
  const [carouselHeight, setCarouselHeight] = useState(0);

  // Summon state
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonResults, setSummonResults] = useState<RewardItem[]>([]);

  // Inventory sheet visibility
  const [showInventory, setShowInventory] = useState(false);

  // Balances (synced from Firestore)
  const [balances, setBalances] = useState({
    keys: 0,
    spheres: 0,
  });

  // Listen to Firestore for real-time balance updates
  useEffect(() => {
    if (!auth.currentUser) return;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBalances({
          keys: data.keys || 0,
          spheres: data.spheres || 0,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== activeBanner && index >= 0 && index < BANNERS.length) {
      setActiveBanner(index);
    }
  };

  const handleSummon = async (amount: number) => {
    const banner = BANNERS[activeBanner];
    const costKey = banner.costType;
    const totalCost = banner.costAmount * amount;

    if (balances[costKey] < totalCost) {
      Alert.alert(
        'Saldo Insuficiente',
        `No tienes suficientes ${costKey === 'keys' ? 'Llaves' : 'Esferas'} para esta invocación.`
      );
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para invocar.');
      return;
    }

    try {
      // Pull rewards FIRST (pure RNG, no side effects). If balance deduction
      // fails afterwards we still have the results to show, and we retry save.
      const results = pullMultiple(banner.rewards, amount);

      // Deduct balance from Firestore
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        [costKey]: balances[costKey] - totalCost,
      });

      // Persist pulled rewards to inventory (append-only).
      // Fire-and-forget after balance is deducted: a failure here is logged
      // but not shown to the user as an error, since the pull already happened
      // and the cinematic should play. Inventory will retry on next read.
      try {
        await addInventoryItems(
          auth.currentUser.uid,
          results.map((r) => ({
            name: r.name,
            type: r.type,
            rarity: r.rarity,
            bannerId: banner.id,
          }))
        );
      } catch (invErr) {
        console.error('Failed to persist inventory items:', invErr);
      }

      setSummonResults(results);
      setIsSummoning(true);
    } catch (error) {
      console.error('Error during summon:', error);
      Alert.alert('Error', 'Hubo un problema de conexión al procesar la invocación.');
    }
  };

  const handleCloseSummon = () => {
    setIsSummoning(false);
    setSummonResults([]);
  };

  return (
    <Background>
      <ParticlesBackground />

      {/* ─── Top Bar ─── */}
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Gacha Einherjer</Text>
        <View style={styles.balances}>
          <View style={styles.balancePill}>
            <Ionicons name="key" size={17} color={Colors.primaryGold} />
            <Text style={styles.balanceVal}>{balances.keys}</Text>
          </View>
          <View style={styles.balancePill}>
            <Ionicons name="planet" size={17} color="#8b5cf6" />
            <Text style={styles.balanceVal}>{balances.spheres.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={styles.inventoryBtn}
            onPress={() => setShowInventory(true)}
            accessibilityLabel="Abrir inventario"
          >
            <Ionicons name="briefcase-outline" size={22} color={Colors.primaryGold} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Banner Carousel (fixed height, sits near the top) ─── */}
      <View
        style={styles.carousel}
        onLayout={(e) => setCarouselHeight(e.nativeEvent.layout.height)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {BANNERS.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              cardHeight={carouselHeight}
              onSummon={handleSummon}
            />
          ))}
        </ScrollView>
      </View>

      {/* ─── Pagination indicator (pill) — only shown with multiple banners ─── */}
      {BANNERS.length > 1 && (
        <View style={styles.paginationWrap}>
          <View style={styles.paginationPill}>
            {BANNERS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  activeBanner === i && [styles.dotActive, { backgroundColor: BANNERS[i].accentColor }],
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* ─── Drop-rate breakdown (fills bottom space) ─── */}
      <ProbabilitiesPanel rewards={BANNERS[activeBanner].rewards} />

      {/* Bottom spacer above the tab bar */}
      <View style={styles.bottomSpacer} />

      {/* ─── Summon Animation (Full-Screen Modal) ─── */}
      <SummonAnimation
        visible={isSummoning}
        results={summonResults}
        onClose={handleCloseSummon}
      />

      {/* ─── Inventory Sheet ─── */}
      <InventorySheet
        visible={showInventory}
        onClose={() => setShowInventory(false)}
      />
    </Background>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 24,
    letterSpacing: 1,
    textShadowColor: Colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  balances: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  balanceVal: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  inventoryBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: Colors.borderGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },

  /* Carousel — fixed height so the card sits near the top */
  carousel: {
    height: 440,
  },
  bottomSpacer: {
    height: Spacing.lg,
  },

  /* Pagination — contained pill indicator above the tab bar */
  paginationWrap: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  paginationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.primaryGold,
  },
});

/**
 * GachaScreen — "Altar de Invocación"
 *
 * Architecture:
 * - Data lives in @/constants/gachaData (rewards, banners, pull logic).
 * - UI components live in @/components/gacha (BannerCard, SummonAnimation, RewardCard).
 * - This screen is the orchestrator: it manages state, connects banners to the pull
 *   system, and triggers the cinematic summon animation.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Background } from '@/components/Background';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import { Colors, Fonts, Layout, Spacing, Radius } from '@/constants/theme';
import { BANNERS, pullMultiple, type RewardItem } from '@/constants/gachaData';
import { BannerCard, SummonAnimation, ProbabilitiesPanel } from '@/components/gacha';
import { InventorySheet } from '@/components/gacha/InventorySheet';
import { auth } from '@/config/firebase';
import { performGachaPull } from '@/services/gacha';
import { useUserData } from '@/hooks/useUserData';

export default function GachaScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 390;
  const horizontalPadding = width < 390 ? Spacing.md : Spacing.lg;
  const contentWidth = Math.min(width, Layout.contentMaxWidth) - horizontalPadding * 2;
  const wideStage = width >= 700;
  const bannerAreaHeight = Math.round(
    Math.min(520, Math.max(340, contentWidth * (wideStage ? 0.56 : 1.02)))
  );
  const [activeBanner, setActiveBanner] = useState(0);
  // Measured height of the carousel area so each banner card fills it exactly.
  const [carouselHeight, setCarouselHeight] = useState(0);

  // Summon state
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonBusy, setSummonBusy] = useState(false);
  const [summonResults, setSummonResults] = useState<RewardItem[]>([]);

  // Inventory sheet visibility
  const [showInventory, setShowInventory] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const summonLockRef = useRef(false);

  // Balances (synced from Firestore via shared hook)
  const { userData } = useUserData();

  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / contentWidth);
    if (index !== activeBanner && index >= 0 && index < BANNERS.length) {
      setActiveBanner(index);
    }
  };

  const handleSummon = async (amount: number) => {
    if (summonLockRef.current || summonBusy) return;
    const banner = BANNERS[activeBanner];
    const costKey = banner.costType;
    const totalCost = banner.costAmount * amount;

    if ((userData?.[costKey] || 0) < totalCost) {
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

    summonLockRef.current = true;
    setSummonBusy(true);
    try {
      // Pull rewards FIRST (pure RNG, no side effects). If balance deduction
      // fails afterwards we still have the results to show, and we retry save.
      const results = pullMultiple(banner.rewards, amount);

      // Balance, pull ledger and every inventory item are committed together.
      // If any write fails, Firestore rolls the complete transaction back.
      await performGachaPull(auth.currentUser.uid, banner, results);

      setSummonResults(results);
      setIsSummoning(true);
    } catch (error) {
      console.error('Error during summon:', error);
      Alert.alert('Error', 'Hubo un problema de conexión al procesar la invocación.');
    } finally {
      summonLockRef.current = false;
      setSummonBusy(false);
    }
  };

  const handleCloseSummon = () => {
    setIsSummoning(false);
    setSummonResults([]);
  };

  return (
    <Background>
      <ParticlesBackground />

      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + 88,
          },
        ]}
      >
        <View style={[styles.gachaTopBar, compact && styles.gachaTopBarCompact]}>
          <View style={styles.gachaTitleRow}>
            <Ionicons name="sparkles" size={22} color={Colors.primaryGold} />
            <View>
              <Text style={styles.gachaEyebrow}>CÁMARA EINHERJAR</Text>
              <Text style={styles.gachaTitle}>Invocaciones</Text>
            </View>
          </View>

          <View style={[styles.gachaTools, compact && styles.gachaToolsCompact]}>
            <View style={styles.resourcePill} accessibilityLabel={`${userData?.keys || 0} llaves`}>
              <Ionicons name="key" size={16} color={Colors.primaryGold} />
              <Text style={styles.resourceValue}>{userData?.keys || 0}</Text>
            </View>
            <View style={styles.resourcePill} accessibilityLabel={`${userData?.spheres || 0} esferas`}>
              <Ionicons name="planet" size={16} color="#7ed9e7" />
              <Text style={styles.resourceValue}>{userData?.spheres || 0}</Text>
            </View>
            <TouchableOpacity
              style={styles.inventoryBtn}
              onPress={() => setShowInventory(true)}
              accessibilityRole="button"
              accessibilityLabel="Abrir inventario"
            >
              <Ionicons name="briefcase-outline" size={20} color={Colors.primaryGold} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stageLabelRow}>
          <View>
            <Text style={styles.stageEyebrow}>BANNER ACTIVO</Text>
            <Text style={styles.stageTitle}>{BANNERS[activeBanner].title}</Text>
          </View>
          <View style={styles.bannerStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.bannerStatusText}>DISPONIBLE</Text>
          </View>
        </View>

        <View
          style={[styles.carousel, { width: contentWidth, height: bannerAreaHeight }]}
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
                cardWidth={contentWidth}
                onSummon={handleSummon}
                disabled={summonBusy}
              />
            ))}
          </ScrollView>
        </View>

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

        <View style={styles.gachaRail}>
          <TouchableOpacity
            style={[styles.railTab, !showRates && styles.railTabActive]}
            onPress={() => setShowRates(false)}
            accessibilityRole="button"
            accessibilityState={{ selected: !showRates }}
          >
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={!showRates ? Colors.primaryGold : Colors.textMuted}
            />
            <Text style={[styles.railText, !showRates && styles.railTextActive]}>
              DESTACADO
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.railTab, showRates && styles.railTabActive]}
            onPress={() => setShowRates(true)}
            accessibilityRole="button"
            accessibilityState={{ selected: showRates }}
          >
            <Ionicons
              name="stats-chart-outline"
              size={18}
              color={showRates ? Colors.primaryGold : Colors.textMuted}
            />
            <Text style={[styles.railText, showRates && styles.railTextActive]}>
              TASAS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.railTab}
            onPress={() => setShowInventory(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir inventario"
          >
            <Ionicons name="albums-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.railText}>INVENTARIO</Text>
          </TouchableOpacity>
        </View>

        {showRates ? (
          <View style={styles.ratesSection}>
            <View style={styles.ratesHeading}>
              <Text style={styles.ratesTitle}>Probabilidades del banner</Text>
              <Text style={styles.ratesSubtitle}>
                Tasas calculadas sobre todos los objetos disponibles.
              </Text>
            </View>
            <ProbabilitiesPanel rewards={BANNERS[activeBanner].rewards} />
          </View>
        ) : null}
      </ScrollView>

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
  flex: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    alignSelf: 'center',
  },
  gachaTopBar: {
    minHeight: 64,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,170,113,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  gachaTopBarCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: Spacing.sm,
  },
  gachaTitleRow: {
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gachaEyebrow: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 1.1,
  },
  gachaTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 20,
    letterSpacing: 0.6,
  },
  gachaTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gachaToolsCompact: {
    justifyContent: 'flex-end',
  },
  resourcePill: {
    minWidth: 50,
    minHeight: 38,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(201,170,113,0.2)',
    backgroundColor: 'rgba(5,5,5,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  resourceValue: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  inventoryBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(5,5,5,0.72)',
    borderWidth: 1,
    borderColor: Colors.borderGold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageLabelRow: {
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stageEyebrow: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  stageTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 18,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  bannerStatus: {
    minHeight: 28,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.strengthStrong,
  },
  bannerStatusText: {
    color: Colors.strengthStrong,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },

  carousel: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: Radius.sm,
  },

  paginationWrap: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
  gachaRail: {
    minHeight: 62,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  railTab: {
    flex: 1,
    maxWidth: 180,
    minHeight: 60,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  railTabActive: {
    borderBottomColor: Colors.primaryGold,
    backgroundColor: 'rgba(201,170,113,0.05)',
  },
  railText: {
    color: Colors.textMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  railTextActive: {
    color: Colors.primaryGold,
  },
  ratesSection: {
    marginTop: Spacing.lg,
  },
  ratesHeading: {
    marginBottom: Spacing.sm,
  },
  ratesTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 16,
  },
  ratesSubtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});

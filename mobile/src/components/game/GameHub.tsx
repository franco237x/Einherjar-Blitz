import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Crown, LockKeyhole, Shield, Swords } from 'lucide-react-native';
import { GAME_CHARACTERS } from '@/constants/battleData';
import '@/constants/characterAssets';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface GameHubProps {
  onContinue: () => void;
  onQuickDuel: () => void;
  onExit: () => void;
}

export function GameHub({ onContinue, onQuickDuel, onExit }: GameHubProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 740;
  const champion = GAME_CHARACTERS.argos;

  return (
    <View style={[styles.screen, { paddingLeft: Math.max(insets.left, 16), paddingRight: Math.max(insets.right, 16), paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.topbar}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Salir del modo RPG" onPress={onExit} style={styles.exitButton}>
          <Text style={styles.exitText}>SALIR</Text>
        </TouchableOpacity>
        <View style={styles.brand}>
          <Crown size={18} color={Colors.primaryGold} />
          <Text style={styles.brandText}>SENDA DEL EINHERJAR</Text>
        </View>
        <View style={styles.chapterBadge}><Text style={styles.chapterText}>CAPÍTULO I</Text></View>
      </View>

      <View style={[styles.content, compact && styles.contentCompact]}>
        <View style={[styles.hero, compact && styles.heroCompact]}>
          <View style={styles.portraitFrame}>
            {champion.sprites?.portrait ? <Image source={champion.sprites.portrait} style={styles.portrait} resizeMode="cover" /> : <Shield size={44} color={Colors.primaryGold} />}
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>CAMPEÓN ACTIVO</Text>
            <Text style={styles.heroName}>{champion.name}</Text>
            <Text style={styles.heroTitle}>{champion.title}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.stat}>{champion.maxHealth} HP</Text>
              <View style={styles.dot} />
              <Text style={styles.stat}>{champion.attack.minDamage}–{champion.attack.maxDamage} ATQ</Text>
            </View>
          </View>
        </View>

        <View style={styles.missionPanel}>
          <View style={styles.missionHeading}>
            <View style={styles.missionIcon}><Swords size={22} color={Colors.primaryGold} /></View>
            <View style={styles.missionCopy}>
              <Text style={styles.eyebrow}>MISIÓN PRINCIPAL</Text>
              <Text style={styles.missionTitle}>El trono escarlata</Text>
              <Text style={styles.missionDescription} numberOfLines={2}>Cruza el salón del monarca y sobrevive a su segunda fase.</Text>
            </View>
            <Text style={styles.progressText}>1 / 3</Text>
          </View>
          <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Continuar misión principal" style={styles.primaryButton} activeOpacity={0.82} onPress={onContinue}>
            <Text style={styles.primaryText}>CONTINUAR MISIÓN</Text>
            <ChevronRight size={20} color={Colors.bgDarker} />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Iniciar duelo rápido" style={styles.secondaryButton} onPress={onQuickDuel}>
            <Swords size={18} color={Colors.primaryGold} />
            <View style={styles.actionCopy}><Text style={styles.actionTitle}>DUELO RÁPIDO</Text><Text style={styles.actionSub}>Elige guerrero y combate</Text></View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <View accessibilityLabel="Expediciones, próximamente" style={styles.lockedButton}>
            <LockKeyhole size={18} color={Colors.textMuted} />
            <View style={styles.actionCopy}><Text style={styles.lockedTitle}>EXPEDICIONES</Text><Text style={styles.actionSub}>Próximamente</Text></View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgDarker },
  topbar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.borderGold },
  exitButton: { minWidth: 64, minHeight: 40, justifyContent: 'center' }, exitText: { fontFamily: Fonts.bodyBold, color: Colors.textSecondary, fontSize: 13, letterSpacing: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, brandText: { fontFamily: Fonts.title, color: Colors.primaryGold, fontSize: 16, letterSpacing: 1 },
  chapterBadge: { borderWidth: 1, borderColor: Colors.borderGold, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 }, chapterText: { fontFamily: Fonts.bodyBold, color: Colors.textSecondary, fontSize: 11, letterSpacing: 1 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'stretch', gap: Spacing.md, paddingTop: Spacing.md }, contentCompact: { gap: Spacing.sm },
  hero: { width: '27%', minWidth: 190, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderGold, padding: Spacing.md, justifyContent: 'center' }, heroCompact: { minWidth: 160, padding: Spacing.sm },
  portraitFrame: { flex: 1, maxHeight: 190, minHeight: 110, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderGold, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgDark }, portrait: { width: '100%', height: '100%' },
  heroCopy: { paddingTop: Spacing.sm }, eyebrow: { fontFamily: Fonts.bodyBold, color: Colors.primaryGold, fontSize: 11, letterSpacing: 1.4 }, heroName: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 24, marginTop: 2 }, heroTitle: { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: Spacing.sm }, stat: { fontFamily: Fonts.bodyBold, color: Colors.textSecondary, fontSize: 12 }, dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: Colors.primaryGold },
  missionPanel: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderGold, padding: Spacing.lg, justifyContent: 'space-between' },
  missionHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }, missionIcon: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.bgDark, alignItems: 'center', justifyContent: 'center' }, missionCopy: { flex: 1 }, missionTitle: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 23, marginTop: 2 }, missionDescription: { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 }, progressText: { fontFamily: Fonts.bodyBold, color: Colors.textSecondary, fontSize: 13 },
  progressTrack: { height: 7, borderRadius: Radius.full, overflow: 'hidden', backgroundColor: Colors.bgDark }, progressFill: { width: '33%', height: '100%', backgroundColor: Colors.primaryGold },
  primaryButton: { minHeight: 54, backgroundColor: Colors.primaryGold, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }, primaryText: { fontFamily: Fonts.title, color: Colors.bgDarker, fontSize: 15, letterSpacing: 1 },
  actions: { width: '25%', minWidth: 180, gap: Spacing.sm }, secondaryButton: { flex: 1, minHeight: 80, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderGold, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, lockedButton: { flex: 1, minHeight: 72, backgroundColor: Colors.bgDark, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.glassBorder, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, opacity: 0.7 }, actionCopy: { flex: 1 }, actionTitle: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 13 }, lockedTitle: { fontFamily: Fonts.title, color: Colors.textMuted, fontSize: 13 }, actionSub: { fontFamily: Fonts.body, color: Colors.textMuted, fontSize: 12, marginTop: 3 },
});

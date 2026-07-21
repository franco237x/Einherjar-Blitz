import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  Bot,
  Cpu,
  Sword,
  Zap,
  Wand2,
  Moon,
  Crown,
  Heart,
  Activity,
  Flame,
  ShieldHalf,
  ChevronDown,
  ChevronRight,
} from 'lucide-react-native';
import {
  GAME_CHARACTERS,
  type CharacterDef,
} from '@/constants/battleData';
// Side-effect import: injects sprite sources into GAME_CHARACTERS at runtime.
import '@/constants/characterAssets';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Bot: Bot,
  Cpu: Cpu,
  Sword: Sword,
  Zap: Zap,
  Flash: Zap,
  Wand2: Wand2,
  Moon: Moon,
  Crown: Crown,
};

interface CharacterSelectProps {
  onSelectCharacter: (charId: string) => void;
  onCancel?: () => void;
}

const PORTRAIT_ORIENTATIONS = new Set([
  ScreenOrientation.Orientation.PORTRAIT_UP,
  ScreenOrientation.Orientation.PORTRAIT_DOWN,
]);

function isPortraitOrientation(orientation: ScreenOrientation.Orientation): boolean {
  return PORTRAIT_ORIENTATIONS.has(orientation);
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  onSelectCharacter,
}) => {
  const [orientation, setOrientation] = useState<ScreenOrientation.Orientation>(
    ScreenOrientation.Orientation.UNKNOWN
  );

  useEffect(() => {
    let subscription: ScreenOrientation.Subscription | null = null;

    async function init() {
      try {
        const current = await ScreenOrientation.getOrientationAsync();
        setOrientation(current);
      } catch (e) {
        console.warn('[CharacterSelect] could not read orientation:', e);
      }

      subscription = ScreenOrientation.addOrientationChangeListener((event) => {
        setOrientation(event.orientationInfo.orientation);
      });
    }

    init();

    return () => {
      if (subscription) {
        ScreenOrientation.removeOrientationChangeListener(subscription);
      }
    };
  }, []);

  // If orientation is unknown (e.g. on first render or unsupported platform),
  // fall back to window dimensions. Use dimensions to avoid layout flashes.
  const isPortrait =
    orientation === ScreenOrientation.Orientation.UNKNOWN
      ? true
      : isPortraitOrientation(orientation);

  const characters = Object.values(GAME_CHARACTERS).filter(
    (char) => char.isPlayableBase !== false
  );
  const [selectedId, setSelectedId] = useState<string>('argos');

  const selectedChar = GAME_CHARACTERS[selectedId];
  const SelectedIconComponent = ICON_MAP[selectedChar.lucideIcon] || Bot;

  const renderCard = (char: CharacterDef) => {
    const isSelected = char.id === selectedId;
    const CardIcon = ICON_MAP[char.lucideIcon] || Bot;

    return (
      <TouchableOpacity
        key={char.id}
        style={[styles.card, isSelected && styles.cardSelected]}
        activeOpacity={0.8}
        onPress={() => setSelectedId(char.id)}
      >
        {char.sprites?.portrait ? (
          <View style={isSelected ? styles.portraitFrameSelected : styles.portraitFrame}>
            <Image source={char.sprites.portrait} style={styles.cardImage} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.avatarBadge, isSelected && styles.avatarBadgeSelected]}>
            <CardIcon size={44} color={isSelected ? Colors.primaryGold : Colors.textSecondary} />
          </View>
        )}

        <View style={styles.cardInfoBox}>
          <Text style={[styles.cardName, isSelected && styles.cardNameSelected]} numberOfLines={1}>
            {char.name}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {char.title}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.miniBadge}>
            <Heart size={10} color={Colors.primaryGold} />
            <Text style={styles.miniBadgeText}>{char.maxHealth}</Text>
          </View>
          <View style={styles.miniBadge}>
            <Activity size={10} color={Colors.primaryGold} />
            <Text style={styles.miniBadgeText}>{char.regenTier.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCardsStrip = () => (
    <View style={isPortrait ? styles.portraitCardsStrip : styles.landscapeCardsStrip}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cardsScrollView}
        contentContainerStyle={styles.cardsContent}
      >
        {characters.map(renderCard)}
      </ScrollView>
      {/* Fade overlay + chevrons on the right edge to signal more characters */}
      <LinearGradient
        colors={['transparent', 'rgba(5, 5, 5, 0.85)', 'rgba(5, 5, 5, 1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardsFade}
        pointerEvents="none"
      />
      <View style={styles.chevronCluster} pointerEvents="none">
        <ChevronRight size={22} color={Colors.primaryGold} />
      </View>
    </View>
  );

  const renderDetailPanel = () => (
    <View style={styles.detailPanel}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.detailScrollContent}
      >
        <View style={styles.detailHeader}>
          {selectedChar.sprites?.portrait ? (
            <View style={styles.detailPortraitFrame}>
              <Image source={selectedChar.sprites.portrait} style={styles.detailImage} resizeMode="cover" />
            </View>
          ) : (
            <View style={styles.detailAvatarBadge}>
              <SelectedIconComponent size={36} color={Colors.primaryGold} />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.detailName}>{selectedChar.name}</Text>
            <Text style={styles.detailSub}>{selectedChar.title}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Salud Máxima</Text>
            <Text style={styles.statValue}>{selectedChar.maxHealth} HP</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Daño Base</Text>
            <Text style={styles.statValue}>
              {selectedChar.attack.minDamage} - {selectedChar.attack.maxDamage}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Regeneración</Text>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>
              {selectedChar.regenTier.toUpperCase()} (+{selectedChar.regenAmount} HP)
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Mitigación</Text>
            <Text style={styles.statValue}>-{selectedChar.defense.reduction} DMG</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoTitleRow}>
            <Zap size={14} color={Colors.primaryGold} />
            <Text style={styles.infoTitle}>Habilidad Especial</Text>
          </View>
          <Text style={styles.infoText}>
            <Text style={{ fontWeight: 'bold', color: Colors.primaryGold }}>
              {selectedChar.specialAbility.name}:
            </Text>{' '}
            {selectedChar.specialAbility.description}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoTitleRow}>
            <ShieldHalf size={14} color={Colors.primaryGold} />
            <Text style={styles.infoTitle}>Pasiva</Text>
          </View>
          <Text style={styles.infoText}>{selectedChar.passiveDescription}</Text>
        </View>
      </ScrollView>

      <View style={styles.scrollHint} pointerEvents="none">
        <ChevronDown size={14} color={Colors.primaryGold} />
        <Text style={styles.scrollHintText}>Desliza para más detalles</Text>
      </View>

      <TouchableOpacity style={styles.startBtn} activeOpacity={0.8} onPress={() => onSelectCharacter(selectedChar.id)}>
        <Flame size={18} color="#050505" />
        <Text style={styles.startBtnText}>INICIAR BATALLA</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050505', '#0a0808', '#050505']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Crown size={22} color={Colors.primaryGold} />
            <Text style={styles.headerTitle}>ELIGE A TU CAMPEÓN</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.headerSubtitle}>
            Enfrenta al Rey Escarlata con el guerrero de tu elección
          </Text>
        </View>

        {/* Body */}
        {isPortrait ? (
          <View style={styles.portraitBody}>
            {renderCardsStrip()}
            {renderDetailPanel()}
          </View>
        ) : (
          <View style={styles.landscapeBody}>
            {renderCardsStrip()}
            {renderDetailPanel()}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Fonts.title,
    fontSize: 22,
    color: Colors.primaryGold,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(201, 170, 113, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderGold,
    marginVertical: Spacing.sm,
    opacity: 0.6,
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  portraitBody: {
    flex: 1,
    flexDirection: 'column',
    gap: Spacing.md,
  },
  landscapeBody: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  // Cards strip sizing per orientation
  portraitCardsStrip: {
    height: 240,
    position: 'relative',
  },
  landscapeCardsStrip: {
    flex: 1,
    maxWidth: 400,
    position: 'relative',
  },
  cardsScrollView: {
    flex: 1,
  },
  cardsContent: {
    gap: Spacing.md,
    paddingRight: Spacing.xl,
    paddingVertical: Spacing.xs,
    alignItems: 'stretch',
  },
  cardsFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
  },
  chevronCluster: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 170,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 170, 113, 0.25)',
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cardSelected: {
    backgroundColor: 'rgba(201, 170, 113, 0.08)',
    borderColor: Colors.primaryGold,
    shadowColor: Colors.primaryGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  portraitFrame: {
    width: 120,
    height: 120,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 170, 113, 0.3)',
    padding: 4,
    marginBottom: Spacing.sm,
  },
  portraitFrameSelected: {
    width: 120,
    height: 120,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.primaryGold,
    padding: 4,
    marginBottom: Spacing.sm,
    shadowColor: Colors.primaryGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  avatarBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 170, 113, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarBadgeSelected: {
    backgroundColor: 'rgba(201, 170, 113, 0.12)',
    borderColor: Colors.primaryGold,
  },
  cardInfoBox: {
    alignItems: 'center',
    marginVertical: 2,
  },
  cardName: {
    fontFamily: Fonts.title,
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  cardNameSelected: {
    color: Colors.primaryGold,
  },
  cardTitle: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  badgeRow: {
    gap: 4,
    width: '100%',
    marginTop: Spacing.sm,
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.2)',
    paddingVertical: 4,
  },
  miniBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  detailPanel: {
    flex: 1,
    minHeight: 0,
    backgroundColor: 'rgba(8, 8, 8, 0.92)',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 170, 113, 0.35)',
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  detailScrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.sm,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailPortraitFrame: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.primaryGold,
    padding: 3,
    shadowColor: Colors.primaryGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  detailAvatarBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201, 170, 113, 0.12)',
    borderWidth: 2,
    borderColor: Colors.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailName: {
    fontFamily: Fonts.title,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryGold,
    letterSpacing: 1,
  },
  detailSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.15)',
    padding: Spacing.sm,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: Fonts.title,
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  infoSection: {
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.12)',
    padding: Spacing.sm,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoTitle: {
    fontFamily: Fonts.title,
    fontSize: 12,
    color: Colors.primaryGold,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    opacity: 0.8,
  },
  scrollHintText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.primaryGold,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryGold,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  startBtnText: {
    fontFamily: Fonts.title,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#050505',
    letterSpacing: 1,
  },
});

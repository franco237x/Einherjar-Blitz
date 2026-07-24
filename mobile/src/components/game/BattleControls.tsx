import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  HeartPulse,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';

interface Props {
  isProcessing: boolean;
  isPlayerTurn: boolean;
  canUseSpecial: boolean;
  specialUsed: boolean;
  canRegen: boolean;
  attackRange: string;
  regenAmount: number;
  defenseAmount: number;
  specialName: string;
  healthPercent: number;
  onAttack: () => void;
  onDefend: () => void;
  onRegen: () => void;
  onSpecial: () => void;
}

export const BattleControls = ({
  isProcessing,
  isPlayerTurn,
  canUseSpecial,
  specialUsed,
  canRegen,
  attackRange,
  regenAmount,
  defenseAmount,
  specialName,
  healthPercent,
  onAttack,
  onDefend,
  onRegen,
  onSpecial,
}: Props) => {
  const { height, width } = useWindowDimensions();
  const compact = height < 400 || width < 740;
  const narrow = width < 620;
  const waiting = isProcessing || !isPlayerTurn;
  const specialCharge = specialUsed
    ? 0
    : Math.min(100, Math.max(0, (1 - healthPercent) * 200));

  return (
    <View style={[styles.dock, compact && styles.dockCompact]}>
      <LinearGradient
        colors={[
          'rgba(18, 23, 27, 0.98)',
          'rgba(4, 7, 10, 0.98)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.prompt,
          compact && styles.promptCompact,
          narrow && styles.promptNarrow,
        ]}
      >
        <View
          style={[
            styles.promptSignal,
            waiting && styles.promptSignalDanger,
          ]}
        />
        {!compact && (
          <Text style={styles.promptOverline}>
            {waiting ? 'TURNO ENEMIGO' : 'COMANDOS'}
          </Text>
        )}
        <Text
          style={[
            styles.promptTitle,
            narrow && styles.promptTitleNarrow,
            waiting && styles.promptTitleDanger,
          ]}
          numberOfLines={1}
      >
          {waiting ? 'ESPERA' : narrow ? 'TURNO' : 'TU TURNO'}
        </Text>
      </View>

      <Skill
        featured
        compact={compact}
        icon={<Swords size={compact ? 20 : 24} color={Colors.primaryGold} />}
        label="ATACAR"
        detail={`${attackRange} DMG`}
        value="GOLPE"
        disabled={waiting}
        onPress={onAttack}
      />
      <Skill
        compact={compact}
        icon={<Shield size={compact ? 19 : 22} color="#6ddce8" />}
        label="DEFENDER"
        detail={`-${defenseAmount} DMG`}
        value="GUARDIA"
        disabled={waiting}
        onPress={onDefend}
      />
      <Skill
        compact={compact}
        icon={<HeartPulse size={compact ? 19 : 22} color="#69dfae" />}
        label="REGENERAR"
        detail={canRegen ? `+${regenAmount} HP` : 'HP LLENO'}
        value="CURACIÓN"
        disabled={waiting || !canRegen}
        onPress={onRegen}
      />
      <Skill
        compact={compact}
        icon={
          <Sparkles
            size={compact ? 19 : 22}
            color={canUseSpecial ? Colors.primaryGold : Colors.textMuted}
          />
        }
        label="ESPECIAL"
        detail={specialName}
        value={
          specialUsed
            ? 'CONSUMIDA'
            : canUseSpecial
              ? 'LISTA'
              : `${Math.round(specialCharge)}%`
        }
        disabled={waiting || !canUseSpecial}
        progress={specialCharge}
        onPress={onSpecial}
      />
    </View>
  );
};

interface SkillProps {
  icon: React.ReactNode;
  label: string;
  detail: string;
  value: string;
  disabled: boolean;
  compact: boolean;
  featured?: boolean;
  progress?: number;
  onPress: () => void;
}

function Skill({
  icon,
  label,
  detail,
  value,
  disabled,
  compact,
  featured = false,
  progress,
  onPress,
}: SkillProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.skill,
        compact && styles.skillCompact,
        featured && styles.featured,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${detail}. ${value}`}
      accessibilityState={{ disabled }}
    >
      <LinearGradient
        colors={
          featured
            ? ['rgba(74, 54, 25, 0.98)', 'rgba(15, 13, 10, 0.98)']
            : ['rgba(24, 30, 34, 0.98)', 'rgba(8, 11, 14, 0.98)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.iconFrame, compact && styles.iconFrameCompact]}>
        <View style={styles.iconGlyph}>{icon}</View>
      </View>
      <View style={styles.skillCopy}>
        <Text
          style={[styles.label, compact && styles.labelCompact]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          style={[styles.detail, compact && styles.detailCompact]}
          numberOfLines={1}
        >
          {detail}
        </Text>
      </View>
      <View style={styles.valueTag}>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <View style={styles.cornerTop} />
      <View style={styles.cornerBottom} />
      {typeof progress === 'number' && (
        <View style={styles.charge}>
          <LinearGradient
            colors={['#8d713d', Colors.primaryGold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.chargeFill, { width: `${progress}%` }]}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 5,
    height: 88,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 6,
    padding: 6,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.48)',
    backgroundColor: 'rgba(4, 7, 10, 0.96)',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    zIndex: 15,
  },
  dockCompact: {
    left: 5,
    right: 5,
    height: 76,
    padding: 4,
    gap: 4,
  },
  prompt: {
    width: 112,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(201, 170, 113, 0.25)',
  },
  promptCompact: {
    width: 72,
    paddingHorizontal: 5,
  },
  promptNarrow: {
    width: 66,
    paddingHorizontal: 4,
  },
  promptSignal: {
    width: 26,
    height: 3,
    marginBottom: 6,
    backgroundColor: '#62e0e9',
  },
  promptSignalDanger: {
    backgroundColor: Colors.strengthWeak,
  },
  promptOverline: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textMuted,
    fontSize: 7,
    letterSpacing: 1.1,
  },
  promptTitle: {
    marginTop: 2,
    fontFamily: Fonts.title,
    color: Colors.textPrimary,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  promptTitleNarrow: {
    fontSize: 9,
    letterSpacing: 0.2,
  },
  promptTitleDanger: {
    color: '#ff8075',
  },
  skill: {
    flex: 1,
    maxWidth: 180,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.24)',
    backgroundColor: Colors.bgCard,
  },
  skillCompact: {
    paddingHorizontal: 4,
  },
  featured: {
    flex: 1.08,
    borderColor: 'rgba(201, 170, 113, 0.72)',
  },
  disabled: {
    opacity: 0.42,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  iconFrame: {
    width: 39,
    height: 39,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    borderWidth: 1,
    borderColor: 'rgba(201, 170, 113, 0.54)',
    backgroundColor: 'rgba(2, 5, 8, 0.82)',
  },
  iconFrameCompact: {
    width: 32,
    height: 32,
  },
  iconGlyph: {
    transform: [{ rotate: '-45deg' }],
  },
  skillCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
  },
  label: {
    fontFamily: Fonts.title,
    color: Colors.textPrimary,
    fontSize: 10,
    letterSpacing: 0.55,
  },
  labelCompact: {
    fontSize: 8,
    letterSpacing: 0.2,
  },
  detail: {
    marginTop: 3,
    fontFamily: Fonts.bodyBold,
    color: Colors.primaryGold,
    fontSize: 9,
  },
  detailCompact: {
    fontSize: 7,
  },
  valueTag: {
    position: 'absolute',
    right: 5,
    bottom: 4,
    maxWidth: '62%',
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  value: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textMuted,
    fontSize: 6,
    letterSpacing: 0.7,
  },
  cornerTop: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 15,
    height: 3,
    backgroundColor: Colors.primaryGold,
  },
  cornerBottom: {
    position: 'absolute',
    left: -1,
    bottom: -1,
    width: 15,
    height: 3,
    backgroundColor: 'rgba(82, 217, 228, 0.65)',
  },
  charge: {
    position: 'absolute',
    left: 5,
    right: 5,
    bottom: 1,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  chargeFill: {
    height: '100%',
  },
});

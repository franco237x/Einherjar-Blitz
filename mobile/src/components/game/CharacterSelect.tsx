import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Film,
  Heart,
  ImageIcon,
  Shield,
  Sparkles,
  Sword,
} from 'lucide-react-native';
import {
  GAME_CHARACTERS,
  type CharacterDef,
} from '@/constants/battleData';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

const ARGOS_SPLASH = require('../../../assets/images/game/argos/argos-splash.jpg');
const ARGOS_VIDEO = require('../../../assets/images/game/argos/argos-splash.mp4');
const VIDEO_PREFERENCE_KEY = '@einherjar/game-character-video';

// The carousel is already data-driven, but only Argos is released for now.
const AVAILABLE_CHARACTER_IDS = ['argos'] as const;

interface CharacterSelectProps {
  onSelectCharacter: (charId: string) => void;
  onCancel?: () => void;
}

export const CharacterSelect = ({
  onSelectCharacter,
  onCancel,
}: CharacterSelectProps) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = height < 410 || width < 760;
  const carouselRef = useRef<FlatList<CharacterDef>>(null);
  const characters = AVAILABLE_CHARACTER_IDS.map(
    (id) => GAME_CHARACTERS[id]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const selected = characters[selectedIndex];

  useEffect(() => {
    let active = true;

    Promise.all([
      AsyncStorage.getItem(VIDEO_PREFERENCE_KEY),
      AccessibilityInfo.isReduceMotionEnabled(),
    ]).then(([savedPreference, reduceMotion]) => {
      if (!active) return;
      if (savedPreference === 'video') setVideoEnabled(true);
      else if (savedPreference === 'image') setVideoEnabled(false);
      else setVideoEnabled(!reduceMotion);
    });

    return () => {
      active = false;
    };
  }, []);

  const toggleVideo = useCallback(() => {
    setVideoEnabled((current) => {
      const next = !current;
      AsyncStorage.setItem(
        VIDEO_PREFERENCE_KEY,
        next ? 'video' : 'image'
      ).catch(() => {});
      return next;
    });
  }, []);

  const selectIndex = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(index, characters.length - 1));
      setSelectedIndex(bounded);
      carouselRef.current?.scrollToIndex({
        index: bounded,
        animated: true,
      });
    },
    [characters.length]
  );

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / Math.max(width, 1)
      );
      setSelectedIndex(Math.max(0, Math.min(index, characters.length - 1)));
    },
    [characters.length, width]
  );

  return (
    <View style={styles.screen}>
      <FlatList
        ref={carouselRef}
        data={characters}
        keyExtractor={(character) => character.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ index }) => (
          <ChampionSlide
            width={width}
            height={height}
            videoEnabled={videoEnabled && index === selectedIndex}
          />
        )}
        extraData={`${selectedIndex}-${videoEnabled}`}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View
        pointerEvents="box-none"
        style={[
          styles.interface,
          {
            paddingTop: Math.max(insets.top, 8),
            paddingBottom: Math.max(insets.bottom, 8),
            paddingLeft: Math.max(insets.left, 12),
            paddingRight: Math.max(insets.right, 12),
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Salir de selección de personaje"
          >
            <ArrowLeft size={18} color={Colors.textPrimary} />
            <Text style={styles.backText}>SALIR</Text>
          </TouchableOpacity>

          <View style={styles.heading}>
            <Text style={styles.headingOverline}>PREPARACIÓN DE MISIÓN</Text>
            <Text style={styles.headingTitle}>ELIGE TU EINHERJAR</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.mediaToggle,
              videoEnabled && styles.mediaToggleActive,
            ]}
            onPress={toggleVideo}
            accessibilityRole="switch"
            accessibilityState={{ checked: videoEnabled }}
            accessibilityLabel={
              videoEnabled
                ? 'Desactivar splash animado'
                : 'Activar splash animado'
            }
          >
            {videoEnabled ? (
              <Film size={16} color={Colors.bgDarker} />
            ) : (
              <ImageIcon size={16} color={Colors.primaryGold} />
            )}
            <Text
              style={[
                styles.mediaToggleText,
                videoEnabled && styles.mediaToggleTextActive,
              ]}
            >
              {videoEnabled ? 'ANIMACIÓN ON' : 'IMAGEN FIJA'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.missionBadge}>
          <Crosshair size={16} color={Colors.strengthWeak} />
          <View>
            <Text style={styles.missionLabel}>MISIÓN ACTUAL</Text>
            <Text style={styles.missionText}>Matar al Rey Escarlata</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.arrow,
            styles.arrowLeft,
            selectedIndex === 0 && styles.arrowDisabled,
          ]}
          onPress={() => selectIndex(selectedIndex - 1)}
          disabled={selectedIndex === 0}
          accessibilityRole="button"
          accessibilityLabel="Personaje anterior"
        >
          <ChevronLeft size={25} color={Colors.primaryGold} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.arrow,
            styles.arrowRight,
            selectedIndex === characters.length - 1 && styles.arrowDisabled,
          ]}
          onPress={() => selectIndex(selectedIndex + 1)}
          disabled={selectedIndex === characters.length - 1}
          accessibilityRole="button"
          accessibilityLabel="Personaje siguiente"
        >
          <ChevronRight size={25} color={Colors.primaryGold} />
        </TouchableOpacity>

        <View
          style={[
            styles.characterInfo,
            compact && styles.characterInfoCompact,
          ]}
        >
          <Text style={styles.selectionCount}>
            CAMPEÓN {String(selectedIndex + 1).padStart(2, '0')} /{' '}
            {String(characters.length).padStart(2, '0')}
          </Text>
          <Text
            style={[styles.characterName, compact && styles.characterNameCompact]}
          >
            {selected.name}
          </Text>
          <Text style={styles.characterTitle}>{selected.title}</Text>

          <View style={styles.stats}>
            <Stat
              icon={<Heart size={14} color={Colors.primaryGold} />}
              label="VIDA"
              value={`${selected.maxHealth}`}
            />
            <Stat
              icon={<Sword size={14} color={Colors.primaryGold} />}
              label="ATAQUE"
              value={`${selected.attack.minDamage}–${selected.attack.maxDamage}`}
            />
            <Stat
              icon={<Shield size={14} color={Colors.primaryGold} />}
              label="DEFENSA"
              value={`${selected.defense.reduction}`}
            />
          </View>

          {!compact && (
            <View style={styles.ability}>
              <Sparkles size={15} color={Colors.primaryGold} />
              <View style={styles.abilityCopy}>
                <Text style={styles.abilityLabel}>HABILIDAD ESPECIAL</Text>
                <Text style={styles.abilityName}>
                  {selected.specialAbility.name}
                </Text>
                <Text style={styles.abilityDescription} numberOfLines={2}>
                  {selected.specialAbility.description}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.rosterRail}>
          <Text style={styles.rosterLabel}>ROSTER DISPONIBLE</Text>
          <View style={styles.thumbnails}>
            {characters.map((character, index) => (
              <TouchableOpacity
                key={character.id}
                style={[
                  styles.thumbnail,
                  index === selectedIndex && styles.thumbnailSelected,
                ]}
                onPress={() => selectIndex(index)}
                accessibilityRole="radio"
                accessibilityState={{ checked: index === selectedIndex }}
                accessibilityLabel={`Seleccionar a ${character.name}`}
              >
                <Image
                  source={ARGOS_SPLASH}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
                <View style={styles.thumbnailShade} />
                <Text style={styles.thumbnailName}>{character.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => onSelectCharacter(selected.id)}
          accessibilityRole="button"
          accessibilityLabel={`Entrar al trono con ${selected.name}`}
          activeOpacity={0.84}
        >
          <View>
            <Text style={styles.confirmOverline}>CAMPEÓN CONFIRMADO</Text>
            <Text style={styles.confirmText}>ENTRAR AL TRONO</Text>
          </View>
          <ChevronRight size={23} color={Colors.bgDarker} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

function ChampionSlide({
  width,
  height,
  videoEnabled,
}: {
  width: number;
  height: number;
  videoEnabled: boolean;
}) {
  return (
    <View style={[styles.slide, { width, height }]}>
      <View
        style={[
          styles.mediaStage,
          {
            width,
            height,
          },
        ]}
      >
        <View
          style={[
            styles.mediaTrack,
            {
              width,
              height,
            },
          ]}
        >
          <Image
            source={ARGOS_SPLASH}
            style={styles.mediaAsset}
            resizeMode="cover"
          />
          {videoEnabled && <AnimatedArgosBackdrop />}
        </View>
        <LinearGradient
          colors={['#03070d', 'rgba(3,7,13,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.mediaFeather}
          pointerEvents="none"
        />
      </View>
      <LinearGradient
        colors={[
          'rgba(3,8,14,0.92)',
          'rgba(3,8,14,0.2)',
          'rgba(3,8,14,0.08)',
          'rgba(3,8,14,0.82)',
        ]}
        locations={[0, 0.28, 0.62, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.horizontalShade}
      />
      <LinearGradient
        colors={[
          'rgba(2,5,9,0.72)',
          'transparent',
          'rgba(2,5,9,0.9)',
        ]}
        locations={[0, 0.47, 1]}
        style={styles.verticalShade}
      />
    </View>
  );
}

function AnimatedArgosBackdrop() {
  const [ready, setReady] = useState(false);
  const player = useVideoPlayer(ARGOS_VIDEO, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  useEffect(() => {
    player.play();
    return () => player.pause();
  }, [player]);

  return (
    <VideoView
      player={player}
      style={[styles.video, { opacity: ready ? 1 : 0 }]}
      contentFit="cover"
      nativeControls={false}
      allowsVideoFrameAnalysis={false}
      surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
      onFirstFrameRender={() => setReady(true)}
    />
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      {icon}
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#03070d',
  },
  slide: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#03070d',
  },
  mediaStage: {
    position: 'absolute',
    top: 0,
    right: 0,
    overflow: 'hidden',
    backgroundColor: '#03070d',
  },
  mediaAsset: {
    width: '100%',
    height: '100%',
  },
  mediaTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mediaFeather: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 180,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  horizontalShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  verticalShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  interface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  header: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,170,113,0.24)',
  },
  backButton: {
    width: 120,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  backText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  heading: {
    alignItems: 'center',
  },
  headingOverline: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textMuted,
    fontSize: 8,
    letterSpacing: 1.7,
  },
  headingTitle: {
    marginTop: 1,
    fontFamily: Fonts.title,
    color: Colors.textPrimary,
    fontSize: 16,
    letterSpacing: 1.2,
  },
  mediaToggle: {
    minWidth: 120,
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    backgroundColor: 'rgba(5,5,5,0.58)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  mediaToggleActive: {
    backgroundColor: Colors.primaryGold,
    borderColor: Colors.primaryGold,
  },
  mediaToggleText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primaryGold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  mediaToggleTextActive: {
    color: Colors.bgDarker,
  },
  missionBadge: {
    position: 'absolute',
    top: 70,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(12,4,6,0.68)',
  },
  missionLabel: {
    fontFamily: Fonts.bodyBold,
    color: Colors.strengthWeak,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  missionText: {
    marginTop: 1,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  arrow: {
    position: 'absolute',
    top: '43%',
    width: 44,
    height: 58,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGold,
    backgroundColor: 'rgba(3,7,13,0.66)',
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  arrowDisabled: {
    opacity: 0.24,
  },
  characterInfo: {
    position: 'absolute',
    left: 34,
    bottom: 90,
    width: '42%',
    maxWidth: 500,
  },
  characterInfoCompact: {
    bottom: 72,
    width: '47%',
  },
  selectionCount: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primaryGold,
    fontSize: 9,
    letterSpacing: 1.8,
  },
  characterName: {
    marginTop: 2,
    fontFamily: Fonts.title,
    color: Colors.textPrimary,
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 7,
  },
  characterNameCompact: {
    fontSize: 31,
    lineHeight: 33,
  },
  characterTitle: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textSecondary,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  stats: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stat: {
    minWidth: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: 'rgba(5,9,15,0.68)',
  },
  statLabel: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textMuted,
    fontSize: 7,
    letterSpacing: 0.8,
  },
  statValue: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  ability: {
    marginTop: Spacing.sm,
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderLeftWidth: 2,
    borderLeftColor: Colors.primaryGold,
    backgroundColor: 'rgba(5,9,15,0.48)',
  },
  abilityCopy: {
    flex: 1,
  },
  abilityLabel: {
    fontFamily: Fonts.bodyBold,
    color: Colors.primaryGold,
    fontSize: 7,
    letterSpacing: 1.2,
  },
  abilityName: {
    marginTop: 1,
    fontFamily: Fonts.bodyBold,
    color: Colors.textPrimary,
    fontSize: 11,
  },
  abilityDescription: {
    marginTop: 2,
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    fontSize: 10,
    lineHeight: 13,
  },
  rosterRail: {
    position: 'absolute',
    left: '50%',
    bottom: 10,
    alignItems: 'center',
    transform: [{ translateX: -92 }],
  },
  rosterLabel: {
    marginBottom: 5,
    fontFamily: Fonts.bodyBold,
    color: Colors.textMuted,
    fontSize: 7,
    letterSpacing: 1.2,
  },
  thumbnails: {
    flexDirection: 'row',
    gap: 7,
  },
  thumbnail: {
    width: 184,
    height: 54,
    overflow: 'hidden',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.bgDarker,
  },
  thumbnailSelected: {
    borderWidth: 2,
    borderColor: Colors.primaryGold,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(2,5,9,0.28)',
  },
  thumbnailName: {
    position: 'absolute',
    left: 8,
    bottom: 5,
    fontFamily: Fonts.title,
    color: Colors.textPrimary,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  confirmButton: {
    position: 'absolute',
    right: 28,
    bottom: 14,
    minWidth: 196,
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryGold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  confirmOverline: {
    fontFamily: Fonts.bodyBold,
    color: 'rgba(5,5,5,0.62)',
    fontSize: 7,
    letterSpacing: 1,
  },
  confirmText: {
    marginTop: 1,
    fontFamily: Fonts.title,
    color: Colors.bgDarker,
    fontSize: 13,
    letterSpacing: 0.7,
  },
});

import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Heart, Shield, Sparkles, Sword, WandSparkles } from 'lucide-react-native';
import { GAME_CHARACTERS, type CharacterDef } from '@/constants/battleData';
import '@/constants/characterAssets';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface CharacterSelectProps { onSelectCharacter: (charId: string) => void; onCancel?: () => void; }

export const CharacterSelect = ({ onSelectCharacter, onCancel }: CharacterSelectProps) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 740;
  const characters = Object.values(GAME_CHARACTERS).filter((character) => character.isPlayableBase !== false);
  const [selectedId, setSelectedId] = useState('argos');
  const selected = GAME_CHARACTERS[selectedId];

  return (
    <View style={[styles.screen, { paddingLeft: Math.max(insets.left, 12), paddingRight: Math.max(insets.right, 12), paddingTop: Math.max(insets.top, 8), paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Volver al refugio">
          <ArrowLeft size={19} color={Colors.textPrimary} /><Text style={styles.backText}>REFUGIO</Text>
        </TouchableOpacity>
        <View><Text style={styles.headerTitle}>ELIGE TU EINHERJAR</Text><Text style={styles.headerSub}>Un guerrero. Una oportunidad.</Text></View>
        <View style={styles.step}><Text style={styles.stepText}>PREPARACIÓN</Text></View>
      </View>

      <View style={styles.body}>
        <View style={[styles.roster, compact && styles.rosterCompact]}>
          <Text style={styles.sectionLabel}>GUERREROS DISPONIBLES</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rosterContent}>
            {characters.map((character) => <RosterItem key={character.id} character={character} selected={character.id === selectedId} onPress={() => setSelectedId(character.id)} />)}
          </ScrollView>
        </View>

        <View style={styles.detail}>
          <View style={styles.identity}>
            <View style={[styles.portraitFrame, compact && styles.portraitCompact]}>
              {selected.sprites?.portrait ? <Image source={selected.sprites.portrait} style={styles.portrait} resizeMode="cover" /> : <Sword size={46} color={Colors.primaryGold} />}
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.eyebrow}>CAMPEÓN SELECCIONADO</Text>
              <Text style={styles.name} numberOfLines={1}>{selected.name}</Text>
              <Text style={styles.title} numberOfLines={1}>{selected.title}</Text>
              <View style={styles.statRow}>
                <Stat icon={<Heart size={15} color={Colors.primaryGold} />} label="VIDA" value={`${selected.maxHealth}`} />
                <Stat icon={<Sword size={15} color={Colors.primaryGold} />} label="DAÑO" value={`${selected.attack.minDamage}–${selected.attack.maxDamage}`} />
                <Stat icon={<Shield size={15} color={Colors.primaryGold} />} label="DEFENSA" value={`${selected.defense.reduction}`} />
              </View>
            </View>
          </View>

          <View style={styles.abilities}>
            <View style={styles.abilityCard}><WandSparkles size={18} color={Colors.primaryGold} /><View style={styles.abilityCopy}><Text style={styles.abilityType}>HABILIDAD</Text><Text style={styles.abilityName} numberOfLines={1}>{selected.specialAbility.name}</Text><Text style={styles.abilityDescription} numberOfLines={2}>{selected.specialAbility.description}</Text></View></View>
            <View style={styles.abilityCard}><Sparkles size={18} color={Colors.primaryGold} /><View style={styles.abilityCopy}><Text style={styles.abilityType}>PASIVA</Text><Text style={styles.abilityDescription} numberOfLines={3}>{selected.passiveDescription}</Text></View></View>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={() => onSelectCharacter(selected.id)} accessibilityRole="button" accessibilityLabel={`Combatir con ${selected.name}`}>
            <View><Text style={styles.startLabel}>LISTO PARA COMBATIR</Text><Text style={styles.startText}>ENTRAR AL TRONO</Text></View><ChevronRight size={24} color={Colors.bgDarker} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

function RosterItem({ character, selected, onPress }: { character: CharacterDef; selected: boolean; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${character.name}, ${character.title}`} style={[styles.rosterItem, selected && styles.rosterItemSelected]}>
    <View style={styles.thumbFrame}>{character.sprites?.portrait ? <Image source={character.sprites.portrait} style={styles.thumb} /> : <Sword size={20} color={Colors.primaryGold} />}</View>
    <View style={styles.rosterCopy}><Text style={[styles.rosterName, selected && styles.selectedText]} numberOfLines={1}>{character.name}</Text><Text style={styles.rosterTitle} numberOfLines={1}>{character.title}</Text></View>
    <Text style={styles.hp}>{character.maxHealth}</Text>
  </TouchableOpacity>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <View style={styles.stat}>{icon}<View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text></View></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgDarker },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.borderGold, paddingBottom: Spacing.sm },
  backButton: { minWidth: 104, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 }, backText: { fontFamily: Fonts.bodyBold, color: Colors.textSecondary, fontSize: 12, letterSpacing: 1 },
  headerTitle: { fontFamily: Fonts.title, color: Colors.primaryGold, fontSize: 17, textAlign: 'center', letterSpacing: 1 }, headerSub: { fontFamily: Fonts.body, color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 2 },
  step: { minWidth: 104, alignItems: 'flex-end' }, stepText: { fontFamily: Fonts.bodyBold, color: Colors.textMuted, fontSize: 10, letterSpacing: 1 },
  body: { flex: 1, flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.md },
  roster: { width: '31%', minWidth: 240, backgroundColor: Colors.bgDark, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.glassBorder, padding: Spacing.sm }, rosterCompact: { minWidth: 205 }, sectionLabel: { fontFamily: Fonts.bodyBold, color: Colors.textMuted, fontSize: 10, letterSpacing: 1.2, padding: Spacing.sm }, rosterContent: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  rosterItem: { minHeight: 62, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.glassBorder, backgroundColor: Colors.bgCard, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm }, rosterItemSelected: { borderColor: Colors.primaryGold, backgroundColor: Colors.bgSecondary },
  thumbFrame: { width: 46, height: 46, borderRadius: Radius.sm, overflow: 'hidden', backgroundColor: Colors.bgDarker, alignItems: 'center', justifyContent: 'center' }, thumb: { width: '100%', height: '100%' }, rosterCopy: { flex: 1 }, rosterName: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 13 }, selectedText: { color: Colors.primaryGold }, rosterTitle: { fontFamily: Fonts.body, color: Colors.textMuted, fontSize: 11, marginTop: 2 }, hp: { fontFamily: Fonts.bodyBold, color: Colors.textSecondary, fontSize: 11 },
  detail: { flex: 1, minWidth: 0, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderGold, padding: Spacing.md, gap: Spacing.md },
  identity: { flex: 1, minHeight: 112, flexDirection: 'row', gap: Spacing.md }, portraitFrame: { width: '28%', minWidth: 130, maxWidth: 190, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderGold, overflow: 'hidden', backgroundColor: Colors.bgDark, alignItems: 'center', justifyContent: 'center' }, portraitCompact: { minWidth: 108 }, portrait: { width: '100%', height: '100%' }, identityCopy: { flex: 1, justifyContent: 'center' }, eyebrow: { fontFamily: Fonts.bodyBold, color: Colors.primaryGold, fontSize: 10, letterSpacing: 1.3 }, name: { fontFamily: Fonts.title, color: Colors.textPrimary, fontSize: 25, marginTop: 2 }, title: { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 14 },
  statRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }, stat: { flex: 1, minWidth: 82, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: Colors.bgDark, borderRadius: Radius.sm, padding: Spacing.sm }, statLabel: { fontFamily: Fonts.bodyBold, color: Colors.textMuted, fontSize: 9 }, statValue: { fontFamily: Fonts.bodyBold, color: Colors.textPrimary, fontSize: 13 },
  abilities: { flexDirection: 'row', gap: Spacing.sm }, abilityCard: { flex: 1, minHeight: 76, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.glassBorder, borderRadius: Radius.md, padding: Spacing.sm, backgroundColor: Colors.bgDark }, abilityCopy: { flex: 1 }, abilityType: { fontFamily: Fonts.bodyBold, color: Colors.primaryGold, fontSize: 9, letterSpacing: 1 }, abilityName: { fontFamily: Fonts.bodyBold, color: Colors.textPrimary, fontSize: 13, marginTop: 2 }, abilityDescription: { fontFamily: Fonts.body, color: Colors.textSecondary, fontSize: 12, lineHeight: 16, marginTop: 2 },
  startButton: { minHeight: 58, backgroundColor: Colors.primaryGold, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, startLabel: { fontFamily: Fonts.bodyBold, color: Colors.bgDarker, fontSize: 9, letterSpacing: 1 }, startText: { fontFamily: Fonts.title, color: Colors.bgDarker, fontSize: 16, marginTop: 1 },
});

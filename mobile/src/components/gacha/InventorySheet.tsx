/**
 * InventorySheet — Full-screen modal showing the user's gacha inventory.
 *
 * Reads from useInventory() (real-time Firestore stream).
 * Groups duplicates and shows a count badge.
 * Each item has a "RECLAMAR" button that generates a PDF and, once claimed,
 * deletes the item from Firestore so it can't be claimed again.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme';
import { RARITIES, REWARDS_TABLE, type RarityKey } from '@/constants/gachaData';
import { useInventory } from '@/hooks/useInventory';
import { deleteInventoryItem } from '@/services/inventory';
import { auth } from '@/config/firebase';
import { MiniLoader } from '@/components/MiniLoader';

const NUM_COLUMNS = 2;
const CARD_GAP = Spacing.md;

// Build a name → reward lookup so we can resolve the local image & fallback icon.
const REWARD_BY_NAME = new Map<string, (typeof REWARDS_TABLE)[number]>();
for (const r of REWARDS_TABLE) {
  REWARD_BY_NAME.set(r.name, r);
}

const RARITY_ORDER: RarityKey[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];

interface InventorySheetProps {
  visible: boolean;
  onClose: () => void;
}

export const InventorySheet = ({ visible, onClose }: InventorySheetProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardWidth =
    (screenWidth - Spacing.lg * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const { items, grouped, loading, count } = useInventory();
  const [filter, setFilter] = useState<RarityKey | 'all'>('all');
  const [claiming, setClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Success state after saving file to device
  const [saveResult, setSaveResult] = useState<{
    uri: string;
    fileType: 'pdf' | 'txt';
    savedToMediaLibrary: boolean;
  } | null>(null);
  const [sharing, setSharing] = useState(false);

  const filtered = useMemo(() => {
    const list = [...grouped].sort((a, b) => {
      const ra = RARITY_ORDER.indexOf(a.rarity);
      const rb = RARITY_ORDER.indexOf(b.rarity);
      if (ra !== rb) return ra - rb;
      return b.obtainedAt?.getTime() ?? 0 - (a.obtainedAt?.getTime() ?? 0);
    });
    if (filter === 'all') return list;
    return list.filter((i) => i.rarity === filter);
  }, [grouped, filter]);

  const countsByRarity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of grouped) {
      map[i.rarity] = (map[i.rarity] || 0) + i.count;
    }
    return map;
  }, [grouped]);

  // ─── Claim all: open a choice modal so the user picks PDF or plain text ──
  const handleClaimAll = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'Debes iniciar sesión para reclamar.');
      return;
    }
    if (items.length === 0) return;

    // On web there's no file-system/sharing, so go straight to the PDF flow.
    if (Platform.OS === 'web') {
      await runClaimPdf();
      return;
    }

    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      // No sharing at all → fall back to the only option that works (PDF).
      await runClaimPdf();
      return;
    }

    setShowClaimModal(true);
  };

  // Delete every item from Firestore once the reward has been handed out.
  const clearInventory = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await Promise.all(items.map((item) => deleteInventoryItem(uid, item.id)));
  };

  // ─── Option 1: PDF flow — generate, SAVE to device, then offer share ────
  const runClaimPdf = async () => {
    if (items.length === 0) return;
    setClaiming(true);
    setShowClaimModal(false);
    try {
      const dateStr = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const rowsHtml = items.map((item) => {
        const rarity = RARITIES[item.rarity];
        return `
          <tr>
            <td>${item.name}</td>
            <td style="text-transform: capitalize;">${item.type}</td>
            <td style="color: ${rarity.color}; font-weight: bold;">${rarity.label}</td>
            <td>${'★'.repeat(rarity.stars)}</td>
            <td>${item.obtainedAt ? item.obtainedAt.toLocaleDateString('es-ES') : 'N/A'}</td>
          </tr>
        `;
      }).join('');

      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Georgia', serif; padding: 40px; color: #1a1a2e; background: #fafafa; }
              .header { text-align: center; border-bottom: 3px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
              h1 { color: #d4af37; font-size: 28px; margin: 0; letter-spacing: 2px; }
              .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              th, td { border: 1px solid #eee; padding: 12px; text-align: left; font-size: 13px; }
              th { background: #f8f8f8; color: #d4af37; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; color: #999; font-size: 11px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>EINHERJAR BLITZ</h1>
              <div class="subtitle">Certificado de Recompensas · ${items.length} objetos</div>
            </div>
            <p style="color: #666; font-size: 14px;">Reclamado el ${dateStr}</p>
            <table>
              <thead>
                <tr>
                  <th>Recompensa</th>
                  <th>Tipo</th>
                  <th>Rareza</th>
                  <th>Estrellas</th>
                  <th>Obtenido</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <div class="footer">
              Este certificado confirma la reclamación de todas las recompensas en Einherjar Blitz.
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        // On web, no file to save — just clear inventory
        await clearInventory();
        return;
      }

      // 1. Generate the PDF to a temp cache location
      const { uri: tempUri } = await Print.printToFileAsync({ html });

      // 2. Save to device — copy to persistent document directory first
      const timestamp = Date.now();
      const persistentFile = new File(Paths.document, `einherjar-certificado-${timestamp}.pdf`);
      const tempFile = new File(tempUri);
      tempFile.copy(persistentFile, { overwrite: true });

      let savedToMediaLibrary = false;

      // 3. Attempt to save to media library (Downloads on Android)
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.Asset.create(persistentFile.uri);
          savedToMediaLibrary = true;
        }
      } catch (mediaError) {
        console.warn('No se pudo guardar en la galería/downloads:', mediaError);
      }

      // 4. Delete inventory items from Firestore — file is safely saved
      await clearInventory();

      // 5. Show success state with option to share
      setSaveResult({ uri: persistentFile.uri, fileType: 'pdf', savedToMediaLibrary });
    } catch (error) {
      console.error('Error al reclamar todo (PDF):', error);
      Alert.alert('Error', 'No se pudo completar la reclamación.');
    } finally {
      setClaiming(false);
    }
  };

  // ─── Option 2: plain-text certificate — generate, SAVE, then offer share ─
  const runClaimText = async () => {
    if (items.length === 0) return;
    setClaiming(true);
    setShowClaimModal(false);
    try {
      const dateStr = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const line = '═'.repeat(31);
      const divider = '─'.repeat(31);

      const itemLines = items.map((item, idx) => {
        const rarity = RARITIES[item.rarity];
        const stars = '★'.repeat(rarity.stars);
        const obtained = item.obtainedAt
          ? item.obtainedAt.toLocaleDateString('es-ES')
          : 'N/A';
        return `${idx + 1}. ${item.name} — ${item.type} — ${rarity.label} ${stars}\n   Obtenido: ${obtained}`;
      }).join('\n\n');

      const text = [
        line,
        '   EINHERJAR BLITZ',
        '   Certificado de Recompensas',
        line,
        '',
        `Reclamado el: ${dateStr}`,
        `Total de objetos: ${items.length}`,
        '',
        divider,
        itemLines,
        divider,
        '',
        'Este certificado confirma la reclamación',
        'de todas las recompensas en Einherjar Blitz.',
        '',
      ].join('\n');

      // 1. Write the text to a PERSISTENT file in the document directory
      const timestamp = Date.now();
      const persistentFile = new File(Paths.document, `einherjar-recompensas-${timestamp}.txt`);
      if (persistentFile.exists) {
        persistentFile.delete();
      }
      persistentFile.create();
      persistentFile.write(text);

      // 2. Delete inventory items from Firestore — file is safely saved
      await clearInventory();

      // 3. Show success state with option to share
      setSaveResult({ uri: persistentFile.uri, fileType: 'txt', savedToMediaLibrary: false });
    } catch (error) {
      console.error('Error al reclamar todo (texto):', error);
      Alert.alert('Error', 'No se pudo completar la reclamación.');
    } finally {
      setClaiming(false);
    }
  };

  // ─── Share the already-saved file (optional, after saving) ─────────────
  const handleShareSavedFile = async () => {
    if (!saveResult) return;
    setSharing(true);
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert(
          'No se puede compartir',
          'Tu dispositivo no permite compartir archivos, pero el archivo ya está guardado en tu dispositivo.',
        );
        return;
      }

      const mimeType = saveResult.fileType === 'pdf' ? 'application/pdf' : 'text/plain';
      const UTI = saveResult.fileType === 'pdf' ? '.pdf' : '.txt';
      const dialogTitle = 'Certificado de Recompensas';

      await Sharing.shareAsync(saveResult.uri, { UTI, mimeType, dialogTitle });
    } catch (error) {
      console.error('Error al compartir:', error);
      // File is already saved — just inform the user
      Alert.alert(
        'Archivo guardado',
        'No se pudo abrir el menú de compartir, pero tu archivo ya está guardado en el dispositivo.',
      );
    } finally {
      setSharing(false);
    }
  };

  // ─── Close the success modal ───────────────────────────────────────────
  const handleCloseSuccess = () => {
    setSaveResult(null);
  };

  const renderItem = ({ item, index }: { item: typeof grouped[number]; index: number }) => {
    const rarity = RARITIES[item.rarity];
    const reward = REWARD_BY_NAME.get(item.name);
    const hasImage = reward?.image != null;

    return (
      <View
        style={[
          styles.card,
          { borderColor: rarity.color, marginLeft: index % NUM_COLUMNS === 0 ? 0 : CARD_GAP, width: cardWidth },
        ]}
      >
        <View style={styles.imageWrap}>
          {hasImage ? (
            <Image source={reward!.image!} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.fallback, { backgroundColor: rarity.glowColor }]}>
              <Ionicons
                name={(reward?.fallbackIcon as any) || 'cube'}
                size={40}
                color={rarity.color}
              />
            </View>
          )}
          <View style={[styles.imageOverlay, { backgroundColor: rarity.glowColor }]} />

          {item.count > 1 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>x{item.count}</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.stars}>
            {Array.from({ length: rarity.stars }).map((_, i) => (
              <Ionicons key={i} name="star" size={9} color={rarity.color} />
            ))}
          </View>
          <Text style={[styles.name, { color: rarity.color }]} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Inventario</Text>
            <Text style={styles.subtitle}>{count} objetos obtenidos</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Rarity filter chips */}
        <View style={styles.filterRow}>
          <FilterChip
            label="Todos"
            active={filter === 'all'}
            onPress={() => setFilter('all')}
            color={Colors.primaryGold}
          />
          {RARITY_ORDER.map((r) => {
            const cfg = RARITIES[r];
            const c = countsByRarity[r] || 0;
            if (c === 0) return null;
            return (
              <FilterChip
                key={r}
                label={`${cfg.label} · ${c}`}
                active={filter === r}
                onPress={() => setFilter(r)}
                color={cfg.color}
              />
            );
          })}
        </View>

        {/* Content — flex:1 so the footer stays pinned below */}
        <View style={styles.contentArea}>
          {loading ? (
            <View style={styles.center}>
              <MiniLoader />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={72} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Inventario vacío</Text>
              <Text style={styles.emptySubtitle}>
                Invoca en el Altar para obtener tus primeras recompensas.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              numColumns={NUM_COLUMNS}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Footer with Reclaim button — normal flow, always visible */}
        {count > 0 && (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + Spacing.sm }]}>
            <TouchableOpacity
              style={[styles.claimAllBtn, claiming && styles.claimAllBtnDisabled]}
              onPress={handleClaimAll}
              disabled={claiming}
              activeOpacity={0.8}
            >
              {claiming ? (
                <Text style={styles.claimAllBtnText}>RECLAMANDO...</Text>
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={18} color={Colors.bgDarker} />
                  <Text style={styles.claimAllBtnText}>RECLAMAR TODO</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── Claim choice modal: PDF or plain text ─── */}
      <Modal
        visible={showClaimModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClaimModal(false)}
      >
        <TouchableOpacity
          style={styles.choiceOverlay}
          activeOpacity={1}
          onPress={() => setShowClaimModal(false)}
        >
          <TouchableOpacity
            style={styles.choiceCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.choiceTitle}>Reclamar recompensas</Text>
            <Text style={styles.choiceSubtitle}>
              Elige cómo quieres recibir tu certificado
            </Text>

            <TouchableOpacity
              style={styles.choiceOption}
              onPress={runClaimPdf}
              activeOpacity={0.7}
            >
              <View style={styles.choiceIconWrap}>
                <Ionicons name="document-text-outline" size={24} color={Colors.primaryGold} />
              </View>
              <View style={styles.choiceTextWrap}>
                <Text style={styles.choiceOptionTitle}>Descargar PDF</Text>
                <Text style={styles.choiceOptionDesc}>
                  Documento con tabla de recompensas
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.choiceDivider} />

            <TouchableOpacity
              style={styles.choiceOption}
              onPress={runClaimText}
              activeOpacity={0.7}
            >
              <View style={styles.choiceIconWrap}>
                <Ionicons name="share-outline" size={24} color={Colors.primaryGold} />
              </View>
              <View style={styles.choiceTextWrap}>
                <Text style={styles.choiceOptionTitle}>Compartir texto</Text>
                <Text style={styles.choiceOptionDesc}>
                  Resumen en texto plano, compatible con cualquier dispositivo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.choiceCancelBtn}
              onPress={() => setShowClaimModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.choiceCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Success modal: file saved, optional share ─── */}
      <Modal
        visible={saveResult !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseSuccess}
      >
        <TouchableOpacity
          style={styles.choiceOverlay}
          activeOpacity={1}
          onPress={handleCloseSuccess}
        >
          <TouchableOpacity
            style={styles.choiceCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.primaryGold} />
            </View>

            <Text style={styles.choiceTitle}>¡Archivo guardado!</Text>
            <Text style={styles.choiceSubtitle}>
              {saveResult?.savedToMediaLibrary
                ? 'Tu certificado se guardó en tu dispositivo (Descargas).'
                : 'Tu certificado se guardó en el almacenamiento de la app.'}
            </Text>
            <Text style={styles.successFileType}>
              {saveResult?.fileType === 'pdf' ? 'Documento PDF' : 'Archivo de texto (.txt)'}
            </Text>

            <TouchableOpacity
              style={[styles.claimAllBtn, sharing && styles.claimAllBtnDisabled, styles.successShareBtn]}
              onPress={handleShareSavedFile}
              disabled={sharing}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={Colors.bgDarker} />
              <Text style={styles.claimAllBtnText}>
                {sharing ? 'COMPARTIENDO...' : 'COMPARTIR'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.choiceCancelBtn}
              onPress={handleCloseSuccess}
              activeOpacity={0.7}
            >
              <Text style={styles.choiceCancelText}>Listo</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const FilterChip = ({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 28,
    letterSpacing: 1,
    textShadowColor: Colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: Colors.bgDarker,
  },
  list: {
    paddingBottom: Spacing.lg,
  },
  contentArea: {
    flex: 1,
  },
  footer: {
    paddingTop: Spacing.md,
    paddingHorizontal: 0,
    backgroundColor: Colors.bgDark,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontFamily: Fonts.title,
    fontSize: 20,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: CARD_GAP,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
  },
  countBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
  },
  info: {
    padding: Spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    lineHeight: 16,
  },
  claimAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryGold,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    width: '100%',
  },
  claimAllBtnDisabled: {
    opacity: 0.6,
  },
  claimAllBtnText: {
    color: Colors.bgDarker,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 2,
  },
  // ─── Claim choice modal ───
  choiceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  choiceCard: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  choiceTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.title,
    fontSize: 20,
    letterSpacing: 1,
    textAlign: 'center',
  },
  choiceSubtitle: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  choiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  choiceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(201,170,113,0.12)',
    borderWidth: 1,
    borderColor: Colors.borderGold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceTextWrap: {
    flex: 1,
  },
  choiceOptionTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
  },
  choiceOptionDesc: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  choiceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: Spacing.xs,
  },
  choiceCancelBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  choiceCancelText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 1,
  },
  // ─── Success modal ───
  successIconWrap: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  successFileType: {
    color: Colors.primaryGold,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    letterSpacing: 0.5,
  },
  successShareBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
});

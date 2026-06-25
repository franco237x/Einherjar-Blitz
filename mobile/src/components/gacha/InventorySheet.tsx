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

  // ─── Claim all: generate PDF with everything → delete all from Firestore ─
  const handleClaimAll = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'Debes iniciar sesión para reclamar.');
      return;
    }
    if (items.length === 0) return;

    setClaiming(true);
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
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
      }

      // Delete all items from Firestore
      await Promise.all(items.map((item) => deleteInventoryItem(uid, item.id)));
    } catch (error) {
      console.error('Error al reclamar todo:', error);
      Alert.alert('Error', 'No se pudo completar la reclamación.');
    } finally {
      setClaiming(false);
    }
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
});

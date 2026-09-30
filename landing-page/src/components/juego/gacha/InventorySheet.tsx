'use client';

/**
 * InventorySheet — Full-screen sheet listing the user's gacha rewards,
 * grouped by name + rarity, with rarity filters and a "claim all" flow.
 *
 * Claiming produces a certificate (PDF through the print dialog, or a .txt
 * download). Items are marked as claimed only after the file is available.
 */

import { memo, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { auth } from '@/config/firebase';
import { RARITIES, REWARD_TYPE_LABELS } from '@/constants/gachaData';
import { useInventory } from '@/hooks/useInventory';
import { markInventoryItemsClaimed, type InventoryItem } from '@/services/inventory';
import { downloadTextFile, escapeHtml, printHtml } from '@/services/fileExport';
import { useDialog } from '@/providers/DialogProvider';
import { cn } from '@/lib/utils';
import { AnimatedNumber, ParticleBurst, SPRINGS } from '../motion';
import { EmptyState } from '../EmptyState';
import { Icon } from '../Icon';
import { MiniLoader } from '../MiniLoader';
import { Modal } from '../Modal';
import { FOCUS_RING, ProcessingLabel, ProcessingShimmer } from './fx';
import { InventoryFilters, InventoryGrid, RARITY_ORDER, type InventoryFilter } from './InventoryGrid';

interface InventorySheetProps {
  visible: boolean;
  onClose: () => void;
}

function formatClaimDate() {
  return new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildCertificateHtml(items: InventoryItem[]) {
  const rowsHtml = items
    .map((item) => {
      const rarity = RARITIES[item.rarity];
      return `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${REWARD_TYPE_LABELS[item.type] ?? item.type}</td>
            <td style="color: ${rarity.color}; font-weight: bold;">${rarity.label}</td>
            <td>${'★'.repeat(rarity.stars)}</td>
            <td>${item.obtainedAt ? item.obtainedAt.toLocaleDateString('es-ES') : 'N/A'}</td>
          </tr>
        `;
    })
    .join('');

  return `
        <html>
          <head>
            <meta charset="utf-8" />
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
            <p style="color: #666; font-size: 14px;">Reclamado el ${formatClaimDate()}</p>
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
}

function buildCertificateText(items: InventoryItem[]) {
  const line = '═'.repeat(31);
  const divider = '─'.repeat(31);

  const itemLines = items
    .map((item, idx) => {
      const rarity = RARITIES[item.rarity];
      const stars = '★'.repeat(rarity.stars);
      const obtained = item.obtainedAt ? item.obtainedAt.toLocaleDateString('es-ES') : 'N/A';
      return `${idx + 1}. ${item.name} — ${REWARD_TYPE_LABELS[item.type] ?? item.type} — ${rarity.label} ${stars}\n   Obtenido: ${obtained}`;
    })
    .join('\n\n');

  return [
    line,
    '   EINHERJAR BLITZ',
    '   Certificado de Recompensas',
    line,
    '',
    `Reclamado el: ${formatClaimDate()}`,
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
}

export const InventorySheet = memo(function InventorySheet({ visible, onClose }: InventorySheetProps) {
  const dialog = useDialog();
  const { items, grouped, loading, count } = useInventory();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [claiming, setClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [savedFileType, setSavedFileType] = useState<'pdf' | 'txt' | null>(null);

  const filtered = useMemo(() => {
    const list = [...grouped].sort((a, b) => {
      const ra = RARITY_ORDER.indexOf(a.rarity);
      const rb = RARITY_ORDER.indexOf(b.rarity);
      if (ra !== rb) return ra - rb;
      return (b.obtainedAt?.getTime() ?? 0) - (a.obtainedAt?.getTime() ?? 0);
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

  // Preserve the reward ledger and only transition active items to claimed.
  const markInventoryClaimed = async (format: 'pdf' | 'txt') => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Debes iniciar sesión para reclamar.');
    await markInventoryItemsClaimed(uid, items.map((item) => item.id), format);
  };

  const handleClaimAll = () => {
    if (!auth.currentUser) {
      void dialog.alert('Error', 'Debes iniciar sesión para reclamar.');
      return;
    }
    if (items.length === 0) return;
    setShowClaimModal(true);
  };

  // ─── Option 1: PDF through the browser print dialog ──────────────────
  const runClaimPdf = async () => {
    if (items.length === 0) return;
    setShowClaimModal(false);
    setClaiming(true);
    try {
      await printHtml(buildCertificateHtml(items), `einherjar-certificado-${Date.now()}`);
      // Browsers don't report whether the PDF was saved, so ask.
      const saved = await dialog.confirm(
        '¿Guardaste el certificado?',
        'Confirma solo si guardaste el PDF. Si cancelaste la impresión, tus recompensas seguirán disponibles para reclamar.',
        { confirmText: 'Sí, lo guardé', cancelText: 'No' }
      );
      if (!saved) return;
      await markInventoryClaimed('pdf');
      setSavedFileType('pdf');
    } catch (error) {
      console.error('Error al reclamar todo (PDF):', error);
      void dialog.alert('Error', 'No se pudo completar la reclamación.');
    } finally {
      setClaiming(false);
    }
  };

  // ─── Option 2: plain-text certificate download ───────────────────────
  const runClaimText = async () => {
    if (items.length === 0) return;
    setShowClaimModal(false);
    setClaiming(true);
    try {
      downloadTextFile(`einherjar-recompensas-${Date.now()}.txt`, buildCertificateText(items));
      await markInventoryClaimed('txt');
      setSavedFileType('txt');
    } catch (error) {
      console.error('Error al reclamar todo (texto):', error);
      void dialog.alert('Error', 'No se pudo completar la reclamación.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        label="Inventario"
        variant="sheet"
        locked={claiming}
        // Fixed height: switching filters or finishing the load never makes the sheet jump.
        className="h-[88dvh] sm:h-[min(88dvh,760px)]"
      >
        <div className="flex items-start justify-between px-6 pb-2 pt-5">
          <div>
            <h2 className="font-title text-2xl tracking-wide text-gold">Inventario</h2>
            <p className="mt-0.5 text-[13px] text-white/50">
              <AnimatedNumber
                value={count}
                // Counts up as the sheet opens; reduced motion shows the total straight away.
                from={reduceMotion ? undefined : 0}
                duration={0.8}
                className="tabular-nums"
              />{' '}
              objetos obtenidos
            </p>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            whileTap={{ scale: 0.9, rotate: -90 }}
            transition={SPRINGS.snappy}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/90 transition-colors hover:bg-white/10',
              FOCUS_RING
            )}
            aria-label="Cerrar inventario"
          >
            <Icon name="close" size={24} />
          </motion.button>
        </div>

        <InventoryFilters filter={filter} onChange={setFilter} countsByRarity={countsByRarity} />

        <div className="juego-scroll min-h-[240px] flex-1 overflow-y-auto px-6 pb-4 pt-2">
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MiniLoader />
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRINGS.soft}
              >
                <EmptyState
                  icon="cube-outline"
                  title="Inventario vacío"
                  description="Invoca en el Altar para obtener tus primeras recompensas."
                />
              </motion.div>
            ) : (
              <motion.div key="grid" exit={{ opacity: 0 }}>
                <InventoryGrid items={filtered} filterKey={filter} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {count > 0 && (
          <div className="border-t border-gold/20 px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            <motion.button
              type="button"
              onClick={handleClaimAll}
              disabled={claiming}
              whileTap={claiming ? undefined : { scale: 0.97 }}
              transition={SPRINGS.snappy}
              className={cn(
                'juego-sheen relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gold text-sm font-bold tracking-[0.15em] text-ink-deep transition-[filter] hover:brightness-110 disabled:opacity-60',
                FOCUS_RING
              )}
            >
              {claiming ? <ProcessingShimmer /> : null}
              {claiming ? (
                <span className="relative">
                  <ProcessingLabel text="RECLAMANDO" />
                </span>
              ) : (
                <>
                  <Icon name="document-text-outline" size={18} />
                  RECLAMAR TODO
                </>
              )}
            </motion.button>
          </div>
        )}
      </Modal>

      {/* ─── Claim choice: PDF or plain text ─── */}
      <Modal visible={showClaimModal} onClose={() => setShowClaimModal(false)} label="Reclamar recompensas">
        <h2 className="text-center font-title text-lg tracking-wide text-gold">Reclamar recompensas</h2>
        <p className="mt-1 text-center text-[13px] text-white/60">Elige cómo quieres recibir tu certificado</p>

        <div className="mt-5 flex flex-col">
          <ChoiceOption
            icon="document-text-outline"
            title="Guardar como PDF"
            description="Documento con tabla de recompensas (elige «Guardar como PDF» al imprimir)"
            onClick={runClaimPdf}
          />
          <span className="my-1 h-px bg-white/10" />
          <ChoiceOption
            icon="download-outline"
            title="Descargar texto"
            description="Resumen en texto plano (.txt), compatible con cualquier dispositivo"
            onClick={runClaimText}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowClaimModal(false)}
          className="mt-4 min-h-11 w-full text-sm font-bold text-white/60 hover:text-white"
        >
          Cancelar
        </button>
      </Modal>

      {/* ─── Success: certificate saved ─── */}
      <Modal visible={savedFileType !== null} onClose={() => setSavedFileType(null)} label="Certificado guardado">
        <div className="flex flex-col items-center text-center">
          <span className="relative flex">
            <ParticleBurst burstKey={savedFileType ? 1 : null} count={16} distance={[40, 90]} size={[3, 5]} />
            <motion.span
              className="relative flex"
              initial={{ scale: 0.3, rotate: -40, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ ...SPRINGS.bouncy, delay: 0.1 }}
            >
              <Icon name="checkmark-circle" size={56} color="#c9aa71" />
            </motion.span>
          </span>
          <h2 className="mt-3 font-title text-lg tracking-wide text-gold">¡Certificado guardado!</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-white/60">
            {savedFileType === 'txt'
              ? 'El archivo se descargó en la carpeta de descargas de tu navegador.'
              : 'Tu certificado quedó guardado donde elegiste en el diálogo de impresión.'}
          </p>
          <p className="mt-2 text-xs font-bold tracking-wider text-white/40">
            {savedFileType === 'pdf' ? 'Documento PDF' : 'Archivo de texto (.txt)'}
          </p>
          <button
            type="button"
            onClick={() => setSavedFileType(null)}
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-gold text-sm font-bold tracking-[0.15em] text-ink-deep hover:brightness-110"
          >
            LISTO
          </button>
        </div>
      </Modal>
    </>
  );
});

function ChoiceOption({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10">
        <Icon name={icon} size={24} color="#c9aa71" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-white/95">{title}</span>
        <span className="block text-xs leading-4 text-white/50">{description}</span>
      </span>
      <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
    </button>
  );
}

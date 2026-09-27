'use client';

/**
 * InventorySheet — Full-screen sheet listing the user's gacha rewards,
 * grouped by name + rarity, with rarity filters and a "claim all" flow.
 *
 * Claiming produces a certificate (PDF through the print dialog, or a .txt
 * download). Items are marked as claimed only after the file is available.
 */

import { useMemo, useState } from 'react';
import { auth } from '@/config/firebase';
import { RARITIES, REWARDS_TABLE, type RarityKey } from '@/constants/gachaData';
import { useInventory } from '@/hooks/useInventory';
import { markInventoryItemsClaimed, type InventoryItem } from '@/services/inventory';
import { downloadTextFile, escapeHtml, printHtml } from '@/services/fileExport';
import { useDialog } from '@/providers/DialogProvider';
import { cn } from '@/lib/utils';
import { EmptyState } from '../EmptyState';
import { Icon } from '../Icon';
import { MiniLoader } from '../MiniLoader';
import { Modal } from '../Modal';

// Build a name → reward lookup so we can resolve the local image & fallback icon.
const REWARD_BY_NAME = new Map(REWARDS_TABLE.map((reward) => [reward.name, reward]));

const RARITY_ORDER: RarityKey[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];

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
            <td style="text-transform: capitalize;">${item.type}</td>
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
      return `${idx + 1}. ${item.name} — ${item.type} — ${rarity.label} ${stars}\n   Obtenido: ${obtained}`;
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

export function InventorySheet({ visible, onClose }: InventorySheetProps) {
  const dialog = useDialog();
  const { items, grouped, loading, count } = useInventory();
  const [filter, setFilter] = useState<RarityKey | 'all'>('all');
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
      <Modal visible={visible} onClose={onClose} label="Inventario" variant="sheet" locked={claiming}>
        <div className="flex items-start justify-between px-6 pb-3 pt-5">
          <div>
            <h2 className="font-title text-2xl tracking-wide text-gold">Inventario</h2>
            <p className="mt-0.5 text-[13px] text-white/50">{count} objetos obtenidos</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
            aria-label="Cerrar inventario"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 px-6 pb-4" role="group" aria-label="Filtrar por rareza">
          <FilterChip label="Todos" active={filter === 'all'} onClick={() => setFilter('all')} color="#c9aa71" />
          {RARITY_ORDER.map((r) => {
            const cfg = RARITIES[r];
            const c = countsByRarity[r] || 0;
            if (c === 0) return null;
            return (
              <FilterChip
                key={r}
                label={`${cfg.label} · ${c}`}
                active={filter === r}
                onClick={() => setFilter(r)}
                color={cfg.color}
              />
            );
          })}
        </div>

        <div className="juego-scroll min-h-[240px] flex-1 overflow-y-auto px-6 pb-4">
          {loading ? (
            <MiniLoader />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="Inventario vacío"
              description="Invoca en el Altar para obtener tus primeras recompensas."
            />
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((item) => {
                const rarity = RARITIES[item.rarity];
                const reward = REWARD_BY_NAME.get(item.name);
                return (
                  <li
                    key={item.id}
                    className="overflow-hidden rounded-xl border bg-ink/85"
                    style={{ borderColor: rarity.color }}
                  >
                    <div className="relative aspect-square">
                      {reward?.image ? (
                        <img src={reward.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: rarity.glowColor }}>
                          <Icon name={reward?.fallbackIcon || 'cube'} size={40} color={rarity.color} />
                        </div>
                      )}
                      <span className="absolute inset-x-0 bottom-0 h-[30px] opacity-50" style={{ backgroundColor: rarity.glowColor }} />
                      {item.count > 1 && (
                        <span className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/75 px-2 py-0.5 text-xs font-bold text-white">
                          x{item.count}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 text-center">
                      <span className="flex gap-0.5">
                        {Array.from({ length: rarity.stars }).map((_, i) => (
                          <Icon key={i} name="star" size={9} color={rarity.color} />
                        ))}
                      </span>
                      <span className="line-clamp-2 text-[13px] font-bold leading-4" style={{ color: rarity.color }}>
                        {item.name}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {count > 0 && (
          <div className="border-t border-gold/20 px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              onClick={handleClaimAll}
              disabled={claiming}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-bold tracking-[0.15em] text-ink-deep transition hover:brightness-110 disabled:opacity-60"
            >
              {claiming ? (
                'RECLAMANDO...'
              ) : (
                <>
                  <Icon name="document-text-outline" size={18} />
                  RECLAMAR TODO
                </>
              )}
            </button>
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
          <Icon name="checkmark-circle" size={56} color="#c9aa71" />
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
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-8 rounded-full border px-3 text-xs font-bold tracking-wide transition',
        active ? 'text-ink-deep' : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
      )}
      style={active ? { backgroundColor: color, borderColor: color } : undefined}
    >
      {label}
    </button>
  );
}

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

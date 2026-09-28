'use client';

import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Coins,
  Download,
  Droplets,
  Gift,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ALBUM_FAMILIES, type AlbumFamilyId } from '@/lib/agroAlbum';
import {
  BASE_ODDS,
  DAILY_ACTION_LIMIT,
  DAILY_COIN_LIMIT,
  PITY_LIMITS,
  PLANTS,
  RARITIES,
  TEN_DRAW_COST,
  canFuse,
  cultivatedCount,
  dailyUsage,
  eventDay,
  formatDuration,
  fusionPartner,
  getPlant,
  isMature,
  nextCoinIn,
  readyCoins,
  type AgroVoucher,
  type FarmAction,
  type FarmPlot,
} from '@/lib/agroGame';
import { AgroConnection, useAgro } from './AgroProvider';
import { AgroDialog } from './AgroDialog';

const number = (value: number) => value.toLocaleString('es-AR');
function PlantArt({
  id,
  className = '',
  priority = false,
}: {
  id: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={getPlant(id).image}
      alt=""
      width={700}
      height={700}
      sizes={
        priority
          ? '(max-width: 900px) 90vw, 550px'
          : '(max-width: 640px) 160px, 240px'
      }
      priority={priority}
      className={className}
    />
  );
}
function PlotCard({
  plot,
  index,
  selected,
  onConfirm,
}: {
  plot: FarmPlot | null;
  index: number;
  selected: string;
  onConfirm: (action: FarmAction) => void;
}) {
  const { farm, now, busy, act } = useAgro();
  if (!farm) return null;
  const usage = dailyUsage(farm, now);
  const actionsFull = usage.actions >= DAILY_ACTION_LIMIT;
  const coinsLeft = Math.max(0, DAILY_COIN_LIMIT - usage.earned);
  if (!plot) {
    const available = farm.seeds[selected] > 0;
    return (
      <button
        type="button"
        className="agro-plot agro-plot-empty"
        disabled={busy || actionsFull || !available}
        onClick={() => void act({ type: 'plant', index, plantId: selected })}
        aria-label={`Plantar ${getPlant(selected).name} en parcela ${index + 1}`}
      >
        <span className="agro-plot-index">PARCELA 0{index + 1}</span>
        <span className="agro-empty-mark">
          <Plus size={28} />
        </span>
        <strong>{available ? 'Plantar semilla' : 'Parcela vacía'}</strong>
        <small>
          {available
            ? getPlant(selected).name
            : 'Elige una semilla del semillero'}
        </small>
      </button>
    );
  }
  const plant = getPlant(plot.plantId);
  const mature = isMature(plot);
  const ready = readyCoins(plot, now);
  const partnerIndex = fusionPartner(farm, index);
  const fusionReady =
    ready +
    (partnerIndex >= 0 ? readyCoins(farm.plots[partnerIndex]!, now) : 0);
  const wait = Math.max(0, plot.nextWaterAt - now);
  const maxBonus = plant.family === 'brasas' ? 6 : 3;
  return (
    <article
      className={`agro-plot agro-plot-planted${mature ? ' is-mature' : ''}`}
      style={{ '--plant-color': plant.color } as CSSProperties}
      aria-label={`Parcela ${index + 1}: ${plant.name}`}
    >
      <div className="agro-plot-topline">
        <span className="agro-plot-index">PARCELA 0{index + 1}</span>
        <span className="agro-rarity-pill">{plant.rarity}</span>
      </div>
      <div className={`agro-plot-art stage-${plot.waterings}`}>
        <div className="agro-plot-halo" />
        <PlantArt id={plant.id} className="agro-plant-image" />
      </div>
      <div className="agro-plot-copy">
        <h3>{plant.name}</h3>
        <p>
          {mature
            ? `+${plant.yield} cada ${plant.cycleMs / 1000} s · reserva ${plant.reserve} ciclos`
            : `Crecimiento · ${plot.waterings}/3 riegos`}
        </p>
      </div>
      <div
        className="agro-plot-meter"
        aria-label={`${plot.waterings} de 3 riegos`}
      >
        <span style={{ width: `${(plot.waterings / 3) * 100}%` }} />
      </div>
      <div className="agro-plot-yield">
        <span>
          <Coins size={16} />{' '}
          {ready
            ? `${number(ready)} listas`
            : mature
              ? `Próxima en ${formatDuration(nextCoinIn(plot, now))}`
              : 'Esperando crecer'}
        </span>
        {plot.bonusCycles > 0 && <small>+{plot.bonusCycles} riego</small>}
      </div>
      <div className="agro-plot-actions">
        <button
          type="button"
          className="agro-action-water"
          disabled={
            busy || actionsFull || wait > 0 || plot.bonusCycles >= maxBonus
          }
          onClick={() => void act({ type: 'water', index })}
        >
          <Droplets size={15} />
          {wait
            ? formatDuration(wait)
            : plot.bonusCycles >= maxBonus
              ? 'Bono lleno'
              : mature
                ? 'Regar + bono'
                : 'Regar'}
        </button>
        <button
          type="button"
          className="agro-action-harvest"
          disabled={busy || actionsFull || coinsLeft < 1 || ready < 1}
          onClick={() => void act({ type: 'harvest', index })}
        >
          Cosechar
        </button>
      </div>
      <div className="agro-plot-bottom">
        <button
          type="button"
          disabled={
            busy || actionsFull || !canFuse(farm, index) || fusionReady > coinsLeft
          }
          onClick={() =>
            onConfirm({
              type: 'fuse',
              index,
              partnerIndex,
            })
          }
        >
          <Sparkles size={14} />
          {plant.tier === 4 ? 'Crear sello' : 'Fusionar 2'}
        </button>
        <button
          type="button"
          disabled={busy || actionsFull || ready > coinsLeft}
          aria-label={`Retirar ${plant.name} de parcela ${index + 1}`}
          onClick={() => onConfirm({ type: 'uproot', index })}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

export function AgroEvent() {
  const { farm, now, local, busy, error, notice, act, refresh } = useAgro();
  const [family, setFamily] = useState<AlbumFamilyId>('alba');
  const [selected, setSelected] = useState('brote-bruma');
  const [results, setResults] = useState<string[] | null>(null);
  const [confirmation, setConfirmation] = useState<FarmAction | null>(null);
  const [voucher, setVoucher] = useState<AgroVoucher | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  if (!farm) return <AgroConnection />;
  const usage = dailyUsage(farm, now);
  const coinsLeft = Math.max(0, DAILY_COIN_LIMIT - usage.earned);
  const actionsFull = usage.actions >= DAILY_ACTION_LIMIT;
  const voucherLeft = Math.max(0, DAILY_COIN_LIMIT - usage.redeemed);
  const voucherAmount = Math.min(farm.coins, voucherLeft);
  const count = cultivatedCount(farm);
  const readyTotal = farm.plots.reduce(
    (sum, plot) => sum + (plot ? readyCoins(plot, now) : 0),
    0,
  );
  const freeReady = now >= farm.nextFreeDrawAt;
  const familyPlants = PLANTS.filter((plant) => plant.family === family);
  const confirmPlant =
    confirmation && 'index' in confirmation && farm.plots[confirmation.index]
      ? getPlant(farm.plots[confirmation.index]!.plantId)
      : null;
  const fusedPlant =
    confirmPlant && confirmPlant.tier < 4
      ? PLANTS.find(
          (plant) =>
            plant.family === confirmPlant.family &&
            plant.tier === confirmPlant.tier + 1,
        )
      : null;
  const chooseFamily = (id: AlbumFamilyId) => {
    setFamily(id);
    setSelected(
      PLANTS.find((plant) => plant.family === id && farm.seeds[plant.id] > 0)
        ?.id || PLANTS.find((plant) => plant.family === id)!.id,
    );
  };
  const draw = async (amount: 1 | 10) => {
    const outcome = await act({ type: 'draw', count: amount, family });
    if (outcome?.results) {
      setResults(outcome.results);
      setSelected(outcome.results[0]);
    }
  };
  const confirm = async () => {
    if (!confirmation) return;
    const outcome = await act(confirmation);
    if (outcome) {
      setConfirmation(null);
      if (outcome.results) setResults(outcome.results);
      if (outcome.voucher) setVoucher(outcome.voucher);
    }
  };
  return (
    <div className="agro-page">
      <div className="agro-page-glow" />
      <header className="agro-header">
        <div className="agro-header-inner">
          <Link href="/" className="agro-brand">
            EINHERJAR <em>BLITZ</em>
          </Link>
          <nav className="agro-nav" aria-label="Evento">
            <a href="#huerto">Huerto</a>
            <Link href="/evento/agro/album">Álbum</Link>
            <a href="#canje">Canje</a>
          </nav>
          <Link href="/" className="agro-back">
            <ArrowLeft size={15} /> Inicio
          </Link>
        </div>
      </header>
      <main className="agro-main">
        {local && (
          <p className="agro-environment">
            Vista local del evento · Los vales de esta versión son de
            demostración.
          </p>
        )}
        {error && (
          <div className="agro-error" role="alert">
            {error}
            <button type="button" onClick={() => void refresh()}>
              Actualizar partida
            </button>
          </div>
        )}
        <section className="agro-hero" aria-labelledby="agro-title">
          <div>
            <p className="agro-eyebrow">
              <span /> EVENTO AGROPECUARIO
            </p>
            <h1 id="agro-title">
              El Huerto de <em>Yggdrasil</em>
            </h1>
            <p className="agro-hero-intro">
              Tres linajes, quince vidas por descubrir. Cultiva tu jardín,
              fusiona sus secretos y convierte cada cosecha en monedas para tu
              comunidad.
            </p>
            <div className="agro-hero-actions">
              <a href="#huerto" className="agro-primary-link">
                Entrar al huerto <ArrowRight size={18} />
              </a>
              <Link href="/evento/agro/album" className="agro-text-link">
                Abrir mi herbario · {count}/15
              </Link>
            </div>
            <div className="agro-hero-stats">
              <div>
                <strong>{number(farm.coins)}</strong>
                <span>Monedas para canjear</span>
              </div>
              <div>
                <strong>{number(farm.pollen)}</strong>
                <span>Polen para invocar</span>
              </div>
              <div>
                <strong>{count}/15</strong>
                <span>Especies cultivadas</span>
              </div>
            </div>
          </div>
          <div className="agro-hero-visual">
            <div className="agro-hero-disc" />
            <div className="agro-orbit" />
            <PlantArt id="arbol-alba" className="agro-hero-tree" priority />
            <div className="agro-hero-caption">
              <span>V</span>
              <strong>ÁRBOL DEL ALBA</strong>
              <small>Una semilla. Todo un mundo por crecer.</small>
            </div>
          </div>
        </section>

        <section
          className="agro-field"
          id="huerto"
          aria-labelledby="field-title"
        >
          <div className="agro-section-heading">
            <div>
              <p className="agro-eyebrow">
                <span /> TU PEQUEÑO REINO
              </p>
              <h2 id="field-title">Mi huerto</h2>
              <p>
                Selecciona una semilla y una parcela. Tres riegos la hacen
                crecer; tus plantas nunca se marchitan.
              </p>
            </div>
            <button
              type="button"
              className="agro-harvest-all"
              disabled={busy || actionsFull || coinsLeft < 1 || readyTotal < 1}
              onClick={() => void act({ type: 'harvestAll' })}
            >
              <Coins size={17} /> Cosechar todo{' '}
              <span>{number(Math.min(readyTotal, coinsLeft))}</span>
            </button>
          </div>
          <aside className="agro-daily-limits" aria-label="Límites diarios del huerto">
            <div>
              <span>Monedas cosechadas hoy</span>
              <strong>
                {number(usage.earned)} / {number(DAILY_COIN_LIMIT)}
              </strong>
            </div>
            <div>
              <span>Acciones hoy</span>
              <strong>
                {number(usage.actions)} / {number(DAILY_ACTION_LIMIT)}
              </strong>
            </div>
            <p>
              Cupos vinculados a tu cuenta. Se reinician a las 00:00 de
              Argentina; la cosecha pendiente permanece en las plantas.
            </p>
          </aside>
          <div
            className="agro-family-tabs"
            role="group"
            aria-label="Linaje para invocar y seleccionar semillas"
          >
            {ALBUM_FAMILIES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={family === item.id}
                onClick={() => chooseFamily(item.id)}
              >
                <strong>{item.name}</strong>
                <small>{item.trait}</small>
              </button>
            ))}
          </div>
          <div className="agro-content-grid">
            <div>
              <div className="agro-plots" id="parcelas">
                {farm.plots.map((plot, index) => (
                  <PlotCard
                    key={index}
                    plot={plot}
                    index={index}
                    selected={selected}
                    onConfirm={setConfirmation}
                  />
                ))}
              </div>
              <Link className="agro-album-banner" href="/evento/agro/album">
                <BookOpen size={25} />
                <span>
                  <strong>Tu herbario está creciendo</strong>
                  <small>
                    {count} de 15 láminas cultivadas · Recompensas en 3, 6, 9,
                    12 y 15
                  </small>
                </span>
                <ArrowRight size={22} />
              </Link>
            </div>
            <aside className="agro-side">
              <section className="agro-altar" aria-labelledby="altar-title">
                <div className="agro-side-head">
                  <Sparkles size={15} /> ALTAR DE SEMILLAS
                </div>
                <div className="agro-altar-art">
                  <div className="agro-altar-ring" />
                  <PlantArt
                    id={familyPlants[2].id}
                    className="agro-altar-plant"
                  />
                </div>
                <h3 id="altar-title">Invoca un nuevo brote</h3>
                <p>
                  Las semillas pertenecen al linaje elegido. Tienes{' '}
                  <strong>{number(farm.pollen)} de polen</strong>.
                </p>
                {PITY_LIMITS.map((limit, i) => (
                  <div key={limit}>
                    <div className="agro-pity">
                      <span>{RARITIES[i + 1]} o superior</span>
                      <strong>≤ {limit - farm.pity[i]} tiradas</strong>
                    </div>
                    <div className="agro-pity-track">
                      <span
                        style={{ width: `${(farm.pity[i] / limit) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="agro-draw-main"
                  disabled={
                    busy || actionsFull || (!freeReady && farm.pollen < 1)
                  }
                  onClick={() => void draw(1)}
                >
                  <Sparkles size={17} />
                  {freeReady ? 'Invocar gratis' : 'Invocar · 1 polen'}
                </button>
                <p className="agro-free-countdown">
                  {freeReady
                    ? 'Una invocación gratis cada minuto'
                    : `Próxima gratis en ${formatDuration(farm.nextFreeDrawAt - now)}`}
                </p>
                <button
                  type="button"
                  className="agro-draw-ten"
                  disabled={busy || actionsFull || farm.pollen < TEN_DRAW_COST}
                  onClick={() => void draw(10)}
                >
                  Invocar 10 · {TEN_DRAW_COST} polen
                </button>
                <button
                  type="button"
                  className="agro-draw-ten"
                  disabled={
                    busy || actionsFull || farm.lastDailyGift === eventDay(now)
                  }
                  onClick={() => void act({ type: 'daily' })}
                >
                  <Gift size={15} />{' '}
                  {farm.lastDailyGift === eventDay(now)
                    ? 'Regalo diario recogido'
                    : 'Recoger regalo · +5 polen'}
                </button>
                <details className="agro-odds">
                  <summary>Probabilidades y garantías</summary>
                  <ul>
                    {BASE_ODDS.map((chance, index) => (
                      <li key={chance}>
                        <span>{RARITIES[index]}</span>
                        <strong>{chance}</strong>
                      </li>
                    ))}
                  </ul>
                  <p>
                    Probabilidades base. Las garantías elevan la rareza mínima.
                    Todos los linajes comparten contadores; obtener una rareza
                    reinicia su contador y los inferiores. Las tiradas gratis
                    también cuentan.
                  </p>
                </details>
              </section>
              <section className="agro-shelf" id="semillero">
                <div className="agro-side-head">SEMILLERO DEL LINAJE</div>
                <h3>Elige qué plantar</h3>
                <p>
                  Las semillas repetidas sirven para cultivar parejas y
                  fusionarlas.
                </p>
                <div className="agro-seed-list">
                  {familyPlants.map((plant) => (
                    <button
                      type="button"
                      key={plant.id}
                      className={`agro-seed${selected === plant.id ? ' is-selected' : ''}`}
                      style={{ '--plant-color': plant.color } as CSSProperties}
                      disabled={farm.seeds[plant.id] < 1}
                      aria-pressed={selected === plant.id}
                      onClick={() => setSelected(plant.id)}
                    >
                      <PlantArt id={plant.id} className="agro-seed-art" />
                      <span>
                        <strong>{plant.name}</strong>
                        <small>{plant.rarity}</small>
                      </span>
                      <b>×{farm.seeds[plant.id]}</b>
                    </button>
                  ))}
                </div>
                <a href="#parcelas" className="agro-seed-jump">Ir a las parcelas <ArrowRight size={16} aria-hidden="true" /></a>
              </section>
            </aside>
          </div>
        </section>

        <section className="agro-guide" id="como-jugar">
          <div className="agro-section-heading">
            <div>
              <p className="agro-eyebrow">
                <span /> DE SEMILLA A LEYENDA
              </p>
              <h2>Tu primera cosecha</h2>
            </div>
            <a
              href="/evento-agro/guia-del-grupo.txt"
              download
              className="agro-text-link"
            >
              Descargar guía para el grupo
            </a>
          </div>
          <ol className="agro-guide-steps">
            <li>
              <span>01</span>
              <h3>Invoca y planta</h3>
              <p>
                Empiezas con una semilla común de cada linaje y 5 de polen.
                Elige una de tus seis parcelas.
              </p>
            </li>
            <li>
              <span>02</span>
              <h3>Riega y cosecha</h3>
              <p>
                Da tres riegos separados por 8 segundos. Al madurar, recoge
                monedas y hasta 1 polen por parcela cada minuto.
              </p>
            </li>
            <li>
              <span>03</span>
              <h3>Fusiona y colecciona</h3>
              <p>
                Dos plantas maduras idénticas crean la siguiente rareza del
                mismo linaje. La nueva planta necesita tres riegos.
              </p>
            </li>
            <li>
              <span>04</span>
              <h3>Comparte tu cosecha</h3>
              <p>
                Convierte tu saldo en un PDF, envíalo al grupo y espera el canje
                manual del administrador.
              </p>
            </li>
          </ol>
          <details className="agro-rules">
            <summary>Linajes, reservas y cuidado del progreso</summary>
            <p>
              <strong>Alba:</strong> produce cada 60 segundos.{' '}
              <strong>Escarcha:</strong> produce cada 75 segundos y guarda 480
              ciclos (10 horas). <strong>Brasas:</strong> produce cada 75
              segundos y cada riego maduro suma dos ciclos de bono. Alba y
              Brasas guardan 120 ciclos (2 h y 2 h 30 min). El bono acumula
              hasta tres riegos.
            </p>
            <p>
              Las rarezas producen 1, 2, 5, 12 y 28 monedas por ciclo. La
              reserva sigue creciendo con la página cerrada hasta su límite. El
              polen se entrega al cosechar; los minutos ausentes no acumulan
              polen.
            </p>
            <p>
              Con tres cosechas de una especie obtienes su sello de maestría.
              Dos míticas maduras idénticas permiten crear un sello de linaje:
              conservas una mítica madura. Los sellos son decorativos.
            </p>
            <p>
              Tu huerto y sus cupos se vinculan a tu cuenta de Einherjar Blitz.
              Puedes continuar desde otro navegador con la misma cuenta. El
              regalo diario vuelve a las 00:00 de Argentina; no hay rachas que
              perder. Cada cuenta puede cosechar hasta 2.000 monedas, emitir
              vales por hasta 2.000 monedas y completar 500 acciones por día.
              Los tres cupos se reinician a la misma hora.
            </p>
          </details>
        </section>

        <section className="agro-redeem" id="canje">
          <div className="agro-redeem-copy">
            <p className="agro-eyebrow">
              <span /> EL FRUTO DE TU CUIDADO
            </p>
            <h2>
              Tu cosecha tiene <em>recompensa.</em>
            </h2>
            <p>
              Emite un vale con tu nombre del grupo. Se reservan hasta 2.000
              monedas en vales por día; el saldo restante queda para mañana.
              Puedes descargar cada PDF tantas veces como necesites.
            </p>
            <p className="agro-redeem-note">
              Envía el PDF a Messenger. El administrador consulta el importe y
              registra un único canje antes de acreditar tus monedas.
            </p>
            <Link href="/evento/agro/canje" className="agro-text-link">
              Consultar un folio
            </Link>
          </div>
          <form
            className="agro-voucher-card"
            onSubmit={(event) => {
              event.preventDefault();
              setConfirmation({
                type: 'voucher',
                playerName: (playerName ?? farm.playerName).trim(),
              });
            }}
          >
            <div className="agro-voucher-top">
              <span>EINHERJAR BLITZ</span>
              <span>VALE DE COSECHA</span>
            </div>
            <div className="agro-voucher-amount">
              <strong>{number(voucherAmount)}</strong>
              <span>
                monedas para el próximo vale · {number(usage.redeemed)} /{' '}
                {number(DAILY_COIN_LIMIT)} emitidas hoy
              </span>
            </div>
            <label htmlFor="agro-player">
              Tu nombre en el grupo de Messenger
            </label>
            <input
              id="agro-player"
              name="playerName"
              autoComplete="nickname"
              required
              minLength={2}
              maxLength={48}
              value={playerName ?? farm.playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Nombre con el que te conocen"
            />
            <button
              type="submit"
              className="agro-voucher-button"
              disabled={busy || actionsFull || voucherAmount < 1}
            >
              <Download size={18} /> Preparar vale PDF
            </button>
            <small>
              {local
                ? 'Este entorno emite muestras locales sin validez de canje.'
                : 'Se reservará el importe mostrado. El saldo que exceda el cupo seguirá disponible mañana. Descargar otra vez no crea un nuevo vale.'}
            </small>
          </form>
        </section>
        {farm.vouchers.length > 0 && (
          <section className="agro-history">
            <div className="agro-section-heading">
              <div>
                <p className="agro-eyebrow">
                  <span /> TUS COMPROBANTES
                </p>
                <h2>Historial de vales</h2>
              </div>
            </div>
            <ul>
              {farm.vouchers.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>
                      {number(item.amount)} monedas ·{' '}
                      {item.redeemedAt ? 'Canjeado' : 'Pendiente'}
                    </strong>
                    <span>{item.id}</span>
                  </div>
                  <button onClick={() => setVoucher(item)}>
                    <Download size={16} /> Abrir PDF
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <footer className="agro-footer">
        <span>Einherjar Blitz · El Huerto de Yggdrasil</span>
        <Link href="/evento/agro/album">Mi herbario</Link>
        <a href="#como-jugar">Cómo jugar</a>
      </footer>
      <div className="agro-notice" role="status" aria-live="polite">
        {notice}
      </div>
      <AgroDialog
        open={!!results}
        title={results?.length === 1 ? 'Una nueva vida' : 'Diez nuevas vidas'}
        onClose={() => setResults(null)}
      >
        <div
          className={
            results?.length === 1 ? 'agro-reveal-single' : 'agro-reveal-grid'
          }
        >
          {results?.map((id, i) => (
            <div
              key={`${id}-${i}`}
              style={{ '--plant-color': getPlant(id).color } as CSSProperties}
            >
              <PlantArt
                id={id}
                className={
                  results.length === 1
                    ? 'agro-reveal-art'
                    : 'agro-reveal-grid-art'
                }
              />
              <strong>{getPlant(id).name}</strong>
              <span>{getPlant(id).rarity}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="agro-draw-main"
          onClick={() => setResults(null)}
        >
          Ir al semillero <ArrowRight size={17} />
        </button>
      </AgroDialog>
      <AgroDialog
        open={!!confirmation}
        title={
          confirmation?.type === 'voucher'
            ? 'Emitir tu vale'
            : confirmation?.type === 'uproot'
              ? 'Retirar esta planta'
              : confirmPlant?.tier === 4
                ? 'Crear sello de linaje'
                : 'Fusionar dos plantas'
        }
        onClose={() => setConfirmation(null)}
      >
        {confirmation?.type === 'voucher' ? (
          <p>
            Vas a reservar <strong>{number(voucherAmount)} monedas</strong> a
            nombre de <strong>{confirmation.playerName}</strong>. El saldo
            quedará en un folio que podrás descargar desde tu historial.
          </p>
        ) : confirmation?.type === 'uproot' ? (
          <p>
            Retirarás <strong>{confirmPlant?.name}</strong> y liberarás su
            parcela. La semilla se consume; su lámina permanece en el álbum.
            Recogemos antes la cosecha disponible.
          </p>
        ) : (
          <>
            <div className="agro-fusion-preview">
              {confirmPlant && (
                <PlantArt
                  id={confirmPlant.id}
                  className="agro-reveal-grid-art"
                />
              )}
              <span>× 2 →</span>
              {fusedPlant ? (
                <PlantArt id={fusedPlant.id} className="agro-reveal-grid-art" />
              ) : (
                <Sparkles size={50} />
              )}
            </div>
            <p>
              {fusedPlant
                ? `Obtendrás ${fusedPlant.name}. Las dos plantas originales se consumen y la nueva necesita tres riegos.`
                : 'Conservarás una mítica madura y obtendrás el sello decorativo de su linaje. La segunda planta se consume.'}{' '}
              La cosecha pendiente se recoge automáticamente.
            </p>
          </>
        )}
        {error && (
          <p className="agro-inline-error" role="alert">
            {error}
          </p>
        )}
        <div className="agro-confirm-actions">
          <button
            type="button"
            className="agro-draw-ten"
            disabled={busy}
            onClick={() => setConfirmation(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="agro-draw-main"
            disabled={
              busy ||
              actionsFull ||
              (confirmation?.type === 'voucher' && voucherAmount < 1)
            }
            onClick={() => void confirm()}
          >
            {busy ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </AgroDialog>
      <AgroDialog
        open={!!voucher}
        title="Tu vale de cosecha"
        onClose={() => setVoucher(null)}
      >
        {voucher && (
          <>
            <div className="agro-voucher-amount">
              <strong>{number(voucher.amount)}</strong>
              <span>monedas · {voucher.playerName}</span>
            </div>
            <p className="agro-folio">{voucher.id}</p>
            <p>
              Guarda el PDF y preséntalo en el grupo. El folio solo puede
              canjearse una vez.
            </p>
            {voucher.environment === 'local' && (
              <p className="agro-environment">
                Demostración local sin validez de canje.
              </p>
            )}
            <a
              className="agro-voucher-button"
              href={`/api/agro/vale?id=${voucher.id}`}
            >
              <Download size={18} /> Descargar PDF
            </a>
            <Link
              className="agro-text-link"
              href={`/evento/agro/canje?id=${voucher.id}`}
              onClick={() => setVoucher(null)}
            >
              Consultar estado del folio
            </Link>
          </>
        )}
      </AgroDialog>
    </div>
  );
}

'use client';

import { useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Flame, Snowflake, Sun } from 'lucide-react';
import {
  ALBUM_FAMILIES,
  ALBUM_MILESTONES,
  ALBUM_PLANTS,
  type AlbumFamilyId,
  type AlbumPlant,
} from '@/lib/agroAlbum';
import { cultivatedCount, getPlant } from '@/lib/agroGame';
import { AgroConnection, useAgro } from './AgroProvider';

function FamilyMark({ id, size = 19 }: { id: AlbumFamilyId; size?: number }) {
  const Icon = id === 'alba' ? Sun : id === 'escarcha' ? Snowflake : Flame;
  return <Icon size={size} strokeWidth={1.4} aria-hidden="true" />;
}

function PlantImage({
  plant,
  large = false,
  hidden = false,
}: {
  plant: AlbumPlant;
  large?: boolean;
  hidden?: boolean;
}) {
  return (
    <span
      className={`album-art${large ? ' album-art-large' : ''}${hidden ? ' is-undiscovered' : ''}`}
    >
      <span className="album-art-halo" aria-hidden="true" />
      <Image
        src={plant.image}
        alt=""
        width={700}
        height={700}
        sizes={
          large
            ? '(max-width: 900px) 300px, 440px'
            : '(max-width: 620px) 140px, 210px'
        }
        className="album-art-image"
      />
    </span>
  );
}

export function AgroAlbum() {
  const { farm, busy, error, notice, act } = useAgro();
  const [familyId, setFamilyId] = useState<AlbumFamilyId>('alba');
  const [selectedTier, setSelectedTier] = useState<AlbumPlant['tier']>(0);
  const [preview, setPreview] = useState(false);
  const [rewardChoice, setRewardChoice] = useState<AlbumFamilyId>('alba');
  if (!farm) return <AgroConnection />;
  const family = ALBUM_FAMILIES.find((item) => item.id === familyId)!;
  const plants = ALBUM_PLANTS.filter((plant) => plant.family === familyId);
  const selected = plants[selectedTier];
  const previous = selectedTier > 0 ? plants[selectedTier - 1] : null;
  const next = selectedTier < 4 ? plants[selectedTier + 1] : null;
  const progress = farm.album[selected.id];
  const known = preview || progress.discovered;
  const total = cultivatedCount(farm);
  const familyTotal = plants.filter(
    (plant) => farm.album[plant.id].cultivated,
  ).length;
  const stats = getPlant(selected.id);
  const status = (id: string) =>
    farm.album[id].harvests >= 3
      ? 'MAESTRÍA'
      : farm.album[id].cultivated
        ? 'CULTIVADA'
        : farm.album[id].discovered
          ? 'DESCUBIERTA'
          : 'POR DESCUBRIR';
  const style = { '--album-accent': family.accent } as CSSProperties;

  const chooseFamily = (id: AlbumFamilyId) => {
    setFamilyId(id);
    setSelectedTier(0);
  };

  return (
    <div
      className={`album-page album-theme-${farm.theme}${farm.claimedMilestones.includes(3) ? ' has-bronze-frame' : ''}${farm.claimedMilestones.includes(15) ? ' has-complete-cover' : ''}`}
      style={style}
    >
      <header className="album-topbar">
        <div className="album-topbar-inner">
          <Link href="/evento/agro" className="album-back">
            <ArrowLeft size={16} aria-hidden="true" /> Volver al huerto
          </Link>
          <span className="album-topbar-title">
            EINHERJAR <span>BLITZ</span>
          </span>
          <span className="album-topbar-note">
            {farm.claimedMilestones.includes(15)
              ? 'GUARDIÁN DE YGGDRASIL'
              : 'MI COLECCIÓN'}
          </span>
        </div>
      </header>

      <main className="album-main">
        <section className="album-intro" aria-labelledby="album-title">
          <div>
            <p className="album-kicker">
              <span /> LÁMINAS DEL HUERTO
            </p>
            <h1 id="album-title">
              Herbario de <em>Yggdrasil</em>
            </h1>
            <p className="album-intro-copy">
              Cada semilla tiene una historia. Elige un linaje, cultiva sus
              especies y completa sus cinco láminas.
            </p>
          </div>
          <div
            className="album-intro-count"
            aria-label={`${total} de 15 especies cultivadas`}
          >
            <strong>
              {total}
              <small>/15</small>
            </strong>
            <span>
              CULTIVADAS
              <br />3 LINAJES
            </span>
          </div>
        </section>
        <div className="album-toolbar">
          <label>
            <input
              type="checkbox"
              checked={preview}
              onChange={(event) => setPreview(event.target.checked)}
            />{' '}
            Ver todas las ilustraciones
          </label>
          <span>
            Descubre una semilla → cultívala con 3 riegos → logra maestría con 3
            cosechas.
          </span>
        </div>
        {error && (
          <p className="album-error" role="alert">
            {error}
          </p>
        )}

        <section className="album-book" aria-label="Álbum de plantas">
          <nav className="album-spine" aria-label="Linajes de plantas">
            <span className="album-spine-label">LINAJES</span>
            <div className="album-family-list">
              {ALBUM_FAMILIES.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`album-family-button${item.id === familyId ? ' is-current' : ''}`}
                  onClick={() => chooseFamily(item.id)}
                  aria-pressed={item.id === familyId}
                >
                  <span className="album-family-icon">
                    <FamilyMark id={item.id} />
                  </span>
                  <span className="album-family-text">
                    <small>LIN. 0{index + 1}</small>
                    <strong>{item.name}</strong>
                  </span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="album-spine-foot">
              <span className="album-spine-seal" aria-hidden="true">
                Y
              </span>
              <p>
                Una planta madura conserva su lugar en el herbario aunque se
                fusione.
              </p>
            </div>
          </nav>

          <div className="album-sheet">
            <header className="album-sheet-head">
              <div>
                <p className="album-sheet-eyebrow">
                  <FamilyMark id={familyId} size={14} /> {family.epithet}
                </p>
                <h2>{family.name}</h2>
                <p>{family.description}</p>
              </div>
              <span className="album-trait">
                {farm.familySeals.includes(familyId)
                  ? '✦ SELLO DE LINAJE'
                  : family.trait}
              </span>
            </header>

            <div className="album-sheet-body">
              <div className="album-collection">
                <div className="album-column-head">
                  <span>ESPECIES DEL LINAJE</span>
                  <span>{familyTotal} / 5 CULTIVADAS</span>
                </div>
                <div className="album-card-grid">
                  {plants.map((plant) => (
                    <button
                      key={plant.id}
                      type="button"
                      className={`album-plant-card${selected.id === plant.id ? ' is-selected' : ''}`}
                      onClick={() => setSelectedTier(plant.tier)}
                      aria-pressed={selected.id === plant.id}
                      aria-controls="album-specimen"
                    >
                      <span className="album-card-top">
                        <span>№ 0{plant.tier + 1}</span>
                        <span>{plant.rarity}</span>
                      </span>
                      <PlantImage
                        plant={plant}
                        hidden={!preview && !farm.album[plant.id].discovered}
                      />
                      <span className="album-card-name">
                        {preview || farm.album[plant.id].discovered
                          ? plant.name
                          : 'Especie desconocida'}
                      </span>
                      <span
                        className={`album-card-footer${farm.album[plant.id].cultivated ? ' is-earned' : ''}`}
                      >
                        {status(plant.id)}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="album-collection-note">
                  Dos plantas maduras de la misma especie permiten avanzar a la
                  siguiente lámina de su linaje.
                </p>
              </div>

              <article
                className="album-specimen"
                id="album-specimen"
                aria-labelledby="album-specimen-name"
              >
                <div className="album-specimen-top">
                  <span>LÁMINA BOTÁNICA</span>
                  <span>0{selectedTier + 1} / 05</span>
                </div>
                <PlantImage plant={selected} large hidden={!known} />
                <div className="album-specimen-name">
                  <span>
                    {selected.rarity.toUpperCase()} ·{' '}
                    {family.name.toUpperCase()}
                  </span>
                  <h3 id="album-specimen-name">
                    {known ? selected.name : 'Una vida por descubrir'}
                  </h3>
                  <p>
                    {known
                      ? selected.lore
                      : 'Invoca semillas de este linaje o fusiona dos plantas de la rareza anterior para revelar esta lámina.'}
                  </p>
                  <p className="album-progress-label">
                    {status(selected.id)} · {Math.min(3, progress.harvests)}/3
                    cosechas de maestría
                  </p>
                </div>
                <div className="album-specimen-facts">
                  <div>
                    <span>RASGO DEL LINAJE</span>
                    <strong>{family.trait}</strong>
                  </div>
                  <div>
                    <span>COSECHA AL MADURAR</span>
                    <strong>
                      {stats.yield} monedas cada {stats.cycleMs / 1000} s ·{' '}
                      {stats.reserve} ciclos de reserva
                    </strong>
                  </div>
                  <div>
                    <span>CÓMO CONSEGUIRLA</span>
                    <strong>
                      {previous
                        ? `Invocación o fusión de dos plantas de ${previous.name}`
                        : `Invocación ${family.invocationLabel}`}
                    </strong>
                  </div>
                  <div>
                    <span>SIGUIENTE FUSIÓN</span>
                    <strong>
                      {next
                        ? `2 maduras de esta especie → ${next.rarity.toLowerCase()} del mismo linaje`
                        : '2 míticas maduras → sello decorativo; conservas una mítica'}
                    </strong>
                  </div>
                </div>
                <p className="album-art-brief">
                  <span>TU COLECCIÓN</span>
                  {farm.seeds[selected.id]} semillas disponibles.{' '}
                  {progress.cultivated
                    ? 'La lámina permanece en tu herbario aunque fusiones o retires la planta.'
                    : 'Llévala a madurez para que cuente en las recompensas.'}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          className="album-milestones"
          aria-labelledby="album-milestones-title"
        >
          <div className="album-milestones-head">
            <p className="album-kicker">
              <span /> RECOMPENSAS DE COLECCIÓN
            </p>
            <h2 id="album-milestones-title">Cada planta acerca un premio</h2>
          </div>
          <label className="album-reward-choice">
            Linaje para el fondo de 9 y la semilla épica de 12{' '}
            <select
              value={rewardChoice}
              onChange={(event) =>
                setRewardChoice(event.target.value as AlbumFamilyId)
              }
            >
              {ALBUM_FAMILIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="album-milestone-list">
            {ALBUM_MILESTONES.map((milestone) => (
              <div className="album-milestone" key={milestone.count}>
                <strong>
                  {milestone.count}
                  <small>/15</small>
                </strong>
                <span>{milestone.reward}</span>
                <button
                  type="button"
                  disabled={
                    busy ||
                    total < milestone.count ||
                    farm.claimedMilestones.includes(milestone.count)
                  }
                  onClick={() =>
                    void act({
                      type: 'milestone',
                      count: milestone.count,
                      choice: rewardChoice,
                    })
                  }
                >
                  {farm.claimedMilestones.includes(milestone.count)
                    ? 'Recogida ✓'
                    : total >= milestone.count
                      ? 'Recoger premio'
                      : `Faltan ${milestone.count - total} especies`}
                </button>
              </div>
            ))}
          </div>
          {farm.claimedMilestones.includes(9) && (
            <div className="album-theme-picker">
              <span>Fondo de tu herbario</span>
              {ALBUM_FAMILIES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={farm.theme === item.id}
                  disabled={busy}
                  onClick={() => void act({ type: 'theme', family: item.id })}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </section>
        <p className="album-concept-note">
          Cuenta cada especie distinta que hayas llevado a madurez. Las
          recompensas se recogen una sola vez. Previsualizar una ilustración no
          desbloquea su lámina.
        </p>
      </main>
      <div className="agro-notice" role="status" aria-live="polite">
        {notice}
      </div>
    </div>
  );
}

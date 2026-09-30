# ⚔️ Einherjar Blitz — Diseño del Modo Combate (Mobile)

> **Versión:** 1.1 · **Fecha:** Julio 2026<br>
> **Objetivo:** Módulo de combate clásico (`game/`) independiente del resto de la app, en **landscape**, con placeholders visuales hasta tener sprites propios.

---

## Resumen ejecutivo

La app mobile tiene **dos mundos separados**:

| Módulo | Propósito | Orientación |
|--------|-----------|-------------|
| **Hub** *(tabs actuales)* | Herramientas para el grupo de rol de Messenger — inicio, gacha, tienda, perfil | Portrait |
| **Juego** *(módulo independiente)* | Combate 1v1 clásico vs CPU, personajes de `characters/`, progresión propia | **Landscape** |

Al entrar a **Jugar**, el jugador sale del contexto social y entra a una experiencia autocontenida: elegir campeón → duelo por turnos (**Atacar · Defender · Especial · Curar**) → resultado → volver al hub.

| Principio | Decisión |
|-----------|----------|
| Combate | Port fiel de `game/js/BattleSystem.js` |
| Personajes | Roster de `characters/` (Shuna, Ozen, Xair, Nathan, Zack, Raiden, Yozora, Kuaidul) |
| Recurso de combate | **Energía** (100 max), no MP |
| Orientación | **Landscape obligatorio** dentro del módulo Juego |
| Assets visuales | **Placeholders** en v1 (iconos, siluetas, color por personaje); sprites reales después |
| Aislamiento | Sin dependencia de gacha/inventario/tienda en v1 |
| Progresión | Firestore bajo namespace `game/` propio del módulo |

---

## Dos apps en una

```
┌─────────────────────────────────────────────────────────────────┐
│                     EINHERJAR BLITZ MOBILE                      │
├──────────────────────────────┬──────────────────────────────────┤
│         HUB (portrait)       │         JUEGO (landscape)        │
│  Grupo de rol · Messenger    │  Combate Einherjar clásico       │
├──────────────────────────────┼──────────────────────────────────┤
│  • Inicio (noticias, links)  │  • Selección de campeón          │
│  • Gacha / invocaciones      │  • Duelo Rápido                  │
│  • Tienda                    │  • Camino del Guerrero (PvE)     │
│  • Perfil social             │  • Batalla + resultado           │
│                              │  • Progreso propio (game/*)      │
├──────────────────────────────┴──────────────────────────────────┤
│  Comparten: auth Firebase, tema visual (dorado/oscuro), fuentes  │
│  NO comparten: economía, inventario, progresión, navegación      │
└─────────────────────────────────────────────────────────────────┘
```

### Por qué separar

El resto de la app existe para el **grupo de rol de Messenger** (invocaciones, certificados, tienda, perfil del jugador de mesa). El combate es un **producto distinto** que comparte login y estética, pero no debe heredar reglas de gacha ni bloquearse por inventario social.

### Comportamiento de navegación

1. Usuario en cualquier tab del hub → tap **Jugar**
2. App fuerza **landscape** + oculta tab bar
3. Stack propio: `Hub Juego → Selección → Batalla → Resultado`
4. Al salir («Volver al inicio»): restaura **portrait** + tab bar

### Implementación sugerida (expo-router)

```
mobile/src/app/
├── (tabs)/                    ← Hub social (portrait, tab bar visible)
│   ├── index.tsx
│   ├── gacha.tsx
│   ├── store.tsx
│   ├── profile.tsx
│   └── play.tsx               ← Solo launcher: botón «Entrar al combate»
│
└── (game)/                    ← Módulo aislado (landscape, sin tab bar)
    ├── _layout.tsx            ← ScreenOrientation.lockAsync(LANDSCAPE)
    ├── index.tsx              ← Menú del juego (modo + campeón)
    ├── battle.tsx
    └── campaign.tsx
```

En `app.json`, la app global sigue en `portrait`; el lock a landscape ocurre **solo** dentro de `(game)/_layout.tsx` al montar, y se revierte al desmontar.

---

## Visión del módulo Juego

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         MÓDULO JUEGO (landscape)                         │
├──────────────────────────────────────────────────────────────────────────┤
│  [ ← Volver ]                                                            │
│                                                                          │
│  1. Elegir campeón (roster local del juego, no inventario gacha)         │
│  2. Elegir modo:                                                         │
│     ┌──────────────────┐  ┌──────────────────────────────┐               │
│     │  Duelo Rápido    │  │  Camino del Guerrero (PvE)   │               │
│     │  1 batalla vs    │  │  Serie de rivales CPU con    │               │
│     │  CPU aleatoria   │  │  dificultad creciente        │               │
│     └────────┬─────────┘  └──────────────┬───────────────┘               │
│              └──────────────┬──────────────┘                             │
│                             ▼                                            │
│                    Pantalla de Batalla (landscape)                       │
│                             ▼                                            │
│              Resultado → Recompensas (game/) → Continuar                 │
└──────────────────────────────────────────────────────────────────────────┘
```

**Lo que NO es:** mazmorra por pisos, menú de skills/items, integración con gacha, portrait en combate.

**Lo que SÍ es:** `seleccion.php` → `game/battle.php`, en horizontal, con datos propios.

---

## Placeholders visuales (v1)

> Los sprites, retratos y efectos finales se harán después. El código debe estar preparado para reemplazarlos sin tocar la lógica de combate.

### Estrategia de assets temporales

| Elemento | Placeholder v1 | Asset final (futuro) |
|----------|----------------|----------------------|
| Retrato / sprite de combate | Círculo con `accentColor` + icono Ionicons (`fallbackIcon`) | PNG/WebP por personaje en `assets/game/characters/` |
| Fondo de batalla | Gradiente oscuro + partículas genéricas (ya existe `ParticlesBackground`) | Imagen por elemento o arena |
| Animación VS | Dos placeholders lado a lado + texto «VS» | Retratos reales + animación |
| Efectos de golpe | Shake + número flotante + flash de color | Partículas + sprites de skill |
| Icono de elemento | Badge de texto + color de `ELEMENT_SYSTEM` | Icono SVG por elemento |
| UI de acciones | Botones con iconos Ionicons | Botones con arte custom |

### Contrato de datos para sprites

La lógica **nunca** importa imágenes directamente. Usa un resolver:

```ts
// constants/characterAssets.ts
interface CharacterVisual {
  portrait: ImageSource | null;   // null → placeholder
  battleSprite: ImageSource | null;
  accentColor: string;
  fallbackIcon: string;           // Ionicons
  elementColor: string;
}

function getCharacterVisual(charId: number): CharacterVisual {
  // v1: siempre portrait/battleSprite = null → UI renderiza placeholder
  // v2: cargar desde assets/game/characters/{id}.png
}
```

### Reglas para placeholders

- Todo personaje debe ser **identificable** por color + nombre + icono aunque no tenga arte.
- No bloquear desarrollo esperando sprites: combate y UI se prueban con placeholders.
- Cuando llegue un sprite, solo se actualiza `characterAssets.ts`; cero cambios en `battleSystem.ts`.

---

## Modos de juego

### 1. Duelo Rápido *(core — Opción A)*

| Aspecto | Comportamiento |
|---------|----------------|
| Selección | Campeón del roster del **módulo juego** (starters + desbloqueos por arcos) |
| Oponente | CPU elige otro personaje del roster (excluyendo al tuyo) |
| Duración | 1 batalla, fin |
| Recompensas | XP de juego, XP del personaje, moneda interna del módulo *(ver abajo)* |
| Rejugar | «Revancha» inmediata |

**Flujo:**

1. Tap en campeón → confirmar
2. VS intro (placeholders + nombres)
3. Combate landscape
4. Modal de resultado → *Otra batalla* / *Volver al menú* / *Salir al hub*

---

### 2. Camino del Guerrero *(PvE con desarrollo)*

Modo estructurado con meta-progresión, **sin mapa de mazmorra**.

#### Arcos × Rivales

| Arco | Tema | Desbloqueo | Jefe final |
|------|------|------------|------------|
| I — Iniciación | Rivales básicos (IDs 1–4) | Desde el inicio | Ozen Kimura (CPU +15% stats) |
| II — Elementos | Rivales elementales | 10 victorias en Arco I | Xair Chikyu |
| III — Élite | Personajes raros/epic | Rango «Guerrero» | Nathan Doffens |
| IV — Leyendas | Legendary | Rango «Campeón» | Zack Hisoka |
| V — Sombra | Raiden, Yozora, Kuaidul | Completar Arco IV | Kuaidul Velguear |

#### Reglas del arco

- **Vida persistente parcial** entre combates del mismo arco.
- **Sin items:** curación solo con acción *Curar*.
- **Fallo:** reintentar desde el combate fallido (1 gratis/día; extras con moneda del juego).
- **Completar arco:** desbloqueo de personaje + recompensa grande.

#### Dificultad CPU

| Nivel | HP | ATK | IA |
|-------|-----|-----|-----|
| Normal | ×1.0 | ×1.0 | Base (`BattleSystem.js`) |
| Arco II+ | ×1.1 | ×1.05 | +10% uso de Especial |
| Jefe | ×1.25 | ×1.15 | Prioriza curar bajo 30% HP |
| Desafío diario | ×1.3 | ×1.2 | Rivales top-tier aleatorios |

---

## Sistema de combate

> Referencia: `game/js/BattleSystem.js` + `characters/*.js`

### Acciones

| Acción | Costo | Efecto |
|--------|-------|--------|
| **Atacar** | — | Daño entre `attack.min`–`attack.max` |
| **Defender** | — | Reduce daño; **+15 energía** |
| **Especial** | 25–40 energía | Habilidad única del personaje |
| **Curar** | 20 energía | **+10% HP máximo** |
| **Rendirse** | — | Derrota (solo Duelo Rápido) |

### Turnos

- Jugador siempre inicia.
- Máximo **50 rondas** → gana mayor % HP.
- Timer cosmético en header.

### Elementos

Sin tabla de debilidades. Elemento = color de placeholder/badge + flavor en log.

---

## Roster de personajes

| ID | Nombre | Elemento | Color placeholder | Icono |
|----|--------|----------|-------------------|-------|
| 1 | Shuna Shieda | Devastación | `#ff6b35` | `flame` |
| 2 | Ozen Kimura | Chakra | `#9b59b6` | `shield` |
| 3 | Xair Chikyu | Hielo | `#3498db` | `snow` |
| 4 | Nathan Doffens | Rayo | `#f1c40f` | `flash` |
| 5 | Zack Hisoka | Ninguno | `#95a5a6` | `infinite` |
| 6 | Raiden | Oscuridad | `#2c3e50` | `moon` |
| 7 | Yozora | Originium | `#e67e22` | `planet` |
| 8 | Kuaidul Velguear | — | `#c9aa71` | `star` |

### Desbloqueo *(solo módulo juego — sin gacha)*

| Origen | Personajes |
|--------|------------|
| **Starter** | Shuna + Ozen |
| **Arco completado** | Jefe del arco |
| **Duelo Rápido** | Nathan al llegar a 5 victorias *(ejemplo v1)* |

> En el futuro se **podrá** conectar con inventario gacha, pero no es requisito del MVP.

---

## Progresión del módulo Juego

Economía y stats **aislados** del hub social.

### Namespace Firestore

```
users/{uid}/game/                    ← doc raíz del módulo
  nivel: number
  experiencia: number
  victorias: number
  derrotas: number
  rango: string
  blitzCoins: number                 ← moneda interna del juego (no esferas del hub)

users/{uid}/game/characters/{charId}
  level, xp, wins, losses, unlocked

users/{uid}/game/campaigns/{arcId}
  currentFight, hpSnapshot, energySnapshot, completed, attempts
```

**No usar** en v1: `users/{uid}/inventory`, `keys`, `spheres` del hub para el combate.

### Dos capas de XP

```
Victoria en batalla
       │
       ├──► XP de JUEGO (users/{uid}/game.experiencia)
       │         └── Sube game.nivel → desbloquea arcos y rangos
       │
       └──► XP de PERSONAJE (game/characters/{charId}.xp)
                 └── Nivel 1–20 → bonus suaves de HP/ATK
```

### Rangos *(dentro del módulo)*

| Rango | Requisito | Beneficio |
|-------|-----------|-----------|
| Iniciado | — | Arco I |
| Guerrero | 25 victorias | Arcos II–III |
| Campeón | 75 victorias + Arco III | Arco IV |
| Einherjar | 150 victorias + Arco IV | Arco V + Desafío diario |

### Recompensas

| Resultado | Duelo Rápido | Arco normal | Jefe |
|-----------|--------------|-------------|------|
| Victoria | +15 XP, +10 XP char, +5 blitzCoins | +20 XP, +15 XP char | +50 XP, +20 blitzCoins |
| Derrota | +5 XP | +8 XP | — |

---

## Interfaz de batalla (Landscape)

Inspiración: `game/battle.html` — pero **reorganizada para horizontal**, no un port 1:1 del layout portrait del CSS viejo.

### Layout landscape

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Ronda 3          Turno: Jugador                              02:14    [⚙]  │
├───────────────────────────────┬────────────────────────────────────────────┤
│                               │  ENEMIGO                                   │
│                               │  [placeholder]  Nombre · Título            │
│      ZONA CENTRAL             │  HP ████████░░   EN ██████░░               │
│                               │  ATK · DEF · RES   [efectos]               │
│   [sprite placeholder]        ├────────────────────────────────────────────┤
│         vs                    │  LOG                                       │
│   [sprite placeholder]        │  › Shuna ataca por 127                     │
│                               │  › Ozen usa Muralla Defensiva              │
│   (animaciones / daño flot.)  ├────────────────────────────────────────────┤
│                               │  JUGADOR                                   │
│                               │  [placeholder]  Nombre · Título            │
│                               │  HP ████████░░   EN ██████░░               │
├───────────────────────────────┴────────────────────────────────────────────┤
│        [ Atacar ]  [ Defender ]  [ Especial ]  [ Curar ]                   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Pantalla de selección (landscape)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [← Salir]              EINHERJAR BLITZ — COMBATE                          │
├────────────────────────────────────────────────────────────────────────────┤
│  Elegí tu campeón          │     [ Duelo Rápido ]  [ Camino del Guerrero ] │
│  ┌────┐ ┌────┐ ┌────┐     │                                               │
│  │ ◉  │ │ ◉  │ │ 🔒 │     │     Arco I · 3/5 combates · HP 67%             │
│  │Shuna│ │Ozen│ │    │     │     (solo visible en modo Campaña)            │
│  └────┘ └────┘ └────┘     │                                               │
│         [ COMENZAR ]       │                                               │
└────────────────────────────────────────────────────────────────────────────┘
```

### Orientación — requisitos técnicos

| Momento | Orientación |
|---------|-------------|
| Hub `(tabs)/*` | Portrait (default app) |
| Entrar a `(game)/*` | Lock landscape |
| Batalla activa | Landscape estricto |
| Salir del módulo | Unlock → portrait |

```ts
// (game)/_layout.tsx — pseudocódigo
useEffect(() => {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  return () => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
  };
}, []);
```

- Ocultar tab bar: `(game)` vive **fuera** de `(tabs)`.
- Safe areas: usar `useSafeAreaInsets()` en landscape (notch lateral en algunos devices).
- Botón «Salir» siempre visible — es la única puerta de vuelta al hub.

### Componentes React

```
mobile/src/
├── app/
│   ├── (tabs)/play.tsx              ← launcher mínimo (1 botón)
│   └── (game)/
│       ├── _layout.tsx              ← landscape lock + stack sin tabs
│       ├── index.tsx                ← menú juego
│       ├── battle.tsx
│       └── campaign.tsx
│
├── components/game/                 ← prefijo game/ para no mezclar con hub
│   ├── ChampionSelect.tsx
│   ├── ModePicker.tsx
│   ├── BattleScreen.tsx
│   ├── BattleHUD.tsx
│   ├── BattleLog.tsx
│   ├── ActionBar.tsx
│   ├── CharacterPlaceholder.tsx     ← círculo + icono + color
│   ├── VSIntro.tsx
│   └── BattleResultModal.tsx
│
├── services/game/
│   ├── battleSystem.ts
│   ├── characterFactory.ts
│   └── gameProgress.ts              ← CRUD namespace game/*
│
└── constants/game/
    ├── characterAssets.ts           ← placeholders → sprites
    └── campaignArcs.ts
```

### Animaciones v1 (sin sprites)

- Shake del placeholder al recibir daño
- Números flotantes
- Pulso en barra de energía
- Flash de `accentColor` en Especial
- VS intro: fade + scale de placeholders

*(Efectos de partículas complejos — Fase 4, cuando existan sprites.)*

---

## Relación Hub ↔ Juego

```
┌─────────────────┐                      ┌─────────────────┐
│   HUB SOCIAL    │   tap «Entrar»       │  MÓDULO JUEGO   │
│   (portrait)    │ ──────────────────►  │  (landscape)    │
│                 │                      │                 │
│  gacha          │   auth Firebase      │  combate        │
│  tienda         │ ◄─── compartido ───► │  progreso game/ │
│  perfil mesa    │                      │  roster propio  │
│  inventario     │   NO comparte datos  │  blitzCoins     │
└─────────────────┘                      └─────────────────┘
```

### Tab «Jugar» en el hub

Solo un **launcher**:

- Título + breve descripción del combate
- Botón **«Entrar al combate»** → `router.push('/(game)')`
- Opcional: resumen de stats del módulo juego (victorias, rango) leyendo `users/{uid}/game`

### Qué no cruza la frontera (v1)

| Hub | Juego |
|-----|-------|
| Esferas, llaves | blitzCoins |
| Inventario gacha | Roster `game/characters` |
| Certificados PDF | — |
| Perfil social (avatar, frase) | Perfil de combate (W/L, rango, campeón favorito) |

### Puente futuro *(opcional, post-MVP)*

Si más adelante querés que una persona del gacha desbloquee un campeón en el juego, será un **adaptador explícito** (`syncGachaToGame.ts`), no acoplamiento directo.

---

## Modelo de datos

### Deprecar del diseño dungeon anterior

| Artefacto | Acción |
|-----------|--------|
| `battleEngine.ts` | Reemplazar por `battleSystem.ts` |
| `constants/gameData.ts` (Einherjar, pisos) | Eliminar |
| `DungeonMap`, `RestScreen`, etc. | Eliminar |
| `users/{uid}/gameState` | Migrar a `users/{uid}/game/` |
| `users/{uid}/gameCharacters` | Migrar a `game/characters/` |

---

## Roadmap

### Fase 1 — Módulo aislado + combate MVP

- [ ] Crear route group `(game)/` con lock landscape
- [ ] Convertir `(tabs)/play.tsx` en launcher
- [ ] Port `BattleSystem.js` + `characters/` a TS
- [ ] `CharacterPlaceholder` + `characterAssets.ts`
- [ ] `BattleScreen` landscape + 4 acciones
- [ ] Duelo Rápido end-to-end
- [ ] Firestore `users/{uid}/game/` básico

### Fase 2 — Progresión del juego

- [ ] XP cuenta + personaje en namespace `game/`
- [ ] Rangos y modal de resultado
- [ ] Pantalla menú juego (selección + modos)

### Fase 3 — Camino del Guerrero

- [ ] Arcos I–III
- [ ] HP/energía persistente entre combates
- [ ] Desbloqueo de personajes por arco

### Fase 4 — Arte y polish

- [ ] Reemplazar placeholders por sprites (`assets/game/characters/`)
- [ ] Fondos por elemento
- [ ] Efectos visuales avanzados
- [ ] Arcos IV–V
- [ ] *(Opcional)* puente gacha → juego

---

## Criterios de aceptación

1. Entrar desde el hub abre el módulo en **landscape**; salir restaura **portrait**.
2. El tab bar **no** aparece durante el combate.
3. Batalla con placeholders identificables (color + icono + nombre).
4. Shuna vs CPU con **Atacar / Defender / Especial / Curar** — lógica igual al web.
5. Barras de **Vida + Energía** (no MP).
6. Progreso guardado en `users/{uid}/game/` — **sin** leer inventario gacha.
7. Al menos 1 arco PvE con 3 combates seguidos.
8. El hub (gacha, tienda, perfil) funciona igual si el módulo juego no existe.

---

## Referencias

| Recurso | Ruta |
|---------|------|
| Motor de combate | `game/js/BattleSystem.js` |
| UI web original | `game/battle.html`, `game/js/BattleUI.js` |
| Personajes | `characters/*.js` |
| Estilos web | `assets/css/battle-mobile.css` |
| Tabs actuales (hub) | `mobile/src/app/(tabs)/` |
| Orientación app | `mobile/app.json` → `orientation: portrait` (global) |

---

<p align="center">
  <em>Einherjar Blitz — Combate clásico en landscape. Hub social aparte. Sprites cuando estén listos.</em>
</p>

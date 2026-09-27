# Archivos de Audio para AM Game

El juego requiere los siguientes archivos de audio (opcional, el juego funciona sin ellos):

## Ubicación: `terror/assets/audio/`

### 1. ambient.mp3
- **Descripción**: Sonido ambiente oscuro y perturbador
- **Duración recomendada**: 2-5 minutos (loop)
- **Características**: 
  - Drone oscuro
  - Zumbidos electrónicos
  - Atmosfera industrial
- **Recursos gratuitos**: 
  - https://freesound.org/
  - Buscar: "ambient drone dark"

### 2. glitch.mp3
- **Descripción**: Efecto de glitch/error digital
- **Duración recomendada**: 0.1-0.5 segundos
- **Características**:
  - Distorsión digital
  - Ruido estático
  - Efecto de interferencia
- **Recursos gratuitos**:
  - https://freesound.org/
  - Buscar: "digital glitch"

## Cómo agregar los audios

1. Crear la carpeta `assets/audio/` si no existe
2. Descargar o crear los archivos de audio
3. Nombrarlos exactamente como se indica arriba
4. Colocarlos en la carpeta

## Alternativa sin audio

El juego funciona perfectamente sin archivos de audio. Los elementos `<audio>` simplemente no reproducirán nada si no encuentran los archivos.

## Recursos Recomendados

- **Freesound.org**: Sonidos gratuitos con licencia Creative Commons
- **Audacity**: Software gratuito para crear/editar audio
- **SFXR/BFXR**: Generadores de efectos de sonido retro

## Volúmenes configurados

- `ambient.mp3`: 0.3 (30% volumen)
- `glitch.mp3`: 0.2 (20% volumen)

Estos volúmenes están configurados en `am-game.js` y pueden ajustarse según preferencia.

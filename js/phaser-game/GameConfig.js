// GameConfig.js - Configuración principal del juego Phaser
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { UIScene } from './scenes/UIScene.js';

// Configuración del juego
const config = {
    type: Phaser.AUTO, // Usar WebGL si está disponible, sino Canvas
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [
        BootScene,
        PreloadScene, 
        BattleScene,
        UIScene
    ],
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
    },
    input: {
        activePointers: 3 // Soporte multi-touch
    },
    audio: {
        disableWebAudio: false
    }
};

// Inicializar el juego
const game = new Phaser.Game(config);

// Hacer el juego accesible globalmente para debug
window.phaserGame = game;

// Manejar redimensionamiento
window.addEventListener('resize', () => {
    game.scale.setGameSize(window.innerWidth, window.innerHeight);
});

// Ocultar el loading cuando el juego esté listo
game.events.once('ready', () => {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
});

export { game };

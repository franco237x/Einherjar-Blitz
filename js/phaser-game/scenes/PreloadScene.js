// PreloadScene.js - Escena de precarga de assets
export class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Crear loading bar mejorado
        this.createLoadingBar();
        
        // Cargar imágenes de personajes
        this.load.image('champion', `images/${window.championData.image}`);
        this.load.image('enemy', `images/${window.enemyData.image}`);
        
        // Cargar assets de UI
        this.loadUIAssets();
        
        // Cargar efectos de partículas
        this.loadParticleAssets();
        
        // Cargar sonidos (opcional)
        this.loadAudioAssets();
    }

    create() {
        console.log('✅ Assets cargados correctamente');
        
        // Iniciar las escenas del juego
        this.scene.start('BattleScene');
        this.scene.launch('UIScene');
    }

    loadUIAssets() {
        // Crear textura para botones dinámicamente
        this.load.image('button-bg', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#4a4a4a;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#2a2a2a;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="200" height="60" rx="10" fill="url(#grad1)" stroke="#666" stroke-width="2"/>
            </svg>
        `));
        
        // Crear texturas para barras de vida/energía
        this.load.image('health-bar-bg', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="300" height="20" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="20" rx="10" fill="#333" stroke="#666" stroke-width="1"/>
            </svg>
        `));
        
        this.load.image('health-bar-fill', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="300" height="20" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="20" rx="10" fill="#e74c3c"/>
            </svg>
        `));
        
        this.load.image('energy-bar-fill', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="300" height="20" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="20" rx="10" fill="#3498db"/>
            </svg>
        `));
    }

    loadParticleAssets() {
        // Crear partículas para efectos
        this.load.image('particle-fire', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="8" height="8" xmlns="http://www.w3.org/2000/svg">
                <circle cx="4" cy="4" r="4" fill="#ff6b35"/>
            </svg>
        `));
        
        this.load.image('particle-spark', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="6" height="6" xmlns="http://www.w3.org/2000/svg">
                <rect width="6" height="6" fill="#ffff00"/>
            </svg>
        `));
        
        this.load.image('particle-smoke', 'data:image/svg+xml;base64,' + btoa(`
            <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
                <circle cx="5" cy="5" r="5" fill="#888888" opacity="0.7"/>
            </svg>
        `));
    }

    loadAudioAssets() {
        // Placeholder para sonidos - puedes agregar archivos de audio reales
        // this.load.audio('attack-sound', ['sounds/attack.mp3', 'sounds/attack.ogg']);
        // this.load.audio('victory-sound', ['sounds/victory.mp3', 'sounds/victory.ogg']);
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background más elaborado
        this.add.rectangle(width/2, height/2, width * 0.8, 60, 0x2a2a2a)
            .setStrokeStyle(2, 0x444444);
        
        // Progress bar container
        const progressBg = this.add.rectangle(width/2, height/2, width * 0.75, 20, 0x333333);
        const progressBar = this.add.rectangle(width/2 - (width * 0.75)/2, height/2, 0, 16, 0xff6b35);
        progressBar.setOrigin(0, 0.5);
        
        // Loading text
        const loadingText = this.add.text(width/2, height/2 - 50, 'Cargando recursos del juego...', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Roboto',
            align: 'center'
        }).setOrigin(0.5);
        
        // Percentage text
        const percentText = this.add.text(width/2, height/2 + 40, '0%', {
            fontSize: '16px',
            color: '#cccccc',
            fontFamily: 'Roboto'
        }).setOrigin(0.5);
        
        this.load.on('progress', (value) => {
            progressBar.width = (width * 0.75) * value;
            percentText.setText(`${Math.round(value * 100)}%`);
        });
        
        this.load.on('complete', () => {
            loadingText.setText('¡Listo para la batalla!');
            progressBar.setFillStyle(0x27ae60);
        });
    }
}

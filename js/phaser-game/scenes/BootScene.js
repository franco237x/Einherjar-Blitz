// BootScene.js - Escena de inicialización
export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Crear loading bar simple
        this.createLoadingBar();
    }

    create() {
        console.log('🎮 Phaser Game Initialized');
        
        // Pasar datos del servidor a la configuración del juego
        this.registry.set('championData', window.championData);
        this.registry.set('enemyData', window.enemyData);
        
        // Ir a la escena de precarga
        this.scene.start('PreloadScene');
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(width/2, height/2, width * 0.8, 50, 0x333333);
        
        // Loading bar
        const progressBar = this.add.rectangle(width/2, height/2, 0, 30, 0xff6b35);
        progressBar.setOrigin(0.5, 0.5);
        
        // Loading text
        const loadingText = this.add.text(width/2, height/2 - 60, 'Cargando Einherjar Blitz...', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Roboto'
        }).setOrigin(0.5);
        
        this.load.on('progress', (value) => {
            progressBar.width = (width * 0.8) * value;
        });
    }
}

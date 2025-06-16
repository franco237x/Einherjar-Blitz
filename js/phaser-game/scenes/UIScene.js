// UIScene.js - Escena de interfaz de usuario
export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        
        this.champion = null;
        this.enemy = null;
        
        // Elementos de UI
        this.healthBars = {};
        this.energyBar = null;
        this.buttons = {};
        this.battleLog = [];
    }

    create() {
        console.log('🎮 Creando UI Scene');
        
        // Obtener datos del registro
        this.champion = this.registry.get('championData');
        this.enemy = this.registry.get('enemyData');
        
        // Configurar la escena como overlay
        this.scene.bringToTop();
        
        // Crear elementos de UI
        this.createHealthBars();
        this.createEnergySystem();
        this.createCombatButtons();
        this.createBattleLog();
        this.createCharacterInfo();
        
        // Configurar eventos
        this.setupUIEvents();
        
        console.log('✅ UI Scene creada');
    }

    createHealthBars() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Barra de vida del campeón (izquierda)
        this.createHealthBar('champion', width * 0.05, height * 0.05, this.champion);
        
        // Barra de vida del enemigo (derecha)
        this.createHealthBar('enemy', width * 0.95, height * 0.05, this.enemy, true);
    }

    createHealthBar(type, x, y, characterData, alignRight = false) {
        const barWidth = 250;
        const barHeight = 20;
        
        // Ajustar posición si está alineado a la derecha
        if (alignRight) {
            x -= barWidth;
        }
        
        // Background de la barra
        const healthBg = this.add.image(x, y, 'health-bar-bg');
        healthBg.setOrigin(0, 0);
        healthBg.setDisplaySize(barWidth, barHeight);
        
        // Barra de vida
        const healthFill = this.add.image(x, y, 'health-bar-fill');
        healthFill.setOrigin(0, 0);
        healthFill.setDisplaySize(barWidth, barHeight);
        
        // Texto de vida
        const healthText = this.add.text(
            x + barWidth / 2,
            y + barHeight / 2,
            `${characterData.max_health}/${characterData.max_health}`,
            {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Roboto',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        // Nombre del personaje
        const nameText = this.add.text(
            x + (alignRight ? barWidth : 0),
            y - 25,
            characterData.name,
            {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Roboto',
                fontStyle: 'bold'
            }
        ).setOrigin(alignRight ? 1 : 0, 0);
        
        // Título del personaje
        const titleText = this.add.text(
            x + (alignRight ? barWidth : 0),
            y - 10,
            characterData.title || '',
            {
                fontSize: '12px',
                color: '#cccccc',
                fontFamily: 'Roboto'
            }
        ).setOrigin(alignRight ? 1 : 0, 0);
        
        // Guardar referencias
        this.healthBars[type] = {
            background: healthBg,
            fill: healthFill,
            text: healthText,
            maxHealth: characterData.max_health,
            currentHealth: characterData.max_health,
            width: barWidth
        };
    }

    createEnergySystem() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Posición centrada en la parte inferior
        const x = width * 0.5;
        const y = height * 0.85;
        const barWidth = 300;
        const barHeight = 15;
        
        // Label de energía
        this.add.text(x, y - 30, 'ENERGÍA', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Roboto',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Background de la barra de energía
        const energyBg = this.add.image(x, y, 'health-bar-bg');
        energyBg.setOrigin(0.5, 0.5);
        energyBg.setDisplaySize(barWidth, barHeight);
        
        // Barra de energía
        const energyFill = this.add.image(x - barWidth/2, y, 'energy-bar-fill');
        energyFill.setOrigin(0, 0.5);
        energyFill.setDisplaySize(barWidth, barHeight);
        
        // Texto de energía
        const energyText = this.add.text(x, y, '100/100', {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Roboto',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.energyBar = {
            background: energyBg,
            fill: energyFill,
            text: energyText,
            maxEnergy: 100,
            currentEnergy: 100,
            width: barWidth
        };
    }

    createCombatButtons() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Crear botones de combate en la parte inferior
        const buttonData = [
            {
                key: 'basic',
                text: 'ATAQUE\nBÁSICO',
                icon: '⚔️',
                cost: 0,
                color: 0x666666,
                x: width * 0.2
            },
            {
                key: 'elemental',
                text: 'ATAQUE\nELEMENTAL',
                icon: '🔥',
                cost: 30,
                color: 0xff6b35,
                x: width * 0.5
            },
            {
                key: 'ultimate',
                text: 'HABILIDAD\nDEFINITIVA',
                icon: '💀',
                cost: 70,
                color: 0x9b59b6,
                x: width * 0.8
            }
        ];
        
        buttonData.forEach(data => {
            this.createCombatButton(data, height * 0.92);
        });
    }

    createCombatButton(data, y) {
        const buttonWidth = 120;
        const buttonHeight = 50;
        
        // Background del botón
        const button = this.add.rectangle(data.x, y, buttonWidth, buttonHeight, data.color, 0.8);
        button.setStrokeStyle(2, 0xffffff, 0.5);
        button.setInteractive({ useHandCursor: true });
        
        // Icono
        const icon = this.add.text(data.x - 30, y, data.icon, {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Texto
        const text = this.add.text(data.x + 10, y - 8, data.text, {
            fontSize: '10px',
            color: '#ffffff',
            fontFamily: 'Roboto',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        
        // Costo de energía
        const cost = this.add.text(data.x + 10, y + 12, `${data.cost} Energía`, {
            fontSize: '8px',
            color: '#cccccc',
            fontFamily: 'Roboto'
        }).setOrigin(0.5);
          // Efectos hover mejorados
        button.on('pointerover', () => {
            // Sonido de hover
            const battleScene = this.scene.get('BattleScene');
            if (battleScene.audioManager) {
                battleScene.audioManager.playSound('ui-hover');
            }
            
            this.tweens.add({
                targets: [button, icon, text, cost],
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100
            });
        });
        
        button.on('pointerout', () => {
            this.tweens.add({
                targets: [button, icon, text, cost],
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });
        
        // Click handler
        button.on('pointerdown', () => {
            this.onButtonClick(data.key, data.cost);
        });
        
        // Guardar referencias
        this.buttons[data.key] = {
            container: button,
            icon: icon,
            text: text,
            cost: cost,
            energyCost: data.cost
        };
    }

    createBattleLog() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Solo crear si hay espacio suficiente (pantallas grandes)
        if (width > 800) {
            // Background del log
            const logBg = this.add.rectangle(width - 150, height * 0.3, 280, 200, 0x000000, 0.7);
            logBg.setStrokeStyle(1, 0x444444);
            
            // Título del log
            this.add.text(width - 150, height * 0.3 - 90, '⚔️ REGISTRO DE BATALLA', {
                fontSize: '12px',
                color: '#ffffff',
                fontFamily: 'Roboto',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Área de texto (se actualizará dinámicamente)
            this.battleLogText = this.add.text(width - 270, height * 0.3 - 70, '', {
                fontSize: '10px',
                color: '#cccccc',
                fontFamily: 'Roboto',
                wordWrap: { width: 260 }
            });
        }
    }

    createCharacterInfo() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Info del campeón (esquina inferior izquierda)
        this.createCharacterStats('champion', width * 0.05, height * 0.75, this.champion);
        
        // Info del enemigo (esquina inferior derecha)
        this.createCharacterStats('enemy', width * 0.95, height * 0.75, this.enemy, true);
    }

    createCharacterStats(type, x, y, characterData, alignRight = false) {
        const stats = [
            `⚔️ ${characterData.attack_min || characterData.attackMin}-${characterData.attack_max || characterData.attackMax}`,
            `🛡️ ${characterData.armor}`,
            `💚 ${characterData.max_health || characterData.maxHealth}`
        ];
        
        stats.forEach((stat, index) => {
            this.add.text(
                x,
                y + (index * 15),
                stat,
                {
                    fontSize: '12px',
                    color: '#cccccc',
                    fontFamily: 'Roboto'
                }
            ).setOrigin(alignRight ? 1 : 0, 0);
        });
    }

    setupUIEvents() {
        // Escuchar eventos de la escena de batalla
        const battleScene = this.scene.get('BattleScene');
        
        battleScene.events.on('health-updated', (data) => {
            this.updateHealthBars(data);
        });
        
        battleScene.events.on('combat-ended', (data) => {
            this.handleCombatEnd(data);
        });
    }    onButtonClick(attackType, energyCost) {
        console.log(`🎯 Botón presionado: ${attackType} (${energyCost} energía)`);
        
        // Sonido de click
        const battleScene = this.scene.get('BattleScene');
        if (battleScene.audioManager) {
            battleScene.audioManager.playSound('ui-click');
        }
        
        // Verificar si hay suficiente energía
        if (this.energyBar.currentEnergy < energyCost) {
            this.showMessage('❌ Energía insuficiente');
            return;
        }
        
        // Reducir energía
        this.energyBar.currentEnergy -= energyCost;
        this.updateEnergyBar();
        
        // Efectos visuales del botón
        const button = this.buttons[attackType];
        this.tweens.add({
            targets: button.container,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 100,
            yoyo: true
        });
        
        // Emitir evento a la escena de batalla
        battleScene.events.emit(`attack-${attackType}`);
        
        // Agregar al log
        this.addToBattleLog(`🗡️ ${this.champion.name} usa ${attackType.toUpperCase()}`);
    }

    updateHealthBars(data) {
        // Actualizar barra del campeón
        if (data.champion) {
            this.updateHealthBar('champion', data.champion.currentHealth, data.champion.max_health);
        }
        
        // Actualizar barra del enemigo
        if (data.enemy) {
            this.updateHealthBar('enemy', data.enemy.currentHealth, data.enemy.maxHealth || data.enemy.max_health);
        }
    }

    updateHealthBar(type, currentHealth, maxHealth) {
        const healthBar = this.healthBars[type];
        if (!healthBar) return;
        
        // Calcular porcentaje
        const percentage = Math.max(0, currentHealth / maxHealth);
        
        // Animar la barra
        this.tweens.add({
            targets: healthBar.fill,
            displayWidth: healthBar.width * percentage,
            duration: 300,
            ease: 'Power2.easeOut'
        });
        
        // Actualizar texto
        healthBar.text.setText(`${Math.max(0, Math.floor(currentHealth))}/${maxHealth}`);
        
        // Cambiar color según la vida restante
        if (percentage < 0.3) {
            healthBar.fill.setTint(0xff4444); // Rojo
        } else if (percentage < 0.6) {
            healthBar.fill.setTint(0xffaa44); // Naranja
        } else {
            healthBar.fill.clearTint(); // Verde normal
        }
    }

    updateEnergyBar() {
        const percentage = this.energyBar.currentEnergy / this.energyBar.maxEnergy;
        
        // Animar la barra de energía
        this.tweens.add({
            targets: this.energyBar.fill,
            displayWidth: this.energyBar.width * percentage,
            duration: 200,
            ease: 'Power2.easeOut'
        });
        
        // Actualizar texto
        this.energyBar.text.setText(`${this.energyBar.currentEnergy}/${this.energyBar.maxEnergy}`);
        
        // Regenerar energía gradualmente
        this.time.delayedCall(1000, () => {
            if (this.energyBar.currentEnergy < this.energyBar.maxEnergy) {
                this.energyBar.currentEnergy = Math.min(
                    this.energyBar.maxEnergy,
                    this.energyBar.currentEnergy + 10
                );
                this.updateEnergyBar();
            }
        });
    }

    addToBattleLog(message) {
        this.battleLog.push(message);
        
        // Mantener solo los últimos 8 mensajes
        if (this.battleLog.length > 8) {
            this.battleLog.shift();
        }
        
        // Actualizar el texto del log si existe
        if (this.battleLogText) {
            this.battleLogText.setText(this.battleLog.join('\n'));
        }
        
        console.log(`📝 ${message}`);
    }

    showMessage(message) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const messageText = this.add.text(width / 2, height / 2, message, {
            fontSize: '24px',
            color: '#ff4444',
            fontFamily: 'Roboto',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Animación del mensaje
        this.tweens.add({
            targets: messageText,
            y: height / 2 - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2.easeOut',
            onComplete: () => messageText.destroy()
        });
    }

    handleCombatEnd(data) {
        const message = data.playerWon ? '🎉 ¡VICTORIA!' : '💀 DERROTA';
        const color = data.playerWon ? '#44ff44' : '#ff4444';
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Mensaje principal
        const endText = this.add.text(width / 2, height / 2, message, {
            fontSize: '48px',
            color: color,
            fontFamily: 'Roboto',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Animación del mensaje final
        endText.setScale(0);
        this.tweens.add({
            targets: endText,
            scaleX: 1,
            scaleY: 1,
            duration: 1000,
            ease: 'Bounce.easeOut'
        });
        
        // Deshabilitar botones
        Object.values(this.buttons).forEach(button => {
            button.container.disableInteractive();
            button.container.setAlpha(0.5);
        });
        
        // Regresar al dashboard después de un tiempo
        this.time.delayedCall(3000, () => {
            window.location.href = 'dashboard.php';
        });
    }
}

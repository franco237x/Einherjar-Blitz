/**
 * Motor principal del juego - Einherjar Blitz
 * Maneja la lógica central del combate y coordinación entre sistemas
 */

class GameEngine {
    constructor() {
        this.gameState = 'loading';
        this.currentTurn = 1;
        this.turnPhase = 'player'; // 'player' | 'enemy' | 'processing'
        
        this.player = null;
        this.enemy = null;
        
        this.battleUI = null;
        this.effectsManager = null;
        this.soundManager = null;
        
        this.settings = {
            animationSpeed: 1,
            sfxVolume: 70,
            vibrationEnabled: true
        };
        
        this.combatLog = [];
        this.turnTimer = null;
        
        this.init();
    }

    async init() {
        console.log('🎮 Inicializando Einherjar Blitz...');
        
        try {
            // Inicializar sistemas
            this.battleUI = new BattleUI(this);
            this.effectsManager = new EffectsManager(this);
            this.soundManager = new SoundManager(this.settings.sfxVolume);
            
            // Cargar configuración guardada
            this.loadSettings();
            
            // Simular carga
            await this.simulateLoading();
            
            // Inicializar personajes
            await this.initializeCharacters();
            
            // Comenzar el combate
            this.startBattle();
            
        } catch (error) {
            console.error('❌ Error inicializando el juego:', error);
            this.showError('Error al cargar el juego');
        }
    }

    async simulateLoading() {
        return new Promise(resolve => {
            const progressBar = document.querySelector('.loading-progress');
            let progress = 0;
            
            const loadingInterval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(loadingInterval);
                    
                    setTimeout(() => {
                        document.getElementById('loadingScreen').style.opacity = '0';
                        setTimeout(() => {
                            document.getElementById('loadingScreen').style.display = 'none';
                            document.getElementById('gameContainer').classList.remove('hidden');
                            resolve();
                        }, 500);
                    }, 500);
                }
                
                progressBar.style.width = `${progress}%`;
            }, 100);
        });
    }

    async initializeCharacters() {
        // Obtener datos del personaje seleccionado desde sessionStorage
        const selectedChampionId = sessionStorage.getItem('selected_champion');
        const characterData = this.getCharacterDataById(selectedChampionId);
        
        if (!characterData) {
            throw new Error('No se encontró información del personaje seleccionado');
        }

        // Crear instancia del jugador
        this.player = new Character({
            ...characterData,
            isPlayer: true
        });

        // Crear enemigo (boss Kars por ahora)
        this.enemy = new Character({
            id: 'kars',
            name: 'Kars',
            title: 'El Ser Supremo',
            image: 'default.jpg',
            maxHealth: 850,
            currentHealth: 850,
            attack: [120, 180],
            armor: 0,
            elementalResistance: 0,
            isPlayer: false,
            aiType: 'aggressive' // Para el comportamiento de la IA
        });

        console.log('👥 Personajes inicializados:', {
            player: this.player.name,
            enemy: this.enemy.name
        });
    }

    getCharacterDataById(id) {
        // Datos de personajes usando la misma estructura que seleccion.php
        const characters = {
            '1': {
                id: 1,
                name: 'Shuna Shieda',
                title: 'La Furia de los Shiedas',
                description: 'La cúspide de poder de los Shiedas, feroz y letal. Maestra del elemento Devastación.',
                image: 'shuna.jpg',
                rarity: 'legendary',
                attack_min: 120,
                attack_max: 180,
                max_health: 950,
                armor: 85,
                defense_reduction: 75,
                elemental_resistance: 180,
                clan: 'Shieda',
                element: 'Devastación'
            },
            '2': {
                id: 2,
                name: 'Ozen Kimura',
                title: 'La Muralla Inamovible de los Kimura',
                description: 'Con una actitud fría como el acero, Ozen es una guerrera formidable del clan Kimura.',
                image: 'ozen.jpg',
                rarity: 'epic',
                attack_min: 200,
                attack_max: 280,
                max_health: 1200,
                armor: 150,
                defense_reduction: 120,
                elemental_resistance: 90,
                clan: 'Kimura',
                element: 'Hielo'
            },
            '3': {
                id: 3,
                name: 'Xair Chikyu',
                title: 'El viento gélido de los Chikyu',
                description: 'Inventor del Bijon, energía que le otorga un poder devastador. Maestro del clan Chikyu.',
                image: 'xair.png',
                rarity: 'rare',
                attack_min: 160,
                attack_max: 240,
                max_health: 800,
                armor: 60,
                defense_reduction: 45,
                elemental_resistance: 250,
                clan: 'Chikyu',
                element: 'Viento'
            }
        };

        return characters[id] || null;
    }

    startBattle() {
        this.gameState = 'battle';
        this.currentTurn = 1;
        this.turnPhase = 'player';
        
        // Actualizar UI inicial
        this.battleUI.updateAll();
        
        // Log inicial
        this.addToCombatLog(`¡Comienza el combate!`);
        this.addToCombatLog(`${this.player.name} vs ${this.enemy.name}`);
        
        // Vibración inicial
        this.vibrate(100);
        
        console.log('⚔️ ¡Combate iniciado!');
    }

    async executePlayerAction(actionType) {
        if (this.turnPhase !== 'player' || this.gameState !== 'battle') {
            return;
        }

        this.turnPhase = 'processing';
        this.battleUI.disableActions();

        try {
            const result = await this.processPlayerAction(actionType);
            
            if (result.success) {
                // Aplicar efectos visuales y sonoros
                await this.effectsManager.playActionEffect(actionType, result);
                
                // Verificar si el enemigo fue derrotado
                if (this.enemy.currentHealth <= 0) {
                    await this.endBattle('victory');
                    return;
                }

                // Turno del enemigo
                await this.executeEnemyTurn();
                
                // Verificar si el jugador fue derrotado
                if (this.player.currentHealth <= 0) {
                    await this.endBattle('defeat');
                    return;
                }

                // Próximo turno
                this.nextTurn();
            }
        } catch (error) {
            console.error('Error ejecutando acción:', error);
            this.turnPhase = 'player';
            this.battleUI.enableActions();
        }
    }

    async processPlayerAction(actionType) {
        // Verificar acción especial de defensa primero
        if (actionType === 'defend') {
            return this.processDefendAction();
        }

        const action = this.player.attacks[actionType];
        if (!action) {
            throw new Error(`Acción ${actionType} no encontrada`);
        }

        if (this.player.energy < action.cost) {
            this.addToCombatLog('❌ No tienes suficiente energía');
            return { success: false, reason: 'insufficient_energy' };
        }

        if (this.player.isOnCooldown(actionType)) {
            this.addToCombatLog('❌ La habilidad está en cooldown');
            return { success: false, reason: 'on_cooldown' };
        }

        // Ejecutar ataque
        const damage = this.calculateDamage(this.player, this.enemy, action);
        const isCritical = this.calculateCriticalHit();
        const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

        // Aplicar daño
        this.enemy.takeDamage(finalDamage);
        
        // Consumir energía y aplicar cooldown
        this.player.consumeEnergy(action.cost);
        this.player.setCooldown(actionType, action.cooldown);

        // Efectos especiales por personaje
        this.applySpecialEffects(actionType);

        // Log del combate
        const critText = isCritical ? ' ¡CRÍTICO!' : '';
        this.addToCombatLog(`${this.player.name} usa ${action.name}${critText}`);
        this.addToCombatLog(`💥 Daño: ${finalDamage}`);

        return {
            success: true,
            damage: finalDamage,
            isCritical,
            actionType,
            actionName: action.name
        };
    }

    processDefendAction() {
        this.player.isDefending = true;
        this.addToCombatLog(`${this.player.name} se defiende`);
        
        return {
            success: true,
            actionType: 'defend',
            actionName: 'Defensa'
        };
    }

    calculateDamage(attacker, defender, action) {
        const [minDamage, maxDamage] = action.damage;
        const baseDamage = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
        
        // Aplicar reducción por armadura
        const armorReduction = Math.min(defender.armor * 0.01, 0.8); // Máximo 80% de reducción
        const damageAfterArmor = Math.floor(baseDamage * (1 - armorReduction));
        
        return Math.max(damageAfterArmor, 1); // Mínimo 1 de daño
    }

    calculateCriticalHit() {
        return Math.random() < 0.15; // 15% de probabilidad crítica base
    }

    applySpecialEffects(actionType) {
        // Efectos especiales de Xair (Bijon)
        if (this.player.name === 'Xair Chikyu') {
            if (actionType === 'basic') {
                this.player.bijonEnergy = Math.min(this.player.bijonEnergy + 15, 100);
            }
            
            if (this.player.bijonEnergy >= 100 && actionType === 'ultimate') {
                // Sobrecarga Bijon - efectos especiales
                this.player.bijonEnergy = 0;
                this.addToCombatLog('⚡ ¡Sobrecarga Bijon activada!');
            }
        }
    }

    async executeEnemyTurn() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // IA simple del enemigo
        const enemyAction = this.calculateEnemyAction();
        const damage = this.calculateEnemyDamage();
        
        // Aplicar defensa del jugador
        let finalDamage = damage;
        if (this.player.isDefending) {
            finalDamage = Math.floor(damage * 0.6); // 40% de reducción
            this.player.isDefending = false;
            this.addToCombatLog('🛡️ Daño reducido por la defensa');
        }
        
        this.player.takeDamage(finalDamage);
        
        this.addToCombatLog(`${this.enemy.name} ataca`);
        this.addToCombatLog(`💥 Daño recibido: ${finalDamage}`);
        
        // Efectos visuales del ataque enemigo
        await this.effectsManager.playEnemyAttackEffect(finalDamage);
        
        this.vibrate(200);
    }

    calculateEnemyAction() {
        // IA simple por ahora
        return 'basic_attack';
    }

    calculateEnemyDamage() {
        const [min, max] = [80, 140]; // Daño base del enemigo
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    nextTurn() {
        this.currentTurn++;
        this.turnPhase = 'player';
        
        // Regenerar energía del jugador
        this.player.regenerateEnergy(20);
        
        // Actualizar cooldowns
        this.player.updateCooldowns();
        
        // Actualizar UI
        this.battleUI.updateAll();
        this.battleUI.enableActions();
        
        console.log(`🔄 Turno ${this.currentTurn}`);
    }

    async endBattle(result) {
        this.gameState = 'ended';
        
        const resultData = {
            result,
            turns: this.currentTurn,
            playerHealth: this.player.currentHealth,
            enemyHealth: this.enemy.currentHealth
        };
        
        await this.battleUI.showResult(resultData);
        
        if (result === 'victory') {
            this.soundManager.playVictory();
            this.vibrate([100, 50, 100, 50, 200]);
        } else {
            this.soundManager.playDefeat();
            this.vibrate(500);
        }
    }

    addToCombatLog(message) {
        this.combatLog.push({
            message,
            timestamp: Date.now()
        });
        
        // Mantener solo los últimos 10 mensajes
        if (this.combatLog.length > 10) {
            this.combatLog.shift();
        }
        
        this.battleUI.updateCombatLog(message);
    }

    vibrate(pattern) {
        if (this.settings.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    loadSettings() {
        const saved = localStorage.getItem('einherjar_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('einherjar_settings', JSON.stringify(this.settings));
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        
        // Aplicar cambios inmediatamente
        if (key === 'sfxVolume') {
            this.soundManager.setVolume(value);
        }
    }

    exitBattle() {
        if (confirm('¿Estás seguro de que quieres salir del combate?')) {
            window.location.href = '../seleccion.php';
        }
    }

    nextBattle() {
        // Por ahora, reiniciar el combate
        window.location.reload();
    }

    showError(message) {
        alert(`Error: ${message}`);
        this.exitBattle();
    }
}

// Hacer la clase disponible globalmente
window.GameEngine = GameEngine;

/**
 * Sistema de UI para la Batalla - Einherjar Blitz
 * Maneja toda la interfaz de usuario y animaciones
 */

export class BattleUI {
    constructor(battleSystem) {
        this.battleSystem = battleSystem;
        this.elements = {};
        this.animationQueue = [];
        this.isAnimating = false;
        
        this.initializeElements();
        this.setupEventListeners();
    }
    
    /**
     * Inicializa referencias a elementos del    /**
     * Habilita o deshabilita botones de acción
     */
    setActionButtonsEnabled(enabled) {
        const buttons = [this.elements.attackBtn, this.elements.defendBtn, this.elements.specialBtn, this.elements.healBtn];
        buttons.forEach(btn => {
            if (btn) btn.disabled = !enabled;
        });
    }
    
    /**
     * Inicializa referencias a elementos del DOM
     */
    initializeElements() {
        // Header elements
        this.elements.roundNumber = document.getElementById('roundNumber');
        this.elements.currentTurn = document.getElementById('currentTurn');
        this.elements.battleTimer = document.getElementById('battleTimer');
        
        // Player elements
        this.elements.playerImage = document.getElementById('playerImage');
        this.elements.playerName = document.getElementById('playerName');
        this.elements.playerTitle = document.getElementById('playerTitle');
        this.elements.playerRarity = document.getElementById('playerRarity');
        this.elements.playerHealthText = document.getElementById('playerHealthText');
        this.elements.playerHealthBar = document.getElementById('playerHealthBar');
        this.elements.playerEnergyText = document.getElementById('playerEnergyText');
        this.elements.playerEnergyBar = document.getElementById('playerEnergyBar');
        this.elements.playerAttack = document.getElementById('playerAttack');
        this.elements.playerDefense = document.getElementById('playerDefense');
        this.elements.playerResistance = document.getElementById('playerResistance');
        this.elements.playerStatus = document.getElementById('playerStatus');
        this.elements.playerElementGlow = document.getElementById('playerElementGlow');
        this.elements.playerStatusEffects = document.getElementById('playerStatusEffects');
        this.elements.playerDamage = document.getElementById('playerDamage');
        
        // Enemy elements
        this.elements.enemyImage = document.getElementById('enemyImage');
        this.elements.enemyName = document.getElementById('enemyName');
        this.elements.enemyTitle = document.getElementById('enemyTitle');
        this.elements.enemyRarity = document.getElementById('enemyRarity');
        this.elements.enemyHealthText = document.getElementById('enemyHealthText');
        this.elements.enemyHealthBar = document.getElementById('enemyHealthBar');
        this.elements.enemyEnergyText = document.getElementById('enemyEnergyText');
        this.elements.enemyEnergyBar = document.getElementById('enemyEnergyBar');
        this.elements.enemyAttack = document.getElementById('enemyAttack');
        this.elements.enemyDefense = document.getElementById('enemyDefense');
        this.elements.enemyResistance = document.getElementById('enemyResistance');
        this.elements.enemyStatus = document.getElementById('enemyStatus');
        this.elements.enemyElementGlow = document.getElementById('enemyElementGlow');
        this.elements.enemyStatusEffects = document.getElementById('enemyStatusEffects');
        this.elements.enemyDamage = document.getElementById('enemyDamage');
        
        // Battle log
        this.elements.battleLogContainer = document.getElementById('battleLogContainer');
        
        // Action buttons
        this.elements.attackBtn = document.getElementById('attackBtn');
        this.elements.defendBtn = document.getElementById('defendBtn');
        this.elements.specialBtn = document.getElementById('specialBtn');
        this.elements.healBtn = document.getElementById('healBtn');
        this.elements.surrenderBtn = document.getElementById('surrenderBtn');
        this.elements.specialName = document.getElementById('specialName');
        this.elements.specialCost = document.getElementById('specialCost');
        
        // Modals
        this.elements.battleEndModal = document.getElementById('battleEndModal');
        this.elements.settingsModal = document.getElementById('settingsModal');
        this.elements.battleResultTitle = document.getElementById('battleResultTitle');
        this.elements.resultIcon = document.getElementById('resultIcon');
        this.elements.battleDuration = document.getElementById('battleDuration');
        this.elements.totalRounds = document.getElementById('totalRounds');
        this.elements.totalDamage = document.getElementById('totalDamage');
        this.elements.rewardsList = document.getElementById('rewardsList');
        
        // Modal buttons
        this.elements.continueBtn = document.getElementById('continueBtn');
        this.elements.playAgainBtn = document.getElementById('playAgainBtn');
        this.elements.settingsBtn = document.getElementById('settingsBtn');
        this.elements.closeSettings = document.getElementById('closeSettings');
        
        // Battle effects
        this.elements.battleEffects = document.getElementById('battleEffects');
    }
    
    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Action buttons
        this.elements.attackBtn?.addEventListener('click', () => this.handlePlayerAction('attack'));
        this.elements.defendBtn?.addEventListener('click', () => this.handlePlayerAction('defend'));
        this.elements.specialBtn?.addEventListener('click', () => this.handlePlayerAction('special'));
        this.elements.healBtn?.addEventListener('click', () => this.handlePlayerAction('heal'));
        this.elements.surrenderBtn?.addEventListener('click', () => this.handleSurrender());
        
        // Modal buttons
        this.elements.continueBtn?.addEventListener('click', () => this.handleBattleEnd());
        this.elements.playAgainBtn?.addEventListener('click', () => this.handlePlayAgain());
        this.elements.settingsBtn?.addEventListener('click', () => this.showSettingsModal());
        this.elements.closeSettings?.addEventListener('click', () => this.hideSettingsModal());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Click outside modal to close
        this.elements.settingsModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.hideSettingsModal();
            }
        });
    }
    
    /**
     * Maneja acciones del jugador
     */
    async handlePlayerAction(action) {
        if (this.battleSystem.isProcessingTurn || this.battleSystem.battleEnded) {
            return;
        }
        
        // Deshabilitar botones temporalmente
        this.setActionButtonsEnabled(false);
        
        try {
            const result = await this.battleSystem.processPlayerAction(action);
            
            if (result.success) {
                // Mostrar animación de acción
                await this.playActionAnimation(action, 'player', result);
                
                // Actualizar UI
                this.updateBattleState();
                
                // Verificar fin de batalla
                const battleEnd = this.battleSystem.checkBattleEnd();
                if (battleEnd && battleEnd.ended) {
                    this.showBattleEndModal(battleEnd);
                    return;
                }
                
                // Actualizar estado después de la acción del jugador
                this.updateBattleState();
                
                // Esperar turno del enemigo si es necesario
                if (this.battleSystem.currentTurn === 'enemy') {
                    this.setActionButtonsEnabled(false);
                    setTimeout(async () => {
                        try {
                            const enemyResult = await this.battleSystem.processEnemyTurn();
                            if (enemyResult && enemyResult.success) {
                                await this.playActionAnimation(enemyResult.action, 'enemy', enemyResult.result);
                                this.updateBattleState();
                                
                                const battleEnd = this.battleSystem.checkBattleEnd();
                                if (battleEnd && battleEnd.ended) {
                                    this.showBattleEndModal(battleEnd);
                                } else {
                                    this.setActionButtonsEnabled(true);
                                }
                            } else {
                                // Si el enemigo no puede actuar, devolver turno al jugador
                                this.setActionButtonsEnabled(true);
                            }
                        } catch (error) {
                            console.error('Error en turno del enemigo:', error);
                            this.setActionButtonsEnabled(true);
                        }
                    }, 1500);
                } else {
                    this.setActionButtonsEnabled(true);
                }
            } else {
                this.showMessage(result.message, 'error');
                this.setActionButtonsEnabled(true);
            }
        } catch (error) {
            console.error('Error en acción del jugador:', error);
            this.setActionButtonsEnabled(true);
        }
    }
    
    /**
     * Actualiza toda la UI con el estado actual de la batalla
     */
    updateBattleState() {
        const state = this.battleSystem.getBattleState();
        
        // Actualizar header
        this.updateHeader(state);
        
        // Actualizar personajes
        if (state.player) this.updateCharacterUI('player', state.player);
        if (state.enemy) this.updateCharacterUI('enemy', state.enemy);
        
        // Actualizar log de batalla
        this.updateBattleLog(state.battleLog);
        
        // Actualizar botones de acción
        this.updateActionButtons(state);
    }
    
    /**
     * Actualiza el header de la batalla
     */
    updateHeader(state) {
        if (this.elements.roundNumber) {
            this.elements.roundNumber.textContent = state.round;
        }
        
        if (this.elements.currentTurn) {
            const turnText = state.currentTurn === 'player' ? 
                (state.player ? state.player.name : 'Jugador') : 
                (state.enemy ? state.enemy.name : 'Enemigo');
            this.elements.currentTurn.textContent = turnText;
            this.elements.currentTurn.className = `turn-player ${state.currentTurn}`;
        }
        
        if (this.elements.battleTimer) {
            const duration = Math.floor(state.duration / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            this.elements.battleTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Actualiza la UI de un personaje
     */
    updateCharacterUI(type, character) {
        const prefix = type === 'player' ? 'player' : 'enemy';
        
        // Imagen y información básica
        if (this.elements[`${prefix}Image`]) {
            this.elements[`${prefix}Image`].src = `../images/${character.image}`;
            this.elements[`${prefix}Image`].alt = character.name;
        }
        
        if (this.elements[`${prefix}Name`]) {
            this.elements[`${prefix}Name`].textContent = character.name;
        }
        
        if (this.elements[`${prefix}Title`]) {
            this.elements[`${prefix}Title`].textContent = character.title;
        }
        
        if (this.elements[`${prefix}Rarity`]) {
            this.elements[`${prefix}Rarity`].textContent = character.rarity;
            this.elements[`${prefix}Rarity`].className = `rarity-badge ${character.rarity.toLowerCase()}`;
        }
        
        // Barras de vida y energía
        this.updateHealthBar(type, character);
        this.updateEnergyBar(type, character);
        
        // Estadísticas
        if (this.elements[`${prefix}Attack`]) {
            this.elements[`${prefix}Attack`].textContent = `${character.attack.min}-${character.attack.max}`;
        }
        
        if (this.elements[`${prefix}Defense`]) {
            this.elements[`${prefix}Defense`].textContent = character.armor;
        }
        
        if (this.elements[`${prefix}Resistance`]) {
            this.elements[`${prefix}Resistance`].textContent = `${character.elementalResistance}%`;
        }
        
        // Glow elemental
        if (this.elements[`${prefix}ElementGlow`]) {
            this.elements[`${prefix}ElementGlow`].className = `element-glow ${character.element.toLowerCase()}`;
        }
        
        // Status indicator
        if (this.elements[`${prefix}Status`]) {
            const healthPercent = character.health.current / character.health.max;
            let statusClass, statusIcon;
            
            if (healthPercent > 0.7) {
                statusClass = 'status-good';
                statusIcon = '😊';
            } else if (healthPercent > 0.3) {
                statusClass = 'status-warning';
                statusIcon = '😐';
            } else {
                statusClass = 'status-danger';
                statusIcon = '😵';
            }
            
            this.elements[`${prefix}Status`].className = `character-status ${statusClass}`;
            this.elements[`${prefix}Status`].textContent = statusIcon;
        }
        
        // Efectos de estado
        this.updateStatusEffects(type, character.statusEffects || []);
    }
    
    /**
     * Actualiza la barra de vida
     */
    updateHealthBar(type, character) {
        const prefix = type === 'player' ? 'player' : 'enemy';
        
        if (this.elements[`${prefix}HealthText`]) {
            this.elements[`${prefix}HealthText`].textContent = `${character.health.current}/${character.health.max}`;
        }
        
        if (this.elements[`${prefix}HealthBar`]) {
            const healthPercent = (character.health.current / character.health.max) * 100;
            this.elements[`${prefix}HealthBar`].style.width = `${healthPercent}%`;
            
            // Cambiar color según el porcentaje de vida
            if (healthPercent > 50) {
                this.elements[`${prefix}HealthBar`].style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
            } else if (healthPercent > 25) {
                this.elements[`${prefix}HealthBar`].style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
            } else {
                this.elements[`${prefix}HealthBar`].style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
            }
        }
    }
    
    /**
     * Actualiza la barra de energía
     */
    updateEnergyBar(type, character) {
        const prefix = type === 'player' ? 'player' : 'enemy';
        
        if (this.elements[`${prefix}EnergyText`]) {
            this.elements[`${prefix}EnergyText`].textContent = `${character.energy}/${character.maxEnergy}`;
        }
        
        if (this.elements[`${prefix}EnergyBar`]) {
            const energyPercent = (character.energy / character.maxEnergy) * 100;
            this.elements[`${prefix}EnergyBar`].style.width = `${energyPercent}%`;
        }
    }
    
    /**
     * Actualiza los efectos de estado
     */
    updateStatusEffects(type, statusEffects) {
        const prefix = type === 'player' ? 'player' : 'enemy';
        const container = this.elements[`${prefix}StatusEffects`];
        
        if (!container) return;
        
        container.innerHTML = '';
        
        statusEffects.forEach(effect => {
            const effectElement = document.createElement('div');
            effectElement.className = `status-effect ${effect.type === 'buff' ? 'buff' : 'debuff'}`;
            
            let icon = '';
            switch (effect.type) {
                case 'defend':
                    icon = '🛡️';
                    break;
                case 'freeze':
                    icon = '❄️';
                    break;
                case 'armor_boost':
                    icon = '💪';
                    break;
                default:
                    icon = '✨';
            }
            
            effectElement.innerHTML = `${icon} ${effect.duration}`;
            container.appendChild(effectElement);
        });
    }
    
    /**
     * Actualiza el log de batalla
     */
    updateBattleLog(battleLog) {
        if (!this.elements.battleLogContainer) return;
        
        // Mostrar solo las últimas 10 entradas
        const recentLogs = battleLog.slice(-10);
        
        this.elements.battleLogContainer.innerHTML = '';
        
        recentLogs.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry ${log.type}-message`;
            
            let icon = '';
            switch (log.type) {
                case 'system':
                    icon = '<i class=\"fas fa-info-circle\"></i>';
                    break;
                case 'damage':
                    icon = '<i class=\"fas fa-sword\"></i>';
                    break;
                case 'heal':
                    icon = '<i class=\"fas fa-heart\"></i>';
                    break;
                case 'player-action':
                    icon = '<i class=\"fas fa-user\"></i>';
                    break;
                default:
                    icon = '<i class=\"fas fa-circle\"></i>';
            }
            
            logElement.innerHTML = `${icon} ${log.message}`;
            this.elements.battleLogContainer.appendChild(logElement);
        });
        
        // Scroll hacia abajo
        this.elements.battleLogContainer.scrollTop = this.elements.battleLogContainer.scrollHeight;
    }
    
    /**
     * Actualiza el estado de los botones de acción
     */
    updateActionButtons(state) {
        const isPlayerTurn = state.currentTurn === 'player' && !state.isProcessingTurn && !state.battleEnded;
        
        this.setActionButtonsEnabled(isPlayerTurn);
        
        if (state.player) {
            // Actualizar costo de habilidad especial
            const specialCost = this.battleSystem.getSpecialAbilityCost(state.player);
            if (this.elements.specialCost) {
                this.elements.specialCost.textContent = specialCost;
            }
            
            // Actualizar nombre de habilidad especial
            if (this.elements.specialName) {
                const abilityNames = {
                    'Shuna Shieda': 'Furia Devastadora',
                    'Ozen Kimura': 'Muralla Inamovible',
                    'Xair Chikyu': 'Viento Gélido',
                    'Nathan Doffens': 'Teletransporte'
                };
                this.elements.specialName.textContent = abilityNames[state.player.name] || 'Especial';
            }
            
            // Deshabilitar botones según energía
            if (this.elements.specialBtn) {
                this.elements.specialBtn.disabled = state.player.energy < specialCost || !isPlayerTurn;
            }
            
            if (this.elements.healBtn) {
                this.elements.healBtn.disabled = state.player.energy < 20 || !isPlayerTurn;
            }
        }
    }
    
    /**
     * Habilita/deshabilita botones de acción
     */
    setActionButtonsEnabled(enabled) {
        const buttons = [this.elements.attackBtn, this.elements.defendBtn, this.elements.specialBtn, this.elements.healBtn];
        buttons.forEach(btn => {
            if (btn) btn.disabled = !enabled;
        });
    }
    
    /**
     * Reproduce animación de acción
     */
    async playActionAnimation(action, actor, result) {
        const actorElement = actor === 'player' ? 
            document.querySelector('.player-character') : 
            document.querySelector('.enemy-character');
        
        if (!actorElement) return;
        
        // Animación base
        actorElement.classList.add('action-animation', `action-${action}`);
        
        // Mostrar daño si es aplicable
        if (result.damage && result.damage > 0) {
            this.showDamageNumber(actor === 'player' ? 'enemy' : 'player', result.damage, result.critical);
        }
        
        // Efectos especiales según la acción
        switch (action) {
            case 'attack':
                this.playAttackEffect(actor, result);
                break;
            case 'special':
                this.playSpecialEffect(actor, result);
                break;
            case 'heal':
                this.playHealEffect(actor, result);
                break;
        }
        
        // Remover animación después de completarla
        setTimeout(() => {
            actorElement.classList.remove('action-animation', `action-${action}`);
        }, 800);
    }
    
    /**
     * Muestra número de daño
     */
    showDamageNumber(target, damage, critical = false) {
        const targetElement = target === 'player' ? 
            this.elements.playerDamage : 
            this.elements.enemyDamage;
        
        if (!targetElement) return;
        
        targetElement.textContent = critical ? `${damage}!` : damage;
        targetElement.className = `damage-indicator ${critical ? 'critical' : ''}`;
        targetElement.style.color = critical ? '#f1c40f' : '#e74c3c';
        targetElement.style.opacity = '1';
        
        // Remover después de la animación
        setTimeout(() => {
            targetElement.style.opacity = '0';
        }, 1000);
    }
    
    /**
     * Efecto de ataque
     */
    playAttackEffect(actor, result) {
        // Efecto de flash en el objetivo
        const targetElement = actor === 'player' ? 
            document.querySelector('.enemy-character') : 
            document.querySelector('.player-character');
        
        if (targetElement) {
            targetElement.classList.add('damage-flash');
            setTimeout(() => {
                targetElement.classList.remove('damage-flash');
            }, 300);
        }
    }
    
    /**
     * Efecto de habilidad especial
     */
    playSpecialEffect(actor, result) {
        const actorElement = actor === 'player' ? 
            document.querySelector('.player-character') : 
            document.querySelector('.enemy-character');
        
        if (actorElement) {
            actorElement.classList.add('special-glow');
            setTimeout(() => {
                actorElement.classList.remove('special-glow');
            }, 1000);
        }
    }
    
    /**
     * Efecto de curación
     */
    playHealEffect(actor, result) {
        const actorElement = actor === 'player' ? 
            document.querySelector('.player-character') : 
            document.querySelector('.enemy-character');
        
        if (actorElement) {
            actorElement.classList.add('heal-glow');
            setTimeout(() => {
                actorElement.classList.remove('heal-glow');
            }, 800);
        }
    }
    
    /**
     * Muestra modal de fin de batalla
     */
    showBattleEndModal(battleResult) {
        if (!this.elements.battleEndModal) return;
        
        // Configurar contenido del modal
        if (this.elements.battleResultTitle) {
            this.elements.battleResultTitle.textContent = battleResult.result;
        }
        
        if (this.elements.resultIcon) {
            const iconClass = battleResult.winner === 'player' ? 'victory fas fa-trophy' : 'defeat fas fa-skull';
            this.elements.resultIcon.className = `result-icon ${iconClass}`;
        }
        
        // Estadísticas de batalla
        if (this.elements.battleDuration) {
            const duration = Math.floor(battleResult.duration / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            this.elements.battleDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (this.elements.totalRounds) {
            this.elements.totalRounds.textContent = this.battleSystem.round;
        }
        
        if (this.elements.totalDamage) {
            this.elements.totalDamage.textContent = battleResult.stats.totalDamageDealt;
        }
        
        // Mostrar modal
        this.elements.battleEndModal.classList.add('active');
    }
    
    /**
     * Maneja el fin de batalla
     */
    handleBattleEnd() {
        this.elements.battleEndModal?.classList.remove('active');
        // Redirigir de vuelta a selección
        window.location.href = '../dashboard.php';
    }
    
    /**
     * Maneja jugar de nuevo
     */
    handlePlayAgain() {
        this.elements.battleEndModal?.classList.remove('active');
        this.battleSystem.resetBattle();
        this.updateBattleState();
        this.setActionButtonsEnabled(true);
    }
    
    /**
     * Maneja rendirse
     */
    handleSurrender() {
        if (confirm('¿Estás seguro de que quieres rendirte?')) {
            const surrenderResult = this.battleSystem.surrenderBattle();
            if (surrenderResult) {
                this.showBattleEndModal(surrenderResult);
            }
        }
    }
    
    /**
     * Muestra modal de configuración
     */
    showSettingsModal() {
        this.elements.settingsModal?.classList.add('active');
    }
    
    /**
     * Oculta modal de configuración
     */
    hideSettingsModal() {
        this.elements.settingsModal?.classList.remove('active');
    }
    
    /**
     * Maneja atajos de teclado
     */
    handleKeyboard(event) {
        if (this.battleSystem.isProcessingTurn || this.battleSystem.battleEnded) return;
        if (this.battleSystem.currentTurn !== 'player') return;
        
        switch (event.key.toLowerCase()) {
            case '1':
            case 'a':
                event.preventDefault();
                this.handlePlayerAction('attack');
                break;
            case '2':
            case 'd':
                event.preventDefault();
                this.handlePlayerAction('defend');
                break;
            case '3':
            case 's':
                event.preventDefault();
                this.handlePlayerAction('special');
                break;
            case '4':
            case 'h':
                event.preventDefault();
                this.handlePlayerAction('heal');
                break;
            case 'escape':
                event.preventDefault();
                this.handleSurrender();
                break;
        }
    }
    
    /**
     * Muestra mensaje temporal
     */
    showMessage(message, type = 'info') {
        // Crear elemento de mensaje temporal
        const messageElement = document.createElement('div');
        messageElement.className = `battle-message ${type}`;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
    
    /**
     * Inicializa la UI con datos de personajes
     */
    initializeWithCharacters(playerData, enemyData) {
        this.updateCharacterUI('player', playerData);
        this.updateCharacterUI('enemy', enemyData);
        this.updateBattleState();
        
        // Asegurar que los botones estén habilitados si es el turno del jugador
        setTimeout(() => {
            const state = this.battleSystem.getBattleState();
            const isPlayerTurn = state.currentTurn === 'player' && !state.isProcessingTurn && !state.battleEnded;
            this.setActionButtonsEnabled(isPlayerTurn);
        }, 100);
    }
}

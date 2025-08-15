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
        
        // Modal elements
        this.elements.battleEndModal = document.getElementById('battleEndModal');
        this.elements.settingsModal = document.getElementById('settingsModal');
        this.elements.battleResultTitle = document.getElementById('battleResultTitle');
        this.elements.resultIcon = document.getElementById('resultIcon');
        this.elements.battleDuration = document.getElementById('battleDuration');
        this.elements.totalRounds = document.getElementById('totalRounds');
        this.elements.totalDamageDealt = document.getElementById('totalDamageDealt');
        this.elements.totalDamageReceived = document.getElementById('totalDamageReceived');
        this.elements.criticalHits = document.getElementById('criticalHits');
        this.elements.specialAbilitiesUsed = document.getElementById('specialAbilitiesUsed');
        this.elements.rewardsList = document.getElementById('rewardsList');
        this.elements.resultDescription = document.getElementById('resultDescription');
        
        // Final character summary elements
        this.elements.finalPlayerImage = document.getElementById('finalPlayerImage');
        this.elements.finalPlayerName = document.getElementById('finalPlayerName');
        this.elements.finalPlayerHealth = document.getElementById('finalPlayerHealth');
        this.elements.finalPlayerMaxHealth = document.getElementById('finalPlayerMaxHealth');
        this.elements.finalEnemyImage = document.getElementById('finalEnemyImage');
        this.elements.finalEnemyName = document.getElementById('finalEnemyName');
        this.elements.finalEnemyHealth = document.getElementById('finalEnemyHealth');
        this.elements.finalEnemyMaxHealth = document.getElementById('finalEnemyMaxHealth');
        
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
                console.log('Battle end check after player action:', battleEnd);
                if (battleEnd && battleEnd.ended) {
                    console.log('Showing battle end modal with result:', battleEnd);
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
                                console.log('Battle end check after enemy action:', battleEnd);
                                if (battleEnd && battleEnd.ended) {
                                    console.log('Showing battle end modal after enemy turn:', battleEnd);
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
        
        // Estadísticas efectivas (considerando buffs/debuffs)
        this.updateEffectiveStats(type, character);
        
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
     * Calcula las estadísticas efectivas considerando todos los efectos de estado
     */
    calculateEffectiveStats(character) {
        let effectiveStats = {
            attack: {
                min: character.attack.min,
                max: character.attack.max
            },
            armor: character.armor,
            elementalResistance: character.elementalResistance,
            defenseReduction: character.defenseReduction || 0
        };
        
        // Aplicar efectos de estado si existen
        if (character.statusEffects && character.statusEffects.length > 0) {
            character.statusEffects.forEach(effect => {
                switch (effect.type) {
                    case 'defense_reduction':
                        effectiveStats.armor = Math.max(0, effectiveStats.armor - (effectiveStats.armor * (effect.value / 100)));
                        break;
                    case 'defense_boost':
                        effectiveStats.armor += (effectiveStats.armor * (effect.value / 100));
                        break;
                    case 'attack_boost':
                        effectiveStats.attack.min += (effectiveStats.attack.min * (effect.value / 100));
                        effectiveStats.attack.max += (effectiveStats.attack.max * (effect.value / 100));
                        break;
                    case 'attack_reduction':
                        effectiveStats.attack.min = Math.max(1, effectiveStats.attack.min - (effectiveStats.attack.min * (effect.value / 100)));
                        effectiveStats.attack.max = Math.max(1, effectiveStats.attack.max - (effectiveStats.attack.max * (effect.value / 100)));
                        break;
                    case 'resistance_boost':
                        effectiveStats.elementalResistance = Math.min(100, effectiveStats.elementalResistance + effect.value);
                        break;
                    case 'resistance_reduction':
                        effectiveStats.elementalResistance = Math.max(0, effectiveStats.elementalResistance - effect.value);
                        break;
                    case 'nathan_ultimate':
                        // Nathan: duplica ataque y reduce daño 50%
                        effectiveStats.attack.min *= effect.attackMultiplier;
                        effectiveStats.attack.max *= effect.attackMultiplier;
                        effectiveStats.defenseReduction += effect.damageReduction;
                        break;
                    case 'shuna_ultimate':
                        // Shuna: duplica todas las estadísticas
                        effectiveStats.attack.min *= 2;
                        effectiveStats.attack.max *= 2;
                        effectiveStats.armor *= 2;
                        effectiveStats.elementalResistance = Math.min(100, effectiveStats.elementalResistance * 2);
                        break;
                    case 'defend':
                        // Efecto de defensa temporal
                        effectiveStats.defenseReduction += effect.value;
                        break;
                }
            });
        }
        
        // Redondear valores
        effectiveStats.attack.min = Math.floor(effectiveStats.attack.min);
        effectiveStats.attack.max = Math.floor(effectiveStats.attack.max);
        effectiveStats.armor = Math.floor(effectiveStats.armor);
        effectiveStats.elementalResistance = Math.min(100, Math.max(0, Math.floor(effectiveStats.elementalResistance)));
        effectiveStats.defenseReduction = Math.min(100, Math.max(0, Math.floor(effectiveStats.defenseReduction)));
        
        return effectiveStats;
    }
    
    /**
     * Actualiza las estadísticas mostradas con los valores efectivos (considerando buffs/debuffs)
     */
    updateEffectiveStats(type, character) {
        const prefix = type === 'player' ? 'player' : 'enemy';
        const effectiveStats = this.calculateEffectiveStats(character);
        
        // Actualizar ataque con indicador visual si está modificado
        if (this.elements[`${prefix}Attack`]) {
            const originalAttack = `${character.attack.min}-${character.attack.max}`;
            const effectiveAttack = `${effectiveStats.attack.min}-${effectiveStats.attack.max}`;
            
            if (originalAttack !== effectiveAttack) {
                this.elements[`${prefix}Attack`].innerHTML = `
                    <span class="stat-modified">${effectiveAttack}</span>
                    <span class="stat-original">(${originalAttack})</span>
                `;
                
                // Determinar si es buff o debuff
                const isBuffed = effectiveStats.attack.max > character.attack.max;
                this.elements[`${prefix}Attack`].className = isBuffed ? 'stat-buffed' : 'stat-debuffed';
            } else {
                this.elements[`${prefix}Attack`].innerHTML = effectiveAttack;
                this.elements[`${prefix}Attack`].className = '';
            }
        }
        
        // Actualizar defensa con indicador visual si está modificada
        if (this.elements[`${prefix}Defense`]) {
            const originalDefense = character.armor;
            const effectiveDefense = effectiveStats.armor;
            
            if (originalDefense !== effectiveDefense) {
                this.elements[`${prefix}Defense`].innerHTML = `
                    <span class="stat-modified">${effectiveDefense}</span>
                    <span class="stat-original">(${originalDefense})</span>
                `;
                
                const isBuffed = effectiveDefense > originalDefense;
                this.elements[`${prefix}Defense`].className = isBuffed ? 'stat-buffed' : 'stat-debuffed';
            } else {
                this.elements[`${prefix}Defense`].innerHTML = effectiveDefense;
                this.elements[`${prefix}Defense`].className = '';
            }
        }
        
        // Actualizar resistencia elemental con indicador visual si está modificada
        if (this.elements[`${prefix}Resistance`]) {
            const originalResistance = character.elementalResistance;
            const effectiveResistance = effectiveStats.elementalResistance;
            
            if (originalResistance !== effectiveResistance) {
                this.elements[`${prefix}Resistance`].innerHTML = `
                    <span class="stat-modified">${effectiveResistance}%</span>
                    <span class="stat-original">(${originalResistance}%)</span>
                `;
                
                const isBuffed = effectiveResistance > originalResistance;
                this.elements[`${prefix}Resistance`].className = isBuffed ? 'stat-buffed' : 'stat-debuffed';
            } else {
                this.elements[`${prefix}Resistance`].innerHTML = `${effectiveResistance}%`;
                this.elements[`${prefix}Resistance`].className = '';
            }
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
     * Muestra modal de fin de batalla con estadísticas detalladas
     */
    showBattleEndModal(battleResult) {
        console.log('showBattleEndModal called with:', battleResult);
        
        if (!this.elements.battleEndModal) {
            console.error('battleEndModal element not found!');
            return;
        }
        
        console.log('battleEndModal element found, proceeding with modal setup');
        
        // Obtener estadísticas detalladas de la batalla
        const battleStats = this.battleSystem.getBattleResult();
        const playerStats = this.battleSystem.player ? this.battleSystem.player.getStats() : null;
        const enemyStats = this.battleSystem.enemy ? this.battleSystem.enemy.getStats() : null;
        
        console.log('Battle stats:', battleStats);
        console.log('Player stats:', playerStats);
        console.log('Enemy stats:', enemyStats);
        
        // Configurar título y tipo de resultado
        this.configureBattleResultTitle(battleResult);
        
        // Configurar resumen final de personajes
        this.configureFinalCharactersSummary(playerStats, enemyStats);
        
        // Configurar estadísticas detalladas
        this.configureDetailedStats(battleResult);
        
        // Configurar mensaje de resultado específico
        this.configureResultMessage(battleResult);
        
        // Configurar recompensas
        this.configureRewards(battleResult);
        
        // Aplicar clase CSS según el resultado
        this.applyResultStyling(battleResult);
        
        // Mostrar modal
        console.log('Adding active class to modal');
        this.elements.battleEndModal.classList.add('active');
        
        console.log('Modal should now be visible');
        
        // Añadir efectos sonoros según el resultado (si están disponibles)
        this.playResultSound(battleResult);
    }
    
    /**
     * Configura el título y icono del resultado
     */
    configureBattleResultTitle(battleResult) {
        let title, iconClass;
        
        switch (battleResult.winner) {
            case 'player':
                if (battleResult.battleType === 'enemy_defeated') {
                    title = '¡VICTORIA ÉPICA!';
                } else {
                    title = '¡VICTORIA!';
                }
                iconClass = 'result-icon victory fas fa-trophy';
                break;
                
            case 'enemy':
                if (battleResult.surrendered) {
                    title = 'BATALLA ABANDONADA';
                    iconClass = 'result-icon surrender fas fa-flag';
                } else {
                    title = 'DERROTA';
                    iconClass = 'result-icon defeat fas fa-skull';
                }
                break;
                
            case 'draw':
                title = 'EMPATE';
                iconClass = 'result-icon draw fas fa-handshake';
                break;
                
            default:
                title = 'BATALLA TERMINADA';
                iconClass = 'result-icon fas fa-question';
        }
        
        if (this.elements.battleResultTitle) {
            this.elements.battleResultTitle.textContent = title;
        }
        
        if (this.elements.resultIcon) {
            this.elements.resultIcon.className = iconClass;
        }
    }
    
    /**
     * Configura el resumen final de los personajes
     */
    configureFinalCharactersSummary(playerStats, enemyStats) {
        if (playerStats) {
            if (this.elements.finalPlayerImage) {
                this.elements.finalPlayerImage.src = this.elements.playerImage?.src || '';
            }
            if (this.elements.finalPlayerName) {
                this.elements.finalPlayerName.textContent = playerStats.name;
            }
            if (this.elements.finalPlayerHealth) {
                this.elements.finalPlayerHealth.textContent = playerStats.health.current;
            }
            if (this.elements.finalPlayerMaxHealth) {
                this.elements.finalPlayerMaxHealth.textContent = playerStats.health.max;
            }
        }
        
        if (enemyStats) {
            if (this.elements.finalEnemyImage) {
                this.elements.finalEnemyImage.src = this.elements.enemyImage?.src || '';
            }
            if (this.elements.finalEnemyName) {
                this.elements.finalEnemyName.textContent = enemyStats.name;
            }
            if (this.elements.finalEnemyHealth) {
                this.elements.finalEnemyHealth.textContent = enemyStats.health.current;
            }
            if (this.elements.finalEnemyMaxHealth) {
                this.elements.finalEnemyMaxHealth.textContent = enemyStats.health.max;
            }
        }
    }
    
    /**
     * Configura las estadísticas detalladas de batalla
     */
    configureDetailedStats(battleResult) {
        // Duración de la batalla
        if (this.elements.battleDuration && battleResult.duration) {
            const duration = Math.floor(battleResult.duration / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            this.elements.battleDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Número de rondas
        if (this.elements.totalRounds) {
            this.elements.totalRounds.textContent = this.battleSystem.round || 1;
        }
        
        // Estadísticas de daño y combate
        const stats = battleResult.stats || this.battleSystem.stats;
        if (stats) {
            if (this.elements.totalDamageDealt) {
                this.elements.totalDamageDealt.textContent = stats.totalDamageDealt || 0;
            }
            if (this.elements.totalDamageReceived) {
                this.elements.totalDamageReceived.textContent = stats.totalDamageReceived || 0;
            }
            if (this.elements.criticalHits) {
                this.elements.criticalHits.textContent = stats.criticalHits || 0;
            }
            if (this.elements.specialAbilitiesUsed) {
                this.elements.specialAbilitiesUsed.textContent = stats.specialAbilitiesUsed || 0;
            }
        }
    }
    
    /**
     * Configura el mensaje específico del resultado
     */
    configureResultMessage(battleResult) {
        if (!this.elements.resultDescription) return;
        
        let message = '';
        
        switch (battleResult.battleType) {
            case 'enemy_defeated':
                message = '¡Has derrotado completamente a tu oponente! Una victoria aplastante que demuestra tu superioridad en combate.';
                break;
            case 'player_defeated':
                message = 'Tu oponente ha demostrado ser superior en esta batalla. Analiza tus estrategias y regresa más fuerte.';
                break;
            case 'time_victory':
                message = 'Has logrado la victoria por supervivencia. Tu resistencia y estrategia han sido clave para superar a tu oponente.';
                break;
            case 'time_defeat':
                message = 'Aunque luchaste valientemente, tu oponente ha demostrado mayor resistencia en esta extensa batalla.';
                break;
            case 'time_draw':
                message = 'Una batalla igualada donde ambos combatientes han demostrado habilidades similares. ¡Un empate respetable!';
                break;
            case 'mutual_death':
                message = 'Ambos combatientes han caído simultáneamente. Una batalla épica que será recordada por su intensidad.';
                break;
            default:
                if (battleResult.surrendered) {
                    message = 'Has decidido abandonar la batalla. A veces la retirada estratégica es la mejor opción.';
                } else {
                    message = 'La batalla ha llegado a su fin de manera inesperada.';
                }
        }
        
        this.elements.resultDescription.textContent = message;
    }
    
    /**
     * Configura las recompensas obtenidas
     */
    configureRewards(battleResult) {
        if (!this.elements.rewardsList) return;
        
        // Limpiar recompensas anteriores
        this.elements.rewardsList.innerHTML = '';
        
        // Calcular experiencia y monedas
        const experienceGained = this.battleSystem.calculateExperienceGained();
        const coinsGained = this.battleSystem.calculateCoinsGained();
        
        // Añadir recompensa de experiencia
        if (experienceGained > 0) {
            const expReward = this.createRewardItem('fas fa-star', 'Experiencia', `+${experienceGained} XP`, '#3498db');
            this.elements.rewardsList.appendChild(expReward);
        }
        
        // Añadir recompensa de monedas
        if (coinsGained > 0) {
            const coinReward = this.createRewardItem('fas fa-coins', 'Monedas', `+${coinsGained}`, '#f1c40f');
            this.elements.rewardsList.appendChild(coinReward);
        }
        
        // Añadir bonificaciones especiales según el resultado
        if (battleResult.winner === 'player') {
            if (battleResult.battleType === 'enemy_defeated') {
                const perfectVictory = this.createRewardItem('fas fa-crown', 'Victoria Perfecta', 'Bonus +50%', '#e74c3c');
                this.elements.rewardsList.appendChild(perfectVictory);
            }
            
            // Bonificación por golpes críticos
            const criticalHits = this.battleSystem.stats.criticalHits || 0;
            if (criticalHits >= 3) {
                const criticalBonus = this.createRewardItem('fas fa-bolt', 'Maestro Crítico', `${criticalHits} críticos`, '#9b59b6');
                this.elements.rewardsList.appendChild(criticalBonus);
            }
        }
        
        // Si no hay recompensas, mostrar mensaje
        if (this.elements.rewardsList.children.length === 0) {
            const noRewards = document.createElement('div');
            noRewards.className = 'no-rewards';
            noRewards.textContent = 'No se obtuvieron recompensas en esta batalla.';
            noRewards.style.textAlign = 'center';
            noRewards.style.color = 'var(--text-muted)';
            noRewards.style.fontStyle = 'italic';
            this.elements.rewardsList.appendChild(noRewards);
        }
    }
    
    /**
     * Crea un elemento de recompensa
     */
    createRewardItem(iconClass, name, value, color) {
        const rewardItem = document.createElement('div');
        rewardItem.className = 'reward-item';
        
        rewardItem.innerHTML = `
            <div class="reward-icon" style="background-color: ${color}20; color: ${color};">
                <i class="${iconClass}"></i>
            </div>
            <div class="reward-details">
                <div class="reward-name">${name}</div>
                <div class="reward-value">${value}</div>
            </div>
        `;
        
        return rewardItem;
    }
    
    /**
     * Aplica estilos específicos según el resultado
     */
    applyResultStyling(battleResult) {
        const modalContent = this.elements.battleEndModal?.querySelector('.modal-content');
        if (!modalContent) return;
        
        // Remover clases anteriores
        modalContent.classList.remove('victory', 'defeat', 'surrender', 'draw');
        
        // Añadir clase según el resultado
        if (battleResult.winner === 'player') {
            modalContent.classList.add('victory');
        } else if (battleResult.winner === 'enemy') {
            if (battleResult.surrendered) {
                modalContent.classList.add('surrender');
            } else {
                modalContent.classList.add('defeat');
            }
        } else {
            modalContent.classList.add('draw');
        }
    }
    
    /**
     * Reproduce sonido según el resultado (placeholder para futura implementación)
     */
    playResultSound(battleResult) {
        // Aquí se pueden añadir efectos de sonido en el futuro
        try {
            if (battleResult.winner === 'player') {
                // Sonido de victoria
                console.log('🎵 Reproduciendo sonido de victoria');
            } else if (battleResult.winner === 'enemy') {
                // Sonido de derrota
                console.log('🎵 Reproduciendo sonido de derrota');
            } else {
                // Sonido de empate
                console.log('🎵 Reproduciendo sonido de empate');
            }
        } catch (error) {
            console.log('Audio no disponible:', error);
        }
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

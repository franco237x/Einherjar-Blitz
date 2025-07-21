/**
 * Interfaz de Usuario del Combate - Einherjar Blitz
 * Maneja todas las actualizaciones visuales y interacciones de la UI
 */

class BattleUI {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.elements = this.cacheElements();
        this.lastCombatMessage = '';
        this.setupEventListeners();
    }

    cacheElements() {
        return {
            // Header
            turnNumber: document.querySelector('.turn-number'),
            
            // Player elements
            playerName: document.getElementById('playerName'),
            playerAvatar: document.getElementById('playerAvatar'),
            playerHealth: document.getElementById('playerHealth'),
            playerMaxHealth: document.getElementById('playerMaxHealth'),
            playerHealthBar: document.getElementById('playerHealthBar'),
            playerEnergy: document.getElementById('playerEnergy'),
            playerEnergyBar: document.getElementById('playerEnergyBar'),
            playerArmor: document.getElementById('playerArmor'),
            playerResistance: document.getElementById('playerResistance'),
            playerStatusEffects: document.getElementById('playerStatusEffects'),
            playerDamageIndicator: document.getElementById('playerDamageIndicator'),
            
            // Enemy elements
            enemyName: document.getElementById('enemyName'),
            enemyAvatar: document.getElementById('enemyAvatar'),
            enemyHealth: document.getElementById('enemyHealth'),
            enemyMaxHealth: document.getElementById('enemyMaxHealth'),
            enemyHealthBar: document.getElementById('enemyHealthBar'),
            enemyArmor: document.getElementById('enemyArmor'),
            enemyResistance: document.getElementById('enemyResistance'),
            enemyStatusEffects: document.getElementById('enemyStatusEffects'),
            enemyDamageIndicator: document.getElementById('enemyDamageIndicator'),
            
            // Action buttons
            basicAttackBtn: document.getElementById('basicAttackBtn'),
            elementalAttackBtn: document.getElementById('elementalAttackBtn'),
            ultimateAttackBtn: document.getElementById('ultimateAttackBtn'),
            defendBtn: document.getElementById('defendBtn'),
            
            // Cooldown indicators
            basicCooldown: document.getElementById('basicCooldown'),
            elementalCooldown: document.getElementById('elementalCooldown'),
            ultimateCooldown: document.getElementById('ultimateCooldown'),
            
            // Special mechanics
            specialGauge: document.getElementById('specialGauge'),
            bijonEnergy: document.getElementById('bijonEnergy'),
            bijonEnergyBar: document.getElementById('bijonEnergyBar'),
            
            // Combat log and effects
            combatLog: document.getElementById('combatLog'),
            battleEffects: document.getElementById('battleEffects'),
            
            // Modals
            resultModal: document.getElementById('resultModal'),
            settingsModal: document.getElementById('settingsModal'),
            resultIcon: document.getElementById('resultIcon'),
            resultTitle: document.getElementById('resultTitle'),
            resultMessage: document.getElementById('resultMessage'),
            resultStats: document.getElementById('resultStats')
        };
    }

    setupEventListeners() {
        // Action buttons
        this.elements.basicAttackBtn.addEventListener('click', () => this.onActionClick('basic'));
        this.elements.elementalAttackBtn.addEventListener('click', () => this.onActionClick('elemental'));
        this.elements.ultimateAttackBtn.addEventListener('click', () => this.onActionClick('ultimate'));
        this.elements.defendBtn.addEventListener('click', () => this.onActionClick('defend'));

        // Settings
        const sfxVolume = document.getElementById('sfxVolume');
        const animationSpeed = document.getElementById('animationSpeed');
        const vibrationEnabled = document.getElementById('vibrationEnabled');

        if (sfxVolume) {
            sfxVolume.addEventListener('change', (e) => {
                this.game.updateSetting('sfxVolume', parseInt(e.target.value));
            });
        }

        if (animationSpeed) {
            animationSpeed.addEventListener('change', (e) => {
                this.game.updateSetting('animationSpeed', parseFloat(e.target.value));
            });
        }

        if (vibrationEnabled) {
            vibrationEnabled.addEventListener('change', (e) => {
                this.game.updateSetting('vibrationEnabled', e.target.checked);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    onActionClick(actionType) {
        if (this.game.turnPhase === 'player') {
            this.game.executePlayerAction(actionType);
        }
    }

    handleKeyboard(e) {
        if (this.game.turnPhase !== 'player') return;

        switch(e.key) {
            case '1':
                this.onActionClick('basic');
                break;
            case '2':
                this.onActionClick('elemental');
                break;
            case '3':
                this.onActionClick('ultimate');
                break;
            case '4':
            case ' ':
                this.onActionClick('defend');
                break;
        }
    }

    updateAll() {
        this.updatePlayerInfo();
        this.updateEnemyInfo();
        this.updateActionButtons();
        this.updateSpecialMechanics();
        this.updateTurnIndicator();
    }

    updatePlayerInfo() {
        const player = this.game.player;
        if (!player) return;

        // Información básica
        this.elements.playerName.textContent = player.name;
        this.elements.playerAvatar.src = `../images/${player.image}`;

        // Vida
        this.elements.playerHealth.textContent = player.currentHealth;
        this.elements.playerMaxHealth.textContent = player.maxHealth;
        this.elements.playerHealthBar.style.width = `${player.healthPercentage}%`;

        // Energía
        this.elements.playerEnergy.textContent = player.currentEnergy;
        this.elements.playerEnergyBar.style.width = `${player.energyPercentage}%`;

        // Estadísticas
        this.elements.playerArmor.textContent = player.armor;
        this.elements.playerResistance.textContent = player.elementalResistance;

        // Efectos de estado
        this.updateStatusEffects(this.elements.playerStatusEffects, player.statusEffects);
    }

    updateEnemyInfo() {
        const enemy = this.game.enemy;
        if (!enemy) return;

        // Información básica
        this.elements.enemyName.textContent = `Jefe: ${enemy.name}`;
        this.elements.enemyAvatar.src = `../images/${enemy.image}`;

        // Vida
        this.elements.enemyHealth.textContent = enemy.currentHealth;
        this.elements.enemyMaxHealth.textContent = enemy.maxHealth;
        this.elements.enemyHealthBar.style.width = `${enemy.healthPercentage}%`;

        // Estadísticas
        this.elements.enemyArmor.textContent = enemy.armor;
        this.elements.enemyResistance.textContent = enemy.elementalResistance;

        // Efectos de estado
        this.updateStatusEffects(this.elements.enemyStatusEffects, enemy.statusEffects);
    }

    updateActionButtons() {
        const player = this.game.player;
        if (!player) return;

        const isPlayerTurn = this.game.turnPhase === 'player';

        // Ataque básico
        this.updateActionButton('basic', this.elements.basicAttackBtn, player, isPlayerTurn);
        
        // Ataque elemental
        this.updateActionButton('elemental', this.elements.elementalAttackBtn, player, isPlayerTurn);
        
        // Ataque definitivo
        this.updateActionButton('ultimate', this.elements.ultimateAttackBtn, player, isPlayerTurn);
        
        // Defender
        this.elements.defendBtn.disabled = !isPlayerTurn;

        // Actualizar texto de los botones
        this.updateActionButtonText();
    }

    updateActionButton(actionType, button, player, isPlayerTurn) {
        const attack = player.attacks[actionType];
        const canAfford = player.currentEnergy >= attack.cost;
        const onCooldown = player.isOnCooldown(actionType);
        
        button.disabled = !isPlayerTurn || !canAfford || onCooldown;
        
        // Actualizar indicador de cooldown
        this.updateCooldownIndicator(actionType, player);
    }

    updateActionButtonText() {
        const player = this.game.player;
        if (!player) return;

        // Actualizar nombres y costos de habilidades
        const basicText = this.elements.basicAttackBtn.querySelector('.btn-text span');
        const elementalText = this.elements.elementalAttackBtn.querySelector('.btn-text span');
        const ultimateText = this.elements.ultimateAttackBtn.querySelector('.btn-text span');

        if (basicText) basicText.textContent = player.attacks.basic.name;
        if (elementalText) elementalText.textContent = player.attacks.elemental.name;
        if (ultimateText) ultimateText.textContent = player.attacks.ultimate.name;

        // Actualizar iconos según el elemento
        const elementIcon = this.getElementIcon(player.element);
        this.elements.elementalAttackBtn.querySelector('.btn-icon').textContent = elementIcon;
    }

    getElementIcon(element) {
        const icons = {
            'Devastación': '💥',
            'Hielo': '❄️',
            'Viento': '🌪️',
            'Fuego': '🔥',
            'Tierra': '🗿',
            'Agua': '🌊'
        };
        return icons[element] || '⚡';
    }

    updateCooldownIndicator(actionType, player) {
        const cooldownElement = this.elements[`${actionType}Cooldown`];
        if (!cooldownElement) return;

        const remaining = player.getCooldownRemaining(actionType);
        const total = player.attacks[actionType].cooldown;
        
        if (remaining > 0) {
            const percentage = ((total - remaining) / total) * 100;
            cooldownElement.style.width = `${percentage}%`;
            
            // Animar el cooldown
            setTimeout(() => this.updateCooldownIndicator(actionType, player), 50);
        } else {
            cooldownElement.style.width = '0%';
        }
    }

    updateSpecialMechanics() {
        const player = this.game.player;
        if (!player) return;

        // Actualizar gauge especial según el personaje
        switch(player.name) {
            case 'Xair Chikyu':
                this.updateBijonGauge(player);
                break;
            case 'Shuna Shieda':
                this.updateFuryGauge(player);
                break;
            case 'Ozen Kimura':
                this.updateFrostGauge(player);
                break;
        }
    }

    updateBijonGauge(player) {
        const gaugeLabel = document.querySelector('.gauge-label');
        if (gaugeLabel) gaugeLabel.textContent = 'Energía Bijon';

        this.elements.bijonEnergy.textContent = player.bijonEnergy || 0;
        this.elements.bijonEnergyBar.style.width = `${((player.bijonEnergy || 0) / (player.maxBijonEnergy || 100)) * 100}%`;

        // Efecto especial cuando está al máximo
        if (player.bijonEnergy >= 100) {
            this.elements.bijonEnergyBar.classList.add('glow');
        } else {
            this.elements.bijonEnergyBar.classList.remove('glow');
        }
    }

    updateFuryGauge(player) {
        const gaugeLabel = document.querySelector('.gauge-label');
        if (gaugeLabel) gaugeLabel.textContent = 'Furia Shieda';

        const furyPercentage = ((player.furyStacks || 0) / (player.maxFuryStacks || 5)) * 100;
        this.elements.bijonEnergy.textContent = player.furyStacks || 0;
        this.elements.bijonEnergyBar.style.width = `${furyPercentage}%`;
        this.elements.bijonEnergyBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    }

    updateFrostGauge(player) {
        const gaugeLabel = document.querySelector('.gauge-label');
        if (gaugeLabel) gaugeLabel.textContent = 'Armadura de Escarcha';

        const frostPercentage = ((player.frostArmor || 0) / (player.maxFrostArmor || 100)) * 100;
        this.elements.bijonEnergy.textContent = player.frostArmor || 0;
        this.elements.bijonEnergyBar.style.width = `${frostPercentage}%`;
        this.elements.bijonEnergyBar.style.background = 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
    }

    updateTurnIndicator() {
        this.elements.turnNumber.textContent = this.game.currentTurn;
    }

    updateStatusEffects(container, effects) {
        container.innerHTML = '';
        
        effects.forEach(effect => {
            const effectElement = document.createElement('div');
            effectElement.className = `status-effect ${effect.type}`;
            effectElement.innerHTML = `
                <span>${effect.icon}</span>
                <span>${effect.name}</span>
                ${effect.duration ? `<small>${effect.duration}</small>` : ''}
            `;
            container.appendChild(effectElement);
        });
    }

    updateCombatLog(message) {
        if (message === this.lastCombatMessage) return;
        
        this.lastCombatMessage = message;
        this.elements.combatLog.textContent = message;
        this.elements.combatLog.classList.add('show');
        
        setTimeout(() => {
            this.elements.combatLog.classList.remove('show');
        }, 3000);
    }

    showDamageIndicator(target, damage, isCritical = false) {
        const indicator = target === 'player' 
            ? this.elements.playerDamageIndicator 
            : this.elements.enemyDamageIndicator;
        
        indicator.textContent = `-${damage}`;
        indicator.className = 'damage-indicator show';
        
        if (isCritical) {
            indicator.classList.add('critical-hit');
        }
        
        setTimeout(() => {
            indicator.classList.remove('show', 'critical-hit');
        }, 1500);
    }

    disableActions() {
        this.elements.basicAttackBtn.disabled = true;
        this.elements.elementalAttackBtn.disabled = true;
        this.elements.ultimateAttackBtn.disabled = true;
        this.elements.defendBtn.disabled = true;
    }

    enableActions() {
        // Se actualizará en updateActionButtons()
        this.updateActionButtons();
    }

    async showResult(resultData) {
        const { result, turns, playerHealth, enemyHealth } = resultData;
        
        // Configurar modal
        if (result === 'victory') {
            this.elements.resultIcon.textContent = '🏆';
            this.elements.resultTitle.textContent = '¡Victoria!';
            this.elements.resultMessage.textContent = `Has derrotado a ${this.game.enemy.name}`;
        } else {
            this.elements.resultIcon.textContent = '💀';
            this.elements.resultTitle.textContent = 'Derrota';
            this.elements.resultMessage.textContent = `${this.game.enemy.name} te ha derrotado`;
        }
        
        // Estadísticas del combate
        this.elements.resultStats.innerHTML = `
            <div class="stat-row">
                <span>Turnos:</span>
                <span>${turns}</span>
            </div>
            <div class="stat-row">
                <span>Vida restante:</span>
                <span>${playerHealth}/${this.game.player.maxHealth}</span>
            </div>
            <div class="stat-row">
                <span>Daño total:</span>
                <span>${this.game.enemy.maxHealth - enemyHealth}</span>
            </div>
        `;
        
        // Mostrar modal
        this.elements.resultModal.classList.remove('hidden');
    }

    hideResult() {
        this.elements.resultModal.classList.add('hidden');
    }
}

// Funciones globales para los eventos onclick
window.exitBattle = function() {
    if (window.gameEngine) {
        window.gameEngine.exitBattle();
    }
};

window.nextBattle = function() {
    if (window.gameEngine) {
        window.gameEngine.nextBattle();
    }
};

window.toggleSettings = function() {
    const modal = document.getElementById('settingsModal');
    modal.classList.toggle('hidden');
};

// Hacer la clase disponible globalmente
window.BattleUI = BattleUI;

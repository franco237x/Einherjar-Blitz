/**
 * Battle Online - Einherjar Blitz
 * Handles real-time online battle synchronization
 */

import { createCharacterById } from '/dashboard/Einherjar%20Blitz/characters/index.js';

class BattleOnline {
    constructor() {
        this.battleId = null;
        this.playerNumber = null;
        this.isMyTurn = false;
        this.syncInterval = null;
        this.heartbeatInterval = null;
        this.turnTimerInterval = null;
        this.connected = true;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        // Battle data
        this.playerData = null;
        this.opponentData = null;
        this.currentState = null;

        this.init();
    }

    async init() {
        console.log('Initializing Online Battle...');

        // Get battle ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.battleId = urlParams.get('battle_id');

        if (!this.battleId) {
            this.showError('No se encontró ID de batalla');
            return;
        }

        try {
            // Initialize battle from server
            const response = await fetch(`api/battle_session.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=initialize&battle_id=${this.battleId}`
            });

            const data = await response.json();

            if (data.success && data.battle) {
                await this.setupBattle(data.battle);
                this.startSynchronization();
                this.startHeartbeat();
            } else {
                this.showError(data.message || 'Error al inicializar batalla');
            }
        } catch (error) {
            console.error('Error initializing battle:', error);
            this.showError('Error de conexión');
        }
    }

    async setupBattle(battleData) {
        this.playerNumber = battleData.player_number;
        this.playerData = battleData.player;
        this.opponentData = battleData.opponent;
        this.currentState = battleData.state;

        // Load player character
        const playerChar = await createCharacterById(this.playerData.character_id);
        this.displayCharacter(playerChar, 'player');

        // Load opponent character
        const opponentChar = await createCharacterById(this.opponentData.character_id);
        this.displayCharacter(opponentChar, 'enemy');

        // Update UI
        document.getElementById('opponentName').textContent = this.opponentData.username;
        document.getElementById('enemyName').textContent = this.opponentData.username;
        document.getElementById('playerName').textContent = this.playerData.username;

        // Display ranks
        this.displayRanks();

        // Setup action buttons
        this.setupActionButtons();

        // Add welcome message
        this.addLogMessage('system', `¡Batalla iniciada contra ${this.opponentData.username}!`);

        // Initial state update
        this.updateBattleState(this.currentState, battleData.current_turn);
    }

    displayCharacter(character, side) {
        const prefix = side === 'player' ? 'player' : 'enemy';

        // Set character image
        const img = document.getElementById(`${prefix}Image`);
        if (img && character.stats && character.stats.image) {
            img.src = `/dashboard/Einherjar%20Blitz/images/${character.stats.image}`;
            img.alt = character.stats.name;
        }
        
        // Set character name
        const nameEl = document.getElementById(`${prefix}Name`);
        if (nameEl && character.stats) {
            nameEl.textContent = character.stats.name;
        }
    }

    displayRanks() {
        // Player rank
        const playerRankBadge = document.getElementById('playerRankBadge');
        if (playerRankBadge) {
            playerRankBadge.innerHTML = `
                <i class="fas fa-medal"></i>
                <span>${this.playerData.rango}</span>
                <span class="cups-badge">${this.playerData.copas} <i class="fas fa-trophy"></i></span>
            `;
        }

        // Enemy rank
        const enemyRankBadge = document.getElementById('enemyRankBadge');
        if (enemyRankBadge) {
            enemyRankBadge.innerHTML = `
                <i class="fas fa-medal"></i>
                <span>${this.opponentData.rango}</span>
                <span class="cups-badge">${this.opponentData.copas} <i class="fas fa-trophy"></i></span>
            `;
        }
    }

    setupActionButtons() {
        const buttons = ['attackBtn', 'defendBtn', 'specialBtn', 'healBtn'];

        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (this.isMyTurn && !btn.disabled) {
                        const action = btn.dataset.action;
                        this.performAction(action);
                    }
                });
            }
        });

        // Surrender button
        const surrenderBtn = document.getElementById('surrenderBtn');
        if (surrenderBtn) {
            surrenderBtn.addEventListener('click', () => this.surrender());
        }
    }

    async performAction(actionType) {
        if (!this.isMyTurn) {
            this.addLogMessage('warning', 'No es tu turno');
            return;
        }

        // Disable all buttons
        this.disableActionButtons();

        try {
            // Prepare action data
            const actionData = this.prepareActionData(actionType);

            // Send to server
            const response = await fetch(`api/battle_session.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=submit_action&battle_id=${this.battleId}&battle_action=${encodeURIComponent(JSON.stringify(actionData))}`
            });

            const text = await response.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Invalid JSON response:', text);
                this.addLogMessage('error', 'Error del servidor');
                this.enableActionButtons();
                return;
            }

            if (data.success) {
                // Update state immediately
                this.currentState = data.state;
                this.updateBattleState(data.state, data.current_turn);

                // Add log message
                this.addLogMessage('player', this.getActionMessage(actionType, actionData));

                // Check if battle ended
                if (data.battle_ended) {
                    setTimeout(() => {
                        this.endBattle(data.winner_id);
                    }, 2000);
                }
            } else {
                this.addLogMessage('error', data.message || 'Error al procesar acción');
                this.enableActionButtons();
            }
        } catch (error) {
            console.error('Error performing action:', error);
            this.addLogMessage('error', 'Error de conexión');
            this.enableActionButtons();
        }
    }

    prepareActionData(actionType) {
        const playerState = this.currentState[`player${this.playerNumber}`];

        switch (actionType) {
            case 'attack':
                return {
                    type: 'attack',
                    damage: Math.floor(Math.random() * 46) + 70 // 70-115 damage (ejemplo)
                };

            case 'defend':
                return {
                    type: 'defend'
                };

            case 'special':
                return {
                    type: 'special',
                    damage: Math.floor(Math.random() * 81) + 120, // 120-200 damage
                    energyCost: 30,
                    effects: []
                };

            case 'heal':
                return {
                    type: 'heal',
                    amount: 200,
                    energyCost: 20
                };

            default:
                return { type: 'attack', damage: 50 };
        }
    }

    getActionMessage(actionType, actionData) {
        switch (actionType) {
            case 'attack':
                return `Atacaste e infligiste ${actionData.damage} de daño`;
            case 'defend':
                return 'Te preparaste para defender';
            case 'special':
                return `Usaste tu habilidad especial e infligiste ${actionData.damage} de daño`;
            case 'heal':
                return `Te curaste ${actionData.amount} puntos de vida`;
            default:
                return 'Realizaste una acción';
        }
    }

    startSynchronization() {
        // Sync every 1.5 seconds
        this.syncInterval = setInterval(async () => {
            await this.syncBattleState();
        }, 1500);
    }

    async syncBattleState() {
        try {
            const response = await fetch(`api/battle_session.php?action=get_state&battle_id=${this.battleId}`);
            const data = await response.json();

            if (data.success) {
                // Update state
                this.currentState = data.state;
                this.updateBattleState(data.state, data.current_turn);
                this.updateOpponentConnection(data.opponent_connected);

                // Update turn timer
                this.updateTurnTimer(data.turn_time_left);

                // Check if battle ended
                if (data.status === 'finished') {
                    this.stopSynchronization();
                    this.endBattle(data.winner_id);
                }

                // Reset reconnect attempts on successful sync
                if (this.reconnectAttempts > 0) {
                    this.reconnectAttempts = 0;
                    this.hideDisconnectModal();
                }

                this.setConnected(true);
            }
        } catch (error) {
            console.error('Error syncing battle state:', error);
            this.setConnected(false);
            this.attemptReconnect();
        }
    }

    updateBattleState(state, currentTurn) {
        if (!state) return;

        const playerKey = `player${this.playerNumber}`;
        const opponentKey = this.playerNumber === 1 ? 'player2' : 'player1';

        const playerState = state[playerKey];
        const opponentState = state[opponentKey];

        // Update player stats
        this.updateCharacterStats('player', playerState);

        // Update opponent stats
        this.updateCharacterStats('enemy', opponentState);

        // Update round
        document.getElementById('roundNumber').textContent = state.round || 1;

        // Update turn indicator
        this.isMyTurn = (currentTurn === playerKey);
        this.updateTurnIndicator(currentTurn);

        // Enable/disable action buttons
        if (this.isMyTurn) {
            this.enableActionButtons();
        } else {
            this.disableActionButtons();
        }
    }

    updateCharacterStats(side, stats) {
        const prefix = side === 'player' ? 'player' : 'enemy';

        // Update health
        const healthBar = document.getElementById(`${prefix}HealthBar`);
        const healthText = document.getElementById(`${prefix}HealthText`);
        if (healthBar && stats) {
            const healthPercent = (stats.health / stats.maxHealth) * 100;
            healthBar.style.width = `${healthPercent}%`;
            healthText.textContent = `${stats.health}/${stats.maxHealth}`;
        }

        // Update energy
        const energyBar = document.getElementById(`${prefix}EnergyBar`);
        const energyText = document.getElementById(`${prefix}EnergyText`);
        if (energyBar && stats) {
            const energyPercent = (stats.energy / stats.maxEnergy) * 100;
            energyBar.style.width = `${energyPercent}%`;
            energyText.textContent = `${stats.energy}/${stats.maxEnergy}`;
        }
    }

    updateTurnIndicator(currentTurn) {
        const turnElement = document.getElementById('currentTurn');
        const playerKey = `player${this.playerNumber}`;

        if (currentTurn === playerKey) {
            turnElement.textContent = 'Tu turno';
            turnElement.classList.add('my-turn');
            turnElement.classList.remove('opponent-turn');
        } else {
            turnElement.textContent = this.opponentData.username;
            turnElement.classList.add('opponent-turn');
            turnElement.classList.remove('my-turn');
        }
    }

    updateTurnTimer(timeLeft) {
        const timerElement = document.getElementById('turnTimer');
        if (timerElement) {
            timerElement.textContent = Math.max(0, timeLeft);

            // Add warning class if time is running out
            const timerContainer = document.getElementById('turnTimerContainer');
            if (timeLeft <= 10) {
                timerContainer.classList.add('warning');
            } else {
                timerContainer.classList.remove('warning');
            }
        }
    }

    updateOpponentConnection(connected) {
        const dot = document.getElementById('opponentConnection');
        if (dot) {
            if (connected) {
                dot.classList.add('connected');
                dot.classList.remove('disconnected');
            } else {
                dot.classList.add('disconnected');
                dot.classList.remove('connected');
            }
        }
    }

    startHeartbeat() {
        // Send heartbeat every 5 seconds
        this.heartbeatInterval = setInterval(async () => {
            try {
                await fetch(`api/battle_session.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `action=heartbeat&battle_id=${this.battleId}`
                });
            } catch (error) {
                console.error('Heartbeat error:', error);
            }
        }, 5000);
    }

    stopSynchronization() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.turnTimerInterval) {
            clearInterval(this.turnTimerInterval);
            this.turnTimerInterval = null;
        }
    }

    setConnected(connected) {
        this.connected = connected;
        const statusElement = document.getElementById('connectionStatus');
        const textElement = document.getElementById('connectionText');

        if (connected) {
            statusElement.classList.remove('disconnected');
            statusElement.classList.add('connected');
            textElement.textContent = 'Conectado';
        } else {
            statusElement.classList.add('disconnected');
            statusElement.classList.remove('connected');
            textElement.textContent = 'Desconectado';
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.showDisconnectModal('No se pudo recon ectar. La batalla ha sido abandonada.');
            this.stopSynchronization();
            setTimeout(() => {
                window.location.href = 'index.php';
            }, 5000);
            return;
        }

        this.reconnectAttempts++;
        this.showDisconnectModal(`Reconectando... (Intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    }

    showDisconnectModal(message) {
        const modal = document.getElementById('disconnectModal');
        const messageEl = document.getElementById('disconnectMessage');
        if (modal && messageEl) {
            messageEl.textContent = message;
            modal.style.display = 'flex';
        }
    }

    hideDisconnectModal() {
        const modal = document.getElementById('disconnectModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async surrender() {
        if (!confirm('¿Estás seguro de que quieres rendirte?')) {
            return;
        }

        try {
            const response = await fetch(`api/battle_session.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=surrender&battle_id=${this.battleId}`
            });

            const data = await response.json();

            if (data.success) {
                this.stopSynchronization();
                this.endBattle(this.opponentData.id);
            }
        } catch (error) {
            console.error('Error surrendering:', error);
        }
    }

    async endBattle(winnerId) {
        this.stopSynchronization();

        try {
            // Cleanup battle session on server
            await fetch(`api/battle_session.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=end_battle&battle_id=${this.battleId}`
            });

            // Get battle result
            const response = await fetch(`api/rewards.php?action=get_battle_result&battle_id=${this.battleId}`);
            const data = await response.json();

            if (data.success && data.result) {
                this.showBattleResult(data.result);
            } else {
                this.showBattleResult({ won: false });
            }
        } catch (error) {
            console.error('Error ending battle:', error);
            this.showBattleResult({ won: false });
        }
    }

    showBattleResult(result) {
        console.log('Showing battle result:', result);
        
        const modal = document.getElementById('battleEndModal');
        const titleEl = document.getElementById('battleResultTitle');
        const iconEl = document.getElementById('resultIcon');
        const cupsEl = document.getElementById('cupsChange');
        const durationEl = document.getElementById('battleDuration');
        const roundsEl = document.getElementById('totalRounds');
        const messageEl = document.getElementById('resultMessage');

        if (!modal) {
            console.error('Battle end modal not found!');
            return;
        }

        if (result.won) {
            titleEl.textContent = '¡Victoria!';
            iconEl.innerHTML = '<i class="fas fa-trophy"></i>';
            iconEl.className = 'result-icon victory';
            messageEl.textContent = `¡Derrotaste a ${this.opponentData.username}!`;
        } else {
            titleEl.textContent = 'Derrota';
            iconEl.innerHTML = '<i class="fas fa-times-circle"></i>';
            iconEl.className = 'result-icon defeat';
            messageEl.textContent = `Perdiste contra ${this.opponentData.username}`;
        }

        // Update stats
        if (cupsEl) {
            const cupsChange = result.cups_change || 0;
            cupsEl.textContent = cupsChange >= 0 ? `+${cupsChange}` : cupsChange;
            cupsEl.className = cupsChange >= 0 ? 'value positive' : 'value negative';
        }
        if (durationEl) durationEl.textContent = this.formatTime(result.duration || 0);
        if (roundsEl) roundsEl.textContent = result.rounds || 0;

        // Show modal with active class
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        console.log('Modal display set to flex');

        // Setup return button
        const returnBtn = document.getElementById('returnBtn');
        if (returnBtn) {
            returnBtn.onclick = () => {
                window.location.href = 'index.php';
            };
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    enableActionButtons() {
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => btn.disabled = false);
    }

    disableActionButtons() {
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(btn => btn.disabled = true);
    }

    addLogMessage(type, message) {
        const logContainer = document.getElementById('battleLogContainer');
        if (!logContainer) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}-message`;

        const icon = this.getLogIcon(type);
        entry.innerHTML = `<i class="${icon}"></i> ${message}`;

        logContainer.appendChild(entry);

        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;

        // Remove old messages (keep last 10)
        while (logContainer.children.length > 10) {
            logContainer.removeChild(logContainer.firstChild);
        }
    }

    getLogIcon(type) {
        const icons = {
            'system': 'fas fa-info-circle',
            'player': 'fas fa-user',
            'enemy': 'fas fa-user-shield',
            'warning': 'fas fa-exclamation-triangle',
            'error': 'fas fa-times-circle'
        };
        return icons[type] || 'fas fa-circle';
    }

    showError(message) {
        alert(message);
        window.location.href = 'index.php';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.battleOnline = new BattleOnline();
});

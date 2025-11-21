// Online Mode JavaScript - Full Implementation

class OnlineMode {
    constructor() {
        this.inQueue = false;
        this.matchFound = false;
        this.pollInterval = null;
        this.statsInterval = null;
        this.heartbeatInterval = null;
        this.selectedCharacter = null;
        this.currentBattleId = null;
        
        this.init();
    }
    
    init() {
        console.log('Online Mode initialized');
        
        // Initialize real ping and server detection
        this.measurePing();
        this.detectServerLocation();
        
        // Update ping every 30 seconds
        setInterval(() => {
            this.measurePing();
        }, 30000);
        
        // Update stats every 5 seconds
        this.updateOnlineStats();
        this.statsInterval = setInterval(() => {
            this.updateOnlineStats();
        }, 5000);
        
        // Load recent match history
        this.loadMatchHistory();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load selected character from session
        this.loadSelectedCharacter();
    }
    
    setupEventListeners() {
        // Character selection buttons
        const characterSlots = document.querySelectorAll('.character-slot');
        characterSlots.forEach(slot => {
            slot.addEventListener('click', (e) => {
                const charId = e.currentTarget.dataset.characterId;
                this.selectCharacter(charId);
            });
        });
        
        // Search match button
        const searchBtn = document.getElementById('searchMatchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.startMatchmaking());
        }
        
        // Cancel search button
        const cancelBtn = document.getElementById('cancelSearchBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelMatchmaking());
        }
        
        // Battle ready button
        const readyBtn = document.getElementById('battleReadyBtn');
        if (readyBtn) {
            readyBtn.addEventListener('click', () => this.navigateToBattle());
        }
    }
    
    async loadSelectedCharacter() {
        try {
            const response = await fetch('api/get_selected_character.php');
            const data = await response.json();
            
            if (data.success && data.character_id) {
                this.selectedCharacter = data.character_id;
                this.updateCharacterUI();
                this.enableSearchButton();
            }
        } catch (error) {
            console.log('No character selected yet');
        }
    }
    
    async selectCharacter(characterId) {
        try {
            const response = await fetch('api/save_selected_character.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `character_id=${characterId}`
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.selectedCharacter = characterId;
                this.updateCharacterUI();
                this.enableSearchButton();
                this.showNotification('Personaje seleccionado correctamente', 'success');
            }
        } catch (error) {
            console.error('Error selecting character:', error);
            this.showNotification('Error al seleccionar personaje', 'error');
        }
    }
    
    updateCharacterUI() {
        // Update selected character display
        const selectedDisplay = document.getElementById('selectedCharacterDisplay');
        if (selectedDisplay && this.selectedCharacter) {
            const characterNames = {
                '1': 'Shuna Shieda',
                '2': 'Ozen Kimura',
                '3': 'Xair Chikyu',
                '4': 'Nathan Doffens',
                '5': 'Zack Hisoka'
            };
            
            selectedDisplay.innerHTML = `
                <div class="selected-character-info">
                    <i class="fas fa-check-circle text-success"></i>
                    <span>Personaje seleccionado: <strong>${characterNames[this.selectedCharacter]}</strong></span>
                </div>
            `;
        }
        
        // Highlight selected character slot
        const characterSlots = document.querySelectorAll('.character-slot');
        characterSlots.forEach(slot => {
            if (slot.dataset.characterId == this.selectedCharacter) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
    }
    
    enableSearchButton() {
        const searchBtn = document.getElementById('searchMatchBtn');
        if (searchBtn && this.selectedCharacter) {
            searchBtn.disabled = false;
        }
    }
    
    async startMatchmaking() {
        if (!this.selectedCharacter) {
            this.showNotification('Debes seleccionar un personaje primero', 'warning');
            return;
        }
        
        if (this.inQueue) {
            return;
        }
        
        try {
            const response = await fetch('api/matchmaking.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=join_queue&character_id=${this.selectedCharacter}`
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.matched) {
                    // Match found immediately
                    this.handleMatchFound(data);
                } else {
                    // Joined queue, start polling
                    this.inQueue = true;
                    this.updateSearchUI(true);
                    this.showSearchingModal();
                    this.startPolling();
                    this.startHeartbeat();
                }
            } else {
                this.showNotification(data.message || 'Error al buscar partida', 'error');
            }
        } catch (error) {
            console.error('Error starting matchmaking:', error);
            this.showNotification('Error al conectar con el servidor', 'error');
        }
    }
    
    updateSearchUI(searching) {
        const searchBtn = document.getElementById('searchMatchBtn');
        const cancelBtn = document.getElementById('cancelSearchBtn');
        const queueStatus = document.getElementById('queueStatus');
        
        if (searching) {
            if (searchBtn) searchBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'block';
            if (queueStatus) queueStatus.style.display = 'block';
        } else {
            if (searchBtn) searchBtn.style.display = 'block';
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (queueStatus) queueStatus.style.display = 'none';
        }
    }
    
    async cancelMatchmaking() {
        try {
            await fetch('api/matchmaking.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=leave_queue'
            });
            
            this.inQueue = false;
            this.matchFound = false;
            this.stopPolling();
            this.stopHeartbeat();
            this.updateSearchUI(false);
            this.hideSearchingModal();
            this.showNotification('Búsqueda cancelada', 'info');
        } catch (error) {
            console.error('Error canceling matchmaking:', error);
        }
    }
    
    startPolling() {
        // Poll every 2 seconds for match
        this.pollInterval = setInterval(async () => {
            await this.checkForMatch();
        }, 2000);
    }
    
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    
    startHeartbeat() {
        // Send heartbeat every 10 seconds
        this.heartbeatInterval = setInterval(async () => {
            await fetch('api/matchmaking.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=heartbeat'
            });
        }, 10000);
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    async checkForMatch() {
        try {
            const response = await fetch('api/matchmaking.php?action=check_match');
            const data = await response.json();
            
            if (data.success) {
                if (data.matched) {
                    this.handleMatchFound(data);
                } else if (data.cancelled) {
                    // Auto-cancelado por timeout
                    this.inQueue = false;
                    this.stopPolling();
                    this.stopHeartbeat();
                    this.updateSearchUI(false);
                    this.hideSearchingModal();
                    this.showNotification(data.message || 'Búsqueda cancelada automáticamente', 'warning');
                } else if (data.in_queue) {
                    // Actualizar mensaje según el tiempo en cola
                    this.updateSearchingMessage(data);
                }
            }
        } catch (error) {
            console.error('Error checking for match:', error);
        }
    }
    
    updateSearchingMessage(data) {
        const messageEl = document.querySelector('#searchingModal .modal-text');
        if (messageEl) {
            const time = data.time_in_queue || 0;
            let message = 'Buscando oponente';
            
            if (data.extended_search) {
                message = 'Ampliando búsqueda a todos los rangos';
            }
            
            message += ` (${time}s)`;
            
            if (data.message) {
                message = data.message + ` (${time}s)`;
            }
            
            messageEl.textContent = message;
        }
    }
    
    handleMatchFound(data) {
        this.matchFound = true;
        this.currentBattleId = data.battle_id;
        this.inQueue = false;
        this.stopPolling();
        this.stopHeartbeat();
        this.updateSearchUI(false);
        
        this.showMatchFoundModal(data.opponent);
    }
    
    showSearchingModal() {
        const modal = document.getElementById('searchingModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    hideSearchingModal() {
        const modal = document.getElementById('searchingModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    showMatchFoundModal(opponent) {
        this.hideSearchingModal();
        
        const modal = document.getElementById('matchFoundModal');
        if (modal) {
            // Update opponent info
            const usernameEl = document.getElementById('opponentUsername');
            const rankEl = document.getElementById('opponentRank');
            const cupsEl = document.getElementById('opponentCups');
            
            if (usernameEl) usernameEl.textContent = opponent.username;
            if (rankEl) rankEl.textContent = opponent.rango;
            if (cupsEl) cupsEl.textContent = opponent.copas;
            
            modal.style.display = 'flex';
            
            // Start countdown
            let countdown = 3;
            const countdownEl = document.getElementById('battleCountdown');
            if (countdownEl) {
                countdownEl.textContent = countdown;
                
                const countdownInterval = setInterval(() => {
                    countdown--;
                    if (countdown > 0) {
                        countdownEl.textContent = countdown;
                    } else {
                        clearInterval(countdownInterval);
                        this.navigateToBattle();
                    }
                }, 1000);
            }
        }
    }
    
    navigateToBattle() {
        if (this.currentBattleId) {
            window.location.href = `battle_online.html?battle_id=${this.currentBattleId}`;
        }
    }
    
    async updateOnlineStats() {
        try {
            const response = await fetch('api/matchmaking.php?action=get_stats');
            const data = await response.json();
            
            if (data.success && data.stats) {
                this.displayStats(data.stats);
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
    
    displayStats(stats) {
        const playersOnlineEl = document.getElementById('playersOnline');
        const searchingEl = document.getElementById('playersSearching');
        const inBattleEl = document.getElementById('playersInBattle');
        const avgWaitEl = document.getElementById('avgWaitTime');
        const noOpponentsWarning = document.getElementById('noOpponentsWarning');
        
        if (playersOnlineEl) playersOnlineEl.textContent = stats.players_online || '0';
        if (searchingEl) searchingEl.textContent = stats.searching || '0';
        if (inBattleEl) inBattleEl.textContent = stats.in_battle || '0';
        if (avgWaitEl) {
            const waitTime = stats.avg_wait_time || 0;
            avgWaitEl.textContent = waitTime > 0 ? `${Math.round(waitTime)}s` : '--';
        }
        
        // Mostrar advertencia si no hay oponentes disponibles (solo el usuario está online/buscando)
        if (noOpponentsWarning) {
            const totalOtherPlayers = (stats.players_online || 0) - 1; // Excluir al usuario actual
            const shouldShowWarning = this.inQueue && totalOtherPlayers <= 0;
            noOpponentsWarning.style.display = shouldShowWarning ? 'block' : 'none';
        }
    }
    
    async loadMatchHistory() {
        try {
            const response = await fetch('api/rewards.php?action=match_history&limit=5');
            const data = await response.json();
            
            if (data.success && data.matches && data.matches.length > 0) {
                this.displayMatchHistory(data.matches);
            } else {
                const container = document.getElementById('recentMatchResults');
                if (container) {
                    container.innerHTML = '<span class="text-muted">No hay partidas recientes</span>';
                }
            }
        } catch (error) {
            console.error('Error loading match history:', error);
            const container = document.getElementById('recentMatchResults');
            if (container) {
                container.innerHTML = '<span class="text-muted">Error al cargar historial</span>';
            }
        }
    }
    
    displayMatchHistory(matches) {
        const container = document.getElementById('recentMatchResults');
        if (!container) return;
        
        const matchesHtml = matches.slice(0, 5).map(match => {
            const resultClass = match.result === 'win' ? 'win' : 'loss';
            const resultIcon = match.result === 'win' ? 'trophy' : 'times';
            const resultText = match.result === 'win' ? 'V' : 'D';
            
            return `
                <span class="match-result ${resultClass}" title="${match.result === 'win' ? 'Victoria' : 'Derrota'} vs ${match.opponent_username}">
                    ${resultText}
                </span>
            `;
        }).join('');
        
        container.innerHTML = matchesHtml;
    }
    
    async measurePing() {
        const pingElement = document.getElementById('pingValue');
        if (!pingElement) return;
        
        try {
            const startTime = performance.now();
            
            await fetch('api/matchmaking.php?action=ping', {
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            const endTime = performance.now();
            const ping = Math.round(endTime - startTime);
            
            pingElement.textContent = `${ping}ms`;
            
            if (ping < 50) {
                pingElement.className = 'text-success';
            } else if (ping < 100) {
                pingElement.className = 'text-warning';
            } else {
                pingElement.className = 'text-danger';
            }
            
        } catch (error) {
            pingElement.textContent = 'Error';
            pingElement.className = 'text-danger';
        }
    }
    
    async detectServerLocation() {
        const serverElement = document.getElementById('serverLocation');
        if (!serverElement) return;
        
        // Fallback to browser language detection
        const language = navigator.language || navigator.userLanguage;
        let region = 'Local';
        
        if (language.startsWith('es')) {
            if (language.includes('AR') || language.includes('CL') || language.includes('CO')) {
                region = 'América del Sur';
            } else if (language.includes('MX')) {
                region = 'América del Norte';
            } else {
                region = 'América';
            }
        } else if (language.startsWith('en')) {
            region = 'América del Norte';
        } else if (language.startsWith('pt')) {
            region = 'América del Sur';
        }
        
        serverElement.textContent = region;
        serverElement.className = 'text-info';
    }
    
    showNotification(message, type = 'info') {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.onlineMode = new OnlineMode();
});

// Utility functions for global access
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        window.location.href = '../logout.php';
    }
}

// Add CSS for toast notifications and new features
const style = document.createElement('style');
style.textContent = `
    .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .toast-notification.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .toast-success { border-left: 4px solid #28a745; }
    .toast-error { border-left: 4px solid #dc3545; }
    .toast-warning { border-left: 4px solid #ffc107; }
    .toast-info { border-left: 4px solid #17a2b8; }
    
    .character-select-btn {
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }
    
    .character-select-btn.selected {
        border-color: #d4af37;
        box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
        transform: scale(1.05);
    }
    
    .searching-modal, .match-found-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .searching-content {
        text-align: center;
        color: white;
    }
    
    .searching-spinner {
        width: 80px;
        height: 80px;
        border: 5px solid rgba(212, 175, 55, 0.2);
        border-top-color: #d4af37;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 2rem;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .match-found-content {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        padding: 3rem;
        border-radius: 16px;
        text-align: center;
        border: 2px solid #d4af37;
        box-shadow: 0 0 40px rgba(212, 175, 55, 0.3);
    }
    
    .countdown-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: rgba(212, 175, 55, 0.1);
        border: 4px solid #d4af37;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 2rem auto;
        font-size: 3rem;
        font-weight: bold;
        color: #d4af37;
        animation: pulse 1s ease-in-out infinite;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;
document.head.appendChild(style);


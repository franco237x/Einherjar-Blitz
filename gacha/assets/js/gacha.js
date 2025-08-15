/* ====================================
   SISTEMA GACHA - FUNCIONALIDAD
   Einherjer Blitz 3.0
   ==================================== */

class GachaSystem {
    constructor() {
        this.userData = window.userData || {};
        this.isOpening = false;
        this.animationDuration = 3000; // 3 segundos para la animación
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateUI();
        this.loadRecentHistory();
    }
    
    bindEvents() {
        // Prevenir múltiples clics durante la apertura
        document.addEventListener('click', (e) => {
            if (this.isOpening && e.target.matches('[onclick*="openChest"]')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    }
    
    updateUI() {
        // Actualizar recursos en la UI
        this.updateResourceDisplay();
        this.checkChestAvailability();
    }
    
    updateResourceDisplay() {
        const keyElements = document.querySelectorAll('[data-resource="keys"]');
        const sphereElements = document.querySelectorAll('[data-resource="spheres"]');
        
        keyElements.forEach(el => {
            el.textContent = this.formatNumber(this.userData.keys || 0);
        });
        
        sphereElements.forEach(el => {
            el.textContent = this.formatNumber(this.userData.spheres || 0);
        });
    }
    
    checkChestAvailability() {
        const chestCards = document.querySelectorAll('.chest-card');
        
        chestCards.forEach(card => {
            const button = card.querySelector('.btn-gacha');
            const costElement = card.querySelector('.chest-cost span');
            const cost = parseInt(costElement.textContent);
            
            if (this.userData.keys < cost) {
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-lock me-2"></i>Llaves insuficientes';
                card.classList.add('insufficient-keys');
            } else {
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-unlock-alt me-2"></i>Abrir Cofre';
                card.classList.remove('insufficient-keys');
            }
        });
    }
    
    async openChest(chestType, cost) {
        if (this.isOpening) {
            this.showNotification('Ya hay un cofre abriéndose...', 'warning');
            return;
        }
        
        if (this.userData.keys < cost) {
            this.showNotification('No tienes suficientes llaves', 'error');
            return;
        }
        
        this.isOpening = true;
        
        try {
            // Mostrar modal de apertura
            this.showOpeningModal(chestType);
            
            // Simular llamada al servidor
            const reward = await this.processChestOpening(chestType, cost);
            
            // Mostrar recompensa después de la animación
            setTimeout(() => {
                this.showReward(reward);
                this.updateUserResources(cost, reward);
                this.addToHistory(chestType, reward);
            }, this.animationDuration);
            
        } catch (error) {
            console.error('Error opening chest:', error);
            this.showNotification('Error al abrir el cofre', 'error');
            this.hideModal();
        } finally {
            setTimeout(() => {
                this.isOpening = false;
            }, this.animationDuration + 1000);
        }
    }
    
    showOpeningModal(chestType) {
        const modal = new bootstrap.Modal(document.getElementById('chestOpenModal'));
        const chestIcon = document.getElementById('chestIcon');
        const openingAnimation = document.getElementById('openingAnimation');
        const rewardReveal = document.getElementById('rewardReveal');
        
        // Resetear estado del modal
        openingAnimation.style.display = 'block';
        rewardReveal.style.display = 'none';
        
        // Configurar icono según tipo de cofre
        const iconMap = {
            'common': 'fas fa-box',
            'rare': 'fas fa-treasure-chest',
            'epic': 'fas fa-crown'
        };
        
        chestIcon.className = iconMap[chestType] || 'fas fa-box';
        chestIcon.style.color = this.getChestColor(chestType);
        
        modal.show();
        
        // Añadir efectos de sonido si están disponibles
        this.playOpeningSound(chestType);
    }
    
    async processChestOpening(chestType, cost) {
        // Simular procesamiento en el servidor
        // En una implementación real, esto sería una llamada AJAX
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const reward = this.generateReward(chestType);
                resolve(reward);
            }, this.animationDuration - 500);
        });
    }
    
    generateReward(chestType) {
        const rewardTables = {
            common: [
                { type: 'spheres', amount: [50, 200], icon: 'fas fa-globe', name: 'Esferas', rarity: 'common' },
                { type: 'equipment', amount: [1, 1], icon: 'fas fa-shield-alt', name: 'Equipo Básico', rarity: 'common' },
                { type: 'consumable', amount: [1, 3], icon: 'fas fa-potion', name: 'Pociones', rarity: 'common' }
            ],
            rare: [
                { type: 'spheres', amount: [200, 500], icon: 'fas fa-globe', name: 'Esferas', rarity: 'rare' },
                { type: 'weapon', amount: [1, 1], icon: 'fas fa-sword', name: 'Arma Rara', rarity: 'rare' },
                { type: 'fragment', amount: [1, 5], icon: 'fas fa-gem', name: 'Fragmentos Épicos', rarity: 'rare' },
                { type: 'keys', amount: [1, 2], icon: 'fas fa-key', name: 'Llaves Extra', rarity: 'rare' }
            ],
            epic: [
                { type: 'spheres', amount: [500, 1000], icon: 'fas fa-globe', name: 'Esferas', rarity: 'epic' },
                { type: 'legendary_equipment', amount: [1, 1], icon: 'fas fa-magic', name: 'Equipo Legendario', rarity: 'epic' },
                { type: 'character', amount: [1, 1], icon: 'fas fa-user-ninja', name: 'Personaje Raro', rarity: 'epic' },
                { type: 'keys', amount: [2, 5], icon: 'fas fa-key', name: 'Llaves Premium', rarity: 'epic' }
            ]
        };
        
        const table = rewardTables[chestType] || rewardTables.common;
        const randomReward = table[Math.floor(Math.random() * table.length)];
        
        // Calcular cantidad aleatoria
        const minAmount = randomReward.amount[0];
        const maxAmount = randomReward.amount[1];
        const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
        
        return {
            ...randomReward,
            amount: amount,
            timestamp: Date.now()
        };
    }
    
    showReward(reward) {
        const openingAnimation = document.getElementById('openingAnimation');
        const rewardReveal = document.getElementById('rewardReveal');
        const rewardIcon = document.getElementById('rewardIcon');
        const rewardName = document.getElementById('rewardName');
        const rewardDescription = document.getElementById('rewardDescription');
        
        // Ocultar animación de apertura
        openingAnimation.style.display = 'none';
        
        // Configurar recompensa
        rewardIcon.className = reward.icon;
        rewardIcon.style.color = this.getChestColor(reward.rarity);
        rewardName.textContent = `${reward.name} x${reward.amount}`;
        rewardDescription.textContent = this.getRewardDescription(reward);
        
        // Mostrar recompensa con animación
        rewardReveal.style.display = 'block';
        rewardReveal.style.opacity = '0';
        rewardReveal.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            rewardReveal.style.transition = 'all 0.5s ease';
            rewardReveal.style.opacity = '1';
            rewardReveal.style.transform = 'scale(1)';
        }, 100);
        
        // Efectos adicionales
        this.playRewardSound(reward.rarity);
        this.showRewardParticles();
    }
    
    updateUserResources(cost, reward) {
        // Restar llaves
        this.userData.keys -= cost;
        
        // Añadir recompensa
        if (reward.type === 'spheres') {
            this.userData.spheres += reward.amount;
        } else if (reward.type === 'keys') {
            this.userData.keys += reward.amount;
        }
        
        // Actualizar UI
        this.updateResourceDisplay();
        this.checkChestAvailability();
        
        // En una implementación real, esto actualizaría la base de datos
        this.syncWithServer(cost, reward);
    }
    
    addToHistory(chestType, reward) {
        const historyList = document.getElementById('historyList');
        const historyEmpty = historyList.querySelector('.history-empty');
        
        // Remover mensaje vacío si existe
        if (historyEmpty) {
            historyEmpty.remove();
        }
        
        // Crear elemento de historial
        const historyItem = this.createHistoryItem(chestType, reward);
        
        // Añadir al principio de la lista
        historyList.insertAdjacentHTML('afterbegin', historyItem);
        
        // Limitar a 10 elementos
        const items = historyList.querySelectorAll('.history-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }
        
        // Guardar en localStorage
        this.saveToLocalStorage(chestType, reward);
    }
    
    createHistoryItem(chestType, reward) {
        const timeString = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const chestNames = {
            'common': 'Cofre Común',
            'rare': 'Cofre Raro',
            'epic': 'Cofre Épico'
        };
        
        return `
            <div class="history-item" data-rarity="${reward.rarity}">
                <div class="history-icon">
                    <i class="${reward.icon}"></i>
                </div>
                <div class="history-info">
                    <div class="history-reward">${reward.name} x${reward.amount}</div>
                    <div class="history-details">
                        <span class="chest-type">${chestNames[chestType]}</span>
                        <span class="time">${timeString}</span>
                    </div>
                </div>
                <div class="history-rarity">
                    <span class="rarity-badge ${reward.rarity}">${reward.rarity.toUpperCase()}</span>
                </div>
            </div>
        `;
    }
    
    loadRecentHistory() {
        const saved = localStorage.getItem('gacha_history');
        if (!saved) return;
        
        try {
            const history = JSON.parse(saved);
            const historyList = document.getElementById('historyList');
            const historyEmpty = historyList.querySelector('.history-empty');
            
            if (history.length > 0 && historyEmpty) {
                historyEmpty.remove();
            }
            
            history.forEach(item => {
                const historyItem = this.createHistoryItem(item.chestType, item.reward);
                historyList.insertAdjacentHTML('beforeend', historyItem);
            });
            
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    
    saveToLocalStorage(chestType, reward) {
        try {
            const saved = localStorage.getItem('gacha_history');
            let history = saved ? JSON.parse(saved) : [];
            
            history.unshift({ chestType, reward, timestamp: Date.now() });
            
            // Limitar a 50 elementos
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            localStorage.setItem('gacha_history', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    async syncWithServer(cost, reward) {
        // Implementación futura para sincronizar con el servidor
        try {
            // const response = await fetch('gacha/process.php', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({ cost, reward })
            // });
            
            // const result = await response.json();
            // if (!result.success) {
            //     throw new Error(result.message);
            // }
        } catch (error) {
            console.error('Error syncing with server:', error);
        }
    }
    
    getChestColor(type) {
        const colors = {
            'common': '#67e8f9',
            'rare': '#60a5fa',
            'epic': '#c084fc',
            'legendary': '#fbbf24'
        };
        return colors[type] || colors.common;
    }
    
    getRewardDescription(reward) {
        const descriptions = {
            'spheres': 'Moneda principal del juego',
            'equipment': 'Equipo para mejorar tus estadísticas',
            'weapon': 'Arma poderosa para el combate',
            'consumable': 'Objetos consumibles útiles',
            'fragment': 'Fragmentos para crear objetos épicos',
            'keys': 'Llaves adicionales para más cofres',
            'legendary_equipment': 'Equipo de calidad legendaria',
            'character': 'Nuevo personaje para tu colección'
        };
        return descriptions[reward.type] || 'Recompensa especial';
    }
    
    playOpeningSound(chestType) {
        // Implementación futura para efectos de sonido
        if ('vibrate' in navigator && /Android|iPhone/i.test(navigator.userAgent)) {
            navigator.vibrate([100, 50, 100]);
        }
    }
    
    playRewardSound(rarity) {
        // Implementación futura para efectos de sonido por rareza
        if ('vibrate' in navigator && /Android|iPhone/i.test(navigator.userAgent)) {
            const patterns = {
                'common': [100],
                'rare': [100, 50, 100],
                'epic': [100, 50, 100, 50, 100],
                'legendary': [200, 100, 200, 100, 200]
            };
            navigator.vibrate(patterns[rarity] || patterns.common);
        }
    }
    
    showRewardParticles() {
        // Implementación futura para efectos de partículas
        // Por ahora, un simple efecto CSS
        const modal = document.querySelector('.gacha-modal');
        modal.classList.add('reward-celebration');
        
        setTimeout(() => {
            modal.classList.remove('reward-celebration');
        }, 2000);
    }
    
    hideModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('chestOpenModal'));
        if (modal) {
            modal.hide();
        }
    }
    
    showNotification(message, type = 'info') {
        // Sistema simple de notificaciones
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    refreshHistory() {
        localStorage.removeItem('gacha_history');
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-box-open"></i>
                <p>No has abierto cofres recientemente</p>
                <small>¡Abre tu primer cofre para comenzar!</small>
            </div>
        `;
        this.showNotification('Historial limpiado', 'info');
    }
}

// Funciones globales para compatibilidad
function openChest(chestType, cost) {
    if (window.gachaSystem) {
        window.gachaSystem.openChest(chestType, cost);
    }
}

function refreshHistory() {
    if (window.gachaSystem) {
        window.gachaSystem.refreshHistory();
    }
}

// Inicializar sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.gachaSystem = new GachaSystem();
});

// CSS adicional para notificaciones y efectos
const additionalCSS = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(30, 30, 46, 0.95);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        border-left: 4px solid #3b82f6;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 300px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-error {
        border-left-color: #ef4444;
    }
    
    .notification-warning {
        border-left-color: #f59e0b;
    }
    
    .notification-info {
        border-left-color: #3b82f6;
    }
    
    .insufficient-keys {
        opacity: 0.6;
        pointer-events: none;
    }
    
    .history-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
        border-left: 3px solid #9ca3af;
        transition: all 0.3s ease;
    }
    
    .history-item[data-rarity="rare"] {
        border-left-color: #3b82f6;
    }
    
    .history-item[data-rarity="epic"] {
        border-left-color: #8b5cf6;
    }
    
    .history-item[data-rarity="legendary"] {
        border-left-color: #f59e0b;
    }
    
    .history-icon {
        font-size: 1.5rem;
        color: var(--gold-primary);
    }
    
    .history-info {
        flex: 1;
    }
    
    .history-reward {
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    
    .history-details {
        font-size: 0.8rem;
        color: var(--text-muted);
    }
    
    .history-details .chest-type {
        margin-right: 1rem;
    }
    
    .rarity-badge {
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        text-transform: uppercase;
        font-weight: 600;
    }
    
    .rarity-badge.common {
        background: rgba(156, 163, 175, 0.2);
        color: #9ca3af;
    }
    
    .rarity-badge.rare {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
    }
    
    .rarity-badge.epic {
        background: rgba(139, 92, 246, 0.2);
        color: #8b5cf6;
    }
    
    .reward-celebration {
        animation: celebrationPulse 0.5s ease-in-out 3;
    }
    
    @keyframes celebrationPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    @media (max-width: 768px) {
        .notification {
            right: 10px;
            left: 10px;
            max-width: none;
            transform: translateY(-100px);
        }
        
        .notification.show {
            transform: translateY(0);
        }
        
        .history-item {
            padding: 0.75rem;
            gap: 0.75rem;
        }
        
        .history-icon {
            font-size: 1.25rem;
        }
    }
`;

// Inyectar CSS adicional
const styleElement = document.createElement('style');
styleElement.textContent = additionalCSS;
document.head.appendChild(styleElement);

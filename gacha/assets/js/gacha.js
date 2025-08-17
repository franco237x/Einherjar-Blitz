/* ====================================
   SISTEMA GACHA - FUNCIONALIDAD
   Einherjer Blitz 3.0 - Integrado con Backend
   ==================================== */

class GachaSystem {
    constructor() {
        this.isOpening = false;
        this.userKeys = 0;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadUserData();
        this.loadRecentHistory(); // Cargar historial al inicializar
    }
    
    bindEvents() {
        // Botones de apertura de cofres
        document.querySelectorAll('.open-chest-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const chestType = e.target.dataset.chest;
                const keyCost = parseInt(e.target.dataset.cost);
                this.openChest(chestType, keyCost);
            });
        });
    }

    async loadUserData() {
        try {
            // Obtener llaves actuales del usuario
            this.updateKeyDisplay();
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateKeyDisplay() {
        // Las llaves se actualizarán después de cada apertura de cofre
        // Por ahora mantenemos la visualización existente del header
    }

    async openChest(chestType, keyCost) {
        if (this.isOpening) {
            console.log('Ya hay un cofre abriéndose, ignorando clic');
            return;
        }
        
        console.log(`Abriendo cofre: ${chestType}, costo: ${keyCost}`);
        this.isOpening = true;
        
        try {
            // Mostrar animación de apertura inmediata
            this.playOpenAnimation(chestType);
            
            // Realizar petición al servidor
            console.log('Enviando petición al servidor...');
            const response = await fetch('process_gacha.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chest_type: chestType
                })
            });
            
            console.log('Respuesta del servidor recibida, status:', response.status);
            
            // Verificar si la respuesta es JSON válida
            const responseText = await response.text();
            console.log('Respuesta raw:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
                console.log('Resultado parseado:', result);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                console.error('Response text:', responseText);
                throw new Error('El servidor devolvió una respuesta inválida');
            }
            
            if (result.success) {
                // Agregar al historial
                this.addToHistory(chestType, result.reward);
                
                // Redirigir a la página de recompensa con los datos
                setTimeout(() => {
                    const rewardData = encodeURIComponent(JSON.stringify(result.reward));
                    window.location.href = `reward.php?chest=${chestType}&reward=${rewardData}`;
                }, 1500); // Esperar a que termine la animación
            } else {
                console.error('Error del servidor:', result.message);
                this.showError(result.message);
                this.restoreButton(chestType);
                this.isOpening = false;
            }
            
        } catch (error) {
            console.error('Error opening chest:', error);
            this.showError('Error del servidor. Inténtalo de nuevo.');
            this.restoreButton(chestType);
            this.isOpening = false;
        }
    }

    playOpenAnimation(chestType) {
        // Convertir guiones bajos a guiones para el selector
        const selectorType = chestType.replace(/_/g, '-');
        
        // Buscar la tarjeta de cofre usando el data-chest-type
        const card = document.querySelector(`[data-chest-type="${selectorType}"]`);
        
        if (!card) {
            console.warn(`No se encontró la tarjeta del cofre: ${chestType} (selector: ${selectorType})`);
            return;
        }
        
        // Efecto visual de apertura
        card.style.transform = 'scale(1.05)';
        card.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
        card.style.transition = 'all 0.3s ease';
        
        // Añadir clase de cargando al botón
        const btn = card.querySelector('.open-chest-btn, button[onclick*="openChest"]');
        if (btn) {
            btn.setAttribute('data-original-text', btn.innerHTML);
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Abriendo...';
            btn.disabled = true;
            btn.classList.add('loading');
        }
    }

    restoreButton(chestType) {
        // Convertir guiones bajos a guiones para el selector
        const selectorType = chestType.replace(/_/g, '-');
        
        // Buscar la tarjeta de cofre usando el data-chest-type
        const card = document.querySelector(`[data-chest-type="${selectorType}"]`);
        
        if (!card) {
            console.warn(`No se encontró la tarjeta del cofre para restaurar: ${chestType} (selector: ${selectorType})`);
            return;
        }
        
        // Restaurar efectos visuales
        card.style.transform = '';
        card.style.boxShadow = '';
        
        const btn = card.querySelector('.open-chest-btn, button[onclick*="openChest"]');
        if (btn) {
            const originalText = btn.getAttribute('data-original-text');
            if (originalText) {
                btn.innerHTML = originalText;
            }
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    }

    showError(message) {
        // Crear toast de error moderno
        const toast = document.createElement('div');
        toast.className = 'position-fixed top-0 end-0 p-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-danger text-white">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong class="me-auto">Error</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Configurar auto-dismiss con Bootstrap si está disponible
        if (typeof bootstrap !== 'undefined') {
            const toastElement = toast.querySelector('.toast');
            const bsToast = new bootstrap.Toast(toastElement, {
                autohide: true,
                delay: 5000
            });
            bsToast.show();
        }
        
        // Limpiar elemento después del tiempo
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 6000);
    }

    // Método para formatear números
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Método para cargar historial reciente
    loadRecentHistory() {
        console.log('Loading recent history...');
        const historyList = document.getElementById('historyList');
        
        if (!historyList) {
            console.warn('History list element not found');
            return;
        }

        // Obtener historial del localStorage
        const history = this.getStoredHistory();
        
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-box-open"></i>
                    <p>No hay aperturas recientes</p>
                </div>
            `;
            return;
        }

        // Mostrar los últimos 5 elementos
        const recentHistory = history.slice(-5).reverse();
        
        historyList.innerHTML = recentHistory.map(item => `
            <div class="history-item">
                <div class="history-icon">
                    <i class="fas fa-gift"></i>
                </div>
                <div class="history-info">
                    <div class="history-reward">${item.reward}</div>
                    <div class="history-chest">${item.chestName}</div>
                    <div class="history-time">${this.formatTime(item.timestamp)}</div>
                </div>
                <div class="history-rarity rarity-${item.rarity}">
                    ${item.rarity}
                </div>
            </div>
        `).join('');
    }

    // Obtener historial almacenado
    getStoredHistory() {
        try {
            const stored = localStorage.getItem('gacha_history');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    // Agregar elemento al historial
    addToHistory(chestType, reward) {
        const history = this.getStoredHistory();
        
        const chestNames = {
            'uma_musume': 'Cofre Uma Musume',
            'warhammer': 'Cofre Warhammer 40K',
            'terrains': 'Cofre de Terrenos'
        };

        const historyItem = {
            timestamp: Date.now(),
            chestType: chestType,
            chestName: chestNames[chestType] || 'Cofre Desconocido',
            reward: reward.name,
            rarity: reward.rarity
        };

        history.push(historyItem);
        
        // Mantener solo los últimos 20 elementos
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }

        try {
            localStorage.setItem('gacha_history', JSON.stringify(history));
            this.loadRecentHistory(); // Refrescar la vista
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    // Formatear tiempo relativo
    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `Hace ${days}d`;
        if (hours > 0) return `Hace ${hours}h`;
        if (minutes > 0) return `Hace ${minutes}m`;
        return 'Hace un momento';
    }
}

// Función global para mantener compatibilidad con onclick - ESTA ES LA IMPORTANTE
function openChest(chestType, cost) {
    console.log('openChest called with:', chestType, cost);
    if (window.gachaSystem) {
        window.gachaSystem.openChest(chestType, cost);
    } else {
        console.error('GachaSystem not initialized');
        // Intentar inicializar si no existe
        setTimeout(() => {
            if (window.gachaSystem) {
                window.gachaSystem.openChest(chestType, cost);
            } else {
                alert('Sistema de cofres no disponible. Recarga la página.');
            }
        }, 100);
    }
}

// Función para refrescar el historial
function refreshHistory() {
    console.log('Refreshing history...');
    if (window.gachaSystem) {
        window.gachaSystem.loadRecentHistory();
    } else {
        console.warn('GachaSystem not available for history refresh');
    }
}

// Hacer las funciones disponibles inmediatamente
window.openChest = openChest;
window.refreshHistory = refreshHistory;

// Inicializar sistema cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Gacha System...');
    window.gachaSystem = new GachaSystem();
    
    // Precargar recursos para las animaciones
    const preloadImages = [
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="%23ffd700" stroke-width="4"/></svg>'
    ];
    
    preloadImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
    
    console.log('Gacha System initialized successfully');
});

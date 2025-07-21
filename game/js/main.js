/**
 * Archivo principal - Einherjar Blitz
 * Inicializa el juego y maneja la carga
 */

// Variables globales
let gameEngine;

// Inicialización del juego
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎮 Iniciando Einherjar Blitz...');
    
    try {
        // Verificar que tenemos un personaje seleccionado
        const selectedChampion = sessionStorage.getItem('selected_champion');
        if (!selectedChampion) {
            console.error('❌ No hay personaje seleccionado');
            alert('Error: No se ha seleccionado ningún personaje');
            window.location.href = '../seleccion.php';
            return;
        }
        
        console.log(`✅ Personaje seleccionado: ID ${selectedChampion}`);
        
        // Inicializar el motor del juego
        gameEngine = new GameEngine();
        
        // Hacer disponible globalmente para debugging
        window.gameEngine = gameEngine;
        
    } catch (error) {
        console.error('❌ Error fatal al inicializar:', error);
        alert('Error al cargar el juego: ' + error.message);
        window.location.href = '../seleccion.php';
    }
});

// Manejo de errores globales
window.addEventListener('error', (event) => {
    console.error('❌ Error de JavaScript:', event.error);
    
    // En desarrollo, mostrar el error
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.group('🐛 Debug Info');
        console.log('File:', event.filename);
        console.log('Line:', event.lineno);
        console.log('Column:', event.colno);
        console.log('Stack:', event.error?.stack);
        console.groupEnd();
    }
});

// Prevenir comportamientos no deseados en móviles
document.addEventListener('touchstart', function(e) {
    // Prevenir zoom en doble tap
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Optimizaciones para rendimiento
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pausar o reducir actividad cuando la página no es visible
        if (gameEngine && gameEngine.soundManager) {
            gameEngine.soundManager.mute();
        }
    } else {
        // Reanudar cuando la página vuelve a ser visible
        if (gameEngine && gameEngine.soundManager && gameEngine.settings.sfxVolume > 0) {
            gameEngine.soundManager.unmute();
        }
    }
});

// Manejo de orientación en móviles
window.addEventListener('orientationchange', () => {
    // Pequeño delay para permitir que el navegador se ajuste
    setTimeout(() => {
        if (gameEngine && gameEngine.battleUI) {
            gameEngine.battleUI.updateAll();
        }
    }, 100);
});

// Debug mode para desarrollo
if (window.location.search.includes('debug=true')) {
    window.DEBUG_MODE = true;
    console.log('🔧 Modo debug activado');
    
    // Agregar controles de debug
    window.debugControls = {
        setPlayerHealth: (health) => {
            if (gameEngine && gameEngine.player) {
                gameEngine.player.currentHealth = health;
                gameEngine.battleUI.updatePlayerInfo();
            }
        },
        setEnemyHealth: (health) => {
            if (gameEngine && gameEngine.enemy) {
                gameEngine.enemy.currentHealth = health;
                gameEngine.battleUI.updateEnemyInfo();
            }
        },
        addEnergy: (amount) => {
            if (gameEngine && gameEngine.player) {
                gameEngine.player.currentEnergy = Math.min(
                    gameEngine.player.maxEnergy, 
                    gameEngine.player.currentEnergy + amount
                );
                gameEngine.battleUI.updatePlayerInfo();
            }
        },
        forceVictory: () => {
            if (gameEngine) {
                gameEngine.endBattle('victory');
            }
        },
        forceDefeat: () => {
            if (gameEngine) {
                gameEngine.endBattle('defeat');
            }
        },
        skipTurn: () => {
            if (gameEngine) {
                gameEngine.nextTurn();
            }
        }
    };
    
    console.log('🎯 Controles de debug disponibles en window.debugControls');
}

// Utilidades de desarrollo
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Hot reload para desarrollo (opcional)
    let lastModified = Date.now();
    
    setInterval(() => {
        fetch(window.location.href, { method: 'HEAD' })
            .then(response => {
                const modified = new Date(response.headers.get('last-modified')).getTime();
                if (modified > lastModified) {
                    console.log('🔄 Detectado cambio en el archivo, recargando...');
                    window.location.reload();
                }
            })
            .catch(() => {
                // Ignorar errores de red
            });
    }, 5000);
}

// Analytics básicos (para futuras métricas)
window.gameMetrics = {
    startTime: Date.now(),
    actions: [],
    
    recordAction: function(actionType, result) {
        this.actions.push({
            timestamp: Date.now(),
            type: actionType,
            result: result
        });
    },
    
    getSessionData: function() {
        return {
            duration: Date.now() - this.startTime,
            totalActions: this.actions.length,
            actions: this.actions
        };
    }
};

console.log('✅ Sistema principal inicializado');

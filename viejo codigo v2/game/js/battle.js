/**
 * Archivo principal de la batalla - Einherjar Blitz
 * Inicializa y conecta todos los sistemas
 */

import { BattleSystem } from './BattleSystem.js';
import { BattleUI } from './BattleUI.js';

class BattleGame {
    constructor() {
        this.battleSystem = null;
        this.battleUI = null;
        this.initialized = false;
    }
    
    /**
     * Inicializa el juego de batalla
     */
    async init() {
        try {
            console.log('Inicializando Einherjar Blitz Battle System...');
            
            // Obtener ID del personaje seleccionado
            const selectedCharacterId = this.getSelectedCharacterId();
            
            if (!selectedCharacterId) {
                throw new Error('No se encontró personaje seleccionado');
            }
            
            // Inicializar sistemas
            this.battleSystem = new BattleSystem();
            this.battleUI = new BattleUI(this.battleSystem);
            
            // Inicializar batalla
            const initResult = await this.battleSystem.initializeBattle(selectedCharacterId);
            
            if (!initResult.success) {
                throw new Error(initResult.error || 'Error inicializando batalla');
            }
            
            // Configurar UI inicial
            this.battleUI.initializeWithCharacters(initResult.player, initResult.enemy);
            
            // Marcar como inicializado
            this.initialized = true;
            
            console.log('Battle System inicializado correctamente');
            console.log('Jugador:', initResult.player.name);
            console.log('Enemigo:', initResult.enemy.name);
            console.log('Primer turno:', initResult.currentTurn);
            
            // Mostrar mensaje de bienvenida
            this.showWelcomeMessage(initResult.player, initResult.enemy);
            
            // Si el enemigo tiene el primer turno, procesarlo
            if (initResult.currentTurn === 'enemy') {
                setTimeout(() => {
                    this.battleSystem.processEnemyTurn();
                }, 2000);
            }
            
        } catch (error) {
            console.error('Error inicializando batalla:', error);
            this.showErrorMessage(error.message);
        }
    }
    
    /**
     * Obtiene el ID del personaje seleccionado
     */
    getSelectedCharacterId() {
        // Primero intentar desde sessionStorage (desde seleccion.php)
        const sessionCharacter = sessionStorage.getItem('selected_champion');
        if (sessionCharacter) {
            return parseInt(sessionCharacter);
        }
        
        // Luego intentar desde localStorage
        const localCharacter = localStorage.getItem('selectedCharacter');
        if (localCharacter) {
            // Mapeo de nombres a IDs para compatibilidad con código viejo
            const nameToId = {
                'red': 1,
                'riyuri': 2, 
                'marceline': 3,
                'garouth': 4,
                'onji': 1,
                'medaka': 2,
                'yato': 3,
                'argos': 4,
                'hector': 1,
                'raiden': 2
            };
            
            return nameToId[localCharacter] || 1;
        }
        
        // URL parameters como fallback
        const urlParams = new URLSearchParams(window.location.search);
        const urlCharacter = urlParams.get('character');
        if (urlCharacter) {
            return parseInt(urlCharacter);
        }
        
        // Por defecto, usar primer personaje
        return 1;
    }
    
    /**
     * Muestra mensaje de bienvenida
     */
    showWelcomeMessage(player, enemy) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <div class="welcome-content">
                <h2>¡Batalla Iniciada!</h2>
                <div class="vs-display">
                    <div class="character-preview">
                        <img src="../images/${player.image}" alt="${player.name}">
                        <h3>${player.name}</h3>
                        <p>${player.title}</p>
                    </div>
                    <div class="vs-text">VS</div>
                    <div class="character-preview">
                        <img src="../images/${enemy.image}" alt="${enemy.name}">
                        <h3>${enemy.name}</h3>
                        <p>${enemy.title}</p>
                    </div>
                </div>
                <p>¡Que comience la batalla!</p>
            </div>
        `;
        
        // Estilos para el mensaje de bienvenida
        welcomeDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.5s ease-out;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .welcome-content {
                text-align: center;
                color: white;
                max-width: 600px;
                padding: 2rem;
            }
            
            .welcome-content h2 {
                font-family: 'Cinzel', serif;
                font-size: 2.5rem;
                color: #c9aa71;
                margin-bottom: 2rem;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            }
            
            .vs-display {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 2rem;
                margin: 2rem 0;
            }
            
            .character-preview {
                text-align: center;
            }
            
            .character-preview img {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                border: 3px solid #c9aa71;
                margin-bottom: 1rem;
                box-shadow: 0 4px 15px rgba(201, 170, 113, 0.3);
            }
            
            .character-preview h3 {
                font-family: 'Cinzel', serif;
                color: #c9aa71;
                margin-bottom: 0.5rem;
            }
            
            .character-preview p {
                color: #aaaaaaaa;
                font-size: 0.9rem;
                font-style: italic;
            }
            
            .vs-text {
                font-family: 'Cinzel', serif;
                font-size: 3rem;
                font-weight: bold;
                color: #c9aa71;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                animation: vsGlow 2s ease-in-out infinite;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }
            
            @keyframes vsGlow {
                0%, 100% { text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(201, 170, 113, 0.3); }
                50% { text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 40px rgba(201, 170, 113, 0.8); }
            }
            
            @media (max-width: 768px) {
                .vs-display {
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .character-preview img {
                    width: 80px;
                    height: 80px;
                }
                
                .vs-text {
                    font-size: 2rem;
                }
                
                .welcome-content h2 {
                    font-size: 2rem;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(welcomeDiv);
        
        // Remover mensaje después de 4 segundos
        setTimeout(() => {
            welcomeDiv.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => {
                welcomeDiv.remove();
                style.remove();
            }, 500);
        }, 4000);
        
        // Agregar animación de fadeOut
        const fadeOutStyle = document.createElement('style');
        fadeOutStyle.textContent = `
            @keyframes fadeOut {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.8); }
            }
        `;
        document.head.appendChild(fadeOutStyle);
    }
    
    /**
     * Muestra mensaje de error
     */
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Error</h2>
                <p>${message}</p>
                <button onclick="window.location.href='../seleccion.php'">Volver a Selección</button>
            </div>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            color: white;
            text-align: center;
        `;
        
        const errorStyle = document.createElement('style');
        errorStyle.textContent = `
            .error-content {
                padding: 2rem;
                max-width: 400px;
            }
            
            .error-content i {
                font-size: 4rem;
                color: #e74c3c;
                margin-bottom: 1rem;
            }
            
            .error-content h2 {
                font-family: 'Cinzel', serif;
                color: #e74c3c;
                margin-bottom: 1rem;
            }
            
            .error-content p {
                margin-bottom: 2rem;
                color: #aaaaaaaa;
            }
            
            .error-content button {
                background: linear-gradient(45deg, #c9aa71, #d4b776);
                color: #000;
                border: none;
                padding: 1rem 2rem;
                border-radius: 25px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .error-content button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(201, 170, 113, 0.3);
            }
        `;
        
        document.head.appendChild(errorStyle);
        document.body.appendChild(errorDiv);
    }
    
    /**
     * Maneja errores no capturados
     */
    handleError(error) {
        console.error('Error en Battle Game:', error);
        this.showErrorMessage('Ha ocurrido un error inesperado. Por favor, intenta de nuevo.');
    }
}

// Inicializar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const game = new BattleGame();
        
        // Configurar manejo de errores globales
        window.addEventListener('error', (event) => {
            game.handleError(event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            game.handleError(event.reason);
        });
        
        // Inicializar juego
        await game.init();
        
        // Exponer game globalmente para debugging
        window.battleGame = game;
        
        // Función de testing para el modal
        window.testBattleEndModal = () => {
            const testResult = {
                ended: true,
                winner: 'player',
                result: '¡Victoria de prueba!',
                battleType: 'enemy_defeated',
                surrendered: false,
                duration: 120000,
                stats: {
                    totalDamageDealt: 500,
                    totalDamageReceived: 200,
                    criticalHits: 3,
                    specialAbilitiesUsed: 2
                }
            };
            
            if (game.battleUI) {
                console.log('Testing battle end modal...');
                game.battleUI.showBattleEndModal(testResult);
            } else {
                console.log('BattleUI not available');
            }
        };
        
    } catch (error) {
        console.error('Error fatal inicializando battle game:', error);
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                color: white;
                text-align: center;
                font-family: 'Inter', sans-serif;
            ">
                <div>
                    <h1 style="color: #e74c3c; margin-bottom: 1rem;">Error Fatal</h1>
                    <p style="margin-bottom: 2rem;">No se pudo cargar el sistema de batalla.</p>
                    <button onclick="window.location.href='../seleccion.php'" style="
                        background: linear-gradient(45deg, #c9aa71, #d4b776);
                        color: #000;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 25px;
                        font-weight: 600;
                        cursor: pointer;
                    ">Volver a Selección</button>
                </div>
            </div>
        `;
    }
});

// Prevenir que el usuario salga accidentalmente durante una batalla
window.addEventListener('beforeunload', (event) => {
    if (window.battleGame && window.battleGame.initialized && !window.battleGame.battleSystem.battleEnded) {
        event.preventDefault();
        event.returnValue = '¿Estás seguro de que quieres salir? Se perderá el progreso de la batalla.';
        return event.returnValue;
    }
});

// Manejo de visibilidad de la página
document.addEventListener('visibilitychange', () => {
    if (window.battleGame && window.battleGame.battleSystem) {
        if (document.hidden) {
            // Pausar batalla si la página está oculta
            console.log('Batalla pausada - página oculta');
        } else {
            // Reanudar batalla si la página vuelve a estar visible
            console.log('Batalla reanudada - página visible');
        }
    }
});

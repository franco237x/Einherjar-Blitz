// Sistema de Combate Modular - Einherjar Blitz
// Importaciones de módulos de personajes
import { CharacterLoader } from './characters/CharacterFactory.js';

// Variables globales del juego
let currentChampion = null;
let currentEnemy = null;
let isPlayerTurn = true;
let combatActive = true;
let attackCooldowns = {
    basic: 0,
    elemental: 0,
    ultimate: 0
};

// Elementos del DOM
const basicAttackBtn = document.getElementById('basic-attack-btn');
const elementalAttackBtn = document.getElementById('elemental-attack-btn');
const ultimateAttackBtn = document.getElementById('ultimate-attack-btn');
const logContainer = document.querySelector('#battle-log-compact .log-content');

// Inicialización del juego
async function initializeGame() {
    try {
        console.log('🎮 Inicializando Einherjar Blitz...');
        
        // Cargar el personaje seleccionado usando el sistema modular
        currentChampion = await CharacterLoader.loadCharacter(window.championData);
        
        // Crear enemigo básico (sin módulo por ahora)
        currentEnemy = createEnemyFromData(window.enemyData);
        
        // Actualizar UI con información del personaje
        updateCharacterUI();
        updateEnemyUI();
        
        // Actualizar botones con información específica del personaje
        updateAttackButtons();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Mensaje inicial
        addBattleLog(`💀 ¡${currentChampion.name} se enfrenta a ${currentEnemy.name}!`);
        addBattleLog(`⚡ Sistema modular cargado. Personaje: ${currentChampion.constructor.name}`);
        
        // Mostrar información de pasivas
        currentChampion.passives.forEach(passive => {
            addBattleLog(`🔮 Pasiva activa: ${passive.name}`);
        });
        
        console.log('✅ Juego inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando el juego:', error);
        addBattleLog(`❌ Error: ${error.message}`);
    }
}

// Crear enemigo desde datos (versión simplificada)
function createEnemyFromData(data) {
    return {
        ...data,
        energy: 100,
        maxEnergy: 100,
        activeEffects: [],
        
        takeDamage(damage) {
            this.health = Math.max(0, this.health - damage);
            return this.health <= 0;
        },
        
        addEffect(effect) {
            this.activeEffects.push(effect);
        },
        
        removeEffect(effectName) {
            this.activeEffects = this.activeEffects.filter(e => e.name !== effectName);
        },
        
        hasEffect(effectName) {
            return this.activeEffects.some(e => e.name === effectName);
        },
        
        processEffects() {
            this.activeEffects.forEach(effect => {
                if (effect.onTurnStart) {
                    const message = effect.onTurnStart(this);
                    if (message) addBattleLog(message);
                }
                effect.duration--;
            });
            
            this.activeEffects = this.activeEffects.filter(effect => effect.duration > 0);
        },
          isAlive() {
            return this.health > 0;
        },
        
        // Método para compatibilidad con el sistema de personajes
        applyDefensivePassives(damage, attack, attacker) {
            // Los enemigos básicos no tienen pasivas defensivas por defecto
            return damage;
        }
    };
}

// Actualizar UI del personaje
function updateCharacterUI() {
    const data = currentChampion.getDisplayData();
    
    // Actualizar salud
    document.getElementById('champion-health-text').textContent = data.health;
    const healthPercentage = (data.health / data.maxHealth) * 100;
    document.getElementById('champion-health').style.width = `${healthPercentage}%`;
    
    // Actualizar energía
    document.getElementById('energy-text').textContent = `${data.energy}/${data.maxEnergy}`;
    const energyPercentage = (data.energy / data.maxEnergy) * 100;
    document.getElementById('champion-energy').style.width = `${energyPercentage}%`;
    
    // Actualizar información específica del personaje si existe
    updateCharacterSpecificUI(data);
}

// Actualizar UI específica del personaje
function updateCharacterSpecificUI(data) {
    // Crear o actualizar indicadores específicos
    let specificUI = document.getElementById('character-specific-ui');
    if (!specificUI) {
        specificUI = document.createElement('div');
        specificUI.id = 'character-specific-ui';
        specificUI.className = 'character-specific-indicators';
        document.querySelector('.floating-stats.left').appendChild(specificUI);
    }
      let content = '';
    
    // Shuna - Nueva versión con Devastación y Doctrina
    if (data.element === "Devastación") {
        content += `<div class="devastation-indicator">🔥 ${data.element}</div>`;
        
        if (data.doctrineActive) {
            content += `<div class="doctrine-indicator">💀 DOCTRINA PERFECTA</div>`;
        }
        
        if (data.transformation) {
            content += `<div class="transformation-indicator">⚡ ${data.transformation}</div>`;
        }
    }
    
    // Shuna - Antigua versión (para compatibilidad)
    if (data.furyStacks !== undefined) {
        content += `<div class="fury-indicator">🔥 Furia: ${data.furyStacks}/${data.maxFuryStacks}</div>`;
    }
    
    // Ozen - Escudo
    if (data.shieldPoints !== undefined) {
        content += `<div class="shield-indicator">🛡️ Escudo: ${data.shieldPoints}/${data.maxShieldPoints}</div>`;
        if (data.isDefensiveStance) {
            content += `<div class="stance-indicator">⚔️ Postura Defensiva</div>`;
        }
    }
    
    // Xair - Energía Bijon
    if (data.bijonEnergy !== undefined) {
        content += `<div class="bijon-indicator">⚡ Bijon: ${data.bijonEnergy}/${data.maxBijonEnergy}</div>`;
        if (data.bijonOvercharge) {
            content += `<div class="overcharge-indicator">💥 SOBRECARGA</div>`;
        }
    }
    
    specificUI.innerHTML = content;
}

// Actualizar UI del enemigo
function updateEnemyUI() {
    // Salud del enemigo
    document.getElementById('enemy-health-text').textContent = currentEnemy.health;
    const healthPercentage = (currentEnemy.health / currentEnemy.maxHealth) * 100;
    document.getElementById('enemy-health').style.width = `${healthPercentage}%`;
}

// Actualizar botones de ataque con información específica
function updateAttackButtons() {
    const attacks = currentChampion.attacks;
    
    // Botón de ataque básico
    const basicBtn = document.querySelector('#basic-attack-btn .btn-text');
    basicBtn.innerHTML = `
        <span class="btn-title">${attacks.basic.name.toUpperCase()}</span>
        <span class="btn-desc">${attacks.basic.energyCost} Energía - ${attacks.basic.description}</span>
    `;
    
    // Botón de ataque elemental
    const elementalBtn = document.querySelector('#elemental-attack-btn .btn-text');
    elementalBtn.innerHTML = `
        <span class="btn-title">${attacks.elemental.name.toUpperCase()}</span>
        <span class="btn-desc">${attacks.elemental.energyCost} Energía - ${attacks.elemental.description}</span>
    `;
    
    // Botón de habilidad definitiva
    const ultimateBtn = document.querySelector('#ultimate-attack-btn .btn-text');
    ultimateBtn.innerHTML = `
        <span class="btn-title">${attacks.ultimate.name.toUpperCase()}</span>
        <span class="btn-desc">${attacks.ultimate.energyCost} Energía - ${attacks.ultimate.description}</span>
    `;
}

// Configurar event listeners
function setupEventListeners() {
    basicAttackBtn.addEventListener('click', () => handlePlayerAttack('basic'));
    elementalAttackBtn.addEventListener('click', () => handlePlayerAttack('elemental'));
    ultimateAttackBtn.addEventListener('click', () => handlePlayerAttack('ultimate'));
}

// Manejar ataque del jugador
async function handlePlayerAttack(attackType) {
    if (!isPlayerTurn || !combatActive) return;
    
    const attack = currentChampion.attacks[attackType];
    
    // Verificar si puede usar el ataque
    if (!currentChampion.canUseAttack(attackType)) {
        addBattleLog(`❌ No tienes suficiente energía para ${attack.name}`);
        return;
    }
    
    // Verificar cooldown
    if (attackCooldowns[attackType] > 0) {
        addBattleLog(`⏱️ ${attack.name} está en cooldown`);
        return;
    }
    
    // Ejecutar ataque
    isPlayerTurn = false;
    await executePlayerAttack(attackType);
    
    // Verificar si el enemigo está vivo
    if (!currentEnemy.isAlive()) {
        await handleCombatEnd(true);
        return;
    }
    
    // Turno del enemigo
    setTimeout(async () => {
        await executeEnemyTurn();
        
        // Verificar si el jugador está vivo
        if (!currentChampion.isAlive()) {
            await handleCombatEnd(false);
            return;
        }
        
        isPlayerTurn = true;
        updateCooldowns();
        updateUI();
    }, 1500);
}

// Ejecutar ataque del jugador
async function executePlayerAttack(attackType) {
    const attack = currentChampion.attacks[attackType];
    
    // Consumir energía
    currentChampion.useEnergy(attack.energyCost);
    
    // Ejecutar ataque usando el módulo del personaje
    const result = attack.execute(currentEnemy);
    
    // Aplicar daño
    const enemyDied = currentEnemy.takeDamage(result.damage);
    
    // Log del ataque
    let logMessage = result.description;
    if (result.isCritical) {
        logMessage += ` ¡CRÍTICO!`;
    }
    logMessage += ` (${result.damage} daño)`;
    
    if (result.additionalEffect) {
        logMessage += ` - ${result.additionalEffect}`;
    }
    
    addBattleLog(logMessage);
    
    // Manejar efectos especiales del personaje
    if (result.isCritical && currentChampion.onCriticalHit) {
        const critMessage = currentChampion.onCriticalHit();
        if (critMessage) addBattleLog(critMessage);
    }
    
    if (enemyDied && currentChampion.onEnemyKilled) {
        const killMessage = currentChampion.onEnemyKilled();
        if (killMessage) addBattleLog(killMessage);
    }
    
    // Activar cooldown
    startCooldown(attackType);
    
    // Efectos visuales
    createDamageEffect(document.getElementById('enemy-card'), result.damage, result.isCritical);
    
    updateUI();
}

// Ejecutar turno del enemigo
async function executeEnemyTurn() {
    // Procesar efectos del enemigo
    currentEnemy.processEffects();
    
    // Verificar si está congelado o incapacitado
    const disableEffect = currentEnemy.activeEffects.find(e => e.type === 'disable');
    if (disableEffect) {
        addBattleLog(`❄️ ${currentEnemy.name} está ${disableEffect.name.toLowerCase()} y no puede atacar`);
        return;
    }
    
    // Ataque básico del enemigo
    const damage = Math.floor(Math.random() * (currentEnemy.attackMax - currentEnemy.attackMin + 1)) + currentEnemy.attackMin;
    const finalDamage = Math.max(1, damage - currentChampion.armor);
    
    const playerDied = currentChampion.takeDamage(finalDamage);
    
    addBattleLog(`🔴 ${currentEnemy.name} ataca por ${finalDamage} de daño`);
    
    // Efectos visuales
    createDamageEffect(document.getElementById('champion-card'), finalDamage, false);
    
    // Procesar efectos del jugador
    if (currentChampion.onTurnStart) {
        currentChampion.onTurnStart();
    }
    
    updateUI();
}

// Sistema de cooldowns
function startCooldown(attackType) {
    const attack = currentChampion.attacks[attackType];
    attackCooldowns[attackType] = attack.cooldown;
    
    const button = document.getElementById(`${attackType}-attack-btn`);
    button.classList.add('cooldown');
    button.disabled = true;
}

function updateCooldowns() {
    Object.keys(attackCooldowns).forEach(attackType => {
        if (attackCooldowns[attackType] > 0) {
            attackCooldowns[attackType] = Math.max(0, attackCooldowns[attackType] - 1000);
            
            if (attackCooldowns[attackType] <= 0) {
                const button = document.getElementById(`${attackType}-attack-btn`);
                button.classList.remove('cooldown');
                button.disabled = false;
            }
        }
    });
}

// Actualizar toda la UI
function updateUI() {
    updateCharacterUI();
    updateEnemyUI();
    updateButtonStates();
}

// Actualizar estados de botones
function updateButtonStates() {
    Object.keys(currentChampion.attacks).forEach(attackType => {
        const button = document.getElementById(`${attackType}-attack-btn`);
        const attack = currentChampion.attacks[attackType];
        
        const canUse = currentChampion.canUseAttack(attackType) && attackCooldowns[attackType] <= 0;
        button.disabled = !canUse || !isPlayerTurn;
        
        if (!canUse && isPlayerTurn) {
            button.classList.add('disabled');
        } else {
            button.classList.remove('disabled');
        }
    });
}

// Efectos visuales simplificados
function createDamageEffect(element, damage, isCritical) {
    const damageEl = document.createElement('div');
    damageEl.className = `damage-number ${isCritical ? 'critical' : ''}`;
    damageEl.textContent = `-${damage}`;
    damageEl.style.position = 'absolute';
    damageEl.style.top = '50%';
    damageEl.style.left = '50%';
    damageEl.style.transform = 'translate(-50%, -50%)';
    damageEl.style.zIndex = '1000';
    damageEl.style.pointerEvents = 'none';
    
    element.style.position = 'relative';
    element.appendChild(damageEl);
    
    // Animación simple
    setTimeout(() => damageEl.remove(), 1000);
}

// Sistema de logs de batalla
function addBattleLog(message) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = message;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Mantener solo los últimos 50 mensajes
    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

// Manejar fin del combate
async function handleCombatEnd(playerWon) {
    combatActive = false;
    
    if (playerWon) {
        addBattleLog(`🎉 ¡${currentChampion.name} ha vencido!`);
        
        // Efectos de victoria específicos del personaje
        if (currentChampion.onVictory) {
            const victoryMessage = currentChampion.onVictory();
            if (victoryMessage) addBattleLog(victoryMessage);
        }
        
        setTimeout(() => {
            alert('¡Victoria! Regresando al lobby...');
            window.location.href = 'dashboard.php';
        }, 2000);
    } else {
        addBattleLog(`💀 ${currentChampion.name} ha sido derrotado...`);
        
        setTimeout(() => {
            alert('Derrota... Regresando al lobby...');
            window.location.href = 'dashboard.php';
        }, 2000);
    }
}

// Función de orientación mejorada para móviles
function checkOrientation() {
    const rotateMessage = document.getElementById('rotateMessage');
    const game = document.getElementById('game');
    
    // Solo mostrar mensaje de rotación en pantallas muy pequeñas en portrait
    const isSmallScreen = window.innerWidth < 480;
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (isSmallScreen && isPortrait) {
        rotateMessage.style.display = 'flex';
        game.style.display = 'none';
    } else {
        rotateMessage.style.display = 'none';
        game.style.display = 'flex';
    }
}

// Event listeners globales
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    checkOrientation();
    initializeGame();
});

// Debug: Exportar funciones para testing
window.EinherjjDebug = {
    champion: () => currentChampion,
    enemy: () => currentEnemy,
    reloadCharacter: () => initializeGame()
};

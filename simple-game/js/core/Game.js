import { BattleSystem } from '../combat/BattleSystem.js';

const playerData = window.championData;
const enemyData = window.enemyData;

// Referencias de UI
const playerHealthFill = document.getElementById('playerHealth');
const enemyHealthFill  = document.getElementById('enemyHealth');
const btnBasic   = document.getElementById('btnBasic');
const btnElement = document.getElementById('btnElement');
const btnUlt     = document.getElementById('btnUltimate');
const battleLog  = document.getElementById('battleLog');

// Instanciar sistema de batalla
const battle = new BattleSystem(playerData, enemyData, {
    onAttack: ({ source, damage }) => {
        addLog(`${source === 'player' ? 'Tú' : 'Enemigo'} inflige ${damage} de daño.`);
        updateBars();
    },
    onEnd: (result) => {
        addLog(result === 'victory' ? '¡Has ganado!' : 'Has sido derrotado...');
        disableButtons();
    }
});

function updateBars() {
    const state = battle.getState();
    playerHealthFill.style.width = `${(state.playerHealth/state.playerMax)*100}%`;
    enemyHealthFill.style.width  = `${(state.enemyHealth/state.enemyMax)*100}%`;
}

function addLog(text) {
    const li = document.createElement('li');
    li.textContent = text;
    battleLog.appendChild(li);
    battleLog.scrollTop = battleLog.scrollHeight;
}

function disableButtons() {
    [btnBasic, btnElement, btnUlt].forEach(b=>b.disabled=true);
}

// Eventos de botones (por ahora todos usan el mismo ataque)
btnBasic.addEventListener('click', () => battle.playerAttack());
btnElement.addEventListener('click', () => battle.playerAttack());
btnUlt.addEventListener('click', () => battle.playerAttack());

// Inicializar barras
updateBars();

addLog('¡Comienza la batalla! Tu turno.'); 
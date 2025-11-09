import { getAllCards, createCardInstance } from './cards.js';

class CardGame {
    constructor() {
        this.gameState = {
            player: {
                hp: 30,
                maxHp: 30,
                energy: 3,
                maxEnergy: 10,
                hand: [],
                field: [],
                deck: []
            },
            opponent: {
                hp: 30,
                maxHp: 30,
                energy: 3,
                maxEnergy: 10,
                hand: [],
                field: [],
                deck: []
            },
            turn: 'player', // 'player' o 'opponent'
            turnCount: 0,
            selectedCard: null,
            selectedTarget: null,
            gameOver: false,
            winner: null
        };
        
        this.cardInstanceCounter = 0;
        this.init();
    }
    
    init() {
        this.setupDecks();
        this.drawInitialHands();
        this.render();
        this.setupEventListeners();
        this.addLog('¡Partida iniciada! Tu turno.');
    }
    
    // Crear mazos aleatorios para ambos jugadores
    setupDecks() {
        const allCards = getAllCards();
        
        // Mazo del jugador (15 cartas aleatorias)
        for (let i = 0; i < 15; i++) {
            const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
            this.gameState.player.deck.push(createCardInstance(randomCard.id, this.cardInstanceCounter++));
        }
        
        // Mazo del oponente (15 cartas aleatorias)
        for (let i = 0; i < 15; i++) {
            const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
            this.gameState.opponent.deck.push(createCardInstance(randomCard.id, this.cardInstanceCounter++));
        }
        
        // Barajar
        this.shuffleDeck(this.gameState.player.deck);
        this.shuffleDeck(this.gameState.opponent.deck);
    }
    
    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    // Robar manos iniciales (5 cartas cada uno)
    drawInitialHands() {
        for (let i = 0; i < 5; i++) {
            this.drawCard('player');
            this.drawCard('opponent');
        }
    }
    
    // Robar carta
    drawCard(player) {
        const state = this.gameState[player];
        if (state.deck.length > 0 && state.hand.length < 10) {
            const card = state.deck.pop();
            state.hand.push(card);
            this.addLog(`${player === 'player' ? 'Tú robas' : 'Oponente roba'} una carta.`);
            return true;
        }
        return false;
    }
    
    // Jugar carta
    playCard(card, player) {
        const state = this.gameState[player];
        
        // Verificar límite de campo (3 cartas como Yu-Gi-Oh!)
        if (card.type === 'character' && state.field.length >= 3) {
            this.addLog('¡Campo lleno! Máximo 3 cartas en juego.');
            return false;
        }
        
        // Verificar si tiene energía suficiente
        if (state.energy < card.cost) {
            this.addLog('¡No tienes suficiente energía!');
            return false;
        }
        
        // Remover de la mano
        const handIndex = state.hand.findIndex(c => c.instanceId === card.instanceId);
        if (handIndex === -1) return false;
        
        state.hand.splice(handIndex, 1);
        state.energy -= card.cost;
        
        // Si es carta de personaje, va al campo
        if (card.type === 'character') {
            state.field.push(card);
            this.addLog(`${player === 'player' ? 'Juegas' : 'Oponente juega'} ${card.name}!`);
            
            // Activar habilidad "on_play"
            this.triggerAbility(card, 'on_play', player);
        } 
        // Si es hechizo, aplicar efecto inmediato
        else if (card.type === 'spell') {
            this.addLog(`${player === 'player' ? 'Usas' : 'Oponente usa'} ${card.name}!`);
            this.applySpellEffect(card, player);
        }
        
        return true;
    }
    
    // Activar habilidad de personaje
    triggerAbility(card, trigger, player) {
        if (!card.ability || card.ability.trigger !== trigger) return;
        
        const ability = card.ability;
        const enemyPlayer = player === 'player' ? 'opponent' : 'player';
        
        switch (ability.type) {
            case 'buff_allies':
                // Topaz: +2 ATK a todos los aliados
                this.gameState[player].field.forEach(ally => {
                    if (ally.instanceId !== card.instanceId) {
                        ally.currentAttack += ability.buffAmount;
                        this.addLog(`${ally.name} gana +${ability.buffAmount} ATK!`);
                    }
                });
                break;
                
            case 'single_buff':
                // Onji: +4 ATK a 1 aliado (elegir el primero por ahora)
                const target = this.gameState[player].field.find(c => c.instanceId !== card.instanceId);
                if (target) {
                    target.currentAttack += ability.buffAmount;
                    this.addLog(`${target.name} gana +${ability.buffAmount} ATK!`);
                }
                break;
                
            case 'silence_enemies':
                // Galileo: Anular habilidades enemigas 1 turno
                this.gameState[enemyPlayer].field.forEach(enemy => {
                    enemy.silenced = true;
                    enemy.silencedTurns = ability.duration;
                });
                this.addLog('¡Todas las habilidades enemigas han sido anuladas!');
                break;
                
            case 'erase_enemy':
                // Kumagawa: Destruir 1 carta enemiga al azar
                const enemies = this.gameState[enemyPlayer].field;
                if (enemies.length > 0) {
                    const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                    this.destroyCard(randomEnemy, enemyPlayer);
                    this.addLog(`¡${card.name} borra a ${randomEnemy.name} de la existencia!`);
                }
                break;
        }
    }
    
    // Aplicar efecto de hechizo
    applySpellEffect(spell, player) {
        const effect = spell.effect;
        const enemyPlayer = player === 'player' ? 'opponent' : 'player';
        
        switch (effect.type) {
            case 'gain_energy':
                this.gameState[player].energy = Math.min(
                    this.gameState[player].energy + effect.amount,
                    this.gameState[player].maxEnergy
                );
                this.addLog(`Ganas ${effect.amount} de energía!`);
                break;
                
            case 'heal_player':
                this.gameState[player].hp = Math.min(
                    this.gameState[player].hp + effect.amount,
                    this.gameState[player].maxHp
                );
                this.addLog(`Recuperas ${effect.amount} HP!`);
                break;
                
            case 'board_wipe':
                // Destruir todas las cartas
                [...this.gameState.player.field, ...this.gameState.opponent.field].forEach(card => {
                    const owner = this.gameState.player.field.includes(card) ? 'player' : 'opponent';
                    this.destroyCard(card, owner);
                });
                this.addLog('¡TODAS las cartas han sido destruidas!');
                break;
                
            case 'destroy_strongest':
                // Destruir carta enemiga con más ATK
                const enemies = this.gameState[enemyPlayer].field;
                if (enemies.length > 0) {
                    const strongest = enemies.reduce((max, card) => 
                        card.currentAttack > max.currentAttack ? card : max
                    );
                    this.destroyCard(strongest, enemyPlayer);
                    this.addLog(`¡${strongest.name} ha sido destruido!`);
                }
                break;
                
            case 'freeze_card':
                // Congelar carta enemiga al azar
                const targets = this.gameState[enemyPlayer].field;
                if (targets.length > 0) {
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    target.isFrozen = true;
                    target.frozenTurns = effect.duration;
                    this.addLog(`¡${target.name} ha sido congelado por ${effect.duration} turnos!`);
                }
                break;
        }
    }
    
    // Atacar con una carta
    attackWithCard(attackerCard, targetCard, attackerPlayer) {
        if (attackerCard.isFrozen) {
            this.addLog(`${attackerCard.name} está congelado y no puede atacar!`);
            return false;
        }
        
        if (!attackerCard.canAttack) {
            this.addLog(`${attackerCard.name} no puede atacar todavía!`);
            return false;
        }
        
        const defenderPlayer = attackerPlayer === 'player' ? 'opponent' : 'player';
        
        // Nathan: Posibilidad de esquivar
        if (targetCard.ability && targetCard.ability.type === 'redirect_attack') {
            if (Math.random() < targetCard.ability.dodgeChance) {
                this.addLog(`¡${targetCard.name} esquiva el ataque con su Kami!`);
                attackerCard.canAttack = false;
                return true;
            }
        }
        
        // X: Efectos especiales al atacar
        if (attackerCard.ability && attackerCard.ability.type === 'reality_snap') {
            const roll = Math.random();
            if (roll < attackerCard.ability.instakillChance) {
                this.addLog(`¡${attackerCard.name} altera la realidad! INSTAKILL!`);
                this.destroyCard(targetCard, defenderPlayer);
                attackerCard.canAttack = false;
                return true;
            } else if (roll < attackerCard.ability.instakillChance + attackerCard.ability.debuffChance) {
                targetCard.currentAttack = Math.max(0, targetCard.currentAttack + attackerCard.ability.debuffAmount);
                this.addLog(`¡${targetCard.name} pierde ${Math.abs(attackerCard.ability.debuffAmount)} ATK!`);
            }
        }
        
        // Godspeed: Ataque AOE
        if (attackerCard.ability && attackerCard.ability.type === 'aoe_attack') {
            this.addLog(`¡${attackerCard.name} ataca a TODAS las cartas enemigas!`);
            this.gameState[defenderPlayer].field.forEach(enemy => {
                enemy.currentHp -= attackerCard.currentAttack;
                if (enemy.currentHp <= 0) {
                    this.destroyCard(enemy, defenderPlayer);
                }
            });
            attackerCard.canAttack = false;
            return true;
        }
        
        // Ataque normal
        const damage = attackerCard.currentAttack;
        targetCard.currentHp -= damage;
        this.addLog(`${attackerCard.name} ataca a ${targetCard.name} por ${damage} de daño!`);
        
        // Firefly: Transformación
        if (targetCard.currentHp <= 0 && targetCard.ability && targetCard.ability.type === 'double_form' && !targetCard.ability.hasTransformed) {
            targetCard.currentHp = targetCard.ability.secondFormHp;
            targetCard.ability.hasTransformed = true;
            this.addLog(`¡${targetCard.name} se transforma! ¡Segunda forma activada!`);
        } 
        // Anos: Revivir
        else if (targetCard.currentHp <= 0 && targetCard.ability && targetCard.ability.type === 'revive' && !targetCard.ability.hasRevived) {
            targetCard.currentHp = targetCard.maxHp + targetCard.ability.hpBonus;
            targetCard.currentAttack += targetCard.ability.attackBonus;
            targetCard.ability.hasRevived = true;
            this.addLog(`¡${targetCard.name} revive más poderoso! +${targetCard.ability.attackBonus} ATK, +${targetCard.ability.hpBonus} HP!`);
        }
        // Destruir si HP <= 0
        else if (targetCard.currentHp <= 0) {
            this.destroyCard(targetCard, defenderPlayer);
        }
        
        attackerCard.canAttack = false;
        return true;
    }
    
    // Atacar directamente al jugador
    attackPlayer(attackerCard, attackerPlayer) {
        if (attackerCard.isFrozen || !attackerCard.canAttack) {
            this.addLog(`${attackerCard.name} no puede atacar!`);
            return false;
        }
        
        const defenderPlayer = attackerPlayer === 'player' ? 'opponent' : 'player';
        const damage = attackerCard.currentAttack;
        
        this.gameState[defenderPlayer].hp -= damage;
        this.addLog(`${attackerCard.name} ataca directamente por ${damage} de daño!`);
        
        attackerCard.canAttack = false;
        
        // Verificar victoria
        if (this.gameState[defenderPlayer].hp <= 0) {
            this.endGame(attackerPlayer);
        }
        
        return true;
    }
    
    // Destruir carta
    destroyCard(card, player) {
        const fieldIndex = this.gameState[player].field.findIndex(c => c.instanceId === card.instanceId);
        if (fieldIndex !== -1) {
            this.gameState[player].field.splice(fieldIndex, 1);
            this.addLog(`${card.name} ha sido destruido!`);
        }
    }
    
    // Terminar turno
    endTurn() {
        const currentPlayer = this.gameState.turn;
        const nextPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
        
        // Procesar fin de turno del jugador actual
        this.processEndOfTurn(currentPlayer);
        
        // Cambiar turno
        this.gameState.turn = nextPlayer;
        this.gameState.turnCount++;
        
        // Procesar inicio de turno del siguiente jugador
        this.processStartOfTurn(nextPlayer);
        
        this.addLog(`--- Turno ${this.gameState.turnCount + 1}: ${nextPlayer === 'player' ? 'Tu turno' : 'Turno del oponente'} ---`);
        this.render();
        
        // Si es turno de la IA, ejecutar su turno
        if (nextPlayer === 'opponent') {
            setTimeout(() => this.aiTurn(), 1500);
        }
    }
    
    // Procesar inicio de turno
    processStartOfTurn(player) {
        const state = this.gameState[player];
        
        // Ganar energía (máximo 10)
        state.energy = Math.min(state.energy + 1, state.maxEnergy);
        
        // Robar carta
        this.drawCard(player);
        
        // Resetear habilidad de ataque
        state.field.forEach(card => {
            card.canAttack = true;
            card.turnsInField = (card.turnsInField || 0) + 1;
            
            // Reducir turnos de congelamiento
            if (card.isFrozen) {
                card.frozenTurns--;
                if (card.frozenTurns <= 0) {
                    card.isFrozen = false;
                    this.addLog(`${card.name} ya no está congelado!`);
                }
            }
            
            // Zack: Debe esperar 3 turnos
            if (card.ability && card.ability.type === 'slow_attack' && card.turnsInField < card.ability.turnsRequired) {
                card.canAttack = false;
            }
            
            // Regulus: Destrucción después de 4 turnos
            if (card.ability && card.ability.type === 'delayed_wipe' && card.turnsInField >= card.ability.turnsRequired) {
                this.addLog(`¡${card.name} lanza Exclamación de Athena!`);
                const enemyPlayer = player === 'player' ? 'opponent' : 'player';
                [...this.gameState[enemyPlayer].field].forEach(enemy => {
                    this.destroyCard(enemy, enemyPlayer);
                });
            }
            
            // The Herta: Invocar marioneta
            if (card.ability && card.ability.type === 'summon_puppet') {
                const puppetCount = state.field.filter(c => c.name === 'Marioneta Herta').length;
                if (puppetCount < card.ability.maxPuppets && state.field.length < 7) {
                    const puppet = {
                        instanceId: this.cardInstanceCounter++,
                        name: 'Marioneta Herta',
                        type: 'character',
                        cost: 0,
                        attack: card.ability.puppetStats.attack,
                        currentAttack: card.ability.puppetStats.attack,
                        hp: card.ability.puppetStats.hp,
                        currentHp: card.ability.puppetStats.hp,
                        maxHp: card.ability.puppetStats.hp,
                        canAttack: false,
                        isPuppet: true
                    };
                    state.field.push(puppet);
                    this.addLog(`${card.name} invoca una Marioneta Herta!`);
                }
            }
        });
    }
    
    // Procesar fin de turno
    processEndOfTurn(player) {
        // Reducir duración de silencios
        this.gameState[player].field.forEach(card => {
            if (card.silenced) {
                card.silencedTurns--;
                if (card.silencedTurns <= 0) {
                    card.silenced = false;
                }
            }
        });
    }
    
    // Turno de la IA (muy simple)
    aiTurn() {
        const ai = this.gameState.opponent;
        
        // Jugar cartas que pueda pagar
        let cardsPlayed = 0;
        for (let i = ai.hand.length - 1; i >= 0 && cardsPlayed < 2; i--) {
            if (ai.hand[i].cost <= ai.energy) {
                this.playCard(ai.hand[i], 'opponent');
                cardsPlayed++;
            }
        }
        
        // Atacar con todas las cartas que pueda
        ai.field.forEach(card => {
            if (card.canAttack && !card.isFrozen) {
                // Si el jugador tiene cartas, atacarlas; si no, atacar directamente
                if (this.gameState.player.field.length > 0) {
                    const target = this.gameState.player.field[Math.floor(Math.random() * this.gameState.player.field.length)];
                    this.attackWithCard(card, target, 'opponent');
                } else {
                    this.attackPlayer(card, 'opponent');
                }
            }
        });
        
        setTimeout(() => {
            this.endTurn();
        }, 1000);
    }
    
    // Finalizar juego
    endGame(winner) {
        this.gameState.gameOver = true;
        this.gameState.winner = winner;
        this.addLog(`¡¡¡${winner === 'player' ? 'HAS GANADO' : 'HAS PERDIDO'}!!!`);
        document.getElementById('endTurnBtn').disabled = true;
    }
    
    // Renderizar interfaz
    render() {
        this.renderPlayerStats();
        this.renderHands();
        this.renderFields();
        this.renderTurnIndicator();
    }
    
    renderPlayerStats() {
        // Actualizar HP y energía en el nuevo layout
        document.getElementById('playerHP').textContent = this.gameState.player.hp;
        document.getElementById('playerEnergy').textContent = this.gameState.player.energy;
        document.getElementById('playerMaxEnergy').textContent = this.gameState.player.maxEnergy;
        document.getElementById('opponentHP').textContent = this.gameState.opponent.hp;
        document.getElementById('opponentEnergy').textContent = this.gameState.opponent.energy;
        
        // Actualizar contador de deck
        const playerDeckCount = document.getElementById('playerDeckCount');
        const opponentDeckCount = document.getElementById('opponentDeckCount');
        if (playerDeckCount) playerDeckCount.textContent = this.gameState.player.deck.length;
        if (opponentDeckCount) opponentDeckCount.textContent = this.gameState.opponent.deck.length;
    }
    
    renderHands() {
        // Mano del jugador
        const playerHandEl = document.getElementById('playerHand');
        playerHandEl.innerHTML = '';
        this.gameState.player.hand.forEach(card => {
            playerHandEl.appendChild(this.createCardElement(card, 'player', 'hand'));
        });
        
        // Mano del oponente (boca abajo)
        const opponentHandEl = document.getElementById('opponentHand');
        opponentHandEl.innerHTML = '';
        this.gameState.opponent.hand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card face-down';
            opponentHandEl.appendChild(cardEl);
        });
    }
    
    renderFields() {
        // Campo del jugador - limpiar slots y agregar cartas
        const playerFieldEl = document.getElementById('playerField');
        const playerSlots = playerFieldEl.querySelectorAll('.card-slot');
        
        // Limpiar slots y agregar cartas
        playerSlots.forEach((slot, index) => {
            slot.innerHTML = '';
            if (this.gameState.player.field[index]) {
                const card = this.gameState.player.field[index];
                const cardEl = this.createCardElement(card, 'player', 'field');
                slot.appendChild(cardEl);
            }
        });
        
        // Campo del oponente - limpiar slots y agregar cartas
        const opponentFieldEl = document.getElementById('opponentField');
        const opponentSlots = opponentFieldEl.querySelectorAll('.card-slot');
        
        opponentSlots.forEach((slot, index) => {
            slot.innerHTML = '';
            if (this.gameState.opponent.field[index]) {
                const card = this.gameState.opponent.field[index];
                const cardEl = this.createCardElement(card, 'opponent', 'field');
                slot.appendChild(cardEl);
            }
        });
    }
    
    renderTurnIndicator() {
        const indicator = document.getElementById('turnIndicator');
        if (this.gameState.turn === 'player') {
            indicator.innerHTML = '<i class="fas fa-hourglass-half"></i> Tu Turno';
            indicator.style.borderColor = 'var(--player-blue)';
        } else {
            indicator.innerHTML = '<i class="fas fa-hourglass-half"></i> Turno del Oponente';
            indicator.style.borderColor = 'var(--opponent-red)';
        }
    }
    
    createCardElement(card, owner, zone) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.type} ${owner === 'opponent' ? 'enemy-card' : ''}`;
        cardEl.dataset.instanceId = card.instanceId;
        
        if (zone === 'field' && card.canAttack && !card.isFrozen) {
            cardEl.classList.add('can-attack');
        }
        
        // Coste
        const costEl = document.createElement('div');
        costEl.className = 'card-cost';
        costEl.textContent = card.cost;
        cardEl.appendChild(costEl);
        
        // Imagen real de la carta
        const imgEl = document.createElement('img');
        imgEl.className = 'card-image';
        imgEl.src = card.image || 'assets/images/cards/placeholder.jpg';
        imgEl.alt = card.name;
        // Si la imagen no carga, usar degradado como fallback
        imgEl.onerror = function() {
            this.style.display = 'none';
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'card-image';
            fallbackDiv.style.background = `linear-gradient(135deg, ${card.type === 'character' ? '#667eea' : '#9c27b0'} 0%, ${card.type === 'character' ? '#764ba2' : '#7b1fa2'} 100%)`;
            this.parentNode.insertBefore(fallbackDiv, this);
        };
        cardEl.appendChild(imgEl);
        
        // Nombre
        const nameEl = document.createElement('div');
        nameEl.className = 'card-name';
        nameEl.textContent = card.name;
        cardEl.appendChild(nameEl);
        
        // Stats (solo personajes)
        if (card.type === 'character') {
            const statsEl = document.createElement('div');
            statsEl.className = 'card-stats';
            statsEl.innerHTML = `
                <span class="card-attack">⚔️ ${card.currentAttack}</span>
                <span class="card-hp">❤️ ${card.currentHp}</span>
            `;
            cardEl.appendChild(statsEl);
        }
        
        // Indicador de congelado
        if (card.isFrozen) {
            const frozenEl = document.createElement('div');
            frozenEl.className = 'card-frozen';
            frozenEl.textContent = '❄️';
            cardEl.appendChild(frozenEl);
        }
        
        // Event listeners
        if (owner === 'player' && zone === 'hand' && this.gameState.turn === 'player') {
            cardEl.addEventListener('click', () => this.handleCardClick(card, 'hand'));
        } else if (zone === 'field') {
            cardEl.addEventListener('click', () => this.handleCardClick(card, 'field', owner));
        }
        
        return cardEl;
    }
    
    getCardColor(card, dark = false) {
        const colors = {
            character: dark ? '#764ba2' : '#667eea',
            spell: dark ? '#7b1fa2' : '#9c27b0'
        };
        return colors[card.type] || '#667eea';
    }
    
    handleCardClick(card, zone, owner) {
        // Si es turno del oponente, no hacer nada
        if (this.gameState.turn !== 'player') return;
        
        // Si clickeamos carta en mano, intentar jugarla
        if (zone === 'hand') {
            this.playCard(card, 'player');
            this.render();
        }
        // Si clickeamos carta en campo
        else if (zone === 'field') {
            // Si es nuestra carta, seleccionarla para atacar
            if (owner === 'player') {
                if (this.gameState.selectedCard === card) {
                    this.gameState.selectedCard = null;
                } else {
                    this.gameState.selectedCard = card;
                    this.addLog(`${card.name} seleccionado. Haz click en un objetivo.`);
                }
            }
            // Si es carta enemiga y tenemos una seleccionada, atacar
            else if (owner === 'opponent' && this.gameState.selectedCard) {
                this.attackWithCard(this.gameState.selectedCard, card, 'player');
                this.gameState.selectedCard = null;
                this.render();
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('endTurnBtn').addEventListener('click', () => {
            if (this.gameState.turn === 'player' && !this.gameState.gameOver) {
                this.endTurn();
            }
        });
        
        document.getElementById('closeDetailBtn').addEventListener('click', () => {
            document.getElementById('cardDetailPanel').style.display = 'none';
        });
        
        // Ataque directo al oponente clickeando su HUD
        const opponentHud = document.querySelector('.opponent-hud');
        if (opponentHud) {
            opponentHud.addEventListener('click', () => {
                if (this.gameState.turn === 'player' && 
                    this.gameState.selectedCard && 
                    this.gameState.opponent.field.length === 0) {
                    this.attackPlayer(this.gameState.selectedCard, 'player');
                    this.gameState.selectedCard = null;
                    this.render();
                }
            });
            
            // Visual feedback cuando se puede atacar
            opponentHud.style.cursor = 'pointer';
        }

        // Toggle log en móvil
        const logSidebar = document.querySelector('.game-log-sidebar');
        if (logSidebar) {
            logSidebar.addEventListener('click', (e) => {
                // Solo toggle si estamos en móvil y no es un click en el contenido del log
                if (window.innerWidth <= 768 && window.matchMedia('(orientation: landscape)').matches) {
                    if (e.target === logSidebar || e.target.tagName === 'H3') {
                        logSidebar.classList.toggle('expanded');
                    }
                }
            });
        }
    }
    
    addLog(message) {
        const logEl = document.getElementById('gameLog');
        const p = document.createElement('p');
        
        // Agregar icono según el tipo de mensaje
        let icon = '<i class="fas fa-circle-info"></i>';
        if (message.includes('ataca') || message.includes('daño')) {
            icon = '<i class="fas fa-burst"></i>';
        } else if (message.includes('roba')) {
            icon = '<i class="fas fa-hand-holding-heart"></i>';
        } else if (message.includes('juega')) {
            icon = '<i class="fas fa-play"></i>';
        } else if (message.includes('gana')) {
            icon = '<i class="fas fa-trophy"></i>';
        }
        
        p.innerHTML = icon + ' ' + message;
        logEl.appendChild(p);
        logEl.scrollTop = logEl.scrollHeight;
        
        // Limitar el log a 50 mensajes
        while (logEl.children.length > 50) {
            logEl.removeChild(logEl.firstChild);
        }
    }
}

// Iniciar juego cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    new CardGame();
});

export class BattleSystem {
    constructor(playerData, enemyData, callbacks) {
        this.player = {
            name: playerData.name,
            health: playerData.max_health,
            maxHealth: playerData.max_health,
            attackMin: playerData.attack_min,
            attackMax: playerData.attack_max
        };
        this.enemy = {
            name: enemyData.name,
            health: enemyData.max_health,
            maxHealth: enemyData.max_health,
            attackMin: enemyData.attack_min,
            attackMax: enemyData.attack_max
        };
        this.turn = 'player';
        this.callbacks = callbacks;
    }

    // Utilidad para daño aleatorio
    randomDamage(attacker) {
        const { attackMin, attackMax } = attacker;
        return Math.floor(Math.random() * (attackMax - attackMin + 1)) + attackMin;
    }

    playerAttack() {
        if (this.turn !== 'player') return;
        const dmg = this.randomDamage(this.player);
        this.enemy.health = Math.max(0, this.enemy.health - dmg);
        this.callbacks.onAttack({ source: 'player', damage: dmg });
        this.checkOutcome();
        if (this.enemy.health > 0) {
            this.turn = 'enemy';
            setTimeout(() => this.enemyAttack(), 800);
        }
    }

    enemyAttack() {
        if (this.turn !== 'enemy') return;
        const dmg = this.randomDamage(this.enemy);
        this.player.health = Math.max(0, this.player.health - dmg);
        this.callbacks.onAttack({ source: 'enemy', damage: dmg });
        this.checkOutcome();
        if (this.player.health > 0) {
            this.turn = 'player';
        }
    }

    checkOutcome() {
        if (this.enemy.health <= 0) {
            this.callbacks.onEnd('victory');
        } else if (this.player.health <= 0) {
            this.callbacks.onEnd('defeat');
        }
    }

    getState() {
        return {
            playerHealth: this.player.health,
            playerMax: this.player.maxHealth,
            enemyHealth: this.enemy.health,
            enemyMax: this.enemy.maxHealth
        };
    }
} 
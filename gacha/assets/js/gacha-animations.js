/* ====================================
   SISTEMA DE ANIMACIONES GACHA AVANZADO
   Inspirado en Genshin Impact Wish Simulator
   Einherjer Blitz 3.0
   ==================================== */

class GachaAnimationSystem {
    constructor() {
        this.isAnimating = false;
        this.particles = [];
        this.soundEnabled = true;
        this.init();
    }

    init() {
        this.createAnimationCanvas();
        this.bindEvents();
    }

    createAnimationCanvas() {
        // Crear canvas para efectos de partículas
        if (!document.getElementById('gacha-canvas')) {
            const canvas = document.createElement('canvas');
            canvas.id = 'gacha-canvas';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9998';
            canvas.style.display = 'none';
            document.body.appendChild(canvas);

            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.resizeCanvas();
        }
    }

    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    // Animación principal del wish
    async playWishAnimation(chestType, isMultiple = false) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        try {
            // 1. Preparar la pantalla
            await this.prepareWishScreen(chestType);
            
            // 2. Mostrar animación de apertura
            await this.showOpeningAnimation(chestType);
            
            // 3. Efectos de partículas
            await this.playParticleEffects(chestType);
            
            // 4. Transición a resultados
            await this.transitionToResults();
            
        } catch (error) {
            console.error('Error en animación de wish:', error);
        } finally {
            this.isAnimating = false;
        }
    }

    async prepareWishScreen(chestType) {
        return new Promise(resolve => {
            // Crear overlay de animación
            const overlay = document.createElement('div');
            overlay.id = 'wish-animation-overlay';
            overlay.className = 'wish-animation-overlay';
            overlay.innerHTML = `
                <div class="wish-animation-container">
                    <div class="chest-opening-animation ${chestType}">
                        <div class="chest-glow"></div>
                        <div class="chest-icon">
                            <i class="${this.getChestIcon(chestType)}"></i>
                        </div>
                        <div class="opening-text">
                            <h2>Abriendo ${this.getChestName(chestType)}</h2>
                            <div class="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                    <div class="skip-button" onclick="GachaAnimations.skipAnimation()">
                        <i class="fas fa-forward"></i> Saltar
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Trigger animation
            setTimeout(() => {
                overlay.classList.add('active');
                resolve();
            }, 100);
        });
    }

    async showOpeningAnimation(chestType) {
        return new Promise(resolve => {
            const container = document.querySelector('.chest-opening-animation');
            
            // Secuencia de animaciones
            setTimeout(() => {
                container.classList.add('shaking');
            }, 500);

            setTimeout(() => {
                container.classList.add('glowing');
                this.startParticleSystem();
            }, 1500);

            setTimeout(() => {
                container.classList.add('exploding');
            }, 2500);

            setTimeout(resolve, 3500);
        });
    }

    startParticleSystem() {
        this.canvas.style.display = 'block';
        this.particles = [];
        
        // Crear partículas iniciales
        for (let i = 0; i < 50; i++) {
            this.particles.push(this.createParticle());
        }
        
        this.animateParticles();
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 4 + 1,
            color: this.getRandomParticleColor(),
            life: 1.0,
            decay: Math.random() * 0.02 + 0.01
        };
    }

    getRandomParticleColor() {
        const colors = [
            '#FFD700', // Gold
            '#FFA500', // Orange
            '#FF69B4', // Pink
            '#87CEEB', // Sky Blue
            '#DDA0DD', // Plum
            '#F0E68C'  // Khaki
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    animateParticles() {
        if (!this.isAnimating) {
            this.canvas.style.display = 'none';
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Actualizar y dibujar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Actualizar posición
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            
            // Remover partículas muertas
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Dibujar partícula
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // Agregar nuevas partículas ocasionalmente
        if (Math.random() < 0.1) {
            this.particles.push(this.createParticle());
        }
        
        requestAnimationFrame(() => this.animateParticles());
    }

    async playParticleEffects(chestType) {
        return new Promise(resolve => {
            // Intensificar efectos de partículas
            for (let i = 0; i < 30; i++) {
                setTimeout(() => {
                    this.particles.push(this.createParticle());
                }, i * 50);
            }
            
            setTimeout(resolve, 1500);
        });
    }

    async transitionToResults() {
        return new Promise(resolve => {
            const overlay = document.getElementById('wish-animation-overlay');
            
            overlay.classList.add('fade-out');
            
            setTimeout(() => {
                if (overlay) {
                    overlay.remove();
                }
                this.canvas.style.display = 'none';
                resolve();
            }, 500);
        });
    }

    // Crear el sistema de resultados elaborado
    createElaborateResultsScreen(rewardData, chestType) {
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'elaborate-results-screen';
        resultsContainer.className = 'elaborate-results-screen';
        
        resultsContainer.innerHTML = `
            <div class="results-background">
                <div class="results-particles"></div>
                <div class="results-content">
                    <div class="results-header">
                        <h1>¡Recompensa Obtenida!</h1>
                        <div class="chest-type-badge ${chestType}">
                            ${this.getChestName(chestType)}
                        </div>
                    </div>
                    
                    <div class="reward-showcase">
                        <div class="reward-card ${rewardData.rarity}" data-rarity="${rewardData.rarity}">
                            <div class="card-glow"></div>
                            <div class="card-background"></div>
                            <div class="card-content">
                                <div class="reward-icon ${rewardData.type}">
                                    <i class="${this.getRewardIcon(rewardData.type)}"></i>
                                </div>
                                <div class="reward-info">
                                    <div class="reward-name">${rewardData.name}</div>
                                    <div class="reward-type">${this.getTypeDisplayName(rewardData.type)}</div>
                                    <div class="reward-rarity ${rewardData.rarity}">
                                        ${this.getRarityStars(rewardData.rarity)}
                                        <span>${this.getRarityName(rewardData.rarity)}</span>
                                    </div>
                                </div>
                                <div class="reward-new-badge ${rewardData.isNew ? 'show' : ''}">
                                    ¡NUEVO!
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="results-actions">
                        <button class="btn-results btn-again" onclick="GachaAnimations.openAnotherChest('${chestType}')">
                            <i class="fas fa-redo"></i>
                            Abrir Otro
                        </button>
                        <button class="btn-results btn-close" onclick="GachaAnimations.closeResults()">
                            <i class="fas fa-times"></i>
                            Cerrar
                        </button>
                        <button class="btn-results btn-history" onclick="GachaAnimations.viewHistory()">
                            <i class="fas fa-history"></i>
                            Historial
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(resultsContainer);
        
        // Trigger entrada
        setTimeout(() => {
            resultsContainer.classList.add('active');
            this.animateRewardCard();
        }, 100);
        
        return resultsContainer;
    }

    animateRewardCard() {
        const card = document.querySelector('.reward-card');
        if (!card) return;
        
        // Secuencia de animación de la carta
        setTimeout(() => card.classList.add('revealed'), 200);
        setTimeout(() => card.classList.add('floating'), 800);
        
        // Efecto de rareza especial para items legendarios+
        const rarity = card.dataset.rarity;
        if (rarity === 'legendary' || rarity === 'mythical') {
            setTimeout(() => {
                card.classList.add('legendary-effect');
                this.createRarityBurst(rarity);
            }, 1200);
        }
    }

    createRarityBurst(rarity) {
        const burst = document.createElement('div');
        burst.className = `rarity-burst ${rarity}`;
        burst.innerHTML = `
            <div class="burst-rays"></div>
            <div class="burst-sparkles"></div>
        `;
        
        document.querySelector('.reward-showcase').appendChild(burst);
        
        setTimeout(() => burst.remove(), 3000);
    }

    // Métodos de utilidad
    getChestIcon(chestType) {
        const icons = {
            'terrains': 'fas fa-mountain',
            'comics': 'fas fa-mask'
        };
        return icons[chestType] || 'fas fa-gift';
    }

    getChestName(chestType) {
        const names = {
            'terrains': 'Cofre de Terrenos',
            'comics': 'Comics que Inspiran'
        };
        return names[chestType] || 'Cofre Misterioso';
    }

    getRewardIcon(type) {
        const icons = {
            'invocation': 'fas fa-user',
            'weapon': 'fas fa-sword',
            'artifact': 'fas fa-gem',
            'terrain': 'fas fa-mountain',
            'special': 'fas fa-star',
            'resource': 'fas fa-cube'
        };
        return icons[type] || 'fas fa-gift';
    }

    getTypeDisplayName(type) {
        const names = {
            'invocation': 'Invocación',
            'weapon': 'Arma',
            'artifact': 'Artefacto',
            'terrain': 'Terreno',
            'special': 'Especial',
            'resource': 'Recurso'
        };
        return names[type] || 'Objeto';
    }

    getRarityStars(rarity) {
        const starCounts = {
            'common': 1,
            'rare': 2,
            'epic': 3,
            'legendary': 4,
            'mythical': 5
        };
        const count = starCounts[rarity] || 1;
        return '★'.repeat(count);
    }

    getRarityName(rarity) {
        const names = {
            'common': 'Común',
            'rare': 'Raro',
            'epic': 'Épico',
            'legendary': 'Legendario',
            'mythical': 'Mítico'
        };
        return names[rarity] || 'Común';
    }

    // Métodos de control
    skipAnimation() {
        this.isAnimating = false;
        const overlay = document.getElementById('wish-animation-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.canvas.style.display = 'none';
    }

    openAnotherChest(chestType) {
        this.closeResults();
        // Volver a abrir el mismo tipo de cofre
        if (window.openChest) {
            const cost = this.getChestCost(chestType);
            window.openChest(chestType, cost);
        }
    }

    getChestCost(chestType) {
        const costs = {
            'terrains': 25,
            'comics': 5
        };
        return costs[chestType] || 1;
    }

    viewHistory() {
        this.closeResults();
        // Scroll al historial
        const historySection = document.querySelector('.recent-history');
        if (historySection) {
            historySection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    closeResults() {
        const resultsScreen = document.getElementById('elaborate-results-screen');
        if (resultsScreen) {
            resultsScreen.classList.add('closing');
            setTimeout(() => resultsScreen.remove(), 500);
        }
    }
}

// Instancia global
window.GachaAnimations = new GachaAnimationSystem();

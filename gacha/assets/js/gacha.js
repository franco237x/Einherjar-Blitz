/**
 * GACHA SYSTEM - Einherjer Blitz 3.0
 * CS2 Roulette Style Animation
 */

// Mapeo de imágenes de recompensas
const REWARD_IMAGES = {
    // Elden Souls
    'Invocación: Godrick': 'assets/images/rewards/elden_souls/godrick.jpg',
    'Invocación: Radahn': 'assets/images/rewards/elden_souls/radahn.jpg',
    'Invocación: Radagon': 'assets/images/rewards/elden_souls/radagon.jpg',
    'Invocación: Maliketh': 'assets/images/rewards/elden_souls/maliketh.jpg',
    'Invocación: Malenia': 'assets/images/rewards/elden_souls/malenia.jpg',
    'Arma: Cetro del Devorador': 'assets/images/rewards/elden_souls/cetro_devorador.jpeg',
    'Arma: Espada magna de la hoja injertada': 'assets/images/rewards/elden_souls/espada_injertada.jpeg',
    'Arma: Espada Magna de la Orden Dorada': 'assets/images/rewards/elden_souls/orden_dorada.jpg',
    'Invocación: Ornstein y Smough': 'assets/images/rewards/elden_souls/ornstein_smough.jpg',
    'Invocación: Gwyn': 'assets/images/rewards/elden_souls/gwyn.jpeg',
    'Invocación: Artorias': 'assets/images/rewards/elden_souls/artorias.jpg',
    'Invocación: Rey sin Nombre': 'assets/images/rewards/elden_souls/rey_sin_nombre.jpg',
    'Invocación: Alma de Cenizas': 'assets/images/rewards/elden_souls/alma_cenizas.jpg',
    'Arma: Espadón de Artorias': 'assets/images/rewards/elden_souls/espadon_artorias.jpeg',
    'Arma: Arco Luna Oscura': 'assets/images/rewards/elden_souls/arco_luna_oscura.jpg',
    'Poder: Primera Llama': 'assets/images/rewards/elden_souls/primera_llama.jpg',

    // Terrains
    'Hipódromo Valhalla (Uma Musume)': 'assets/images/rewards/terrains/hipodromo_valhalla.jpg',
    'Krypton (DC Comics)': 'assets/images/rewards/terrains/krypton.jpg',
    'Chaldea (Fate)': 'assets/images/rewards/terrains/chaldea.jpg',
    'Skypeia (One Piece)': 'assets/images/rewards/terrains/skypeia.jpg',
    'Academia de Héroes (Boku No Hero)': 'assets/images/rewards/terrains/academia_heroes.jpg',
    'Negocio Devil May Cry (DMC)': 'assets/images/rewards/terrains/negocio_dmc.jpg',
    'Atlantis (DC Comics)': 'assets/images/rewards/terrains/atlantis.jpg',
    'Torre de los Vengadores (Marvel)': 'assets/images/rewards/terrains/torre_vengadores.jpg',
    'Fundación SCP': 'assets/images/rewards/terrains/fundacion_scp.jpg',
    'Extensión de Terreno': 'assets/images/rewards/terrains/extension_terreno.jpg',
    'Dad Key': 'assets/images/rewards/terrains/dad_key.jpg',
    'Hallownest (Hollow Knight)': 'assets/images/rewards/terrains/hallownest.jpg',
    'Apokolips (DC Comics)': 'assets/images/rewards/terrains/apokolips.jpg'
};

// Lista de items para la ruleta por tipo de cofre
const CHEST_ITEMS = {
    elden_souls: [
        'Invocación: Godrick', 'Invocación: Radahn', 'Invocación: Radagon',
        'Invocación: Maliketh', 'Invocación: Malenia', 'Arma: Cetro del Devorador',
        'Arma: Espada magna de la hoja injertada', 'Arma: Espada Magna de la Orden Dorada',
        'Invocación: Ornstein y Smough', 'Invocación: Gwyn', 'Invocación: Artorias',
        'Invocación: Rey sin Nombre', 'Invocación: Alma de Cenizas',
        'Arma: Espadón de Artorias', 'Arma: Arco Luna Oscura', 'Poder: Primera Llama'
    ],
    terrains: [
        'Hipódromo Valhalla (Uma Musume)', 'Krypton (DC Comics)', 'Chaldea (Fate)',
        'Skypeia (One Piece)', 'Academia de Héroes (Boku No Hero)', 'Negocio Devil May Cry (DMC)',
        'Atlantis (DC Comics)', 'Torre de los Vengadores (Marvel)', 'Fundación SCP',
        'Extensión de Terreno', 'Dad Key', 'Hallownest (Hollow Knight)', 'Apokolips (DC Comics)'
    ]
};

class GachaSystem {
    constructor() {
        this.overlay = null;
        this.container = null;
        this.isOpening = false;
        this.history = [];
        this.preloadedImages = new Set();
        this.init();
    }

    init() {
        this.overlay = document.getElementById('gachaOverlay');
        this.container = document.getElementById('animationContainer');

        // Preload reward images
        this.preloadImages();

        // Load history from DB (passed via window.userData)
        if (window.userData && Array.isArray(window.userData.history)) {
            // Map DB format to UI format
            this.history = window.userData.history.map(item => ({
                name: item.recompensa_obtenida,
                type: item.tipo_recompensa,
                rarity: 'common',
                image: this.getRewardImage(item.recompensa_obtenida),
                chest: 'unknown',
                time: item.fecha_obtencion ? new Date(item.fecha_obtencion).toLocaleString() : ''
            }));
        } else {
            this.history = [];
        }

        this.renderHistory();
    }

    // Preload all reward images for smooth roulette
    preloadImages() {
        Object.values(REWARD_IMAGES).forEach(src => {
            if (!this.preloadedImages.has(src)) {
                const img = new Image();
                img.src = src;
                this.preloadedImages.add(src);
            }
        });
    }

    getRewardImage(name) {
        return REWARD_IMAGES[name] || 'assets/images/rewards/default.jpg';
    }

    async openChest(type, cost) {
        if (this.isOpening) return;

        if (window.userData.keys < cost) {
            this.showErrorModal('Llaves Insuficientes', `Necesitas ${cost} llaves para abrir este cofre.<br>Actualmente tienes <strong>${window.userData.keys}</strong> llaves.`);
            return;
        }

        this.isOpening = true;

        try {
            const response = await fetch('process_gacha.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chest_type: type })
            });

            const data = await response.json();

            if (data.success) {
                window.userData.keys = data.remaining_keys;
                this.updateKeysDisplay();

                // Start CS2 roulette animation
                this.showRouletteAnimation(type, data.reward);
                this.addToHistory(data.reward, type);
            } else {
                this.showErrorModal('Error', data.message || 'Error al abrir el cofre');
            }
        } catch (error) {
            console.error('Gacha error:', error);
            this.showErrorModal('Error de Conexión', 'No se pudo conectar con el servidor. Intenta nuevamente.');
        }

        this.isOpening = false;
    }

    showRouletteAnimation(chestType, winnerReward) {
        const items = CHEST_ITEMS[chestType] || CHEST_ITEMS.elden_souls;

        // Build roulette strip (repeat items many times)
        let stripItems = [];
        for (let i = 0; i < 8; i++) {
            stripItems = stripItems.concat(this.shuffleArray([...items]));
        }

        // Insert winner at position (will be scrolled to)
        const winnerPosition = Math.floor(stripItems.length * 0.7);
        stripItems[winnerPosition] = winnerReward.name;

        // Create HTML
        this.container.innerHTML = `
            <div class="roulette-container">
                <h2 class="roulette-title">
                    <i class="fas fa-dice me-2"></i>
                    Abriendo Cofre...
                </h2>
                
                <div class="roulette-wrapper">
                    <div class="roulette-pointer"></div>
                    <div class="roulette-strip" id="rouletteStrip">
                        ${stripItems.map((item, index) => `
                            <div class="roulette-item" data-index="${index}" data-name="${item}">
                                <img src="${this.getRewardImage(item)}" alt="${item}" onerror="this.src='assets/images/rewards/default.jpg'">
                                <span class="item-name">${item.split(':').pop().trim()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.overlay.classList.add('active');

        // Start animation
        const strip = document.getElementById('rouletteStrip');

        // Get actual item width from the first item rendered
        // This handles both desktop (200px) and mobile (140px) automatically
        const firstItem = strip.querySelector('.roulette-item');
        const itemWidth = firstItem ? firstItem.offsetWidth : 200;

        // Calculate dynamic center based on actual container width
        const containerWidth = document.querySelector('.roulette-wrapper').clientWidth;
        const containerCenter = containerWidth / 2;

        // Calculate target offset to center the winner item
        // Position of winner center = (winnerIndex * itemWidth) + (itemWidth / 2)
        // We want that position to be at containerCenter
        // transformX = -(ItemCenterPosition - ContainerCenter)
        const itemCenterPos = (winnerPosition * itemWidth) + (itemWidth / 2);
        const targetOffset = itemCenterPos - containerCenter;

        // GSAP animation with easing slowdown
        gsap.fromTo(strip,
            { x: 0 },
            {
                x: -targetOffset,
                duration: 5,
                ease: "power2.out",
                onComplete: () => {
                    // Mark winner
                    const winnerEl = strip.querySelector(`[data-index="${winnerPosition}"]`);
                    if (winnerEl) winnerEl.classList.add('winner');

                    // Show reward after delay
                    setTimeout(() => {
                        this.showRewardResult(winnerReward);
                    }, 1000);
                }
            }
        );

        // Play tick sound simulation with color flash
        let currentPos = 0;
        const tickInterval = setInterval(() => {
            currentPos += 10;
            if (currentPos >= targetOffset) {
                clearInterval(tickInterval);
            }
        }, 50);
    }

    showRewardResult(reward) {
        const name = reward?.name || 'Recompensa';
        const type = reward?.type || 'item';
        const value = reward?.value || 1;
        const rarity = reward?.rarity || 'common';
        const imageUrl = this.getRewardImage(name);

        const rarityClass = this.getRarityClass(rarity);
        const rarityLabel = this.getRarityLabel(rarity);

        this.container.innerHTML = `
            <div class="reward-display ${rarityClass}">
                <img src="${imageUrl}" alt="${name}" class="reward-image" onerror="this.src='assets/images/rewards/default.jpg'">
                <h2 class="reward-title">¡Felicidades!</h2>
                <p class="reward-name">${name}</p>
                <p class="reward-type">${type} x${value}</p>
                <span class="rarity-badge">${rarityLabel}</span>
                <div>
                    <button class="btn-continue" onclick="gacha.hideOverlay()">
                        <i class="fas fa-check me-2"></i>Continuar
                    </button>
                </div>
            </div>
        `;

        // Spawn rarity particles
        this.spawnRarityParticles(rarity);

        // GSAP reveal
        gsap.from('.reward-display > *', {
            opacity: 0,
            y: 30,
            stagger: 0.1,
            duration: 0.5,
            ease: 'power2.out'
        });
    }

    // Spawn particles based on rarity
    spawnRarityParticles(rarity) {
        const particleContainer = document.createElement('div');
        particleContainer.className = `rarity-particles ${this.getRarityClass(rarity)}`;
        document.body.appendChild(particleContainer);

        const particleCounts = {
            common: 15,
            rare: 25,
            epic: 40,
            legendary: 60,
            mythical: 80
        };

        const count = particleCounts[rarity] || 15;

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'rarity-particle';

                // Random position
                const x = Math.random() * window.innerWidth;
                const y = (window.innerHeight / 2) + (Math.random() * 200 - 100);

                // Random size based on rarity
                const baseSize = rarity === 'mythical' ? 12 : rarity === 'legendary' ? 10 : 6;
                const size = baseSize + Math.random() * baseSize;

                particle.style.cssText = `
                    left: ${x}px;
                    top: ${y}px;
                    width: ${size}px;
                    height: ${size}px;
                    animation-delay: ${Math.random() * 0.5}s;
                `;

                // Add confetti class for legendary
                if (rarity === 'legendary' && Math.random() > 0.5) {
                    particle.classList.add('confetti');
                    particle.style.background = `hsl(${Math.random() * 60 + 30}, 100%, 60%)`;
                }

                particleContainer.appendChild(particle);

                // Remove particle after animation
                setTimeout(() => particle.remove(), 3000);
            }, i * 30);
        }

        // Clean up container after all particles done
        setTimeout(() => particleContainer.remove(), 5000);
    }

    showErrorModal(title, message) {
        this.container.innerHTML = `
            <div class="reward-display">
                <div class="reward-icon-wrap" style="color: #ef4444; font-size: 4rem; margin-bottom: 1rem;">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h2 class="reward-title" style="color: #ef4444;">${title}</h2>
                <p class="reward-type" style="color: #ccc; font-size: 1.1rem;">${message}</p>
                <div>
                    <button class="btn-continue" onclick="gacha.hideOverlay()" style="background: linear-gradient(135deg, #ef4444, #b91c1c); margin-top: 1rem;">
                        <i class="fas fa-times me-2"></i>Cerrar
                    </button>
                </div>
            </div>
        `;

        this.overlay.classList.add('active');

        gsap.from('.reward-display > *', {
            opacity: 0,
            y: 20,
            stagger: 0.1,
            duration: 0.4,
            ease: 'power2.out'
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    hideOverlay() {
        gsap.to(this.overlay, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                this.overlay.classList.remove('active');
                gsap.set(this.overlay, { opacity: 1 });
            }
        });
    }

    getRarityClass(rarity) {
        const map = {
            'common': 'rarity-common',
            'rare': 'rarity-rare',
            'epic': 'rarity-epic',
            'legendary': 'rarity-legendary',
            'mythical': 'rarity-mythical'
        };
        return map[rarity] || 'rarity-common';
    }

    getRarityLabel(rarity) {
        const map = {
            'common': 'Común',
            'rare': 'Raro',
            'epic': 'Épico',
            'legendary': 'Legendario',
            'mythical': 'Mítico'
        };
        return map[rarity] || 'Común';
    }

    updateKeysDisplay() {
        const keysEl = document.getElementById('keysCount');
        if (keysEl) {
            gsap.to(keysEl, {
                innerText: window.userData.keys,
                duration: 0.5,
                snap: { innerText: 1 }
            });
        }
    }

    addToHistory(reward, chestType) {
        const item = {
            name: reward?.name || 'Recompensa',
            type: reward?.type || 'item',
            rarity: reward?.rarity || 'common',
            image: this.getRewardImage(reward?.name),
            chest: chestType,
            time: new Date().toLocaleTimeString()
        };

        this.history.unshift(item);
        if (this.history.length > 5) this.history.pop();
        this.renderHistory();
    }

    renderHistory() {
        const container = document.getElementById('historyList');
        if (!container) return;

        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-box-open"></i>
                    <p>No has abierto cofres recientemente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.history.map(item => `
            <div class="history-item">
                <img src="${item.image || 'assets/images/rewards/default.jpg'}" alt="${item.name}" onerror="this.src='assets/images/rewards/default.jpg'">
                <div class="info">
                    <div class="name">${item.name || 'Recompensa'}</div>
                    <div class="time">${item.time || ''}</div>
                </div>
            </div>
        `).join('');
    }
}

// Initialize
let gacha;
document.addEventListener('DOMContentLoaded', () => {
    gacha = new GachaSystem();
});

function openChest(type, cost) {
    gacha.openChest(type, cost);
}

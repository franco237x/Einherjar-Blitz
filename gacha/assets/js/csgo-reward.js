/**
 * ============================================
 * CS:GO DROPBOX STYLE REWARD SYSTEM
 * Mobile-First with GSAP & Professional Libraries
 * Einherjar Blitz 3.0
 * ============================================
 */

class CSGORewardSystem {
    constructor(reward, chestType) {
        this.reward = reward;
        this.chestType = chestType;
        this.itemWidth = window.innerWidth < 400 ? 85 : (window.innerWidth < 768 ? 100 : 118);
        this.totalItems = 50;
        this.winnerPosition = Math.floor(Math.random() * 10) + 35;
        this.isRolling = false;
        this.confettiCanvas = null;
        this.myConfetti = null;

        // Para efectos de sonido con pitch ascendente
        this.tickCount = 0;
        this.basePitch = 400;
        this.maxPitch = 1200;

        // Elementos DOM
        this.elements = {
            loading: document.getElementById('loadingScreen'),
            strip: document.getElementById('rouletteStrip'),
            viewport: document.getElementById('rouletteViewport'),
            container: document.getElementById('rouletteContainer'),
            winnerPanel: document.getElementById('winnerPanel'),
            winnerImage: document.getElementById('winnerImage'),
            winnerGlow: document.getElementById('winnerGlow'),
            winnerStars: document.getElementById('winnerStars'),
            winnerType: document.getElementById('winnerType'),
            winnerName: document.getElementById('winnerName'),
            winnerRarity: document.getElementById('winnerRarity'),
            btnContinue: document.getElementById('btnContinue'),
            btnOpenAnother: document.getElementById('btnOpenAnother'),
            mobileHint: document.getElementById('mobileHint'),
            confettiCanvas: document.getElementById('confettiCanvas')
        };

        // Pool de items por rareza
        this.itemPools = this.getItemPoolsForChest();

        this.initConfetti();
        this.initAudio();
        this.setupEventListeners();
        this.createBackgroundParticles();
        this.updateItemWidth();
    }

    updateItemWidth() {
        // Actualizar ancho de items según el viewport
        const width = window.innerWidth;
        if (width < 400) {
            this.itemWidth = 85 + 6; // width + gap
        } else if (width < 768) {
            this.itemWidth = 100 + 8;
        } else {
            this.itemWidth = 110 + 8;
        }
    }

    getItemPoolsForChest() {
        const pools = {
            terrains: {
                common: [
                    { name: 'Hipódromo Valhalla', image: 'assets/images/rewards/terrains/hipodromo_valhalla.jpg' },
                    { name: 'Negocio DMC', image: 'assets/images/rewards/terrains/negocio_dmc.jpg' }
                ],
                rare: [
                    { name: 'Chaldea', image: 'assets/images/rewards/terrains/chaldea.jpg' },
                    { name: 'Skypeia', image: 'assets/images/rewards/terrains/skypeia.jpg' },
                    { name: 'Academia Héroes', image: 'assets/images/rewards/terrains/academia_heroes.jpg' }
                ],
                epic: [
                    { name: 'Torre Vengadores', image: 'assets/images/rewards/terrains/torre_vengadores.jpg' },
                    { name: 'Atlantis', image: 'assets/images/rewards/terrains/atlantis.jpg' },
                    { name: 'Krypton', image: 'assets/images/rewards/terrains/krypton.jpg' }
                ],
                legendary: [
                    { name: 'Apokolips', image: 'assets/images/rewards/terrains/apokolips.jpg' },
                    { name: 'Hallownest', image: 'assets/images/rewards/terrains/hallownest.jpg' },
                    { name: 'Fundación SCP', image: 'assets/images/rewards/terrains/fundacion_scp.jpg' }
                ],
                mythical: [
                    { name: 'Extensión Terreno', image: 'assets/images/rewards/terrains/extension_terreno.jpg' },
                    { name: 'Dad Key', image: 'assets/images/rewards/terrains/dad_key.jpg' }
                ]
            },
            elden_souls: {
                common: [
                    { name: 'Godrick', image: 'assets/images/rewards/elden_souls/godrick.jpg' },
                    { name: 'Radahn', image: 'assets/images/rewards/elden_souls/radahn.jpg' }
                ],
                rare: [
                    { name: 'Cetro Devorador', image: 'assets/images/rewards/elden_souls/cetro_devorador.jpeg' },
                    { name: 'Espada Injertada', image: 'assets/images/rewards/elden_souls/espada_injertada.jpeg' }
                ],
                epic: [
                    { name: 'Maliketh', image: 'assets/images/rewards/elden_souls/maliketh.jpg' },
                    { name: 'Radagon', image: 'assets/images/rewards/elden_souls/radagon.jpg' }
                ],
                legendary: [
                    { name: 'Malenia', image: 'assets/images/rewards/elden_souls/malenia.jpg' },
                    { name: 'Espadón Artorias', image: 'assets/images/rewards/elden_souls/espadon_artorias.jpeg' }
                ],
                mythical: [
                    { name: 'Primera Llama', image: 'assets/images/rewards/elden_souls/primera_llama.jpg' }
                ]
            }
        };

        return pools[this.chestType] || pools.terrains;
    }

    initConfetti() {
        // Inicializar canvas-confetti
        if (this.elements.confettiCanvas && typeof confetti !== 'undefined') {
            this.myConfetti = confetti.create(this.elements.confettiCanvas, {
                resize: true,
                useWorker: true
            });
        }
    }

    initAudio() {
        // Howler.js para audio (si está disponible)
        if (typeof Howl !== 'undefined') {
            this.sounds = {
                tick: new Howl({
                    src: ['data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'],
                    volume: 0.1,
                    pool: 5
                }),
                win: new Howl({
                    src: ['data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'],
                    volume: 0.3
                })
            };
        }

        // AudioContext se creará con el primer gesto del usuario
        this.audioContext = null;
        this.audioInitialized = false;
    }

    initAudioOnGesture() {
        if (this.audioInitialized) return;
        this.audioInitialized = true;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.audioContext = null;
        }
    }

    playTickSound(progress = 0) {
        // Inicializar audio con gesto del usuario
        this.initAudioOnGesture();

        if (!this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => { });
        }

        try {
            this.tickCount++;

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Pitch ascendente basado en el progreso (crea tensión)
            // Al inicio: 400Hz, al final: 1200Hz
            const pitchProgress = Math.min(progress * 1.5, 1); // Acelerar el ascenso
            const currentPitch = this.basePitch + (this.maxPitch - this.basePitch) * pitchProgress;
            const pitchVariation = (Math.random() - 0.5) * 50; // Pequeña variación

            oscillator.frequency.setValueAtTime(currentPitch + pitchVariation, this.audioContext.currentTime);

            // Volumen ligeramente más alto al final para más impacto
            const volume = 0.02 + (progress * 0.02);
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.04);

            oscillator.type = 'sine';
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.04);
        } catch (e) {
            // Silent fail
        }
    }

    playWinSound(rarity) {
        this.initAudioOnGesture();

        if (!this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => { });
        }

        try {
            const isLegendary = rarity === 'legendary' || rarity === 'mythical';
            const isEpic = rarity === 'epic';
            const ctx = this.audioContext;
            const now = ctx.currentTime;

            // Crear múltiples osciladores para un sonido más rico
            const playNote = (freq, startTime, duration, volume) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(freq, now + startTime);
                gain.gain.setValueAtTime(0, now + startTime);
                gain.gain.linearRampToValueAtTime(volume, now + startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + startTime + duration);
                osc.type = 'sine';
                osc.start(now + startTime);
                osc.stop(now + startTime + duration);
            };

            if (isLegendary) {
                // ¡FANFARRIA ÉPICA! Acordes ascendentes
                // Acorde 1
                playNote(523, 0, 0.3, 0.12);      // C5
                playNote(659, 0, 0.3, 0.10);      // E5
                playNote(784, 0, 0.3, 0.08);      // G5
                // Acorde 2 (ascendente)
                playNote(587, 0.15, 0.3, 0.12);   // D5
                playNote(740, 0.15, 0.3, 0.10);   // F#5
                playNote(880, 0.15, 0.3, 0.08);   // A5
                // Acorde final (triunfante)
                playNote(659, 0.3, 0.5, 0.15);    // E5
                playNote(784, 0.3, 0.5, 0.12);    // G5
                playNote(988, 0.3, 0.5, 0.10);    // B5
                playNote(1319, 0.35, 0.6, 0.08); // E6 (nota alta brillante)
            } else if (isEpic) {
                // Sonido épico pero menos que legendario
                playNote(440, 0, 0.25, 0.10);     // A4
                playNote(554, 0, 0.25, 0.08);     // C#5
                playNote(659, 0.12, 0.35, 0.12);  // E5
                playNote(880, 0.12, 0.35, 0.08);  // A5
            } else {
                // Sonido satisfactorio para raros y comunes
                playNote(523, 0, 0.2, 0.08);      // C5
                playNote(659, 0.08, 0.25, 0.10);  // E5
                playNote(784, 0.16, 0.3, 0.08);   // G5
            }
        } catch (e) {
            // Silent fail
        }
    }

    setupEventListeners() {
        this.elements.btnContinue.addEventListener('click', () => this.goBack());
        this.elements.btnOpenAnother.addEventListener('click', () => this.openAnother());

        // Resize listener para actualizar item width
        window.addEventListener('resize', () => {
            this.updateItemWidth();
        });

        // Touch para iniciar audio context en móviles
        document.addEventListener('touchstart', () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }, { once: true });
    }

    createBackgroundParticles() {
        const container = document.querySelector('.bg-particles');
        if (!container) return;

        const particleCount = window.innerWidth < 768 ? 10 : 20;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 8}s`;
            particle.style.animationDuration = `${6 + Math.random() * 4}s`;
            container.appendChild(particle);
        }
    }

    generateItemStrip() {
        const strip = this.elements.strip;
        strip.innerHTML = '';

        // Distribución base de rarezas
        const rarityDistribution = ['common', 'common', 'common', 'rare', 'rare', 'epic', 'legendary'];

        // Posiciones cercanas al ganador para near-miss (items tentadores)
        const nearMissPositions = [
            this.winnerPosition - 3,
            this.winnerPosition - 2,
            this.winnerPosition - 1,
            this.winnerPosition + 1,
            this.winnerPosition + 2
        ];

        for (let i = 0; i < this.totalItems; i++) {
            let itemData;
            let rarity;

            if (i === this.winnerPosition) {
                // El ganador real
                itemData = {
                    name: this.reward.name,
                    image: this.getWinnerImage()
                };
                rarity = this.reward.rarity || 'rare';
            } else if (nearMissPositions.includes(i)) {
                // Near-miss: poner items raros/épicos cerca del ganador
                // Esto crea la sensación de "casi gano algo mejor"
                const nearMissRarities = ['epic', 'legendary', 'rare', 'epic', 'rare'];
                const nearMissIndex = nearMissPositions.indexOf(i);
                rarity = nearMissRarities[nearMissIndex] || 'rare';

                const pool = this.itemPools[rarity] || this.itemPools.rare;
                if (pool && pool.length > 0) {
                    itemData = pool[Math.floor(Math.random() * pool.length)];
                } else {
                    itemData = { name: 'Item Raro', image: '' };
                }
            } else {
                // Item normal aleatorio
                rarity = rarityDistribution[Math.floor(Math.random() * rarityDistribution.length)];
                const pool = this.itemPools[rarity] || this.itemPools.common;
                if (pool && pool.length > 0) {
                    itemData = pool[Math.floor(Math.random() * pool.length)];
                } else {
                    itemData = { name: '???', image: '' };
                }
            }

            const item = this.createItemElement(itemData, rarity, i === this.winnerPosition);
            strip.appendChild(item);
        }
    }

    createItemElement(itemData, rarity, isWinner = false) {
        const item = document.createElement('div');
        item.className = `roulette-item ${rarity}${isWinner ? ' winner-item' : ''}`;
        item.dataset.isWinner = isWinner;

        const img = document.createElement('img');
        img.className = 'item-image';
        img.src = itemData.image || '';
        img.alt = itemData.name;
        img.loading = 'eager';
        img.onerror = function () {
            this.src = `data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <rect fill="#1a1a2e" width="100" height="100" rx="10"/>
                    <text x="50" y="55" text-anchor="middle" fill="#ffd700" font-size="30">?</text>
                </svg>
            `)}`;
        };

        const name = document.createElement('div');
        name.className = 'item-name';
        name.textContent = itemData.name;

        item.appendChild(img);
        item.appendChild(name);

        return item;
    }

    getWinnerImage() {
        if (typeof getRewardImageNormalized === 'function') {
            return getRewardImageNormalized(this.reward.name, this.chestType, this.reward.type);
        }

        if (typeof getRewardImage === 'function') {
            return getRewardImage(this.reward.name, this.chestType, this.reward.type);
        }

        if (typeof REWARD_IMAGES !== 'undefined') {
            const chestImages = REWARD_IMAGES[this.chestType];
            if (chestImages && chestImages[this.reward.name]) {
                return chestImages[this.reward.name];
            }
            if (REWARD_IMAGES.default && REWARD_IMAGES.default[this.reward.type]) {
                return REWARD_IMAGES.default[this.reward.type];
            }
        }

        return this.reward.image || 'assets/images/rewards/special/unknown.jpg';
    }

    async start() {
        const winnerImageUrl = this.getWinnerImage();

        try {
            await this.preloadImage(winnerImageUrl);
        } catch (e) {
            console.warn('Could not preload winner image');
        }

        this.generateItemStrip();

        // Usar GSAP para fade out del loading
        if (typeof gsap !== 'undefined') {
            await this.delay(300);
            gsap.to(this.elements.loading, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    this.elements.loading.style.display = 'none';
                }
            });
            await this.delay(300);
        } else {
            await this.delay(500);
            this.elements.loading.classList.add('hidden');
            await this.delay(300);
        }

        this.startRolling();
    }

    preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });
    }

    startRolling() {
        this.isRolling = true;
        this.tickCount = 0; // Reiniciar contador de ticks
        const strip = this.elements.strip;

        // Recalcular dimensiones
        this.updateItemWidth();

        const viewportWidth = this.elements.viewport.offsetWidth;
        const centerOffset = viewportWidth / 2;
        const itemCenter = this.itemWidth / 2;
        const stripPadding = window.innerWidth < 768 ? 8 : 10;

        const itemPosition = (this.winnerPosition * this.itemWidth) + stripPadding;
        const finalPosition = itemPosition - centerOffset + itemCenter;
        const randomOffset = (Math.random() - 0.5) * 20;
        const targetX = -(finalPosition + randomOffset);

        // Duración basada en dispositivo (más lento = más dramático)
        const duration = window.innerWidth < 768 ? 6 : 8;

        // Usar GSAP si está disponible
        if (typeof gsap !== 'undefined') {
            let lastItemsPassed = 0;
            const totalDistance = Math.abs(targetX);

            // Animación con slowmo dramático al final
            gsap.to(strip, {
                x: targetX,
                duration: duration,
                // Easing personalizado: rápido al inicio, SÚPER lento al final (slowmo)
                ease: "expo.out",
                onUpdate: () => {
                    const currentX = Math.abs(gsap.getProperty(strip, "x"));
                    const itemsPassed = Math.floor(currentX / this.itemWidth);
                    const progress = currentX / totalDistance;

                    if (itemsPassed > lastItemsPassed) {
                        // Pasar el progreso para pitch ascendente
                        if (progress < 0.95) {
                            this.playTickSound(progress);
                        }
                        lastItemsPassed = itemsPassed;
                    }
                },
                onComplete: () => {
                    this.stopRolling(targetX);
                }
            });
        } else {
            // Fallback sin GSAP
            this.startRollingFallback(targetX, duration);
        }
    }

    startRollingFallback(targetX, duration) {
        const strip = this.elements.strip;
        const startTime = performance.now();
        const durationMs = duration * 1000;
        let currentX = 0;
        let lastTickPosition = 0;

        const animate = (currentTime) => {
            if (!this.isRolling) return;

            const elapsed = currentTime - startTime;
            let progress = Math.min(elapsed / durationMs, 1);

            const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const newX = targetX * easeOutExpo;

            const velocity = Math.abs(newX - currentX);
            currentX = newX;

            strip.style.transform = `translateX(${currentX}px)`;

            const itemsPassed = Math.floor(Math.abs(currentX) / this.itemWidth);
            if (itemsPassed > lastTickPosition && velocity > 0.5 && progress < 0.95) {
                this.playTickSound(easeOutExpo); // Pasar el progreso eased
                lastTickPosition = itemsPassed;
            }

            if (progress >= 1) {
                strip.style.transform = `translateX(${targetX}px)`;
                this.stopRolling(targetX);
                return;
            }

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    stopRolling(finalX) {
        this.isRolling = false;
        const strip = this.elements.strip;

        // Marcar item ganador con animación
        const winnerItem = strip.querySelector('.winner-item');
        if (winnerItem) {
            winnerItem.classList.add('winner');

            if (typeof gsap !== 'undefined') {
                gsap.fromTo(winnerItem,
                    { scale: 1 },
                    { scale: 1.1, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out" }
                );
            }
        }

        // Mostrar panel de ganador
        setTimeout(() => {
            this.showWinner();
        }, 600);
    }

    showWinner() {
        const rarity = this.reward.rarity || 'rare';
        console.log('showWinner called, rarity:', rarity);

        this.playWinSound(rarity);

        // Verificar que el panel existe
        if (!this.elements.winnerPanel) {
            console.error('Winner panel element not found!');
            return;
        }

        // Configurar panel
        const winnerImg = this.getWinnerImage();
        console.log('Winner image:', winnerImg);

        if (this.elements.winnerImage) {
            this.elements.winnerImage.src = winnerImg;
        }
        if (this.elements.winnerGlow) {
            this.elements.winnerGlow.className = `winner-glow ${rarity}`;
        }
        if (this.elements.winnerType) {
            this.elements.winnerType.textContent = this.formatType(this.reward.type);
        }
        if (this.elements.winnerName) {
            this.elements.winnerName.textContent = this.reward.name;
            this.elements.winnerName.className = `winner-name ${rarity}`;
        }
        if (this.elements.winnerRarity) {
            this.elements.winnerRarity.textContent = this.formatRarity(rarity);
            this.elements.winnerRarity.className = `winner-rarity-label ${rarity}`;
        }

        this.generateStars(rarity);

        // Forzar mostrar el panel
        this.elements.winnerPanel.classList.add('active');
        this.elements.winnerPanel.style.opacity = '1';
        this.elements.winnerPanel.style.visibility = 'visible';

        console.log('Winner panel activated');

        // Confetti para legendarios usando canvas-confetti
        if ((rarity === 'legendary' || rarity === 'mythical') && this.myConfetti) {
            this.fireConfetti();
        }

        // Animar entrada con GSAP
        if (typeof gsap !== 'undefined') {
            gsap.fromTo('.winner-content',
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
            );
        }
    }

    fireConfetti() {
        if (!this.myConfetti) return;

        // Explosión inicial
        this.myConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffd700', '#ffaa00', '#ff6b6b', '#4ecdc4', '#45b7d1']
        });

        // Segundas explosiones desde los lados
        setTimeout(() => {
            this.myConfetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            this.myConfetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
        }, 250);
    }

    generateStars(rarity) {
        const starCounts = {
            common: 1,
            uncommon: 2,
            rare: 3,
            epic: 4,
            legendary: 5,
            mythical: 5
        };

        const count = starCounts[rarity] || 3;
        const container = this.elements.winnerStars;
        container.innerHTML = '';
        container.className = `winner-stars ${rarity}`;

        for (let i = 0; i < count; i++) {
            const star = document.createElement('i');
            star.className = 'fas fa-star';
            star.style.animationDelay = `${0.1 + i * 0.1}s`;
            container.appendChild(star);
        }
    }

    formatType(type) {
        const types = {
            terrain: 'Terreno Exclusivo',
            terreno: 'Terreno Exclusivo',
            special: 'Item Especial',
            invocation: 'Invocación',
            weapon: 'Arma',
            currency: 'Moneda',
            item: 'Item'
        };
        return types[type?.toLowerCase()] || type || 'Recompensa';
    }

    formatRarity(rarity) {
        const rarities = {
            common: 'Común',
            uncommon: 'Poco Común',
            rare: 'Raro',
            epic: 'Épico',
            legendary: 'Legendario',
            mythical: 'Mítico'
        };
        return rarities[rarity] || rarity;
    }

    goBack() {
        if (typeof gsap !== 'undefined') {
            gsap.to('body', {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    window.location.href = 'index.php';
                }
            });
        } else {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                window.location.href = 'index.php';
            }, 300);
        }
    }

    openAnother() {
        if (typeof gsap !== 'undefined') {
            gsap.to('body', {
                opacity: 0,
                duration: 0.3,
                onComplete: () => this.processOpenAnother()
            });
        } else {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.3s ease';
            setTimeout(() => this.processOpenAnother(), 300);
        }
    }

    processOpenAnother() {
        fetch('process_gacha.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chest_type: this.chestType
            })
        })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const rewardData = encodeURIComponent(JSON.stringify(result.reward));
                    window.location.href = `csgo-reward.php?chest=${this.chestType}&reward=${rewardData}`;
                } else {
                    alert(result.message || 'No se pudo abrir el cofre');
                    window.location.href = 'index.php';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                window.location.href = 'index.php';
            });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Exportar para uso global
window.CSGORewardSystem = CSGORewardSystem;

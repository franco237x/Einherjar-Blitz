/**
 * ============================================
 * GENSHIN IMPACT STYLE REWARD REVEAL SYSTEM
 * Meteor Video → Silhouette → Flash → Reveal
 * ============================================
 */

class GenshinRewardSystem {
    constructor(reward) {
        this.reward = reward;
        this.phases = {
            loading: document.getElementById('loadingScreen'),
            meteor: document.getElementById('meteorPhase'),
            silhouette: document.getElementById('silhouettePhase'),
            flash: document.getElementById('flashPhase'),
            reveal: document.getElementById('revealPhase')
        };
        
        this.elements = {
            meteorVideo: document.getElementById('meteorVideo'),
            skipMeteor: document.getElementById('skipMeteor'),
            silhouetteImg: document.getElementById('silhouetteImg'),
            rewardImage: document.getElementById('rewardImage'),
            rewardGlow: document.getElementById('rewardGlow'),
            rarityBg: document.getElementById('rarityBg'),
            rarityStars: document.getElementById('rarityStars'),
            rewardType: document.getElementById('rewardType'),
            rewardName: document.getElementById('rewardName'),
            rewardQuantity: document.getElementById('rewardQuantity'),
            lightBurst: document.getElementById('lightBurst'),
            particles: document.getElementById('particles'),
            rays: document.getElementById('rays'),
            btnClaim: document.getElementById('btnClaim')
        };
        
        this.isSkippable = true;
        this.currentPhase = 'loading';
        this.hasSkipped = false;
        this.audioContext = null;
        
        // Videos según rareza
        this.meteorVideos = {
            common: 'assets/videos/meteor-3star.mp4',
            uncommon: 'assets/videos/meteor-3star.mp4',
            rare: 'assets/videos/meteor-3star.mp4',
            epic: 'assets/videos/meteor-4star.mp4',
            legendary: 'assets/videos/meteor-5star.mp4'
        };
        
        this.setupEventListeners();
        this.createBackgroundParticles();
        this.initAudio();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(type) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            if (type === 'reveal') {
                // Sonido ascendente brillante
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.type = 'sine';
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.5);
            } else if (type === 'star') {
                // Sonido de estrella
                oscillator.frequency.setValueAtTime(800 + Math.random() * 400, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                oscillator.type = 'sine';
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.15);
            }
        } catch (e) {
            // Silently fail
        }
    }
    
    setupEventListeners() {
        // Saltar video de meteoro
        this.elements.skipMeteor.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentPhase === 'meteor') {
                this.skipMeteorVideo();
            }
        });
        
        // Click en video también salta
        this.elements.meteorVideo.addEventListener('click', () => {
            if (this.currentPhase === 'meteor') {
                this.skipMeteorVideo();
            }
        });
        
        // Cuando el video termina
        this.elements.meteorVideo.addEventListener('ended', () => {
            this.onMeteorVideoEnded();
        });
        
        // Click/tap para saltar silueta
        document.addEventListener('click', (e) => {
            if (this.currentPhase === 'silhouette' && this.isSkippable && !this.hasSkipped) {
                // No saltar si clickeamos en el botón de claim
                if (!e.target.closest('#btnClaim') && !e.target.closest('.skip-btn')) {
                    this.hasSkipped = true;
                    this.skipToReveal();
                }
            }
        });
        
        // Teclas para saltar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                if (this.currentPhase === 'meteor') {
                    this.skipMeteorVideo();
                } else if (this.currentPhase === 'silhouette' && this.isSkippable && !this.hasSkipped) {
                    this.hasSkipped = true;
                    this.skipToReveal();
                }
            }
        });
        
        // Botón continuar
        this.elements.btnClaim.addEventListener('click', (e) => {
            e.stopPropagation();
            this.goBack();
        });
    }
    
    createBackgroundParticles() {
        const container = this.elements.particles;
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 8}s`;
            particle.style.animationDuration = `${6 + Math.random() * 4}s`;
            particle.style.opacity = Math.random() * 0.5 + 0.3;
            particle.style.width = `${2 + Math.random() * 4}px`;
            particle.style.height = particle.style.width;
            container.appendChild(particle);
        }
    }
    
    createLightRays() {
        const container = this.elements.lightBurst;
        container.innerHTML = '';
        const rayCount = 12;
        const rarity = this.getRarity();
        
        for (let i = 0; i < rayCount; i++) {
            const ray = document.createElement('div');
            ray.className = 'light-ray';
            ray.style.transform = `translate(-50%, -50%) rotate(${i * (360 / rayCount)}deg)`;
            ray.style.animationDelay = `${i * 0.1}s`;
            
            // Color basado en rareza
            const colors = {
                common: 'rgba(158, 158, 158, 0.3)',
                uncommon: 'rgba(76, 175, 80, 0.3)',
                rare: 'rgba(33, 150, 243, 0.3)',
                epic: 'rgba(156, 39, 176, 0.3)',
                legendary: 'rgba(255, 215, 0, 0.5)'
            };
            
            ray.style.background = `linear-gradient(to bottom, 
                transparent 0%, 
                ${colors[rarity]} 30%, 
                ${colors[rarity].replace('0.3', '0.6').replace('0.5', '0.8')} 50%, 
                ${colors[rarity]} 70%, 
                transparent 100%)`;
            
            container.appendChild(ray);
        }
    }
    
    getRarity() {
        // Si el backend ya envía la rareza, usarla
        if (this.reward.rarity) {
            const rarityMap = {
                'common': 'common',
                'uncommon': 'uncommon',
                'rare': 'rare',
                'epic': 'epic',
                'legendary': 'legendary',
                'mythical': 'legendary', // mythical usa efectos legendary
                'común': 'common',
                'poco común': 'uncommon',
                'raro': 'rare',
                'épico': 'epic',
                'legendario': 'legendary',
                'mítico': 'legendary'
            };
            return rarityMap[this.reward.rarity.toLowerCase()] || 'rare';
        }
        
        // Fallback: determinar por tipo
        const type = this.reward.type?.toLowerCase() || '';
        if (type === 'terrain' || type === 'terreno') return 'legendary';
        if (type === 'special') return 'epic';
        
        return 'rare';
    }
    
    getStarCount() {
        const rarity = this.getRarity();
        const counts = {
            common: 1,
            uncommon: 2,
            rare: 3,
            epic: 4,
            legendary: 5
        };
        return counts[rarity] || 3;
    }
    
    getImageUrl() {
        // Usar el sistema de imágenes existente si está disponible
        if (typeof getRewardImage === 'function') {
            const chestType = new URLSearchParams(window.location.search).get('chest') || 'terrains';
            const rewardType = this.reward.type || 'item';
            return getRewardImage(this.reward.name, chestType, rewardType);
        }
        
        // Fallback: buscar directamente en REWARD_IMAGES
        if (typeof REWARD_IMAGES !== 'undefined') {
            const chestType = new URLSearchParams(window.location.search).get('chest') || 'terrains';
            if (REWARD_IMAGES[chestType] && REWARD_IMAGES[chestType][this.reward.name]) {
                return REWARD_IMAGES[chestType][this.reward.name];
            }
            if (REWARD_IMAGES.default && REWARD_IMAGES.default[this.reward.type]) {
                return REWARD_IMAGES.default[this.reward.type];
            }
        }
        
        // Imagen desde los datos del reward
        if (this.reward.image) return this.reward.image;
        
        // Fallback genérico
        return 'assets/images/rewards/special/unknown.jpg';
    }
    
    async start() {
        // Cargar imagen primero
        const imageUrl = this.getImageUrl();
        
        try {
            await this.preloadImage(imageUrl);
        } catch (e) {
            console.warn('No se pudo cargar la imagen, usando placeholder');
        }
        
        // Configurar imágenes
        this.elements.silhouetteImg.src = imageUrl;
        this.elements.rewardImage.src = imageUrl;
        
        // Configurar video de meteoro según rareza
        const rarity = this.getRarity();
        const videoSrc = this.meteorVideos[rarity] || this.meteorVideos.rare;
        this.elements.meteorVideo.querySelector('source').src = videoSrc;
        this.elements.meteorVideo.load();
        
        // Pequeño delay para asegurar que todo esté listo
        await this.delay(500);
        
        // Ocultar loading
        this.phases.loading.classList.add('hidden');
        
        // Iniciar con el video de meteoro
        await this.delay(300);
        this.startMeteorPhase();
    }
    
    startMeteorPhase() {
        this.currentPhase = 'meteor';
        this.phases.meteor.classList.add('active');
        
        // Intentar reproducir el video
        const playPromise = this.elements.meteorVideo.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Si el autoplay falla, saltar directamente a la silueta
                console.log('Autoplay blocked, skipping to silhouette');
                this.skipMeteorVideo();
            });
        }
    }
    
    skipMeteorVideo() {
        if (this.currentPhase !== 'meteor') return;
        
        this.elements.meteorVideo.pause();
        this.onMeteorVideoEnded();
    }
    
    async onMeteorVideoEnded() {
        if (this.currentPhase !== 'meteor') return;
        
        // Fade out del video
        this.phases.meteor.style.transition = 'opacity 0.3s ease';
        this.phases.meteor.style.opacity = '0';
        
        await this.delay(300);
        
        this.phases.meteor.classList.remove('active');
        this.phases.meteor.style.opacity = '';
        
        // Ir a la fase de silueta
        this.startSilhouettePhase();
    }
    
    preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = () => {
                // Usar un data URI de SVG como fallback
                const fallbackSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%231a1a2e' width='200' height='200' rx='20'/%3E%3Ccircle cx='100' cy='80' r='40' fill='%23c9aa71'/%3E%3Cpath d='M60 130 L100 180 L140 130 Z' fill='%23c9aa71'/%3E%3Ctext x='100' y='90' text-anchor='middle' fill='%231a1a2e' font-size='40' font-weight='bold'%3E?%3C/text%3E%3C/svg%3E`;
                this.elements.silhouetteImg.src = fallbackSvg;
                this.elements.rewardImage.src = fallbackSvg;
                resolve();
            };
            img.src = url;
        });
    }
    
    startSilhouettePhase() {
        this.currentPhase = 'silhouette';
        this.phases.silhouette.classList.add('active');
        
        // Después de 2.5 segundos, proceder al reveal automáticamente
        this.silhouetteTimeout = setTimeout(() => {
            if (!this.hasSkipped) {
                this.hasSkipped = true;
                this.triggerReveal();
            }
        }, 2500);
    }
    
    skipToReveal() {
        if (this.silhouetteTimeout) {
            clearTimeout(this.silhouetteTimeout);
        }
        this.triggerReveal();
    }
    
    async triggerReveal() {
        this.isSkippable = false;
        this.currentPhase = 'flash';
        
        // Fade out silueta
        this.phases.silhouette.classList.add('fade-out');
        
        await this.delay(200);
        
        // Flash blanco
        this.phases.flash.classList.add('active');
        
        // Sonido de revelación
        this.playSound('reveal');
        
        // Preparar reveal
        this.prepareReveal();
        
        await this.delay(400);
        
        // Mostrar reveal
        this.currentPhase = 'reveal';
        this.phases.reveal.classList.add('active');
        this.elements.lightBurst.classList.add('active');
        this.elements.rays.classList.add('active');
        
        // Animar estrellas secuencialmente
        await this.delay(300);
        this.animateStars();
        
        // Efectos especiales para legendary
        if (this.getRarity() === 'legendary') {
            this.addLegendarySparkles();
        }
    }
    
    prepareReveal() {
        const rarity = this.getRarity();
        
        // Configurar colores de rareza
        this.elements.rarityBg.className = `rarity-background ${rarity}`;
        this.elements.rewardGlow.className = `reward-glow ${rarity}`;
        
        // Crear rayos de luz
        this.createLightRays();
        
        // Crear estrellas
        const starCount = this.getStarCount();
        this.elements.rarityStars.innerHTML = '';
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('i');
            star.className = 'fas fa-star star';
            star.style.animationDelay = `${0.5 + i * 0.1}s`;
            this.elements.rarityStars.appendChild(star);
        }
        
        // Configurar info
        this.elements.rewardType.textContent = this.formatType(this.reward.type);
        this.elements.rewardName.textContent = this.reward.name || 'Recompensa';
        this.elements.rewardName.className = `reward-name ${rarity}`;
        
        // Cantidad si aplica
        if (this.reward.amount || this.reward.quantity) {
            const qty = this.reward.amount || this.reward.quantity;
            this.elements.rewardQuantity.innerHTML = `x<span class="value">${qty}</span>`;
        } else {
            this.elements.rewardQuantity.textContent = '';
        }
    }
    
    formatType(type) {
        const types = {
            terrain: 'Terreno Exclusivo',
            terreno: 'Terreno Exclusivo',
            currency: 'Moneda',
            item: 'Item',
            character: 'Personaje',
            skin: 'Apariencia'
        };
        return types[type?.toLowerCase()] || type || 'Recompensa';
    }
    
    animateStars() {
        const stars = this.elements.rarityStars.querySelectorAll('.star');
        stars.forEach((star, index) => {
            setTimeout(() => {
                star.style.opacity = '1';
                star.style.transform = 'scale(1)';
                this.playSound('star');
            }, index * 100);
        });
    }
    
    addLegendarySparkles() {
        const wrapper = this.elements.rewardImage.parentElement;
        const sparklesContainer = document.createElement('div');
        sparklesContainer.className = 'legendary-sparkles';
        
        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${Math.random() * 100}%`;
            sparkle.style.top = `${Math.random() * 100}%`;
            sparkle.style.animationDelay = `${Math.random() * 2}s`;
            sparkle.style.animationDuration = `${1 + Math.random()}s`;
            sparklesContainer.appendChild(sparkle);
        }
        
        wrapper.appendChild(sparklesContainer);
    }
    
    goBack() {
        // Fade out todo
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
            window.location.href = 'index.php';
        }, 500);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Exportar para uso global
window.GenshinRewardSystem = GenshinRewardSystem;

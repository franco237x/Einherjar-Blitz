/* ====================================
   SISTEMA DE ANIMACIÓN CON VIDEOS
   Einherjer Blitz 3.0 - Sistema de Recompensas
   ==================================== */

class VideoRewardSystem {
    constructor() {
        this.currentReward = null;
        this.particleSystem = null;
        this.audioEnabled = true;
        this.currentPhase = 'loading';
        this.skipRequested = false;
        
        this.elements = {
            system: document.getElementById('videoAnimationSystem'),
            meteorVideo: document.getElementById('meteorVideo'),
            meteorVideoElement: document.getElementById('meteorVideoElement'),
            skipButton: document.getElementById('skipMeteor'),
            lightEffects: document.getElementById('lightEffects'),
            splashReveal: document.getElementById('splashReveal'),
            particleCanvas: document.getElementById('particleCanvas'),
            itemIcon: document.getElementById('itemIcon'),
            itemType: document.getElementById('itemType'),
            itemName: document.getElementById('itemName'),
            itemValue: document.getElementById('itemValue')
        };
        
        this.init();
    }
    
    init() {
        this.setupAudio();
        this.initParticleSystem();
        this.setupEventListeners();
        
        // Establecer el sistema como visible
        this.elements.system.style.display = 'block';
    }
    
    setupAudio() {
        // Crear contexto de audio
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            this.audioContext = new (AudioContext || webkitAudioContext)();
            this.sounds = {
                meteor: this.createMeteorSound(),
                reveal: this.createRevealSound(),
                legendary: this.createLegendarySound(),
                mythical: this.createMythicalSound(),
                click: this.createClickSound()
            };
        }
    }
    
    setupEventListeners() {
        // Evento de finalización del video
        this.elements.meteorVideoElement.addEventListener('ended', () => {
            this.proceedToReveal();
        });
        
        // Evento de error del video
        this.elements.meteorVideoElement.addEventListener('error', () => {
            console.warn('Error loading meteor video, proceeding to reveal');
            this.proceedToReveal();
        });
        
        // Gestión de clic en cualquier lugar para acelerar
        document.addEventListener('click', (e) => {
            if (this.currentPhase === 'meteor' && !e.target.closest('.skip-button')) {
                this.showSkipButton();
            }
        });
    }
    
    // Métodos de audio
    createMeteorSound() {
        if (!this.audioContext) return null;
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 2);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 2);
        };
    }
    
    createRevealSound() {
        if (!this.audioContext) return null;
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 1);
        };
    }
    
    createLegendarySound() {
        if (!this.audioContext) return null;
        return () => {
            [440, 554, 659, 880].forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.1);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime + index * 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5 + index * 0.1);
                
                oscillator.start(this.audioContext.currentTime + index * 0.1);
                oscillator.stop(this.audioContext.currentTime + 1.5 + index * 0.1);
            });
        };
    }
    
    createMythicalSound() {
        if (!this.audioContext) return null;
        return () => {
            [523, 659, 784, 1047, 1319].forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.05);
                gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime + index * 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2 + index * 0.05);
                
                oscillator.start(this.audioContext.currentTime + index * 0.05);
                oscillator.stop(this.audioContext.currentTime + 2 + index * 0.05);
            });
        };
    }
    
    createClickSound() {
        if (!this.audioContext) return null;
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    playSound(soundName) {
        if (!this.audioEnabled || !this.sounds || !this.sounds[soundName]) return;
        
        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            this.sounds[soundName]();
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }
    
    // Inicializar sistema de partículas
    initParticleSystem() {
        this.particleSystem = new ParticleSystem(this.elements.particleCanvas);
    }
    
    // Método principal para iniciar la secuencia
    startRevealSequence(reward) {
        this.currentReward = reward;
        this.currentPhase = 'meteor';
        this.skipRequested = false;
        
        // Configurar video del meteoro basado en rareza
        this.setupMeteorVideo(reward.rarity);
        
        // Mostrar video del meteoro
        this.showMeteorVideo();
    }
    
    setupMeteorVideo(rarity) {
        // Determinar qué video usar basado en la rareza
        let videoSrc = 'assets/videos/meteor-3star.mp4'; // Por defecto
        
        switch(rarity) {
            case 'rare':
                videoSrc = 'assets/videos/meteor-4star.mp4';
                break;
            case 'epic':
                videoSrc = 'assets/videos/meteor-4star.mp4';
                break;
            case 'legendary':
                videoSrc = 'assets/videos/meteor-5star.mp4';
                break;
            case 'mythical':
                videoSrc = 'assets/videos/meteor-5star.mp4';
                break;
        }
        
        // Configurar el elemento de video
        this.elements.meteorVideoElement.src = videoSrc;
        this.elements.meteorVideoElement.load();
    }
    
    showMeteorVideo() {
        this.elements.meteorVideo.classList.remove('hidden');
        this.playSound('meteor');
        
        // Reproducir el video
        this.elements.meteorVideoElement.play().catch(error => {
            console.warn('Error reproduciendo video:', error);
            // Si hay error con el video, proceder directamente a la revelación
            setTimeout(() => {
                this.proceedToReveal();
            }, 2000);
        });
        
        // Mostrar botón de saltar después de 1 segundo
        setTimeout(() => {
            this.showSkipButton();
        }, 1000);
    }
    
    showSkipButton() {
        if (this.currentPhase === 'meteor') {
            this.elements.skipButton.classList.remove('hidden');
        }
    }
    
    skipMeteor() {
        if (this.currentPhase !== 'meteor') return;
        
        this.skipRequested = true;
        this.playSound('click');
        this.proceedToReveal();
    }
    
    proceedToReveal() {
        this.currentPhase = 'reveal';
        
        // Ocultar video del meteoro
        this.elements.meteorVideo.classList.add('fade-out');
        
        setTimeout(() => {
            this.elements.meteorVideo.classList.add('hidden');
            this.elements.meteorVideo.classList.remove('fade-out');
            
            // Iniciar revelación del splash
            this.startSplashReveal();
        }, 500);
    }
    
    startSplashReveal() {
        // Configurar efectos de luz
        this.elements.lightEffects.classList.remove('hidden');
        this.elements.lightEffects.classList.add('fade-in');
        
        // Mostrar contenedor de revelación
        this.elements.splashReveal.classList.remove('hidden');
        
        setTimeout(() => {
            this.elements.splashReveal.classList.add('active');
            this.revealItem();
        }, 300);
    }
    
    revealItem() {
        const reward = this.currentReward;
        
        // Configurar información del item
        this.setupItemDisplay(reward);
        
        // Aplicar clase de rareza
        this.elements.splashReveal.className = `splash-reveal active rarity-${reward.rarity}`;
        
        // Reproducir sonido según rareza
        if (reward.rarity === 'mythical') {
            this.playSound('mythical');
        } else if (reward.rarity === 'legendary') {
            this.playSound('legendary');
        } else {
            this.playSound('reveal');
        }
        
        // Iniciar sistema de partículas
        this.particleSystem.startCelebration(reward.rarity);
        
        // Configurar estrellas de rareza
        this.setupRarityStars(reward.rarity);
    }
    
    setupItemDisplay(reward) {
        // Configurar icono basado en tipo
        const iconMap = {
            'currency': 'fas fa-coins',
            'item': 'fas fa-gem',
            'card': 'fas fa-id-card',
            'special': 'fas fa-star',
            'ammo': 'fas fa-bullet',
            'weapon': 'fas fa-sword',
            'armor': 'fas fa-shield-alt',
            'relic': 'fas fa-crown',
            'blessing': 'fas fa-hands-praying',
            'resource': 'fas fa-mountain',
            'crystal': 'fas fa-diamond',
            'gem': 'fas fa-gem',
            'diamond': 'fas fa-diamond',
            'terrain': 'fas fa-map'
        };
        
        const typeNames = {
            'currency': 'Moneda',
            'item': 'Objeto',
            'card': 'Carta',
            'special': 'Especial',
            'ammo': 'Munición',
            'weapon': 'Arma',
            'armor': 'Armadura',
            'relic': 'Reliquia',
            'blessing': 'Bendición',
            'resource': 'Recurso',
            'crystal': 'Cristal',
            'gem': 'Gema',
            'diamond': 'Diamante',
            'terrain': 'Terreno'
        };
        
        this.elements.itemIcon.className = iconMap[reward.type] || 'fas fa-gift';
        this.elements.itemType.textContent = typeNames[reward.type] || 'Objeto';
        this.elements.itemName.textContent = reward.name;
        this.elements.itemValue.textContent = `x${reward.value}`;
        
        // Configurar color del icono según rareza
        const rarityColors = {
            'common': '#9ca3af',
            'rare': '#3b82f6',
            'epic': '#8b5cf6',
            'legendary': '#f59e0b',
            'mythical': '#ef4444'
        };
        
        this.elements.itemIcon.style.color = rarityColors[reward.rarity] || rarityColors.common;
    }
    
    setupRarityStars(rarity) {
        const stars = document.querySelectorAll('.item-stars i');
        const starCounts = {
            'common': 1,
            'rare': 2,
            'epic': 3,
            'legendary': 4,
            'mythical': 5
        };
        
        const starCount = starCounts[rarity] || 1;
        
        stars.forEach((star, index) => {
            if (index < starCount) {
                star.style.opacity = '1';
                star.style.animationDelay = `${1.0 + index * 0.1}s`;
            } else {
                star.style.opacity = '0.3';
            }
        });
    }
    
    claimReward() {
        this.playSound('click');
        
        // Animación de reclamado
        this.elements.splashReveal.style.transform = 'scale(0.9)';
        this.elements.splashReveal.style.opacity = '0.8';
        
        // Efecto final de partículas
        this.particleSystem.finalBurst(this.currentReward.rarity);
    }
}

// Sistema de partículas
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    startCelebration(rarity) {
        this.stopAnimation();
        this.particles = [];
        
        const particleCount = this.getParticleCount(rarity);
        const colors = this.getParticleColors(rarity);
        
        // Crear partículas iniciales
        for (let i = 0; i < particleCount; i++) {
            this.createParticle(colors);
        }
        
        this.animate();
        
        // Continuar creando partículas por un tiempo
        const interval = setInterval(() => {
            if (this.particles.length < particleCount * 2) {
                this.createParticle(colors);
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(interval);
        }, 5000);
    }
    
    getParticleCount(rarity) {
        const counts = {
            'common': 20,
            'rare': 35,
            'epic': 50,
            'legendary': 80,
            'mythical': 120
        };
        return counts[rarity] || 20;
    }
    
    getParticleColors(rarity) {
        const colorSets = {
            'common': ['#9ca3af', '#d1d5db', '#ffffff'],
            'rare': ['#3b82f6', '#60a5fa', '#93c5fd'],
            'epic': ['#8b5cf6', '#c084fc', '#ddd6fe'],
            'legendary': ['#f59e0b', '#fbbf24', '#fcd34d'],
            'mythical': ['#ef4444', '#f87171', '#ffd700', '#ff6b6b']
        };
        return colorSets[rarity] || colorSets.common;
    }
    
    createParticle(colors) {
        const particle = {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 4 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            decay: Math.random() * 0.02 + 0.005,
            gravity: Math.random() * 0.1 + 0.05
        };
        
        this.particles.push(particle);
    }
    
    updateParticle(particle) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.life -= particle.decay;
        
        // Rebote en los bordes
        if (particle.x < 0 || particle.x > this.canvas.width) {
            particle.vx *= -0.8;
        }
        if (particle.y > this.canvas.height) {
            particle.vy *= -0.8;
            particle.y = this.canvas.height;
        }
        
        return particle.life > 0;
    }
    
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.life;
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowBlur = particle.size * 2;
        this.ctx.shadowColor = particle.color;
        
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Actualizar y dibujar partículas
        this.particles = this.particles.filter(particle => {
            if (this.updateParticle(particle)) {
                this.drawParticle(particle);
                return true;
            }
            return false;
        });
        
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
    
    finalBurst(rarity) {
        const colors = this.getParticleColors(rarity);
        const burstCount = rarity === 'mythical' ? 50 : 30;
        
        // Crear explosión final en el centro
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < burstCount; i++) {
            const angle = (Math.PI * 2 / burstCount) * i;
            const speed = Math.random() * 8 + 4;
            
            const particle = {
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
                decay: Math.random() * 0.01 + 0.005,
                gravity: 0.1
            };
            
            this.particles.push(particle);
        }
    }
    
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Hacer disponible globalmente
window.VideoRewardSystem = VideoRewardSystem;

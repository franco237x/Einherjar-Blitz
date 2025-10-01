class HeroPassExperience {
    constructor() {
        this.levelData = window.heroPassConfig?.levels ?? [];
        this.activePass = window.heroPassConfig?.defaultPass ?? 'elite';
        this.canvas = document.getElementById('nebula-background');
        this.context = this.canvas?.getContext('2d') ?? null;
        this.trailScroll = document.querySelector('.trail-scroll');
        this.levelCards = Array.from(document.querySelectorAll('.level-card'));
        this.progressBar = document.querySelector('.trail-progress-bar');
        this.passButtons = Array.from(document.querySelectorAll('.btn-select'));
        this.passCards = Array.from(document.querySelectorAll('.pass-card'));
        this.trailButtons = Array.from(document.querySelectorAll('.trail-btn'));
        this._stars = [];
        this._nebulaTick = 0;
        this.observer = null;
        this.init();
    }

    init() {
        this.initCanvas();
        this.bindPassSelectors();
        this.bindTrailControls();
        this.observeLevelCards();
        this.activatePass(this.activePass, false);
        this.autoFocusDefault();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.updateProgressFromScroll();
        });
    }

    initCanvas() {
        if (!this.canvas || !this.context) return;
        this.resizeCanvas();
        this.generateStars(140);
        requestAnimationFrame(() => this.drawNebula());
    }

    resizeCanvas() {
        if (!this.canvas || !this.context) return;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.context.scale(dpr, dpr);
    }

    generateStars(total) {
        const { width, height } = this.canvas;
        this._stars = Array.from({ length: total }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.3,
            alpha: Math.random() * 0.8 + 0.2,
            drift: Math.random() * 0.5 + 0.1
        }));
    }

    drawNebula() {
        if (!this.context || !this.canvas) return;
        const ctx = this.context;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.save();
        ctx.fillStyle = '#04010d';
        ctx.fillRect(0, 0, width, height);

        const gradient = ctx.createRadialGradient(
            width * 0.7,
            height * 0.25,
            120,
            width * 0.4,
            height * 0.65,
            Math.max(width, height)
        );

        gradient.addColorStop(0, 'rgba(73, 242, 255, 0.18)');
        gradient.addColorStop(0.35, 'rgba(180, 123, 255, 0.15)');
        gradient.addColorStop(1, 'rgba(4, 1, 13, 0.95)');

        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'source-over';
        this._stars.forEach(star => {
            ctx.beginPath();
            ctx.fillStyle = `rgba(180, 223, 255, ${star.alpha})`;
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
            star.y -= star.drift;
            if (star.y < -5) {
                star.y = height + Math.random() * 20;
                star.x = Math.random() * width;
            }
        });

        ctx.restore();
        this._nebulaTick += 1;
        requestAnimationFrame(() => this.drawNebula());
    }

    bindPassSelectors() {
        this.passButtons.forEach(button => {
            button.addEventListener('click', () => {
                const passId = button.dataset.passTarget;
                this.activatePass(passId, true);
            });
        });

        this.passCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                const pass = card.dataset.pass;
                this.highlightCard(pass);
            });
            card.addEventListener('mouseleave', () => {
                this.highlightCard(this.activePass);
            });
        });
    }

    highlightCard(passId) {
        this.passCards.forEach(card => {
            card.classList.toggle('is-active', card.dataset.pass === passId);
        });
    }

    activatePass(passId = 'elite', animate = true) {
        this.activePass = passId;
        this.trailScroll?.setAttribute('data-active-pass', passId);
        this.highlightCard(passId);
        this.togglePassButtons(passId);
        this.updateRewardHighlight();
        if (animate) {
            this.createPassPulse(passId);
        }
    }

    togglePassButtons(passId) {
        this.passButtons.forEach(btn => {
            const isActive = btn.dataset.passTarget === passId;
            btn.classList.toggle('is-selected', isActive);
            btn.innerHTML = isActive
                ? '<span>Seleccionado</span><i class="fas fa-check"></i>'
                : '<span>Preview Hero X</span><i class="fas fa-play"></i>';
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    createPassPulse(passId) {
        const activeCard = this.passCards.find(card => card.dataset.pass === passId);
        if (!activeCard) return;

        const pulse = document.createElement('span');
        pulse.className = 'pulse-ring';
        activeCard.appendChild(pulse);
        setTimeout(() => pulse.remove(), 1200);
    }

    bindTrailControls() {
        if (!this.trailScroll) return;

        this.trailButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction === 'next' ? 1 : -1;
                this.scrollByCard(direction);
            });
        });

        this.trailScroll.addEventListener('wheel', event => {
            if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                event.preventDefault();
                this.trailScroll.scrollBy({
                    left: event.deltaY * 1.25,
                    behavior: 'smooth'
                });
            }
        }, { passive: false });

        this.trailScroll.addEventListener('scroll', () => {
            window.requestAnimationFrame(() => this.updateProgressFromScroll());
        });
    }

    scrollByCard(direction) {
        if (!this.trailScroll) return;
        const cardWidth = this.levelCards[0]?.offsetWidth ?? 320;
        const gap = this.computeGridGap();
        const offset = (cardWidth + gap) * direction;
        this.trailScroll.scrollBy({ left: offset, behavior: 'smooth' });
    }

    computeGridGap() {
        if (!this.trailScroll) return 20;
        const computed = window.getComputedStyle(this.trailScroll);
        const gap = parseFloat(computed.columnGap ?? computed.gap ?? '0');
        return isNaN(gap) ? 20 : gap;
    }

    observeLevelCards() {
        if (!this.trailScroll || !('IntersectionObserver' in window)) {
            this.updateRewardHighlight();
            return;
        }

        this.observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                } else {
                    entry.target.classList.remove('active');
                }
            });
            this.updateProgressFromScroll();
        }, {
            root: this.trailScroll,
            threshold: 0.6,
        });

        this.levelCards.forEach(card => this.observer?.observe(card));
    }

    updateRewardHighlight() {
        this.levelCards.forEach(card => {
            const rewards = card.querySelectorAll('.reward-block');
            rewards.forEach((block, index) => {
                const isActive = block.dataset.pass === this.activePass;
                
                // Remover primero para forzar reflow
                block.classList.remove('active');
                
                if (isActive) {
                    // Agregar con delay escalonado para efecto cascada
                    setTimeout(() => {
                        block.classList.add('active');
                    }, index * 50);
                }
            });
        });
    }

    updateProgressFromScroll() {
        if (!this.trailScroll || !this.progressBar || this.levelCards.length === 0) return;
        const scrollLeft = this.trailScroll.scrollLeft;
        const maxScroll = this.trailScroll.scrollWidth - this.trailScroll.clientWidth;
        const progress = maxScroll === 0 ? 0 : scrollLeft / maxScroll;

        const activeIndex = this.getCenteredCardIndex();
        const totalLevels = this.levelCards.length;
        const progressPerCard = 1 / Math.max(totalLevels - 1, 1);
        const indicator = Math.min(1, Math.max(progress, activeIndex * progressPerCard));

        this.progressBar.style.transform = `scaleX(${Math.max(0.15, indicator)})`;
    }

    getCenteredCardIndex() {
        if (!this.trailScroll) return 0;
        const scrollLeft = this.trailScroll.scrollLeft;
        const center = scrollLeft + this.trailScroll.clientWidth / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;

        this.levelCards.forEach((card, index) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(cardCenter - center);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });
        return closestIndex;
    }

    autoFocusDefault() {
        if (!this.trailScroll) return;
        const targetCard = this.levelCards.find(card => Number(card.dataset.level) === 1) ?? this.levelCards[0];
        if (targetCard) {
            targetCard.classList.add('active');
            targetCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }
}

// Utility to throttle animations on scroll
const throttle = (callback, limit = 100) => {
    let wait = false;
    return (...args) => {
        if (!wait) {
            callback.apply(null, args);
            wait = true;
            setTimeout(() => { wait = false; }, limit);
        }
    };
};

document.addEventListener('DOMContentLoaded', () => {
    const experience = new HeroPassExperience();

    // Reactive parallax for hero visual
    const heroVisual = document.querySelector('.hero-visual');
    const orbital = document.querySelector('.orbital');
    const floatingCard = document.querySelector('.floating-card');

    const handleParallax = throttle(event => {
        const offsetX = (event.clientX / window.innerWidth - 0.5) * 20;
        const offsetY = (event.clientY / window.innerHeight - 0.5) * 20;
        if (orbital) {
            orbital.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
        }
        if (floatingCard) {
            floatingCard.style.transform = `translate(${offsetX * 0.3}px, calc(50% + ${offsetY * 0.6}px))`;
        }
    }, 40);

    heroVisual?.addEventListener('mousemove', handleParallax);

    // Accent scroll reveal
    const revealElements = document.querySelectorAll('.pass-card, .flux-card');
    const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-in');
            }
        });
    }, { threshold: 0.2 }) : null;

    revealElements.forEach(el => revealObserver?.observe(el));

    // Provide fallback if IntersectionObserver not supported
    if (!('IntersectionObserver' in window)) {
        revealElements.forEach(el => el.classList.add('reveal-in'));
    }

    console.log('🚀 Hero Pass Experience initialized', experience);
});

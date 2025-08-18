// ==========================================
// SISTEMA DE RECLAMO DE RECOMPENSAS - JS
// Einherjer Blitz 3.0
// ==========================================

class RewardClaimSystem {
    constructor() {
        this.initializeAnimations();
        this.setupObservers();
        this.addInteractiveEffects();
    }

    // Inicializar animaciones al cargar la página
    initializeAnimations() {
        // Animar elementos cuando aparecen en viewport
        this.animateOnScroll();
        
        // Efecto de typing para el título
        this.typingEffect();
        
        // Contador animado para estadísticas
        this.animateCounters();
    }

    // Efecto de escritura para el título
    typingEffect() {
        const title = document.querySelector('.page-title');
        if (!title) return;

        const text = title.textContent;
        title.textContent = '';
        title.style.borderRight = '2px solid #d4af37';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                title.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            } else {
                // Parpadeo del cursor
                setTimeout(() => {
                    title.style.borderRight = 'none';
                }, 1000);
            }
        };
        
        setTimeout(typeWriter, 500);
    }

    // Animar contadores de estadísticas
    animateCounters() {
        const counters = document.querySelectorAll('.stats-card h3');
        
        counters.forEach(counter => {
            const target = parseInt(counter.textContent);
            if (isNaN(target)) return;
            
            let current = 0;
            const increment = target / 30;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, 50);
        });
    }

    // Animaciones al hacer scroll
    animateOnScroll() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observar elementos para animación
        document.querySelectorAll('.reward-card, .stats-card, .action-buttons').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            observer.observe(el);
        });
    }

    // Configurar observadores
    setupObservers() {
        // Observer para lazy loading de imágenes si las hay
        this.setupLazyLoading();
        
        // Observer para efectos parallax suaves
        this.setupParallaxEffects();
    }

    // Lazy loading para imágenes
    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if (images.length === 0) return;

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Efectos parallax suaves
    setupParallaxEffects() {
        let lastScrollTop = 0;
        const header = document.querySelector('.claim-header');
        const progressBar = document.getElementById('scrollProgress');
        const scrollToTopBtn = document.getElementById('scrollToTop');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Calcular progreso de scroll
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollProgress = (scrollTop / documentHeight) * 100;
            
            if (progressBar) {
                progressBar.style.transform = `scaleX(${scrollProgress / 100})`;
            }
            
            // Mostrar/ocultar botón scroll to top
            if (scrollToTopBtn) {
                if (scrollTop > 300) {
                    scrollToTopBtn.classList.add('visible');
                } else {
                    scrollToTopBtn.classList.remove('visible');
                }
            }
            
            if (header) {
                // Agregar clase cuando se hace scroll
                if (scrollTop > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
                
                // Efecto de ocultación al scroll hacia abajo (opcional)
                // if (scrollTop > lastScrollTop && scrollTop > 200) {
                //     header.style.transform = 'translateY(-100%)';
                // } else {
                //     header.style.transform = 'translateY(0)';
                // }
            }
            
            lastScrollTop = scrollTop;
        });
    }

    // Efectos interactivos
    addInteractiveEffects() {
        this.setupHoverEffects();
        this.setupClickEffects();
        this.setupKeyboardNavigation();
    }

    // Efectos hover mejorados
    setupHoverEffects() {
        // Efecto de brillo en botones
        document.querySelectorAll('.btn-claim').forEach(btn => {
            btn.addEventListener('mouseenter', (e) => {
                this.createSparkle(e.target);
            });
        });

        // Efecto de ondas en tarjetas
        document.querySelectorAll('.reward-card').forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                this.createRipple(e.target, e);
            });
        });
    }

    // Crear efecto de brillo
    createSparkle(element) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle-effect';
        sparkle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: #fff;
            border-radius: 50%;
            pointer-events: none;
            animation: sparkleAnim 0.6s ease-out forwards;
        `;
        
        const rect = element.getBoundingClientRect();
        sparkle.style.left = Math.random() * rect.width + 'px';
        sparkle.style.top = Math.random() * rect.height + 'px';
        
        element.style.position = 'relative';
        element.appendChild(sparkle);
        
        setTimeout(() => sparkle.remove(), 600);
    }

    // Crear efecto de ondas
    createRipple(element, event) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(212, 175, 55, 0.1);
            transform: scale(0);
            animation: rippleAnim 0.6s ease-out;
            pointer-events: none;
            z-index: 1;
        `;
        
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    // Efectos de click
    setupClickEffects() {
        document.querySelectorAll('.btn-claim, .btn-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.createClickEffect(e.target, e);
            });
        });
    }

    // Efecto de click
    createClickEffect(element, event) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = '';
        }, 150);
    }

    // Navegación por teclado
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideLoading();
            }
        });
    }

    // Mostrar loading con animación mejorada
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.opacity = '0';
            
            requestAnimationFrame(() => {
                overlay.style.transition = 'opacity 0.3s ease-in-out';
                overlay.style.opacity = '1';
            });

            // Agregar efecto de partículas de fondo
            this.createLoadingParticles(overlay);
        }
    }

    // Ocultar loading
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }

    // Crear partículas de loading
    createLoadingParticles(container) {
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'loading-particle';
            particle.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: rgba(212, 175, 55, 0.6);
                border-radius: 50%;
                animation: floatParticle ${2 + Math.random() * 3}s infinite ease-in-out;
                animation-delay: ${Math.random() * 2}s;
            `;
            
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            
            container.appendChild(particle);
            
            // Limpiar partículas después de un tiempo
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 10000);
        }
    }

    // Efecto de notificación toast
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#d4af37'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        `;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes sparkleAnim {
        0% { opacity: 1; transform: scale(0) rotate(0deg); }
        100% { opacity: 0; transform: scale(1) rotate(180deg); }
    }
    
    @keyframes rippleAnim {
        0% { transform: scale(0); opacity: 0.6; }
        100% { transform: scale(1); opacity: 0; }
    }
    
    @keyframes floatParticle {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
`;
document.head.appendChild(style);

// Inicializar sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.rewardSystem = new RewardClaimSystem();
});

// Sobrescribir funciones globales para usar el sistema mejorado
window.showLoading = () => window.rewardSystem?.showLoading();
window.hideLoading = () => window.rewardSystem?.hideLoading();
window.showToast = (message, type) => window.rewardSystem?.showToast(message, type);

// Función global para scroll to top
window.scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

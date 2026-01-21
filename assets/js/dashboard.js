/**
 * Dashboard JavaScript - Einherjer Blitz 3.0
 * Mobile-First con navegación mejorada y efectos premium
 */

class DashboardManager {
    constructor() {
        this.isMobile = window.innerWidth < 768;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.init();
    }

    init() {
        this.createParticles();
        this.setupAnimations();
        this.setupInteractions();
        this.setupProgressBar();
        this.setupKeyboardShortcuts();
        this.setupSwipeGestures();
        this.bindEvents();
    }

    // Crear partículas de fondo
    createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;

        const count = this.isMobile ? 10 : 20;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'dashboard-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = (Math.random() * 4 + 2) + 'px';
            particle.style.height = particle.style.width;
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (Math.random() * 20 + 20) + 's';
            container.appendChild(particle);
        }
    }

    // Configurar animaciones de entrada
    setupAnimations() {
        // Las animaciones CSS se encargan del delay escalonado
        // Solo verificar que existan los elementos
        const elements = document.querySelectorAll('.stat-card, .nav-card');
        elements.forEach(el => {
            el.style.willChange = 'transform, opacity';
        });

        // Limpiar will-change después de las animaciones
        setTimeout(() => {
            elements.forEach(el => {
                el.style.willChange = 'auto';
            });
        }, 2000);
    }

    // Configurar barra de progreso
    setupProgressBar() {
        requestAnimationFrame(() => {
            const progressFill = document.querySelector('.progress-fill');
            if (progressFill) {
                const targetWidth = progressFill.style.width || '0%';
                progressFill.style.width = '0%';

                setTimeout(() => {
                    progressFill.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    progressFill.style.width = targetWidth;
                }, 500);
            }
        });
    }

    // Configurar interacciones
    setupInteractions() {
        // Solo hover effects en desktop
        if (!this.isMobile) {
            document.querySelectorAll('.stat-card, .nav-card:not(.disabled)').forEach(card => {
                card.addEventListener('mouseenter', this.handleCardHover.bind(this));
                card.addEventListener('mouseleave', this.handleCardLeave.bind(this));
            });
        }

        // Touch feedback para móvil
        if (this.isMobile) {
            document.querySelectorAll('.stat-card, .nav-card, .action-btn, .bottom-nav-item').forEach(el => {
                el.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
                el.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
            });
        }

        // Phrase input character counter
        const phraseInput = document.getElementById('phraseInput');
        if (phraseInput) {
            phraseInput.addEventListener('input', () => {
                updateCharCount();
                const previewPhrase = document.getElementById('previewPhrase');
                if (previewPhrase) {
                    previewPhrase.textContent = phraseInput.value || 'Guerrero de Einherjer';
                }
            });
        }
    }

    // Configurar atajos de teclado (solo desktop)
    setupKeyboardShortcuts() {
        if (this.isMobile) return;

        document.addEventListener('keydown', (e) => {
            // No ejecutar si hay un input activo
            if (document.activeElement.tagName === 'INPUT' ||
                document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            const shortcuts = {
                'j': 'seleccion.php',      // Jugar
                't': 'tienda/tienda.php',  // Tienda
                'g': 'gacha/index.php',    // Gacha/Cofres
                'e': 'estadisticas.php',   // Estadísticas
                'o': 'online/index.php',   // Online
                'a': 'AR-12/index.php',    // AR-12 Chat
                'p': () => openProfileModal() // Perfil
            };

            const action = shortcuts[e.key.toLowerCase()];
            if (action) {
                e.preventDefault();
                if (typeof action === 'function') {
                    action();
                } else {
                    navigateTo(action);
                }
            }

            // ESC para cerrar modales
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    bootstrap.Modal.getInstance(openModal)?.hide();
                }
            }
        });
    }

    // Gestos swipe para móvil
    setupSwipeGestures() {
        if (!this.isMobile) return;

        const main = document.querySelector('main');
        if (!main) return;

        main.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        main.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Swipe horizontal significativo
            if (Math.abs(deltaX) > 100 && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 0) {
                    // Swipe derecha - ir atrás
                    history.back();
                }
            }
        }, { passive: true });
    }

    // Eventos
    bindEvents() {
        // Resize handler con debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.isMobile = window.innerWidth < 768;
            }, 250);
        });

        // Visibility change - pausar/reanudar animaciones
        document.addEventListener('visibilitychange', () => {
            const particles = document.querySelectorAll('.dashboard-particle');
            particles.forEach(p => {
                p.style.animationPlayState = document.hidden ? 'paused' : 'running';
            });
        });
    }

    // Manejadores de eventos
    handleCardHover(event) {
        const card = event.currentTarget;
        const icon = card.querySelector('.stat-icon, .nav-icon');

        card.style.transform = 'translateY(-8px) scale(1.02)';

        if (icon) {
            icon.style.transition = 'transform 0.3s ease';
            icon.style.transform = 'scale(1.15)';
        }
    }

    handleCardLeave(event) {
        const card = event.currentTarget;
        const icon = card.querySelector('.stat-icon, .nav-icon');

        card.style.transform = '';

        if (icon) {
            icon.style.transform = '';
        }
    }

    handleTouchStart(event) {
        const el = event.currentTarget;
        el.style.transform = 'scale(0.97)';
        el.style.opacity = '0.9';

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    handleTouchEnd(event) {
        const el = event.currentTarget;
        el.style.transform = '';
        el.style.opacity = '';
    }

    // Sistema de toasts
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        document.querySelectorAll('.toast-notification').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;

        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };

        const colors = {
            success: 'rgba(34, 197, 94, 0.95)',
            error: 'rgba(239, 68, 68, 0.95)',
            warning: 'rgba(245, 158, 11, 0.95)',
            info: 'rgba(59, 130, 246, 0.95)'
        };

        toast.innerHTML = `
            <i class="fas fa-${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;

        Object.assign(toast.style, {
            position: 'fixed',
            top: this.isMobile ? '10px' : '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-100px)',
            background: colors[type] || colors.info,
            color: 'white',
            padding: '0.875rem 1.25rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            maxWidth: '90vw'
        });

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Auto-remove
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(-100px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    showSuccessToast(message) { this.showToast(message, 'success'); }
    showErrorToast(message) { this.showToast(message, 'error'); }
    showWarningToast(message) { this.showToast(message, 'warning'); }

    // Dialog de confirmación
    async showConfirmDialog(title, message, type = 'warning') {
        return new Promise((resolve) => {
            const icons = {
                warning: 'exclamation-triangle',
                info: 'info-circle',
                danger: 'exclamation-circle'
            };

            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(5px);
                padding: 1rem;
            `;

            overlay.innerHTML = `
                <div class="custom-modal" style="
                    background: #151515;
                    border: 1px solid rgba(201, 170, 113, 0.3);
                    border-radius: 16px;
                    max-width: 380px;
                    width: 100%;
                    overflow: hidden;
                    animation: fadeInScale 0.3s ease;
                ">
                    <div class="modal-header" style="
                        background: linear-gradient(135deg, #1a1a1a, #252525);
                        padding: 1.25rem;
                        border-bottom: 1px solid rgba(201, 170, 113, 0.3);
                    ">
                        <h3 style="
                            margin: 0;
                            color: #c9aa71;
                            font-family: 'Cinzel', serif;
                            font-size: 1.1rem;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                        ">
                            <i class="fas fa-${icons[type] || icons.warning}"></i>
                            ${title}
                        </h3>
                    </div>
                    <div class="modal-body" style="padding: 1.5rem;">
                        <p style="margin: 0; color: rgba(255,255,255,0.9); line-height: 1.5;">${message}</p>
                    </div>
                    <div class="modal-footer" style="
                        padding: 1rem 1.25rem;
                        background: rgba(26, 26, 26, 0.5);
                        display: flex;
                        justify-content: flex-end;
                        gap: 0.75rem;
                    ">
                        <button class="btn-cancel" style="
                            padding: 0.625rem 1.25rem;
                            border-radius: 8px;
                            border: 1px solid rgba(201, 170, 113, 0.3);
                            background: transparent;
                            color: rgba(255,255,255,0.8);
                            cursor: pointer;
                            font-size: 0.9rem;
                            transition: all 0.2s ease;
                        ">Cancelar</button>
                        <button class="btn-confirm" style="
                            padding: 0.625rem 1.25rem;
                            border-radius: 8px;
                            border: none;
                            background: linear-gradient(135deg, #c9aa71, #9e8b54);
                            color: #0a0a0a;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 0.9rem;
                            transition: all 0.2s ease;
                        ">Confirmar</button>
                    </div>
                </div>
            `;

            const closeModal = (result) => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.2s ease';
                setTimeout(() => overlay.remove(), 200);
                resolve(result);
            };

            overlay.querySelector('.btn-cancel').onclick = () => closeModal(false);
            overlay.querySelector('.btn-confirm').onclick = () => closeModal(true);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal(false);
            });

            document.body.appendChild(overlay);
        });
    }

    // Logout
    async logout() {
        const confirmed = await this.showConfirmDialog(
            '¿Cerrar Sesión?',
            '¿Estás seguro de que quieres salir del reino?',
            'warning'
        );

        if (confirmed) {
            this.showToast('Cerrando sesión...', 'info', 2000);

            try {
                await fetch('logout.php', { method: 'POST' });

                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate([50, 50, 50]);
                }

                setTimeout(() => {
                    window.location.href = 'index.php';
                }, 800);
            } catch (error) {
                console.error('Error:', error);
                window.location.href = 'index.php';
            }
        }
    }
}

// ========================================
// FUNCIONES GLOBALES
// ========================================

let dashboardManager;
let profileModal = null;
let selectedAvatar = null;

// Inicializar
document.addEventListener('DOMContentLoaded', function () {
    dashboardManager = new DashboardManager();
    window.dashboardManager = dashboardManager;

    // Inicializar selección de avatar
    selectedAvatar = window.userData?.avatar || 'default.jpg';

    console.log('🎮 Dashboard Einherjer Blitz 3.0');
    console.log('📱 Mobile:', window.innerWidth < 768 ? 'Sí' : 'No');
});

// Logout global
async function logout() {
    if (dashboardManager) {
        await dashboardManager.logout();
    }
}

// Navegación
function navigateTo(url) {
    // Haptic feedback en móvil
    if (navigator.vibrate) {
        navigator.vibrate(15);
    }
    window.location.href = url;
}

// Notificaciones (placeholder)
function showNotifications() {
    if (dashboardManager) {
        dashboardManager.showToast('No hay notificaciones nuevas', 'info');
    }
}

// Abrir modal de perfil
function openProfileModal() {
    profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
    profileModal.show();
    updateCharCount();
}

// Seleccionar avatar
function selectAvatar(element) {
    document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.classList.remove('active');
    });

    element.classList.add('active');
    selectedAvatar = element.dataset.avatar;

    // Actualizar preview
    const previewAvatar = document.getElementById('previewAvatar');
    if (previewAvatar) {
        previewAvatar.src = 'images/' + selectedAvatar;
    }

    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

// Actualizar contador de caracteres
function updateCharCount() {
    const phraseInput = document.getElementById('phraseInput');
    const charCount = document.getElementById('charCount');
    if (phraseInput && charCount) {
        charCount.textContent = phraseInput.value.length;
    }
}

// Guardar perfil
async function saveProfile() {
    const phraseInput = document.getElementById('phraseInput');
    const phrase = phraseInput?.value.trim() || '';
    const saveBtn = document.getElementById('saveProfileBtn');

    if (!selectedAvatar) {
        dashboardManager?.showToast('Selecciona un avatar', 'warning');
        return;
    }

    // Loading state
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    }

    try {
        const response = await fetch('api/update_profile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update_profile',
                avatar: selectedAvatar,
                phrase: phrase
            })
        });

        const data = await response.json();

        if (data.success) {
            dashboardManager?.showSuccessToast('¡Perfil actualizado!');

            // Update UI immediately
            const headerAvatar = document.getElementById('headerAvatar');
            const welcomeSubtitle = document.querySelector('.welcome-subtitle');

            if (headerAvatar) headerAvatar.src = 'images/' + selectedAvatar;
            if (welcomeSubtitle) welcomeSubtitle.textContent = phrase || 'Guerrero de Einherjer';

            // Close modal
            if (profileModal) {
                profileModal.hide();
            }

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([50, 100, 50]);
            }
        } else {
            dashboardManager?.showErrorToast(data.message || 'Error al guardar');
        }
    } catch (error) {
        console.error('Error:', error);
        dashboardManager?.showErrorToast('Error de conexión');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save me-1"></i>Guardar';
        }
    }
}

// Notificación global (compatibilidad)
function showNotification(message, type = 'info') {
    if (dashboardManager) {
        dashboardManager.showToast(message, type);
    }
}

// CSS adicional para animaciones
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes fadeInScale {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .toast-notification {
        font-family: 'Inter', sans-serif;
    }
    
    .btn-cancel:hover {
        background: rgba(255, 255, 255, 0.1) !important;
    }
    
    .btn-confirm:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(201, 170, 113, 0.3);
    }
    
    /* Stat card click effect */
    .stat-card[onclick] {
        cursor: pointer;
    }
    
    /* Bottom nav active state */
    .bottom-nav-item:active {
        transform: scale(0.95);
    }
    
    /* Smooth scroll for the whole page */
    html {
        scroll-behavior: smooth;
    }
    
    /* Better focus states */
    .nav-card:focus-visible,
    .action-btn:focus-visible,
    .bottom-nav-item:focus-visible {
        outline: 2px solid #c9aa71;
        outline-offset: 2px;
    }
`;
document.head.appendChild(additionalStyles);

/**
 * Dashboard JavaScript - Einherjer Blitz 3.0
 * Sistema mejorado con Bootstrap y efectos visuales
 */

class DashboardManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupAnimations();
        this.setupInteractions();
        this.setupProgressBar();
        this.bindEvents();
    }

    // Configurar animaciones de entrada
    setupAnimations() {
        // Animar las tarjetas de estadísticas con delay escalonado
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });

        // Animar tarjetas de navegación
        setTimeout(() => {
            const navCards = document.querySelectorAll('.nav-card');
            navCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'all 0.6s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 50);
            });
        }, 300);
    }

    // Configurar barra de progreso
    setupProgressBar() {
        setTimeout(() => {
            const progressFill = document.querySelector('.progress-fill');
            if (progressFill) {
                const targetWidth = progressFill.style.width;
                progressFill.style.width = '0%';
                
                setTimeout(() => {
                    progressFill.style.transition = 'width 1.5s ease';
                    progressFill.style.width = targetWidth;
                }, 100);
            }
        }, 800);
    }

    // Configurar interacciones
    setupInteractions() {
        // Efectos de hover mejorados para tarjetas
        document.querySelectorAll('.stat-card, .nav-card:not(.disabled)').forEach(card => {
            card.addEventListener('mouseenter', this.handleCardHover.bind(this));
            card.addEventListener('mouseleave', this.handleCardLeave.bind(this));
        });

        // Efectos para botones de acción
        document.querySelectorAll('.action-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('mouseenter', this.handleButtonHover.bind(this));
            btn.addEventListener('mouseleave', this.handleButtonLeave.bind(this));
        });

        // Efecto de click para elementos interactivos
        document.querySelectorAll('.stat-card, .nav-card:not(.disabled), .action-btn:not(.disabled)').forEach(element => {
            element.addEventListener('click', this.handleElementClick.bind(this));
        });
    }

    // Eventos
    bindEvents() {
        // Responsive behavior
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Scroll effects
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyNavigation.bind(this));
    }

    // Manejadores de eventos
    handleCardHover(event) {
        const card = event.currentTarget;
        card.style.transform = 'translateY(-8px) scale(1.02)';
        card.style.boxShadow = '0 20px 40px rgba(201, 170, 113, 0.3)';
        
        // Agregar brillo al icono
        const icon = card.querySelector('.stat-icon, .nav-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1)';
            icon.style.filter = 'drop-shadow(0 0 10px var(--glow-gold))';
        }
    }

    handleCardLeave(event) {
        const card = event.currentTarget;
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = '';
        
        // Restaurar icono
        const icon = card.querySelector('.stat-icon, .nav-icon');
        if (icon) {
            icon.style.transform = 'scale(1)';
            icon.style.filter = '';
        }
    }

    handleButtonHover(event) {
        const button = event.currentTarget;
        button.style.transform = 'translateY(-3px) scale(1.05)';
        
        const icon = button.querySelector('i');
        if (icon) {
            icon.style.transform = 'scale(1.2) rotate(5deg)';
        }
    }

    handleButtonLeave(event) {
        const button = event.currentTarget;
        button.style.transform = 'translateY(0) scale(1)';
        
        const icon = button.querySelector('i');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    }

    handleElementClick(event) {
        const element = event.currentTarget;
        
        // Efecto de ripple
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(201, 170, 113, 0.4)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.marginLeft = '-10px';
        ripple.style.marginTop = '-10px';
        ripple.style.pointerEvents = 'none';
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    handleResize() {
        // Ajustar animaciones en móvil
        if (window.innerWidth < 768) {
            document.querySelectorAll('.stat-card, .nav-card').forEach(card => {
                card.style.transform = 'none';
            });
        }
    }

    handleScroll() {
        // Parallax effect suave para el header
        const header = document.querySelector('.dashboard-header');
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (header && scrolled < 200) {
            header.style.transform = `translate3d(0, ${rate}px, 0)`;
        }
    }

    handleKeyNavigation(event) {
        // Navegación con teclado
        if (event.key === 'Tab') {
            // Resaltar elemento enfocado
            setTimeout(() => {
                const focused = document.activeElement;
                if (focused.classList.contains('nav-card') || 
                    focused.classList.contains('action-btn')) {
                    focused.style.outline = '2px solid var(--primary-gold)';
                    focused.style.outlineOffset = '2px';
                }
            }, 10);
        }
    }

    // Función de logout mejorada
    async logout() {
        // Mostrar confirmación con SweetAlert-style
        const result = await this.showConfirmDialog(
            '¿Cerrar Sesión?',
            '¿Estás seguro de que quieres salir del juego?',
            'warning'
        );

        if (result) {
            // Mostrar loading
            this.showLoadingToast('Cerrando sesión...');
            
            try {
                const response = await fetch('logout.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    this.showSuccessToast('¡Hasta la próxima batalla!');
                    setTimeout(() => {
                        window.location.href = 'index.php';
                    }, 1000);
                } else {
                    throw new Error('Error en el servidor');
                }
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                this.showErrorToast('Error al cerrar sesión');
                // Redirigir de todas formas por seguridad
                setTimeout(() => {
                    window.location.href = 'index.php';
                }, 1500);
            }
        }
    }

    // Sistema de notificaciones tipo toast
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Estilos del toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 
                       type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                       type === 'warning' ? 'rgba(245, 158, 11, 0.9)' :
                       'rgba(59, 130, 246, 0.9)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        });

        document.body.appendChild(toast);
        
        // Animar entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remover
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    }

    showSuccessToast(message) {
        this.showToast(message, 'success');
    }

    showErrorToast(message) {
        this.showToast(message, 'error');
    }

    showLoadingToast(message) {
        this.showToast(message, 'info', 5000);
    }

    getToastIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-triangle';
            case 'warning': return 'exclamation-circle';
            default: return 'info-circle';
        }
    }

    // Dialog de confirmación personalizado
    async showConfirmDialog(title, message, type = 'info') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'custom-modal-overlay';
            modal.innerHTML = `
                <div class="custom-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-${this.getToastIcon(type)}"></i> ${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary me-2" onclick="resolveModal(false)">Cancelar</button>
                        <button class="btn btn-primary" onclick="resolveModal(true)">Confirmar</button>
                    </div>
                </div>
            `;
            
            // Estilos del modal
            Object.assign(modal.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '10000',
                backdropFilter: 'blur(5px)'
            });

            // Agregar función global temporal
            window.resolveModal = (result) => {
                modal.remove();
                delete window.resolveModal;
                resolve(result);
            };

            document.body.appendChild(modal);
        });
    }

    // Actualizar estadísticas en tiempo real
    updateStatCard(cardSelector, newValue, animate = true) {
        const card = document.querySelector(cardSelector);
        if (!card) return;

        const valueElement = card.querySelector('.stat-value');
        if (!valueElement) return;

        if (animate) {
            // Animación de incremento
            const currentValue = parseInt(valueElement.textContent.replace(/,/g, ''));
            const targetValue = parseInt(newValue);
            const duration = 1000;
            const steps = 30;
            const increment = (targetValue - currentValue) / steps;
            
            let current = currentValue;
            let step = 0;
            
            const timer = setInterval(() => {
                step++;
                current += increment;
                
                if (step >= steps) {
                    current = targetValue;
                    clearInterval(timer);
                }
                
                valueElement.textContent = Math.round(current).toLocaleString();
            }, duration / steps);
        } else {
            valueElement.textContent = parseInt(newValue).toLocaleString();
        }
    }

    // Actualizar barra de progreso
    updateProgressBar(newProgress, animate = true) {
        const progressFill = document.querySelector('.progress-fill');
        if (!progressFill) return;

        if (animate) {
            progressFill.style.transition = 'width 1.5s ease';
        }
        
        progressFill.style.width = newProgress + '%';
    }
}

// Función global para mantener compatibilidad
async function logout() {
    if (window.dashboardManager) {
        await window.dashboardManager.logout();
    }
}

// Inicializar dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Crear instancia global del dashboard
    window.dashboardManager = new DashboardManager();
    
    // Agregar estilos CSS para las animaciones
    const styles = document.createElement('style');
    styles.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .custom-modal {
            background: var(--bg-card);
            border: 1px solid var(--border-gold);
            border-radius: 15px;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            color: var(--text-primary);
        }
        
        .custom-modal .modal-header h3 {
            color: var(--primary-gold);
            margin: 0;
            font-family: 'Cinzel', serif;
        }
        
        .custom-modal .modal-body {
            margin: 1.5rem 0;
        }
        
        .custom-modal .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }
        
        .btn-secondary {
            background: rgba(108, 117, 125, 0.2) !important;
            border: 1px solid rgba(108, 117, 125, 0.5) !important;
            color: var(--text-secondary) !important;
        }
        
        .btn-secondary:hover {
            background: rgba(108, 117, 125, 0.3) !important;
            color: var(--text-primary) !important;
        }
        
        .btn-primary {
            background: linear-gradient(45deg, var(--primary-gold), var(--dark-gold)) !important;
            border: none !important;
            color: var(--bg-dark) !important;
        }
    `;
    document.head.appendChild(styles);
    
    console.log('🎮 Dashboard Einherjer Blitz 3.0 iniciado');
    console.log('📊 Sistema de estadísticas activo');
    console.log('🎨 Efectos visuales mejorados');
});

// ========================================
// PROFILE EDIT MODAL SYSTEM
// ========================================

let selectedAvatar = null;
let profileModal = null;

// Abrir modal de perfil
function openProfileModal() {
    profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
    profileModal.show();
    
    // Inicializar selección de avatar
    initAvatarSelection();
    updateCharCount();
}

// Inicializar sistema de selección de avatares
function initAvatarSelection() {
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const previewAvatar = document.getElementById('previewAvatar');
    const phraseInput = document.getElementById('phraseInput');
    const previewPhrase = document.getElementById('previewPhrase');
    
    // Obtener avatar actual
    selectedAvatar = document.querySelector('.avatar-option.active')?.dataset.avatar;
    
    // Click en avatar
    avatarOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remover activo de todos
            avatarOptions.forEach(opt => opt.classList.remove('active'));
            
            // Activar seleccionado
            this.classList.add('active');
            selectedAvatar = this.dataset.avatar;
            
            // Actualizar preview
            previewAvatar.src = 'images/' + selectedAvatar;
        });
    });
    
    // Actualizar preview de frase en tiempo real
    phraseInput.addEventListener('input', function() {
        previewPhrase.textContent = this.value || 'Guerrero de Einherjer';
        updateCharCount();
    });
}

// Actualizar contador de caracteres
function updateCharCount() {
    const phraseInput = document.getElementById('phraseInput');
    const charCount = document.getElementById('charCount');
    if (phraseInput && charCount) {
        charCount.textContent = phraseInput.value.length;
    }
}

// Guardar cambios de perfil
async function saveProfile() {
    const phraseInput = document.getElementById('phraseInput');
    const phrase = phraseInput.value.trim();
    
    if (!selectedAvatar) {
        showNotification('Selecciona un avatar', 'error');
        return;
    }
    
    try {
        const response = await fetch('api/update_profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update_profile',
                avatar: selectedAvatar,
                phrase: phrase
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Perfil actualizado correctamente', 'success');
            
            // Actualizar UI
            document.querySelector('.user-avatar').src = 'images/' + data.avatar;
            document.querySelector('.welcome-subtitle').textContent = data.phrase;
            
            // Cerrar modal
            if (profileModal) {
                profileModal.hide();
            }
            
            // Recargar después de 1 segundo
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            showNotification(data.message || 'Error al actualizar perfil', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión', 'error');
    }
}

// Sistema de notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} position-fixed top-0 start-50 translate-middle-x mt-3`;
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.style.textAlign = 'center';
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

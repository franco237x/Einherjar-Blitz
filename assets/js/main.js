/**
 * Einherjer Blitz 3.0 - JavaScript Principal
 * Sistema de autenticación y efectos visuales
 */

class EinherjerAuth {
    constructor() {
        this.init();
    }

    init() {
        // Inicializar efectos visuales
        this.createParticles();
        this.initAnimations();
        
        // Eventos
        this.bindEvents();
        
        // Inicializar AOS (Animate On Scroll)
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true,
                offset: 100
            });
        }
    }

    // Crear partículas flotantes
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        const particleCount = window.innerWidth < 768 ? 30 : 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // Inicializar animaciones
    initAnimations() {
        // Animación de entrada del body
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transition = 'opacity 1s ease';
            document.body.style.opacity = '1';
        }, 100);
    }

    // Eventos
    bindEvents() {
        // Evento para redimensionar ventana
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    // Manejar redimensionamiento
    handleResize() {
        // Recrear partículas si es necesario
        const particlesContainer = document.getElementById('particles');
        if (particlesContainer && window.innerWidth < 768 && particlesContainer.children.length > 30) {
            // Remover partículas extras en móvil
            while (particlesContainer.children.length > 30) {
                particlesContainer.removeChild(particlesContainer.lastChild);
            }
        }
    }

    // Mostrar alerta
    showAlert(message, type = 'danger', containerId = 'alertContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        alertElement.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        container.innerHTML = '';
        container.appendChild(alertElement);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, 5000);
    }

    // Limpiar alertas
    clearAlerts(containerId = 'alertContainer') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }

    // Manejar login
    async handleLogin(event, isMobile = false) {
        event.preventDefault();
        
        const formPrefix = isMobile ? 'mobile' : '';
        const btnId = `${formPrefix}LoginBtn`;
        const spinnerId = `${formPrefix}LoginSpinner`;
        const alertContainer = isMobile ? 'mobileAlertContainer' : 'alertContainer';
        
        const loginBtn = document.getElementById(btnId);
        const loginSpinner = document.getElementById(spinnerId);
        const formData = new FormData(event.target);
        
        // Agregar campos adicionales
        formData.append('action', 'login');
        const useUniqueIdField = document.getElementById(isMobile ? 'mobileUseUniqueId' : 'useUniqueId');
        formData.append('use_unique_id', useUniqueIdField.checked);

        // Mostrar loading
        this.setLoading(loginBtn, loginSpinner, true);
        this.clearAlerts(alertContainer);

        try {
            const response = await fetch('index.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('¡Bienvenido de vuelta, guerrero! Redirigiendo...', 'success', alertContainer);
                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 1500);
            } else {
                this.showAlert(result.message, 'danger', alertContainer);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error de conexión. Por favor, inténtalo de nuevo.', 'danger', alertContainer);
        } finally {
            this.setLoading(loginBtn, loginSpinner, false);
        }
    }

    // Manejar registro
    async handleRegister(event, isMobile = false) {
        event.preventDefault();
        
        const formPrefix = isMobile ? 'mobile' : '';
        const btnId = `${formPrefix}RegisterBtn`;
        const spinnerId = `${formPrefix}RegisterSpinner`;
        const alertContainer = isMobile ? 'mobileAlertContainer' : 'alertContainer';
        
        const registerBtn = document.getElementById(btnId);
        const registerSpinner = document.getElementById(spinnerId);
        const formData = new FormData(event.target);
        
        formData.append('action', 'register');

        // Mostrar loading
        this.setLoading(registerBtn, registerSpinner, true);
        this.clearAlerts(alertContainer);

        try {
            const response = await fetch('index.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(
                    `¡Cuenta creada exitosamente! Tu ID único es: <strong>${result.unique_id}</strong>. Guárdalo bien, lo necesitarás para iniciar sesión.`, 
                    'success', 
                    alertContainer
                );
                
                // Cambiar a tab de login después de 3 segundos
                setTimeout(() => {
                    if (isMobile) {
                        this.switchMobileTab('login');
                        document.querySelector('#mobileLoginForm [name="username"]').value = formData.get('reg_username');
                    } else {
                        this.switchTab('login');
                        document.querySelector('#loginForm [name="username"]').value = formData.get('reg_username');
                    }
                }, 3000);
            } else {
                this.showAlert(result.message, 'danger', alertContainer);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error de conexión. Por favor, inténtalo de nuevo.', 'danger', alertContainer);
        } finally {
            this.setLoading(registerBtn, registerSpinner, false);
        }
    }

    // Configurar estado de loading
    setLoading(button, spinner, isLoading) {
        if (button) {
            button.disabled = isLoading;
        }
        if (spinner) {
            if (isLoading) {
                spinner.classList.remove('d-none');
            } else {
                spinner.classList.add('d-none');
            }
        }
    }

    // Cambiar tab (desktop)
    switchTab(tabName) {
        // Activar tab
        const tabs = document.querySelectorAll('#authTabs .nav-link');
        tabs.forEach(tab => tab.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Mostrar contenido
        const contents = document.querySelectorAll('#authTabContent .tab-pane');
        contents.forEach(content => {
            content.classList.remove('show', 'active');
        });
        document.getElementById(`${tabName}-content`).classList.add('show', 'active');

        this.clearAlerts('alertContainer');
    }

    // Cambiar tab (móvil)
    switchMobileTab(tabName) {
        // Activar tab
        const tabs = document.querySelectorAll('#mobileAuthTabs .nav-link');
        tabs.forEach(tab => tab.classList.remove('active'));
        document.getElementById(`mobile-${tabName}-tab`).classList.add('active');

        // Mostrar contenido
        const contents = document.querySelectorAll('#mobileAuthTabContent .tab-pane');
        contents.forEach(content => {
            content.classList.remove('show', 'active');
        });
        document.getElementById(`mobile-${tabName}-content`).classList.add('show', 'active');

        this.clearAlerts('mobileAlertContainer');
    }
}

// Funciones globales (para mantener compatibilidad con el HTML)
let authSystem;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    authSystem = new EinherjerAuth();
});

// Funciones de utilidad
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling.querySelector('i');
    
    if (field.type === 'password') {
        field.type = 'text';
        button.className = 'fas fa-eye-slash';
    } else {
        field.type = 'password';
        button.className = 'fas fa-eye';
    }
}

function togglePasswordMode() {
    const useUniqueId = document.getElementById('useUniqueId').checked;
    const passwordLabel = document.getElementById('passwordLabel');
    const passwordField = document.getElementById('passwordField');

    if (useUniqueId) {
        passwordLabel.innerHTML = '<i class="fas fa-fingerprint me-1"></i> ID Único';
        passwordField.placeholder = 'Ingresa tu ID único';
    } else {
        passwordLabel.innerHTML = '<i class="fas fa-lock me-1"></i> Contraseña';
        passwordField.placeholder = 'Tu contraseña';
    }
}

function toggleMobilePasswordMode() {
    const useUniqueId = document.getElementById('mobileUseUniqueId').checked;
    const passwordLabel = document.getElementById('mobilePasswordLabel');
    const passwordField = document.getElementById('mobilePasswordField');

    if (useUniqueId) {
        passwordLabel.innerHTML = '<i class="fas fa-fingerprint me-1"></i> ID Único';
        passwordField.placeholder = 'Ingresa tu ID único';
    } else {
        passwordLabel.innerHTML = '<i class="fas fa-lock me-1"></i> Contraseña';
        passwordField.placeholder = 'Tu contraseña';
    }
}

function showMobileAuth() {
    const modal = new bootstrap.Modal(document.getElementById('mobileAuthModal'));
    modal.show();
}

// Handlers de formularios
function handleLogin(event) {
    return authSystem.handleLogin(event, false);
}

function handleRegister(event) {
    return authSystem.handleRegister(event, false);
}

function handleMobileLogin(event) {
    return authSystem.handleLogin(event, true);
}

function handleMobileRegister(event) {
    return authSystem.handleRegister(event, true);
}

// Efectos adicionales
document.addEventListener('DOMContentLoaded', function() {
    // Efecto parallax suave en el scroll
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.animated-bg');
        const speed = scrolled * 0.5;
        
        if (parallax) {
            parallax.style.transform = `translate3d(0, ${speed}px, 0)`;
        }
        
        ticking = false;
    }
    
    function requestParallaxUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestParallaxUpdate);
    
    // Efecto de hover en las tarjetas
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Validación en tiempo real para formularios
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        field.addEventListener('input', function() {
            const password = this.value;
            const isValid = password.length >= 6;
            
            if (password.length > 0) {
                if (isValid) {
                    this.classList.add('is-valid');
                    this.classList.remove('is-invalid');
                } else {
                    this.classList.add('is-invalid');
                    this.classList.remove('is-valid');
                }
            } else {
                this.classList.remove('is-valid', 'is-invalid');
            }
        });
    });
    
    // Confirmar contraseña
    const confirmFields = document.querySelectorAll('input[name="reg_confirm_password"]');
    confirmFields.forEach(field => {
        field.addEventListener('input', function() {
            const password = this.form.querySelector('input[name="reg_password"]').value;
            const confirm = this.value;
            
            if (confirm.length > 0) {
                if (password === confirm) {
                    this.classList.add('is-valid');
                    this.classList.remove('is-invalid');
                } else {
                    this.classList.add('is-invalid');
                    this.classList.remove('is-valid');
                }
            } else {
                this.classList.remove('is-valid', 'is-invalid');
            }
        });
    });
});

// Utilidades para depuración
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🛡️ Einherjer Blitz 3.0 - Modo Desarrollo');
    console.log('📱 Responsive:', window.innerWidth < 768 ? 'Móvil' : 'Desktop');
    console.log('🎨 Tema:', 'Oscuro con acentos dorados');
}

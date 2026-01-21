/**
 * Einherjer Blitz 3.0 - JavaScript Principal
 * Sistema de autenticación, efectos visuales y mejoras UX
 * Mobile-First Optimizado
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

        // Password strength checker
        this.initPasswordStrength();

        // Form validation
        this.initFormValidation();

        // Inicializar AOS (Animate On Scroll)
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 600,
                easing: 'ease-out',
                once: true,
                offset: 50,
                disable: 'mobile' // Disable on mobile for performance
            });
        }
    }

    // Crear partículas flotantes con runas nórdicas
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        // Reducir partículas en móvil para mejor rendimiento
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 15 : 30;
        const runeCount = isMobile ? 5 : 10;

        // Partículas normales
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.width = (Math.random() * 3 + 1) + 'px';
            particle.style.height = particle.style.width;
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (Math.random() * 15 + 15) + 's';
            particlesContainer.appendChild(particle);
        }

        // Runas flotantes (solo en desktop)
        if (!isMobile) {
            const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛈ', 'ᛇ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ'];

            for (let i = 0; i < runeCount; i++) {
                const rune = document.createElement('div');
                rune.className = 'particle-rune';
                rune.textContent = runes[Math.floor(Math.random() * runes.length)];
                rune.style.left = Math.random() * 100 + '%';
                rune.style.fontSize = (Math.random() * 1.5 + 0.8) + 'rem';
                rune.style.animationDelay = Math.random() * 20 + 's';
                rune.style.animationDuration = (Math.random() * 20 + 20) + 's';
                particlesContainer.appendChild(rune);
            }
        }
    }

    // Inicializar animaciones
    initAnimations() {
        // Fade in del body
        document.body.style.opacity = '0';
        requestAnimationFrame(() => {
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '1';
        });
    }

    // Eventos
    bindEvents() {
        // Resize handler con debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 250);
        });

        // Form submissions
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Tab change - clear alerts
        const tabButtons = document.querySelectorAll('[data-bs-toggle="pill"]');
        tabButtons.forEach(btn => {
            btn.addEventListener('shown.bs.tab', () => {
                this.clearAlerts();
            });
        });
    }

    // Manejar redimensionamiento
    handleResize() {
        const particlesContainer = document.getElementById('particles');
        if (particlesContainer && window.innerWidth < 768) {
            // Reducir partículas en móvil
            const particles = particlesContainer.querySelectorAll('.particle, .particle-rune');
            if (particles.length > 20) {
                for (let i = 20; i < particles.length; i++) {
                    particles[i].remove();
                }
            }
        }
    }

    // Password strength checker
    initPasswordStrength() {
        const passwordField = document.getElementById('regPassword');
        const strengthContainer = document.getElementById('passwordStrength');
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        const strengthLabel = document.getElementById('strengthLabel');
        const strengthHint = document.getElementById('strengthHint');

        if (!passwordField || !strengthContainer) return;

        passwordField.addEventListener('input', () => {
            const password = passwordField.value;

            if (password.length === 0) {
                strengthContainer.style.display = 'none';
                return;
            }

            strengthContainer.style.display = 'block';
            const strength = this.calculatePasswordStrength(password);

            strengthFill.className = 'strength-fill ' + strength.level;
            strengthText.className = 'strength-text ' + strength.level;
            strengthLabel.textContent = strength.label;
            strengthHint.textContent = strength.hint;
        });
    }

    calculatePasswordStrength(password) {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        score += checks.length ? 1 : 0;
        score += checks.lowercase ? 1 : 0;
        score += checks.uppercase ? 1 : 0;
        score += checks.numbers ? 1 : 0;
        score += checks.symbols ? 1 : 0;
        score += password.length >= 12 ? 1 : 0;

        if (password.length < 6) {
            return { level: 'weak', label: 'Muy débil', hint: 'Mínimo 6 caracteres' };
        } else if (score <= 2) {
            return { level: 'weak', label: 'Débil', hint: 'Añade mayúsculas y números' };
        } else if (score <= 3) {
            return { level: 'fair', label: 'Regular', hint: 'Añade símbolos especiales' };
        } else if (score <= 4) {
            return { level: 'good', label: 'Buena', hint: 'Casi perfecta' };
        } else {
            return { level: 'strong', label: 'Excelente', hint: '¡Contraseña segura!' };
        }
    }

    // Form validation
    initFormValidation() {
        // Password confirmation validation
        const confirmField = document.getElementById('regConfirmPassword');
        const passwordField = document.getElementById('regPassword');

        if (confirmField && passwordField) {
            confirmField.addEventListener('input', () => {
                const password = passwordField.value;
                const confirm = confirmField.value;

                if (confirm.length > 0) {
                    if (password === confirm) {
                        confirmField.classList.add('is-valid');
                        confirmField.classList.remove('is-invalid');
                    } else {
                        confirmField.classList.add('is-invalid');
                        confirmField.classList.remove('is-valid');
                    }
                } else {
                    confirmField.classList.remove('is-valid', 'is-invalid');
                }
            });
        }

        // Username validation
        const usernameField = document.getElementById('regUsername');
        if (usernameField) {
            usernameField.addEventListener('input', () => {
                const username = usernameField.value;
                if (username.length > 0) {
                    if (username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)) {
                        usernameField.classList.add('is-valid');
                        usernameField.classList.remove('is-invalid');
                    } else {
                        usernameField.classList.add('is-invalid');
                        usernameField.classList.remove('is-valid');
                    }
                } else {
                    usernameField.classList.remove('is-valid', 'is-invalid');
                }
            });
        }
    }

    // Mostrar alerta
    showAlert(message, type = 'danger', containerId = 'alertContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show`;
        alertElement.setAttribute('role', 'alert');

        const icon = type === 'success' ? 'check-circle' :
            type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle';

        alertElement.innerHTML = `
            <i class="fas fa-${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        `;

        container.innerHTML = '';
        container.appendChild(alertElement);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.classList.remove('show');
                setTimeout(() => alertElement.remove(), 150);
            }
        }, 5000);

        // Scroll to alert on mobile
        if (window.innerWidth < 768) {
            alertElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Limpiar alertas
    clearAlerts(containerId = 'alertContainer') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }

    // Manejar login
    async handleLogin(event) {
        event.preventDefault();

        const loginBtn = document.getElementById('loginBtn');
        const loginSpinner = document.getElementById('loginSpinner');
        const form = event.target;
        const formData = new FormData(form);

        // Agregar campos adicionales
        const useUniqueIdField = document.getElementById('useUniqueId');
        const rememberMeField = document.getElementById('rememberMe');

        formData.append('use_unique_id', useUniqueIdField?.checked ? 'true' : 'false');
        formData.append('remember_me', rememberMeField?.checked ? 'true' : 'false');

        // Mostrar loading
        this.setLoading(loginBtn, loginSpinner, true);
        this.clearAlerts();

        try {
            const response = await fetch('index.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('¡Bienvenido, guerrero! Entrando al reino...', 'success');

                // Haptic feedback on mobile if available
                if (navigator.vibrate) {
                    navigator.vibrate([50, 50, 50]);
                }

                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 1000);
            } else {
                this.showAlert(result.message, 'danger');

                // Update attempts counter if present
                if (result.attempts_remaining !== undefined) {
                    this.updateAttemptsCounter(result.attempts_remaining);
                }

                // If blocked, disable form
                if (result.blocked) {
                    this.handleRateLimitBlock(result.remaining_seconds);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error de conexión. Verifica tu internet.', 'danger');
        } finally {
            this.setLoading(loginBtn, loginSpinner, false);
        }
    }

    // Manejar registro
    async handleRegister(event) {
        event.preventDefault();

        const registerBtn = document.getElementById('registerBtn');
        const registerSpinner = document.getElementById('registerSpinner');
        const formData = new FormData(event.target);

        // Validar antes de enviar
        const password = formData.get('reg_password');
        const confirmPassword = formData.get('reg_confirm_password');

        if (password !== confirmPassword) {
            this.showAlert('Las contraseñas no coinciden', 'danger');
            return;
        }

        if (password.length < 6) {
            this.showAlert('La contraseña debe tener al menos 6 caracteres', 'danger');
            return;
        }

        // Mostrar loading
        this.setLoading(registerBtn, registerSpinner, true);
        this.clearAlerts();

        try {
            const response = await fetch('index.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }

                this.showAlert(
                    `¡Cuenta creada! Tu ID único es: <strong>${result.unique_id}</strong>. Guárdalo.`,
                    'success'
                );

                // Cambiar a tab de login después de 3 segundos
                setTimeout(() => {
                    this.switchTab('login');
                    const usernameField = document.getElementById('loginUsername');
                    if (usernameField) {
                        usernameField.value = formData.get('reg_username');
                        usernameField.focus();
                    }
                }, 3000);
            } else {
                this.showAlert(result.message, 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error de conexión. Por favor, inténtalo de nuevo.', 'danger');
        } finally {
            this.setLoading(registerBtn, registerSpinner, false);
        }
    }

    // Update attempts counter
    updateAttemptsCounter(remaining) {
        const counter = document.getElementById('attemptsCount');
        const warning = document.getElementById('rateLimitWarning');

        if (counter) {
            counter.textContent = remaining;
        }

        if (warning && remaining < 5) {
            warning.style.display = 'flex';
        }
    }

    // Handle rate limit block
    handleRateLimitBlock(seconds) {
        const loginBtn = document.getElementById('loginBtn');
        if (!loginBtn) return;

        loginBtn.disabled = true;
        loginBtn.innerHTML = `<i class="fas fa-clock me-2"></i>Espera ${seconds}s`;

        const interval = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                clearInterval(interval);
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
                this.clearAlerts();
            } else {
                loginBtn.innerHTML = `<i class="fas fa-clock me-2"></i>Espera ${seconds}s`;
            }
        }, 1000);
    }

    // Configurar estado de loading
    setLoading(button, spinner, isLoading) {
        if (button) {
            button.disabled = isLoading;
        }
        if (spinner) {
            spinner.classList.toggle('d-none', !isLoading);
        }
    }

    // Cambiar tab
    switchTab(tabName) {
        const tab = document.getElementById(`${tabName}-tab`);
        if (tab) {
            const bsTab = new bootstrap.Tab(tab);
            bsTab.show();
        }
        this.clearAlerts();
    }
}

// Funciones globales
let authSystem;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    authSystem = new EinherjerAuth();
});

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const button = field.parentElement.querySelector('button i');

    if (field.type === 'password') {
        field.type = 'text';
        if (button) button.className = 'fas fa-eye-slash';
    } else {
        field.type = 'password';
        if (button) button.className = 'fas fa-eye';
    }
}

// Toggle password mode (password/unique ID)
function togglePasswordMode() {
    const useUniqueId = document.getElementById('useUniqueId')?.checked;
    const passwordLabel = document.getElementById('passwordLabel');
    const passwordField = document.getElementById('loginPassword');

    if (passwordLabel && passwordField) {
        if (useUniqueId) {
            passwordLabel.innerHTML = '<i class="fas fa-fingerprint me-1"></i> ID Único';
            passwordField.placeholder = 'Ingresa tu ID único';
            passwordField.autocomplete = 'off';
        } else {
            passwordLabel.innerHTML = '<i class="fas fa-lock me-1"></i> Contraseña';
            passwordField.placeholder = 'Tu contraseña';
            passwordField.autocomplete = 'current-password';
        }
    }
}

// Global alert function for Google Sign-In
function showAlert(message, type = 'danger') {
    if (authSystem) {
        authSystem.showAlert(message, type);
    }
}

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW registration failed'));
    });
}

// Debug info in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🛡️ Einherjer Blitz 3.0 - Modo Desarrollo');
    console.log('📱 Viewport:', window.innerWidth + 'x' + window.innerHeight);
    console.log('🎨 Tema: Oscuro con acentos dorados');
    console.log('🔒 CSRF: Habilitado');
}

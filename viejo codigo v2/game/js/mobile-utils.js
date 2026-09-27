// ===== EINHERJAR BLITZ - MOBILE UTILITIES ===== //

class MobileUtils {
    constructor() {
        this.init();
    }

    init() {
        this.setupViewportHeight();
        this.setupTouchHandlers();
        this.setupOrientationChange();
        this.setupSafeArea();
        this.preventZoom();
        this.optimizeScrolling();
        this.registerServiceWorker();
    }

    // Configurar altura de viewport correcta para móviles
    setupViewportHeight() {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }

    // Mejorar el handling de toques
    setupTouchHandlers() {
        // Prevenir comportamientos no deseados
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault(); // Prevenir zoom con dos dedos
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault(); // Prevenir scroll/zoom con dos dedos
            }
        }, { passive: false });

        // Mejorar feedback táctil en botones
        const buttons = document.querySelectorAll('button, .action-btn, .settings-btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                button.style.transform = 'scale(0.98)';
                button.style.opacity = '0.8';
            });

            button.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    button.style.transform = '';
                    button.style.opacity = '';
                }, 100);
            });

            button.addEventListener('touchcancel', (e) => {
                button.style.transform = '';
                button.style.opacity = '';
            });
        });
    }

    // Manejar cambios de orientación
    setupOrientationChange() {
        const handleOrientationChange = () => {
            // Ajustar layout según orientación
            const isLandscape = window.innerWidth > window.innerHeight;
            document.body.classList.toggle('landscape', isLandscape);
            document.body.classList.toggle('portrait', !isLandscape);

            // Reajustar altura del viewport
            setTimeout(() => {
                this.setupViewportHeight();
            }, 100);
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
        handleOrientationChange(); // Ejecutar al inicio
    }

    // Configurar safe area para notch/dynamic island
    setupSafeArea() {
        const updateSafeArea = () => {
            const safeAreaTop = getComputedStyle(document.documentElement)
                .getPropertyValue('--safe-area-inset-top') || '0px';
            const safeAreaBottom = getComputedStyle(document.documentElement)
                .getPropertyValue('--safe-area-inset-bottom') || '0px';

            document.documentElement.style.setProperty('--safe-top', safeAreaTop);
            document.documentElement.style.setProperty('--safe-bottom', safeAreaBottom);
        };

        updateSafeArea();
        window.addEventListener('resize', updateSafeArea);
    }

    // Prevenir zoom accidental
    preventZoom() {
        // Prevenir doble tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Prevenir zoom con gestos
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
    }

    // Optimizar scrolling para móvil
    optimizeScrolling() {
        // Aplicar scroll momentum en iOS
        const scrollableElements = document.querySelectorAll('.battle-arena, .log-container, .modal-content');
        scrollableElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
        });

        // Prevenir scroll del body cuando se hace scroll en modales
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.addEventListener('touchmove', (e) => {
                if (e.target === modal) {
                    e.preventDefault();
                }
            }, { passive: false });
        });
    }

    // Registrar Service Worker para PWA
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('../sw.js')
                    .then((registration) => {
                        console.log('[PWA] Service Worker registered:', registration);
                        
                        // Verificar actualizaciones
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // Nueva versión disponible
                                    MobileUtils.showNotification(
                                        'Nueva versión disponible. Reinicia la app para actualizar.',
                                        'info',
                                        5000
                                    );
                                }
                            });
                        });
                    })
                    .catch((error) => {
                        console.log('[PWA] Service Worker registration failed:', error);
                    });
            });
        }
    }

    // Vibración táctil (si está disponible)
    static vibrate(pattern = [50]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    // Detectar tipo de dispositivo
    static getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
        const isMobile = /mobile|android|touch|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        
        if (isTablet) return 'tablet';
        if (isMobile) return 'mobile';
        return 'desktop';
    }

    // Detectar soporte para características específicas
    static getCapabilities() {
        return {
            touch: 'ontouchstart' in window,
            vibration: 'vibrate' in navigator,
            fullscreen: document.fullscreenEnabled || document.webkitFullscreenEnabled,
            orientation: 'orientation' in screen,
            deviceMotion: 'DeviceMotionEvent' in window,
            wakeLock: 'wakeLock' in navigator
        };
    }

    // Mantener pantalla activa durante el juego
    static async keepScreenOn() {
        if ('wakeLock' in navigator) {
            try {
                const wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen wake lock activated');
                return wakeLock;
            } catch (err) {
                console.log(`Wake lock failed: ${err.name}, ${err.message}`);
            }
        }
        return null;
    }

    // Optimizar rendimiento para móvil
    static optimizePerformance() {
        // Reducir animaciones si el dispositivo es lento
        const isLowEnd = navigator.hardwareConcurrency <= 2 || 
                        navigator.deviceMemory <= 2;
        
        if (isLowEnd) {
            document.body.classList.add('low-performance');
            
            // Reducir calidad de animaciones
            const style = document.createElement('style');
            style.textContent = `
                .low-performance * {
                    animation-duration: 0.1s !important;
                    transition-duration: 0.1s !important;
                }
                .low-performance .particles,
                .low-performance .energy-waves {
                    display: none;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Gestión de notificaciones del juego
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `mobile-notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: calc(var(--safe-area-inset-top, 0px) + 20px);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(17, 17, 17, 0.95);
            color: var(--text-light);
            padding: 12px 20px;
            border-radius: 25px;
            border: 1px solid var(--gold);
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        document.body.appendChild(notification);

        // Mostrar notificación
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);

        // Ocultar y remover notificación
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);

        // Vibrar si es una notificación importante
        if (type === 'warning' || type === 'error') {
            this.vibrate([100, 50, 100]);
        }
    }

    // Gestión de estado del juego en background
    static setupBackgroundHandling() {
        let gameState = 'active';

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                gameState = 'background';
                // Pausar animaciones pesadas
                document.body.classList.add('background-mode');
                console.log('Game paused (background)');
            } else {
                gameState = 'active';
                // Reanudar animaciones
                document.body.classList.remove('background-mode');
                console.log('Game resumed (foreground)');
            }
        });

        window.addEventListener('blur', () => {
            gameState = 'background';
            document.body.classList.add('background-mode');
        });

        window.addEventListener('focus', () => {
            gameState = 'active';
            document.body.classList.remove('background-mode');
        });

        return () => gameState;
    }
}

// Clase para gestos específicos del juego
class GameGestures {
    constructor() {
        this.setupSwipeGestures();
        this.setupPinchGestures();
    }

    setupSwipeGestures() {
        let startX, startY, startTime;

        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const endTime = Date.now();

            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;

            // Solo detectar swipes rápidos
            if (deltaTime > 300) return;

            const minDistance = 50;
            const maxVerticalDistance = 100;

            // Swipe horizontal
            if (Math.abs(deltaX) > minDistance && Math.abs(deltaY) < maxVerticalDistance) {
                const direction = deltaX > 0 ? 'right' : 'left';
                this.handleSwipe(direction);
            }
            // Swipe vertical
            else if (Math.abs(deltaY) > minDistance && Math.abs(deltaX) < maxVerticalDistance) {
                const direction = deltaY > 0 ? 'down' : 'up';
                this.handleSwipe(direction);
            }

            startX = startY = null;
        });
    }

    setupPinchGestures() {
        let initialDistance = 0;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / initialDistance;
                
                // Detectar pinch in/out
                if (scale < 0.8) {
                    this.handlePinch('in');
                } else if (scale > 1.2) {
                    this.handlePinch('out');
                }
            }
        });
    }

    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleSwipe(direction) {
        console.log(`Swipe detected: ${direction}`);
        
        // Ejemplos de acciones según dirección
        switch (direction) {
            case 'left':
                // Cambiar a siguiente acción
                break;
            case 'right':
                // Cambiar a acción anterior
                break;
            case 'up':
                // Abrir configuración o minimizar
                break;
            case 'down':
                // Cerrar modal o expandir
                break;
        }
    }

    handlePinch(direction) {
        console.log(`Pinch detected: ${direction}`);
        
        // Ejemplos de acciones según pinch
        if (direction === 'out') {
            // Zoom in en estadísticas
        } else if (direction === 'in') {
            // Zoom out o minimizar
        }
    }
}

// Inicializar utilidades móviles cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const deviceType = MobileUtils.getDeviceType();
    const capabilities = MobileUtils.getCapabilities();
    
    console.log('Device type:', deviceType);
    console.log('Capabilities:', capabilities);
    
    // Solo inicializar en dispositivos móviles/tablets
    if (deviceType === 'mobile' || deviceType === 'tablet') {
        new MobileUtils();
        new GameGestures();
        
        // Optimizar rendimiento
        MobileUtils.optimizePerformance();
        
        // Configurar manejo de background
        const getGameState = MobileUtils.setupBackgroundHandling();
        
        // Mantener pantalla activa durante el juego
        MobileUtils.keepScreenOn();
        
        // Añadir clase al body para identificar el dispositivo
        document.body.classList.add(`device-${deviceType}`);
        
        // Mostrar notificación de bienvenida
        setTimeout(() => {
            MobileUtils.showNotification('¡Bienvenido a Einherjar Blitz!', 'info', 2000);
        }, 1000);
    }
});

// Exportar para uso en otros módulos
window.MobileUtils = MobileUtils;
window.GameGestures = GameGestures;

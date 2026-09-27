<?php
require_once '../includes/Database.php';

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    header('Location: ../index.php');
    exit();
}

// Determinar qué vista mostrar por defecto
$defaultView = isset($_GET['view']) ? $_GET['view'] : 'tienda';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">
    <title>Tienda & Marketplace - Einherjer Blitz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #0a0a0a;
            font-family: 'Inter', sans-serif;
        }
        
        /* Swipe Container */
        .swipe-wrapper {
            position: fixed;
            inset: 0;
            display: flex;
            width: 200vw;
            height: 100vh;
            transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            will-change: transform;
        }
        
        .swipe-wrapper.swiping {
            transition: none;
        }
        
        .swipe-panel {
            width: 100vw;
            height: 100vh;
            flex-shrink: 0;
            overflow: hidden;
            position: relative;
        }
        
        .swipe-panel iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
        
        /* Navigation Dots */
        .nav-dots {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            z-index: 10000;
            background: rgba(0,0,0,0.75);
            padding: 12px 24px;
            border-radius: 999px;
            border: 1px solid rgba(201,170,113,0.3);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
        
        .nav-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(201,170,113,0.3);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .nav-dot:hover {
            background: rgba(201,170,113,0.5);
            transform: scale(1.2);
        }
        
        .nav-dot.active {
            background: #c9aa71;
            width: 32px;
            border-radius: 5px;
            box-shadow: 0 0 12px rgba(201,170,113,0.5);
        }
        
        .nav-label {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 8px;
            padding: 6px 12px;
            background: rgba(0,0,0,0.85);
            color: #c9aa71;
            border-radius: 8px;
            font-size: 0.8rem;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            border: 1px solid rgba(201,170,113,0.3);
        }
        
        .nav-dot:hover .nav-label,
        .nav-dot.active .nav-label {
            opacity: 1;
        }
        
        /* Swipe Indicators */
        .swipe-indicator {
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .swipe-indicator.left {
            left: 20px;
        }
        
        .swipe-indicator.right {
            right: 20px;
        }
        
        .swipe-indicator.active {
            opacity: 0.7;
            animation: swipeHint 1.5s ease-in-out infinite;
        }
        
        .swipe-indicator i {
            font-size: 3rem;
            color: #c9aa71;
            text-shadow: 0 0 20px rgba(201,170,113,0.6);
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
        }
        
        @keyframes swipeHint {
            0%, 100% { transform: translateY(-50%) translateX(0); }
            50% { transform: translateY(-50%) translateX(10px); }
        }
        
        .swipe-indicator.left.active {
            animation: swipeHintLeft 1.5s ease-in-out infinite;
        }
        
        @keyframes swipeHintLeft {
            0%, 100% { transform: translateY(-50%) translateX(0); }
            50% { transform: translateY(-50%) translateX(-10px); }
        }
        
        /* Loading Overlay */
        .loading-overlay {
            position: fixed;
            inset: 0;
            background: #0a0a0a;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            z-index: 99999;
            opacity: 1;
            transition: opacity 0.5s ease;
        }
        
        .loading-overlay.hidden {
            opacity: 0;
            pointer-events: none;
        }
        
        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(201,170,113,0.2);
            border-top-color: #c9aa71;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .loading-text {
            margin-top: 20px;
            color: #c9aa71;
            font-size: 1.1rem;
            letter-spacing: 0.1em;
            font-family: 'Cinzel', serif;
        }
        
        /* Quick Switch Button */
        .quick-switch {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            gap: 8px;
            background: rgba(0,0,0,0.75);
            padding: 8px;
            border-radius: 12px;
            border: 1px solid rgba(201,170,113,0.3);
            backdrop-filter: blur(10px);
        }
        
        .quick-switch-btn {
            padding: 8px 16px;
            background: transparent;
            border: 1px solid rgba(201,170,113,0.3);
            color: rgba(201,170,113,0.6);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .quick-switch-btn:hover {
            background: rgba(201,170,113,0.1);
            color: #c9aa71;
            border-color: #c9aa71;
        }
        
        .quick-switch-btn.active {
            background: rgba(201,170,113,0.15);
            color: #c9aa71;
            border-color: #c9aa71;
        }
        
        /* First visit hint */
        .first-visit-hint {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99998;
            opacity: 1;
            transition: opacity 0.5s ease;
        }
        
        .first-visit-hint.hidden {
            opacity: 0;
            pointer-events: none;
        }
        
        .hint-content {
            text-align: center;
            padding: 2rem;
            max-width: 500px;
        }
        
        .hint-icon {
            font-size: 4rem;
            color: #c9aa71;
            margin-bottom: 1rem;
            animation: swipeDemo 2s ease-in-out infinite;
        }
        
        @keyframes swipeDemo {
            0%, 100% { transform: translateX(-20px); }
            50% { transform: translateX(20px); }
        }
        
        .hint-title {
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            color: #c9aa71;
            margin-bottom: 0.5rem;
        }
        
        .hint-text {
            color: rgba(255,255,255,0.8);
            font-size: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .hint-button {
            background: #c9aa71;
            color: #111;
            border: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .hint-button:hover {
            background: #d4b776;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(201,170,113,0.4);
        }
        
        @media (max-width: 768px) {
            .nav-dots {
                bottom: 15px;
                padding: 10px 20px;
            }
            
            .quick-switch {
                top: 10px;
                right: 10px;
                padding: 6px;
            }
            
            .quick-switch-btn {
                padding: 6px 12px;
                font-size: 0.75rem;
            }
            
            .swipe-indicator i {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">Cargando...</div>
    </div>
    
    <!-- First Visit Hint -->
    <div class="first-visit-hint" id="firstVisitHint" style="display: none;">
        <div class="hint-content">
            <div class="hint-icon">
                <i class="fas fa-hand-point-right"></i>
            </div>
            <h2 class="hint-title">¡Desliza para navegar!</h2>
            <p class="hint-text">
                Desliza hacia la izquierda o derecha para cambiar entre la Tienda Oficial y el Marketplace de jugadores.
            </p>
            <button class="hint-button" onclick="closeFirstVisitHint()">
                <i class="fas fa-check"></i> Entendido
            </button>
        </div>
    </div>
    
    <!-- Quick Switch Buttons -->
    <div class="quick-switch">
        <button class="quick-switch-btn active" data-panel="0" onclick="goToPanel(0)">
            <i class="fas fa-store"></i>
            <span>Tienda</span>
        </button>
        <button class="quick-switch-btn" data-panel="1" onclick="goToPanel(1)">
            <i class="fas fa-users"></i>
            <span>Marketplace</span>
        </button>
    </div>
    
    <!-- Swipe Indicators -->
    <div class="swipe-indicator left" id="swipeLeft">
        <i class="fas fa-chevron-left"></i>
    </div>
    <div class="swipe-indicator right" id="swipeRight">
        <i class="fas fa-chevron-right"></i>
    </div>
    
    <!-- Navigation Dots -->
    <div class="nav-dots">
        <div class="nav-dot active" data-panel="0" onclick="goToPanel(0)">
            <span class="nav-label">Tienda Oficial</span>
        </div>
        <div class="nav-dot" data-panel="1" onclick="goToPanel(1)">
            <span class="nav-label">Marketplace</span>
        </div>
    </div>
    
    <!-- Swipe Container -->
    <div class="swipe-wrapper" id="swipeWrapper">
        <!-- Panel 1: Tienda Oficial -->
        <div class="swipe-panel" id="panel-tienda">
            <iframe src="tienda_content.php" id="tiendaFrame" loading="lazy"></iframe>
        </div>
        
        <!-- Panel 2: Marketplace -->
        <div class="swipe-panel" id="panel-marketplace">
            <iframe src="marketplace.php" id="marketplaceFrame" loading="lazy"></iframe>
        </div>
    </div>
    
    <script>
        const swipeWrapper = document.getElementById('swipeWrapper');
        const navDots = document.querySelectorAll('.nav-dot');
        const quickSwitchBtns = document.querySelectorAll('.quick-switch-btn');
        const swipeLeft = document.getElementById('swipeLeft');
        const swipeRight = document.getElementById('swipeRight');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const firstVisitHint = document.getElementById('firstVisitHint');
        
        let currentPanel = <?php echo ($defaultView === 'marketplace') ? 1 : 0; ?>;
        let touchStartX = 0;
        let touchCurrentX = 0;
        let isDragging = false;
        let hasShownHint = localStorage.getItem('swipe_hint_shown') === 'true';
        
        // Inicializar posición
        function init() {
            swipeWrapper.style.transform = `translateX(-${currentPanel * 100}vw)`;
            updateUI();
            
            // Mostrar hint en primera visita
            if (!hasShownHint) {
                setTimeout(() => {
                    firstVisitHint.style.display = 'flex';
                }, 1000);
            }
            
            // Ocultar loading cuando los iframes carguen
            let loadedCount = 0;
            const iframes = document.querySelectorAll('iframe');
            
            iframes.forEach(iframe => {
                iframe.addEventListener('load', () => {
                    loadedCount++;
                    if (loadedCount === iframes.length) {
                        setTimeout(() => {
                            loadingOverlay.classList.add('hidden');
                            showSwipeIndicators();
                        }, 500);
                    }
                });
            });
            
            // Fallback si los iframes no cargan
            setTimeout(() => {
                if (!loadingOverlay.classList.contains('hidden')) {
                    loadingOverlay.classList.add('hidden');
                }
            }, 3000);
        }
        
        function closeFirstVisitHint() {
            firstVisitHint.classList.add('hidden');
            localStorage.setItem('swipe_hint_shown', 'true');
            hasShownHint = true;
        }
        
        function updateUI() {
            // Actualizar dots
            navDots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentPanel);
            });
            
            // Actualizar botones quick switch
            quickSwitchBtns.forEach((btn, index) => {
                btn.classList.toggle('active', index === currentPanel);
            });
        }
        
        function showSwipeIndicators() {
            const indicator = currentPanel === 0 ? swipeRight : swipeLeft;
            indicator.classList.add('active');
            
            setTimeout(() => {
                indicator.classList.remove('active');
            }, 3000);
        }
        
        function goToPanel(panelIndex) {
            currentPanel = Math.max(0, Math.min(1, panelIndex));
            swipeWrapper.style.transform = `translateX(-${currentPanel * 100}vw)`;
            updateUI();
            
            // Actualizar URL sin recargar
            const view = currentPanel === 0 ? 'tienda' : 'marketplace';
            history.pushState({panel: currentPanel}, '', `?view=${view}`);
        }
        
        // Touch Events
        swipeWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            isDragging = true;
            swipeWrapper.classList.add('swiping');
        });
        
        swipeWrapper.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            touchCurrentX = e.touches[0].clientX;
            const diff = touchCurrentX - touchStartX;
            const currentTranslate = -currentPanel * window.innerWidth;
            const newTranslate = currentTranslate + diff;
            
            // Limitar el movimiento con efecto de resistencia en los bordes
            let boundedTranslate = newTranslate;
            const maxTranslate = 0;
            const minTranslate = -window.innerWidth;
            
            if (newTranslate > maxTranslate) {
                boundedTranslate = maxTranslate + (newTranslate - maxTranslate) * 0.3;
            } else if (newTranslate < minTranslate) {
                boundedTranslate = minTranslate + (newTranslate - minTranslate) * 0.3;
            }
            
            swipeWrapper.style.transform = `translateX(${boundedTranslate}px)`;
        });
        
        swipeWrapper.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            swipeWrapper.classList.remove('swiping');
            
            const diff = touchCurrentX - touchStartX;
            const threshold = window.innerWidth * 0.25; // 25% del ancho
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0 && currentPanel > 0) {
                    goToPanel(currentPanel - 1);
                } else if (diff < 0 && currentPanel < 1) {
                    goToPanel(currentPanel + 1);
                } else {
                    goToPanel(currentPanel);
                }
            } else {
                goToPanel(currentPanel);
            }
            
            touchStartX = 0;
            touchCurrentX = 0;
        });
        
        // Mouse Events (para desktop)
        let mouseStartX = 0;
        let mouseCurrentX = 0;
        let isMouseDragging = false;
        
        swipeWrapper.addEventListener('mousedown', (e) => {
            mouseStartX = e.clientX;
            isMouseDragging = true;
            swipeWrapper.classList.add('swiping');
            swipeWrapper.style.cursor = 'grabbing';
        });
        
        swipeWrapper.addEventListener('mousemove', (e) => {
            if (!isMouseDragging) return;
            
            mouseCurrentX = e.clientX;
            const diff = mouseCurrentX - mouseStartX;
            const currentTranslate = -currentPanel * window.innerWidth;
            const newTranslate = currentTranslate + diff;
            
            let boundedTranslate = newTranslate;
            const maxTranslate = 0;
            const minTranslate = -window.innerWidth;
            
            if (newTranslate > maxTranslate) {
                boundedTranslate = maxTranslate + (newTranslate - maxTranslate) * 0.3;
            } else if (newTranslate < minTranslate) {
                boundedTranslate = minTranslate + (newTranslate - minTranslate) * 0.3;
            }
            
            swipeWrapper.style.transform = `translateX(${boundedTranslate}px)`;
        });
        
        swipeWrapper.addEventListener('mouseup', (e) => {
            if (!isMouseDragging) return;
            
            isMouseDragging = false;
            swipeWrapper.classList.remove('swiping');
            swipeWrapper.style.cursor = 'grab';
            
            const diff = mouseCurrentX - mouseStartX;
            const threshold = window.innerWidth * 0.25;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0 && currentPanel > 0) {
                    goToPanel(currentPanel - 1);
                } else if (diff < 0 && currentPanel < 1) {
                    goToPanel(currentPanel + 1);
                } else {
                    goToPanel(currentPanel);
                }
            } else {
                goToPanel(currentPanel);
            }
            
            mouseStartX = 0;
            mouseCurrentX = 0;
        });
        
        swipeWrapper.addEventListener('mouseleave', () => {
            if (isMouseDragging) {
                isMouseDragging = false;
                swipeWrapper.classList.remove('swiping');
                swipeWrapper.style.cursor = 'grab';
                goToPanel(currentPanel);
            }
        });
        
        // Teclado (flechas)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentPanel > 0) {
                goToPanel(currentPanel - 1);
            } else if (e.key === 'ArrowRight' && currentPanel < 1) {
                goToPanel(currentPanel + 1);
            }
        });
        
        // Navegación del navegador (back/forward)
        window.addEventListener('popstate', (e) => {
            if (e.state && typeof e.state.panel === 'number') {
                currentPanel = e.state.panel;
                swipeWrapper.style.transform = `translateX(-${currentPanel * 100}vw)`;
                updateUI();
            }
        });
        
        // Inicializar
        init();
        
        // Comunicación entre iframes (opcional, para refrescar datos)
        window.addEventListener('message', (e) => {
            if (e.data.action === 'refresh') {
                // Refrescar el iframe correspondiente
                if (e.data.target === 'marketplace') {
                    document.getElementById('marketplaceFrame').contentWindow.location.reload();
                } else if (e.data.target === 'tienda') {
                    document.getElementById('tiendaFrame').contentWindow.location.reload();
                }
            }
        });
    </script>
</body>
</html>

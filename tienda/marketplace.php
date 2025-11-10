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

$db = Database::getInstance();

// Verificar estado premium del usuario
$premiumStmt = $db->prepare("SELECT * FROM marketplace_premium WHERE user_id = ? AND premium_active = 1");
$premiumStmt->execute([$userData['id']]);
$isPremium = $premiumStmt->fetch();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Marketplace - Einherjer Blitz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0a0a0a;
            --bg-gradient: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            --gold: #c9aa71;
            --gold-hover: #d4b776;
            --gold-shadow: rgba(201, 170, 113, 0.3);
            --text-light: #ffffffd9;
            --text-muted: #aaaaaa;
            --card-bg: #111;
            --card-border: rgba(201,170,113,0.2);
            --card-hover: rgba(201,170,113,0.1);
            --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: var(--bg-gradient);
            font-family: 'Inter', sans-serif;
            color: var(--text-light);
            min-height: 100vh;
            overflow-x: hidden;
            position: relative;
        }
        
        /* Swipe Container */
        .swipe-container {
            display: flex;
            width: 200vw;
            transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            will-change: transform;
        }
        
        .swipe-container.swiping {
            transition: none;
        }
        
        .swipe-panel {
            width: 100vw;
            min-height: 100vh;
            flex-shrink: 0;
        }
        
        /* Swipe Indicator */
        .swipe-indicator {
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            z-index: 100;
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
            opacity: 0.6;
        }
        
        .swipe-indicator i {
            font-size: 3rem;
            color: var(--gold);
            text-shadow: 0 0 20px var(--gold-shadow);
            animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        /* Navigation Dots */
        .nav-dots {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            z-index: 1000;
            background: rgba(0,0,0,0.65);
            padding: 12px 20px;
            border-radius: 999px;
            border: 1px solid var(--card-border);
            backdrop-filter: blur(10px);
        }
        
        .nav-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(201,170,113,0.3);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .nav-dot.active {
            background: var(--gold);
            width: 30px;
            border-radius: 5px;
        }
        
        /* Header Styles */
        .marketplace-header {
            padding: 1.8rem 2.5rem 1.4rem;
            border-bottom: 1px solid var(--card-border);
            background: linear-gradient(120deg, rgba(0,0,0,0.65), rgba(37, 29, 11, 0.3));
            position: sticky;
            top: 0;
            z-index: 100;
            backdrop-filter: blur(10px);
        }
        
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .header-left {
            flex: 1;
        }
        
        .back-link {
            color: var(--gold);
            text-decoration: none;
            font-size: 0.9rem;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            opacity: 0.85;
            transition: var(--transition-smooth);
            margin-bottom: 0.5rem;
            font-weight: 500;
            letter-spacing: 0.02em;
        }
        
        .back-link:hover {
            opacity: 1;
            transform: translateX(-3px);
        }
        
        .back-link i {
            font-size: 0.85rem;
        }
        
        .brand-link {
            color: var(--gold);
            text-decoration: none;
            font-size: 0.95rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            opacity: 0.8;
            transition: var(--transition-smooth);
        }
        
        .brand-link:hover {opacity: 1; transform: translateX(-2px);}
        
        .currency-badges {
            display: flex;
            gap: 0.75rem;
        }
        
        .currency-badge {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            padding: 0.6rem 1rem;
            border-radius: 10px;
            background: rgba(0,0,0,0.45);
            border: 1px solid var(--card-border);
        }
        
        .currency-badge i {
            color: var(--gold);
            font-size: 1.2rem;
        }
        
        .currency-label {
            display: block;
            font-size: 0.7rem;
            text-transform: uppercase;
            color: var(--text-muted);
        }
        
        .currency-value {
            font-family: 'Cinzel', serif;
            font-size: 1.1rem;
            color: var(--text-light);
        }
        
        .marketplace-title {
            font-family: 'Cinzel', serif;
            color: var(--gold);
            font-size: 2.3rem;
            margin: 0;
            letter-spacing: 0.06em;
            text-shadow: 0 4px 12px var(--gold-shadow);
        }
        
        .marketplace-subtitle {
            margin: 0.5rem 0 0;
            color: var(--text-muted);
            font-size: 0.95rem;
        }
        
        /* Premium Badge */
        .premium-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.15));
            border: 1px solid rgba(255,215,0,0.35);
            border-radius: 999px;
            color: #ffd700;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 0.5rem;
        }
        
        /* Toolbar */
        .marketplace-toolbar {
            padding: 1.5rem 2.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
            background: rgba(0,0,0,0.25);
        }
        
        .search-container {
            flex: 1;
            max-width: 400px;
            position: relative;
        }
        
        .search-container input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.75rem;
            background: rgba(0,0,0,0.45);
            border: 1px solid var(--card-border);
            border-radius: 12px;
            color: var(--text-light);
            font-size: 0.95rem;
        }
        
        .search-container i {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
        }
        
        .filter-group {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }
        
        .filter-select {
            background: rgba(0,0,0,0.45);
            border: 1px solid var(--card-border);
            color: var(--text-light);
            padding: 0.65rem 1rem;
            border-radius: 10px;
            min-width: 150px;
            cursor: pointer;
        }
        
        .btn-create-listing {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--gold);
            color: #111;
            border: none;
            padding: 0.75rem 1.25rem;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition-smooth);
            white-space: nowrap;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }
        
        .btn-create-listing:hover {
            background: var(--gold-hover);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px var(--gold-shadow);
        }
        
        .btn-create-listing:active {
            transform: translateY(0);
        }
        
        /* Tab Navigation */
        .tab-navigation {
            display: flex;
            gap: 0.5rem;
            padding: 0 2.5rem 1rem;
            border-bottom: 2px solid var(--card-border);
        }
        
        .tab-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.85rem 1.5rem;
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 0.95rem;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: var(--transition-smooth);
            position: relative;
            bottom: -2px;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }
        
        .tab-btn:hover {
            color: var(--text-light);
            background: rgba(201,170,113,0.05);
        }
        
        .tab-btn:active {
            transform: scale(0.98);
        }
        
        .tab-btn.active {
            color: var(--gold);
            border-bottom-color: var(--gold);
            background: rgba(201,170,113,0.08);
        }
        
        /* Content Section */
        .content-section {
            padding: 2rem 2.5rem;
        }
        
        .section-header {
            margin-bottom: 1.5rem;
        }
        
        .section-title {
            font-family: 'Cinzel', serif;
            color: var(--gold);
            font-size: 1.5rem;
            margin-bottom: 0.3rem;
        }
        
        .section-subtitle {
            color: var(--text-muted);
            font-size: 0.95rem;
        }
        
        /* Grid */
        .marketplace-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
        }
        
        /* Listing Card */
        .listing-card {
            background: rgba(10,10,10,0.65);
            border: 1px solid transparent;
            border-radius: 16px;
            overflow: hidden;
            transition: var(--transition-smooth);
            box-shadow: 0 12px 30px rgba(0,0,0,0.35);
            position: relative;
        }
        
        .listing-card:hover {
            transform: translateY(-6px);
            border-color: rgba(201,170,113,0.35);
            box-shadow: 0 18px 36px rgba(0,0,0,0.45);
        }
        
        .listing-card.premium {
            border-color: rgba(255,215,0,0.25);
            box-shadow: 0 0 24px rgba(255,180,70,0.25);
        }
        
        .listing-image-wrapper {
            position: relative;
            height: 240px;
            overflow: hidden;
        }
        
        .listing-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.45s ease;
        }
        
        .listing-card:hover .listing-image {
            transform: scale(1.05);
        }
        
        .premium-ribbon {
            position: absolute;
            top: 12px;
            right: -36px;
            transform: rotate(40deg);
            background: linear-gradient(120deg, rgba(255,220,140,0.95), rgba(255,150,64,0.95));
            color: #1b1305;
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            padding: 0.35rem 1.8rem;
            font-weight: 700;
            box-shadow: 0 6px 18px rgba(255,180,90,0.35);
        }
        
        .seller-info {
            padding: 0.75rem 1rem;
            background: rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            border-bottom: 1px solid var(--card-border);
        }
        
        .seller-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--card-border);
        }
        
        .seller-name {
            flex: 1;
            font-size: 0.9rem;
            color: var(--text-light);
        }
        
        .listing-body {
            padding: 1.25rem 1.3rem 1.4rem;
        }
        
        .listing-title {
            font-size: 1.25rem;
            font-family: 'Cinzel', serif;
            letter-spacing: 0.04em;
            margin-bottom: 0.5rem;
        }
        
        .listing-description {
            font-size: 0.92rem;
            color: var(--text-muted);
            line-height: 1.45;
            max-height: 64px;
            overflow: hidden;
            margin-bottom: 1rem;
        }
        
        .price-options {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .price-option {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0.75rem;
            background: rgba(0,0,0,0.35);
            border-radius: 8px;
            border: 1px solid var(--card-border);
        }
        
        .price-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
        }
        
        .price-value {
            font-family: 'Cinzel', serif;
            color: var(--gold);
            font-weight: 600;
        }
        
        .btn-buy {
            width: 100%;
            padding: 0.75rem;
            background: var(--gold);
            color: #111;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition-smooth);
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }
        
        .btn-buy:hover {
            background: var(--gold-hover);
            transform: translateY(-1px);
        }
        
        .btn-buy:active {
            transform: translateY(0);
        }
        
        .btn-delete {
            width: 100%;
            padding: 0.65rem;
            background: rgba(200,50,50,0.15);
            border: 1px solid rgba(200,50,50,0.35);
            color: #ff6b6b;
            border-radius: 8px;
            cursor: pointer;
            transition: var(--transition-smooth);
            margin-top: 0.5rem;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }
        
        .btn-delete:hover {
            background: rgba(200,50,50,0.25);
        }
        
        .btn-delete:active {
            transform: scale(0.98);
        }
        
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-muted);
        }
        
        .empty-illustration {
            font-size: 4rem;
            color: rgba(201,170,113,0.35);
            margin-bottom: 1rem;
        }
        
        /* Modal Overrides */
        .modal-content {
            background: radial-gradient(circle at top, rgba(30,24,16,0.92) 0%, rgba(10,10,10,0.94) 60%);
            color: var(--text-light);
            border: 1px solid rgba(201,170,113,0.35);
        }
        
        .modal-header, .modal-footer {
            border-color: rgba(201,170,113,0.18);
        }
        
        .modal-title {
            font-family: 'Cinzel', serif;
            color: var(--gold);
        }
        
        .form-control, .form-select {
            background: rgba(0,0,0,0.45);
            border: 1px solid var(--card-border);
            color: var(--text-light);
        }
        
        .form-control:focus, .form-select:focus {
            background: rgba(0,0,0,0.55);
            border-color: var(--gold);
            color: var(--text-light);
            box-shadow: 0 0 0 0.2rem var(--gold-shadow);
        }
        
        .form-label {
            color: var(--text-light);
            font-weight: 500;
        }
        
        .btn-primary {
            background: var(--gold);
            border-color: var(--gold);
            color: #111;
        }
        
        .btn-primary:hover {
            background: var(--gold-hover);
            border-color: var(--gold-hover);
        }
        
        .btn-close {
            filter: invert(90%);
        }
        
        /* Mobile Responsive */
        @media (max-width: 992px) {
            .marketplace-header {
                padding: 1.4rem 1.5rem;
            }
            
            .marketplace-title {
                font-size: 2rem;
            }
            
            .header-top {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .currency-badges {
                width: 100%;
                justify-content: space-between;
            }
            
            .currency-badge {
                flex: 1;
                padding: 0.5rem 0.8rem;
            }
            
            .currency-label {
                font-size: 0.65rem;
            }
            
            .currency-value {
                font-size: 1rem;
            }
            
            .marketplace-toolbar {
                padding: 1.2rem 1.5rem;
                gap: 1rem;
            }
            
            .filter-group {
                width: 100%;
                justify-content: space-between;
            }
            
            .filter-select {
                flex: 1;
                min-width: 120px;
            }
            
            .btn-create-listing {
                width: 100%;
                justify-content: center;
            }
            
            .marketplace-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 1.2rem;
            }
            
            .listing-image-wrapper {
                height: 180px;
            }
        }
        
        @media (max-width: 768px) {
            .marketplace-header {
                padding: 1.2rem 1.35rem;
            }
            
            .marketplace-title {
                font-size: 1.75rem;
            }
            
            .marketplace-subtitle {
                font-size: 0.85rem;
            }
            
            .premium-badge {
                font-size: 0.75rem;
                padding: 0.4rem 0.85rem;
            }
            
            .marketplace-toolbar {
                padding: 1.2rem 1.35rem;
                flex-direction: column;
                align-items: stretch;
            }
            
            .search-container {
                max-width: 100%;
            }
            
            .search-container input {
                font-size: 0.9rem;
                padding: 0.7rem 1rem 0.7rem 2.5rem;
            }
            
            .filter-group {
                flex-wrap: wrap;
                gap: 0.6rem;
            }
            
            .filter-select {
                font-size: 0.9rem;
                min-width: calc(50% - 0.3rem);
            }
            
            .tab-navigation {
                padding: 0 1.35rem 1rem;
                overflow-x: auto;
                gap: 0.3rem;
                -webkit-overflow-scrolling: touch;
            }
            
            .tab-btn {
                font-size: 0.9rem;
                padding: 0.75rem 1.2rem;
                white-space: nowrap;
            }
            
            .content-section {
                padding: 1.5rem 1.35rem;
            }
            
            .section-title {
                font-size: 1.3rem;
            }
            
            .section-subtitle {
                font-size: 0.85rem;
            }
            
            .marketplace-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .listing-card {
                border-radius: 14px;
            }
            
            .listing-image-wrapper {
                height: 220px;
            }
            
            .listing-title {
                font-size: 1.15rem;
            }
            
            .listing-description {
                font-size: 0.88rem;
            }
            
            .currency-badges {
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            
            .currency-badge {
                flex: 1 1 calc(50% - 0.25rem);
                min-width: 140px;
            }
        }
        
        @media (max-width: 576px) {
            .marketplace-header {
                padding: 1rem 1.2rem;
            }
            
            .marketplace-title {
                font-size: 1.5rem;
            }
            
            .marketplace-subtitle {
                font-size: 0.8rem;
            }
            
            .header-top {
                gap: 0.8rem;
            }
            
            .currency-badge {
                flex: 1 1 100%;
                justify-content: flex-start;
            }
            
            .marketplace-toolbar {
                padding: 1rem 1.2rem;
            }
            
            .tab-navigation {
                padding: 0 1.2rem 0.8rem;
            }
            
            .tab-btn {
                padding: 0.65rem 1rem;
                font-size: 0.85rem;
            }
            
            .tab-btn i {
                font-size: 0.9rem;
            }
            
            .content-section {
                padding: 1.2rem 1.2rem;
            }
            
            .section-header {
                margin-bottom: 1.2rem;
            }
            
            .section-title {
                font-size: 1.2rem;
            }
            
            .btn-create-listing {
                font-size: 0.95rem;
                padding: 0.7rem 1.1rem;
            }
            
            .listing-body {
                padding: 1rem 1.1rem;
            }
            
            .seller-info {
                padding: 0.65rem 0.9rem;
            }
            
            .seller-avatar {
                width: 32px;
                height: 32px;
            }
            
            .seller-name {
                font-size: 0.85rem;
            }
            
            .price-option {
                padding: 0.45rem 0.65rem;
            }
            
            .price-label {
                font-size: 0.85rem;
            }
            
            .price-value {
                font-size: 0.95rem;
            }
            
            .btn-buy, .btn-delete {
                font-size: 0.9rem;
                padding: 0.65rem;
            }
            
            .empty-illustration {
                font-size: 3rem;
            }
            
            .empty-state {
                padding: 3rem 1.5rem;
            }
        }
        
        @media (max-width: 400px) {
            .marketplace-title {
                font-size: 1.35rem;
            }
            
            .currency-badge i {
                font-size: 1rem;
            }
            
            .filter-select {
                min-width: 100%;
            }
            
            .listing-image-wrapper {
                height: 200px;
            }
            
            .premium-ribbon {
                font-size: 0.6rem;
                padding: 0.3rem 1.6rem;
                right: -40px;
            }
        }
        
        /* Loading Spinner */
        .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            flex-direction: column;
            gap: 1rem;
        }
        
        .loading-text {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }
        
        /* Optimizaciones de rendimiento */
        * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        img {
            image-rendering: -webkit-optimize-contrast;
        }
        
        /* Smooth scroll para móviles */
        .tab-navigation {
            scroll-behavior: smooth;
            scrollbar-width: none;
        }
        
        .tab-navigation::-webkit-scrollbar {
            display: none;
        }
        
        /* Estados de interacción mejorados */
        button, a, input, select {
            -webkit-tap-highlight-color: transparent;
            outline: none;
        }
        
        button:focus, a:focus, input:focus, select:focus {
            outline: 2px solid rgba(201,170,113,0.4);
            outline-offset: 2px;
        }
    </style>
</head>
<body>
    <!-- Content del Marketplace -->
    <header class="marketplace-header">
                <div class="header-top">
                    <div class="header-left">
                        <a href="tienda.php" class="back-link">
                            <i class="fas fa-arrow-left"></i>
                            <span>Volver a Tienda</span>
                        </a>
                        <h1 class="marketplace-title">Marketplace</h1>
                        <p class="marketplace-subtitle">Compra y vende con otros jugadores</p>
                        <?php if ($isPremium): ?>
                        <div class="premium-badge">
                            <i class="fas fa-crown"></i>
                            <span>Usuario Premium</span>
                        </div>
                        <?php endif; ?>
                    </div>
                    <div class="currency-badges">
                        <div class="currency-badge">
                            <i class="fas fa-globe"></i>
                            <div>
                                <span class="currency-label">Esferas</span>
                                <span class="currency-value"><?php echo number_format($userData['recompensas']); ?></span>
                            </div>
                        </div>
                        <div class="currency-badge">
                            <i class="fas fa-key"></i>
                            <div>
                                <span class="currency-label">Llaves</span>
                                <span class="currency-value"><?php echo number_format($userData['llaves']); ?></span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            
            <div class="tab-navigation">
                <button class="tab-btn active" data-tab="listings">
                    <i class="fas fa-shopping-bag"></i>
                    <span>Anuncios</span>
                </button>
                <button class="tab-btn" data-tab="my-listings">
                    <i class="fas fa-box-open"></i>
                    <span>Mis Anuncios</span>
                </button>
            </div>
            
            <div class="marketplace-toolbar">
                <div class="search-container">
                    <i class="fas fa-search"></i>
                    <input type="text" id="marketplaceSearch" placeholder="Buscar artículos...">
                </div>
                <div class="filter-group">
                    <select id="marketplaceFilter" class="filter-select">
                        <option value="all">Todos</option>
                        <option value="esferas">Esferas</option>
                        <option value="llaves">Llaves</option>
                        <option value="cupones">Cupones Azules</option>
                    </select>
                    <select id="marketplaceSort" class="filter-select">
                        <option value="recent">Más recientes</option>
                        <option value="price_low">Precio: Menor</option>
                        <option value="price_high">Precio: Mayor</option>
                        <option value="popular">Más populares</option>
                    </select>
                </div>
                <button class="btn-create-listing" onclick="openCreateListingModal()">
                    <i class="fas fa-plus"></i>
                    <span>Vender</span>
                </button>
            </div>
            
            <!-- Tab Content: Listings -->
            <div id="listingsTab" class="content-section">
                <div class="section-header">
                    <h2 class="section-title">Anuncios de Jugadores</h2>
                    <p class="section-subtitle">Explora las ofertas de la comunidad</p>
                </div>
                <div id="marketplaceGrid" class="marketplace-grid">
                    <div class="loading-container">
                        <div class="spinner-border text-warning" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tab Content: My Listings -->
            <div id="myListingsTab" class="content-section" style="display: none;">
                <div class="section-header">
                    <h2 class="section-title">Mis Anuncios</h2>
                    <p class="section-subtitle">Gestiona tus artículos en venta</p>
                </div>
                <div id="myListingsGrid" class="marketplace-grid">
                    <div class="loading-container">
                        <div class="spinner-border text-warning" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modals -->
    <?php include 'marketplace_modals.php'; ?>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="api/marketplace.js"></script>
    <script>
        // Tab Navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        const listingsTab = document.getElementById('listingsTab');
        const myListingsTab = document.getElementById('myListingsTab');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (tab === 'listings') {
                    listingsTab.style.display = 'block';
                    myListingsTab.style.display = 'none';
                    loadMarketplaceListings();
                } else if (tab === 'my-listings') {
                    listingsTab.style.display = 'none';
                    myListingsTab.style.display = 'block';
                    loadMyListings();
                }
            });
        });
        
        // Cargar datos iniciales
        document.addEventListener('DOMContentLoaded', () => {
            loadMarketplaceListings();
        });
    </script>
</body>
</html>

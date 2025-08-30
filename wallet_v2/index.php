<?php
require_once '../includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    header('Location: ../index.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="es" class="h-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Einherjer Blitz Wallet v2</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --primary-gold: #c9aa71;
            --dark-gold: #9e8b54;
            --bg-dark: #0a0a0a;
            --bg-secondary: #1a1a1a;
            --bg-card: #151515;
            --text-primary: rgba(255, 255, 255, 0.95);
            --text-secondary: rgba(255, 255, 255, 0.7);
            --border-gold: rgba(201, 170, 113, 0.3);
            --glow-gold: rgba(201, 170, 113, 0.6);
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .fade-transition {
            transition: all 0.8s ease-in-out;
        }
        
        .page-hidden {
            opacity: 0;
            transform: translateY(30px);
        }
        
        .page-visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .glass-card {
            background: rgba(21, 21, 21, 0.9);
            border: 1px solid var(--border-gold);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .text-gold {
            color: var(--primary-gold);
        }
        
        .btn-gold {
            background: linear-gradient(135deg, var(--primary-gold), var(--dark-gold));
            border: none;
            color: #000;
            font-weight: 600;
        }
        
        .btn-gold:hover {
            background: linear-gradient(135deg, var(--dark-gold), var(--primary-gold));
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(201, 170, 113, 0.3);
        }
        
        .btn-outline-gold {
            border: 2px solid var(--primary-gold);
            color: var(--primary-gold);
            background: transparent;
        }
        
        .btn-outline-gold:hover {
            background: var(--primary-gold);
            color: #000;
        }
        
        .navbar-wallet {
            background: linear-gradient(135deg, var(--bg-secondary), #252525);
            border-bottom: 2px solid var(--border-gold);
        }
        
        .card {
            border-radius: 12px !important;
        }
        
        .placeholder-glow .placeholder {
            background-color: rgba(201, 170, 113, 0.2);
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
            .container {
                padding: 0.5rem !important;
            }
            
            .card-body {
                padding: 1rem !important;
            }
            
            .navbar {
                margin-bottom: 1rem !important;
            }
            
            .col-md-4 {
                margin-bottom: 0.75rem;
            }
            
            .transactions-container {
                max-height: 280px !important;
                border-radius: 8px;
                border: 1px solid var(--border-gold);
                touch-action: pan-y;
            }
            
            .list-group-item {
                padding: 0.75rem 1rem !important;
                border-color: var(--border-gold) !important;
            }
            
            .navbar-brand span {
                font-size: 0.9rem;
            }
            
            .btn-sm {
                font-size: 0.8rem;
                padding: 0.25rem 0.5rem;
            }
        }
        
        .transactions-container {
            max-height: 400px;
            overflow-y: scroll;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: var(--primary-gold) var(--bg-card);
        }
        
        .transactions-container::-webkit-scrollbar {
            width: 4px;
        }
        
        .transactions-container::-webkit-scrollbar-track {
            background: var(--bg-card);
        }
        
        .transactions-container::-webkit-scrollbar-thumb {
            background: var(--primary-gold);
            border-radius: 2px;
        }
        
        .list-group-item {
            color: var(--text-primary) !important;
            border-color: var(--border-gold) !important;
        }
        
        .list-group-item h6 {
            color: var(--text-primary) !important;
        }
        
        .list-group-item small {
            color: var(--text-secondary) !important;
        }
        
        .main-content {
            padding-bottom: 2rem;
        }
    </style>
</head>
<body>
    
    <!-- Splash Screen -->
    <div id="splashScreen" class="position-fixed w-100 h-100 d-flex align-items-center justify-content-center fade-transition" 
         style="background: linear-gradient(135deg, var(--bg-dark), var(--bg-secondary)); z-index: 1050;">
        <div class="text-center">
            <div class="mb-4">
                <i class="fas fa-wallet display-1 text-white mb-3"></i>
            </div>
            <h1 class="display-4 fw-bold text-gold mb-2">Einherjer Blitz</h1>
            <h2 class="h3 text-secondary mb-4">Wallet v2</h2>
            <div class="spinner-border text-gold" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <div class="mt-3">
                <small class="text-white-50">Inicializando tu billetera...</small>
            </div>
        </div>
    </div>

    <!-- Main Wallet Interface -->
    <div id="mainWallet" class="page-hidden fade-transition" style="display: none; min-height: 100vh; padding-top: 1rem;">
        
        <!-- Header -->
        <nav class="navbar navbar-expand-lg navbar-dark navbar-wallet rounded-4 mb-4">
            <div class="container">
                <div class="navbar-brand d-flex align-items-center">
                    <i class="fas fa-shield-alt me-2 text-gold"></i>
                    <span class="fw-bold text-gold">Einherjer Blitz Wallet v2</span>
                </div>
                <div class="d-flex align-items-center">
                    <img src="../images/<?php echo htmlspecialchars($userData['perfil_imagen']); ?>" 
                         alt="Avatar" class="rounded-circle me-2" width="32" height="32">
                    <span class="me-3 text-secondary"><?php echo htmlspecialchars($userData['username']); ?></span>
                    <a href="../dashboard.php" class="btn btn-outline-gold btn-sm">
                        <i class="fas fa-arrow-left me-1"></i> Volver
                    </a>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="container main-content">
            <div class="row g-4">
                
                <!-- Balance Overview -->
                <div class="col-12">
                    <div class="card glass-card border-0 rounded-4">
                        <div class="card-body p-4">
                            <h5 class="card-title text-gold mb-4">
                                <i class="fas fa-chart-pie me-2"></i>Balance General
                            </h5>
                            <div class="row text-center" id="balanceCards">
                                <!-- Skeleton loaders will be replaced by actual data -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Assets Details -->
                <div class="col-md-6">
                    <div class="card glass-card border-0 rounded-4 h-100">
                        <div class="card-body p-4">
                            <h5 class="card-title text-gold mb-4">
                                <i class="fas fa-key me-2"></i>Llaves
                            </h5>
                            <div id="keysSection">
                                <!-- Skeleton loader -->
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <div class="placeholder-glow">
                                            <span class="placeholder col-6 bg-secondary"></span>
                                        </div>
                                        <div class="placeholder-glow mt-1">
                                            <span class="placeholder col-4 bg-secondary"></span>
                                        </div>
                                    </div>
                                    <div class="placeholder-glow">
                                        <span class="placeholder col-3 bg-secondary"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card glass-card border-0 rounded-4 h-100">
                        <div class="card-body p-4">
                            <h5 class="card-title text-gold mb-4">
                                <i class="fas fa-globe me-2"></i>Esferas
                            </h5>
                            <div id="spheresSection">
                                <!-- Skeleton loader -->
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <div class="placeholder-glow">
                                            <span class="placeholder col-6 bg-secondary"></span>
                                        </div>
                                        <div class="placeholder-glow mt-1">
                                            <span class="placeholder col-4 bg-secondary"></span>
                                        </div>
                                    </div>
                                    <div class="placeholder-glow">
                                        <span class="placeholder col-3 bg-secondary"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Transactions History -->
                <div class="col-12">
                    <div class="card glass-card border-0 rounded-4">
                        <div class="card-body p-4">
                            <h5 class="card-title text-gold mb-4">
                                <i class="fas fa-history me-2"></i>Historial de Transacciones
                            </h5>
                            <div id="transactionsSection">
                                <!-- Skeleton loaders -->
                                <div class="list-group list-group-flush transactions-container">
                                    <div class="list-group-item bg-transparent border-secondary">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <div class="placeholder-glow">
                                                    <span class="placeholder col-4 bg-secondary"></span>
                                                </div>
                                                <div class="placeholder-glow mt-1">
                                                    <span class="placeholder col-6 bg-secondary"></span>
                                                </div>
                                            </div>
                                            <div class="placeholder-glow">
                                                <span class="placeholder col-2 bg-secondary"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Terrain Section -->
                <div class="col-12" id="terrainSection">
                    <div class="card glass-card border-0 rounded-4">
                        <div class="card-body p-4">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h5 class="card-title text-gold mb-0">
                                    <i class="fas fa-mountain me-2"></i>Mis Terrenos
                                </h5>
                                <a href="../terrenos/index.php" class="btn btn-outline-gold btn-sm">
                                    <i class="fas fa-chart-line me-1"></i>Ver Mercado
                                </a>
                            </div>
                            <div id="terrainContent">
                                <!-- Loading skeleton -->
                                <div class="text-center py-4">
                                    <div class="spinner-border text-gold" role="status">
                                        <span class="visually-hidden">Cargando terrenos...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom JS -->
    <script>
        // User data from PHP
        const userData = {
            id: <?php echo $userData['id']; ?>,
            username: "<?php echo htmlspecialchars($userData['username']); ?>",
            keys: <?php echo $userData['llaves']; ?>,
            spheres: <?php echo $userData['recompensas']; ?>,
            level: <?php echo $userData['nivel']; ?>
        };

        // Initialize wallet
        document.addEventListener('DOMContentLoaded', function() {
            initializeWallet();
        });

        function initializeWallet() {
            // Show splash screen for 2 seconds
            setTimeout(() => {
                // Hide splash screen
                const splashScreen = document.getElementById('splashScreen');
                splashScreen.style.opacity = '0';
                splashScreen.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    // Completely remove splash screen from DOM
                    splashScreen.remove();
                    
                    // Show main wallet
                    const mainWallet = document.getElementById('mainWallet');
                    mainWallet.style.display = 'block';
                    
                    setTimeout(() => {
                        mainWallet.classList.remove('page-hidden');
                        mainWallet.classList.add('page-visible');
                        
                        // Load wallet data
                        loadWalletData();
                    }, 100);
                }, 300);
            }, 2000);
        }

        function loadWalletData() {
            // Load balance cards
            loadBalanceCards();
            
            // Load sections with delay for smooth effect
            setTimeout(() => loadKeysSection(), 500);
            setTimeout(() => loadSpheresSection(), 700);
            setTimeout(() => loadTransactions(false), 900);
            setTimeout(() => checkTerrain(), 1100);
        }

        function loadBalanceCards() {
            const balanceCards = document.getElementById('balanceCards');
            balanceCards.innerHTML = `
                <div class="col-md-4 mb-3">
                    <div class="card glass-card border-2 h-100" style="border-color: var(--primary-gold) !important;">
                        <div class="card-body text-center">
                            <i class="fas fa-key fa-2x text-gold mb-2"></i>
                            <h3 class="text-gold fw-bold">${userData.keys.toLocaleString()}</h3>
                            <p class="text-secondary mb-0">Llaves Totales</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card glass-card border-2 h-100" style="border-color: var(--primary-gold) !important;">
                        <div class="card-body text-center">
                            <i class="fas fa-globe fa-2x text-gold mb-2"></i>
                            <h3 class="text-gold fw-bold">${userData.spheres.toLocaleString()}</h3>
                            <p class="text-secondary mb-0">Esferas Totales</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card glass-card border-2 h-100" style="border-color: var(--primary-gold) !important;">
                        <div class="card-body text-center">
                            <i class="fas fa-level-up-alt fa-2x text-gold mb-2"></i>
                            <h3 class="text-gold fw-bold">Nivel ${userData.level}</h3>
                            <p class="text-secondary mb-0">Nivel Actual</p>
                        </div>
                    </div>
                </div>
            `;
        }

        function loadKeysSection() {
            const keysSection = document.getElementById('keysSection');
            keysSection.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h6 class="mb-1 text-gold">Llaves Disponibles</h6>
                        <small class="text-secondary">Para abrir cofres</small>
                    </div>
                    <span class="badge bg-gold fs-6 px-3 py-2" style="background: var(--primary-gold); color: #000;">${userData.keys}</span>
                </div>
                <div class="progress" style="height: 8px; background: rgba(201, 170, 113, 0.2);">
                    <div class="progress-bar" role="progressbar" style="background: var(--primary-gold); width: ${Math.min((userData.keys / 100) * 100, 100)}%"></div>
                </div>
            `;
        }

        function loadSpheresSection() {
            const spheresSection = document.getElementById('spheresSection');
            spheresSection.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h6 class="mb-1 text-gold">Esferas Disponibles</h6>
                        <small class="text-secondary">Moneda del juego</small>
                    </div>
                    <span class="badge bg-gold fs-6 px-3 py-2" style="background: var(--primary-gold); color: #000;">${userData.spheres}</span>
                </div>
                <div class="progress" style="height: 8px; background: rgba(201, 170, 113, 0.2);">
                    <div class="progress-bar" role="progressbar" style="background: var(--primary-gold); width: ${Math.min((userData.spheres / 10000) * 100, 100)}%"></div>
                </div>
            `;
        }

        let currentOffset = 0;
        const transactionLimit = 10;
        
        function loadTransactions(append = false) {
            // Fetch transactions from API with pagination
            fetch(`api/get_transactions.php?limit=${transactionLimit}&offset=${currentOffset}`)
                .then(response => response.json())
                .then(data => {
                    const transactionsSection = document.getElementById('transactionsSection');
                    
                    if (data.success && data.transactions.length > 0) {
                        let transactionHTML = '';
                        
                        if (!append) {
                            transactionHTML = '<div class="list-group list-group-flush transactions-container">';
                        }
                        
                        data.transactions.forEach(transaction => {
                            const icon = getTransactionIcon(transaction.tipo);
                            const color = getTransactionColor(transaction.tipo);
                            
                            transactionHTML += `
                                <div class="list-group-item bg-transparent border-secondary">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div class="d-flex align-items-center">
                                            <i class="${icon} ${color} me-3"></i>
                                            <div>
                                                <h6 class="mb-1 text-white">${transaction.descripcion || transaction.tipo}</h6>
                                                <small class="text-secondary">${new Date(transaction.fecha).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                        <span class="badge ${color.replace('text-', 'bg-')} fs-6">
                                            ${transaction.cantidad > 0 ? '+' : ''}${transaction.cantidad}
                                        </span>
                                    </div>
                                </div>
                            `;
                        });
                        
                        if (!append) {
                            transactionHTML += '</div>';
                            
                            // Add load more button if there are more transactions
                            if (data.hasMore) {
                                transactionHTML += `
                                    <div class="text-center mt-3">
                                        <button class="btn btn-outline-gold btn-sm" onclick="loadMoreTransactions()">
                                            <i class="fas fa-chevron-down me-2"></i>Cargar más
                                        </button>
                                    </div>
                                `;
                            }
                            
                            transactionsSection.innerHTML = transactionHTML;
                        } else {
                            // Append to existing list
                            const listGroup = transactionsSection.querySelector('.list-group');
                            if (listGroup) {
                                listGroup.insertAdjacentHTML('beforeend', transactionHTML);
                            }
                            
                            // Update or remove load more button
                            const loadMoreBtn = transactionsSection.querySelector('button');
                            if (!data.hasMore && loadMoreBtn) {
                                loadMoreBtn.remove();
                            }
                        }
                    } else if (!append) {
                        transactionsSection.innerHTML = `
                            <div class="text-center text-muted py-4">
                                <i class="fas fa-history fa-3x mb-3 opacity-50"></i>
                                <p>No hay transacciones recientes</p>
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Error loading transactions:', error);
                    if (!append) {
                        document.getElementById('transactionsSection').innerHTML = `
                            <div class="alert alert-danger" role="alert">
                                Error al cargar las transacciones. Por favor, intenta de nuevo.
                            </div>
                        `;
                    }
                });
        }
        
        function loadMoreTransactions() {
            currentOffset += transactionLimit;
            loadTransactions(true);
        }

        function checkTerrain() {
            // Load user's terrain investments
            fetch('../terrenos/api/user_investments.php')
                .then(response => response.json())
                .then(data => {
                    const terrainContent = document.getElementById('terrainContent');
                    
                    if (data.success && data.investments.length > 0) {
                        let terrainHTML = '<div class="row">';
                        
                        data.investments.forEach(investment => {
                            const pnlClass = investment.ganancia_perdida >= 0 ? 'text-success' : 'text-danger';
                            const pnlSign = investment.ganancia_perdida >= 0 ? '+' : '';
                            
                            terrainHTML += `
                                <div class="col-md-6 mb-3">
                                    <div class="card bg-transparent border-secondary">
                                        <div class="card-body p-3">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="text-gold mb-0">${investment.terrain_nombre}</h6>
                                                <small class="text-secondary">${investment.cantidad_acciones.toLocaleString()} acciones</small>
                                            </div>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <small class="text-secondary d-block">Valor actual</small>
                                                    <span class="fw-bold">${investment.valor_actual.toLocaleString()} Esencias Azules</span>
                                                </div>
                                                <div class="text-end">
                                                    <small class="text-secondary d-block">G/P</small>
                                                    <span class="fw-bold ${pnlClass}">
                                                        ${pnlSign}${investment.ganancia_perdida.toLocaleString()}
                                                        (${pnlSign}${investment.porcentaje_cambio}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        
                        terrainHTML += '</div>';
                        
                        // Add portfolio summary
                        if (data.portfolio_summary) {
                            const totalPnlClass = data.portfolio_summary.total_pnl >= 0 ? 'text-success' : 'text-danger';
                            const totalPnlSign = data.portfolio_summary.total_pnl >= 0 ? '+' : '';
                            
                            terrainHTML += `
                                <div class="card bg-transparent border-gold mt-3">
                                    <div class="card-body p-3">
                                        <div class="row text-center">
                                            <div class="col-4">
                                                <small class="text-secondary d-block">Invertido</small>
                                                <span class="fw-bold">${data.portfolio_summary.total_invested.toLocaleString()}</span>
                                            </div>
                                            <div class="col-4">
                                                <small class="text-secondary d-block">Valor actual</small>
                                                <span class="fw-bold">${data.portfolio_summary.total_current_value.toLocaleString()}</span>
                                            </div>
                                            <div class="col-4">
                                                <small class="text-secondary d-block">Total G/P</small>
                                                <span class="fw-bold ${totalPnlClass}">
                                                    ${totalPnlSign}${data.portfolio_summary.total_pnl.toLocaleString()}
                                                    (${totalPnlSign}${data.portfolio_summary.total_pnl_percent}%)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                        
                        terrainContent.innerHTML = terrainHTML;
                    } else {
                        terrainContent.innerHTML = `
                            <div class="text-center text-secondary py-4">
                                <i class="fas fa-mountain fa-3x mb-3 opacity-50"></i>
                                <p>No tienes inversiones en terrenos</p>
                                <p class="small">Visita el mercado para comenzar a invertir</p>
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Error loading terrain investments:', error);
                    document.getElementById('terrainContent').innerHTML = `
                        <div class="text-center text-secondary py-4">
                            <i class="fas fa-exclamation-triangle fa-2x mb-2 text-warning"></i>
                            <p>Error al cargar tus terrenos</p>
                        </div>
                    `;
                });
        }

        function getTransactionIcon(type) {
            const icons = {
                'minado': 'fas fa-pickaxe',
                'deposito': 'fas fa-arrow-down',
                'transferencia': 'fas fa-exchange-alt',
                'retiro': 'fas fa-arrow-up',
                'compra': 'fas fa-shopping-cart'
            };
            return icons[type] || 'fas fa-coins';
        }

        function getTransactionColor(type) {
            const colors = {
                'minado': 'text-warning',
                'deposito': 'text-success',
                'transferencia': 'text-info',
                'retiro': 'text-danger',
                'compra': 'text-primary'
            };
            return colors[type] || 'text-secondary';
        }

        function useKeys() {
            window.location.href = '../gacha/index.php';
        }

        function transferSpheres() {
            window.location.href = '../transferir.php';
        }
    </script>
</body>
</html>

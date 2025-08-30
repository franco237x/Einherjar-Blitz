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
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inversión en Terrenos - Einherjer Blitz</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@400;500;600;700&display=swap" rel="stylesheet">
    
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
            --success-green: #28a745;
            --danger-red: #dc3545;
            --warning-orange: #fd7e14;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            min-height: 100vh;
        }
        
        .glass-card {
            background: rgba(21, 21, 21, 0.9);
            border: 1px solid var(--border-gold);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border-radius: 12px;
        }
        
        .terrain-card {
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .terrain-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(201, 170, 113, 0.2);
        }
        
        .price-change {
            font-weight: 600;
        }
        
        .price-up {
            color: var(--success-green);
        }
        
        .price-down {
            color: var(--danger-red);
        }
        
        .price-neutral {
            color: var(--text-secondary);
        }
        
        .navbar-terrenos {
            background: linear-gradient(135deg, var(--bg-secondary), #252525);
            border-bottom: 2px solid var(--border-gold);
        }
        
        .btn-gold {
            background: linear-gradient(135deg, var(--primary-gold), var(--dark-gold));
            border: none;
            color: #000;
            font-weight: 600;
        }
        
        .btn-gold:hover {
            background: linear-gradient(135deg, var(--dark-gold), var(--primary-gold));
            color: #000;
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
            border-color: var(--primary-gold);
        }
        
        .text-gold {
            color: var(--primary-gold);
        }
        
        .chart-container {
            position: relative;
            height: 400px;
            width: 100%;
        }
        
        .market-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            text-align: center;
            padding: 1.5rem;
        }
        
        .stat-value {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--primary-gold);
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin-top: 0.5rem;
        }
        
        .terrain-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
        }
        
        .investment-modal .modal-content,
        #sellModal .modal-content {
            background: var(--bg-card);
            border: 1px solid var(--border-gold);
            color: var(--text-primary);
        }
        
        .form-control {
            background: var(--bg-secondary);
            border: 1px solid var(--border-gold);
            color: var(--text-primary);
        }
        
        .form-control:focus {
            background: var(--bg-secondary);
            border-color: var(--primary-gold);
            color: var(--text-primary);
            box-shadow: 0 0 0 0.2rem rgba(201, 170, 113, 0.25);
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .pulse-animation {
            animation: pulse 2s infinite;
        }
        
        @media (max-width: 768px) {
            .chart-container {
                height: 300px;
            }
            
            .market-stats {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <nav class="navbar navbar-expand-lg navbar-dark navbar-terrenos">
        <div class="container">
            <div class="navbar-brand d-flex align-items-center">
                <i class="fas fa-mountain me-2 text-gold"></i>
                <span class="fw-bold text-gold" style="font-family: 'Cinzel', serif;">Mercado de Terrenos</span>
            </div>
            <div class="d-flex align-items-center">
                <div class="me-4">
                    <i class="fas fa-globe text-gold me-1"></i>
                    <span class="fw-bold text-gold" id="userSpheres"><?php echo number_format($userData['recompensas']); ?></span>
                    <small class="text-secondary">Esencias Azules</small>
                </div>
                <img src="../images/<?php echo htmlspecialchars($userData['perfil_imagen']); ?>" 
                     alt="Avatar" class="rounded-circle me-2" width="32" height="32">
                <span class="me-3 text-secondary"><?php echo htmlspecialchars($userData['username']); ?></span>
                <a href="../wallet_v2/index.php" class="btn btn-outline-gold btn-sm">
                    <i class="fas fa-arrow-left me-1"></i> Volver
                </a>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <!-- Market Overview -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="glass-card p-4">
                    <h2 class="text-gold mb-4">
                        <i class="fas fa-chart-line me-2"></i>Vista General del Mercado
                    </h2>
                    <div class="market-stats" id="marketStats">
                        <!-- Stats will be loaded here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Featured Terrain Chart -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="glass-card p-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="text-gold mb-0">
                            <i class="fas fa-chart-area me-2"></i>Gráfico de Precios
                        </h3>
                        <select class="form-select w-auto" id="terrainSelector" style="background: var(--bg-secondary); border: 1px solid var(--border-gold); color: var(--text-primary);">
                            <option value="">Seleccionar terreno...</option>
                        </select>
                    </div>
                    <div class="chart-container">
                        <canvas id="priceChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Terrain List -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="glass-card p-4">
                    <h3 class="text-gold mb-4">
                        <i class="fas fa-map me-2"></i>Terrenos Disponibles
                    </h3>
                    <div class="row" id="terrainList">
                        <!-- Terrain cards will be loaded here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- My Investments -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="glass-card p-4">
                    <h3 class="text-gold mb-4">
                        <i class="fas fa-wallet me-2"></i>Mis Inversiones
                    </h3>
                    <div id="userInvestments">
                        <!-- User investments will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Investment Modal -->
    <div class="modal fade investment-modal" id="investmentModal" tabindex="-1" data-bs-theme="dark">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header border-bottom border-secondary">
                    <h5 class="modal-title text-gold" id="investmentModalTitle">
                        <i class="fas fa-coins me-2"></i>Invertir en Terreno
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="investmentContent">
                        <!-- Investment form will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Sell Modal -->
    <div class="modal fade" id="sellModal" tabindex="-1" data-bs-theme="dark">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header border-bottom border-secondary">
                    <h5 class="modal-title text-gold" id="sellModalTitle">
                        <i class="fas fa-hand-holding-usd me-2"></i>Vender Terreno
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="sellContent">
                        <!-- Sell form will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        // User data
        const userData = {
            id: <?php echo $userData['id']; ?>,
            username: "<?php echo htmlspecialchars($userData['username']); ?>",
            spheres: <?php echo $userData['recompensas']; ?>
        };

        let priceChart = null;
        let selectedTerrain = null;

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            loadMarketStats();
            loadTerrainList();
            loadUserInvestments();
            initializePriceChart();
            
            // Auto-refresh every 30 seconds
            setInterval(() => {
                loadMarketStats();
                loadTerrainList();
                loadUserInvestments();
                if (selectedTerrain) {
                    updatePriceChart(selectedTerrain);
                }
            }, 30000);
        });

        // Load market statistics
        function loadMarketStats() {
            fetch('api/market_stats.php')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        displayMarketStats(data.stats);
                    }
                })
                .catch(error => console.error('Error loading market stats:', error));
        }

        // Display market statistics
        function displayMarketStats(stats) {
            const statsContainer = document.getElementById('marketStats');
            statsContainer.innerHTML = `
                <div class="glass-card stat-card">
                    <div class="stat-value">${formatNumber(stats.total_market_cap || 0)}</div>
                    <div class="stat-label">Cap. de Mercado Total</div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-value">${formatNumber(stats.volume_24h || 0)}</div>
                    <div class="stat-label">Volumen 24h</div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-value">${stats.total_investors || 0}</div>
                    <div class="stat-label">Total Inversores</div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-value price-${stats.market_trend === 'up' ? 'up' : stats.market_trend === 'down' ? 'down' : 'neutral'}">${stats.market_change_24h > 0 ? '+' : ''}${stats.market_change_24h || 0}%</div>
                    <div class="stat-label">Cambio 24h</div>
                </div>
            `;
        }

        // Load terrain list
        function loadTerrainList() {
            fetch('api/terrains.php')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        displayTerrainList(data.terrains);
                        updateTerrainSelector(data.terrains);
                    }
                })
                .catch(error => console.error('Error loading terrains:', error));
        }

        // Display terrain list
        function displayTerrainList(terrains) {
            const terrainContainer = document.getElementById('terrainList');
            terrainContainer.innerHTML = terrains.map(terrain => {
                let ownershipBadge = '';
                let ownershipInfo = '';
                
                if (terrain.ownership_status === 'yours') {
                    ownershipBadge = '<div class="badge bg-success position-absolute top-0 end-0 m-2"><i class="fas fa-crown me-1"></i>Tu Terreno</div>';
                    ownershipInfo = '<small class="text-success"><i class="fas fa-crown me-1"></i>Este terreno te pertenece</small>';
                } else if (terrain.ownership_status === 'owned_by_other') {
                    ownershipBadge = '<div class="badge bg-warning text-dark position-absolute top-0 end-0 m-2"><i class="fas fa-user me-1"></i>Propietario</div>';
                    ownershipInfo = `<small class="text-warning"><i class="fas fa-user me-1"></i>Propietario: ${terrain.owner_username}</small>`;
                } else {
                    ownershipBadge = '<div class="badge bg-secondary position-absolute top-0 end-0 m-2"><i class="fas fa-map me-1"></i>Disponible</div>';
                    ownershipInfo = '<small class="text-secondary"><i class="fas fa-map me-1"></i>Sin propietario</small>';
                }
                
                return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="glass-card terrain-card p-3 position-relative" onclick="openInvestmentModal(${terrain.id})">
                        ${ownershipBadge}
                        <img src="../images/terrains/${terrain.imagen}" alt="${terrain.nombre}" class="terrain-image mb-3">
                        <h5 class="text-gold">${terrain.nombre}</h5>
                        <p class="text-secondary small mb-2">${terrain.descripcion}</p>
                        ${ownershipInfo}
                        <div class="d-flex justify-content-between align-items-center mb-2 mt-2">
                            <span class="fw-bold">${formatNumber(terrain.precio_actual)} <small class="text-secondary">Esencias Azules</small></span>
                            <span class="price-change price-${terrain.cambio_24h >= 0 ? 'up' : 'down'}">
                                ${terrain.cambio_24h >= 0 ? '+' : ''}${terrain.cambio_24h}%
                            </span>
                        </div>
                        <div class="progress mb-2" style="height: 4px;">
                            <div class="progress-bar" style="width: ${(terrain.supply_circulante / terrain.supply_total) * 100}%; background: var(--primary-gold);"></div>
                        </div>
                        <small class="text-secondary">${formatNumber(terrain.supply_circulante)} / ${formatNumber(terrain.supply_total)} vendidas</small>
                        <div class="mt-3">
                            <button class="btn btn-gold w-100" onclick="event.stopPropagation(); openInvestmentModal(${terrain.id})">
                                <i class="fas fa-coins me-2"></i>Invertir
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }

        // Update terrain selector
        function updateTerrainSelector(terrains) {
            const selector = document.getElementById('terrainSelector');
            selector.innerHTML = '<option value="">Seleccionar terreno...</option>' + 
                terrains.map(terrain => `<option value="${terrain.id}">${terrain.nombre}</option>`).join('');
            
            selector.addEventListener('change', function() {
                if (this.value) {
                    selectedTerrain = parseInt(this.value);
                    updatePriceChart(selectedTerrain);
                }
            });
        }

        // Load user investments
        function loadUserInvestments() {
            fetch('api/user_investments.php')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        displayUserInvestments(data.investments);
                    }
                })
                .catch(error => console.error('Error loading user investments:', error));
        }

        // Display user investments
        function displayUserInvestments(investments) {
            const container = document.getElementById('userInvestments');
            if (!investments.length) {
                container.innerHTML = `
                    <div class="text-center text-secondary py-4">
                        <i class="fas fa-chart-line fa-3x mb-3 opacity-50"></i>
                        <p>Aún no tienes inversiones en terrenos</p>
                        <p class="small">¡Comienza a invertir para ver tu portfolio aquí!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-dark">
                        <thead>
                            <tr>
                                <th>Terreno</th>
                                <th>Acciones</th>
                                <th>Precio Promedio</th>
                                <th>Inversión Total</th>
                                <th>Valor Actual</th>
                                <th>Ganancia/Pérdida</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${investments.map(inv => {
                                const currentValue = inv.cantidad_acciones * inv.precio_actual;
                                const pnl = currentValue - inv.inversion_total;
                                const pnlPercent = ((pnl / inv.inversion_total) * 100).toFixed(2);
                                return `
                                    <tr>
                                        <td>${inv.terrain_nombre}</td>
                                        <td>${formatNumber(inv.cantidad_acciones)}</td>
                                        <td>${formatNumber(inv.precio_compra_promedio)} Esencias Azules</td>
                                        <td>${formatNumber(inv.inversion_total)} Esencias Azules</td>
                                        <td>${formatNumber(currentValue)} Esencias Azules</td>
                                        <td class="price-${pnl >= 0 ? 'up' : 'down'}">
                                            ${pnl >= 0 ? '+' : ''}${formatNumber(pnl)} (${pnlPercent}%)
                                        </td>
                                        <td>
                                            <button class="btn btn-outline-gold btn-sm me-2" onclick="openSellModal(${inv.terreno_id}, '${inv.terrain_nombre}', ${inv.cantidad_acciones}, ${inv.precio_actual})">
                                                <i class="fas fa-hand-holding-usd me-1"></i>Vender
                                            </button>
                                            <button class="btn btn-gold btn-sm" onclick="openInvestmentModal(${inv.terreno_id})">
                                                <i class="fas fa-plus me-1"></i>Comprar
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Initialize price chart
        function initializePriceChart() {
            const ctx = document.getElementById('priceChart').getContext('2d');
            priceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Precio (Esencias Azules)',
                        data: [],
                        borderColor: '#c9aa71',
                        backgroundColor: 'rgba(201, 170, 113, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#ffffff'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#ffffff'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
        }

        // Update price chart
        function updatePriceChart(terrainId) {
            fetch(`api/price_history.php?terrain_id=${terrainId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        priceChart.data.labels = data.history.map(h => new Date(h.fecha).toLocaleDateString());
                        priceChart.data.datasets[0].data = data.history.map(h => parseFloat(h.precio));
                        priceChart.update();
                    }
                })
                .catch(error => console.error('Error loading price history:', error));
        }

        // Open investment modal
        function openInvestmentModal(terrainId) {
            fetch(`api/terrain_details.php?id=${terrainId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        displayInvestmentForm(data.terrain);
                        new bootstrap.Modal(document.getElementById('investmentModal')).show();
                    }
                })
                .catch(error => console.error('Error loading terrain details:', error));
        }

        // Display investment form
        function displayInvestmentForm(terrain) {
            let ownershipInfo = '';
            if (terrain.ownership_status === 'yours') {
                ownershipInfo = '<div class="alert alert-success"><i class="fas fa-crown me-2"></i><strong>Este terreno te pertenece</strong></div>';
            } else if (terrain.ownership_status === 'owned_by_other') {
                ownershipInfo = `<div class="alert alert-warning"><i class="fas fa-user me-2"></i><strong>Propietario:</strong> ${terrain.owner_username}</div>`;
            } else {
                ownershipInfo = '<div class="alert alert-info"><i class="fas fa-map me-2"></i><strong>Terreno disponible</strong> - Sin propietario actual</div>';
            }
            
            document.getElementById('investmentModalTitle').innerHTML = 
                `<i class="fas fa-coins me-2"></i>Invertir en ${terrain.nombre}`;
            
            document.getElementById('investmentContent').innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <img src="../images/terrains/${terrain.imagen}" alt="${terrain.nombre}" class="w-100 rounded mb-3">
                        <h5 class="text-gold">${terrain.nombre}</h5>
                        <p class="text-secondary">${terrain.descripcion}</p>
                        ${ownershipInfo}
                        <div class="mb-3">
                                <strong class="text-gold">Precio actual:</strong> ${formatNumber(terrain.precio_actual)} Esencias Azules<br>
                                <strong class="text-gold">Cambio 24h:</strong> <span class="price-${terrain.cambio_24h >= 0 ? 'up' : 'down'}">${terrain.cambio_24h >= 0 ? '+' : ''}${terrain.cambio_24h}%</span><br>
                                <strong class="text-gold">Market Cap:</strong> ${formatNumber(terrain.market_cap)} Esencias Azules
                        </div>
                    </div>
                    <div class="col-md-6">
                        <form id="investmentForm" onsubmit="makeInvestment(event, ${terrain.id})">
                            <div class="mb-3">
                                <label class="form-label text-gold">Cantidad de Esencias Azules a Invertir</label>
                                <input type="number" class="form-control" id="investmentAmount" min="1" max="${userData.spheres}" required>
                                <div class="form-text text-secondary">
                                    Disponible: ${formatNumber(userData.spheres)} Esencias Azules
                                </div>
                            </div>
                            <div class="mb-3" id="investmentPreview">
                                <!-- Preview will be shown here -->
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-gold">
                                    <i class="fas fa-coins me-2"></i>Confirmar Inversión
                                </button>
                                <button type="button" class="btn btn-outline-gold" data-bs-dismiss="modal">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            // Add real-time preview
            document.getElementById('investmentAmount').addEventListener('input', function() {
                const amount = parseFloat(this.value) || 0;
                const shares = Math.floor(amount / terrain.precio_actual);
                document.getElementById('investmentPreview').innerHTML = `
                    <div class="alert alert-info">
                        <strong>Vista Previa:</strong><br>
                        Recibirás aproximadamente <strong>${formatNumber(shares)}</strong> acciones<br>
                        Precio por acción: <strong>${formatNumber(terrain.precio_actual)}</strong> Esencias Azules<br>
                        <small class="text-muted">Pagarás con ${formatNumber(amount)} Esencias Azules de tu wallet</small>
                    </div>
                `;
            });
        }

        // Open sell modal
        function openSellModal(terrainId, terrainName, shares, currentPrice) {
            document.getElementById('sellModalTitle').innerHTML = 
                `<i class="fas fa-hand-holding-usd me-2"></i>Vender ${terrainName}`;
            
            document.getElementById('sellContent').innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h5 class="text-gold">${terrainName}</h5>
                        <p class="text-secondary">Precio actual: ${formatNumber(currentPrice)} Esencias Azules</p>
                        <p class="text-secondary">Acciones disponibles: ${formatNumber(shares)}</p>
                    </div>
                    <div class="col-md-6">
                        <form id="sellForm" onsubmit="makeSell(event, ${terrainId}, ${shares}, ${currentPrice})">
                            <div class="mb-3">
                                <label class="form-label text-gold">Cantidad de Acciones a Vender</label>
                                <input type="number" class="form-control" id="sellAmount" min="1" max="${shares}" required>
                                <div class="form-text text-secondary">
                                    Disponible: ${formatNumber(shares)} acciones
                                </div>
                            </div>
                            <div class="mb-3" id="sellPreview">
                                <!-- Preview will be shown here -->
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-gold">
                                    <i class="fas fa-hand-holding-usd me-2"></i>Confirmar Venta
                                </button>
                                <button type="button" class="btn btn-outline-gold" data-bs-dismiss="modal">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            // Add real-time preview
            document.getElementById('sellAmount').addEventListener('input', function() {
                const amount = parseFloat(this.value) || 0;
                const revenue = amount * currentPrice;
                document.getElementById('sellPreview').innerHTML = `
                    <div class="alert alert-info">
                        <strong>Vista Previa:</strong><br>
                        Obtendrás aproximadamente <strong>${formatNumber(revenue)}</strong> Esencias Azules<br>
                        <small class="text-muted">Venderás ${formatNumber(amount)} acciones</small>
                    </div>
                `;
            });

            new bootstrap.Modal(document.getElementById('sellModal')).show();
        }

        // Make investment
        function makeInvestment(event, terrainId) {
            event.preventDefault();
            const amount = parseFloat(document.getElementById('investmentAmount').value);
            
            if (amount > userData.spheres) {
                alert('No tienes suficientes Esencias Azules para esta inversión');
                return;
            }

            fetch('api/invest.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    terrain_id: terrainId,
                    amount: amount
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('¡Inversión realizada con éxito!');
                    bootstrap.Modal.getInstance(document.getElementById('investmentModal')).hide();
                    
                    // Update user spheres
                    userData.spheres = data.new_balance;
                    document.getElementById('userSpheres').textContent = formatNumber(userData.spheres);
                    
                    // Refresh data
                    loadMarketStats();
                    loadTerrainList();
                    loadUserInvestments();
                } else {
                    alert('Error al realizar la inversión: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error making investment:', error);
                alert('Error al procesar la inversión');
            });
        }

        // Make sell
        function makeSell(event, terrainId, shares, currentPrice) {
            event.preventDefault();
            const amount = parseFloat(document.getElementById('sellAmount').value);
            
            if (amount > shares) {
                alert('No tienes suficientes acciones para esta venta');
                return;
            }

            fetch('api/sell.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    terrain_id: terrainId,
                    amount: amount
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('¡Venta realizada con éxito!');
                    bootstrap.Modal.getInstance(document.getElementById('sellModal')).hide();
                    
                    // Update user spheres
                    userData.spheres = data.new_balance;
                    document.getElementById('userSpheres').textContent = formatNumber(userData.spheres);
                    
                    // Refresh data
                    loadMarketStats();
                    loadTerrainList();
                    loadUserInvestments();
                } else {
                    alert('Error al realizar la venta: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error making sell:', error);
                alert('Error al procesar la venta');
            });
        }

        // Utility functions
        function formatNumber(num) {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
            }
            return parseFloat(num).toLocaleString();
        }
    </script>
</body>
</html>

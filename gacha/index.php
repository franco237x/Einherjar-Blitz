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
    <title>Gacha - Cofres | Einherjer Blitz 3.0</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Dashboard CSS -->
    <link rel="stylesheet" href="../assets/css/dashboard.css">
    
    <!-- Gacha CSS -->
    <link rel="stylesheet" href="assets/css/gacha.css">
    
    <!-- Meta tags -->
    <meta name="description" content="Sistema Gacha - Cofres de Einherjer Blitz 3.0">
    <meta name="robots" content="noindex, nofollow">
</head>
<body class="d-flex flex-column h-100 gacha-body">
    <!-- Header -->
    <header class="gacha-header">
        <div class="container-fluid">
            <div class="header-content">
                <div class="brand-section">
                    <a href="../dashboard.php" class="back-btn">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <div class="brand-info">
                        <h1 class="page-title">
                            <i class="fas fa-gift me-2"></i>
                            Sistema Gacha
                        </h1>
                    </div>
                </div>
                
                <div class="user-resources">
                    <div class="resource-item">
                        <i class="fas fa-key"></i>
                        <span><?php echo number_format($userData['llaves']); ?></span>
                        <small>Llaves</small>
                        <!-- <button class="btn btn-sm btn-success ms-2" 
                                onclick="buyKeys()" 
                                title="Comprar más llaves">
                            <i class="fas fa-plus"></i>
                        </button> -->
                    </div>
                    <div class="resource-item">
                        <i class="fas fa-globe"></i>
                        <span><?php echo number_format($userData['recompensas']); ?></span>
                        <small>Esferas</small>
                    </div>
                    <div class="resource-item">
                        <a href="claim_rewards.php" class="btn btn-sm btn-outline-warning">
                            <i class="fas fa-gift"></i>
                            <small>Reclamar</small>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow-1 gacha-main">
        <div class="container-fluid py-4">
            
            <!-- Cofres Disponibles -->
            <section class="chest-gallery">
                <div class="row g-4">
                    
                    

                    <!-- Cofre Warhammer 40K -->
                    <div class="col-lg-4 col-md-6 col-12">
                        <div class="chest-card warhammer" data-chest-type="warhammer">
                            <div class="chest-header">
                                <div class="chest-rarity">
                                    <i class="fas fa-skull"></i>
                                    <i class="fas fa-cog"></i>
                                    <span>Warhammer 40K</span>
                                </div>
                                <div class="chest-cost">
                                    <i class="fas fa-key"></i>
                                    <span>5</span>
                                </div>
                            </div>
                            
                            <div class="chest-visual">
                                <!-- Aquí irá la imagen del banner -->
                                <img src="assets/images/banners/warhammer-banner.jpg" 
                                     alt="Banner Warhammer 40K" 
                                     class="chest-banner-image"
                                     onerror="this.style.display='none'">
                                
                                <div class="chest-icon">
                                    <i class="fas fa-skull"></i>
                                </div>
                                
                                <div class="chest-overlay">
                                    <div class="chest-info">
                                        <h3 class="chest-name">Cofre Warhammer 40K</h3>
                                        <p class="chest-description">
                                            El universo completo de Warhammer 40.000
                                        </p>
                                        
                                        <div class="chest-preview-items">
                                            <div class="preview-item">
                                                <i class="fas fa-skull"></i>
                                                <span>Space Marines</span>
                                            </div>
                                            <div class="preview-item">
                                                <i class="fas fa-cog"></i>
                                                <span>Mechanicus</span>
                                            </div>
                                            <div class="preview-item">
                                                <i class="fas fa-fire"></i>
                                                <span>Caos</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="chest-actions">
                                        <button class="btn btn-gacha btn-warhammer" onclick="openChest('warhammer', 5)">
                                            <i class="fas fa-unlock-alt me-2"></i>
                                            Abrir Cofre
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Cofre de Terrenos -->
                    <div class="col-lg-4 col-md-6 col-12">
                        <div class="chest-card terrains" data-chest-type="terrains">
                            <div class="chest-header">
                                <div class="chest-rarity">
                                    <i class="fas fa-mountain"></i>
                                    <i class="fas fa-gem"></i>
                                    <span>Terrenos</span>
                                </div>
                                <div class="chest-cost">
                                    <i class="fas fa-key"></i>
                                    <span>25</span>
                                </div>
                            </div>
                            
                            <div class="chest-visual">
                                <!-- Aquí irá la imagen del banner -->
                                <img src="assets/images/banners/terrains-banner.jpg" 
                                     alt="Banner Terrenos" 
                                     class="chest-banner-image"
                                     onerror="this.style.display='none'">
                                
                                <div class="chest-icon">
                                    <i class="fas fa-mountain"></i>
                                </div>
                                
                                <div class="chest-overlay">
                                    <div class="chest-info">
                                        <h3 class="chest-name">Cofre de Terrenos</h3>
                                        <p class="chest-description">
                                            Terrenos únicos e irrepetibles
                                        </p>
                                        
                                        <div class="chest-preview-items">
                                            <div class="preview-item">
                                                <i class="fas fa-mountain"></i>
                                                <span>Terrenos Únicos</span>
                                            </div>
                                            <div class="preview-item">
                                                <i class="fas fa-gem"></i>
                                                <span>Recursos Valiosos</span>
                                            </div>
                                            <div class="preview-item">
                                                <i class="fas fa-star"></i>
                                                <span>Exclusivos</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="chest-actions">
                                        <button class="btn btn-gacha btn-terrains" onclick="openChest('terrains', 25)">
                                            <i class="fas fa-unlock-alt me-2"></i>
                                            Abrir Cofre
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Las Sombras de Phanes -->
                    <div class="col-lg-4 col-md-6 col-12">
                        <div class="chest-card phanes" data-chest-type="phanes">
                            <div class="chest-header">
                                <div class="chest-rarity">
                                    <i class="fas fa-eye"></i>
                                    <i class="fas fa-magic"></i>
                                    <span>Phanes</span>
                                </div>
                                <div class="chest-cost">
                                    <i class="fas fa-key"></i>
                                    <span>5</span>
                                </div>
                            </div>
                            
                            <div class="chest-visual">
                                <!-- Aquí irá la imagen del banner -->
                                <img src="assets/images/banners/phanes-banner.jpg" 
                                     alt="Banner Las Sombras de Phanes" 
                                     class="chest-banner-image"
                                     onerror="this.style.display='none'">
                                
                                <div class="chest-icon">
                                    <i class="fas fa-eye"></i>
                                </div>
                                
                                <div class="chest-overlay">
                                    <div class="chest-info">
                                        <h3 class="chest-name">Las Sombras de Phanes</h3>
                                        <p class="chest-description">
                                            Entidades primordiales de poder ancestral
                                        </p>
                                        
                                        <div class="chest-preview-items">
                                            <div class="preview-item">
                                                <i class="fas fa-user-secret"></i>
                                                <span>Asmoday</span>
                                            </div>
                                            <div class="preview-item">
                                                <i class="fas fa-clock"></i>
                                                <span>Istaroth</span>
                                            </div>
                                            <div class="preview-item">
                                                <i class="fas fa-globe"></i>
                                                <span>Esencias</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="chest-actions">
                                        <button class="btn btn-gacha btn-phanes" onclick="openChest('phanes', 5)">
                                            <i class="fas fa-unlock-alt me-2"></i>
                                            Invocar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Historial de aperturas recientes -->
            <section class="recent-history glass-card mt-5">
                <div class="section-header">
                    <h3>
                        <i class="fas fa-history me-2"></i>
                        Aperturas Recientes
                    </h3>
                    <button class="btn btn-outline-light btn-sm" onclick="refreshHistory()">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                
                <div class="history-list" id="historyList">
                    <div class="history-empty">
                        <i class="fas fa-box-open"></i>
                        <p>No has abierto cofres recientemente</p>
                        <small>¡Abre tu primer cofre para comenzar!</small>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <!-- Modal de apertura de cofre -->
    <div class="modal fade" id="chestOpenModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content gacha-modal">
                <div class="modal-body text-center">
                    <div class="opening-animation" id="openingAnimation">
                        <div class="chest-opening">
                            <i class="fas fa-box" id="chestIcon"></i>
                        </div>
                        <div class="opening-text">
                            <h4>Abriendo cofre...</h4>
                            <div class="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="reward-reveal" id="rewardReveal" style="display: none;">
                        <div class="reward-icon">
                            <i class="fas fa-gift"></i>
                        </div>
                        <h4 class="reward-title">¡Recompensa obtenida!</h4>
                        <div class="reward-item">
                            <div class="reward-visual">
                                <i id="rewardIcon"></i>
                            </div>
                            <div class="reward-info">
                                <h5 id="rewardName"></h5>
                                <p id="rewardDescription"></p>
                            </div>
                        </div>
                        
                        <div class="mt-3 p-3" style="background: rgba(212, 175, 55, 0.1); border-radius: 8px;">
                            <small class="text-warning">
                                <i class="fas fa-info-circle me-1"></i>
                                Tu recompensa se ha guardado. Puedes reclamarla y descargar un reporte desde el botón "Reclamar" en la parte superior.
                            </small>
                        </div>
                        
                        <div class="d-flex gap-2 justify-content-center mt-3">
                            <button type="button" class="btn btn-gacha btn-primary" data-bs-dismiss="modal">
                                ¡Genial!
                            </button>
                            <a href="claim_rewards.php" class="btn btn-outline-warning">
                                <i class="fas fa-gift me-1"></i>
                                Ver Recompensas
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer mt-auto py-3 border-top border-gold-opacity">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <small class="text-muted">
                        &copy; 2024 Einherjer Blitz 3.0. Sistema Gacha.
                    </small>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <small class="text-muted">
                        Guerrero: <?php echo htmlspecialchars($userData['username']); ?> | 
                        Llaves disponibles: <?php echo number_format($userData['llaves']); ?>
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Gacha JS -->
    <script src="assets/js/gacha.js"></script>
    
    <!-- Variables PHP para JavaScript -->
    <script>
        window.userData = {
            keys: <?php echo $userData['llaves']; ?>,
            spheres: <?php echo $userData['recompensas']; ?>,
            username: "<?php echo htmlspecialchars($userData['username']); ?>"
        };
        
        // Función para comprar llaves
        async function buyKeys() {
            // Mostrar modal de selección de paquetes
            const packageModal = `
                <div class="modal fade" id="buyKeysModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content gacha-modal">
                            <div class="modal-header">
                                <h5 class="modal-title text-gold">
                                    <i class="fas fa-key me-2"></i>Comprar Llaves
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row g-3">
                                    <div class="col-12">
                                        <div class="package-card" onclick="selectPackage('basic')">
                                            <div class="d-flex justify-content-between align-items-center p-3" style="background: rgba(40, 167, 69, 0.1); border: 2px solid #28a745; border-radius: 10px; cursor: pointer;">
                                                <div>
                                                    <h6 class="text-success mb-1">Paquete Básico</h6>
                                                    <small class="text-white-50">2 Llaves</small>
                                                </div>
                                                <div class="text-end">
                                                    <div class="text-success fw-bold">$1 USD</div>
                                                    <small class="text-white-50">Mejor para empezar</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="package-card" onclick="selectPackage('premium')">
                                            <div class="d-flex justify-content-between align-items-center p-3" style="background: rgba(255, 193, 7, 0.1); border: 2px solid #ffc107; border-radius: 10px; cursor: pointer;">
                                                <div>
                                                    <h6 class="text-warning mb-1">Paquete Premium</h6>
                                                    <small class="text-white-50">10 Llaves</small>
                                                </div>
                                                <div class="text-end">
                                                    <div class="text-warning fw-bold">$5 USD</div>
                                                    <small class="text-success">¡Más popular!</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="package-card" onclick="selectPackage('deluxe')">
                                            <div class="d-flex justify-content-between align-items-center p-3" style="background: rgba(220, 53, 69, 0.1); border: 2px solid #dc3545; border-radius: 10px; cursor: pointer;">
                                                <div>
                                                    <h6 class="text-danger mb-1">Paquete Deluxe</h6>
                                                    <small class="text-white-50">25 Llaves</small>
                                                </div>
                                                <div class="text-end">
                                                    <div class="text-danger fw-bold">$10 USD</div>
                                                    <small class="text-warning">¡Mejor valor!</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-3 p-3" style="background: rgba(23, 162, 184, 0.1); border-radius: 8px;">
                                    <small class="text-info">
                                        <i class="fas fa-info-circle me-1"></i>
                                        Las llaves se agregarán automáticamente a tu cuenta después del pago exitoso.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Agregar modal al DOM si no existe
            if (!document.getElementById('buyKeysModal')) {
                document.body.insertAdjacentHTML('beforeend', packageModal);
            }
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('buyKeysModal'));
            modal.show();
        }
        
        async function selectPackage(packageType) {
            try {
                // Cerrar modal de selección
                const modal = bootstrap.Modal.getInstance(document.getElementById('buyKeysModal'));
                modal.hide();
                
                // Mostrar loading
                showLoadingModal('Procesando pago...');
                
                // Llamar a la API
                const response = await fetch('../api/payments/buy_keys.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        package: packageType
                    })
                });
                
                const data = await response.json();
                
                // Ocultar loading
                hideLoadingModal();
                
                if (data.success) {
                    // Redirigir a la página de pago
                    window.open(data.payment_url, '_blank');
                    
                    // Mostrar mensaje de confirmación
                    showSuccessModal('Redirigiendo al pago', 'Se ha abierto una nueva ventana para completar tu pago. Las llaves se agregarán automáticamente después del pago exitoso.');
                } else {
                    showErrorModal('Error', data.error || 'Error al procesar el pago');
                }
                
            } catch (error) {
                hideLoadingModal();
                showErrorModal('Error', 'Error de conexión. Inténtalo de nuevo.');
            }
        }
        
        function showLoadingModal(message) {
            const loadingModal = `
                <div class="modal fade" id="loadingModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content gacha-modal">
                            <div class="modal-body text-center py-4">
                                <div class="spinner-border text-warning mb-3" role="status"></div>
                                <h5 class="text-white">${message}</h5>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            if (!document.getElementById('loadingModal')) {
                document.body.insertAdjacentHTML('beforeend', loadingModal);
            }
            
            const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
            modal.show();
        }
        
        function hideLoadingModal() {
            const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
            if (modal) modal.hide();
        }
        
        function showSuccessModal(title, message) {
            const successModal = `
                <div class="modal fade" id="successModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content gacha-modal">
                            <div class="modal-body text-center py-4">
                                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                                <h5 class="text-success">${title}</h5>
                                <p class="text-white-50">${message}</p>
                                <button type="button" class="btn btn-success" data-bs-dismiss="modal">Entendido</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            if (document.getElementById('successModal')) {
                document.getElementById('successModal').remove();
            }
            document.body.insertAdjacentHTML('beforeend', successModal);
            
            const modal = new bootstrap.Modal(document.getElementById('successModal'));
            modal.show();
        }
        
        function showErrorModal(title, message) {
            const errorModal = `
                <div class="modal fade" id="errorModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content gacha-modal">
                            <div class="modal-body text-center py-4">
                                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                                <h5 class="text-danger">${title}</h5>
                                <p class="text-white-50">${message}</p>
                                <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            if (document.getElementById('errorModal')) {
                document.getElementById('errorModal').remove();
            }
            document.body.insertAdjacentHTML('beforeend', errorModal);
            
            const modal = new bootstrap.Modal(document.getElementById('errorModal'));
            modal.show();
        }
    </script>
</body>
</html>

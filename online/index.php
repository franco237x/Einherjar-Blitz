<?php
require_once '../includes/Database.php';
require_once '../includes/version_helper.php';
require_once 'includes/rank_helper.php';

// $auth, $userData, $rankProgress, y $rankImage ya están definidos en rank_helper.php
?>
<!DOCTYPE html>
<html lang="es" class="h-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modo Online - Einherjer Blitz 3.0</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Dashboard CSS (reusando estilos) -->
    <link rel="stylesheet" href="../assets/css/dashboard.css<?php echo v('assets/css/dashboard.css'); ?>">
    
    <!-- Online Mode CSS -->
    <link rel="stylesheet" href="assets/css/online.css<?php echo v('online/assets/css/online.css'); ?>">
    
    <meta name="description" content="Modo Online de Einherjer Blitz 3.0 - Batalla contra otros jugadores">
    <meta name="robots" content="noindex, nofollow">
</head>
<body class="d-flex flex-column h-100">
    <!-- Header -->
    <header class="dashboard-header">
        <div class="container-fluid">
            <div class="header-content">
                <div class="brand-section">
                    <a href="../dashboard.php" class="brand-link">
                        <i class="fas fa-shield-alt"></i>
                        <span>Einherjer Blitz</span>
                    </a>
                    <span class="mode-indicator">
                        <i class="fas fa-globe"></i>
                        Modo Online
                    </span>
                </div>
                
                <div class="user-section">
                    <div class="user-info">
                        <img src="../images/<?php echo htmlspecialchars($userData['perfil_imagen']); ?>" 
                             alt="Avatar" class="user-avatar">
                        <div class="user-details">
                            <h4><?php echo htmlspecialchars($userData['username']); ?></h4>
                            <p><?php echo htmlspecialchars($userData['rango']); ?></p>
                        </div>
                    </div>
                    <button class="logout-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow-1">
        <div class="container-fluid py-4">
            
            <!-- Sección del Rango -->
            <section class="rank-section">
                <div class="row">
                    <div class="col-lg-4">
                        <div class="glass-card rank-display">
                            <div class="rank-image-container">
                                <img src="../images/<?php echo $rankImage; ?>" 
                                     alt="<?php echo htmlspecialchars($userData['rango']); ?>" 
                                     class="rank-image">
                                <div class="rank-glow"></div>
                            </div>
                            <h2 class="rank-title"><?php echo htmlspecialchars($userData['rango']); ?></h2>
                            <div class="rank-stats">
                                <div class="stat-item">
                                    <i class="fas fa-trophy"></i>
                                    <span><?php echo number_format($userData['copas']); ?> Copas</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-chart-line"></i>
                                    <span><?php echo round(($userData['victorias'] / max(1, $userData['victorias'] + $userData['derrotas'])) * 100, 1); ?>% WR</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-8">
                        <div class="glass-card rank-progress-card">
                            <h3 class="progress-title">
                                <i class="fas fa-arrow-up"></i>
                                Progreso de Rango
                            </h3>
                            
                            <div class="rank-progress-bar">
                                <div class="progress-fill" style="width: <?php echo $rankProgress['progress']; ?>%"></div>
                                <div class="progress-text">
                                    <span><?php echo number_format($rankProgress['current']); ?></span>
                                    <span><?php echo number_format($rankProgress['total']); ?></span>
                                </div>
                            </div>
                            
                            <div class="progress-info">
                                <p class="mb-2">
                                    <strong><?php echo number_format($rankProgress['needed']); ?> copas</strong> 
                                    para el siguiente rango
                                </p>
                                <div class="recent-matches">
                                    <span class="matches-label">Historial reciente:</span>
                                    <div class="match-results" id="recentMatchResults">
                                        <span class="text-muted">Cargando...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Sección de Acciones Principales -->
            <section class="main-actions">
                <div class="row g-4">
                    
                    <!-- Selección de Personaje -->
                    <div class="col-lg-6">
                        <div class="glass-card character-selection">
                            <div class="card-header">
                                <h3>
                                    <i class="fas fa-user-ninja"></i>
                                    Seleccionar Personaje
                                </h3>
                            </div>
                            <div class="character-selection-content">
                                <div id="selectedCharacterDisplay" class="mb-3">
                                    <div class="text-muted">
                                        <i class="fas fa-info-circle"></i>
                                        <span>Selecciona un personaje para comenzar</span>
                                    </div>
                                </div>
                                <div class="character-grid" id="characterGrid">
                                    <!-- Shuna Shieda -->
                                    <div class="character-slot" data-character-id="1">
                                        <img src="../images/shuna.jpg" alt="Shuna Shieda" class="character-avatar">
                                        <span class="character-name">Shuna</span>
                                        <span class="character-element element-devastacion">
                                            <i class="fas fa-fire"></i>
                                        </span>
                                    </div>
                                    
                                    <!-- Ozen Kimura -->
                                    <div class="character-slot" data-character-id="2">
                                        <img src="../images/ozen.jpg" alt="Ozen Kimura" class="character-avatar">
                                        <span class="character-name">Ozen</span>
                                        <span class="character-element element-tierra">
                                            <i class="fas fa-mountain"></i>
                                        </span>
                                    </div>
                                    
                                    <!-- Xair Chikyu -->
                                    <div class="character-slot" data-character-id="3">
                                        <img src="../images/xair.png" alt="Xair Chikyu" class="character-avatar">
                                        <span class="character-name">Xair</span>
                                        <span class="character-element element-viento">
                                            <i class="fas fa-wind"></i>
                                        </span>
                                    </div>
                                    
                                    <!-- Nathan Doffens -->
                                    <div class="character-slot" data-character-id="4">
                                        <img src="../images/nathan.png" alt="Nathan Doffens" class="character-avatar">
                                        <span class="character-name">Nathan</span>
                                        <span class="character-element element-rayo">
                                            <i class="fas fa-bolt"></i>
                                        </span>
                                    </div>
                                    
                                    <!-- Zack Hisoka -->
                                    <div class="character-slot" data-character-id="5">
                                        <img src="../images/zack.jpg" alt="Zack Hisoka" class="character-avatar">
                                        <span class="character-name">Zack</span>
                                        <span class="character-element element-ninguno">
                                            <i class="fas fa-infinity"></i>
                                        </span>
                                    </div>

                                    <!-- Raiden -->
                                    <div class="character-slot" data-character-id="6">
                                        <img src="../images/raiden.jpeg" alt="Raiden" class="character-avatar">
                                        <span class="character-name">Raiden</span>
                                        <span class="character-element element-oscuridad">
                                            <i class="fas fa-moon"></i>
                                        </span>
                                    </div>

                                    <!-- Yozora -->
                                    <div class="character-slot" data-character-id="7">
                                        <img src="../images/yozora.jpeg" alt="Yozora" class="character-avatar">
                                        <span class="character-name">Yozora</span>
                                        <span class="character-element element-originium">
                                            <i class="fas fa-atom"></i>
                                        </span>
                                    </div>

                                    <!-- Kuaidul Velguear -->
                                    <div class="character-slot" data-character-id="8">
                                        <img src="../images/kuaidul.jpg" alt="Kuaidul Velguear" class="character-avatar">
                                        <span class="character-name">Kuaidul</span>
                                        <span class="character-element element-ninguno">
                                            <i class="fas fa-clone"></i>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Búsqueda de Partida -->
                    <div class="col-lg-6">
                        <div class="glass-card match-search">
                            <div class="card-header">
                                <h3>
                                    <i class="fas fa-search"></i>
                                    Buscar Partida
                                </h3>
                            </div>
                            
                            <div class="match-search-content">
                                <div class="match-info mb-3">
                                    <p class="text-light mb-2">
                                        <i class="fas fa-info-circle text-info"></i>
                                        Serás emparejado con jugadores de rango similar
                                    </p>
                                    <div class="rank-range">
                                        <span class="badge bg-gold">Tu Rango: <?php echo htmlspecialchars($userData['rango']); ?></span>
                                        <span class="badge bg-secondary"><?php echo number_format($userData['copas']); ?> copas</span>
                                    </div>
                                    
                                    <!-- Advertencia cuando no hay oponentes -->
                                    <div id="noOpponentsWarning" class="alert alert-warning mt-3" style="display: none;">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        <span>No hay oponentes disponibles en este momento</span>
                                    </div>
                                </div>
                                
                                <div class="search-actions">
                                    <button 
                                        id="searchMatchBtn" 
                                        class="btn btn-primary btn-lg w-100 mb-2" 
                                        disabled>
                                        <i class="fas fa-search"></i>
                                        <span>Buscar Partida</span>
                                    </button>
                                    
                                    <button 
                                        id="cancelSearchBtn" 
                                        class="btn btn-danger w-100" 
                                        style="display: none;">
                                        <i class="fas fa-times"></i>
                                        <span>Cancelar Búsqueda</span>
                                    </button>
                                </div>
                                
                                <div class="queue-status mt-3" id="queueStatus" style="display: none;">
                                    <div class="text-center">
                                        <div class="spinner-border text-gold" role="status">
                                            <span class="visually-hidden">Buscando...</span>
                                        </div>
                                        <p class="mt-2 text-light">Buscando oponente<span class="searching-dots">...</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Estadísticas Online -->
            <section class="online-stats">
                <div class="row g-4">
                    <div class="col-md-3">
                        <div class="glass-card stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-globe"></i>
                            </div>
                            <div class="stat-value" id="playersOnline">0</div>
                            <div class="stat-label">Jugadores Online</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-card stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-search"></i>
                            </div>
                            <div class="stat-value" id="playersSearching">0</div>
                            <div class="stat-label">Buscando Partida</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-card stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-swords"></i>
                            </div>
                            <div class="stat-value" id="playersInBattle">0</div>
                            <div class="stat-label">En Batalla</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-card stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-value" id="avgWaitTime">--</div>
                            <div class="stat-label">Tiempo de Espera</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Elementos Estéticos -->
            <section class="aesthetic-elements">
                <div class="glass-card">
                    <div class="text-center py-4">
                        <i class="fas fa-shield-alt fa-4x text-gold mb-3"></i>
                        <h3 class="text-gold mb-3">Modo Ranked</h3>
                        <p class="text-muted mb-0">
                            Compite contra jugadores de todo el mundo y escala en el ranking.
                            ¡Cada victoria te acerca más a la cima!
                        </p>
                    </div>
                </div>
            </section>

        </div>
    </main>

    <!-- Modal de Búsqueda -->
    <div class="modal-overlay" id="searchingModal" style="display: none;">
        <div class="modal-content text-center">
            <div class="searching-spinner"></div>
            <h3 class="text-gold mb-3">Buscando Oponente</h3>
            <p class="text-light mb-2">Esto puede tomar unos segundos<span class="searching-dots">...</span></p>
            <p class="text-muted small">Buscando jugadores de rango similar</p>
            <button class="btn btn-danger mt-3" onclick="window.onlineMode.cancelMatchmaking()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    </div>

    <!-- Modal de Partida Encontrada -->
    <div class="modal-overlay" id="matchFoundModal" style="display: none;">
        <div class="modal-content match-found-content">
            <h2 class="text-gold mb-4">¡Partida Encontrada!</h2>
            
            <div class="opponent-info mb-4">
                <h4 class="text-light mb-3">Tu Oponente:</h4>
                <div class="opponent-details">
                    <p><i class="fas fa-user"></i> <span id="opponentUsername">Jugador</span></p>
                    <p><i class="fas fa-trophy"></i> <span id="opponentRank">Rango</span></p>
                    <p><i class="fas fa-star"></i> <span id="opponentCups">0</span> copas</p>
                </div>
            </div>
            
            <div class="countdown-circle">
                <span id="battleCountdown">3</span>
            </div>
            
            <p class="text-muted">Preparándose para la batalla...</p>
            
            <button class="btn btn-primary" id="battleReadyBtn">
                <i class="fas fa-swords"></i> ¡Listo para Batalla!
            </button>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer mt-auto py-3 border-top border-gold-opacity">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <small class="text-muted">
                        &copy; 2024 Einherjer Blitz 3.0 - Modo Online
                    </small>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <small class="text-muted">
                        Ping: <span id="pingValue" class="text-muted">---</span> | 
                        Servidor: <span id="serverLocation" class="text-muted">Detectando...</span>
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Dashboard JS -->
    <script src="../assets/js/dashboard.js<?php echo v('assets/js/dashboard.js'); ?>"></script>
    
    <!-- Online Mode JS -->
    <script src="assets/js/online.js<?php echo v('online/assets/js/online.js'); ?>"></script>
    
    <!-- Variables PHP para JavaScript -->
    <script>
        window.userData = {
            username: "<?php echo htmlspecialchars($userData['username']); ?>",
            rank: "<?php echo htmlspecialchars($userData['rango']); ?>",
            cups: <?php echo $userData['copas']; ?>,
            wins: <?php echo $userData['victorias']; ?>,
            losses: <?php echo $userData['derrotas']; ?>,
            rankProgress: <?php echo $rankProgress['progress']; ?>
        };
    </script>
</body>
</html>
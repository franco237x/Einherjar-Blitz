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

// Obtener recompensas del usuario
try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    $stmt = $conn->prepare("
        SELECT * FROM recompensas_usuario 
        WHERE user_id = ? 
        ORDER BY fecha_obtencion DESC
    ");
    $stmt->execute([$userData['id']]);
    $recompensas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Contar recompensas por tipo
    $tipos_count = [];
    foreach ($recompensas as $recompensa) {
        $tipo = $recompensa['tipo_recompensa'];
        if (!isset($tipos_count[$tipo])) {
            $tipos_count[$tipo] = 0;
        }
        $tipos_count[$tipo]++;
    }

} catch (Exception $e) {
    $error_message = "Error al obtener recompensas: " . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es" class="h-100">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reclamar Recompensas | Einherjer Blitz 3.0</title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Google Fonts -->
    <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet">

    <!-- Dashboard CSS -->
    <link rel="stylesheet" href="../assets/css/dashboard.css">

    <!-- Gacha CSS -->
    <link rel="stylesheet" href="assets/css/gacha.css">

    <!-- Meta tags -->
    <meta name="description" content="Sistema de Reclamo de Recompensas - Einherjer Blitz 3.0">
    <meta name="robots" content="noindex, nofollow">

    <style>
        .brand-info p {
            color: rgba(255, 255, 255, 0.8);
            margin: 0;
            font-size: 1.1rem;
        }
    </style>
</head>

<body class="d-flex flex-column h-100 claim-body">

    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="spinner"></div>
            <h4>Generando reporte...</h4>
            <p>Por favor espera mientras procesamos tus recompensas</p>
            <div class="progress-dots mt-3">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>

    <!-- Header -->
    <header class="claim-header">
        <!-- Barra de progreso de scroll -->
        <div class="scroll-progress" id="scrollProgress"></div>

        <div class="container-fluid">
            <div class="header-content">
                <div class="brand-section">
                    <a href="index.php" class="back-btn text-decoration-none text-warning">
                        <i class="fas fa-arrow-left me-2"></i>
                        Volver al Gacha
                    </a>
                    <div class="brand-info mt-2">
                        <h1 class="page-title text-warning">
                            <i class="fas fa-gift me-2"></i>
                            Reclamar Recompensas
                        </h1>
                        <p class="text-light mb-0">Gestiona y descarga tus recompensas obtenidas</p>
                    </div>
                </div>

                <div class="user-info text-end">
                    <h5 class="text-warning mb-1"><?php echo htmlspecialchars($userData['username']); ?></h5>
                    <small class="text-light">Guerrero de Einherjer Blitz</small>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow-1 py-4">
        <div class="container-fluid">

            <?php if (isset($error_message)): ?>
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <?php echo $error_message; ?>
                </div>
            <?php endif; ?>

            <!-- Estadísticas -->
            <div class="row mb-4">
                <div class="col-md-3 col-sm-6">
                    <div class="stats-card">
                        <h3><?php echo count($recompensas); ?></h3>
                        <p class="mb-0">Total Recompensas</p>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stats-card">
                        <h3><?php echo $tipos_count['invocation'] ?? 0; ?></h3>
                        <p class="mb-0">Invocaciones</p>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stats-card">
                        <h3><?php echo $tipos_count['special'] ?? 0; ?></h3>
                        <p class="mb-0">Especiales</p>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="stats-card">
                        <h3><?php echo ($tipos_count['resource'] ?? 0) + ($tipos_count['resources'] ?? 0); ?></h3>
                        <p class="mb-0">Recursos</p>
                    </div>
                </div>
            </div>

            <!-- Botones de Acción -->
            <?php if (!empty($recompensas)): ?>
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="action-buttons text-center">
                            <h4 class="text-warning mb-4">
                                <i class="fas fa-download me-2"></i>
                                Reclamar y Descargar Recompensas
                            </h4>
                            <div class="alert alert-info mb-4">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Importante:</strong> Al descargar el reporte, tus recompensas serán
                                <strong>automáticamente eliminadas</strong> de tu inventario para evitar duplicados. Se
                                mantendrá un respaldo para el historial.
                            </div>
                            <div class="d-flex flex-wrap justify-content-center gap-3">
                                <button class="btn btn-claim" onclick="generateReport('pdf')">
                                    <i class="fas fa-file-pdf me-2"></i>
                                    Reclamar en PDF
                                </button>
                                <button class="btn btn-claim" onclick="generateReport('txt')">
                                    <i class="fas fa-file-alt me-2"></i>
                                    Reclamar en TXT
                                </button>
                                <button class="btn btn-outline-danger" onclick="showManualCleanup()">
                                    <i class="fas fa-trash me-2"></i>
                                    Solo Limpiar
                                </button>
                            </div>
                            <small class="text-muted d-block mt-3">
                                <i class="fas fa-shield-alt me-1"></i>
                                Las recompensas se eliminarán automáticamente al reclamar para mantener la integridad del
                                sistema. El historial se conserva en el respaldo.
                            </small>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Lista de Recompensas -->
            <?php if (!empty($recompensas)): ?>
                <div class="row">
                    <div class="col-12">
                        <div class="rewards-container">
                            <h3 class="section-title">
                                <i class="fas fa-list me-2"></i>
                                Tus Recompensas
                            </h3>

                            <?php foreach ($recompensas as $recompensa): ?>
                                <div class="reward-card">
                                    <div class="row align-items-center">
                                        <div class="col-md-8">
                                            <div class="d-flex align-items-center">
                                                <div class="reward-icon">
                                                    <?php
                                                    $icon = 'fas fa-gift';
                                                    switch ($recompensa['tipo_recompensa']) {
                                                        case 'invocation':
                                                            $icon = 'fas fa-user-ninja';
                                                            break;
                                                        case 'special':
                                                            $icon = 'fas fa-star';
                                                            break;
                                                        case 'resource':
                                                        case 'resources':
                                                            $icon = 'fas fa-coins';
                                                            break;
                                                        case 'weapon':
                                                            $icon = 'fas fa-sword';
                                                            break;
                                                        case 'terrain':
                                                            $icon = 'fas fa-mountain';
                                                            break;
                                                    }
                                                    ?>
                                                    <i class="<?php echo $icon; ?>"></i>
                                                </div>
                                                <div>
                                                    <h5 class="reward-name">
                                                        <?php echo htmlspecialchars($recompensa['recompensa_obtenida']); ?>
                                                    </h5>
                                                    <div class="d-flex align-items-center flex-wrap gap-2">
                                                        <span
                                                            class="reward-type-badge"><?php echo ucfirst($recompensa['tipo_recompensa']); ?></span>
                                                        <?php if ($recompensa['valor'] > 1): ?>
                                                            <span class="badge bg-secondary">Cantidad:
                                                                <?php echo $recompensa['valor']; ?></span>
                                                        <?php endif; ?>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-4 text-md-end mt-3 mt-md-0">
                                            <small class="reward-date">
                                                <i class="fas fa-calendar me-1"></i>
                                                <?php echo date('d/m/Y H:i', strtotime($recompensa['fecha_obtencion'])); ?>
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            <?php else: ?>
                <div class="no-rewards">
                    <i class="fas fa-gift fa-5x text-muted mb-3"></i>
                    <h3 class="text-muted">No hay recompensas pendientes</h3>
                    <p class="text-muted">¡Ve al sistema Gacha y consigue algunas recompensas!</p>
                    <a href="index.php" class="btn btn-claim">
                        <i class="fas fa-arrow-left me-2"></i>
                        Ir al Gacha
                    </a>
                </div>
            <?php endif; ?>
        </div>
    </main>

    <!-- Botón para volver arriba -->
    <button class="scroll-to-top" id="scrollToTop" onclick="scrollToTop()">
        <i class="fas fa-chevron-up"></i>
    </button>

    <!-- Footer -->
    <footer class="footer mt-auto py-3 border-top border-warning">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <small class="text-muted">
                        &copy; 2024 Einherjer Blitz 3.0. Sistema de Recompensas.
                    </small>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <small class="text-muted">
                        Guerrero: <?php echo htmlspecialchars($userData['username']); ?>
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <!-- Gacha JS -->
    <script src="assets/js/gacha.js"></script>

    <script>
        function showLoading() {
            document.getElementById('loadingOverlay').style.display = 'flex';
        }

        function hideLoading() {
            document.getElementById('loadingOverlay').style.display = 'none';
        }

        function generateReport(format) {
            // Confirmación antes de reclamar
            Swal.fire({
                title: '¡Confirmar Reclamo!',
                html: `
                    <div class="text-start">
                        <p><strong>Vas a reclamar tus recompensas en formato ${format.toUpperCase()}</strong></p>
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>IMPORTANTE:</strong> Después de la descarga, las recompensas serán <strong>eliminadas automáticamente</strong> de tu inventario.
                        </div>
                        <ul class="text-muted">
                            <li>Se generará un respaldo completo en el historial</li>
                            <li>No podrás reclamar estas recompensas nuevamente</li>
                            <li>El archivo contendrá todas tus recompensas actuales</li>
                        </ul>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: `Sí, reclamar en ${format.toUpperCase()}`,
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#d4af37',
                cancelButtonColor: '#6c757d',
                background: '#2a2a3e',
                color: '#ffffff',
                customClass: {
                    popup: 'swal-dark-theme'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    executeClaimProcess(format);
                }
            });
        }

        function executeClaimProcess(format) {
            if (window.rewardSystem) {
                window.rewardSystem.showLoading();
            } else {
                showLoading();
            }

            // Crear formulario temporal para enviar datos
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'generate_report.php';
            form.target = '_blank';

            const formatInput = document.createElement('input');
            formatInput.type = 'hidden';
            formatInput.name = 'format';
            formatInput.value = format;
            form.appendChild(formatInput);

            const actionInput = document.createElement('input');
            actionInput.type = 'hidden';
            actionInput.name = 'action';
            actionInput.value = 'claim_and_download';
            form.appendChild(actionInput);

            const autoCleanInput = document.createElement('input');
            autoCleanInput.type = 'hidden';
            autoCleanInput.name = 'auto_clean';
            autoCleanInput.value = 'true';
            form.appendChild(autoCleanInput);

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            // Mostrar notificación
            if (window.rewardSystem) {
                window.rewardSystem.showToast(`Reclamando recompensas en ${format.toUpperCase()}...`, 'info');
            }

            // Simular proceso de descarga y limpieza
            setTimeout(() => {
                // Ejecutar limpieza automática
                fetch('process_cleanup.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'auto_claim_cleanup'
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (window.rewardSystem) {
                            window.rewardSystem.hideLoading();
                        } else {
                            hideLoading();
                        }

                        if (data.success) {
                            Swal.fire({
                                title: '¡Recompensas Reclamadas!',
                                html: `
                                <div class="text-start">
                                    <p><strong>✅ Descarga completada exitosamente</strong></p>
                                    <p><strong>🗑️ ${data.deleted_count} recompensas eliminadas</strong></p>
                                    <p><strong>💾 Respaldo creado en el historial</strong></p>
                                    <div class="alert alert-success mt-3">
                                        <i class="fas fa-check-circle me-2"></i>
                                        Tus recompensas han sido reclamadas correctamente. ¡Ya puedes cerrar esta ventana!
                                    </div>
                                </div>
                            `,
                                icon: 'success',
                                confirmButtonText: '¡Perfecto!',
                                confirmButtonColor: '#d4af37',
                                background: '#2a2a3e',
                                color: '#ffffff',
                                customClass: {
                                    popup: 'swal-dark-theme'
                                }
                            }).then(() => {
                                location.reload();
                            });

                            if (window.rewardSystem) {
                                window.rewardSystem.showToast('¡Recompensas reclamadas exitosamente!', 'success');
                            }
                        } else {
                            Swal.fire({
                                title: 'Descarga OK, Error en Limpieza',
                                html: `
                                <div class="text-start">
                                    <p><strong>✅ El archivo se descargó correctamente</strong></p>
                                    <p><strong>⚠️ Error al limpiar automáticamente</strong></p>
                                    <p class="text-muted">${data.message}</p>
                                    <div class="alert alert-warning mt-3">
                                        <i class="fas fa-exclamation-triangle me-2"></i>
                                        Puedes limpiar manualmente usando el botón "Solo Limpiar"
                                    </div>
                                </div>
                            `,
                                icon: 'warning',
                                confirmButtonText: 'Entendido',
                                confirmButtonColor: '#ffc107',
                                background: '#2a2a3e',
                                color: '#ffffff',
                                customClass: {
                                    popup: 'swal-dark-theme'
                                }
                            });
                        }
                    })
                    .catch(error => {
                        if (window.rewardSystem) {
                            window.rewardSystem.hideLoading();
                            window.rewardSystem.showToast('Error en la limpieza automática', 'error');
                        } else {
                            hideLoading();
                        }

                        Swal.fire({
                            title: 'Descarga OK, Error de Conexión',
                            html: `
                            <div class="text-start">
                                <p><strong>✅ El archivo se descargó correctamente</strong></p>
                                <p><strong>🔌 Error de conexión al limpiar</strong></p>
                                <div class="alert alert-info mt-3">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Tu descarga está completa. Puedes limpiar manualmente después.
                                </div>
                            </div>
                        `,
                            icon: 'info',
                            confirmButtonText: 'Entendido',
                            confirmButtonColor: '#17a2b8',
                            background: '#2a2a3e',
                            color: '#ffffff',
                            customClass: {
                                popup: 'swal-dark-theme'
                            }
                        });
                    });
            }, 3000); // Dar tiempo para que se procese la descarga
        }

        function showManualCleanup() {
            Swal.fire({
                title: 'Limpieza Manual',
                html: `
                    <div class="text-start">
                        <p>Esta opción <strong>solo eliminará</strong> las recompensas sin generar ningún archivo.</p>
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>¿Estás seguro?</strong> No podrás recuperar las recompensas después.
                        </div>
                        <p class="text-muted">Se creará un respaldo automático en el historial.</p>
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, solo limpiar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                background: '#2a2a3e',
                color: '#ffffff',
                customClass: {
                    popup: 'swal-dark-theme'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    clearAllRewards();
                }
            });
        }

        function clearAllRewards() {
            Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esta acción eliminará todas tus recompensas de la base de datos. No se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar todo',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                background: '#2a2a3e',
                color: '#ffffff',
                customClass: {
                    popup: 'swal-dark-theme'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    if (window.rewardSystem) {
                        window.rewardSystem.showLoading();
                    } else {
                        showLoading();
                    }

                    fetch('process_cleanup.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'clear_all'
                        })
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (window.rewardSystem) {
                                window.rewardSystem.hideLoading();
                            } else {
                                hideLoading();
                            }

                            if (data.success) {
                                Swal.fire({
                                    title: '¡Listo!',
                                    text: `Se eliminaron ${data.deleted_count} recompensas.`,
                                    icon: 'success',
                                    confirmButtonColor: '#d4af37',
                                    background: '#2a2a3e',
                                    color: '#ffffff',
                                    customClass: {
                                        popup: 'swal-dark-theme'
                                    }
                                }).then(() => {
                                    location.reload();
                                });

                                if (window.rewardSystem) {
                                    window.rewardSystem.showToast('Recompensas eliminadas exitosamente', 'success');
                                }
                            } else {
                                Swal.fire({
                                    title: 'Error',
                                    text: data.message || 'No se pudieron eliminar las recompensas',
                                    icon: 'error',
                                    confirmButtonColor: '#dc3545',
                                    background: '#2a2a3e',
                                    color: '#ffffff',
                                    customClass: {
                                        popup: 'swal-dark-theme'
                                    }
                                });

                                if (window.rewardSystem) {
                                    window.rewardSystem.showToast('Error al eliminar recompensas', 'error');
                                }
                            }
                        })
                        .catch(error => {
                            if (window.rewardSystem) {
                                window.rewardSystem.hideLoading();
                                window.rewardSystem.showToast('Error de conexión', 'error');
                            } else {
                                hideLoading();
                            }

                            Swal.fire({
                                title: 'Error',
                                text: 'Error de conexión',
                                icon: 'error',
                                confirmButtonColor: '#dc3545',
                                background: '#2a2a3e',
                                color: '#ffffff',
                                customClass: {
                                    popup: 'swal-dark-theme'
                                }
                            });
                        });
                }
            });
        }

        function scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    </script>
</body>

</html>
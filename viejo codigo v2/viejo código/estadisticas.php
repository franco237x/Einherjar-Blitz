<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    header("Location: index.php");
    exit();
}

// Obtener datos del usuario
$userData = $auth->getUserData();
if (!$userData) {
    header("Location: index.php");
    exit();
}

$copas = $userData['copas'] ?? 0;
$rango = $userData['rango'] ?? 'Sin Rango';
$perfil_imagen = $userData['perfil_imagen'] ?? 'default.jpg';
$frase = $userData['frase'] ?? '¡Por la gloria de la batalla!';
$username = $userData['username'];

// Determinar rango basado en copas
function determinarRango($copas) {
    if ($copas >= 3000) return 'Gran Maestro';
    if ($copas >= 1500) return 'Maestro';
    if ($copas >= 750) return 'Diamante';
    if ($copas >= 500) return 'Platino';
    if ($copas >= 250) return 'Oro';
    if ($copas >= 100) return 'Plata';
    if ($copas >= 10) return 'Bronce';
    return 'Sin Rango';
}

$new_rank = determinarRango($copas);

// Actualizar rango si es necesario
if ($new_rank != $rango) {
    $stmt = $conn->prepare("UPDATE usuarios SET rango = ? WHERE username = ? AND unique_id = ?");
    $stmt->bind_param("sss", $new_rank, $username, $unique_id);
    $stmt->execute();
    $rango = $new_rank;
}

// Obtener lista de usuarios
$order = isset($_GET['order']) ? $_GET['order'] : 'desc';
$sql = "SELECT username, rango, copas FROM usuarios ORDER BY copas " . ($order === 'asc' ? 'ASC' : 'DESC');
$usuarios = $conn->query($sql)->fetch_all(MYSQLI_ASSOC);

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Jugador</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body { 
            background-color: #1e2124; 
            color: #ffffff;
            min-height: 100vh;
        }
        .main-container {
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 15px;
            padding: 2rem;
            margin-top: 2rem;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .profile-card {
            background: linear-gradient(145deg, #2a2d31, #1e2124);
            border-radius: 15px;
            padding: 2rem;
            color: white;
            margin-bottom: 2rem;
        }
        .profile-header-grid {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            gap: 2rem;
            align-items: center;
        }
        .profile-image-section {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .profile-image-wrapper {
            position: relative;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #f3a712;
            box-shadow: 0 0 20px rgba(243, 167, 18, 0.3);
        }
        .profile-info-section {
            text-align: center;
        }
        .username-text {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(45deg, #f3a712, #ff6f00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: bold;
        }
        .quote-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .player-quote {
            color: #f3a712;
            font-style: italic;
            font-size: 1.1rem;
            margin: 0;
            text-shadow: 0 0 10px rgba(243, 167, 18, 0.3);
        }
        .rank-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }
        .rank-image {
            width: 100px;
            height: 100px;
            object-fit: contain;
            filter: drop-shadow(0 0 10px rgba(243, 167, 18, 0.3));
        }
        .stats-container {
            display: flex;
            gap: 1.5rem;
            text-align: center;
        }
        .stat-item {
            background: rgba(243, 167, 18, 0.1);
            padding: 0.5rem 1rem;
            border-radius: 10px;
            min-width: 100px;
        }
        .nav-button {
            background-color: #2a2d31;
            color: white;
            border: none;
            margin: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 10px;
            transition: all 0.3s ease;
        }
        .nav-button:hover {
            background-color: #34383d;
            transform: translateY(-2px);
        }
        .table {
            background-color: white;
            border-radius: 10px;
            overflow: hidden;
        }
        .sort-button {
            background: none;
            border: none;
            color: #1e2124;
            padding: 0.5rem;
            margin: 0 0.25rem;
        }
        .sort-button:hover {
            color: #0d6efd;
        }
        .profile-header {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }

        .profile-image-wrapper {
            position: relative;
            width: 150px;
            height: 150px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #f3a712;
            box-shadow: 0 0 20px rgba(243, 167, 18, 0.3);
        }

        .profile-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        .profile-image:hover {
            transform: scale(1.1);
        }

        .change-avatar-btn {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(243, 167, 18, 0.9);
            border: none;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            opacity: 0;
        }

        .profile-image-wrapper:hover .change-avatar-btn {
            opacity: 1;
        }

        .quote-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin: 1.5rem 0;
            padding: 1rem;
        }

        .player-quote {
            color: #f3a712;
            font-style: italic;
            font-size: 1.1rem;
            margin: 0;
            cursor: pointer;
            text-shadow: 0 0 10px rgba(243, 167, 18, 0.3);
            animation: quoteGlow 2s infinite;
            transition: all 0.3s ease;
        }

        .player-quote:hover {
            transform: translateY(-2px);
            text-shadow: 0 0 15px rgba(243, 167, 18, 0.5);
        }

        @keyframes quoteGlow {
            0% { text-shadow: 0 0 10px rgba(243, 167, 18, 0.3); }
            50% { text-shadow: 0 0 20px rgba(243, 167, 18, 0.5); }
            100% { text-shadow: 0 0 10px rgba(243, 167, 18, 0.3); }
        }

        .username-text {
            background: linear-gradient(45deg, #f3a712, #ff6f00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: bold;
            margin-top: 1rem;
        }

        .avatar-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            padding: 1rem;
        }

        .avatar-option {
            cursor: pointer;
            border-radius: 10px;
            overflow: hidden;
            transition: transform 0.3s ease;
            position: relative;
        }

        .avatar-option img {
            width: 100%;
            height: 100px;
            object-fit: cover;
            border: 2px solid transparent;
            transition: border-color 0.3s ease;
        }

        .avatar-option:hover {
            transform: scale(1.05);
        }

        .avatar-option:hover img {
            border-color: #f3a712;
        }

        .player-quote {
            position: relative;
            padding-right: 2rem;
        }

        .edit-quote-icon {
            color: #f3a712;
            cursor: pointer;
            font-size: 1rem;
            transition: transform 0.3s ease;
        }

        .edit-quote-icon:hover {
            transform: scale(1.2);
            color: #ff6f00;
        }

        /* Media queries para tablets */
        @media (max-width: 992px) {
            .profile-header-grid {
                grid-template-columns: 1fr 2fr;
                gap: 1.5rem;
            }

            .rank-section {
                grid-column: span 2;
                display: flex;
                flex-direction: row;
                justify-content: center;
                align-items: center;
                gap: 2rem;
            }

            .stats-container {
                flex-direction: row;
            }
        }

        /* Media queries para móviles */
        @media (max-width: 768px) {
            .main-container {
                padding: 1rem;
                margin-top: 1rem;
            }

            .profile-card {
                padding: 1rem;
            }

            .profile-header-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }

            .profile-image-section {
                order: 1;
            }

            .profile-info-section {
                order: 2;
            }

            .rank-section {
                order: 3;
                grid-column: 1;
                flex-direction: column;
                gap: 1rem;
            }

            .username-text {
                font-size: 1.5rem;
            }

            .player-quote {
                font-size: 1rem;
            }

            .stats-container {
                flex-direction: row;
                justify-content: center;
                gap: 1rem;
            }

            .stat-item {
                padding: 0.25rem 0.5rem;
                min-width: 80px;
            }

            .nav-button {
                padding: 0.5rem 1rem;
                margin: 0.25rem;
                font-size: 0.9rem;
            }

            .table {
                font-size: 0.9rem;
            }

            .rank-thumbnail {
                width: 20px;
                height: 20px;
                margin-right: 4px;
            }
        }

        /* Media queries para móviles pequeños */
        @media (max-width: 576px) {
            .profile-image-wrapper {
                width: 100px;
                height: 100px;
            }

            .rank-image {
                width: 80px;
                height: 80px;
            }

            .stats-container {
                flex-direction: column;
                gap: 0.5rem;
            }

            .stat-item {
                width: 100%;
            }

            .table td, .table th {
                padding: 0.5rem;
            }

            .rank-thumbnail {
                width: 18px;
                height: 18px;
            }
        }

        /* Ajustar el tamaño del rank thumbnail */
        .rank-thumbnail {
            width: 25px;
            height: 25px;
            object-fit: contain;
            vertical-align: middle;
            margin-right: 8px;
            filter: drop-shadow(0 0 4px rgba(243, 167, 18, 0.2));
        }

        /* Ajustar el contenedor de rango en la tabla */
        .table td:last-child {
            display: flex;
            align-items: center;
            gap: 8px;
        }
    </style>
</head>
<body>
    <div class="container main-container">
        <!-- Perfil del Usuario -->
        <div class="profile-card">
            <div class="profile-header-grid">
                <div class="profile-image-section">
                    <div class="profile-image-wrapper">
                        <img src="images/<?php echo htmlspecialchars($perfil_imagen); ?>" 
                             class="profile-image" alt="Perfil">
                        <button class="change-avatar-btn" onclick="cambiarAvatar()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="profile-info-section">
                    <h2 class="username-text"><?php echo htmlspecialchars($username); ?></h2>
                    <div class="quote-container">
                        <p class="player-quote">
                            "<?php echo htmlspecialchars($frase); ?>"
                        </p>
                        <i class="fas fa-pencil edit-quote-icon" onclick="editarFrase()"></i>
                    </div>
                </div>

                <div class="rank-section">
                    <img src="images/<?php echo strtolower(str_replace(' ', '', $rango)); ?>.png" 
                         class="rank-image" alt="<?php echo $rango; ?>">
                    <div class="stats-container">
                        <div class="stat-item">
                            <h4>Rango</h4>
                            <p class="h5"><?php echo htmlspecialchars($rango); ?></p>
                        </div>
                        <div class="stat-item">
                            <h4>Copas</h4>
                            <p class="h5"><?php echo $copas; ?></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Botones de Navegación -->        <div class="d-flex justify-content-center flex-wrap mb-4">
            <button class="nav-button" onclick="location.href='seleccion.php'">
                <i class="fas fa-home"></i> Inicio
            </button>
            <button class="nav-button" onclick="location.href='ruleta.php'">
                <i class="fas fa-dice"></i> Gacha
            </button>
            <button class="nav-button" onclick="location.href='wallet/wallet.php'">
                <i class="fas fa-wallet"></i> Wallet
            </button>
            <button class="nav-button" onclick="location.href='cartas/sobres.php'">
                <i class="fas fa-cart"></i> Cartas
            </button>
        </div>

        <!-- Tabla de Clasificación -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3 class="mb-0">Clasificación</h3>
                <div>
                    <a href="?order=desc" class="sort-button" title="Mayor a menor">
                        <i class="fas fa-sort-amount-down"></i>
                    </a>
                    <a href="?order=asc" class="sort-button" title="Menor a mayor">
                        <i class="fas fa-sort-amount-up"></i>
                    </a>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Posición</th>
                                <th>Usuario</th>
                                <th>Copas</th>
                                <th>Rango</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($usuarios as $index => $usuario): ?>
                            <tr>
                                <td><?php echo $index + 1; ?></td>
                                <td><?php echo htmlspecialchars($usuario['username']); ?></td>
                                <td><?php echo $usuario['copas']; ?></td>
                                <td>
                                    <img src="images/<?php echo strtolower(str_replace(' ', '', $usuario['rango'])); ?>.png" 
                                         class="rank-thumbnail me-2" alt="<?php echo $usuario['rango']; ?>">
                                    <?php echo htmlspecialchars($usuario['rango']); ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="battle-pass-section mt-5">

</div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
    // Agregar después del script de bootstrap
    function cambiarAvatar() {
        const avatares = ['red.jpg', 'riyuri.jpg', 'diluc.jpg']; // Lista de avatares disponibles
        const modal = `
            <div class="modal fade" id="avatarModal">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header">
                            <h5 class="modal-title">Selecciona tu avatar</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="avatar-grid">
                                ${avatares.map(avatar => `
                                    <div class="avatar-option" onclick="seleccionarAvatar('${avatar}')">
                                        <img src="images/${avatar}" alt="Avatar">
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modal);
        new bootstrap.Modal(document.getElementById('avatarModal')).show();
    }

    function seleccionarAvatar(avatar) {
        fetch('actualizar_avatar.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ avatar: avatar })
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                location.reload();
            }
        });
    }

    function editarFrase() {
        const nuevaFrase = prompt('Escribe tu frase de guerrero:', '');
        if (nuevaFrase && nuevaFrase.trim()) {
            fetch('actualizar_frase.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ frase: nuevaFrase })
            })
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    location.reload();
                }
            });
        }
    }
    </script>
</body>
</html>

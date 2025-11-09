<?php
require_once '../includes/Database.php';

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit();
}
$userData = $auth->getUserData();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Colección de Cartas - Einherjar Cards</title>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <link rel="stylesheet" href="assets/css/menu.css">
    <style>
        .coming-soon {
            min-height: 80vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 30px;
        }
        
        .coming-soon h1 {
            font-size: 3rem;
            color: var(--primary-gold);
            margin-bottom: 20px;
        }
        
        .coming-soon p {
            font-size: 1.2rem;
            color: rgba(234, 234, 234, 0.8);
            margin-bottom: 30px;
        }
        
        .btn-back {
            padding: 15px 30px;
            background: var(--primary-gold);
            color: var(--dark-bg);
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1.1rem;
            transition: all 0.3s ease;
        }
        
        .btn-back:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 20px rgba(201, 170, 113, 0.5);
        }
    </style>
</head>
<body>
    <div class="menu-container">
        <header class="menu-header">
            <div class="logo-section">
                <h1 class="game-title">
                    <i class="fas fa-book"></i> Colección de Cartas
                </h1>
            </div>
        </header>
        
        <div class="coming-soon">
            <h1><i class="fas fa-tools"></i> En Construcción <i class="fas fa-tools"></i></h1>
            <p>La galería completa de cartas estará disponible próximamente.<br>
            Aquí podrás ver todas las cartas, sus estadísticas, habilidades y más.</p>
            <a href="index.php" class="btn-back">
                <i class="fas fa-arrow-left"></i> Volver al Menú
            </a>
        </div>
    </div>
</body>
</html>

<?php
require_once '../includes/Database.php';

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    header('Location: index.php');
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    header('Location: index.php');
    exit();
}

$db = Database::getInstance();

// Handle purchase
$mensaje = null;
if (isset($_SESSION['store_feedback'])) {
    $mensaje = $_SESSION['store_feedback'];
    unset($_SESSION['store_feedback']);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['product_id'])) {
    $productId = (int) $_POST['product_id'];
    try {
        $db->beginTransaction();

        $productStmt = $db->prepare("SELECT ID, Nombre, Precio_Esferas, Stock FROM productos WHERE ID = ? FOR UPDATE");
        $productStmt->execute([$productId]);
        $product = $productStmt->fetch();

        if (!$product) {
            throw new Exception('Este producto no existe o fue retirado.');
        }

        if ((int) $product['Stock'] <= 0) {
            throw new Exception('Este producto está agotado.');
        }

        $userStmt = $db->prepare("SELECT username, recompensas FROM usuarios WHERE id = ? FOR UPDATE");
        $userStmt->execute([$userData['id']]);
        $userRow = $userStmt->fetch();

        if (!$userRow) {
            throw new Exception('No se pudo validar tu usuario.');
        }

        if ((int) $userRow['recompensas'] < (int) $product['Precio_Esferas']) {
            throw new Exception('No tienes Esferas suficientes.');
        }

        $updateUser = $db->prepare("UPDATE usuarios SET recompensas = recompensas - ? WHERE id = ?");
        $updateUser->execute([$product['Precio_Esferas'], $userData['id']]);

        $updateStock = $db->prepare("UPDATE productos SET Stock = Stock - 1 WHERE ID = ?");
        $updateStock->execute([$product['ID']]);

        $insertTx = $db->prepare("INSERT INTO transacciones_einherjer (user_id, username, tipo, cantidad, descripcion) VALUES (?, ?, 'compra', ?, ?)");
        $insertTx->execute([$userData['id'], $userRow['username'], $product['Precio_Esferas'], $product['Nombre']]);

        $insertReward = $db->prepare("INSERT INTO recompensas_usuario (user_id, username, recompensa_obtenida, tipo_recompensa, valor) VALUES (?, ?, ?, ?, ?)");
        $insertReward->execute([$userData['id'], $userRow['username'], $product['Nombre'], 'tienda', $product['Precio_Esferas']]);

        $db->commit();

        $_SESSION['store_feedback'] = [
            'success' => true,
            'text' => 'Has comprado ' . $product['Nombre'] . ' por ' . number_format($product['Precio_Esferas']) . ' Esferas.'
        ];
    } catch (Exception $e) {
$conn = $db->getConnection();
if ($conn->inTransaction()) {
    $db->rollback();
}
        $_SESSION['store_feedback'] = [
            'success' => false,
            'text' => $e->getMessage()
        ];
    }

    header('Location: tienda.php');
    exit();
}

// Fetch products list
$stmt = $db->prepare("SELECT ID, Nombre, descripcion, Precio_Esferas, Imagen_URL, Stock, categoria FROM productos ORDER BY Nombre ASC");
$stmt->execute();
$productos = $stmt->fetchAll();

$categoryKeyFn = static function ($value) {
    $text = trim((string) $value);
    if ($text === '') {
        $text = 'General';
    }
    if (function_exists('mb_strtolower')) {
        return mb_strtolower($text, 'UTF-8');
    }
    return strtolower($text);
};

$categoriasMap = [];
$productosDisponibles = [];
$productosAgotados = [];

foreach ($productos as $item) {
    $categoriaLabel = $item['categoria'] ?? 'General';
    if ($categoriaLabel === '') {
        $categoriaLabel = 'General';
    }

    $categoriaKey = $categoryKeyFn($categoriaLabel);
    $categoriasMap[$categoriaKey] = $categoriaLabel;

    if ((int) $item['Stock'] > 0) {
        $productosDisponibles[] = $item;
    } else {
        $productosAgotados[] = $item;
    }
}

ksort($categoriasMap, SORT_FLAG_CASE | SORT_STRING);

$totalDisponibles = count($productosDisponibles);
$totalAgotados = count($productosAgotados);
$totalCategorias = count($categoriasMap);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tienda - Einherjer Blitz</title>
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
        body {
            background: var(--bg-gradient);
            font-family: 'Inter', sans-serif;
            color: var(--text-light);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .store-header {
            padding: 1.8rem 2.5rem 1.4rem;
            border-bottom: 1px solid var(--card-border);
            background: linear-gradient(120deg, rgba(0,0,0,0.65), rgba(37, 29, 11, 0.3));
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1.5rem;
        }
        .header-left {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
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
        .store-title {
            font-family: 'Cinzel', serif;
            color: var(--gold);
            font-size: 2.3rem;
            margin: 0;
            letter-spacing: 0.06em;
            text-shadow: 0 4px 12px var(--gold-shadow);
        }
        .store-subtitle {
            margin: 0;
            color: var(--text-muted);
            font-size: 0.95rem;
            max-width: 560px;
        }
        .header-right {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .currency-badge {
            display: flex;
            gap: 0.75rem;
            align-items: center;
            padding: 0.75rem 1.2rem;
            border-radius: 12px;
            background: rgba(0,0,0,0.45);
            border: 1px solid var(--card-border);
            box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        }
        .currency-badge i {
            color: var(--gold);
            font-size: 1.4rem;
        }
        .currency-label {
            display: block;
            font-size: 0.75rem;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--text-muted);
        }
        .currency-value {
            font-family: 'Cinzel', serif;
            font-size: 1.4rem;
            color: var(--text-light);
        }
        .history-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: transparent;
            border: 1px solid var(--card-border);
            color: var(--text-light);
            padding: 0.65rem 1.1rem;
            border-radius: 10px;
            cursor: pointer;
            transition: var(--transition-smooth);
        }
        .history-btn:hover {border-color: var(--gold); color: var(--gold);}
        .feedback-toast {
            position: fixed;
            top: 1.5rem;
            right: 1.5rem;
            padding: 1rem 1.3rem;
            border-radius: 12px;
            display: flex;
            gap: 0.75rem;
            align-items: center;
            box-shadow: 0 12px 30px rgba(0,0,0,0.35);
            z-index: 1000;
            backdrop-filter: blur(6px);
            border: 1px solid transparent;
            animation: fadeInDown 0.4s ease;
        }
        .feedback-toast.success {background: rgba(34, 49, 24, 0.72); border-color: rgba(153, 214, 102, 0.35);}
        .feedback-toast.error {background: rgba(71, 26, 26, 0.72); border-color: rgba(214, 102, 102, 0.35);}
        .toast-icon i {font-size: 1.6rem; color: var(--gold);}
        .toast-text {font-size: 0.95rem; max-width: 320px;}
        .toast-close {
            background: transparent;
            border: none;
            color: var(--text-light);
            cursor: pointer;
            font-size: 1rem;
        }
        .toast-close:hover {color: var(--gold);}
        .hide {display: none !important;}
        @keyframes fadeInDown {
            from {opacity: 0; transform: translateY(-10px);}
            to {opacity: 1; transform: translateY(0);}
        }
        .store-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2.5rem 0;
            gap: 1.5rem;
        }
        .stats-group {display: flex; gap: 1rem;}
        .stats-card {
            min-width: 120px;
            background: rgba(0,0,0,0.45);
            border: 1px solid var(--card-border);
            border-radius: 14px;
            padding: 0.75rem 1rem;
        }
        .stats-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
        }
        .stats-value {
            display: block;
            font-size: 1.3rem;
            margin-top: 0.2rem;
            color: var(--text-light);
        }
        .filter-group {display: flex; align-items: center; gap: 0.6rem;}
        .filter-label {font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 0.4rem; align-items: center;}
        .filter-select {
            background: rgba(0,0,0,0.45);
            border: 1px solid var(--card-border);
            color: var(--text-light);
            padding: 0.55rem 0.9rem;
            border-radius: 8px;
            min-width: 200px;
        }
        .store-section {padding: 1.5rem 2.5rem 2rem;}
        .section-header {margin-bottom: 1rem;}
        .section-title {
            font-family: 'Cinzel', serif;
            color: var(--gold);
            font-size: 1.5rem;
            margin-bottom: 0.2rem;
        }
        .section-subtitle {color: var(--text-muted); font-size: 0.95rem;}
        .store-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
        }
        .product-card {
            background: rgba(10,10,10,0.65);
            border: 1px solid transparent;
            border-radius: 16px;
            overflow: hidden;
            position: relative;
            transition: var(--transition-smooth);
            box-shadow: 0 12px 30px rgba(0,0,0,0.35);
        }
        .product-card:hover {
            transform: translateY(-6px);
            border-color: rgba(201,170,113,0.35);
            box-shadow: 0 18px 36px rgba(0,0,0,0.45);
        }
        .product-card.agotado {opacity: 0.55; filter: grayscale(0.2);}
        .product-image-wrapper {
            position: relative;
            height: 400px;
            overflow: hidden;
        }
        .product-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.45s ease;
        }
        .product-card:hover .product-image {transform: scale(1.05);} 
        .product-tag {
            position: absolute;
            top: 12px;
            left: 12px;
            background: rgba(0,0,0,0.65);
            padding: 0.35rem 0.7rem;
            border-radius: 999px;
            border: 1px solid var(--card-border);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        .sold-out-badge {
            position: absolute;
            inset: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 1.1rem;
            backdrop-filter: blur(4px);
            background: rgba(10,0,0,0.45);
            color: #ffb4b4;
            gap: 0.5rem;
        }
        .product-body {
            padding: 1.25rem 1.3rem 1.4rem;
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
        }
        .product-title {
            font-size: 1.25rem;
            font-family: 'Cinzel', serif;
            letter-spacing: 0.04em;
        }
        .product-desc {
            font-size: 0.92rem;
            color: var(--text-muted);
            line-height: 1.45;
            max-height: 64px;
            overflow: hidden;
        }
        .product-footer {
            display: flex;
            justify-between;
            align-items: center;
            gap: 0.8rem;
            font-size: 0.85rem;
        }
        .product-footer {display: flex; justify-content: space-between; align-items: center;}
        .price-group {
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
        }
        .price-value {
            font-family: 'Cinzel', serif;
            font-size: 1.1rem;
            color: var(--gold);
        }
        .stock-group {display: flex; gap: 0.4rem; align-items: center; color: var(--text-muted);}
        .stock-group.agotado {color: #ffb4b4;}
        .purchase-form {margin-top: 0.5rem;}
        .btn-comprar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            background: var(--gold);
            color: #111;
            border: none;
            width: 100%;
            padding: 0.75rem 1rem;
            border-radius: 10px;
            font-weight: 600;
            letter-spacing: 0.03em;
            transition: var(--transition-smooth);
        }
        .btn-comprar:hover {
            background: var(--gold-hover);
            transform: translateY(-1px);
            box-shadow: 0 8px 20px rgba(201,170,113,0.35);
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
        .btn-volver {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.7rem 1.4rem;
            border-radius: 999px;
            background: rgba(0,0,0,0.45);
            border: 1px solid var(--card-border);
            color: var(--text-light);
            text-decoration: none;
            margin-top: 1.2rem;
            transition: var(--transition-smooth);
        }
        .btn-volver:hover {border-color: var(--gold); color: var(--gold);}
        .floating-back {
            position: fixed;
            bottom: 1.5rem;
            left: 1.5rem;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: rgba(0,0,0,0.55);
            border: 1px solid var(--card-border);
            color: var(--text-light);
            padding: 0.6rem 1rem;
            border-radius: 999px;
            cursor: pointer;
            transition: var(--transition-smooth);
        }
        .floating-back:hover {border-color: var(--gold); color: var(--gold);}
        
        /* Marketplace Link Button */
        .marketplace-link {
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem 0.75rem;
            background: linear-gradient(135deg, rgba(201,170,113,0.15), rgba(201,170,113,0.05));
            border: 2px solid var(--gold);
            border-radius: 16px;
            text-decoration: none;
            color: var(--gold);
            transition: var(--transition-smooth);
            box-shadow: 0 8px 24px rgba(201,170,113,0.25);
            z-index: 1000;
            animation: pulseGlow 2s ease-in-out infinite;
        }
        
        .marketplace-link:hover {
            transform: translateY(-50%) scale(1.05);
            background: linear-gradient(135deg, rgba(201,170,113,0.25), rgba(201,170,113,0.15));
            box-shadow: 0 12px 32px rgba(201,170,113,0.4);
            color: var(--gold-hover);
        }
        
        .marketplace-link i {
            font-size: 2rem;
        }
        
        .marketplace-link-text {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            writing-mode: vertical-rl;
            text-orientation: mixed;
        }
        
        @keyframes pulseGlow {
            0%, 100% {
                box-shadow: 0 8px 24px rgba(201,170,113,0.25);
            }
            50% {
                box-shadow: 0 8px 32px rgba(201,170,113,0.45);
            }
        }
        
        /* Swipe hint overlay */
        .swipe-hint-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        
        .swipe-hint-overlay.show {
            opacity: 1;
            pointer-events: all;
        }
        
        .swipe-hint-content {
            text-align: center;
            padding: 2rem;
        }
        
        .swipe-hint-icon {
            font-size: 4rem;
            color: var(--gold);
            margin-bottom: 1rem;
            animation: swipeAnimation 1.5s ease-in-out infinite;
        }
        
        @keyframes swipeAnimation {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(30px); }
        }
        
        .swipe-hint-text {
            font-size: 1.3rem;
            color: var(--text-light);
            margin-bottom: 0.5rem;
        }
        
        .swipe-hint-subtext {
            font-size: 0.95rem;
            color: var(--text-muted);
        }
        
        @media (max-width: 768px) {
            .marketplace-link {
                right: 10px;
                padding: 0.75rem 0.5rem;
            }
            .marketplace-link i {
                font-size: 1.5rem;
            }
            .marketplace-link-text {
                font-size: 0.65rem;
            }
        }
        .historial-contenido {
            min-height: 220px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .historial-lista {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
        }
        .historial-item {
            display: flex;
            justify-content: space-between;
            padding: 0.85rem 1rem;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(8,8,8,0.9), rgba(22,18,10,0.95));
            border: 1px solid rgba(201,170,113,0.35);
            box-shadow: 0 10px 28px rgba(0,0,0,0.35);
        }
        .historial-item strong {color: var(--gold); font-family: 'Cinzel', serif;}
        .historial-item span {font-size: 0.9rem; color: var(--text-light);}
        .historial-item small {color: var(--text-muted);}
        .historial-item.champions {
            position: relative;
            border: 1px solid transparent;
            background-image:
                linear-gradient(145deg, rgba(28,26,20,0.95), rgba(12,10,7,0.95)),
                linear-gradient(145deg, rgba(255,215,128,0.95), rgba(255,120,45,0.9));
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow: 0 0 22px rgba(255,180,70,0.3);
        }
        .historial-item.champions::after {
            content: '';
            position: absolute;
            inset: 2px;
            border-radius: 10px;
            border: 1px solid rgba(255,198,104,0.35);
            pointer-events: none;
        }
        .modal-content {
            background: radial-gradient(circle at top, rgba(30,24,16,0.92) 0%, rgba(10,10,10,0.94) 60%);
            color: var(--text-light);
            border: 1px solid rgba(201,170,113,0.35);
            box-shadow: 0 18px 40px rgba(0,0,0,0.6);
        }
        .modal-header, .modal-footer {border-color: rgba(201,170,113,0.18);}
        .modal-title {font-family: 'Cinzel', serif; color: var(--gold); letter-spacing: 0.08em;}
        .btn-close {
            filter: invert(90%);
            opacity: 0.75;
        }
        .btn-close:focus {box-shadow: none;}
        .btn-close:hover {opacity: 1;}
        .modal-body {background: rgba(7,7,7,0.35); border-radius: 10px;}
        .product-card.champions {
            position: relative;
            border: 1px solid transparent;
            background-image:
                linear-gradient(145deg, rgba(32,28,20,0.95), rgba(14,11,7,0.95)),
                linear-gradient(145deg, rgba(255,215,128,0.95), rgba(255,120,45,0.9));
            background-origin: border-box;
            background-clip: padding-box, border-box;
            box-shadow: 0 0 24px rgba(255,180,70,0.35), inset 0 0 14px rgba(255,190,120,0.15);
        }
        .product-card.champions::after {
            content: '';
            position: absolute;
            inset: 1px;
            border-radius: 15px;
            pointer-events: none;
            border: 1px solid rgba(255,198,104,0.35);
        }
        .product-card.champions .product-image-wrapper::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,180,70,0.2), rgba(255,230,170,0.08));
            mix-blend-mode: screen;
        }
        .champions-ribbon {
            position: absolute;
            top: 16px;
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
        .champions-ribbon i {margin-right: 0.35rem;}
        .champions-particles {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
        }
        .champions-particles span {
            position: absolute;
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, rgba(255,220,150,0.95) 0%, rgba(255,190,90,0.3) 60%, transparent 100%);
            border-radius: 50%;
            opacity: 0;
            animation: sparkFloat 4.5s linear infinite;
        }
        .champions-particles span:nth-child(1) {left: 8%; top: 65%; animation-delay: 0s;}
        .champions-particles span:nth-child(2) {left: 20%; top: 45%; animation-delay: 0.8s;}
        .champions-particles span:nth-child(3) {left: 32%; top: 70%; animation-delay: 1.6s;}
        .champions-particles span:nth-child(4) {left: 48%; top: 50%; animation-delay: 0.4s;}
        .champions-particles span:nth-child(5) {left: 60%; top: 68%; animation-delay: 1.2s;}
        .champions-particles span:nth-child(6) {left: 72%; top: 55%; animation-delay: 2s;}
        .champions-particles span:nth-child(7) {left: 84%; top: 62%; animation-delay: 1s;}
        .champions-particles span:nth-child(8) {left: 12%; top: 30%; animation-delay: 2.4s;}
        .champions-particles span:nth-child(9) {left: 38%; top: 26%; animation-delay: 1.4s;}
        .champions-particles span:nth-child(10) {left: 55%; top: 34%; animation-delay: 2.8s;}
        .champions-particles span:nth-child(11) {left: 68%; top: 28%; animation-delay: 0.6s;}
        .champions-particles span:nth-child(12) {left: 88%; top: 40%; animation-delay: 2.2s;}
        @keyframes sparkFloat {
            0% {transform: translateY(0) scale(0.4); opacity: 0;}
            20% {opacity: 1;}
            40% {transform: translateY(-18px) scale(0.8); opacity: 0.9;}
            70% {transform: translateY(-42px) scale(0.6); opacity: 0.4;}
            100% {transform: translateY(-64px) scale(0.2); opacity: 0;}
        }
        .product-card.champions .product-image-wrapper {overflow: hidden;}
        .product-card.champions.agotado .champions-particles span {animation-duration: 5.5s; opacity: 0.6;}
        .product-card.champions.agotado .champions-ribbon {background: linear-gradient(120deg, rgba(255,200,140,0.8), rgba(200,110,40,0.8));}
        @media (max-width: 992px) {
            .store-header {flex-direction: column; align-items: stretch;}
            .header-right {justify-content: space-between;}
            .store-toolbar {flex-direction: column; align-items: stretch;}
        }
        @media (max-width: 576px) {
            .store-header {padding: 1.2rem 1.35rem;}
            .store-toolbar, .store-section {padding: 1.2rem;}
            .store-grid {grid-template-columns: 1fr;}
            .floating-back {display: none;}
        }
    </style>
</head>
<body>
    <!-- REMOVED: Marketplace Link para iframe -->
    
    <header class="store-header">
        <div class="header-left">
            <h1 class="store-title">Tienda Oficial</h1>
            <p class="store-subtitle">Articulos exclusivos para tu inventario</p>
        </div>
        <div class="header-right">
            <div class="currency-badge">
                <i class="fas fa-globe"></i>
                <div>
                    <span class="currency-label">Esferas disponibles</span>
                    <span class="currency-value"><?php echo number_format($userData['recompensas']); ?></span>
                </div>
            </div>
            <button class="history-btn" data-bs-toggle="modal" data-bs-target="#historialModal">
                <i class="fas fa-receipt"></i>
                <span>Historial</span>
            </button>
        </div>
    </header>

    <?php if ($mensaje): ?>
        <div class="feedback-toast <?php echo $mensaje['success'] ? 'success' : 'error'; ?>">
            <div class="toast-icon">
                <i class="fas fa-<?php echo $mensaje['success'] ? 'check-circle' : 'exclamation-circle'; ?>"></i>
            </div>
            <div class="toast-text"><?php echo htmlspecialchars($mensaje['text']); ?></div>
            <button class="toast-close" onclick="this.parentElement.classList.add('hide');"><i class="fas fa-times"></i></button>
        </div>
    <?php endif; ?>

    <main class="flex-grow-1">
        <div class="store-toolbar">
            <div class="stats-group">
                <div class="stats-card">
                    <span class="stats-label">Productos</span>
                    <span class="stats-value"><?php echo $totalDisponibles; ?></span>
                </div>
                <div class="stats-card">
                    <span class="stats-label">Categorías</span>
                    <span class="stats-value"><?php echo $totalCategorias; ?></span>
                </div>
            </div>
            <div class="filter-group">
                <?php if (!empty($categoriasMap)): ?>
                <label class="filter-label" for="filtroCategoria"><i class="fas fa-filter"></i> Categoría</label>
                <select id="filtroCategoria" class="filter-select">
                    <option value="">Todas</option>
                    <?php foreach ($categoriasMap as $key => $label): ?>
                        <option value="<?php echo htmlspecialchars($key); ?>"><?php echo htmlspecialchars($label); ?></option>
                    <?php endforeach; ?>
                </select>
                <?php endif; ?>
            </div>
        </div>

        <?php if ($totalDisponibles === 0 && $totalAgotados === 0): ?>
            <section class="empty-state">
                <div class="empty-illustration">
                    <i class="fas fa-store-slash"></i>
                </div>
                <h2>La tienda está en mantenimiento</h2>
                <p>Pronto llegarán nuevos artículos. Mientras tanto, sigue acumulando Esferas.</p>
                <a href="../dashboard.php" class="btn-volver"><i class="fas fa-home"></i> Volver al Dashboard</a>
            </section>
        <?php else: ?>

        <?php if ($totalDisponibles > 0): ?>
        <section class="store-section">
            <div class="section-header">
                <h2 class="section-title">Disponibles</h2>
                <p class="section-subtitle">Escoge el equipo que necesitas</p>
            </div>
            <div class="store-grid" id="gridDisponibles">
                <?php foreach ($productosDisponibles as $p): ?>
                <?php
                    $isChampions = (int) $p['Precio_Esferas'] >= 1000;
                    $cardClasses = 'product-card';
                    if ($isChampions) {
                        $cardClasses .= ' champions';
                    }
                    $categoryKey = htmlspecialchars($categoryKeyFn($p['categoria'] ?? 'General'));
                ?>
                <article class="<?php echo $cardClasses; ?>" data-category-key="<?php echo $categoryKey; ?>">
                    <figure class="product-image-wrapper">
                        <img src="<?php echo htmlspecialchars($p['Imagen_URL']); ?>" alt="<?php echo htmlspecialchars($p['Nombre']); ?>" class="product-image">
                        <figcaption class="product-tag"><?php echo htmlspecialchars($p['categoria'] ?? 'General'); ?></figcaption>
                        <?php if ($isChampions): ?>
                            <div class="champions-ribbon">
                                <i class="fas fa-crown"></i> Exclusivo 2025
                            </div>
                            <div class="champions-particles">
                                <?php for ($i = 0; $i < 12; $i++): ?>
                                    <span></span>
                                <?php endfor; ?>
                            </div>
                        <?php endif; ?>
                    </figure>
                    <div class="product-body">
                        <h3 class="product-title"><?php echo htmlspecialchars($p['Nombre']); ?></h3>
                        <p class="product-desc"><?php echo htmlspecialchars($p['descripcion']); ?></p>
                        <div class="product-footer">
                            <div class="price-group">
                                <span class="price-label">Precio</span>
                                <span class="price-value"><i class="fas fa-globe"></i> <?php echo number_format($p['Precio_Esferas']); ?></span>
                            </div>
                            <div class="stock-group">
                                <i class="fas fa-box"></i>
                                <span><?php echo (int) $p['Stock']; ?> en stock</span>
                            </div>
                        </div>
                        <form method="POST" class="purchase-form">
                            <input type="hidden" name="product_id" value="<?php echo $p['ID']; ?>">
                            <button type="submit" class="btn-comprar">
                                <span>Comprar</span>
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </form>
                    </div>
                </article>
                <?php endforeach; ?>
            </div>
        </section>
        <?php endif; ?>

        <?php if ($totalAgotados > 0): ?>
        <section class="store-section agotados">
            <div class="section-header">
                <h2 class="section-title">Agotados</h2>
                <p class="section-subtitle">Vuelve más tarde para su reposición</p>
            </div>
            <div class="store-grid agotados" id="gridAgotados">
                <?php foreach ($productosAgotados as $p): ?>
                <?php
                    $isChampions = (int) $p['Precio_Esferas'] >= 1000;
                    $cardClasses = 'product-card agotado';
                    if ($isChampions) {
                        $cardClasses .= ' champions';
                    }
                    $categoryKey = htmlspecialchars($categoryKeyFn($p['categoria'] ?? 'General'));
                ?>
                <article class="<?php echo $cardClasses; ?>" data-category-key="<?php echo $categoryKey; ?>">
                    <figure class="product-image-wrapper">
                        <img src="<?php echo htmlspecialchars($p['Imagen_URL']); ?>" alt="<?php echo htmlspecialchars($p['Nombre']); ?>" class="product-image">
                        <figcaption class="product-tag"><?php echo htmlspecialchars($p['categoria'] ?? 'General'); ?></figcaption>
                        <?php if ($isChampions): ?>
                            <div class="champions-ribbon">
                                <i class="fas fa-crown"></i> Champions 2025
                            </div>
                            <div class="champions-particles">
                                <?php for ($i = 0; $i < 12; $i++): ?>
                                    <span></span>
                                <?php endfor; ?>
                            </div>
                        <?php endif; ?>
                        <div class="sold-out-badge"><i class="fas fa-ban"></i> Agotado</div>
                    </figure>
                    <div class="product-body">
                        <h3 class="product-title"><?php echo htmlspecialchars($p['Nombre']); ?></h3>
                        <p class="product-desc"><?php echo htmlspecialchars($p['descripcion']); ?></p>
                        <div class="product-footer">
                            <div class="price-group">
                                <span class="price-label">Precio</span>
                                <span class="price-value"><i class="fas fa-globe"></i> <?php echo number_format($p['Precio_Esferas']); ?></span>
                            </div>
                            <div class="stock-group agotado">
                                <i class="fas fa-clock"></i>
                                <span>Reposición pendiente</span>
                            </div>
                        </div>
                    </div>
                </article>
                <?php endforeach; ?>
            </div>
        </section>
        <?php endif; ?>

        <?php endif; ?>
    </main>

    <div class="modal fade" id="historialModal" tabindex="-1" aria-labelledby="historialModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="historialModalLabel">Historial de compras</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div id="historialContenido" class="historial-contenido">
                        <div class="spinner-border text-warning" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        (function () {
            const filtro = document.getElementById('filtroCategoria');
            const gridDisponibles = document.getElementById('gridDisponibles');
            const gridAgotados = document.getElementById('gridAgotados');
            const totalDisponibles = <?php echo (int) $totalDisponibles; ?>;
            const totalAgotados = <?php echo (int) $totalAgotados; ?>;

            const filterCards = (container, categoria) => {
                if (!container) {
                    return;
                }
                const normalizada = categoria.trim();
                container.querySelectorAll('.product-card').forEach((card) => {
                    const key = card.getAttribute('data-category-key') || '';
                    card.classList.toggle('hidden', normalizada && key !== normalizada);
                });
            };

            if (filtro) {
                filtro.addEventListener('change', function () {
                    const categoria = this.value || '';
                    filterCards(gridDisponibles, categoria);
                    filterCards(gridAgotados, categoria);
                });
            }

            const backBtn = document.getElementById('btnBack');
            if (backBtn) {
                backBtn.addEventListener('click', function () {
                    if (window.history.length > 1) {
                        window.history.back();
                    } else {
                        window.location.href = 'dashboard.php';
                    }
                });
            }

            const historialModal = document.getElementById('historialModal');
            if (historialModal) {
                historialModal.addEventListener('show.bs.modal', function () {
                    const contenedor = document.getElementById('historialContenido');
                    if (!contenedor) {
                        return;
                    }

                    contenedor.innerHTML = '<div class="spinner-border text-warning" role="status"><span class="visualmente-hidden">Cargando...</span></div>';

                    fetch('tienda_historial.php')
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error('No se pudo cargar el historial');
                            }
                            return response.text();
                        })
                        .then((html) => {
                            contenedor.innerHTML = html;
                        })
                        .catch((error) => {
                            contenedor.innerHTML = '<div class="alert alert-danger">' + error.message + '</div>';
                        });
                });
            }

            const toast = document.querySelector('.feedback-toast');
            if (toast) {
                setTimeout(() => {
                    toast.classList.add('hide');
                }, 6000);
            }

            document.querySelectorAll('.product-card.hidden').forEach((card) => {
                card.style.display = 'none';
            });
        })();
    </script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>

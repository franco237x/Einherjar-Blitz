<?php
require_once __DIR__ . '/../includes/Database.php';

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit();
}

$userData = $auth->getUserData();
if ($userData['username'] !== 'admin') {
    header('Location: ../dashboard.php');
    exit();
}

$db = Database::getInstance()->getConnection();

// Handle toggle
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['user_id']) && isset($input['hot'])) {
        $uid = (int)$input['user_id'];
        $hot = (int)$input['hot'];
        $stmt = $db->prepare("UPDATE usuarios SET aquelarre_hot = ? WHERE id = ?");
        $stmt->execute([$hot, $uid]);
        echo json_encode(['success' => true]);
        exit();
    }
}

// Fetch users
$stmt = $db->query("SELECT id, username, email, unique_id, aquelarre_hot FROM usuarios ORDER BY id DESC");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Modo Hot Aquelarre</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: #0a0a0a;
            color: #e5e7eb;
            font-family: 'Segoe UI', system-ui, sans-serif;
            padding: 2rem 1rem;
        }
        h1 { text-align: center; margin-bottom: 2rem; font-size: 1.6rem; }
        .back-link {
            display: inline-block; margin-bottom: 1.5rem; color: #a78bfa; text-decoration: none; font-weight: 600;
        }
        .back-link:hover { text-decoration: underline; }
        table { width: 100%; max-width: 800px; margin: 0 auto; border-collapse: collapse; font-size: 0.95rem; }
        th, td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.08); }
        th { background: rgba(255,255,255,0.04); font-weight: 600; color: #fff; }
        tr:hover { background: rgba(255,255,255,0.02); }
        .switch { position: relative; display: inline-block; width: 46px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
            background-color: #374151; transition: .3s; border-radius: 24px;
        }
        .slider:before {
            position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
            background-color: white; transition: .3s; border-radius: 50%;
        }
        input:checked + .slider { background-color: #ec4899; }
        input:checked + .slider:before { transform: translateX(22px); }
        .badge { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 700; }
        .badge-hot { background: #ec489920; color: #ec4899; border: 1px solid #ec489940; }
        .badge-off { background: #37415120; color: #9ca3af; border: 1px solid #374151; }
        @media (max-width: 600px) {
            th, td { padding: 0.6rem 0.5rem; font-size: 0.85rem; }
            .hide-mobile { display: none; }
        }
    </style>
</head>
<body>
    <a href="../dashboard.php" class="back-link">&larr; Volver al Dashboard</a>
    <h1>Aquelarre Hot - Panel Admin</h1>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th class="hide-mobile">Email</th>
                <th class="hide-mobile">Unique ID</th>
                <th>Estado</th>
                <th>Accion</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($users as $u): ?>
            <tr>
                <td><?= htmlspecialchars($u['id']) ?></td>
                <td><?= htmlspecialchars($u['username']) ?></td>
                <td class="hide-mobile"><?= htmlspecialchars($u['email'] ?? '') ?></td>
                <td class="hide-mobile"><?= htmlspecialchars($u['unique_id']) ?></td>
                <td>
                    <?php if ($u['aquelarre_hot']): ?>
                        <span class="badge badge-hot">HOT</span>
                    <?php else: ?>
                        <span class="badge badge-off">Normal</span>
                    <?php endif; ?>
                </td>
                <td>
                    <label class="switch">
                        <input type="checkbox" data-uid="<?= $u['id'] ?>" <?= $u['aquelarre_hot'] ? 'checked' : '' ?>>
                        <span class="slider"></span>
                    </label>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <script>
        document.querySelectorAll('.switch input').forEach(toggle => {
            toggle.addEventListener('change', async function() {
                const uid = this.dataset.uid;
                const hot = this.checked ? 1 : 0;
                try {
                    const res = await fetch('aquelarre_hot.php', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({user_id: uid, hot: hot})
                    });
                    const data = await res.json();
                    if (!data.success) {
                        alert('Error al actualizar');
                        this.checked = !this.checked;
                    } else {
                        const badge = this.closest('tr').querySelector('.badge');
                        if (hot) {
                            badge.className = 'badge badge-hot';
                            badge.textContent = 'HOT';
                        } else {
                            badge.className = 'badge badge-off';
                            badge.textContent = 'Normal';
                        }
                    }
                } catch (e) {
                    alert('Error de red');
                    this.checked = !this.checked;
                }
            });
        });
    </script>
</body>
</html>

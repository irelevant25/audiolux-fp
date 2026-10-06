<?php
// Simple endpoint to get CSRF token (cookie flags must match api.php)
session_set_cookie_params([
    'httponly' => true,
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Strict',
]);
session_start();

// Generate CSRF token if it doesn't exist
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
echo json_encode(['csrf_token' => $_SESSION['csrf_token']]);

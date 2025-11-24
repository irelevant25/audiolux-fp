<?php
// Start session for CSRF token
session_start();

// Set JSON header
header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// CSRF Protection
if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid security token']);
    exit;
}

// Rate limiting (basic check)
if (!isset($_SESSION['last_submit'])) {
    $_SESSION['last_submit'] = 0;
}
if (time() - $_SESSION['last_submit'] < 10) {
    echo json_encode(['success' => false, 'message' => 'Please wait before submitting again']);
    exit;
}

// Get and sanitize input
$name = filter_var(trim($_POST['name'] ?? ''), FILTER_SANITIZE_STRING);
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$subject = filter_var(trim($_POST['subject'] ?? ''), FILTER_SANITIZE_STRING);
$message = htmlspecialchars(trim($_POST['message'] ?? ''), ENT_QUOTES, 'UTF-8');

// Validation
if (empty($name) || empty($email) || empty($subject) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}

// Check for email header injection
if (preg_match("/[\r\n]/", $email) || preg_match("/[\r\n]/", $name)) {
    echo json_encode(['success' => false, 'message' => 'Invalid input detected']);
    exit;
}

// Length limits
if (strlen($name) > 100 || strlen($subject) > 200 || strlen($message) > 5000) {
    echo json_encode(['success' => false, 'message' => 'Input too long']);
    exit;
}

// Simple honeypot check (bots fill this field)
if (!empty($_POST['website'])) {
    // Bot detected, pretend success but don't send email
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
    exit;
}

// ✅ Odosielateľ aj príjemca je support@codehero.sk
$host_email = "support@codehero.sk";

// ✅ Subject obsahuje email užívateľa
$email_subject = "Kontaktny formular od: " . $email;

// Email body s všetkými informáciami
$email_body = "Nová správa z kontaktného formulára\n\n";
$email_body .= "Meno: " . $name . "\n";
$email_body .= "Email: " . $email . "\n";
$email_body .= "Predmet: " . $subject . "\n\n";
$email_body .= "Správa:\n" . $message . "\n\n";
$email_body .= "---\n";
$email_body .= "IP adresa: " . $_SERVER['REMOTE_ADDR'] . "\n";
$email_body .= "Dátum: " . date('d.m.Y H:i:s') . "\n";

$headers = "From: " . $host_email . "\r\n";
$headers .= "Reply-To: " . $email . "\r\n";  // Po kliknutí na "Odpovedať", pôjde email pužívateľovi (email vo formulári)
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send email
if (mail($host_email, $email_subject, $email_body, $headers)) {
    $_SESSION['last_submit'] = time();
    echo json_encode(['success' => true, 'message' => 'Správa bola úspešne odoslaná']);
} else {
    error_log("Failed to send email from contact form");
    echo json_encode(['success' => false, 'message' => 'Nepodarilo sa odoslať správu. Skúste to prosím neskôr.']);
}
?>
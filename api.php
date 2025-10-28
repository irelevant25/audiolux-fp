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

// **CHANGE THIS TO YOUR EMAIL**
$to = "your-email@example.com";

// Prepare email (with header injection protection)
$email_subject = "Contact Form: " . substr($subject, 0, 100);
$email_body = "Contact Form Submission\n\n";
$email_body .= "Name: " . $name . "\n";
$email_body .= "Email: " . $email . "\n";
$email_body .= "Subject: " . $subject . "\n\n";
$email_body .= "Message:\n" . $message . "\n\n";
$email_body .= "---\n";
$email_body .= "Sent from: " . $_SERVER['REMOTE_ADDR'] . "\n";
$email_body .= "Date: " . date('Y-m-d H:i:s') . "\n";

// Safe headers (no user input in headers!)
$headers = "From: noreply@yourdomain.sk\r\n";
$headers .= "Reply-To: noreply@yourdomain.sk\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Add user email in body instead of Reply-To header (safer)

// Send email
if (mail($to, $email_subject, $email_body, $headers)) {
    $_SESSION['last_submit'] = time();
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
} else {
    error_log("Failed to send email from contact form");
    echo json_encode(['success' => false, 'message' => 'Failed to send email. Please try again later.']);
}
?>
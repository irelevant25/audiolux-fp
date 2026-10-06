<?php
// Contact form endpoint: validates the submission and e-mails it to the site owner.
// Always answers with JSON {"success": bool, "message": string}; the message is shown to the visitor.

// PHP notices/warnings must never end up in the JSON response (they still go to the error log)
ini_set('display_errors', '0');
date_default_timezone_set('Europe/Bratislava');

// Start session for CSRF token (cookie flags must match get-token.php)
session_set_cookie_params([
    'httponly' => true,
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'samesite' => 'Strict',
]);
session_start();

// Set JSON header
header('Content-Type: application/json; charset=UTF-8');

function respond(int $status, bool $success, string $message): void
{
    http_response_code($status);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// Trimmed text of a POST field; '' when missing or not a string (e.g. "name[]=x")
function post_field(string $key): string
{
    $value = $_POST[$key] ?? '';
    return is_string($value) ? trim($value) : '';
}

function text_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, false, 'Nepovolená metóda požiadavky.');
}

// CSRF Protection
$token = $_POST['csrf_token'] ?? '';
if (!is_string($token) || !isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
    respond(403, false, 'Neplatný bezpečnostný token. Obnovte stránku a skúste to znova.');
}

// Simple honeypot check (bots fill this field): pretend success but don't send email
if (post_field('website') !== '') {
    respond(200, true, 'Správa bola úspešne odoslaná.');
}

// Rate limiting (basic check)
if (time() - ($_SESSION['last_submit'] ?? 0) < 10) {
    respond(429, false, 'Počkajte prosím chvíľu pred ďalším odoslaním.');
}

// Get input (the email is plain text, so no HTML escaping is needed)
$name = post_field('name');
$email = post_field('email');
$phone = post_field('phone');
$subject = post_field('subject');
$message = str_replace(["\r\n", "\r"], "\n", post_field('message'));

// Validation
if ($name === '' || $email === '' || $subject === '' || $message === '') {
    respond(400, false, 'Vyplňte prosím všetky povinné polia.');
}

// Validate email format
if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, false, 'Zadajte platnú e-mailovú adresu.');
}

// Reject invalid UTF-8 and line breaks in single-line fields (email header injection)
$single_line = $name . $email . $phone . $subject;
if (!preg_match('//u', $single_line . $message) || preg_match('/[\r\n]/', $single_line)) {
    respond(400, false, 'Formulár obsahuje neplatné znaky.');
}

// Length limits (keep in sync with the maxlength attributes in index.html)
if (text_length($name) > 100 || text_length($phone) > 30 || text_length($subject) > 200 || text_length($message) > 5000) {
    respond(400, false, 'Niektoré z polí je príliš dlhé.');
}

// ✅ Odosielateľ aj príjemca je support@audiolux.sk
$host_email = "support@audiolux.sk";

// ✅ Subject obsahuje email užívateľa
$email_subject = "Kontaktny formular od: " . $email;

// Email body s všetkými informáciami
$email_body = "Nová správa z kontaktného formulára\n\n";
$email_body .= "Meno: " . $name . "\n";
$email_body .= "Email: " . $email . "\n";
$email_body .= "Telefón: " . ($phone !== '' ? $phone : '-') . "\n";
$email_body .= "Predmet: " . $subject . "\n\n";
$email_body .= "Správa:\n" . $message . "\n\n";
$email_body .= "---\n";
$email_body .= "IP adresa: " . ($_SERVER['REMOTE_ADDR'] ?? '') . "\n";
$email_body .= "Dátum: " . date('d.m.Y H:i:s') . "\n";

$headers = [
    'From' => $host_email,
    'Reply-To' => $email,  // Po kliknutí na "Odpovedať", pôjde email používateľovi (email vo formulári)
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    // quoted-printable keeps every line short and 7-bit safe, whatever the visitor typed
    'Content-Transfer-Encoding' => 'quoted-printable',
];

// Send email
if (mail($host_email, $email_subject, quoted_printable_encode(str_replace("\n", "\r\n", $email_body)), $headers)) {
    $_SESSION['last_submit'] = time();
    respond(200, true, 'Správa bola úspešne odoslaná.');
}

error_log("Failed to send email from contact form");
respond(500, false, 'Nepodarilo sa odoslať správu. Skúste to prosím neskôr.');

<?php
declare(strict_types=1);
session_start();

const ROOT_DIR = __DIR__ . '/..';
const DEFAULT_FILE = ROOT_DIR . '/data/default-site.json';
const RUNTIME_DIR = ROOT_DIR . '/runtime';
const UPLOAD_DIR = RUNTIME_DIR . '/uploads';
const SITE_FILE = RUNTIME_DIR . '/site.json';
const ADMIN_FILE = RUNTIME_DIR . '/admin.json';

function ensure_runtime(): void {
    if (!is_dir(RUNTIME_DIR)) @mkdir(RUNTIME_DIR, 0755, true);
    if (!is_dir(UPLOAD_DIR)) @mkdir(UPLOAD_DIR, 0755, true);
    if (!file_exists(SITE_FILE) && file_exists(DEFAULT_FILE)) @copy(DEFAULT_FILE, SITE_FILE);
}
ensure_runtime();

function h(string $value): string { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
function read_json(string $file, array $fallback = []): array {
    if (!is_file($file)) return $fallback;
    $decoded = json_decode((string)file_get_contents($file), true);
    return is_array($decoded) ? $decoded : $fallback;
}
function load_site(): array { return read_json(SITE_FILE, read_json(DEFAULT_FILE)); }
function save_site(array $data): bool {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return $json !== false && file_put_contents(SITE_FILE, $json, LOCK_EX) !== false;
}
function admin_exists(): bool { return is_file(ADMIN_FILE); }
function logged_in(): bool { return !empty($_SESSION['gisel_admin']); }
function csrf_token(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
    return $_SESSION['csrf'];
}
function verify_csrf(): void {
    if (!isset($_POST['csrf']) || !hash_equals((string)($_SESSION['csrf'] ?? ''), (string)$_POST['csrf'])) {
        http_response_code(403); exit('Solicitud inválida.');
    }
}
function uid(string $prefix): string { return $prefix . '-' . bin2hex(random_bytes(4)); }
function bool_post(string $key): bool { return isset($_POST[$key]) && $_POST[$key] === '1'; }
function upload_image(string $field, string $prefix): ?string {
    if (empty($_FILES[$field]) || ($_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
    if ($_FILES[$field]['error'] !== UPLOAD_ERR_OK) throw new RuntimeException('No se pudo subir la imagen.');
    if ($_FILES[$field]['size'] > 10 * 1024 * 1024) throw new RuntimeException('La imagen supera los 10 MB.');
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($_FILES[$field]['tmp_name']);
    $allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
    if (!isset($allowed[$mime])) throw new RuntimeException('Formato no permitido. Usá JPG, PNG o WEBP.');
    $filename = $prefix . '-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.' . $allowed[$mime];
    if (!move_uploaded_file($_FILES[$field]['tmp_name'], UPLOAD_DIR . '/' . $filename)) throw new RuntimeException('No se pudo guardar la imagen.');
    return 'api/media.php?f=' . rawurlencode($filename);
}
function redirect_admin(string $anchor = ''): never {
    header('Location: index.php' . ($anchor ? '#' . $anchor : '')); exit;
}

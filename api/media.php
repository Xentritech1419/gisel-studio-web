<?php
declare(strict_types=1);
$filename = basename((string)($_GET['f'] ?? ''));
if ($filename === '' || !preg_match('/^[a-zA-Z0-9._-]+$/', $filename)) { http_response_code(404); exit; }
$file = dirname(__DIR__) . '/runtime/uploads/' . $filename;
if (!is_file($file)) { http_response_code(404); exit; }
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file) ?: 'application/octet-stream';
if (!in_array($mime, ['image/jpeg','image/png','image/webp'], true)) { http_response_code(403); exit; }
header('Content-Type: ' . $mime);
header('Cache-Control: public, max-age=31536000, immutable');
header('Content-Length: ' . filesize($file));
readfile($file);

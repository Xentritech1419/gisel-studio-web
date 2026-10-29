<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
$root = dirname(__DIR__);
$runtime = $root . '/runtime/site.json';
$default = $root . '/data/default-site.json';
$file = is_file($runtime) ? $runtime : $default;
if (!is_file($file)) { http_response_code(500); echo '{"error":"Configuración no disponible"}'; exit; }
readfile($file);

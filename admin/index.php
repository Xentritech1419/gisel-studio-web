<?php
declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

$error = '';
$notice = '';

if (isset($_GET['logout'])) { $_SESSION = []; session_destroy(); header('Location: index.php'); exit; }

if (!admin_exists()) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'setup') {
        $password = (string)($_POST['password'] ?? '');
        $confirm = (string)($_POST['confirm'] ?? '');
        if (strlen($password) < 8) $error = 'La contraseña debe tener al menos 8 caracteres.';
        elseif ($password !== $confirm) $error = 'Las contraseñas no coinciden.';
        else {
            file_put_contents(ADMIN_FILE, json_encode(['password'=>password_hash($password, PASSWORD_DEFAULT)], JSON_PRETTY_PRINT), LOCK_EX);
            $_SESSION['gisel_admin'] = true; header('Location: index.php'); exit;
        }
    }
    ?>
    <!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Crear acceso | Gisel Admin</title><link rel="stylesheet" href="admin.css"></head><body>
    <div class="login-wrap"><h1>Crear acceso administrativo</h1><p class="muted">Esta pantalla aparece una sola vez. Elegí una contraseña segura para administrar la web.</p>
    <?php if($error): ?><div class="status status-error"><?=h($error)?></div><?php endif; ?>
    <form method="post"><input type="hidden" name="action" value="setup"><div class="field"><label>Contraseña</label><input type="password" name="password" required minlength="8"></div><div class="field" style="margin-top:12px"><label>Repetir contraseña</label><input type="password" name="confirm" required minlength="8"></div><div class="actions-row"><button class="btn btn-primary">Crear acceso</button></div></form></div></body></html>
    <?php exit;
}

if (!logged_in()) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'login') {
        $auth = read_json(ADMIN_FILE);
        if (!empty($auth['password']) && password_verify((string)($_POST['password'] ?? ''), $auth['password'])) {
            $_SESSION['gisel_admin'] = true; header('Location: index.php'); exit;
        }
        $error = 'Contraseña incorrecta.';
    }
    ?>
    <!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gisel Admin</title><link rel="stylesheet" href="admin.css"></head><body>
    <div class="login-wrap"><h1>Gisel Studio · Administrador</h1><p class="muted">Ingresá tu contraseña para editar la web.</p>
    <?php if($error): ?><div class="status status-error"><?=h($error)?></div><?php endif; ?>
    <form method="post"><input type="hidden" name="action" value="login"><div class="field"><label>Contraseña</label><input type="password" name="password" required autofocus></div><div class="actions-row"><button class="btn btn-primary">Ingresar</button></div></form></div></body></html>
    <?php exit;
}

$data = load_site();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        verify_csrf();
        $action = (string)($_POST['action'] ?? '');

        if ($action === 'save_general') {
            $data['brand']['name'] = trim((string)($_POST['brand_name'] ?? $data['brand']['name']));
            $data['brand']['city'] = trim((string)($_POST['brand_city'] ?? $data['brand']['city']));
            $data['whatsapp']['number'] = preg_replace('/\D+/', '', (string)($_POST['wa_number'] ?? ''));
            $data['whatsapp']['general'] = trim((string)($_POST['wa_general'] ?? ''));
            $data['whatsapp']['catalog'] = trim((string)($_POST['wa_catalog'] ?? ''));
            $data['whatsapp']['combo'] = trim((string)($_POST['wa_combo'] ?? ''));
            $data['footer']['catalogTitle'] = trim((string)($_POST['catalog_footer_title'] ?? ''));
            $data['footer']['catalogText'] = trim((string)($_POST['catalog_footer_text'] ?? ''));
            $data['footer']['combosTitle'] = trim((string)($_POST['combos_footer_title'] ?? ''));
            $data['footer']['combosText'] = trim((string)($_POST['combos_footer_text'] ?? ''));

            foreach ($data['socials'] as &$social) {
                $id = $social['id'];
                $social['url'] = trim((string)($_POST['social_url'][$id] ?? ''));
                $social['enabled'] = isset($_POST['social_enabled'][$id]);
            } unset($social);

            foreach ($data['homeButtons'] as &$button) {
                $id = $button['id'];
                if (!isset($_POST['button'][$id])) continue;
                $row = $_POST['button'][$id];
                $button['eyebrow'] = trim((string)($row['eyebrow'] ?? ''));
                $button['title'] = trim((string)($row['title'] ?? ''));
                $button['icon'] = preg_match('/^bi-[a-z0-9-]+$/i', (string)($row['icon'] ?? '')) ? (string)$row['icon'] : 'bi-link-45deg';
                $button['type'] = ($row['type'] ?? 'link') === 'whatsapp' ? 'whatsapp' : 'link';
                $button['url'] = trim((string)($row['url'] ?? ''));
                $button['style'] = ($row['style'] ?? 'default') === 'accent' ? 'accent' : 'default';
                $button['enabled'] = isset($row['enabled']);
            } unset($button);

            if ($p = upload_image('main_logo', 'logo-main')) $data['brand']['mainLogo'] = $p;
            if ($p = upload_image('circular_logo', 'logo-circular')) $data['brand']['circularLogo'] = $p;
            if ($p = upload_image('favicon', 'favicon')) $data['brand']['favicon'] = $p;
            if ($p = upload_image('catalog_cover', 'cover-catalog')) $data['covers']['catalog'] = $p;
            if ($p = upload_image('combos_cover', 'cover-combos')) $data['covers']['combos'] = $p;
            save_site($data); redirect_admin('general');
        }

        if ($action === 'add_button') {
            $data['homeButtons'][] = ['id'=>uid('btn'),'eyebrow'=>'Nuevo enlace','title'=>'NUEVO BOTÓN','icon'=>'bi-link-45deg','type'=>'link','url'=>'#','style'=>'default','enabled'=>true];
            save_site($data); redirect_admin('buttons');
        }
        if ($action === 'delete_button') {
            $id = (string)($_POST['id'] ?? '');
            $data['homeButtons'] = array_values(array_filter($data['homeButtons'], fn($x)=>($x['id'] ?? '') !== $id));
            save_site($data); redirect_admin('buttons');
        }

        if ($action === 'add_combo') {
            $data['combos'][] = ['id'=>uid('combo'),'name'=>'Nuevo combo','description'=>'','price'=>'','image'=>'','badgeText'=>'','badgeColor'=>'#850D32','enabled'=>true];
            save_site($data); redirect_admin('combos');
        }
        if ($action === 'save_combo') {
            $id = (string)($_POST['id'] ?? '');
            foreach ($data['combos'] as &$item) if (($item['id'] ?? '') === $id) {
                $item['name'] = trim((string)($_POST['name'] ?? ''));
                $item['description'] = trim((string)($_POST['description'] ?? ''));
                $item['price'] = trim((string)($_POST['price'] ?? ''));
                $item['badgeText'] = trim((string)($_POST['badge_text'] ?? ''));
                $item['badgeColor'] = preg_match('/^#[0-9a-f]{6}$/i', (string)($_POST['badge_color'] ?? '')) ? (string)$_POST['badge_color'] : '#850D32';
                $item['enabled'] = bool_post('enabled');
                if ($p = upload_image('image', 'combo')) $item['image'] = $p;
                break;
            } unset($item);
            save_site($data); redirect_admin('combos');
        }
        if ($action === 'delete_combo') {
            $id=(string)($_POST['id'] ?? ''); $data['combos']=array_values(array_filter($data['combos'],fn($x)=>($x['id']??'')!==$id)); save_site($data); redirect_admin('combos');
        }

        if ($action === 'add_service') {
            $data['services'][] = ['id'=>uid('service'),'name'=>'Nuevo servicio','description'=>'','price'=>'','image'=>'','enabled'=>true];
            save_site($data); redirect_admin('services');
        }
        if ($action === 'save_service') {
            $id = (string)($_POST['id'] ?? '');
            foreach ($data['services'] as &$item) if (($item['id'] ?? '') === $id) {
                $item['name'] = trim((string)($_POST['name'] ?? ''));
                $item['description'] = trim((string)($_POST['description'] ?? ''));
                $item['price'] = trim((string)($_POST['price'] ?? ''));
                $item['enabled'] = bool_post('enabled');
                if ($p = upload_image('image', 'service')) $item['image'] = $p;
                break;
            } unset($item);
            save_site($data); redirect_admin('services');
        }
        if ($action === 'delete_service') {
            $id=(string)($_POST['id'] ?? ''); $data['services']=array_values(array_filter($data['services'],fn($x)=>($x['id']??'')!==$id)); save_site($data); redirect_admin('services');
        }
    } catch (Throwable $e) { $error = $e->getMessage(); }
    $data = load_site();
}

$csrf = csrf_token();
function img_url(string $path): string { return '../' . ltrim($path, '/'); }
?>
<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Panel administrativo | Gisel Studio</title><link rel="stylesheet" href="admin.css"></head>
<body><div class="admin-shell">
<header class="admin-header"><div><h1>Gisel Studio · Panel administrativo</h1><div>Contenido, enlaces, productos e imágenes</div></div><div><a href="../index.html" target="_blank">Ver web</a> · <a href="?logout=1">Salir</a></div></header>
<nav class="admin-nav"><a href="#general">General</a><a href="#buttons">Botones</a><a href="#combos">Combos</a><a href="#services">Servicios</a></nav>
<?php if($error): ?><div class="status status-error"><?=h($error)?></div><?php endif; ?>

<section class="panel" id="general"><h2>Configuración general</h2>
<form method="post" enctype="multipart/form-data"><input type="hidden" name="csrf" value="<?=h($csrf)?>"><input type="hidden" name="action" value="save_general">
<div class="grid"><div class="field"><label>Nombre de la marca</label><input name="brand_name" value="<?=h($data['brand']['name']??'')?>"></div><div class="field"><label>Ciudad</label><input name="brand_city" value="<?=h($data['brand']['city']??'')?>"></div></div>
<h3>WhatsApp único para toda la web</h3><div class="grid"><div class="field"><label>Número con código de país</label><input name="wa_number" value="<?=h($data['whatsapp']['number']??'')?>" placeholder="5493764359994"></div><div></div><div class="field full"><label>Mensaje general</label><textarea name="wa_general"><?=h($data['whatsapp']['general']??'')?></textarea></div><div class="field"><label>Mensaje para servicios · usá {name}</label><textarea name="wa_catalog"><?=h($data['whatsapp']['catalog']??'')?></textarea></div><div class="field"><label>Mensaje para combos · usá {name}</label><textarea name="wa_combo"><?=h($data['whatsapp']['combo']??'')?></textarea></div></div>
<h3>Redes y ubicación</h3><div class="grid">
<?php foreach($data['socials'] as $s): $sid=$s['id']; ?><div class="item-card"><strong><?=h($s['label']??$sid)?></strong><div class="field" style="margin-top:8px"><input name="social_url[<?=h($sid)?>]" value="<?=h($s['url']??'')?>" placeholder="https://..."></div><label class="check" style="margin-top:8px"><input type="checkbox" name="social_enabled[<?=h($sid)?>]" <?=!empty($s['enabled'])?'checked':''?>> Mostrar</label></div><?php endforeach; ?></div>
<h3>Logo, favicon y portadas</h3><div class="grid-3"><div class="field"><label>Logo principal</label><input type="file" name="main_logo" accept="image/*"><small class="muted">Se usa en Inicio.</small></div><div class="field"><label>Logo circular</label><input type="file" name="circular_logo" accept="image/*"><small class="muted">Se usa en pies de página.</small></div><div class="field"><label>Favicon</label><input type="file" name="favicon" accept="image/*"></div><div class="field"><label>Portada Catálogo</label><input type="file" name="catalog_cover" accept="image/*"></div><div class="field"><label>Portada Combos</label><input type="file" name="combos_cover" accept="image/*"></div></div>
<h3>Textos finales</h3><div class="grid"><div class="field"><label>Título final Catálogo</label><input name="catalog_footer_title" value="<?=h($data['footer']['catalogTitle']??'')?>"></div><div class="field"><label>Texto final Catálogo</label><textarea name="catalog_footer_text"><?=h($data['footer']['catalogText']??'')?></textarea></div><div class="field"><label>Título final Combos</label><input name="combos_footer_title" value="<?=h($data['footer']['combosTitle']??'')?>"></div><div class="field"><label>Texto final Combos</label><textarea name="combos_footer_text"><?=h($data['footer']['combosText']??'')?></textarea></div></div>

<h3 id="buttons">Botones de la página principal</h3>
<?php foreach($data['homeButtons'] as $b): $bid=$b['id']; ?><div class="item-card"><div class="grid-3"><div class="field"><label>Texto pequeño</label><input name="button[<?=h($bid)?>][eyebrow]" value="<?=h($b['eyebrow']??'')?>"></div><div class="field"><label>Título</label><input name="button[<?=h($bid)?>][title]" value="<?=h($b['title']??'')?>"></div><div class="field"><label>Ícono Bootstrap</label><input name="button[<?=h($bid)?>][icon]" value="<?=h($b['icon']??'bi-link-45deg')?>"></div><div class="field"><label>Tipo</label><select name="button[<?=h($bid)?>][type]"><option value="link" <?=($b['type']??'')==='link'?'selected':''?>>Enlace</option><option value="whatsapp" <?=($b['type']??'')==='whatsapp'?'selected':''?>>WhatsApp</option></select></div><div class="field"><label>URL</label><input name="button[<?=h($bid)?>][url]" value="<?=h($b['url']??'')?>"></div><div class="field"><label>Estilo</label><select name="button[<?=h($bid)?>][style]"><option value="default" <?=($b['style']??'')==='default'?'selected':''?>>Claro</option><option value="accent" <?=($b['style']??'')==='accent'?'selected':''?>>Bordó</option></select></div></div><label class="check" style="margin-top:10px"><input type="checkbox" name="button[<?=h($bid)?>][enabled]" <?=!empty($b['enabled'])?'checked':''?>> Mostrar botón</label></div><?php endforeach; ?>
<div class="actions-row"><button class="btn btn-primary">Guardar configuración</button></div></form>
<form method="post" style="margin-top:10px"><input type="hidden" name="csrf" value="<?=h($csrf)?>"><input type="hidden" name="action" value="add_button"><button class="btn btn-light">+ Agregar otro botón</button></form>
<?php if(count($data['homeButtons'])>3): ?><div style="margin-top:12px"><strong>Eliminar botones extra:</strong><?php foreach(array_slice($data['homeButtons'],3) as $b): ?><form method="post" style="display:inline-block;margin:6px"><input type="hidden" name="csrf" value="<?=h($csrf)?>"><input type="hidden" name="action" value="delete_button"><input type="hidden" name="id" value="<?=h($b['id'])?>"><button class="btn btn-danger" onclick="return confirm('¿Eliminar este botón?')">Eliminar <?=h($b['title']??'botón')?></button></form><?php endforeach; ?></div><?php endif; ?>
</section>

<section class="panel" id="combos"><h2>Combos especiales</h2><p class="muted">Cada combo puede llevar imagen, nombre, descripción, precio y un badge opcional con texto y color personalizado.</p>
<form method="post"><input type="hidden" name="csrf" value="<?=h($csrf)?>"><input type="hidden" name="action" value="add_combo"><button class="btn btn-primary">+ Agregar combo</button></form>
<?php foreach($data['combos'] as $item): ?><div class="item-card"><form method="post" enctype="multipart/form-data"><input type="hidden" name="csrf" value="<?=h($csrf)?>"><input type="hidden" name="action" value="save_combo"><input type="hidden" name="id" value="<?=h($item['id'])?>"><?php if(!empty($item['image'])): ?><img src="<?=h(img_url($item['image']))?>" alt=""><?php endif; ?><div class="grid"><div class="field"><label>Nombre</label><input name="name" value="<?=h($item['name']??'')?>" required></div><div class="field"><label>Precio</label><input name="price" value="<?=h($item['price']??'')?>" placeholder="$ 15.000 o Consultar"></div><div class="field full"><label>Descripción</label><textarea name="description"><?=h($item['description']??'')?></textarea></div><div class="field"><label>Imagen</label><input type="file" name="image" accept="image/*"></div><div class="field"><label>Texto del badge (opcional)</label><input name="badge_text" value="<?=h($item['badgeText']??'')?>" placeholder="Más vendido"></div><div class="field"><label>Color del badge</label><input type="color" name="badge_color" value="<?=h($item['badgeColor']??'#850D32')?>"></div></div><label class="check" style="margin-top:10px"><input type="checkbox" name="enabled" value="1" <?=!empty($item['enabled'])?'checked':''?>> Publicado</label><div class="actions-row"><button class="btn btn-primary">Guardar combo</button></div></form><form method="post"><input type="hidden" name="csrf" value="<?=h($csrf)?>"><input type="hidden" name="action" value="delete_combo"><input type="hidden" name="id" value="<?=h($item['id'])?>"><button class="btn btn-danger" onclick="return confirm('¿Eliminar este combo?')">Eliminar</button></form></div><?php endforeach; ?>
</section>

<section class="panel" id="services"><h2>Catálogo de servicios</h2><p class="muted">El precio es opcional. Si lo dejás vacío, la tarjeta se muestra sin precio.</p>
<form method="post"><input type="hidden" name="csrf" value="<?=h($csrf)?>"><input type="hidden" name="action" value="add_service"><button class="btn btn-primary">+ Agregar servicio</button></form>
<?php foreach($data['services'] as $item): ?><div class="item-card"><form method="post" enctype="multipart/form-data"><input type="hidden" name="csrf" value="<?=h($csrf)?>"><input type="hidden" name="action" value="save_service"><input type="hidden" name="id" value="<?=h($item['id'])?>"><?php if(!empty($item['image'])): ?><img src="<?=h(img_url($item['image']))?>" alt=""><?php endif; ?><div class="grid"><div class="field"><label>Nombre</label><input name="name" value="<?=h($item['name']??'')?>" required></div><div class="field"><label>Precio (opcional)</label><input name="price" value="<?=h($item['price']??'')?>"></div><div class="field full"><label>Descripción</label><textarea name="description"><?=h($item['description']??'')?></textarea></div><div class="field"><label>Foto</label><input type="file" name="image" accept="image/*"></div></div><label class="check" style="margin-top:10px"><input type="checkbox" name="enabled" value="1" <?=!empty($item['enabled'])?'checked':''?>> Publicado</label><div class="actions-row"><button class="btn btn-primary">Guardar servicio</button></div></form><form method="post"><input type="hidden" name="csrf" value="<?=h($csrf)?>"><input type="hidden" name="action" value="delete_service"><input type="hidden" name="id" value="<?=h($item['id'])?>"><button class="btn btn-danger" onclick="return confirm('¿Eliminar este servicio?')">Eliminar</button></form></div><?php endforeach; ?>
</section>
</div></body></html>

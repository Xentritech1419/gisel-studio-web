(() => {
  'use strict';
  const body = document.body;
  const base = body.dataset.base || '.';
  const page = body.dataset.page || 'home';

  const esc = (value = '') => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const cleanDigits = value => String(value || '').replace(/\D/g, '');
  const colorSafe = value => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : '#850D32';
  const iconSafe = value => /^bi-[a-z0-9-]+$/i.test(String(value || '')) ? value : 'bi-link-45deg';

  function assetUrl(path) {
    if (!path) return '';
    if (/^(https?:|data:|blob:)/i.test(path)) return path;
    return `${base}/${String(path).replace(/^\.\//,'').replace(/^\//,'')}`;
  }

  function linkUrl(path) {
    if (!path) return '#';
    if (/^(https?:|mailto:|tel:|#)/i.test(path)) return path;
    return `${base}/${String(path).replace(/^\.\//,'').replace(/^\//,'')}`;
  }

  function waLink(config, message) {
    const number = cleanDigits(config?.whatsapp?.number);
    return number ? `https://wa.me/${number}?text=${encodeURIComponent(message || '')}` : '#';
  }

  function formatMessage(template, name) {
    return String(template || '').replaceAll('{name}', name || '');
  }

  function setImage(id, path) {
    const el = document.getElementById(id);
    if (el && path) el.src = assetUrl(path);
  }

  function applyBrand(config) {
    const brand = config.brand || {};
    const fav = document.getElementById('site-favicon');
    if (fav && brand.favicon) fav.href = assetUrl(brand.favicon);
    setImage('top-logo', brand.circularLogo || brand.mainLogo);
    setImage('home-logo', brand.mainLogo || brand.circularLogo);
    setImage('footer-round-logo', brand.circularLogo || brand.mainLogo);
    setImage('catalog-footer-logo', brand.circularLogo || brand.mainLogo);
    setImage('combos-footer-logo', brand.circularLogo || brand.mainLogo);
    const fb = document.getElementById('footer-brand');
    const fc = document.getElementById('footer-city');
    if (fb) fb.textContent = brand.name || 'Gisel Studio de Belleza';
    if (fc) fc.textContent = brand.city || '';
  }

  function renderHome(config) {
    const socials = document.getElementById('socials');
    if (socials) {
      socials.innerHTML = '';
      (config.socials || []).filter(x => x.enabled && x.url).forEach(item => {
        const a = document.createElement('a');
        a.className = 'social';
        a.href = item.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', item.label || item.id || 'Red social');
        const i = document.createElement('i');
        i.className = `bi ${iconSafe(item.icon)}`;
        a.appendChild(i);
        socials.appendChild(a);
      });
    }

    const actions = document.getElementById('home-actions');
    if (actions) {
      actions.innerHTML = '';
      const homeItems = (config.homeButtons || []).filter(x => x.enabled);
      const order = {combos: 1, catalogo: 2, whatsapp: 3};
      homeItems.sort((a,b) => (order[a.id] || 50) - (order[b.id] || 50));
      homeItems.forEach(item => {
        const a = document.createElement('a');
        a.className = `action-card${item.style === 'accent' ? ' action-card--accent' : ''}`;
        const isWa = item.type === 'whatsapp';
        a.href = isWa ? waLink(config, config.whatsapp?.general || '') : linkUrl(item.url);
        if (isWa || /^(https?:)/i.test(item.url || '')) { a.target = '_blank'; a.rel = 'noopener'; }
        let eyebrow = item.eyebrow || '';
        let title = item.title || '';
        if (item.id === 'combos' && eyebrow === 'Descubrí nuestros') eyebrow = 'Elegí el que más va con vos';
        if (item.id === 'catalogo') {
          if (eyebrow === 'Conocé nuestro') eyebrow = 'Descubrí todos nuestros servicios';
          if (title === 'CATÁLOGO') title = 'CATÁLOGO DE SERVICIOS';
        }
        if (item.id === 'whatsapp' && eyebrow === 'Escribinos por') eyebrow = 'Consultas y turnos';
        a.innerHTML = `
          <span class="action-icon" aria-hidden="true"><i class="bi ${iconSafe(item.icon)}"></i></span>
          <span class="action-copy"><small>${esc(eyebrow)}</small><strong>${esc(title)}</strong></span>
          <span class="action-arrow" aria-hidden="true"><i class="bi bi-chevron-right"></i></span>`;
        actions.appendChild(a);
      });
    }
  }

  function productCard(item, kind, config) {
    const article = document.createElement('article');
    article.className = 'product-card';
    const image = item.image ? `<div class="product-image-wrap"><img class="product-image" src="${esc(assetUrl(item.image))}" alt="${esc(item.name || '')}" loading="lazy"></div>` : '';
    const badge = item.badgeText ? `<span class="product-badge" style="--badge:${colorSafe(item.badgeColor)}">${esc(item.badgeText)}</span>` : '';
    const price = item.price ? `<div class="product-price">${esc(item.price)}</div>` : '';
    const template = kind === 'combo' ? config.whatsapp?.combo : config.whatsapp?.catalog;
    const message = formatMessage(template, item.name || '');
    article.innerHTML = `
      ${image}
      ${badge}
      <div class="product-copy">
        <h2>${esc(item.name || '')}</h2>
        ${price}
        <p>${esc(item.description || '')}</p>
        <a class="btn btn-primary" href="${esc(waLink(config, message))}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Consultar por WhatsApp</a>
      </div>`;
    return article;
  }

  function renderCatalog(config) {
    setImage('catalog-cover', config.covers?.catalog);
    const grid = document.getElementById('services-grid');
    const empty = document.getElementById('services-empty');
    const items = (config.services || []).filter(x => x.enabled !== false);
    if (grid) {
      grid.innerHTML = '';
      items.forEach(item => grid.appendChild(productCard(item, 'service', config)));
    }
    if (empty) empty.hidden = items.length > 0;
    const general = waLink(config, config.whatsapp?.general || '');
    ['top-whatsapp','catalog-footer-wa'].forEach(id => { const a=document.getElementById(id); if(a) a.href=general; });
    const title = document.getElementById('catalog-footer-title');
    const text = document.getElementById('catalog-footer-text');
    if (title) title.textContent = config.footer?.catalogTitle || '';
    if (text) text.textContent = config.footer?.catalogText || '';
  }

  function renderCombos(config) {
    setImage('combos-cover', config.covers?.combos);
    const grid = document.getElementById('combos-grid');
    const empty = document.getElementById('combos-empty');
    const items = (config.combos || []).filter(x => x.enabled !== false);
    if (grid) {
      grid.innerHTML = '';
      items.forEach(item => grid.appendChild(productCard(item, 'combo', config)));
    }
    if (empty) empty.hidden = items.length > 0;
    const general = waLink(config, config.whatsapp?.general || '');
    ['top-whatsapp','combos-footer-wa'].forEach(id => { const a=document.getElementById(id); if(a) a.href=general; });
    const title = document.getElementById('combos-footer-title');
    const text = document.getElementById('combos-footer-text');
    if (title) title.textContent = config.footer?.combosTitle || '';
    if (text) text.textContent = config.footer?.combosText || '';
  }

  async function load() {
    try {
      const response = await fetch(`${base}/api/content.php?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar la configuración');
      const config = await response.json();
      applyBrand(config);
      if (page === 'home') renderHome(config);
      if (page === 'catalog') renderCatalog(config);
      if (page === 'combos') renderCombos(config);
    } catch (error) {
      console.error(error);
    }
  }
  load();
})();

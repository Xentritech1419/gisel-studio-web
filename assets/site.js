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

  async function loadHomeArtwork() {
    const img = document.getElementById('poster-art');
    if (!img) return;

    const version = '20261029-art-v2';
    const urls = [1,2,3,4].map(n => `${base}/assets/home-art-${n}.txt?v=${version}`);
    const parts = await Promise.all(urls.map(async url => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el diseño del home');
      return (await response.text()).replace(/\s+/g, '');
    }));

    const dataUrl = `data:image/webp;base64,${parts.join('')}`;
    await new Promise((resolve, reject) => {
      img.onload = () => { img.classList.add('is-loaded'); resolve(); };
      img.onerror = () => reject(new Error('No se pudo reconstruir el diseño del home'));
      img.src = dataUrl;
    });
  }

  function renderHome(config) {
    const socials = document.getElementById('socials');
    if (socials) {
      socials.innerHTML = '';
      const allowedSocials = new Set(['instagram','facebook','maps']);
      (config.socials || [])
        .filter(item => allowedSocials.has(item.id) && item.enabled && item.url)
        .forEach(item => {
          const a = document.createElement('a');
          a.className = `social social--${item.id}`;
          a.href = item.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.setAttribute('aria-label', item.label || item.id || 'Red social');
          const label = document.createElement('span');
          label.className = 'sr-only';
          label.textContent = item.label || item.id || 'Red social';
          a.appendChild(label);
          socials.appendChild(a);
        });

      const maps = (config.socials || []).find(item => item.id === 'maps' && item.enabled && item.url);
      const bottomMap = document.getElementById('bottom-map-hotspot');
      if (bottomMap) {
        if (maps) {
          bottomMap.href = maps.url;
          bottomMap.hidden = false;
        } else {
          bottomMap.hidden = true;
        }
      }
    }

    const actions = document.getElementById('home-actions');
    if (actions) {
      actions.innerHTML = '';
      const allowedButtons = ['combos','catalogo','whatsapp'];
      const byId = new Map((config.homeButtons || []).filter(x => x.enabled).map(x => [x.id, x]));

      allowedButtons.forEach(id => {
        const item = byId.get(id);
        if (!item) return;

        const a = document.createElement('a');
        a.className = `action-card action-card--${id}`;
        const isWa = item.type === 'whatsapp' || id === 'whatsapp';
        a.href = isWa ? waLink(config, config.whatsapp?.general || '') : linkUrl(item.url);
        if (isWa || /^(https?:)/i.test(item.url || '')) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
        a.setAttribute('aria-label', [item.title, item.eyebrow].filter(Boolean).join(' — '));

        const label = document.createElement('span');
        label.className = 'sr-only';
        label.textContent = [item.title, item.eyebrow].filter(Boolean).join(' — ');
        a.appendChild(label);
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
    const artworkPromise = page === 'home' ? loadHomeArtwork() : Promise.resolve();
    try {
      const response = await fetch(`${base}/api/content.php?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar la configuración');
      const config = await response.json();
      applyBrand(config);
      if (page === 'home') {
        await artworkPromise;
        renderHome(config);
      }
      if (page === 'catalog') renderCatalog(config);
      if (page === 'combos') renderCombos(config);
    } catch (error) {
      console.error(error);
    }
  }
  load();
})();

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

    const version = '20261030-home-v6';
    const fragmentNames = Array.from({ length: 13 }, (_, i) => String(i + 1).padStart(2, '0'));
    const urls = fragmentNames.map(name => `${base}/assets/home-v6-${name}.txt?v=${version}`);
    const fragmentTexts = await Promise.all(urls.map(async url => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar el fondo del home');
      return (await response.text()).replace(/\s+/g, '');
    }));

    const dataUrl = `data:image/webp;base64,${fragmentTexts.join('')}`;
    await new Promise((resolve, reject) => {
      img.onload = () => { img.classList.add('is-loaded'); resolve(); };
      img.onerror = () => reject(new Error('No se pudo reconstruir el fondo del home'));
      img.src = dataUrl;
    });
  }

  function homeIcon(id) {
    const icons = {
      instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>',
      facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 21v-8h2.8l.4-3h-3.2V8.1c0-.9.3-1.5 1.6-1.5H17V4a22 22 0 0 0-2.4-.2c-2.4 0-4 1.4-4 4.1V10H8v3h2.6v8h3.1z"/></svg>',
      tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.6 3c.4 2.3 1.7 3.8 4.1 4.2v3.2a8.7 8.7 0 0 1-4.1-1.2v6.1a5.8 5.8 0 1 1-5-5.7v3.3a2.6 2.6 0 1 0 1.8 2.4V3h3.2z"/></svg>',
      maps: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-6.4 6-12A6 6 0 0 0 6 9c0 5.6 6 12 6 12z"/><circle cx="12" cy="9" r="2.2"/></svg>',
      combos: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17c2.2-5 3.9-8.2 5-9.5.8-1 1.6-.5 1.4.6l-1 4.2 2.5-5.9c.5-1.1 1.5-.8 1.3.4l-1 5.1 2.4-5c.5-1 1.4-.7 1.2.4l-1 5.3 2-3.5c.6-1 1.4-.4 1 .7l-2.1 6.4c-.8 2.5-2.3 3.8-4.7 4.3-3.5.7-6.7-.7-7-3.5z"/></svg>',
      catalogo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20c-3-2.1-4.7-4.2-5-6.4 2.4-.1 4.2.6 5 2.2.8-1.6 2.6-2.3 5-2.2-.3 2.2-2 4.3-5 6.4z"/><path d="M12 15.8c-2.1-2.3-2.8-4.7-2-7.2 1.3.5 2.2 1.4 2 2.8-.2-1.4.7-2.3 2-2.8.8 2.5.1 4.9-2 7.2z"/><path d="M7 13.6c-2.2-.3-3.7-1.3-4.6-3 2.6-.7 4.7 0 6.1 2"/><path d="M17 13.6c2.2-.3 3.7-1.3 4.6-3-2.6-.7-4.7 0-6.1 2"/></svg>',
      whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.6a8 8 0 0 1-11.8 7l-4.2 1.1 1.1-4A8 8 0 1 1 20 11.6z"/><path d="M8.7 7.8c.4-.4.9-.3 1.1.2l.8 1.8c.2.4.1.7-.2 1l-.6.6c.8 1.7 2 2.8 3.6 3.6l.7-.7c.3-.3.6-.4 1-.2l1.7.8c.5.2.6.7.3 1.1-.7.9-1.7 1.3-2.9 1-3.8-.8-6.5-3.5-7.3-7.3-.3-1.1.2-2.2 1.8-1.9z"/></svg>'
    };
    return icons[id] || icons.catalogo;
  }

  function renderHome(config) {
    const socials = document.getElementById('socials');
    const socialOrder = ['instagram','facebook','tiktok','maps'];
    if (socials) {
      socials.innerHTML = '';
      const byId = new Map((config.socials || []).map(item => [item.id, item]));
      socialOrder.forEach(id => {
        const item = byId.get(id) || { id, label: id === 'maps' ? 'Ubicación' : id, url: '', enabled: false };
        const active = !!(item.enabled && item.url);
        const a = document.createElement('a');
        a.className = `social social--${id}${active ? '' : ' is-disabled'}`;
        a.href = active ? item.url : '#';
        a.setAttribute('aria-label', item.label || id);
        if (active) {
          a.target = '_blank';
          a.rel = 'noopener';
        } else {
          a.setAttribute('aria-disabled','true');
          a.addEventListener('click', event => event.preventDefault());
        }
        a.innerHTML = homeIcon(id) + `<span class="sr-only">${esc(item.label || id)}</span>`;
        socials.appendChild(a);
      });

      const maps = byId.get('maps');
      const bottomMap = document.getElementById('bottom-map-hotspot');
      if (bottomMap) {
        const activeMap = !!(maps && maps.enabled && maps.url);
        bottomMap.href = activeMap ? maps.url : '#';
        bottomMap.hidden = !activeMap;
      }
    }

    const actions = document.getElementById('home-actions');
    if (actions) {
      actions.innerHTML = '';
      const allowedButtons = ['combos','catalogo','whatsapp'];
      const defaults = {
        combos: {title:'COMBOS ESPECIALES',eyebrow:'Elegí el que más va con vos',url:'landings/combos-promos.html',type:'link'},
        catalogo: {title:'CATÁLOGO DE SERVICIOS',eyebrow:'Descubrí todos nuestros servicios',url:'landings/catalogo-servicios.html',type:'link'},
        whatsapp: {title:'WHATSAPP',eyebrow:'Consultas y turnos',url:'',type:'whatsapp'}
      };
      const byId = new Map((config.homeButtons || []).map(x => [x.id, x]));

      allowedButtons.forEach(id => {
        const item = { ...defaults[id], ...(byId.get(id) || {}) };
        if (item.enabled === false) return;
        const a = document.createElement('a');
        a.className = `action-card action-card--${id}`;
        const isWa = item.type === 'whatsapp' || id === 'whatsapp';
        a.href = isWa ? waLink(config, config.whatsapp?.general || '') : linkUrl(item.url);
        if (isWa || /^(https?:)/i.test(item.url || '')) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
        a.setAttribute('aria-label', [item.title, item.eyebrow].filter(Boolean).join(' — '));
        a.innerHTML = `
          <span class="action-icon">${homeIcon(id)}</span>
          <span class="action-copy">
            <span class="action-title">${esc(item.title || '')}</span>
            <span class="action-eyebrow">${esc(item.eyebrow || '')}</span>
          </span>
          <span class="action-arrow" aria-hidden="true"></span>`;
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

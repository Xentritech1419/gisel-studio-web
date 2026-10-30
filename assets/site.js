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

  const homeLayerArt = {};

  async function readPosterFragments(prefix, count, version) {
    const names = Array.from({length:count}, (_,i)=>String(i+1).padStart(2,'0'));
    const parts = await Promise.all(names.map(async name => {
      const response = await fetch(`${base}/assets/${prefix}-${name}.txt?v=${version}`, {cache:'no-store'});
      if (!response.ok) throw new Error('No se pudo cargar el arte del home');
      return (await response.text()).replace(/\s+/g,'');
    }));
    return `data:image/webp;base64,${parts.join('')}`;
  }

  function imageFromDataUrl(dataUrl) {
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error('No se pudo decodificar el arte del home'));
      img.src=dataUrl;
    });
  }

  function roundedRectPath(ctx,x,y,w,h,r) {
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    ctx.closePath();
  }

  function cropPoster(source, box, shape='round') {
    const [x1,y1,x2,y2]=box;
    const sx=x1/1024*source.naturalWidth;
    const sy=y1/1536*source.naturalHeight;
    const sw=(x2-x1)/1024*source.naturalWidth;
    const sh=(y2-y1)/1536*source.naturalHeight;
    const outW=Math.max(2,Math.round(sw*2));
    const outH=Math.max(2,Math.round(sh*2));
    const canvas=document.createElement('canvas');
    canvas.width=outW; canvas.height=outH;
    const ctx=canvas.getContext('2d');
    ctx.save();
    if(shape==='circle'){
      ctx.beginPath();
      ctx.arc(outW/2,outH/2,Math.min(outW,outH)/2-1,0,Math.PI*2);
      ctx.clip();
    }else{
      roundedRectPath(ctx,1,1,outW-2,outH-2,outH*.48);
      ctx.clip();
    }
    ctx.drawImage(source,sx,sy,sw,sh,0,0,outW,outH);
    ctx.restore();
    return canvas.toDataURL('image/webp',.94);
  }

  function createTikTokArt(size=180) {
    const canvas=document.createElement('canvas');
    canvas.width=size; canvas.height=size;
    const ctx=canvas.getContext('2d');
    const g=ctx.createLinearGradient(size*.18,size*.12,size*.84,size*.9);
    g.addColorStop(0,'#f2b29b');
    g.addColorStop(.42,'#ce6c59');
    g.addColorStop(1,'#983144');
    ctx.beginPath();
    ctx.arc(size/2,size/2,size*.48,0,Math.PI*2);
    ctx.fillStyle=g; ctx.fill();
    ctx.lineWidth=size*.025;
    ctx.strokeStyle='rgba(255,224,205,.95)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size/2,size/2,size*.43,0,Math.PI*2);
    ctx.lineWidth=size*.012;
    ctx.strokeStyle='rgba(255,247,239,.55)';
    ctx.stroke();

    ctx.strokeStyle='#fff8f3';
    ctx.fillStyle='#fff8f3';
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.lineWidth=size*.09;
    ctx.beginPath();
    ctx.moveTo(size*.56,size*.30);
    ctx.lineTo(size*.56,size*.63);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size*.56,size*.31);
    ctx.quadraticCurveTo(size*.67,size*.40,size*.76,size*.40);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size*.43,size*.68,size*.16,0,Math.PI*2);
    ctx.stroke();
    return canvas.toDataURL('image/webp',.95);
  }

  async function loadHomeArtwork() {
    const img=document.getElementById('poster-art');
    if(!img) return;
    const dataUrl=await readPosterFragments('home-v6',13,'20261030-base-v6');
    await new Promise((resolve,reject)=>{
      img.onload=()=>{img.classList.add('is-loaded');resolve();};
      img.onerror=()=>reject(new Error('No se pudo reconstruir el fondo del home'));
      img.src=dataUrl;
    });
  }

  async function loadHomeLayerArt() {
    const sourceUrl=await readPosterFragments('home-v5',10,'20261029-original-v5');
    const source=await imageFromDataUrl(sourceUrl);
    homeLayerArt.combos=cropPoster(source,[157,892,867,1035]);
    homeLayerArt.catalogo=cropPoster(source,[157,1050,867,1194]);
    homeLayerArt.whatsapp=cropPoster(source,[157,1207,867,1352]);
    homeLayerArt.instagram=cropPoster(source,[346,792,434,880],'circle');
    homeLayerArt.facebook=cropPoster(source,[469,792,557,880],'circle');
    homeLayerArt.maps=cropPoster(source,[592,792,680,880],'circle');
    homeLayerArt.tiktok=createTikTokArt();
  }

  function renderHome(config) {
    const socials=document.getElementById('socials');
    const socialOrder=['instagram','facebook','tiktok','maps'];
    if(socials){
      socials.innerHTML='';
      const byId=new Map((config.socials||[]).map(item=>[item.id,item]));
      socialOrder.forEach(id=>{
        const item=byId.get(id)||{id,label:id==='maps'?'Ubicación':id,url:'',enabled:false};
        const active=!!(item.enabled&&item.url);
        const a=document.createElement('a');
        a.className=`social social--${id}${active?'':' is-disabled'}`;
        a.href=active?item.url:'#';
        a.setAttribute('aria-label',item.label||id);
        if(active){a.target='_blank';a.rel='noopener';}
        else{a.setAttribute('aria-disabled','true');a.addEventListener('click',e=>e.preventDefault());}
        const art=document.createElement('img');
        art.src=homeLayerArt[id]||'';
        art.alt='';
        a.appendChild(art);
        const label=document.createElement('span');
        label.className='sr-only';
        label.textContent=item.label||id;
        a.appendChild(label);
        socials.appendChild(a);
      });

      const maps=byId.get('maps');
      const bottomMap=document.getElementById('bottom-map-hotspot');
      if(bottomMap){
        const activeMap=!!(maps&&maps.enabled&&maps.url);
        bottomMap.href=activeMap?maps.url:'#';
        bottomMap.hidden=!activeMap;
      }
    }

    const actions=document.getElementById('home-actions');
    if(actions){
      actions.innerHTML='';
      const defaults={
        combos:{title:'COMBOS ESPECIALES',eyebrow:'Elegí el que más va con vos',url:'landings/combos-promos.html',type:'link'},
        catalogo:{title:'CATÁLOGO DE SERVICIOS',eyebrow:'Descubrí todos nuestros servicios',url:'landings/catalogo-servicios.html',type:'link'},
        whatsapp:{title:'WHATSAPP',eyebrow:'Consultas y turnos',url:'',type:'whatsapp'}
      };
      const byId=new Map((config.homeButtons||[]).map(x=>[x.id,x]));
      ['combos','catalogo','whatsapp'].forEach(id=>{
        const item={...defaults[id],...(byId.get(id)||{})};
        if(item.enabled===false)return;
        const a=document.createElement('a');
        a.className=`action-card action-card--${id}`;
        const isWa=item.type==='whatsapp'||id==='whatsapp';
        a.href=isWa?waLink(config,config.whatsapp?.general||''):linkUrl(item.url);
        if(isWa||/^(https?:)/i.test(item.url||'')){a.target='_blank';a.rel='noopener';}
        a.setAttribute('aria-label',[item.title,item.eyebrow].filter(Boolean).join(' — '));
        const art=document.createElement('img');
        art.src=homeLayerArt[id]||'';
        art.alt='';
        a.appendChild(art);
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
    const artworkPromise = page === 'home' ? Promise.all([loadHomeArtwork(), loadHomeLayerArt()]) : Promise.resolve();
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

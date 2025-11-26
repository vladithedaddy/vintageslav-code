(function () {
  if (!/\/shop(\/|$|[-\?])/i.test(location.pathname)) return;

  const WRAP_SELECTOR      = '.product-list';
  const LIST_CONTAINER_SEL = '.product-list-container';
  const ITEM_SELECTOR      = '.product-list-item';
  const LINK_SELECTOR      = '.product-list-item-link';
  const TITLE_SELECTOR     = '.product-list-item-title';
  const PRICE_SELECTOR     = '.product-list-item-price';
  const FALLBACK_CARD_LINK_SEL  = 'a[href*="/product"], a[href*="/shop/"], main a[aria-label]';
  const FALLBACK_TITLE_SELS     = ['.product-title', '.list-item-title', '[data-test="product-title"]', 'h2', 'h3'];
  const FALLBACK_PRICE_SELS     = ['[data-test="product-price"]', '.product-price', '.list-item-price', '.product-list-item-price'];

  const PDP_DESC_SELECTORS = [
    '.ProductItem-details .sqs-block-html',
    '.ProductItem-details .product-item-description',
    '[data-test="product-description"]',
    '.ProductItem-details-content',
    '.ProductItem-details-excerpt'
  ];

  const SIZE_TOKENS  = ['XS','S','M','L','XL','XXL','2XL','3XL'];
  const COLOR_TOKENS = ['BLACK','WHITE','GRAY','GREY','NAVY','BLUE','RED','GREEN','OLIVE','YELLOW','ORANGE','BROWN','TAN','BEIGE','CREAM','PURPLE','PINK','BURGUNDY','MAROON'];

  const TYPE_RULES = [
    {label:'TANK TOPS',              rx:[/TANK\b/i]},
    {label:'T-SHIRTS',               rx:[/T[\s-]?SHIRT/i,/\bTEE(S)?\b/i]},
    {label:"LONG SLEEVE'S",          rx:[/\bLONG\s*SLEEVE(S)?\b/i,/\bLS\s*TEE\b/i]},
    {label:'CREWNECKS',              rx:[/\bCREWNECK\b/i]},
    {label:'QUARTER-ZIPS',           rx:[/\b(QUARTER|1\/4)\s*ZIP\b/i, /\bQTR\s*ZIP\b/i]},
    {label:'HOODIES',                rx:[/\bHOODIE\b/i,/\bHOODED\b/i]},
    {label:'SWEATERS',               rx:[/\bSWEATER\b/i,/\bCARDIGAN\b/i]},
    {label:'ZIP UP',                 rx:[/\bZIP[\s-]?UP\b/i, /\bFULL[\s-]?ZIP\b/i]},
    {label:'VESTS',                  rx:[/\bVEST\b/i]},
    {label:'JACKETS',                rx:[/\bJACKET\b/i,/\bWINDBREAKER\b/i,/\bVARSITY\b/i,/\bFLEECE\b/i,/\bCOAT\b/i]},
    {label:'SWEATPANTS/TRACK PANTS', rx:[/\bTRACK\s*PANTS\b/i,/\bJOGGER(S)?\b/i,/\bSWEATPANT(S)?\b/i]},
    {label:'DRESSES',                rx:[/\bDRESS\b/i]},
    {label:'TOPS',                   rx:[/\bTOP\b/i]},
    {label:'SKIRTS',                 rx:[/\bSKIRT\b/i]},
    {label:'SHORTS',                 rx:[/\bSHORTS?\b/i]},
    {label:'JEANS',                  rx:[/\bJEAN(S)?\b/i,/\bDENIM\b/i]},
    {label:'PANTS',                  rx:[/\bPANT(S)?\b/i,/\bSLACKS\b/i]},
    {label:'SWEATPANTS',             rx:[/\bSWEATPANT(S)?\b/i]}
  ];

  const CACHE_MINUTES = 120;
  const now = () => Date.now();
  const cacheGet = k => {
    try {
      const r = localStorage.getItem(k);
      if (!r) return null;
      const o = JSON.parse(r);
      if (!o || now() - o.t > CACHE_MINUTES * 60 * 1000) return null;
      return o.v;
    } catch (e) {
      return null;
    }
  };
  const cacheSet = (k,v) => {
    try { localStorage.setItem(k, JSON.stringify({t:now(), v})); } catch(e){}
  };

  const ready = fn => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const waitForWrap = () => {
    const found = () => document.querySelector(WRAP_SELECTOR);
    const existing = found();
    if (existing) return Promise.resolve(existing);

    return new Promise(resolve => {
      const start = Date.now();
      const timeout = 10000;
      const iv = setInterval(() => {
        const el = found();
        if (el) {
          clearInterval(iv);
          resolve(el);
          return;
        }
        if (Date.now() - start > timeout) {
          clearInterval(iv);
          resolve(null);
        }
      }, 200);
    });
  };

  const $  = (s,ctx) => (ctx||document).querySelector(s);
  const $$ = (s,ctx) => Array.from((ctx||document).querySelectorAll(s));
  const absUrl = h => /^https?:\/\//i.test(h||'') ? h : (location.origin + (h||''));
  const priceFrom = n => {
    if (!n) return null;
    const m = (n.textContent||'').replace(/[, ]/g,'').match(/(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : null;
  };

  const log = (...args) => {
    try {
      if (window.VS_CONFIG && window.VS_CONFIG.debug) console.log('[VS Filters]', ...args);
    } catch(e){}
  };

  function lowestCommonAncestor(nodes){
    if (!nodes.length) return null;
    const paths = nodes.map(n => {
      const arr = [];
      let cur = n;
      while (cur){ arr.push(cur); cur = cur.parentElement; }
      return arr;
    });
    let lca = null;
    for (let depth = 0;; depth++){
      let cand = null;
      for (const p of paths){
        if (p.length <= depth) return lca;
        if (!cand) { cand = p[depth]; continue; }
        if (p[depth] !== cand) return lca;
      }
      lca = cand;
    }
  }

  function findFallbackCards(){
    const anchors = $$(FALLBACK_CARD_LINK_SEL, document).filter(a => {
      const href = a.getAttribute('href') || '';
      if (!/^https?:\/\//.test(href) && !href.startsWith('/')) return false;
      if (a.closest('header, nav, footer')) return false;
      if (!a.querySelector('img')) return false;
      return true;
    });
    if (!anchors.length) return { wrapEl:null, listContainer:null, items:[] };

    log('Found fallback product anchors:', anchors.length);

    const lca = anchors[0].closest('main') || lowestCommonAncestor(anchors) || document.body;
    return { wrapEl:lca, listContainer:lca, items:anchors };
  }

  function findTitle(node){
    for (const sel of [TITLE_SELECTOR, ...FALLBACK_TITLE_SELS]){
      const el = $(sel, node);
      if (el && el.textContent) return el.textContent.trim();
    }
    const txt = (node.textContent || '').trim();
    if (txt) return txt.split('\n').map(s => s.trim()).filter(Boolean)[0] || '';
    return '';
  }

  function findPrice(node){
    for (const sel of [PRICE_SELECTOR, ...FALLBACK_PRICE_SELS]){
      const el = $(sel, node);
      if (el) {
        const p = priceFrom(el);
        if (p !== null) return p;
      }
    }
    return priceFrom(node);
  }

  // Track views for PDPs (for "FEATURED" sort)
  (function trackViewsIfPDP(){
    const wrap = document.querySelector(WRAP_SELECTOR);
    if (wrap) return;
    try {
      const path = location.pathname;
      const key  = 'vs_views_' + path;
      const cur  = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      localStorage.setItem(key, String(cur + 1));
    } catch(e){}
  })();

  async function fetchPDP(url){
    const res = await fetch(url, { credentials:'same-origin' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();
    const doc  = new DOMParser().parseFromString(html, 'text/html');

    let desc = '';
    for (const sel of PDP_DESC_SELECTORS){
      const n = doc.querySelector(sel);
      if (n && (n.textContent||'').trim()){
        desc = n.textContent.trim();
        break;
      }
    }
    if (!desc){
      const meta = doc.querySelector('meta[name="description"]');
      if (meta && meta.content) desc = meta.content.trim();
    }
    return { desc };
  }

  function extractBullet(desc, label){
    const re = new RegExp(`(^|\\n)\\s*-?\\s*${label}\\s*[:\\-]\\s*([^\\n\\r]+)`, 'i');
    const m  = desc.match(re);
    return m ? (m[2]||'').trim() : null;
  }

  function normSizes(text){
    const U = (text||'').toUpperCase();
    const out = new Set();
    SIZE_TOKENS.forEach(S => {
      const re = new RegExp(`(^|[\\s\\-\\(\\),\\/])${S}([\\s\\)\\/,\\-]|$)`);
      if (re.test(U)) out.add(S);
    });
    if (/S\/M/.test(U)) { out.add('S'); out.add('M'); }
    if (/M\/L/.test(U)) { out.add('M'); out.add('L'); }
    if (/L\/XL/.test(U)) { out.add('L'); out.add('XL'); }
    return SIZE_TOKENS.filter(s => out.has(s));
  }

  const splitColors = v =>
    (v||'').toUpperCase()
      .split(/\s*(?:AND|&|\/|,|\+)\s*/g)
      .map(s => s.trim())
      .filter(Boolean)
      .map(c => c === 'GREY' ? 'GRAY' : c);

  function normColors(desc){
    const line = extractBullet(desc,'COLOR');
    let tokens = line ? splitColors(line) : [];
    const U = (desc||'').toUpperCase();
    COLOR_TOKENS.forEach(C => {
      const re = new RegExp(`(^|[\\s\\-\\(\\),\\/])${C}([\\s\\)\\/,\\-]|$)`);
      if (re.test(U)) tokens.push(C);
    });
    tokens = tokens.filter(c => COLOR_TOKENS.includes(c));
    return Array.from(new Set(tokens));
  }

  function extractBrandFromText(text){
    if (!text) return null;
    const re = /(BRAND(?:\s*\/\s*TEAM|\s*&\s*TEAM)?\s*[:\-]\s*)([^\n\r]+)/i;
    const m  = text.match(re);
    return m ? m[2].trim() : null;
  }

  function detectType(title, desc){
    const H = `${title}\n${desc}`.toUpperCase();
    for (const rule of TYPE_RULES){
      if (rule.rx.some(r => r.test(H))) return rule.label;
    }
    return null;
  }

  async function parsePDP(url, title, fallbackBrand){
    const key = 'vs_pdp_v13_' + url;
    const cached = cacheGet(key);
    if (cached) return cached;

    let desc = '';
    try { ({desc} = await fetchPDP(url)); } catch(e){}

    const sizeLine      = extractBullet(desc,'SIZE');
    const sizes         = normSizes(sizeLine || desc);
    const colors        = normColors(desc);
    const brandFromDesc = extractBrandFromText(desc);
    const brand         = brandFromDesc || fallbackBrand || null;
    const type          = detectType(title || '', desc || '');

    const out = { sizes, colors, brand, type };
    cacheSet(key, out);
    return out;
  }

  function getViewsForPath(urlStr){
    try {
      const u   = new URL(urlStr, location.origin);
      const key = 'vs_views_' + u.pathname;
      const v   = parseInt(localStorage.getItem(key) || '0', 10);
      return isNaN(v) ? 0 : v;
    } catch(e){
      return 0;
    }
  }

  async function collectAll(listContainer, items){
    const cards = items && items.length ? items : $$(ITEM_SELECTOR, listContainer);
    const data  = cards.map((el, index) => {
      const linkEl    = el.matches('a') ? el : $(LINK_SELECTOR, el) || $(FALLBACK_CARD_LINK_SEL, el);
      const href      = linkEl?.getAttribute('href') || '';
      const title     = findTitle(el);
      const url       = absUrl(href);
      const views     = getViewsForPath(url);
      const cardText  = el.textContent || '';
      const cardBrand = extractBrandFromText(cardText);

      return {
        el,
        id: el.getAttribute('data-product-id') || '',
        url,
        title,
        price: findPrice(el),
        sizes: [],
        colors: [],
        brands: [],
        type: null,
        searchText: '',
        _cardBrand: cardBrand,
        index,
        views
      };
    });

    let i = 0;
    const CONC = 8;

    async function worker(){
      while (i < data.length){
        const idx  = i++;
        const item = data[idx];
        try {
          const p = await parsePDP(item.url, item.title, item._cardBrand);
          item.sizes  = p.sizes  || [];
          item.colors = p.colors || [];
          item.brands = p.brand  ? [p.brand] : [];
          item.type   = p.type   || null;

          // Build search index text (title + brand + size + color + type)
          const parts = [
            item.title || '',
            ...(item.brands || []),
            ...(item.sizes  || []),
            ...(item.colors || []),
            item.type || ''
          ];
          item.searchText = parts.join(' ').toLowerCase();
        } catch(e){
          // fallback: at least index by title
          item.searchText = (item.title || '').toLowerCase();
        }
      }
    }

    await Promise.all(Array.from({length: Math.min(CONC, data.length)}, worker));
    return data;
  }

  function buildUI(wrapEl, listContainer, data){
    if (!wrapEl || !listContainer || !data.length || document.getElementById('vs-shop-filter')) return;

    const SZ = new Set(), BR = new Map(), CO = new Set(), TY = new Set();
    let minP = Infinity, maxP = 0;

    data.forEach(d => {
      d.sizes.forEach(s => SZ.add(s));
      d.brands.forEach(b => {
        const key = (b || '').toUpperCase();
        if (!key) return;
        if (!BR.has(key)) BR.set(key, b);
      });
      d.colors.forEach(c => CO.add(c));
      if (d.type) TY.add(d.type);
      if (typeof d.price === 'number'){
        minP = Math.min(minP, d.price);
        maxP = Math.max(maxP, d.price);
      }
    });

    if (!isFinite(minP)) minP = 0;
    if (!isFinite(maxP) || maxP < minP) maxP = minP;

    const sizesArr  = SIZE_TOKENS.filter(s => SZ.has(s));
    const brandsArr = Array.from(BR.values()).sort((a,b) => a.localeCompare(b));
    const colorsArr = Array.from(CO).sort((a,b) => a.localeCompare(b));
    const typesArr  = Array.from(TY).sort((a,b) => a.localeCompare(b));

    const bar = document.createElement('div');
    bar.id = 'vs-shop-filter';
    bar.className = 'vs-filter';
    bar.innerHTML = `
      <div class="vs-toolbar">
        <button class="vs-filter__toggle" type="button" aria-expanded="true">FILTER</button>
        <div class="vs-searchwrap">
          <input class="vs-search" type="search" placeholder="SEARCH PIECES" aria-label="Search products">
          <button class="vs-search-clear" type="button" aria-label="Clear search">×</button>
        </div>
      </div>
      <div class="vs-grid">
        <div class="vs-group">
          <button class="vs-head" type="button" aria-expanded="false">SIZE</button>
          <div class="vs-body" hidden>
            ${sizesArr.length ? sizesArr.map(s => `<button class="vs-chip" data-size="${s}">${s}</button>`).join('') : '<div class="vs-empty">NONE</div>'}
          </div>
        </div>
        <div class="vs-group">
          <button class="vs-head" type="button" aria-expanded="false">BRAND</button>
          <div class="vs-body" hidden>
            ${brandsArr.length ? brandsArr.map(b => `<button class="vs-chip" data-brand="${b}">${b}</button>`).join('') : '<div class="vs-empty">NONE</div>'}
          </div>
        </div>
        <div class="vs-group">
          <button class="vs-head" type="button" aria-expanded="false">COLOR</button>
          <div class="vs-body" hidden>
            ${colorsArr.length ? colorsArr.map(c => `<button class="vs-chip" data-color="${c}">${c}</button>`).join('') : '<div class="vs-empty">NONE</div>'}
          </div>
        </div>
        <div class="vs-group">
          <button class="vs-head" type="button" aria-expanded="false">TYPE</button>
          <div class="vs-body" hidden>
            ${typesArr.length ? typesArr.map(t => `<button class="vs-chip" data-type="${t}">${t}</button>`).join('') : '<div class="vs-empty">NONE</div>'}
          </div>
        </div>
        <div class="vs-group vs-pricegroup">
          <div class="vs-head is-static">PRICE RANGE</div>
          <div class="vs-body vs-price">
            <label>$</label><input class="vs-min" type="number" min="0" step="1" value="${Math.floor(minP)}">
            <span class="vs-sep">—</span>
            <label>$</label><input class="vs-max" type="number" min="0" step="1" value="${Math.ceil(maxP)}">
            <button class="vs-apply" type="button">APPLY</button>
            <button class="vs-clear" type="button">CLEAR</button>
          </div>
        </div>
      </div>
      <div class="vs-sortbar">
        <div class="vs-sort-wrap">
          <button class="vs-sort-toggle" type="button" aria-expanded="false">
            <span class="vs-sort-label">SORT BY:</span>
            <span class="vs-sort-current">NEWEST FIRST</span>
          </button>
          <div class="vs-sort-menu" hidden>
            <button class="vs-sort-option" data-sort="featured">FEATURED</button>
            <button class="vs-sort-option" data-sort="price-asc">PRICE: $-$$$</button>
            <button class="vs-sort-option" data-sort="price-desc">PRICE: $$$-$</button>
            <button class="vs-sort-option" data-sort="newest">NEWEST FIRST</button>
          </div>
        </div>
      </div>
      <div class="vs-panel" hidden></div>
    `;

    wrapEl.parentNode.insertBefore(bar, wrapEl);

    const btn   = bar.querySelector('.vs-filter__toggle');
    const grid  = bar.querySelector('.vs-grid');
    const sWrap = bar.querySelector('.vs-searchwrap');
    const sInput= bar.querySelector('.vs-search');
    const sClear= bar.querySelector('.vs-search-clear');

    // FILTER TOGGLE (open/close all dropdowns)
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      grid.querySelectorAll('.vs-head:not(.is-static)').forEach(h => {
        const body   = h.nextElementSibling;
        const isOpen = !body.hidden;
        if (expanded && isOpen){
          h.setAttribute('aria-expanded','false');
          body.hidden = true;
        }
        if (!expanded && body.hidden){
          h.setAttribute('aria-expanded','true');
          body.hidden = false;
        }
      });
    });

    // INDIVIDUAL DROPDOWN TOGGLES
    grid.querySelectorAll('.vs-head:not(.is-static)').forEach(head => {
      const body = head.nextElementSibling;
      head.addEventListener('click', () => {
        const ex = head.getAttribute('aria-expanded') === 'true';
        head.setAttribute('aria-expanded', String(!ex));
        body.hidden = ex;
      });
    });

    const state = {
      sizes:  new Set(),
      brands: new Set(),
      colors: new Set(),
      types:  new Set(),
      min:    Math.floor(minP),
      max:    Math.ceil(maxP),
      search: ''
    };

    const minI = grid.querySelector('.vs-min');
    const maxI = grid.querySelector('.vs-max');

    const hook = (attr,set) => btn =>
      btn.addEventListener('click', () => {
        btn.classList.toggle('is-active');
        const v = btn.getAttribute(attr);
        btn.classList.contains('is-active') ? set.add(v) : set.delete(v);
        apply();
      });

    grid.querySelectorAll('[data-size]').forEach(hook('data-size',  state.sizes));
    grid.querySelectorAll('[data-brand]').forEach(hook('data-brand', state.brands));
    grid.querySelectorAll('[data-color]').forEach(hook('data-color', state.colors));
    grid.querySelectorAll('[data-type]').forEach(hook('data-type',  state.types));

    // PRICE RANGE
    grid.querySelector('.vs-apply').addEventListener('click', () => {
      let min = parseFloat(minI.value) || 0;
      let max = parseFloat(maxI.value) || Infinity;
      if (min > max) [min,max] = [max,min];
      state.min = min;
      state.max = max;
      apply();
    });

    grid.querySelector('.vs-clear').addEventListener('click', () => {
      state.sizes.clear();
      state.brands.clear();
      state.colors.clear();
      state.types.clear();
      minI.value = Math.floor(minP);
      maxI.value = Math.ceil(maxP);
      state.min  = Math.floor(minP);
      state.max  = Math.ceil(maxP);
      state.search = '';
      sInput.value = '';
      grid.querySelectorAll('.vs-chip.is-active').forEach(b => b.classList.remove('is-active'));
      apply();
    });

    // SEARCH BAR – live search with clear button
    function updateSearch(){
      const q = (sInput.value || '').trim().toLowerCase();
      state.search = q;
      sWrap.classList.toggle('has-value', !!q);
      apply();
    }
    sInput.addEventListener('input', updateSearch);
    sInput.addEventListener('keydown', e => {
      if (e.key === 'Escape'){
        sInput.value = '';
        updateSearch();
        sInput.blur();
      }
    });
    sClear.addEventListener('click', () => {
      sInput.value = '';
      updateSearch();
      sInput.focus();
    });

    // SORTING
    let currentSort = 'newest';
    const sortToggle  = bar.querySelector('.vs-sort-toggle');
    const sortMenu    = bar.querySelector('.vs-sort-menu');
    const sortCurrent = bar.querySelector('.vs-sort-current');

    function resort(){
      const items = [...data];
      if (currentSort === 'price-asc'){
        items.sort((a,b) => {
          const pa = (typeof a.price === 'number') ? a.price : Infinity;
          const pb = (typeof b.price === 'number') ? b.price : Infinity;
          return pa - pb || a.index - b.index;
        });
      } else if (currentSort === 'price-desc'){
        items.sort((a,b) => {
          const pa = (typeof a.price === 'number') ? a.price : -Infinity;
          const pb = (typeof b.price === 'number') ? b.price : -Infinity;
          return pb - pa || a.index - b.index;
        });
      } else if (currentSort === 'newest'){
        items.sort((a,b) => a.index - b.index);
      } else {
        // featured = most viewed
        items.sort((a,b) => {
          const va = a.views || 0;
          const vb = b.views || 0;
          if (vb !== va) return vb - va;
          return a.index - b.index;
        });
      }
      items.forEach(item => listContainer.appendChild(item.el));
    }

    sortToggle.addEventListener('click', () => {
      const expanded = sortToggle.getAttribute('aria-expanded') === 'true';
      sortToggle.setAttribute('aria-expanded', String(!expanded));
      sortMenu.hidden = expanded;
    });

    bar.querySelectorAll('.vs-sort-option').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSort = btn.getAttribute('data-sort');
        sortCurrent.textContent = btn.textContent;
        sortMenu.hidden = true;
        sortToggle.setAttribute('aria-expanded','false');
        resort();
        apply();
      });
    });

    document.addEventListener('click', e => {
      if (!bar.contains(e.target) && !sortMenu.hidden){
        sortMenu.hidden = true;
        sortToggle.setAttribute('aria-expanded','false');
      }
    });

    function apply(){
      const q = state.search;
      data.forEach(item => {
        const okS = state.sizes.size  ? item.sizes.some(s  => state.sizes.has(s))    : true;
        const okB = state.brands.size ? item.brands.some(b => state.brands.has(b))   : true;
        const okC = state.colors.size ? item.colors.some(c => state.colors.has(c))   : true;
        const okT = state.types.size  ? (item.type && state.types.has(item.type))    : true;
        const okP = typeof item.price === 'number'
          ? (item.price >= state.min && item.price <= state.max)
          : true;
        const okQ = q
          ? (item.searchText && item.searchText.indexOf(q) !== -1)
          : true;

        item.el.style.display = (okS && okB && okC && okT && okP && okQ) ? '' : 'none';
      });
    }

    resort();
    apply();
  }

  function addLoader(wrapEl){
    if (document.getElementById('vs-filter-loading')) return;
    const d = document.createElement('div');
    d.id = 'vs-filter-loading';
    d.textContent = 'SCANNING ITEMS…';
    d.style.cssText = 'margin:6px 0 10px 0;font:12px/1.2 var(--font-family,inherit);letter-spacing:.08em;text-transform:uppercase;opacity:.7;';
    wrapEl.parentNode.insertBefore(d, wrapEl);
  }

  function removeLoader(){
    const d = document.getElementById('vs-filter-loading');
    if (d) d.remove();
  }

  ready(async () => {
    let wrapEl = await waitForWrap();
    let listContainer = wrapEl ? (wrapEl.querySelector(LIST_CONTAINER_SEL) || wrapEl) : null;
    let items = listContainer ? $$(ITEM_SELECTOR, listContainer) : [];

    if (!wrapEl || !items.length){
      log('Primary selectors missing, using fallback detection');
      const alt = findFallbackCards();
      wrapEl = alt.wrapEl;
      listContainer = alt.listContainer;
      items = alt.items;
    }

    if (!wrapEl || !listContainer || !items.length) {
      log('No product list found; aborting filters init');
      return;
    }

    addLoader(wrapEl);
    let data = [];
    try { data = await collectAll(listContainer, items); log('Collected items:', data.length); } catch(e){ log('collect error', e); }
    removeLoader();
    if (data.length) buildUI(wrapEl, listContainer, data);
  });
})();

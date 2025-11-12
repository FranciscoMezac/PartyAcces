(() => {
  const TRACKING_ENDPOINT = '/api/tracking/events';
  const USER_TOKEN_KEY = 'USER_TOKEN';

  function ensureUserToken() {
    try {
      let token = localStorage.getItem(USER_TOKEN_KEY);
      if (!token) {
        token = 'u_' + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem(USER_TOKEN_KEY, token);
      }
      return token;
    } catch (_) {
      return null;
    }
  }

  const userToken = ensureUserToken();

  async function enviarTracking(tipo, producto) {
    if (!producto || !producto.id) return;
    try {
      await fetch(TRACKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: tipo,
          productoId: producto.id,
          objectId: producto.algolia_object_id || producto.id,
          userToken,
          source: 'catalogo-canje'
        })
      });
    } catch (err) {
      console.warn('[tracking] evento no registrado', err.message);
    }
  }

  const grid = document.getElementById('grid');
  const msg = document.getElementById('resultado');
  const btnRefrescar = document.getElementById('btn-refrescar');

  function show(type, text) {
    if (!msg) return;
    msg.className = 'msg ' + (type === 'ok' ? 'ok' : 'err');
    msg.textContent = text;
    msg.style.display = 'block';
  }

  async function cargarProductos(opts = {}) {
    const params = new URLSearchParams();
    if (opts.page) params.set('page', opts.page);
    if (opts.pageSize) params.set('pageSize', opts.pageSize);
    if (opts.category) params.set('category', opts.category);
    if (opts.q) params.set('q', opts.q);
    grid.innerHTML = '<div class="muted">Cargando catálogo...</div>';
    try {
      const res = await fetch(`/api/productos?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo cargar el catálogo');
      renderCatalogo(data.data || [], data.meta || { page: 1, pages: 1 }, data.categories || []);
    } catch (e) {
      grid.innerHTML = `<div class="msg err">${e.message}</div>`;
    }
  }

  function renderCatalogo(items, meta, categories) {
    const sel = document.getElementById('f-category');
    if (sel && sel.options.length <= 1 && categories.length) {
      for (const c of categories) {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        sel.appendChild(o);
      }
    }
    if (!items.length) {
      grid.innerHTML = '<div class="muted">No hay productos activos.</div>';
      return;
    }
    grid.innerHTML = '';
    for (const p of items) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div>
          <h3>${p.nombre}</h3>
          <div class="muted">Costo: ${p.puntos_requeridos} pts</div>
        </div>
        <div style="margin-top:.75rem">
          <button data-id="${p.id}" data-cost="${p.puntos_requeridos}">Seleccionar</button>
        </div>
      `;
      card.querySelector('button').addEventListener('click', () => seleccionar(p));
      grid.appendChild(card);
    }
    const pager = document.getElementById('pager');
    if (pager) {
      pager.innerHTML = '';
      const mk = (label, page, disabled = false, active = false) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.disabled = disabled;
        b.className = active ? 'btn btn-primary' : 'btn';
        b.style.padding = '.4rem .7rem';
        if (!disabled) b.addEventListener('click', () => aplicarFiltros({ page }));
        return b;
      };
      pager.appendChild(mk('<<', 1, meta.page <= 1));
      pager.appendChild(mk('<', Math.max(1, meta.page - 1), meta.page <= 1));
      const pagesToShow = [meta.page - 1, meta.page, meta.page + 1].filter(p => p >= 1 && p <= meta.pages);
      for (const pnum of pagesToShow) pager.appendChild(mk(String(pnum), pnum, false, pnum === meta.page));
      pager.appendChild(mk('>', Math.min(meta.pages, meta.page + 1), meta.page >= meta.pages));
      pager.appendChild(mk('>>', meta.pages, meta.page >= meta.pages));
    }
  }

  function seleccionar(p) {
    try { localStorage.setItem('CLIENT_SELECTED_PRODUCT', String(p.id)); } catch (_) {}
    try {
      const oid = String(p.algolia_object_id || p.id);
      try { localStorage.setItem('ALGOLIA_LAST_OID', oid); } catch (_) {}
      if (typeof window !== 'undefined' && typeof window.mountAlgoliaRelated === 'function') {
        window.mountAlgoliaRelated(oid);
      }
      setTimeout(() => {
        const c = document.querySelector('#rec-related');
        if (!c || c.children.length === 0) {
          if (typeof window.mountAlgoliaRelatedFallback === 'function') window.mountAlgoliaRelatedFallback(oid);
        }
        c?.scrollIntoView({ behavior: 'smooth' });
      }, 800);
    } catch (_) {}
    show('ok', `Seleccionaste: ${p.nombre}. Indica al trabajador este producto para canjear.`);
    enviarTracking('click', p);
  }

  function aplicarFiltros(extra = {}) {
    const category = document.getElementById('f-category')?.value || '';
    const q = document.getElementById('f-search')?.value?.trim() || '';
    const params = { page: 1, pageSize: 8, category: category || undefined, q: q || undefined, ...extra };
    cargarProductos(params);
  }

  btnRefrescar?.addEventListener('click', () => aplicarFiltros());
  aplicarFiltros();
})();

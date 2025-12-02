(() => {
  const ENDPOINT_PRODUCTS = '/api/productos';
  const ENDPOINT_REDEEM = '/api/puntos/canjear';
  const ENDPOINT_RELATED = '/api/recommend/looking-similar';
  const TRACKING_ENDPOINT = '/api/tracking/events';
  const USER_TOKEN_KEY = 'USER_TOKEN';

  const elements = {
    badge: document.getElementById('modeBadge'),
    catalog: document.getElementById('catalog'),
    status: document.getElementById('status'),
    recGrid: document.getElementById('rec-grid'),
    workerPanel: document.getElementById('worker-panel'),
    recommendations: document.getElementById('recommendations'),
    filterCategory: document.getElementById('filter-category'),
    filterQuery: document.getElementById('filter-query'),
    btnFilters: document.getElementById('btnFilters'),
    btnReset: document.getElementById('btnReset'),
    workerForm: document.getElementById('workerForm'),
    workerProduct: document.getElementById('workerProduct'),
    workerProductId: document.getElementById('workerProductId'),
    workerRut: document.getElementById('workerRut'),
    btnWorkerRedeem: document.getElementById('btnWorkerRedeem')
  };

  const state = {
    mode: 'client',
    products: [],
    selectedProduct: null,
    workerAllowed: false,
    userToken: null
  };

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

  function showStatus(type, message) {
    if (!elements.status) return;
    if (!message) {
      elements.status.classList.remove('show', 'ok', 'err');
      elements.status.textContent = '';
      return;
    }
    elements.status.textContent = message;
    elements.status.className = `status show ${type === 'error' ? 'err' : 'ok'}`;
  }

  function getStoredUserRole() {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        return String(user.rol || '').toUpperCase();
      }
    } catch (_) {}
    return '';
  }

  function hasWorkerPrivileges(role) {
    return ['ADMIN', 'TRABAJADOR', 'WORKER', 'STAFF'].includes(role);
  }

  function determineInitialMode() {
    const userRole = getStoredUserRole();
    state.workerAllowed = hasWorkerPrivileges(userRole);
    return state.workerAllowed ? 'worker' : 'client';
  }

  function applyMode(mode) {
    if (mode === 'worker' && !state.workerAllowed) {
      showStatus('error', 'Necesitas permisos de trabajador para usar este modo.');
      return;
    }
    state.mode = mode;
    document.body.dataset.mode = mode;
    if (elements.badge) {
      elements.badge.textContent = mode === 'worker' ? 'Modo trabajador' : 'Modo cliente';
    }
    if (elements.workerPanel) {
      elements.workerPanel.style.display = mode === 'worker' ? 'block' : 'none';
    }
    if (elements.recommendations) {
      elements.recommendations.style.display = mode === 'client' ? 'block' : 'none';
    }
    syncCatalogButtons();
  }

  function syncCatalogButtons() {
    if (!elements.catalog) return;
    elements.catalog.querySelectorAll('button[data-product]').forEach((btn) => {
      btn.textContent = state.mode === 'worker' ? 'Canjear' : 'Seleccionar';
    });
  }

  async function loadProducts(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.query) params.set('q', filters.query);
    showStatus(null);
    elements.catalog.innerHTML = '<p class="muted">Cargando catálogo...</p>';
    try {
      const res = await fetch(`${ENDPOINT_PRODUCTS}?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No fue posible cargar los productos');
      state.products = Array.isArray(data.data) ? data.data : [];
      renderCatalog(state.products);
      populateCategories(data.categories || []);
    } catch (error) {
      elements.catalog.innerHTML = `<p class="muted">${error.message}</p>`;
    }
  }

  function populateCategories(categories) {
    if (!elements.filterCategory || !categories.length) return;
    if (elements.filterCategory.options.length > 1) return;
    categories.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      elements.filterCategory.appendChild(opt);
    });
  }

  function renderCatalog(products) {
    if (!elements.catalog) return;
    if (!products.length) {
      elements.catalog.innerHTML = '<p class="muted">No se encontraron productos activos.</p>';
      return;
    }
    const frag = document.createDocumentFragment();
    products.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div>
          <h3>${product.nombre || 'Producto'}</h3>
          <p>${product.puntos_requeridos ?? product.price ?? 0} pts</p>
        </div>
        <button type="button" data-product="${product.id}">${state.mode === 'worker' ? 'Canjear' : 'Seleccionar'}</button>
      `;
      card.querySelector('button').addEventListener('click', () => onProductSelected(product));
      frag.appendChild(card);
    });
    elements.catalog.innerHTML = '';
    elements.catalog.appendChild(frag);
  }

  async function onProductSelected(product) {
    state.selectedProduct = product;
    if (state.mode === 'worker') {
      if (elements.workerProduct) {
        elements.workerProduct.value = `${product.nombre} - ${product.puntos_requeridos} pts`;
      }
      if (elements.workerProductId) {
        elements.workerProductId.value = product.id;
      }
      if (elements.btnWorkerRedeem) {
        elements.btnWorkerRedeem.disabled = false;
      }
      showStatus('success', 'Producto listo para canjear. Completa el RUT y confirma.');
    } else {
      showStatus('success', `Seleccionaste ${product.nombre}.`);
      sendTracking('click', product);
      loadRecommendations(product);
    }
  }

  async function sendTracking(eventType, product) {
    if (!product || !product.id) return;
    const payload = {
      eventType,
      productoId: product.id,
      objectId: product.algolia_object_id || product.id,
      userToken: state.userToken,
      source: 'canjear-ui'
    };
    try {
      await fetch(TRACKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (_) {
      // best effort; no UI impact
    }
  }

  async function loadRecommendations(product) {
    if (!elements.recGrid) return;
    elements.recGrid.innerHTML = '<p class="muted">Buscando recomendaciones...</p>';
    try {
      const objectID = product.algolia_object_id || product.id;
      const params = new URLSearchParams({
        objectID: objectID,
        threshold: '70'
      });
      const res = await fetch(`${ENDPOINT_RELATED}?${params.toString()}`);
      if (!res.ok) throw new Error('Recomendador no disponible por el momento');
      const data = await res.json();
      const items = data?.hits || [];
      if (!items.length) {
        elements.recGrid.innerHTML = '<p class="muted">Sin sugerencias para este producto por ahora.</p>';
        return;
      }
      const frag = document.createDocumentFragment();
      items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'rec-card';
        const img = document.createElement('img');
        img.src = item.image || item.img || 'https://via.placeholder.com/240x140?text=Producto';
        img.alt = item.name || 'Producto recomendado';
        card.appendChild(img);
        const title = document.createElement('h3');
        title.textContent = item.name || item.nombre || 'Producto recomendado';
        card.appendChild(title);
        const cost = document.createElement('p');
        cost.textContent = `${item.price ?? item.puntos ?? ''} pts`;
        card.appendChild(cost);
        frag.appendChild(card);
      });
      elements.recGrid.innerHTML = '';
      elements.recGrid.appendChild(frag);
    } catch (error) {
      elements.recGrid.innerHTML = `<p class="muted">${error.message}</p>`;
    }
  }

  async function redeemProduct(rut, productId) {
    const payload = { rut, productoId: productId };
    const res = await fetch(ENDPOINT_REDEEM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'El canje no pudo completarse');
    return data;
  }

  function attachEvents() {
    elements.btnFilters?.addEventListener('click', () => {
      loadProducts({
        category: elements.filterCategory?.value || '',
        query: elements.filterQuery?.value?.trim() || ''
      });
    });

    elements.btnReset?.addEventListener('click', () => {
      if (elements.filterCategory) elements.filterCategory.value = '';
      if (elements.filterQuery) elements.filterQuery.value = '';
      loadProducts();
    });

    elements.workerForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const rut = elements.workerRut?.value?.trim();
      const productId = Number(elements.workerProductId?.value || 0);
      if (!rut || !productId) {
        showStatus('error', 'Debes ingresar el RUT y seleccionar un producto.');
        return;
      }
      elements.btnWorkerRedeem.disabled = true;
      try {
        const result = await redeemProduct(rut, productId);
        showStatus('success', `Canje realizado para ${result.rut}. Nuevo saldo: ${result.nuevoSaldo ?? '--'} pts.`);
        elements.workerForm.reset();
        if (elements.workerProduct) elements.workerProduct.value = '';
        if (elements.workerProductId) elements.workerProductId.value = '';
      } catch (error) {
        showStatus('error', error.message);
      } finally {
        elements.btnWorkerRedeem.disabled = false;
      }
    });
  }

  function init() {
    attachEvents();
    const initialMode = determineInitialMode();
    state.userToken = ensureUserToken();
    applyMode(initialMode);
    loadProducts();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

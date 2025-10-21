(() => {
  const grid = document.getElementById('grid');
  const rutInput = document.getElementById('rut');
  const msg = document.getElementById('resultado');
  const btnRefrescar = document.getElementById('btn-refrescar');

  function show(type, text) {
    msg.className = 'msg ' + (type === 'ok' ? 'ok' : 'err');
    msg.textContent = text;
    msg.style.display = 'block';
  }

  async function cargarProductos() {
    grid.innerHTML = '<div class="muted">Cargando catálogo...</div>';
    try {
      const res = await fetch('/api/productos');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'No se pudo cargar el catálogo');
      renderCatalogo(data.data || []);
    } catch (e) {
      grid.innerHTML = `<div class="msg err">${e.message}</div>`;
    }
  }

  function renderCatalogo(items) {
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
          <button data-id="${p.id}" data-cost="${p.puntos_requeridos}">Canjear</button>
        </div>
      `;
      card.querySelector('button').addEventListener('click', () => canjear(p.id));
      grid.appendChild(card);
    }
  }

  async function canjear(productoId) {
    msg.style.display = 'none';
    const rut = rutInput.value.trim();
    if (!rut) {
      show('err', 'Debes ingresar un RUT.');
      return;
    }
    try {
      const res = await fetch('/api/puntos/canjear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut, productoId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        show('ok', `Canje exitoso: ${data.producto.nombre} (costo ${data.costo}). Nuevo saldo: ${data.nuevoSaldo}.`);
      } else {
        show('err', data.error || 'No fue posible canjear.');
      }
    } catch (e) {
      show('err', e.message || 'Error de red');
    }
  }

  btnRefrescar?.addEventListener('click', cargarProductos);
  cargarProductos();
})();


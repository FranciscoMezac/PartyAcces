(() => {
  const tbody = document.getElementById('tbody');
  const meta = document.getElementById('meta');
  const rutInput = document.getElementById('rut');
  const btnBuscar = document.getElementById('btn-buscar');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');

  let state = { rut: '', page: 1, limit: 10, total: 0 };

  function fmtDate(s) {
    try { return new Date(s).toLocaleString(); } catch { return s; }
  }

  function render(items) {
    tbody.innerHTML = '';
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="muted">Sin movimientos</td></tr>';
      return;
    }
    for (const m of items) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${fmtDate(m.fecha)}</td><td>${m.tipo}</td><td>${m.monto}</td><td>${m.puntos}</td>`;
      tbody.appendChild(tr);
    }
  }

  function updateMeta() {
    const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
    meta.textContent = `RUT: ${state.rut} | Página ${state.page} de ${totalPages} | Total: ${state.total}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= totalPages;
  }

  async function load(page = 1) {
    if (!state.rut) return;
    const url = `/api/puntos/historial?rut=${encodeURIComponent(state.rut)}&page=${page}&limit=${state.limit}`;
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok && data.success) {
      state.page = data.page; state.limit = data.limit; state.total = data.total;
      render(data.items);
      updateMeta();
    } else {
      tbody.innerHTML = `<tr><td colspan="4" class="muted">${data.error || 'Error'}</td></tr>`;
    }
  }

  btnBuscar?.addEventListener('click', () => {
    state.rut = (rutInput.value || '').trim();
    state.page = 1;
    load(1);
  });

  prevBtn?.addEventListener('click', () => load(Math.max(1, state.page - 1)));
  nextBtn?.addEventListener('click', () => load(state.page + 1));
})();


(() => {
  const tbody = document.getElementById('tbody');
  const meta = document.getElementById('meta');
  const pagerInfo = document.getElementById('pager-info');
  const rutInput = document.getElementById('rut');
  const btnBuscar = document.getElementById('btn-buscar');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');

  let state = { rut: '', page: 1, limit: 10, total: 0 };

  function fmtDate(s) {
    try {
      const date = new Date(s);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return s;
    }
  }

  function getTipoLabel(tipo) {
    const labels = {
      'ACUMULACION': 'Acumulación',
      'CANJE': 'Canje',
      'AJUSTE': 'Ajuste',
      'EXPIRACION': 'Expiración'
    };
    return labels[tipo?.toUpperCase()] || tipo;
  }

  function render(items) {
    tbody.innerHTML = '';
    if (!items || items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            <p class="muted">Sin movimientos registrados para este RUT.</p>
          </td>
        </tr>
      `;
      return;
    }
    for (const m of items) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fmtDate(m.fecha)}</td>
        <td>${getTipoLabel(m.tipo)}</td>
        <td>${m.monto ? '$' + m.monto.toLocaleString('es-ES') : '—'}</td>
        <td><strong>${m.puntos}</strong></td>
      `;
      tbody.appendChild(tr);
    }
  }

  function updateMeta() {
    const totalPages = Math.max(1, Math.ceil(state.total / state.limit));
    meta.textContent = `RUT: ${state.rut} • Total de transacciones: ${state.total}`;
    pagerInfo.textContent = `Página ${state.page} de ${totalPages}`;
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= totalPages;
  }

  async function load(page = 1) {
    if (!state.rut) return;
    const url = `/api/puntos/historial?rut=${encodeURIComponent(state.rut)}&page=${page}&limit=${state.limit}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        state.page = data.page;
        state.limit = data.limit;
        state.total = data.total;
        render(data.items);
        updateMeta();
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="empty-state">
              <p class="muted">${data.error || 'Error al cargar el historial'}</p>
            </td>
          </tr>
        `;
      }
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            <p class="muted">Error de conexión: ${err.message}</p>
          </td>
        </tr>
      `;
    }
  }

  btnBuscar?.addEventListener('click', () => {
    state.rut = (rutInput.value || '').trim();
    if (!state.rut) {
      alert('Por favor ingresa un RUT válido');
      return;
    }
    state.page = 1;
    load(1);
  });

  rutInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      btnBuscar?.click();
    }
  });

  prevBtn?.addEventListener('click', () => {
    if (state.page > 1) load(state.page - 1);
  });

  nextBtn?.addEventListener('click', () => {
    load(state.page + 1);
  });
})();



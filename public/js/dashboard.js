// JavaScript para la página de dashboard usando Fetch API

document.addEventListener('DOMContentLoaded', () => {
  const loadUsersBtn = document.getElementById('loadUsersBtn');
  const usersTableBody = document.getElementById('usersTableBody');
  const alertContainer = document.getElementById('alert-container');
  const loading = document.getElementById('loading');
  const searchInput = document.getElementById('search');
  const estadoSelect = document.getElementById('estado');
  const limitSelect = document.getElementById('limit');
  const prevBtn = document.getElementById('prevUsers');
  const nextBtn = document.getElementById('nextUsers');
  const pageInfo = document.getElementById('usersPageInfo');
  const metricsRange = document.getElementById('metricsRange');
  const metricsLoading = document.getElementById('metricsLoading');
  const topProductsBody = document.getElementById('topProductsBody');
  const kpiUsersTotal = document.getElementById('kpiUsersTotal');
  const kpiUsersActive = document.getElementById('kpiUsersActive');
  const kpiPointsIssued = document.getElementById('kpiPointsIssued');
  const kpiPointsRedeemed = document.getElementById('kpiPointsRedeemed');
  const kpiIngresosHoy = document.getElementById('kpiIngresosHoy');
  const kpiCtr = document.getElementById('kpiCtr');
  const pointsChartEl = document.getElementById('pointsChart');
  const funnelChartEl = document.getElementById('funnelChart');
  const qrChartEl = document.getElementById('qrChart');

  const state = { page: 1, limit: 10, estado: 'all', search: '' };
  const metricsState = {
    range: Number(metricsRange?.value || 7),
    pointsChart: null,
    funnelChart: null,
    qrChart: null
  };
  const numberFormatter = new Intl.NumberFormat('es-CL');

  loadUsersBtn?.addEventListener('click', async () => {
    await loadUsers();
  });

  metricsRange?.addEventListener('change', () => {
    const value = Number(metricsRange.value) || 7;
    loadMetrics(value);
  });

  async function loadUsers() {
    loading.classList.remove('d-none');
    loadUsersBtn.disabled = true;
    alertContainer.innerHTML = '';

    try {
      // Nuevo endpoint con autorización (Bearer demo)
      const token = getAdminToken();
      const qs = new URLSearchParams({
        page: String(state.page),
        limit: String(state.limit),
        estado: state.estado,
        search: state.search
      }).toString();
      const response = await fetch(`/api/usuarios?${qs}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        const items = Array.isArray(data.data) ? data.data : (data.data?.items || []);
        displayUsers(items);
        const total = data.data?.total ?? items.length;
        const totalPages = Math.max(1, Math.ceil(total / state.limit));
        pageInfo.textContent = `Página ${state.page} de ${totalPages} · Total: ${total}`;
        prevBtn.disabled = state.page <= 1;
        nextBtn.disabled = state.page >= totalPages;
        showAlert(`${items.length} usuarios cargados correctamente`, 'success');
      } else {
        showAlert(data.message || 'Error al cargar usuarios', 'danger');
        usersTableBody.innerHTML = `
          <tr><td colspan="7" class="text-center text-danger">Error al cargar los datos</td></tr>
        `;
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión con el servidor', 'danger');
      usersTableBody.innerHTML = `
        <tr><td colspan="7" class="text-center text-danger">Error de conexión</td></tr>
      `;
    } finally {
      loading.classList.add('d-none');
      loadUsersBtn.disabled = false;
    }
  }

  async function loadMetrics(range = metricsState.range) {
    if (!metricsRange) return;
    metricsState.range = range;
    setMetricsLoading(true);
    try {
      const response = await fetch(`/api/metrics/overview?rangeDays=${range}`);
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'No se pudieron cargar las métricas');
      }
      const data = json.data || {};
      renderKpis(data.kpis);
      renderPointsChart(data.charts?.points || []);
      renderFunnelChart(data.charts?.funnel || []);
      renderQrChart(data.charts?.qr || []);
      renderTopProducts(data.tables?.topProducts || []);
    } catch (err) {
      console.error('metrics error:', err);
      showAlert(err.message || 'No se pudieron cargar las métricas', 'danger');
    } finally {
      setMetricsLoading(false);
    }
  }

  function displayUsers(users) {
    if (!users || users.length === 0) {
      usersTableBody.innerHTML = `
        <tr><td colspan="7" class="text-center text-muted">No hay usuarios registrados</td></tr>
      `;
      return;
    }
    const rows = users.map(user => {
      const name = user.name ?? user.nombre ?? '';
      const email = user.email ?? user.correo ?? '';
      const rut = user.rut ?? '';
      const rol = user.rol ?? '';
      const estado = user.estado ?? '';
      const canBlock = rut && estado !== 'BLOQUEADO';
      return `
        <tr>
          <td>${user.id ?? user.usuarioId ?? ''}</td>
          <td>${name}</td>
          <td>${email}</td>
          <td>${rut}</td>
          <td>${rol}</td>
          <td>${estado}</td>
          <td>
            <button class="btn btn-sm btn-warning" data-action="bloquear" data-rut="${rut}" ${canBlock ? '' : 'disabled'} title="${canBlock ? 'Bloquear usuario' : (rut ? 'Ya bloqueado' : 'Sin RUT')}">Bloquear</button>
          </td>
        </tr>
      `;
    }).join('');
    usersTableBody.innerHTML = rows;
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
  }

  function getAdminToken() {
    let t = localStorage.getItem('adminToken');
    if (t) return t;
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
      .replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
    const payload = btoa(JSON.stringify({ id: 1, email: 'admin@demo', rol: 'ADMIN' }))
      .replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
    t = `${header}.${payload}.`;
    localStorage.setItem('adminToken', t);
    return t;
  }

  usersTableBody?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="bloquear"]');
    if (!btn) return;
    const rut = btn.dataset.rut;
    if (!rut) { showAlert('Usuario sin RUT. No se puede bloquear.', 'danger'); return; }
    if (!confirm(`¿Bloquear usuario ${rut}?`)) return;
    try {
      btn.disabled = true;
      const token = getAdminToken();
      const resp = await fetch('/api/usuarios/bloquear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rut, motivo: 'Bloqueo manual desde dashboard' })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        showAlert(`Usuario ${rut} bloqueado`, 'success');
        await loadUsers();
      } else {
        showAlert(data.message || 'No se pudo bloquear', 'danger');
      }
    } catch (err) {
      showAlert(err.message || 'Error de red', 'danger');
    } finally {
      btn.disabled = false;
    }
  });

  searchInput?.addEventListener('change', () => { state.search = searchInput.value.trim(); state.page = 1; loadUsers(); });
  estadoSelect?.addEventListener('change', () => { state.estado = estadoSelect.value; state.page = 1; loadUsers(); });
  limitSelect?.addEventListener('change', () => { state.limit = Number(limitSelect.value || 10); state.page = 1; loadUsers(); });
  prevBtn?.addEventListener('click', () => { if (state.page > 1) { state.page -= 1; loadUsers(); } });
  nextBtn?.addEventListener('click', () => { state.page += 1; loadUsers(); });

  (function saldoRealtime() {
    const rutInput = document.getElementById('saldoRut');
    const btn = document.getElementById('saldoBtn');
    const valor = document.getElementById('saldoValor');
    const status = document.getElementById('saldoStatus');
    let es = null;

    async function cargarSaldo(rut) {
      try {
        const r = await fetch(`/api/puntos/saldo?rut=${encodeURIComponent(rut)}`);
        const j = await r.json();
        if (r.ok && j.success) {
          valor.textContent = j.saldo ?? 0;
        } else {
          valor.textContent = 'Error';
        }
      } catch {
        valor.textContent = 'Error';
      }
    }

    function suscribir(rut) {
      if (es) { try { es.close(); } catch {} es = null; }
      try {
        es = new EventSource(`/api/puntos/saldo/stream?rut=${encodeURIComponent(rut)}`);
        status.textContent = 'suscrito';
        es.addEventListener('saldo', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data && String(data.rut) === String(rut)) {
              valor.textContent = data.saldo ?? 0;
            }
          } catch {}
        });
        es.onerror = () => { status.textContent = 'reintentando...'; };
      } catch {
        status.textContent = 'error';
      }
    }

    btn?.addEventListener('click', async () => {
      const rut = (rutInput?.value || '').trim();
      if (!rut) return;
      status.textContent = 'consultando...';
      await cargarSaldo(rut);
      suscribir(rut);
    });
  })();

  function setMetricsLoading(isLoading) {
    if (!metricsLoading) return;
    metricsLoading.classList.toggle('d-none', !isLoading);
  }

  function renderKpis(kpis = {}) {
    if (!kpiUsersTotal) return;
    kpiUsersTotal.textContent = formatNumber(kpis.totalUsers);
    kpiUsersActive.textContent = formatNumber(kpis.activeUsers);
    kpiPointsIssued.textContent = formatNumber(kpis.pointsIssued);
    kpiPointsRedeemed.textContent = formatNumber(kpis.pointsRedeemed);
    kpiIngresosHoy.textContent = formatNumber(kpis.ingresosHoy);
    const ctr = typeof kpis.funnel?.ctr === 'number' ? kpis.funnel.ctr.toFixed(2) : '0.00';
    kpiCtr.textContent = `${ctr}%`;
  }

  function renderPointsChart(series) {
    if (!pointsChartEl || !window.Chart) return;
    const labels = series.map((p) => p.date?.slice(5));
    const emitidos = series.map((p) => p.emitidos || 0);
    const canjeados = series.map((p) => p.canjeados || 0);
    if (metricsState.pointsChart) {
      metricsState.pointsChart.destroy();
    }
    metricsState.pointsChart = new Chart(pointsChartEl.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Emitidos',
            data: emitidos,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13,110,253,0.15)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Canjeados',
            data: canjeados,
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220,53,69,0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true } }
      }
    });
  }

  function renderFunnelChart(series) {
    if (!funnelChartEl || !window.Chart) return;
    const labels = series.map((p) => p.date?.slice(5));
    const datasets = [
      { key: 'views', label: 'Vistas', color: '#6c757d' },
      { key: 'clicks', label: 'Clics', color: '#0d6efd' },
      { key: 'conversions', label: 'Canjes', color: '#198754' }
    ].map((cfg) => ({
      label: cfg.label,
      data: series.map((p) => p[cfg.key] || 0),
      backgroundColor: cfg.color
    }));
    if (metricsState.funnelChart) {
      metricsState.funnelChart.destroy();
    }
    metricsState.funnelChart = new Chart(funnelChartEl.getContext('2d'), {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        },
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  function renderQrChart(series) {
    if (!qrChartEl || !window.Chart) return;
    const labels = series.map((p) => p.hour);
    const ingresos = series.map((p) => p.ingresos || 0);
    const salidas = series.map((p) => p.salidas || 0);
    if (metricsState.qrChart) {
      metricsState.qrChart.destroy();
    }
    metricsState.qrChart = new Chart(qrChartEl.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Ingresos', data: ingresos, borderColor: '#0d6efd', tension: 0.3 },
          { label: 'Salidas', data: salidas, borderColor: '#fd7e14', tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  function renderTopProducts(items) {
    if (!topProductsBody) return;
    if (!items.length) {
      topProductsBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Sin datos</td></tr>';
      return;
    }
    topProductsBody.innerHTML = items.map((item) => `
      <tr>
        <td>${item.name || `Producto ${item.productId}`}</td>
        <td class="text-end">${formatNumber(item.views)}</td>
        <td class="text-end">${formatNumber(item.clicks)}</td>
        <td class="text-end">${formatNumber(item.conversions)}</td>
      </tr>
    `).join('');
  }

  function formatNumber(value) {
    const num = Number(value || 0);
    return numberFormatter.format(num);
  }

  loadMetrics(metricsState.range);
});

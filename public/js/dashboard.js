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

  const state = { page: 1, limit: 10, estado: 'all', search: '' };

  // Cargar usuarios al hacer clic en el botón
  loadUsersBtn?.addEventListener('click', async () => {
    await loadUsers();
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
        pageInfo.textContent = `Página ${state.page} de ${totalPages} • Total: ${total}`;
        prevBtn.disabled = state.page <= 1;
        nextBtn.disabled = state.page >= totalPages;
        showAlert(`${items.length} usuarios cargados correctamente`, 'success');
      } else {
        showAlert(data.message || 'Error al cargar usuarios', 'danger');
        usersTableBody.innerHTML = `
          <tr><td colspan="4" class="text-center text-danger">Error al cargar los datos</td></tr>
        `;
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión con el servidor', 'danger');
      usersTableBody.innerHTML = `
        <tr><td colspan="4" class="text-center text-danger">Error de conexión</td></tr>
      `;
    } finally {
      loading.classList.add('d-none');
      loadUsersBtn.disabled = false;
    }
  }

  function displayUsers(users) {
    if (!users || users.length === 0) {
      usersTableBody.innerHTML = `
        <tr><td colspan="4" class="text-center text-muted">No hay usuarios registrados</td></tr>
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
          <td>${user.id ?? ''}</td>
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

  // Token demo (alg: none). En producción usa JWT real.
  function getAdminToken(){
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

  // Delegación de eventos para acciones en filas
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
        // refrescar manteniendo filtros y página actual
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

  // Eventos de filtros y paginación
  searchInput?.addEventListener('change', () => { state.search = searchInput.value.trim(); state.page = 1; loadUsers(); });
  estadoSelect?.addEventListener('change', () => { state.estado = estadoSelect.value; state.page = 1; loadUsers(); });
  limitSelect?.addEventListener('change', () => { state.limit = Number(limitSelect.value || 10); state.page = 1; loadUsers(); });
  prevBtn?.addEventListener('click', () => { if (state.page > 1) { state.page -= 1; loadUsers(); } });
  nextBtn?.addEventListener('click', () => { state.page += 1; loadUsers(); });
});

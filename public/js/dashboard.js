// JavaScript para la página de dashboard usando Fetch API

document.addEventListener('DOMContentLoaded', () => {
    const loadUsersBtn = document.getElementById('loadUsersBtn');
    const usersTableBody = document.getElementById('usersTableBody');
    const alertContainer = document.getElementById('alert-container');
    const loading = document.getElementById('loading');
    
    // Verificar si hay usuario logueado
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        console.log('Usuario logueado:', userData);
    }
    
    // Cargar usuarios al hacer clic en el botón
    loadUsersBtn.addEventListener('click', async () => {
        await loadUsers();
    });
    
    // Función para cargar usuarios desde la API
    async function loadUsers() {
        // Mostrar spinner
        loading.classList.remove('d-none');
        loadUsersBtn.disabled = true;
        
        // Limpiar alertas previas
        alertContainer.innerHTML = '';
        
        try {
            // Realizar petición GET usando Fetch API
            const response = await fetch('/api/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Parsear la respuesta JSON
            const data = await response.json();
            
            if (data.success) {
                // Mostrar usuarios en la tabla
                displayUsers(data.data);
                showAlert(`${data.data.length} usuarios cargados correctamente`, 'success');
            } else {
                showAlert(data.message || 'Error al cargar usuarios', 'danger');
                usersTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-danger">
                            Error al cargar los datos
                        </td>
                    </tr>
                `;
            }
            
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error de conexión con el servidor', 'danger');
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        Error de conexión
                    </td>
                </tr>
            `;
        } finally {
            // Ocultar spinner
            loading.classList.add('d-none');
            loadUsersBtn.disabled = false;
        }
    }
    
    // Función para mostrar usuarios en la tabla
    function displayUsers(users) {
        if (!users || users.length === 0) {
            usersTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        No hay usuarios registrados
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generar filas de la tabla
        const rows = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${formatDate(user.created_at)}</td>
            </tr>
        `).join('');
        
        usersTableBody.innerHTML = rows;
    }
    
    // Función para formatear fechas
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Función para mostrar alertas
    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertContainer.appendChild(alert);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
});

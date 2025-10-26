document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
        window.location.href = '/login';
        return;
    }

    const user = JSON.parse(userStr);

    // Verificar que no sea admin
    if (user.rol === 'ADMIN') {
        window.location.href = '/home-admin';
        return;
    }

    // Elementos del DOM
    const form = document.getElementById('editarPerfilForm');
    const alertContainer = document.getElementById('alertContainer');
    const guardarBtn = document.getElementById('guardarBtn');

    /**
     * Muestra una alerta
     * @param {string} message 
     * @param {string} type - 'success' o 'danger'
     */
    function showAlert(message, type = 'danger') {
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Scroll al top para ver la alerta
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Carga el perfil del usuario desde la API
     */
    async function cargarPerfil() {
        try {
            const response = await fetch('/api/perfil', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success && data.perfil) {
                // Llenar el formulario con los datos actuales
                document.getElementById('nombre').value = data.perfil.nombre || '';
                document.getElementById('email').value = data.perfil.email || '';
                document.getElementById('rut').value = data.perfil.rut || '';
            } else {
                showAlert('Error al cargar perfil: ' + (data.message || 'Error desconocido'), 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error de conexión al cargar perfil', 'danger');
        }
    }

    /**
     * Maneja el envío del formulario
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validar campos
        if (!nombre || !email) {
            showAlert('Nombre y email son obligatorios', 'warning');
            return;
        }

        if (password && password.length < 8) {
            showAlert('La contraseña debe tener al menos 8 caracteres', 'warning');
            return;
        }

        try {
            guardarBtn.disabled = true;
            guardarBtn.textContent = 'Guardando...';

            // Preparar datos a enviar
            const datosActualizar = {
                nombre: nombre,
                email: email
            };

            // Solo incluir password si se ingresó uno
            if (password && password.length >= 8) {
                datosActualizar.password = password;
            }

            // Enviar PATCH a la API
            const response = await fetch('/api/perfil', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizar)
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Perfil actualizado exitosamente', 'success');

                // Actualizar localStorage con nuevos datos
                const updatedUser = {
                    ...user,
                    nombre: data.perfil.nombre,
                    email: data.perfil.email
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Limpiar campo de contraseña
                document.getElementById('password').value = '';

                // Redirigir después de 2 segundos
                setTimeout(() => {
                    window.location.href = '/perfil-usuario';
                }, 2000);
            } else {
                showAlert(data.message || 'Error al actualizar perfil', 'danger');
            }

        } catch (error) {
            console.error('Error:', error);
            showAlert('Error de conexión. Intenta nuevamente.', 'danger');
        } finally {
            guardarBtn.disabled = false;
            guardarBtn.textContent = 'Guardar Cambios';
        }
    });

    // Manejar logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (token) {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            }
        }
        
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
    });

    // Cargar perfil al iniciar
    await cargarPerfil();
});

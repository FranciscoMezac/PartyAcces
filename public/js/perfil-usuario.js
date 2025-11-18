document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Si no hay token, redirigir al login
        window.location.href = '/login';
        return;
    }

    try {
        // Obtener datos del perfil desde el servidor
        const response = await fetch('/api/perfil', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token invalido o expirado
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            throw new Error('Error al obtener el perfil');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
            const usuario = result.data;

            // Verificar que sea un usuario normal (no admin)
            if (usuario.rol === 'ADMIN') {
                window.location.href = '/perfil-admin';
                return;
            }

            // Actualizar localStorage con datos actualizados
            localStorage.setItem('user', JSON.stringify(usuario));

            // Cargar datos del usuario en la vista
            document.getElementById('userName').textContent = usuario.nombre || 'N/A';
            document.getElementById('userRut').textContent = usuario.rut || 'N/A';
            document.getElementById('userEmail').textContent = usuario.email || 'N/A';
            document.getElementById('userRol').textContent = usuario.rol || 'USER';

            // Cargar puntos si estan disponibles
            const userPoints = document.getElementById('userPoints');
            if (userPoints && usuario.saldo !== undefined) {
                userPoints.textContent = usuario.saldo;
            } else if (userPoints) {
                userPoints.textContent = '0';
            }
        } else {
            throw new Error('Datos de perfil invalidos');
        }
    } catch (error) {
        console.error('Error al cargar el perfil:', error);
        alert('Error al cargar el perfil. Por favor, intenta de nuevo.');
    }

    // Manejar logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                // Llamar a la API de logout
                const response = await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                if (response.ok) {
                    console.log('Sesión cerrada correctamente');
                } else {
                    console.warn('Error al cerrar sesión en el servidor:', data.message);
                }
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            } finally {
                // Limpiar localStorage siempre
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                
                // Redirigir al login
                window.location.href = '/login';
            }
        });
    }
});

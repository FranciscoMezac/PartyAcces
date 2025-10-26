document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay usuario en localStorage
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
        // Si no hay usuario, redirigir al login
        window.location.href = '/login';
        return;
    }

    const user = JSON.parse(userStr);

    // Verificar que sea administrador
    if (user.rol !== 'ADMIN') {
        window.location.href = '/perfil-usuario';
        return;
    }

    // Cargar datos del administrador en la vista
    document.getElementById('adminName').textContent = user.nombre || 'N/A';
    document.getElementById('adminRut').textContent = user.rut || 'N/A';
    document.getElementById('adminEmail').textContent = user.email || 'N/A';
    document.getElementById('adminRol').textContent = user.rol || 'ADMIN';

    // Manejar logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        
        const token = localStorage.getItem('token');
        
        if (token) {
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
                console.log('Logout response:', data);
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            }
        }
        
        // Limpiar localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Redirigir al login
        window.location.href = '/login';
    });
});

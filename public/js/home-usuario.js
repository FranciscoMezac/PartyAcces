document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay usuario en localStorage
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
        // Si no hay usuario o token, redirigir al login
        window.location.href = '/login';
        return;
    }

    const user = JSON.parse(userStr);

    // Verificar que sea un usuario normal (no admin)
    if (user.rol === 'ADMIN') {
        window.location.href = '/home-admin';
        return;
    }

    // Mostrar nombre del usuario en el mensaje de bienvenida
    const heroTitle = document.querySelector('.hero-section h1');
    if (heroTitle && user.nombre) {
        heroTitle.textContent = `Bienvenido, ${user.nombre}`;
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
                // Limpiar localStorage siempre (incluso si falla la petición)
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                
                // Redirigir al login
                window.location.href = '/login';
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay usuario en localStorage
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
        // Si no hay usuario, redirigir al login
        window.location.href = '/login';
        return;
    }

    const user = JSON.parse(userStr);

    // Verificar que sea un usuario normal (no admin)
    if (user.rol === 'ADMIN') {
        window.location.href = '/perfil-admin';
        return;
    }

    // Cargar datos del usuario en la vista
    document.getElementById('userName').textContent = user.nombre || 'N/A';
    document.getElementById('userRut').textContent = user.rut || 'N/A';
    document.getElementById('userEmail').textContent = user.email || 'N/A';
    document.getElementById('userRol').textContent = user.rol || 'USER';

    // Cargar puntos (esto podria venir de una API en el futuro)
    // Por ahora mostramos 0
    document.getElementById('userPoints').textContent = '0';

    // Manejar logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        
        // Limpiar localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Redirigir al login
        window.location.href = '/login';
    });
});

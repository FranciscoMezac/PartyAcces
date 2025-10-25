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
        window.location.href = '/home-admin';
        return;
    }

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

/**
 * auth-nav.js
 * Script para actualizar dinámicamente el navbar superior según el estado de autenticación
 * Maneja los botones de login/logout y redirecciona según el rol del usuario
 */

(function initAuthNav() {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAuthNav);
  } else {
    setupAuthNav();
  }

  function setupAuthNav() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const navbarNav = document.getElementById('navbarNav');
    
    if (!navbarNav) return; // Página sin navbar

    // Si no hay sesión activa, mostrar login/registro (por defecto suele estar)
    if (!user || !token) {
      return; // Ya está configurado en HTML para usuarios sin sesión
    }

    // Usuario autenticado: actualizar navbar
    try {
      const userData = JSON.parse(user);
      const rol = userData.rol || 'USER';
      const currentPath = window.location.pathname;

      // Limpiar navbar y agregar enlaces de usuario autenticado
      navbarNav.innerHTML = '';

      // Link a home según el rol
      const homeLink = document.createElement('li');
      homeLink.className = 'nav-item';
      const homeA = document.createElement('a');
      homeA.className = 'nav-link';
      homeA.href = rol === 'ADMIN' ? '/home-admin' : '/home-usuario';
      homeA.textContent = 'Inicio';
      homeLink.appendChild(homeA);
      navbarNav.appendChild(homeLink);

      // Link a dashboard (solo admin, pero no si ya estás en dashboard)
      if (rol === 'ADMIN' && currentPath !== '/dashboard') {
        const dashLink = document.createElement('li');
        dashLink.className = 'nav-item';
        const dashA = document.createElement('a');
        dashA.className = 'nav-link';
        dashA.href = '/dashboard';
        dashA.textContent = 'Dashboard';
        dashLink.appendChild(dashA);
        navbarNav.appendChild(dashLink);
      }

      // Link de usuario/perfil
      const userLink = document.createElement('li');
      userLink.className = 'nav-item';
      const userA = document.createElement('a');
      userA.className = 'nav-link';
      userA.href = rol === 'ADMIN' ? '/perfil-admin' : '/perfil-usuario';
      userA.textContent = 'Mi perfil';
      userLink.appendChild(userA);
      navbarNav.appendChild(userLink);

      // Link de logout
      const logoutLink = document.createElement('li');
      logoutLink.className = 'nav-item';
      const logoutA = document.createElement('a');
      logoutA.className = 'nav-link';
      logoutA.href = '#';
      logoutA.textContent = 'Cerrar sesión';
      logoutA.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
      logoutLink.appendChild(logoutA);
      navbarNav.appendChild(logoutLink);

    } catch (err) {
      console.error('Error parsing user data:', err);
    }
  }

  function handleLogout() {
    if (!confirm('¿Cerrar sesión?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      logout();
      return;
    }

    // Intentar cerrar sesión en el servidor
    fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log('Logout response:', data);
        logout();
      })
      .catch(err => {
        console.error('Error en logout:', err);
        logout(); // Logout local aunque falle el servidor
      });
  }

  function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    window.location.href = '/';
  }
})();

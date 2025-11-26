// navigation.js — Bottom navigation genérica para todas las páginas
// Sin jQuery / sin frameworks

document.addEventListener('DOMContentLoaded', () => {
  loadNavigationData();
});

/* ========= Helpers de rutas ========= */
function normalizePath(p) {
  if (!p) return '/';
  // quita query y hash, y el slash final redundante
  p = p.split('#')[0].split('?')[0];
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

// Tratar estas rutas como “Inicio”
const HOME_ALIASES = new Set(['/', '/home', '/inicio', '/index.html']);

function isSameRoute(a, b) {
  a = normalizePath(a);
  b = normalizePath(b);
  if (HOME_ALIASES.has(a) && HOME_ALIASES.has(b)) return true;
  return a === b;
}

/**
 * Obtiene la ruta correcta de "home" según el rol del usuario
 * Si no hay sesión, devuelve '/' (index)
 */
function getHomeRoute() {
  try {
    const user = localStorage.getItem('user');
    if (!user) return '/';
    
    const userData = JSON.parse(user);
    const rol = userData.rol || 'USER';
    
    // Devolver la home correcta según el rol
    return rol === 'ADMIN' ? '/home-admin' : '/home-usuario';
  } catch (err) {
    console.warn('Error obteniendo home route:', err);
    return '/';
  }
}

/* ========= Fetch de datos ========= */
async function loadNavigationData() {
  try {
    const res = await fetch('/api/navigation', { headers: { 'Content-Type': 'application/json' } });
    const json = await res.json();
    if (!json || !json.success) {
      console.warn('navigation.js: respuesta inválida o sin success=true');
      return;
    }
    const { navigation, home } = json.data || {};

    renderBottomNavigation(Array.isArray(navigation) ? navigation : []);
    renderHomeContent(home || {}); // inofensivo si no estás en Home
  } catch (err) {
    console.error('navigation.js: error obteniendo /api/navigation', err);
  }
}

/* ========= Render de la bottom-nav ========= */
function renderBottomNavigation() {
  const container = document.getElementById('bottomNavContainer');
  if (!container) return; // página sin bottom-nav

  container.innerHTML = '';

  const currentPath = normalizePath(location.pathname || '/');
  const homeRoute = getHomeRoute();
  const profileRoute = getProfileRoute();

  // Detectar rol para cambiar el texto del item QR
  let rol = 'USER';
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const data = JSON.parse(raw);
      rol = data.rol || 'USER';
    }
  } catch (e) {
    console.warn('navigation.js: no se pudo leer rol de usuario');
  }

  let items;
  if (rol === 'ADMIN') {
    // Admin: Scanner en lugar de QR, sin duplicar
    items = [
      { label: 'Inicio', href: homeRoute, icon: 'home' },
      { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
      { label: 'Scanner', href: '/scanner', icon: 'scanner' },
      { label: 'Usuario', href: profileRoute, icon: 'usuario' }
    ];
  } else {
    // Cliente (USER): sin acceso directo a Dashboard ni Scanner
    items = [
      { label: 'Inicio', href: homeRoute, icon: 'home' },
      { label: 'QR', href: '/qr', icon: 'qr' },
      { label: 'Usuario', href: profileRoute, icon: 'usuario' }
    ];
  }
    items.forEach((item) => {
    const href = normalizePath(item.href);
    const isQr = isSameRoute(href, '/qr');

    // Para ADMIN: Ocultar Scanner en su propia vista
    // Para USER: SIEMPRE mostrar los 3 items (Inicio, QR, Usuario)
    if (rol === 'ADMIN' && isSameRoute(href, currentPath) && !isQr) {
      return;
    }
    const label = item?.label || '';
    const iconName = (item?.icon || '').toLowerCase();
    const iconSrc = item?.src || item?.icon_src || ''; // permitir backends distintos
    const a = document.createElement('a');
    a.href = href;
    a.className = 'nav-item';
    // Marcar activo la ruta actual
    if (isSameRoute(href, currentPath)) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }

    const iconWrap = document.createElement('div');
    iconWrap.className = 'nav-icon';
    iconWrap.appendChild(createIconElement(item.icon, ''));
    const span = document.createElement('span');
    span.className = 'nav-label';
    span.textContent = item.label;

    a.appendChild(iconWrap);
    a.appendChild(span);
    a.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      a.classList.add('active');
    });

    container.appendChild(a);
  });
}

/* ========= Iconos ========= */
// 1) si viene un src => <img>
// 2) si hay nombre conocido => emoji
// 3) fallback => document emoji
function createIconElement(name, src) {
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = name || 'icono';
    img.className = 'icon';
    return img;
  }
  const span = document.createElement('span');
  span.className = 'icon-emoji';
  span.textContent = getIconEmoji(name);
  return span;
}
function getIconEmoji(iconName) {
  const map = {
    home: '🏠',
    qr: '📱',
    scanner: '📷',
    dashboard: '📊',
    user: '👤',
    usuario: '👤',
    events: '🎉',
    eventos: '🎉',
    settings: '⚙️',
    ajustes: '⚙️'
  };
  return map[iconName] ?? '📄';
}

/* ========= Render del contenido Home (seguro si no existen nodos) ========= */
function renderHomeContent(homeData = {}) {
  // Título
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle && homeData.title) heroTitle.textContent = homeData.title;

  // Headline
  const heroHeadline = document.getElementById('heroHeadline');
  if (heroHeadline && homeData.hero?.headline) {
    heroHeadline.textContent = homeData.hero.headline;
  }

  // Subheadline
  const heroSubheadline = document.getElementById('heroSubheadline');
  if (heroSubheadline && homeData.hero?.subheadline) {
    heroSubheadline.textContent = homeData.hero.subheadline;
  }

   // Acciones (botones)
  const actionsContainer = document.getElementById('actionsContainer');
  if (actionsContainer && Array.isArray(homeData.actions)) {
    actionsContainer.innerHTML = '';
    homeData.actions.forEach(action => {
      const a = document.createElement('a');
      a.href = action.href || '#';
      a.className = action.primary ? 'btn btn-primary btn-lg me-2' : 'btn btn-outline-secondary btn-lg me-2';
      a.textContent = action.label || '';
      actionsContainer.appendChild(a);
    });
  }
}

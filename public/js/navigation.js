// JavaScript vanilla para navegación - Sin jQuery, sin frameworks
// Fetch API puro para obtener datos de navegación

document.addEventListener('DOMContentLoaded', async () => {
    await loadNavigationData();
});

// Función principal para cargar datos de navegación
async function loadNavigationData() {
    try {
        // Fetch API puro - NO usar jQuery
        const response = await fetch('/api/navigation', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            const { navigation, home } = result.data;
            
            // Renderizar navegación inferior
            renderBottomNavigation(navigation);
            
            // Renderizar contenido de home
            renderHomeContent(home);
        } else {
            console.error('Error al cargar navegación:', result.message);
        }
    } catch (error) {
        console.error('Error al obtener datos de navegación:', error);
    }
}

// Renderizar la navegación inferior con JavaScript vanilla
function renderBottomNavigation(navigationItems) {
    const container = document.getElementById('bottomNavContainer');
    
    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    // Crear items de navegación dinámicamente
    navigationItems.forEach(item => {
        const navItem = document.createElement('a');
        navItem.href = item.href;
        navItem.className = `nav-item ${item.active ? 'active' : ''}`;
        
        // Crear estructura del item
        const navIcon = document.createElement('div');
        navIcon.className = 'nav-icon';
        
        // Determinar el ícono
        if (item.icon === 'qr') {
            // Si es QR, usar imagen
            const img = document.createElement('img');
            img.src = '/public/images/fotoprueba.jpg';
            img.alt = 'QR';
            img.className = 'icon';
            navIcon.appendChild(img);
        } else {
            // Para otros iconos, usar emoji
            const iconEmoji = document.createElement('span');
            iconEmoji.className = 'icon-emoji';
            iconEmoji.textContent = getIconEmoji(item.icon);
            navIcon.appendChild(iconEmoji);
        }
        
        const navLabel = document.createElement('span');
        navLabel.className = 'nav-label';
        navLabel.textContent = item.label;
        
        navItem.appendChild(navIcon);
        navItem.appendChild(navLabel);
        
        // Event listener para marcar como activo
        navItem.addEventListener('click', (e) => {
            // Remover active de todos
            document.querySelectorAll('.nav-item').forEach(el => {
                el.classList.remove('active');
            });
            // Agregar active al clickeado
            navItem.classList.add('active');
        });
        
        container.appendChild(navItem);
    });
}

// Obtener emoji para el ícono
function getIconEmoji(iconName) {
    const icons = {
        'home': '🏠',
        'qr': '📱',
        'user': '👤',
        'events': '🎉',
        'settings': '⚙️'
    };
    return icons[iconName] || '📄';
}

// Renderizar contenido de home
function renderHomeContent(homeData) {
    // Actualizar título hero
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle && homeData.title) {
        heroTitle.textContent = homeData.title;
    }

    // Actualizar headline
    const heroHeadline = document.getElementById('heroHeadline');
    if (heroHeadline && homeData.hero && homeData.hero.headline) {
        heroHeadline.textContent = homeData.hero.headline;
    }

    // Actualizar subheadline
    const heroSubheadline = document.getElementById('heroSubheadline');
    if (heroSubheadline && homeData.hero && homeData.hero.subheadline) {
        heroSubheadline.textContent = homeData.hero.subheadline;
    }

    // Renderizar acciones (botones)
    const actionsContainer = document.getElementById('actionsContainer');
    if (actionsContainer && homeData.actions) {
        actionsContainer.innerHTML = '';
        
        homeData.actions.forEach(action => {
            const button = document.createElement('a');
            button.href = action.href;
            button.className = action.primary 
                ? 'btn btn-primary btn-lg me-2' 
                : 'btn btn-outline-secondary btn-lg me-2';
            button.textContent = action.label;
            actionsContainer.appendChild(button);
        });
    }
}

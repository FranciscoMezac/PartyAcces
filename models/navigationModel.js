// Modelo de navegación - Retorna datos de navegación del sistema
// Sin usar servicios externos, todo en POO

class NavigationModel {
    // Obtener items de navegación principal
    static getNavigationItems() {
        return [
            {
                label: 'Inicio',
                href: '/',
                icon: 'home',
                active: true
            },
            {
                label: 'QR',
                href: '/qr',
                icon: 'qr',
                active: false
            },
            {
                label: 'Usuario',
                href: '/login',
                icon: 'user',
                active: false
            }
        ];
    }

    // Obtener configuración de la página de inicio
    static getHomeConfig() {
        return {
            title: 'Bienvenido a PartyAccess',
            hero: {
                headline: 'Listado de productos en carrusel',
                subheadline: 'Listado de productos en carrusel',
            },
            actions: [
                { href: '#', label: 'Generar cupón', primary: true }
            ]
        };
    }

    // Obtener item de navegación activo por ruta
    static getActiveNavigation(currentPath) {
        const items = this.getNavigationItems();
        return items.map(item => ({
            ...item,
            active: item.href === currentPath
        }));
    }
}

module.exports = NavigationModel;

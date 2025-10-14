const NavigationModel = require('../models/navigationModel');

// Controlador de Home - Maneja la página principal con navegación
class HomeController {
    // Servir página de inicio
    static index(req, res) {
        try {
            // En MVC puro, no podemos pasar datos directamente a la vista
            // La vista debe obtener los datos via API
            const fs = require('fs');
            const path = require('path');
            const viewPath = path.join(__dirname, '../views', 'home.html');
            
            fs.readFile(viewPath, 'utf8', (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 - Vista no encontrada');
                    return;
                }
                
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
        } catch (error) {
            console.error('Error en HomeController.index:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error interno del servidor');
        }
    }

    // API para obtener configuración de navegación
    static async getNavigationData(req, res) {
        try {
            const navigationItems = NavigationModel.getNavigationItems();
            const homeConfig = NavigationModel.getHomeConfig();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                data: {
                    navigation: navigationItems,
                    home: homeConfig
                }
            }));
        } catch (error) {
            console.error('Error en HomeController.getNavigationData:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: 'Error al obtener datos de navegación'
            }));
        }
    }
}

module.exports = HomeController;

const fs = require('fs');
const path = require('path');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const HomeController = require('../controllers/homeController');

// Definición de rutas
const routes = {
    'GET': {
        '/': serveView('index.html'),            // << antes: HomeController.index
        '/home': serveView('home.html'),
        '/home_client': serveView('home_client.html'),
        '/home_admin': serveView('home_admin.html'),
        '/login': serveView('login.html'),
        '/register': serveView('register.html'),
        '/dashboard': serveView('dashboard.html'),
        '/qr': serveView('qr.html'),
        '/api/users': (req, res) => userController.getAllUsers(req, res),
        '/api/navigation': HomeController.getNavigationData
    },
    'POST': {
        '/api/login': (req, res) => userController.login(req, res),
        '/api/register': (req, res) => authController.register(req, res),
        '/api/users': (req, res) => userController.createUser(req, res),
        '/api/check-email': (req, res) => authController.checkEmail(req, res)
    }
};

// Función auxiliar para servir vistas HTML
function serveView(viewName) {
    return (req, res) => {
        const viewPath = path.join(__dirname, '../views', viewName);
        
        fs.readFile(viewPath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 - Vista no encontrada');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    };
}

// Manejador principal de rutas
function handleRequest(req, res, pathname) {
    const method = req.method;
    
    // Buscar la ruta correspondiente
    if (routes[method] && routes[method][pathname]) {
        routes[method][pathname](req, res);
    } else {
        // Ruta no encontrada
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Ruta no encontrada',
            path: pathname,
            method: method
        }));
    }
}

module.exports = {
    handleRequest
};

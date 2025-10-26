const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Importar clases (no instancias)
const UsuarioRepository = require('../repositories/UsuarioRepository');
const CuentaPuntosRepository = require('../repositories/CuentaPuntosRepository');
const SessionRepository = require('../repositories/SessionRepository');
const AuthService = require('../services/AuthService');
const PerfilService = require('../services/PerfilService');
const AuthController = require('../controllers/authController');
const PerfilController = require('../controllers/perfilController');
const userController = require('../controllers/userController');
const HomeController = require('../controllers/homeController');

// Definición de rutas
const routes = {
    'GET': {
        '/': HomeController.index,
        '/home': HomeController.index,
        '/login': serveView('login.html'),
        '/register': serveView('register.html'),
        '/dashboard': serveView('dashboard.html'),
        '/api/users': userController.getAllUsers,
        '/api/navigation': HomeController.getNavigationData
    },
    'POST': {
        '/api/login': userController.login,
        '/api/users': userController.createUser
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

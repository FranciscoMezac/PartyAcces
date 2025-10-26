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

// Instanciar Repositorios (inyectando conexión DB)
const usuarioRepository = new UsuarioRepository(db);
const cuentaPuntosRepository = new CuentaPuntosRepository(db);
const sessionRepository = new SessionRepository(db);

// Instanciar Servicios (inyectando repositorios)
const authService = new AuthService(usuarioRepository, cuentaPuntosRepository, sessionRepository);
const perfilService = new PerfilService(usuarioRepository, sessionRepository);

// Instanciar Controladores (inyectando servicios)
const authController = new AuthController(authService);
const perfilController = new PerfilController(perfilService);

// Definición de rutas
const routes = {
    'GET': {
        '/': HomeController.index,
        '/home': HomeController.index,
        '/login': serveView('login.html'),
        '/register': serveView('register.html'),
        '/dashboard': serveView('dashboard.html'),
        '/qr': serveView('qr.html'),
        '/reset-password': serveView('reset-password.html'),
        '/home-usuario': serveView('home-usuario.html'),
        '/home-admin': serveView('home-admin.html'),
        '/perfil-usuario': serveView('perfil-usuario.html'),
        '/perfil-admin': serveView('perfil-admin.html'),
        '/editar-perfil': serveView('editar-perfil.html'),
        '/api/users': (req, res) => userController.getAllUsers(req, res),
        '/api/perfil': (req, res) => perfilController.obtenerPerfil(req, res),
        '/api/navigation': HomeController.getNavigationData
    },
    'POST': {
        '/api/login': (req, res) => authController.login(req, res),
        '/api/logout': (req, res) => authController.logout(req, res),
        '/api/register': (req, res) => authController.register(req, res),
        '/api/users': (req, res) => userController.createUser(req, res),
        '/api/check-email': (req, res) => authController.checkEmail(req, res),
        '/api/reset-password': (req, res) => authController.resetPassword(req, res)
    },
    'PATCH': {
        '/api/perfil': (req, res) => perfilController.actualizarPerfil(req, res)
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

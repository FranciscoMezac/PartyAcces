const fs = require('fs');
const path = require('path');
const userController = require('../controllers/userController');

// Definición de rutas
const routes = {
    'GET': {
        '/': serveView('index.html'),
        '/login': serveView('login.html'),
        '/dashboard': serveView('dashboard.html'),
        '/api/users': userController.getAllUsers
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

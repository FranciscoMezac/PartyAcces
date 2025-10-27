const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Controladores en uso
const UsuariosController = require('../controllers/usuariosController');
const HomeController = require('../controllers/homeController');

// Definición de rutas
const routes = {
    'GET': {
        '/': HomeController.index,
        '/home': HomeController.index,
        '/login': serveView('login.html'),
        '/register': serveView('register.html'),
        '/dashboard': serveView('dashboard.html'),
        '/puntos/acumular': serveView('puntos_acumular.html'),
        '/puntos/canjear': serveView('puntos_canjear.html'),
        '/puntos/historial': serveView('puntos_historial.html'),
        '/api/usuarios': UsuariosController.listar,
        '/api/navigation': HomeController.getNavigationData,
        '/_db/health': async (_req, res) => {
            try {
                const info = await db.healthCheck();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, info }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
        },
        '/health': async (_req, res) => {const info = await db.healthCheck();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, info }));
        },
        '/api/health': async (_req, res) => {
            const info = await db.healthCheck();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, info }));
        },
        // Catálogo de productos para canje
        '/api/productos': async (_req, res) => {
            try {
                const r = await db.query(
                    'SELECT id, nombre, puntos_requeridos FROM productos WHERE activo = TRUE ORDER BY puntos_requeridos ASC, nombre ASC'
                );
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: r.rows }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        },
        '/api/puntos/historial': require('../controllers/puntosController').historial,
    },
    'POST': {
        '/api/usuarios/bloquear': UsuariosController.bloquear,
        '/api/puntos/acumular': require('../controllers/puntosController').acumular,
        '/api/puntos/canjear': require('../controllers/puntosController').canjear
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

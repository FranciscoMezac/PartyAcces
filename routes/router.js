const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Importar repositorios y servicios
const UsuarioRepository = require('../repositories/UsuarioRepository');
const SessionRepository = require('../repositories/SessionRepository');
const CuentaPuntosRepository = require('../repositories/CuentaPuntosRepository');
const QrRepository = require('../repositories/QrRepository');
const AccesoRepository = require('../repositories/AccesoRepository');
const HistorialCierreRepository = require('../repositories/HistorialCierreRepository');
const AuthService = require('../services/AuthService');
const PerfilService = require('../services/PerfilService');
const QrService = require('../services/QrService');
const AccesoService = require('../services/AccesoService');
const PanelService = require('../services/PanelService');
const AccesosService = require('../services/AccesosService');
const HistorialService = require('../services/HistorialService');

// Importar controladores
const UsuariosController = require('../controllers/usuariosController');
const HomeController = require('../controllers/homeController');
const AuthController = require('../controllers/authController');
const PerfilController = require('../controllers/perfilController');
const QrController = require('../controllers/qrController');
const AccesoController = require('../controllers/accesoController');
const PanelController = require('../controllers/panelController');
const AccesosController = require('../controllers/accesosController');
const HistorialController = require('../controllers/historialController');

// Instanciar dependencias para AuthController
const usuarioRepository = new UsuarioRepository(db);
const sessionRepository = new SessionRepository(db);
const cuentaPuntosRepository = new CuentaPuntosRepository(db);
const authService = new AuthService(usuarioRepository, cuentaPuntosRepository, sessionRepository);
const authController = new AuthController(authService);

// Instanciar dependencias para PerfilController
const perfilService = new PerfilService(usuarioRepository, sessionRepository, cuentaPuntosRepository);
const perfilController = new PerfilController(perfilService);

// Instanciar dependencias para QrController
const qrRepository = new QrRepository(db);
const qrService = new QrService(usuarioRepository, qrRepository, sessionRepository);
const qrController = new QrController(qrService);

// Instanciar dependencias para AccesoController
const accesoRepository = new AccesoRepository(db);
const accesoService = new AccesoService(qrRepository, accesoRepository, usuarioRepository);
const accesoController = new AccesoController(accesoService);

// Instanciar dependencias para PanelController
const panelService = new PanelService(accesoRepository, usuarioRepository);
const panelController = new PanelController(panelService);

// Instanciar dependencias para AccesosController (cierre de jornada)
const historialCierreRepository = new HistorialCierreRepository(db);
const accesosService = new AccesosService(accesoRepository, historialCierreRepository);
const accesosController = new AccesosController(accesosService);

// Instanciar dependencias para HistorialController
const historialService = new HistorialService(historialCierreRepository, accesoRepository);
const historialController = new HistorialController(historialService);

// Definición de rutas
const routes = {
    'GET': {
        '/': serveView('index.html'),            // << antes: HomeController.index
        '/home': serveView('home.html'),
        '/home_client': serveView('home_client.html'),
        '/home_admin': serveView('home_admin.html'),
        '/login': serveView('login.html'),
        '/usuario': serveView('login.html'),
        '/register': serveView('register.html'),
        '/dashboard': serveView('dashboard.html'),
        '/home-usuario': serveView('home-usuario.html'),
        '/home-admin': serveView('home-admin.html'),
        '/perfil-usuario': serveView('perfil-usuario.html'),
        '/perfil-admin': serveView('perfil-admin.html'),
        '/editar-perfil': serveView('editar-perfil.html'),
        '/reset-password': serveView('reset-password.html'),
        '/qr': serveView('qr.html'),
        '/scanner': serveView('scanner.html'),
        '/historial-cierres': serveView('historial-cierres.html'),
        '/puntos/acumular': serveView('puntos_acumular.html'),
        '/puntos/canjear': serveView('puntos_canjear.html'),
        '/puntos/historial': serveView('puntos_historial.html'),
        
        // API de usuarios
        '/api/usuarios': UsuariosController.listar,
        
        // API de perfil
        '/api/perfil': (req, res) => perfilController.obtenerPerfil(req, res),
        
        // API de navegación
        '/api/navigation': HomeController.getNavigationData,
        
        // API de panel de ingresados
        '/api/panel/ingresos': (req, res) => panelController.obtenerIngresos(req, res),
        
        // API de historial de cierres
        '/api/historial/cierres': (req, res) => historialController.obtenerHistorial(req, res),
        '/api/historial/estadisticas': (req, res) => historialController.obtenerEstadisticas(req, res),
        '/api/historial/usuarios/:fecha': (req, res) => historialController.obtenerUsuariosPorFecha(req, res),
        
        // Health checks
        '/health': async (_req, res) => {
            try {
                const info = await db.healthCheck();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, info }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
        },
        '/api/health': async (_req, res) => {
            try {
                const info = await db.healthCheck();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, info }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
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
        
        // Historial de puntos
        '/api/puntos/historial': require('../controllers/puntosController').historial,
        // Saldo actual y stream SSE
        '/api/puntos/saldo': require('../controllers/puntosController').saldo,
        '/api/puntos/saldo/stream': require('../controllers/puntosController').saldoStream,
    },
    'POST': {
        // Autenticación (usar /api/register como ruta principal)
        '/api/register': (req, res) => authController.register(req, res),
        '/api/login': (req, res) => authController.login(req, res),
        '/api/logout': (req, res) => authController.logout(req, res),
        '/api/reset-password': (req, res) => authController.resetPassword(req, res),
        
        // Gestión de usuarios (admin)
        '/api/usuarios/bloquear': UsuariosController.bloquear,
        
        // Puntos
        '/api/puntos/acumular': require('../controllers/puntosController').acumular,
        '/api/puntos/canjear': require('../controllers/puntosController').canjear
        ,
        // QR
        '/api/qr/generar': (req, res) => qrController.generarQR(req, res)
        ,
        // Acceso
        '/api/acceso/validar': (req, res) => accesoController.validarAcceso(req, res)
        ,
        // Cierre de jornada (llamado por scheduler)
        '/internal/accesos/cierre-jornada': (req, res) => accesosController.cerrarJornada(req, res)
    },
    'PATCH': {
        // Perfil
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
    
    // Buscar la ruta correspondiente (exacta primero)
    if (routes[method] && routes[method][pathname]) {
        routes[method][pathname](req, res);
        return;
    }
    
    // Buscar rutas con parámetros
    if (routes[method]) {
        for (const route in routes[method]) {
            const paramMatch = matchRoute(route, pathname);
            if (paramMatch) {
                req.params = paramMatch.params;
                routes[method][route](req, res);
                return;
            }
        }
    }
    
    // Ruta no encontrada
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        error: 'Ruta no encontrada',
        path: pathname,
        method: method
    }));
}

// Función para hacer match de rutas con parámetros
function matchRoute(routePattern, pathname) {
    const routeParts = routePattern.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    
    if (routeParts.length !== pathParts.length) {
        return null;
    }
    
    const params = {};
    
    for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
            // Es un parámetro
            const paramName = routeParts[i].substring(1);
            params[paramName] = pathParts[i];
        } else if (routeParts[i] !== pathParts[i]) {
            // No coincide
            return null;
        }
    }
    
    return { params };
}

module.exports = {
    handleRequest
};

const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const url = require('url');

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
const RecommendController = require('../controllers/recommendController');
const TrackingController = require('../controllers/trackingController');

// Instanciar dependencias para AuthController
const usuarioRepository = new UsuarioRepository(db);
const sessionRepository = new SessionRepository(db);
const cuentaPuntosRepository = new CuentaPuntosRepository(db);
const authService = new AuthService(usuarioRepository, cuentaPuntosRepository, sessionRepository);
const authController = new AuthController(authService);

// Instanciar dependencias para PerfilController
const perfilService = new PerfilService(usuarioRepository, sessionRepository, cuentaPuntosRepository);
const perfilController = new PerfilController(perfilService);
const recommendController = new RecommendController();
const trackingController = new TrackingController();

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
        '/api/recommend/local': (req, res) => recommendController.localForUser(req, res),
        
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
        '/api/productos': async (req, res) => {
            try {
                const urlLib = require('url');
                const parsed = urlLib.parse(req.url, true);
                const { page = '1', pageSize = '8', category, q } = parsed.query;

                const checkCol = async (col) => {
                    const r = await db.query(
                        `SELECT 1 FROM information_schema.columns
                         WHERE table_schema = 'public' AND table_name = 'productos' AND column_name = $1
                         LIMIT 1`, [col]
                    );
                    return r.rowCount > 0;
                };

                const hasAlgolia = await checkCol('algolia_object_id');
                const hasStock = await checkCol('stock');
                const hasCategory = await checkCol('category');

                // Build WHERE conditions
                const where = [];
                const params = [];
                where.push('activo = TRUE');
                if (hasStock) where.push('(stock IS NULL OR stock > 0)');
                if (hasCategory && category) { params.push(category); where.push(`category = $${params.length}`); }
                if (q) { params.push(`%${q}%`); where.push(`unaccent(lower(nombre)) LIKE unaccent(lower($${params.length}))`); }

                const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

                // Pagination
                const pg = Math.max(1, parseInt(page, 10) || 1);
                const ps = Math.max(1, Math.min(48, parseInt(pageSize, 10) || 8));
                const offset = (pg - 1) * ps;

                // Total count
                const cnt = await db.query(`SELECT COUNT(*)::int AS total FROM productos ${whereSql}`, params);
                const total = cnt.rows[0]?.total ?? 0;

                // Query rows
                const selectFields = [
                    'id',
                    'nombre',
                    'puntos_requeridos',
                    hasCategory ? 'category' : "NULL::varchar AS category",
                    hasStock ? 'stock' : "NULL::int AS stock",
                    hasAlgolia ? 'COALESCE(algolia_object_id::text, id::text) AS algolia_object_id' : 'id::text AS algolia_object_id'
                ].join(', ');

                const r = await db.query(
                    `SELECT ${selectFields}
                     FROM productos
                     ${whereSql}
                     ORDER BY puntos_requeridos ASC, nombre ASC
                     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                    [...params, ps, offset]
                );

                // Categories for filter
                let categories = [];
                if (hasCategory) {
                    const cr = await db.query(`SELECT DISTINCT category FROM productos WHERE category IS NOT NULL ORDER BY category ASC`);
                    categories = cr.rows.map(r => r.category);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    data: r.rows,
                    meta: { page: pg, pageSize: ps, total, pages: Math.max(1, Math.ceil(total / ps)), category: category || null, q: q || null },
                    categories
                }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        },

        // Config pública (exponer claves seguras para frontend)
        '/api/public-config': (_req, res) => {
            const payload = {
                algolia: {
                    appId: process.env.ALGOLIA_APP_ID || '',
                    searchApiKey: process.env.ALGOLIA_SEARCH_API_KEY || '',
                    indexProducts: process.env.ALGOLIA_INDEX_PRODUCTS || ''
                }
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(payload));
        },
        

        // Endpoints de diagnóstico de Algolia (solo DEV)
        '/debug/algolia/settings': async (req, res) => {
            try {
                const appId = process.env.ALGOLIA_APP_ID;
                const apiKey = process.env.ALGOLIA_SEARCH_API_KEY;
                const parsed = url.parse(req.url, true);
                const indexName = (parsed.query.index || process.env.ALGOLIA_INDEX_PRODUCTS || '').toString();

                if (!appId || !apiKey || !indexName) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ ok: false, error: 'Faltan variables ALGOLIA_* en .env o index.' }));
                }
                const hosts = [
                    `${appId}-dsn.algolianet.com`,
                    `${appId}-dsn.algolia.net`,
                    `${appId}-1.algolianet.com`,
                    `${appId}-2.algolianet.com`,
                    `${appId}-3.algolianet.com`
                ];
                const errors = [];
                let success = null;
                for (const host of hosts) {
                    try {
                        const r = await fetch(`https://${host}/1/indexes/${encodeURIComponent(indexName)}/settings`, {
                            headers: {
                                'x-algolia-application-id': appId,
                                'x-algolia-api-key': apiKey
                            }
                        });
                        const json = await r.json().catch(() => ({}));
                        if (r.ok || r.status !== 0) {
                            success = { host, status: r.status, ok: r.ok, json };
                            break;
                        }
                        errors.push({ host, status: r.status, reason: 'non-ok response', json });
                    } catch (e) {
                        errors.push({ host, error: e.message || String(e) });
                    }
                }
                if (success) {
                    res.writeHead(success.status, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ ...success, indexName }));
                }
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, indexName, errors }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
        },

        '/debug/algolia/recommend': async (req, res) => {
            try {
                const appId = process.env.ALGOLIA_APP_ID;
                const apiKey = process.env.ALGOLIA_SEARCH_API_KEY;
                const parsed = url.parse(req.url, true);
                const indexName = (parsed.query.index || process.env.ALGOLIA_INDEX_PRODUCTS || '').toString();
                const objectID = (parsed.query.objectID || '').toString();

                if (!appId || !apiKey || !indexName || !objectID) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ ok: false, error: 'Requiere ALGOLIA_* e ?objectID=...' }));
                }

                const hosts = [
                    `${appId}-dsn.algolianet.com`,
                    `${appId}-dsn.algolia.net`,
                    `${appId}-1.algolianet.com`,
                    `${appId}-2.algolianet.com`,
                    `${appId}-3.algolianet.com`
                ];
                const threshold = Number(parsed.query.threshold ?? 70); // 0-100
                const body = {
                    requests: [{ indexName, objectID, model: 'looking-similar', threshold, maxRecommendations: 8 }]
                };
                const errors = [];
                let success = null;
                for (const host of hosts) {
                    try {
                        const r = await fetch(`https://${host}/1/indexes/*/recommendations`, {
                            method: 'POST',
                            headers: {
                                'x-algolia-application-id': appId,
                                'x-algolia-api-key': apiKey,
                                'content-type': 'application/json'
                            },
                            body: JSON.stringify(body)
                        });
                        const json = await r.json().catch(() => ({}));
                        if (r.ok || r.status !== 0) {
                            success = { host, status: r.status, ok: r.ok, json };
                            break;
                        }
                        errors.push({ host, status: r.status, reason: 'non-ok response', json });
                    } catch (e) {
                        errors.push({ host, error: e.message || String(e) });
                    }
                }
                if (success) {
                    res.writeHead(success.status, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ ...success, indexName, objectID, threshold }));
                }
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, indexName, objectID, threshold, errors }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
        },

        // API: Proxy server-side para evitar bloqueos DNS/CORS en el navegador
        // GET /api/recommend/looking-similar?objectID=XXX&threshold=70&index=dev_productos
        '/api/recommend/looking-similar': async (req, res) => {
            try {
                const appId = process.env.ALGOLIA_APP_ID;
                const apiKey = process.env.ALGOLIA_SEARCH_API_KEY;
                const parsed = url.parse(req.url, true);
                const indexName = (parsed.query.index || process.env.ALGOLIA_INDEX_PRODUCTS || '').toString();
                const objectID = (parsed.query.objectID || '').toString();
                const baseThreshold = Number(parsed.query.threshold ?? 70);
                const category = parsed.query.category ? String(parsed.query.category) : null;
                const nofilters = parsed.query.nofilters === '1';

                if (!appId || !apiKey || !indexName || !objectID) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ ok: false, error: 'Parámetros requeridos: objectID e índice; y variables ALGOLIA_*' }));
                }

                const hosts = [
                    `${appId}-dsn.algolianet.com`,
                    `${appId}-dsn.algolia.net`,
                    `${appId}-1.algolianet.com`,
                    `${appId}-2.algolianet.com`,
                    `${appId}-3.algolianet.com`
                ];
                const thresholds = [baseThreshold, 50, 30, 10].filter((v,i,self)=> Number.isFinite(v) && self.indexOf(v)===i);

                let final = null;
                for (const th of thresholds) {
                    // probar varios hosts para cada threshold
                    let success = null;
                    for (const host of hosts) {
                        try {
                            const reqPayload = {
                                indexName,
                                objectID,
                                model: 'looking-similar',
                                threshold: th,
                                maxRecommendations: 8
                            };
                            if (!nofilters) {
                                reqPayload.queryParameters = { optionalFilters: ['activo:true', 'stock>0'] };
                                if (category) {
                                    reqPayload.queryParameters.facetFilters = [[`category:${category}`]];
                                }
                            }
                            const body = { requests: [reqPayload] };
                            const r = await fetch(`https://${host}/1/indexes/*/recommendations`, {
                                method: 'POST',
                                headers: {
                                    'x-algolia-application-id': appId,
                                    'x-algolia-api-key': apiKey,
                                    'content-type': 'application/json'
                                },
                                body: JSON.stringify(body)
                            });
                            const json = await r.json().catch(() => ({}));
                            if (r.ok || r.status !== 0) {
                                success = { host, status: r.status, ok: r.ok, json };
                                break;
                            }
                        } catch (_) { /* intenta siguiente host */ }
                    }
                    if (success) {
                        const hits = success.json?.results?.[0]?.hits ?? [];
                        if (hits.length > 0) {
                            final = { threshold: th, host: success.host, hits };
                            break;
                        } else {
                            final = final || { threshold: th, host: success.host, hits: [] };
                        }
                    }
                }
                if (!final) {
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ ok: false, error: 'No se pudo contactar a Algolia Recommend' }));
                }

                // Fallback: si no hay resultados tras probar thresholds, intenta related-products
                if (!final.hits || final.hits.length === 0) {
                    let rpSuccess = null;
                    for (const host of hosts) {
                        try {
                            const rpPayload = {
                                indexName,
                                objectID,
                                model: 'related-products',
                                maxRecommendations: 8
                            };
                            if (!nofilters) {
                                rpPayload.queryParameters = { optionalFilters: ['activo:true', 'stock>0'] };
                                if (category) {
                                    rpPayload.queryParameters.facetFilters = [[`category:${category}`]];
                                }
                            }
                            const r = await fetch(`https://${host}/1/indexes/*/recommendations`, {
                                method: 'POST',
                                headers: {
                                    'x-algolia-application-id': appId,
                                    'x-algolia-api-key': apiKey,
                                    'content-type': 'application/json'
                                },
                                body: JSON.stringify({ requests: [rpPayload] })
                            });
                            const json = await r.json().catch(() => ({}));
                            if (r.ok || r.status !== 0) {
                                rpSuccess = { host, status: r.status, ok: r.ok, json };
                                break;
                            }
                        } catch (_) { /* siguiente host */ }
                    }
                    let hits = rpSuccess?.json?.results?.[0]?.hits ?? [];
                    if (!hits.length) {
                        try {
                            // Fallback final desde BD: sugerencias por categoría o aleatorias
                            const params = [];
                            let sql = `SELECT id::text AS "objectID", nombre AS name, image_url AS image, puntos_requeridos AS price, url,
                                              category, brand, tags
                                       FROM productos
                                       WHERE activo = TRUE AND (stock IS NULL OR stock > 0)`;
                            if (category) { sql += ' AND category = $1'; params.push(category); }
                            sql += ' ORDER BY random() LIMIT 8';
                            const r = await db.query(sql, params);
                            hits = r.rows;
                        } catch (_) { /* ignora error de BD */ }
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ ok: true, indexName, objectID, thresholdTried: thresholds, usedThreshold: final.threshold, fallbackModel: 'related-products|db', hits }));
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, indexName, objectID, thresholdTried: thresholds, usedThreshold: final.threshold, hits: final.hits }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
        },

        // Recomendaciones personalizadas: Trending + Personalization
        // GET /api/recommend/for-you?index=dev_productos&category=Comida
        // Lee userToken desde query ?userToken=... o header 'x-user-token'
        '/api/recommend/for-you': async (req, res) => {

            try {
                const appId = process.env.ALGOLIA_APP_ID;
                const apiKey = process.env.ALGOLIA_SEARCH_API_KEY;
                const parsed = url.parse(req.url, true);
                const indexName = (parsed.query.index || process.env.ALGOLIA_INDEX_PRODUCTS || '').toString();
                const category = parsed.query.category ? String(parsed.query.category) : null;
                const nofilters = parsed.query.nofilters === '1';
                const userToken = (parsed.query.userToken || req.headers['x-user-token'] || 'guest').toString();

                if (!appId || !apiKey || !indexName) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ ok: false, error: 'Faltan variables ALGOLIA_* o index.' }));
                }

                const hosts = [
                    `${appId}-dsn.algolianet.com`,
                    `${appId}-dsn.algolia.net`,
                    `${appId}-1.algolianet.com`,
                    `${appId}-2.algolianet.com`,
                    `${appId}-3.algolianet.com`
                ];

                let success = null;
                for (const host of hosts) {
                    try {
                        const payload = {
                            indexName,
                            model: 'trending-items',
                            maxRecommendations: 8
                        };
                        if (!nofilters) {
                            payload.queryParameters = { optionalFilters: ['activo:true', 'stock>0'] };
                            if (category) {
                                payload.queryParameters.facetFilters = [[`category:${category}`]];
                            }
                        }
                        const r = await fetch(`https://${host}/1/indexes/*/recommendations`, {
                            method: 'POST',
                            headers: {
                                'x-algolia-application-id': appId,
                                'x-algolia-api-key': apiKey,
                                'x-algolia-user-token': userToken,
                                'content-type': 'application/json'
                            },
                            body: JSON.stringify({ requests: [payload] })
                        });
                        const json = await r.json().catch(() => ({}));
                        if (r.ok || r.status !== 0) { success = { host, status: r.status, json }; break; }
                    } catch (_) { /* intenta siguiente host */ }
                }

                let hits = success?.json?.results?.[0]?.hits ?? [];

                // Fallback a related-products (usa el último seleccionado si llega por header/query)
                if (!hits.length) {
                    const rpPayload = {
                        indexName,
                        model: 'related-products',
                        maxRecommendations: 8
                    };
                    if (!nofilters) {
                        rpPayload.queryParameters = { optionalFilters: ['activo:true', 'stock>0'] };
                        if (category) rpPayload.queryParameters.facetFilters = [[`category:${category}`]];
                    }
                    for (const host of hosts) {
                        try {
                            const r = await fetch(`https://${host}/1/indexes/*/recommendations`, {
                                method: 'POST',
                                headers: {
                                    'x-algolia-application-id': appId,
                                    'x-algolia-api-key': apiKey,
                                    'x-algolia-user-token': userToken,
                                    'content-type': 'application/json'
                                },
                                body: JSON.stringify({ requests: [rpPayload] })
                            });
                            const json = await r.json().catch(() => ({}));
                            hits = json?.results?.[0]?.hits ?? [];
                            if (hits.length) break;
                        } catch (_) {}
                    }
                }

                // Fallback final desde BD (por categoría o aleatorio)
                if (!hits.length) {
                    try {
                        const params = [];
                        let sql = `SELECT id::text AS "objectID", nombre AS name, image_url AS image, puntos_requeridos AS price, url,
                                          category, brand, tags
                                   FROM productos
                                   WHERE activo = TRUE AND (stock IS NULL OR stock > 0)`;
                        if (category) { sql += ' AND category = $1'; params.push(category); }
                        sql += ' ORDER BY random() LIMIT 8';
                        const r = await db.query(sql, params);
                        hits = r.rows;
                    } catch (_) {}
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, indexName, userToken, hits }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
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
        '/api/puntos/canjear': require('../controllers/puntosController').canjear,
        
        // QR
        '/api/qr/generar': (req, res) => qrController.generarQR(req, res),
        
        // Acceso
        '/api/acceso/validar': (req, res) => accesoController.validarAcceso(req, res),
        
        // Cierre de jornada manual (guardado de panel)
        '/api/accesos/guardar-panel': (req, res) => accesosController.cerrarJornada(req, res),
        
        // Tracking de eventos
        '/api/tracking/events': (req, res) => trackingController.registrar(req, res)
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

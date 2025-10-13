const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const router = require('./routes/router');
const config = require('./config/settings');

// Crear servidor HTTP
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Servir archivos estáticos desde /public
    if (pathname.startsWith('/public/')) {
        serveStaticFile(pathname, res);
        return;
    }
    
    // Parsear el cuerpo de la petición para POST
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        // Adjuntar el body parseado al request
        try {
            req.body = body ? JSON.parse(body) : {};
        } catch (error) {
            req.body = {};
        }
        
        // Delegar al router
        router.handleRequest(req, res, pathname);
    });
});

// Función para servir archivos estáticos
function serveStaticFile(pathname, res) {
    const filePath = path.join(__dirname, pathname);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 - Archivo no encontrado');
            return;
        }
        
        // Determinar el tipo de contenido
        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        
        const contentType = contentTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Iniciar servidor
server.listen(config.port, config.host, () => {
    console.log(`🚀 Servidor corriendo en http://${config.host}:${config.port}`);
    console.log(`📁 Archivos estáticos desde: ${path.join(__dirname, 'public')}`);
});

module.exports = server;

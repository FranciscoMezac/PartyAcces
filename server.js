// Entry point de la aplicaciÃ³n.
// Carga variables de entorno y delega el arranque a app.js

// 1) Cargar .env antes que cualquier require que use process.env
try {
  const fs = require('fs');
  const dotenv = require('dotenv');
  // Intenta .env por defecto
  dotenv.config();
  // Si existe un archivo llamado "env" (sin punto), cÃ¡rgalo tambiÃ©n
  if (fs.existsSync('./env')) {
    dotenv.config({ path: './env' });
  }
} catch (_) {
  // dotenv es opcional si ya defines variables en el entorno
}

// 2) Aplicar overrides de entorno a la configuraciÃ³n si estÃ¡ disponible
try {
  const cfg = require('./config/settings');
  if (process.env.HOST) cfg.host = process.env.HOST;
  if (process.env.PORT) cfg.port = Number(process.env.PORT);
  if (process.env.NODE_ENV) cfg.environment = process.env.NODE_ENV;
} catch (_) {
  // Si no existe settings.js, continuamos; app.js podrÃ­a manejarlo
}

// 3) Requerir el servidor HTTP existente (app.js crea y arranca el server)
module.exports = require('./app.js');



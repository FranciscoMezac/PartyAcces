const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL mediante variables de entorno
// Carga previa de .env se realiza en server.js
const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      ssl
    });

// Función auxiliar para ejecutar queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

// Obtener un cliente del pool (para transacciones manuales)
async function getClient() {
  return pool.connect();
}

async function healthCheck() {
  const r = await pool.query('SELECT NOW() as now');
  return { now: r.rows[0].now };
}

module.exports = { query, getClient, pool, healthCheck };

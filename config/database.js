const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env y (si existe) desde 'env'
try {
  require('dotenv').config();
  const envPath = path.join(process.cwd(), 'env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
} catch (_) { /* noop */ }

// Permitir variables tipo PG* además de DB_*
const ssl = (process.env.DB_SSL === 'true' || process.env.PGSSL === 'true')
  ? { rejectUnauthorized: false }
  : undefined;

const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;

const conf = connectionString
  ? { connectionString, ssl }
  : {
      user: process.env.DB_USER || process.env.PGUSER || 'tu_usuario',
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      database: process.env.DB_NAME || process.env.PGDATABASE || 'partyaccess',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'tu_password',
      port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
      ssl
    };

// Aviso si se está usando la config por defecto (ayuda a detectar .env no cargado)
if (conf.user === 'tu_usuario') {
  console.warn('[DB] Advertencia: usando credenciales por defecto. ¿Está configurado .env? Variables esperadas: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
}

const pool = new Pool(conf);

async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query ejecutada:', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Error en query:', error);
        throw error;
    }
}

// Función para obtener una conexión del pool
async function getClient() {
  return pool.connect();
}

async function healthCheck() {
  const r = await pool.query('SELECT NOW() as now');
  return { now: r.rows[0].now };
}

async function withTransaction(work) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await work(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    query,
    getClient,
    pool,
    healthCheck,
    withTransaction
};

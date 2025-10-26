const { Pool } = require('pg');
require('dotenv/config');

const ssl = process.env.DB_SSL === 'true' 
    ? { rejectUnauthorized: false }
    : undefined;

const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, ssl })
    : new Pool({
        user: process.env.DB_USER || 'tu_usuario',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'partyaccess',
        password: process.env.DB_PASSWORD || 'tu_password',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        ssl
    });

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
    pool
};

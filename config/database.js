const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
    user: 'tu_usuario',
    host: 'localhost',
    database: 'partyaccess',
    password: 'tu_password',
    port: 5432,
});

// Función auxiliar para ejecutar queries
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
    const client = await pool.connect();
    return client;
}

module.exports = {
    query,
    getClient,
    pool
};

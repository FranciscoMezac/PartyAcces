const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function corregirRutasImagenes() {
    try {
        console.log('🔧 Corrigiendo rutas de imágenes...\n');
        
        const result = await pool.query(`
            UPDATE productos 
            SET image = REPLACE(image, '/public/', '/')
            WHERE image LIKE '/public/%'
            RETURNING "objectID", name, image
        `);
        
        console.log(`✅ Se actualizaron ${result.rowCount} productos:\n`);
        result.rows.forEach(row => {
            console.log(`- ${row.name}: ${row.image}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

corregirRutasImagenes();

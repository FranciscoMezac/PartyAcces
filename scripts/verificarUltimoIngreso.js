/**
 * Verificar último ingreso y estado del panel
 */

require('dotenv/config');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

async function verificar() {
    try {
        console.log('\n=== VERIFICACIÓN DE ÚLTIMO INGRESO ===\n');

        // 1. Hora actual del servidor PostgreSQL
        const serverTime = await pool.query(`
            SELECT 
                NOW() as utc_now,
                NOW() AT TIME ZONE 'America/Santiago' as chile_now,
                CURRENT_DATE as current_date,
                (NOW() AT TIME ZONE 'America/Santiago')::date as chile_date
        `);
        console.log('1. HORA DEL SERVIDOR:');
        console.table(serverTime.rows);

        // 2. Último ingreso registrado
        const ultimoIngreso = await pool.query(`
            SELECT 
                acceso_id,
                usuario_id,
                tipo_acceso,
                fecha_hora,
                fecha_hora AT TIME ZONE 'America/Santiago' as fecha_hora_chile,
                DATE(fecha_hora) as fecha_date,
                qr_referencia
            FROM acceso
            ORDER BY acceso_id DESC
            LIMIT 1
        `);
        console.log('\n2. ÚLTIMO ACCESO REGISTRADO:');
        console.table(ultimoIngreso.rows);

        // 3. Query exacta del panel (findIngresosHoy)
        const panelQuery = await pool.query(`
            SELECT 
                a.acceso_id,
                a.usuario_id,
                a.qr_referencia,
                a.fecha_hora,
                a.fecha_hora AT TIME ZONE 'America/Santiago' as fecha_hora_chile,
                a.tipo_acceso
             FROM (
                 SELECT DISTINCT ON (usuario_id)
                     acceso_id,
                     usuario_id,
                     qr_referencia,
                     fecha_hora,
                     tipo_acceso
                 FROM acceso
                 WHERE DATE(fecha_hora) = CURRENT_DATE
                 ORDER BY usuario_id, fecha_hora DESC
             ) a
             WHERE a.tipo_acceso = 'INGRESO'
             ORDER BY a.fecha_hora DESC
        `);
        console.log('\n3. USUARIOS EN EL PANEL (query exacta):');
        console.table(panelQuery.rows);
        console.log(`Total: ${panelQuery.rows.length} usuarios\n`);

        // 4. Verificar si hay accesos de hoy
        const accesosHoy = await pool.query(`
            SELECT COUNT(*) as total
            FROM acceso
            WHERE DATE(fecha_hora) = CURRENT_DATE
        `);
        console.log('4. ACCESOS DE HOY (CURRENT_DATE):');
        console.table(accesoHoy.rows);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

verificar();

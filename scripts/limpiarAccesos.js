// Script para limpiar la tabla de accesos
const db = require('../config/database');

async function limpiarAccesos() {
    try {
        console.log('Limpiando tabla de accesos...');
        
        // Eliminar todos los registros
        await db.query('DELETE FROM acceso');
        console.log('✅ Todos los accesos eliminados');
        
        // Reiniciar el contador de ID
        await db.query('ALTER SEQUENCE acceso_acceso_id_seq RESTART WITH 1');
        console.log('✅ Secuencia reiniciada');
        
        console.log('✅ Proceso completado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al limpiar accesos:', error);
        process.exit(1);
    }
}

limpiarAccesos();

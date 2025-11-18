/**
 * Script para ejecutar cierre de jornada manual
 * Uso: node scripts/forzarCierre.js
 */

const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/internal/accesos/cierre-jornada',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('Ejecutando cierre de jornada manual...\n');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const resultado = JSON.parse(data);
            console.log('Estado:', res.statusCode);
            console.log('Respuesta:', JSON.stringify(resultado, null, 2));
            
            if (resultado.success) {
                console.log('\n✓ Cierre ejecutado correctamente');
                console.log(`  - Usuarios procesados: ${resultado.data?.procesados || 0}`);
                console.log(`  - Total ingresos del día: ${resultado.data?.totalIngresos || 0}`);
                if (resultado.data?.historial) {
                    console.log(`  - Historial guardado: ID ${resultado.data.historial.cierreId}`);
                }
            } else {
                console.log('\n✗ Error en el cierre');
                console.log(`  - Mensaje: ${resultado.message || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error al parsear respuesta:', error);
            console.log('Respuesta cruda:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error al ejecutar cierre:', error.message);
    console.log('\nAsegúrate de que el servidor esté corriendo en localhost:3000');
});

req.end();

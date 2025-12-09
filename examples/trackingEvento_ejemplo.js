/**
 * Ejemplo de uso de la clase TrackingEvento
 * Demuestra cómo trabajar con objetos en lugar de datos primitivos
 */

const TrackingEvento = require('../models/TrackingEvento');

console.log('=== EJEMPLOS DE USO DE TrackingEvento ===\n');

// ============================================
// Ejemplo 1: Crear un evento de click básico
// ============================================
console.log('1. Crear evento de click básico:');
const eventoClick = new TrackingEvento({
  productoId: 101,
  tipoEvento: 'click',
  userToken: 'user_abc123',
  source: 'canjear-ui'
});

console.log('   Objeto creado:', eventoClick.toString());
console.log('   Tipo de evento:', eventoClick.tipoEvento);
console.log('   Producto ID:', eventoClick.productoId);
console.log('   ¿Es válido?', eventoClick.validar() ? 'SÍ' : 'NO');
console.log('');

// ============================================
// Ejemplo 2: Normalización automática de tipos
// ============================================
console.log('2. Normalización automática de tipos:');
const eventoSelect = new TrackingEvento({
  productoId: 202,
  eventType: 'select', // Se normaliza a 'click'
  userToken: 'user_xyz789'
});
console.log('   Tipo enviado: "select"');
console.log('   Tipo normalizado:', eventoSelect.tipoEvento); // 'click'

const eventoCanje = new TrackingEvento({
  productoId: 303,
  eventType: 'redeem', // Se normaliza a 'conversion'
  rut: '12345678-9',
  userToken: 'user_xyz789'
});
console.log('   Tipo enviado: "redeem"');
console.log('   Tipo normalizado:', eventoCanje.tipoEvento); // 'conversion'
console.log('');

// ============================================
// Ejemplo 3: Validación de eventos
// ============================================
console.log('3. Validación de eventos:');
try {
  const eventoInvalido = new TrackingEvento({
    tipoEvento: 'tipo_invalido',
    productoId: 404
  });
  eventoInvalido.validar();
  console.log('   ❌ No debería llegar aquí');
} catch (error) {
  console.log('   ✅ Error capturado:', error.message);
}

try {
  const eventoSinProducto = new TrackingEvento({
    tipoEvento: 'click'
    // Falta productoId y objectId
  });
  eventoSinProducto.validar();
  console.log('   ❌ No debería llegar aquí');
} catch (error) {
  console.log('   ✅ Error capturado:', error.message);
}
console.log('');

// ============================================
// Ejemplo 4: Conversión a formato de BD
// ============================================
console.log('4. Conversión a formato de BD:');
const eventoCompleto = new TrackingEvento({
  usuarioId: 5,
  rut: '19876543-2',
  userToken: 'user_token_abc',
  productoId: 505,
  objectId: 'prod_505_algolia',
  tipoEvento: 'view',
  source: 'home-page',
  metadata: { section: 'featured', position: 1 }
});

const dbData = eventoCompleto.toDatabase();
console.log('   Formato para BD:', JSON.stringify(dbData, null, 2));
console.log('');

// ============================================
// Ejemplo 5: Conversión a formato Algolia
// ============================================
console.log('5. Conversión a formato Algolia:');
const eventoParaAlgolia = new TrackingEvento({
  productoId: 606,
  objectId: 'prod_606',
  tipoEvento: 'conversion',
  userToken: 'user_final_abc',
  rut: '11222333-4'
});

const algoliaEvent = eventoParaAlgolia.toAlgoliaEvent('productos_index');
console.log('   Formato Algolia:', JSON.stringify(algoliaEvent, null, 2));
console.log('');

// ============================================
// Ejemplo 6: Crear desde datos de BD
// ============================================
console.log('6. Crear objeto desde datos de BD:');
const dbRow = {
  id: 999,
  usuario_id: 10,
  rut: '15555666-7',
  user_token: 'user_db_token',
  producto_id: 707,
  object_id: 'prod_707',
  tipo_evento: 'click',
  source: 'catalog',
  metadata: { category: 'electronics' },
  ocurrido_en: new Date('2025-12-09T10:30:00Z'),
  enviado_algolia: false
};

const eventoDesdeDB = TrackingEvento.fromDatabase(dbRow);
console.log('   Evento desde BD:', eventoDesdeDB.toString());
console.log('   ID del evento:', eventoDesdeDB.id);
console.log('   Usuario ID:', eventoDesdeDB.usuarioId);
console.log('   ¿Enviado a Algolia?', eventoDesdeDB.enviadoAlgolia);
console.log('');

// ============================================
// Ejemplo 7: Uso en el flujo completo
// ============================================
console.log('7. Simulación de flujo completo:');
console.log('   a) Cliente envía datos al servidor');
const payloadCliente = {
  eventType: 'click',
  productoId: 808,
  objectId: 'prod_808',
  userToken: 'user_flow_test',
  source: 'canjear-ui'
};
console.log('      Payload:', JSON.stringify(payloadCliente));

console.log('   b) Servidor crea objeto TrackingEvento');
const evento = new TrackingEvento(payloadCliente);
console.log('      Objeto:', evento.toString());

console.log('   c) Servidor valida el objeto');
try {
  evento.validar();
  console.log('      ✅ Validación exitosa');
} catch (error) {
  console.log('      ❌ Error de validación:', error.message);
}

console.log('   d) Repositorio convierte a formato BD');
const dataParaBD = evento.toDatabase();
console.log('      Campos BD:', Object.keys(dataParaBD).join(', '));

console.log('   e) Servicio convierte a formato Algolia');
const dataParaAlgolia = evento.toAlgoliaEvent('productos');
console.log('      Event type:', dataParaAlgolia.eventType);
console.log('      Event name:', dataParaAlgolia.eventName);

console.log('\n=== FIN DE EJEMPLOS ===');

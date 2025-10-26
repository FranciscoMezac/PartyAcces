const Producto = require('../models/Producto');

class ProductoRepository {
  constructor(db) { this.db = db; }

  async findById(client, id) {
    const r = await client.query(
      'SELECT id, nombre, puntos_requeridos, activo FROM productos WHERE id = $1 AND activo = TRUE',
      [id]
    );
    const row = r.rows[0];
    if (!row) return null;
    return new Producto({ id: row.id, nombre: row.nombre, puntosRequeridos: row.puntos_requeridos, activo: row.activo });
  }
}

module.exports = ProductoRepository;


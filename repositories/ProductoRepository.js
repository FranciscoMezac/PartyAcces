const Producto = require('../models/Producto');

class ProductoRepository {
  constructor(db) { this.db = db; }

  async findById(client, id) {
    const r = await client.query(
      'SELECT "objectID", name, price, activo FROM productos WHERE "objectID" = $1 AND activo = TRUE',
      [id]
    );
    const row = r.rows[0];
    if (!row) return null;
    return new Producto({ id: row.objectid, nombre: row.name, puntosRequeridos: row.price, activo: row.activo });
  }
}

module.exports = ProductoRepository;


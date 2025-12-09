const Producto = require('../models/Producto');

class ProductoRepository {
  constructor(db) { this.db = db; }

  async findById(client, id) {
    const executor = client || this.db;
    const r = await executor.query(
      'SELECT "objectID", name, price, activo FROM productos WHERE "objectID" = $1 AND activo = TRUE',
      [id]
    );
    const row = r.rows[0];
    if (!row) return null;
    return new Producto({ id: row.objectID, nombre: row.name, puntosRequeridos: row.price, activo: row.activo });
  }

  /**
   * Busca productos por array de IDs
   * @param {Array<number>} ids - Array de objectIDs
   * @param {Object} [client] - Cliente de transacción opcional
   * @returns {Promise<Array<Producto>>}
   */
  async findByIds(ids, client) {
    if (!ids || ids.length === 0) return [];
    
    const executor = client || this.db;
    
    // Verificar columnas dinámicamente
    const columnsQuery = await executor.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'productos' 
        AND column_name IN ('descripcion', 'image', 'image_url')
    `);
    
    const existingColumns = columnsQuery.rows.map(r => r.column_name);
    const hasDescripcion = existingColumns.includes('descripcion');
    const hasImage = existingColumns.includes('image');
    const hasImageUrl = existingColumns.includes('image_url');
    
    const imageColumn = hasImage ? 'image' : (hasImageUrl ? 'image_url' : null);
    
    const fields = [
      '"objectID"::text AS "objectID"',
      'name',
      hasDescripcion ? 'descripcion' : "NULL::text AS descripcion",
      'price',
      imageColumn ? `${imageColumn} AS image` : "NULL::text AS image"
    ].join(', ');

    const { rows } = await executor.query(
      `SELECT ${fields} FROM productos WHERE "objectID" = ANY($1::int[])`,
      [ids]
    );
    
    return rows.map(row => new Producto({
      id: row.objectID,
      nombre: row.name,
      descripcion: row.descripcion,
      puntosRequeridos: row.price,
      image: row.image
    }, this));
  }
}

module.exports = ProductoRepository;


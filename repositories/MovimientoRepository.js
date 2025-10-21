class MovimientoRepository {
  constructor(db) { this.db = db; }

  async crear(client, movimiento) {
    await client.query(
      `INSERT INTO movimientos (rut, tipo, monto, puntos, fecha)
       VALUES ($1, $2, $3, $4, $5)`,
      [movimiento.rut, movimiento.tipo, movimiento.monto, movimiento.puntos, movimiento.fecha]
    );
  }

  async findByRutPaginated(rut, { page = 1, limit = 10 } = {}) {
    const p = Number(page) > 0 ? Number(page) : 1;
    const l = Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
    const offset = (p - 1) * l;
    const data = await this.db.query(
      `SELECT fecha, tipo, monto, puntos FROM movimientos
       WHERE rut = $1 ORDER BY fecha DESC LIMIT $2 OFFSET $3`,
      [rut, l, offset]
    );
    const tot = await this.db.query(
      'SELECT COUNT(*)::int AS total FROM movimientos WHERE rut = $1',
      [rut]
    );
    return { items: data.rows, page: p, limit: l, total: tot.rows[0].total };
  }
}

module.exports = MovimientoRepository;


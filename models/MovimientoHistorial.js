class MovimientoHistorial {
  #db; #rut;

  constructor({ db, rut }) {
    this.#db = db;
    this.#rut = rut;
  }

  get rut() { return this.#rut; }

  async listar({ page = 1, limit = 10 } = {}) {
    const p = Number(page) > 0 ? Number(page) : 1;
    const l = Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
    const offset = (p - 1) * l;

    const data = await this.#db.query(
      `SELECT fecha, tipo, monto, puntos
       FROM movimientos
       WHERE rut = $1
       ORDER BY fecha DESC
       LIMIT $2 OFFSET $3`,
      [this.#rut, l, offset]
    );

    // opcional: total para paginación
    const tot = await this.#db.query(
      'SELECT COUNT(*)::int AS total FROM movimientos WHERE rut = $1',
      [this.#rut]
    );

    return { items: data.rows, page: p, limit: l, total: tot.rows[0].total };
  }
}

module.exports = MovimientoHistorial;


class Producto {
  #id; #nombre; #puntosRequeridos; #activo; #client;

  constructor({ id, client }) {
    this.#id = Number(id);
    this.#client = client;
    this.#nombre = undefined;
    this.#puntosRequeridos = undefined;
    this.#activo = undefined;
  }

  get id() { return this.#id; }
  get nombre() { return this.#nombre; }
  get puntosRequeridos() { return this.#puntosRequeridos; }
  get activo() { return this.#activo; }

  async load() {
    const r = await this.#client.query(
      'SELECT id, nombre, puntos_requeridos, activo FROM productos WHERE id = $1 AND activo = TRUE',
      [this.#id]
    );
    const row = r.rows[0];
    if (!row) {
      const err = new Error('Producto no encontrado o inactivo');
      err.code = 'PRODUCTO_NO_ENCONTRADO';
      throw err;
    }
    this.#nombre = row.nombre;
    this.#puntosRequeridos = Number(row.puntos_requeridos);
    this.#activo = !!row.activo;
    return this;
  }
}

module.exports = Producto;


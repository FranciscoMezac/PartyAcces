class Producto {
  #id; #nombre; #puntosRequeridos; #activo;

  constructor({ id, nombre, puntosRequeridos, activo = true }) {
    this.#id = Number(id);
    this.#nombre = nombre;
    this.#puntosRequeridos = Number(puntosRequeridos);
    this.#activo = !!activo;
  }

  get id() { return this.#id; }
  get nombre() { return this.#nombre; }
  get puntosRequeridos() { return this.#puntosRequeridos; }
  get activo() { return this.#activo; }

  getCostoEnPuntos() {
    return this.#puntosRequeridos;
  }

  // Alias del diagrama: costoEnPuntos()
  costoEnPuntos() {
    return this.getCostoEnPuntos();
  }

  // Alias del diagrama: cargarPorId() usando el repository
  async cargarPorId(repo, client) {
    const p = await repo.findById(client, this.#id);
    if (!p) {
      const err = new Error('Producto no encontrado o inactivo');
      err.code = 'PRODUCTO_NO_ENCONTRADO';
      throw err;
    }
    this.#nombre = p.nombre;
    this.#puntosRequeridos = p.puntosRequeridos;
    this.#activo = p.activo;
    return this;
  }
}

module.exports = Producto;
